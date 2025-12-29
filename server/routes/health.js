import express from 'express'
import { parseSubscription } from '../utils/parsers.js'
import net from 'net'

const router = express.Router()

// 测试节点连接性
async function testNodeConnection(server, port, timeout = 5000) {
    return new Promise((resolve) => {
        const startTime = Date.now()
        const socket = new net.Socket()

        socket.setTimeout(timeout)

        socket.on('connect', () => {
            const latency = Date.now() - startTime
            socket.destroy()
            resolve({ success: true, latency })
        })

        socket.on('timeout', () => {
            socket.destroy()
            resolve({ success: false, latency: -1, error: 'timeout' })
        })

        socket.on('error', (err) => {
            socket.destroy()
            resolve({ success: false, latency: -1, error: err.message })
        })

        try {
            socket.connect(port, server)
        } catch (err) {
            resolve({ success: false, latency: -1, error: err.message })
        }
    })
}

// 批量健康检测接口
router.post('/check', async (req, res) => {
    try {
        const { url, nodes: directNodes, timeout = 5000, concurrent = 10 } = req.body

        let nodes = []

        // 如果提供了订阅 URL，先解析
        if (url) {
            try {
                const response = await fetch(url, {
                    headers: { 'User-Agent': 'LaoWang-Sub-Converter/1.0' }
                })

                if (!response.ok) {
                    return res.status(502).json({ error: 'Failed to fetch subscription' })
                }

                const content = await response.text()
                nodes = parseSubscription(content)
            } catch (e) {
                return res.status(400).json({ error: 'Failed to parse subscription: ' + e.message })
            }
        } else if (directNodes && Array.isArray(directNodes)) {
            nodes = directNodes
        } else {
            return res.status(400).json({ error: 'Either url or nodes array is required' })
        }

        if (nodes.length === 0) {
            return res.json({ nodes: [], summary: { total: 0, online: 0, offline: 0, avgLatency: 0 } })
        }

        // 并发测试节点
        const results = []
        const batchSize = Math.min(concurrent, 20) // 最大并发 20

        for (let i = 0; i < nodes.length; i += batchSize) {
            const batch = nodes.slice(i, i + batchSize)
            const batchResults = await Promise.all(
                batch.map(async (node) => {
                    const result = await testNodeConnection(node.server, node.port, timeout)
                    return {
                        name: node.name,
                        server: node.server,
                        port: node.port,
                        type: node.type,
                        status: result.success ? 'online' : 'offline',
                        latency: result.latency,
                        error: result.error || null
                    }
                })
            )
            results.push(...batchResults)
        }

        // 计算统计信息
        const onlineNodes = results.filter(n => n.status === 'online')
        const avgLatency = onlineNodes.length > 0
            ? Math.round(onlineNodes.reduce((sum, n) => sum + n.latency, 0) / onlineNodes.length)
            : 0

        // 按延迟排序
        results.sort((a, b) => {
            if (a.status === 'online' && b.status !== 'online') return -1
            if (a.status !== 'online' && b.status === 'online') return 1
            return a.latency - b.latency
        })

        res.json({
            nodes: results,
            summary: {
                total: results.length,
                online: onlineNodes.length,
                offline: results.length - onlineNodes.length,
                avgLatency,
                minLatency: onlineNodes.length > 0 ? Math.min(...onlineNodes.map(n => n.latency)) : 0,
                maxLatency: onlineNodes.length > 0 ? Math.max(...onlineNodes.map(n => n.latency)) : 0
            }
        })

    } catch (error) {
        console.error('Health check error:', error)
        res.status(500).json({ error: 'Health check failed: ' + error.message })
    }
})

// 单节点快速检测
router.get('/ping', async (req, res) => {
    const { server, port, timeout = 3000 } = req.query

    if (!server || !port) {
        return res.status(400).json({ error: 'Server and port are required' })
    }

    const result = await testNodeConnection(server, parseInt(port), parseInt(timeout))
    res.json(result)
})

export default router
