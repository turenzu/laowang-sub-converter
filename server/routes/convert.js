import express from 'express'
import { parseSubscription, addEmoji } from '../utils/parsers.js'
import { convertToTarget } from '../utils/converters.js'

const router = express.Router()

const SUPPORTED_CLIENTS = {
    clash: 'clash',
    clashmeta: 'clashmeta',
    surge: 'surge',
    quantumultx: 'quantumultx',
    shadowrocket: 'shadowrocket',
    loon: 'loon',
    v2rayn: 'v2rayn',
    v2rayng: 'v2rayng',
    nekobox: 'nekobox',
    surfboard: 'surfboard',
    stash: 'stash',
    singbox: 'singbox'
}

// 订阅转换接口
router.get('/', async (req, res) => {
    try {
        const {
            target,
            url,
            emoji = '1',
            udp = '1',
            scert = '0',
            sort = '0',
            include = '',
            exclude = '',
            rename = '',
            rulePreset = ''
        } = req.query

        // 参数验证
        if (!target || !SUPPORTED_CLIENTS[target]) {
            return res.status(400).json({
                error: 'Invalid target client',
                supported: Object.keys(SUPPORTED_CLIENTS)
            })
        }

        if (!url) {
            return res.status(400).json({ error: 'Subscription URL is required' })
        }

        // 解码订阅链接
        const subscriptionUrl = decodeURIComponent(url)

        // 获取原始订阅内容
        const response = await fetch(subscriptionUrl, {
            headers: {
                'User-Agent': 'LaoWang-Sub-Converter/1.0'
            }
        })

        if (!response.ok) {
            return res.status(502).json({ error: 'Failed to fetch subscription' })
        }

        const rawContent = await response.text()

        // 解析订阅内容
        let nodes = parseSubscription(rawContent)

        // 应用过滤规则
        if (include) {
            const keywords = include.split('|')
            nodes = nodes.filter(node =>
                keywords.some(kw => node.name.includes(kw))
            )
        }

        if (exclude) {
            const keywords = exclude.split('|')
            nodes = nodes.filter(node =>
                !keywords.some(kw => node.name.includes(kw))
            )
        }

        // 排序
        if (sort === '1') {
            nodes.sort((a, b) => a.name.localeCompare(b.name))
        }

        // 添加 Emoji
        if (emoji === '1') {
            nodes = nodes.map(node => ({
                ...node,
                name: addEmoji(node.name)
            }))
        }

        // 重命名
        if (rename) {
            const rules = rename.split('\n').filter(r => r.includes('->'))
            nodes = nodes.map(node => {
                let newName = node.name
                for (const rule of rules) {
                    const [from, to] = rule.split('->')
                    newName = newName.replace(new RegExp(from.trim(), 'g'), to.trim())
                }
                return { ...node, name: newName }
            })
        }

        // 转换为目标格式
        const output = convertToTarget(nodes, target, {
            udp: udp === '1',
            skipCert: scert === '1',
            rulePreset
        })

        // 设置响应头
        const contentTypes = {
            clash: 'text/yaml',
            clashmeta: 'text/yaml',
            surge: 'text/plain',
            quantumultx: 'text/plain',
            shadowrocket: 'text/plain',
            loon: 'text/plain',
            v2rayn: 'text/plain',
            v2rayng: 'text/plain',
            surfboard: 'text/plain',
            stash: 'text/yaml',
            singbox: 'application/json'
        }

        // 确定文件扩展名
        let extension = 'txt'
        if (target === 'singbox') {
            extension = 'json'
        } else if (['clash', 'clashmeta', 'stash'].includes(target)) {
            extension = 'yaml'
        } else if (['surge', 'loon', 'surfboard'].includes(target)) {
            extension = 'conf'
        }

        res.setHeader('Content-Type', contentTypes[target] || 'text/plain')
        res.setHeader('Content-Disposition', `attachment; filename="config.${extension}"`)
        res.send(output)

    } catch (error) {
        console.error('Conversion error:', error)
        res.status(500).json({ error: 'Conversion failed', message: error.message })
    }
})

export default router
