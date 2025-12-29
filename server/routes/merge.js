import express from 'express'
import { parseSubscription, addEmoji } from '../utils/parsers.js'
import { convertToTarget } from '../utils/converters.js'

const router = express.Router()

// 合并多个订阅
router.post('/', async (req, res) => {
    try {
        const {
            urls,           // 订阅 URL 数组
            target,         // 目标客户端
            dedupe = true,  // 是否去重
            emoji = true,   // 是否添加 emoji
            sort = false,   // 是否排序
            udp = true,
            skipCert = false,
            include = '',   // 包含关键词
            exclude = '',   // 排除关键词
            rename = ''     // 重命名规则
        } = req.body

        if (!urls || !Array.isArray(urls) || urls.length === 0) {
            return res.status(400).json({ error: 'urls array is required' })
        }

        if (!target) {
            return res.status(400).json({ error: 'target client is required' })
        }

        // 并发获取所有订阅
        const fetchPromises = urls.map(async (url, index) => {
            try {
                const response = await fetch(url, {
                    headers: { 'User-Agent': 'LaoWang-Sub-Converter/1.0' },
                    timeout: 10000
                })

                if (!response.ok) {
                    console.warn(`Failed to fetch subscription ${index + 1}: ${response.status}`)
                    return { success: false, url, error: `HTTP ${response.status}` }
                }

                const content = await response.text()
                const nodes = parseSubscription(content)
                return { success: true, url, nodes, count: nodes.length }
            } catch (e) {
                console.warn(`Error fetching subscription ${index + 1}:`, e.message)
                return { success: false, url, error: e.message }
            }
        })

        const results = await Promise.all(fetchPromises)

        // 合并所有节点
        let allNodes = []
        const fetchSummary = results.map((r, i) => ({
            index: i + 1,
            url: r.url.substring(0, 50) + (r.url.length > 50 ? '...' : ''),
            success: r.success,
            count: r.count || 0,
            error: r.error || null
        }))

        for (const result of results) {
            if (result.success && result.nodes) {
                allNodes.push(...result.nodes)
            }
        }

        // 去重 (基于 server:port 组合)
        if (dedupe) {
            const seen = new Set()
            allNodes = allNodes.filter(node => {
                const key = `${node.server}:${node.port}`
                if (seen.has(key)) {
                    return false
                }
                seen.add(key)
                return true
            })
        }

        // 过滤节点
        if (include) {
            const keywords = include.split('|')
            allNodes = allNodes.filter(node =>
                keywords.some(kw => node.name.includes(kw))
            )
        }

        if (exclude) {
            const keywords = exclude.split('|')
            allNodes = allNodes.filter(node =>
                !keywords.some(kw => node.name.includes(kw))
            )
        }

        // 重命名
        if (rename) {
            const rules = rename.split('\n').filter(Boolean)
            for (const rule of rules) {
                const [from, to] = rule.split('->')
                if (from && to !== undefined) {
                    allNodes = allNodes.map(node => ({
                        ...node,
                        name: node.name.replace(from.trim(), to.trim())
                    }))
                }
            }
        }

        // 添加 Emoji
        if (emoji) {
            allNodes = allNodes.map(node => ({
                ...node,
                name: addEmoji(node.name)
            }))
        }

        // 排序
        if (sort) {
            allNodes.sort((a, b) => a.name.localeCompare(b.name))
        }

        // 转换为目标格式
        const output = convertToTarget(allNodes, target, { udp, skipCert })

        // 设置响应头
        const contentTypes = {
            clash: 'text/yaml',
            clashmeta: 'text/yaml',
            stash: 'text/yaml',
            singbox: 'application/json',
            nekobox: 'application/json'
        }

        res.setHeader('Content-Type', contentTypes[target] || 'text/plain')
        res.setHeader('Content-Disposition', `attachment; filename="merged-${target}.${target === 'singbox' || target === 'nekobox' ? 'json' : target.includes('clash') ? 'yaml' : 'txt'}"`)

        // 如果请求 JSON 格式的响应
        if (req.query.format === 'json') {
            return res.json({
                success: true,
                summary: {
                    totalSubscriptions: urls.length,
                    successfulFetches: results.filter(r => r.success).length,
                    failedFetches: results.filter(r => !r.success).length,
                    totalNodes: allNodes.length,
                    deduped: dedupe
                },
                subscriptions: fetchSummary,
                output
            })
        }

        res.send(output)

    } catch (error) {
        console.error('Merge error:', error)
        res.status(500).json({ error: 'Merge failed: ' + error.message })
    }
})

// 获取合并预览 (只返回节点列表，不转换)
router.post('/preview', async (req, res) => {
    try {
        const { urls, dedupe = true } = req.body

        if (!urls || !Array.isArray(urls) || urls.length === 0) {
            return res.status(400).json({ error: 'urls array is required' })
        }

        // 并发获取所有订阅
        const fetchPromises = urls.map(async (url) => {
            try {
                const response = await fetch(url, {
                    headers: { 'User-Agent': 'LaoWang-Sub-Converter/1.0' }
                })

                if (!response.ok) return { success: false, nodes: [] }

                const content = await response.text()
                return { success: true, nodes: parseSubscription(content) }
            } catch (e) {
                return { success: false, nodes: [] }
            }
        })

        const results = await Promise.all(fetchPromises)

        // 合并节点
        let allNodes = results.flatMap(r => r.nodes)

        // 去重
        if (dedupe) {
            const seen = new Set()
            allNodes = allNodes.filter(node => {
                const key = `${node.server}:${node.port}`
                if (seen.has(key)) return false
                seen.add(key)
                return true
            })
        }

        // 按类型分组统计
        const byType = {}
        for (const node of allNodes) {
            byType[node.type] = (byType[node.type] || 0) + 1
        }

        res.json({
            total: allNodes.length,
            byType,
            nodes: allNodes.map(n => ({
                name: n.name,
                type: n.type,
                server: n.server,
                port: n.port
            }))
        })

    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

export default router
