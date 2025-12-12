const express = require('express')
const router = express.Router()

// 支持的客户端列表
const SUPPORTED_CLIENTS = {
    clash: 'clash',
    clashmeta: 'clashmeta',
    surge: 'surge',
    quantumultx: 'quantumultx',
    shadowrocket: 'shadowrocket',
    loon: 'loon',
    v2rayn: 'v2rayn',
    v2rayng: 'v2rayng',
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
            rename = ''
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
        const nodes = parseSubscription(rawContent)

        // 应用过滤规则
        let filteredNodes = nodes

        if (include) {
            const keywords = include.split('|')
            filteredNodes = filteredNodes.filter(node =>
                keywords.some(kw => node.name.includes(kw))
            )
        }

        if (exclude) {
            const keywords = exclude.split('|')
            filteredNodes = filteredNodes.filter(node =>
                !keywords.some(kw => node.name.includes(kw))
            )
        }

        // 排序
        if (sort === '1') {
            filteredNodes.sort((a, b) => a.name.localeCompare(b.name))
        }

        // 添加 Emoji
        if (emoji === '1') {
            filteredNodes = filteredNodes.map(node => ({
                ...node,
                name: addEmoji(node.name)
            }))
        }

        // 重命名
        if (rename) {
            const rules = rename.split('\n').filter(r => r.includes('->'))
            filteredNodes = filteredNodes.map(node => {
                let newName = node.name
                for (const rule of rules) {
                    const [from, to] = rule.split('->')
                    newName = newName.replace(new RegExp(from.trim(), 'g'), to.trim())
                }
                return { ...node, name: newName }
            })
        }

        // 转换为目标格式
        const output = convertToTarget(filteredNodes, target, {
            udp: udp === '1',
            skipCert: scert === '1'
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

        res.setHeader('Content-Type', contentTypes[target] || 'text/plain')
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

// 解析订阅内容
function parseSubscription(content) {
    const nodes = []

    // 尝试 Base64 解码
    try {
        const decoded = Buffer.from(content, 'base64').toString('utf-8')
        if (decoded.includes('://')) {
            content = decoded
        }
    } catch (e) {
        // 不是 Base64 格式，使用原始内容
    }

    // 解析节点链接
    const lines = content.split('\n').filter(line => line.trim())

    for (const line of lines) {
        const trimmed = line.trim()

        if (trimmed.startsWith('ss://')) {
            const node = parseSS(trimmed)
            if (node) nodes.push(node)
        } else if (trimmed.startsWith('vmess://')) {
            const node = parseVmess(trimmed)
            if (node) nodes.push(node)
        } else if (trimmed.startsWith('vless://')) {
            const node = parseVless(trimmed)
            if (node) nodes.push(node)
        } else if (trimmed.startsWith('trojan://')) {
            const node = parseTrojan(trimmed)
            if (node) nodes.push(node)
        }
    }

    return nodes
}

// SS 解析
function parseSS(uri) {
    try {
        const url = new URL(uri)
        const name = decodeURIComponent(url.hash.slice(1)) || 'SS Node'
        const [method, password] = Buffer.from(url.username, 'base64').toString().split(':')

        return {
            type: 'ss',
            name,
            server: url.hostname,
            port: parseInt(url.port),
            method,
            password
        }
    } catch (e) {
        return null
    }
}

// VMess 解析
function parseVmess(uri) {
    try {
        const data = JSON.parse(Buffer.from(uri.slice(8), 'base64').toString())
        return {
            type: 'vmess',
            name: data.ps || 'VMess Node',
            server: data.add,
            port: parseInt(data.port),
            uuid: data.id,
            alterId: parseInt(data.aid) || 0,
            network: data.net || 'tcp',
            tls: data.tls === 'tls',
            ws: data.net === 'ws' ? {
                path: data.path || '/',
                headers: data.host ? { Host: data.host } : {}
            } : null
        }
    } catch (e) {
        return null
    }
}

// VLESS 解析
function parseVless(uri) {
    try {
        const url = new URL(uri)
        return {
            type: 'vless',
            name: decodeURIComponent(url.hash.slice(1)) || 'VLESS Node',
            server: url.hostname,
            port: parseInt(url.port),
            uuid: url.username,
            flow: url.searchParams.get('flow') || '',
            network: url.searchParams.get('type') || 'tcp',
            tls: url.searchParams.get('security') === 'tls'
        }
    } catch (e) {
        return null
    }
}

// Trojan 解析
function parseTrojan(uri) {
    try {
        const url = new URL(uri)
        return {
            type: 'trojan',
            name: decodeURIComponent(url.hash.slice(1)) || 'Trojan Node',
            server: url.hostname,
            port: parseInt(url.port),
            password: url.username,
            sni: url.searchParams.get('sni') || url.hostname
        }
    } catch (e) {
        return null
    }
}

// 添加 Emoji
function addEmoji(name) {
    const emojiMap = {
        '香港': '🇭🇰',
        'HK': '🇭🇰',
        '台湾': '🇹🇼',
        'TW': '🇹🇼',
        '日本': '🇯🇵',
        'JP': '🇯🇵',
        '新加坡': '🇸🇬',
        'SG': '🇸🇬',
        '美国': '🇺🇸',
        'US': '🇺🇸',
        '韩国': '🇰🇷',
        'KR': '🇰🇷',
        '英国': '🇬🇧',
        'UK': '🇬🇧',
        '德国': '🇩🇪',
        'DE': '🇩🇪',
        '法国': '🇫🇷',
        'FR': '🇫🇷',
        '俄罗斯': '🇷🇺',
        'RU': '🇷🇺'
    }

    for (const [key, emoji] of Object.entries(emojiMap)) {
        if (name.includes(key)) {
            return `${emoji} ${name}`
        }
    }
    return `🌐 ${name}`
}

// 转换为目标格式
function convertToTarget(nodes, target, options) {
    switch (target) {
        case 'clash':
        case 'clashmeta':
        case 'stash':
            return convertToClash(nodes, options)
        case 'surge':
            return convertToSurge(nodes, options)
        case 'quantumultx':
            return convertToQuantumultX(nodes, options)
        case 'shadowrocket':
        case 'v2rayn':
        case 'v2rayng':
            return convertToBase64(nodes)
        case 'loon':
            return convertToLoon(nodes, options)
        case 'singbox':
            return convertToSingBox(nodes, options)
        default:
            return ''
    }
}

// ... (Clash conversion remains same)

function convertToBase64(nodes) {
    const links = nodes.map(node => {
        switch (node.type) {
            case 'ss':
                const ssAuth = Buffer.from(`${node.method}:${node.password}`).toString('base64')
                return `ss://${ssAuth}@${node.server}:${node.port}#${encodeURIComponent(node.name)}`
            case 'vmess':
                const vmessData = {
                    v: '2',
                    ps: node.name,
                    add: node.server,
                    port: node.port,
                    id: node.uuid,
                    aid: node.alterId,
                    net: node.network,
                    type: 'none',
                    host: '',
                    path: '',
                    tls: node.tls ? 'tls' : ''
                }

                if (node.ws) {
                    vmessData.path = node.ws.path
                    if (node.ws.headers && node.ws.headers.Host) {
                        vmessData.host = node.ws.headers.Host
                    }
                }

                return `vmess://${Buffer.from(JSON.stringify(vmessData)).toString('base64')}`
            case 'trojan':
                return `trojan://${node.password}@${node.server}:${node.port}?peer=${encodeURIComponent(node.sni || node.server)}#${encodeURIComponent(node.name)}`
            default:
                return ''
        }
    }).filter(Boolean)

    return Buffer.from(links.join('\n')).toString('base64')
}

function convertToSingBox(nodes, options) {
    const outbounds = nodes.map(node => {
        const base = {
            tag: node.name,
            server: node.server,
            server_port: node.port
        }

        switch (node.type) {
            case 'ss':
                return { ...base, type: 'shadowsocks', method: node.method, password: node.password }
            case 'vmess':
                const vmess = {
                    ...base,
                    type: 'vmess',
                    uuid: node.uuid,
                    alter_id: node.alterId,
                    security: 'auto'
                }

                if (node.tls) {
                    vmess.tls = {
                        enabled: true,
                        server_name: node.ws?.headers?.Host || node.server,
                        insecure: options.skipCert
                    }
                }

                if (node.network === 'ws' && node.ws) {
                    vmess.transport = {
                        type: 'ws',
                        path: node.ws.path,
                        headers: node.ws.headers
                    }
                }

                return vmess
            case 'trojan':
                const trojan = { ...base, type: 'trojan', password: node.password }
                if (node.sni) {
                    trojan.tls = {
                        enabled: true,
                        server_name: node.sni,
                        insecure: options.skipCert
                    }
                }
                return trojan
            default:
                return base
        }
    })

    return JSON.stringify({
        outbounds: [
            { tag: 'proxy', type: 'selector', outbounds: nodes.map(n => n.name) },
            ...outbounds,
            { tag: 'direct', type: 'direct' }
        ]
    }, null, 2)
}

module.exports = router
