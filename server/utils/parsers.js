import { Buffer } from 'buffer'

// 解析订阅内容
export function parseSubscription(content) {
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

// SS 解析 - 支持多种格式
function parseSS(uri) {
    try {
        // 格式1: ss://base64@server:port#name (SIP002)
        // 格式2: ss://base64#name (旧格式，整体 base64 编码)

        const hashIndex = uri.indexOf('#')
        const name = hashIndex > -1 ? decodeURIComponent(uri.slice(hashIndex + 1)) : 'SS Node'
        const uriWithoutHash = hashIndex > -1 ? uri.slice(0, hashIndex) : uri

        // 尝试 SIP002 格式解析
        try {
            const url = new URL(uriWithoutHash)
            if (url.username && url.hostname && url.port) {
                // base64@server:port 格式
                const decoded = Buffer.from(decodeURIComponent(url.username), 'base64').toString()
                const [method, password] = decoded.split(':')

                if (method && password) {
                    return {
                        type: 'ss',
                        name,
                        server: url.hostname,
                        port: parseInt(url.port),
                        method,
                        password
                    }
                }
            }
        } catch (e) {
            // SIP002 解析失败，尝试旧格式
        }

        // 尝试旧格式: ss://base64编码的(method:password@server:port)
        const base64Part = uriWithoutHash.slice(5) // 去掉 "ss://"
        const decoded = Buffer.from(base64Part, 'base64').toString()

        // 解析 method:password@server:port
        const atIndex = decoded.lastIndexOf('@')
        if (atIndex > -1) {
            const [methodPassword, serverPort] = [decoded.slice(0, atIndex), decoded.slice(atIndex + 1)]
            const colonIndex = methodPassword.indexOf(':')
            const lastColonIndex = serverPort.lastIndexOf(':')

            if (colonIndex > -1 && lastColonIndex > -1) {
                const method = methodPassword.slice(0, colonIndex)
                const password = methodPassword.slice(colonIndex + 1)
                const server = serverPort.slice(0, lastColonIndex)
                const port = parseInt(serverPort.slice(lastColonIndex + 1))

                return {
                    type: 'ss',
                    name,
                    server,
                    port,
                    method,
                    password
                }
            }
        }

        return null
    } catch (e) {
        console.error('SS parse error:', e.message)
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
        const params = url.searchParams
        return {
            type: 'vless',
            name: decodeURIComponent(url.hash.slice(1)) || 'VLESS Node',
            server: url.hostname,
            port: parseInt(url.port),
            uuid: url.username,
            flow: params.get('flow') || '',
            network: params.get('type') || 'tcp',
            tls: params.get('security') === 'tls' || params.get('tls') === '1',
            ws: params.get('type') === 'ws' ? {
                path: params.get('path') || '/',
                headers: params.get('host') ? { Host: params.get('host') } : {}
            } : null,
            grpc: params.get('type') === 'grpc' ? {
                serviceName: params.get('serviceName') || ''
            } : null,
            reality: params.get('security') === 'reality' ? {
                publicKey: params.get('pbk') || '',
                shortId: params.get('sid') || '',
                sni: params.get('sni') || ''
            } : null
        }
    } catch (e) {
        return null
    }
}

// Trojan 解析
function parseTrojan(uri) {
    try {
        const url = new URL(uri)
        const params = url.searchParams
        return {
            type: 'trojan',
            name: decodeURIComponent(url.hash.slice(1)) || 'Trojan Node',
            server: url.hostname,
            port: parseInt(url.port),
            password: url.username,
            sni: params.get('sni') || params.get('peer') || url.hostname,
            alpn: params.get('alpn') ? params.get('alpn').split(',') : []
        }
    } catch (e) {
        return null
    }
}

// 添加 Emoji
export function addEmoji(name) {
    const emojiMap = {
        '香港': '🇭🇰', 'HK': '🇭🇰',
        '台湾': '🇹🇼', 'TW': '🇹🇼',
        '日本': '🇯🇵', 'JP': '🇯🇵',
        '新加坡': '🇸🇬', 'SG': '🇸🇬',
        '美国': '🇺🇸', 'US': '🇺🇸',
        '韩国': '🇰🇷', 'KR': '🇰🇷',
        '英国': '🇬🇧', 'UK': '🇬🇧',
        '德国': '🇩🇪', 'DE': '🇩🇪',
        '法国': '🇫🇷', 'FR': '🇫🇷',
        '俄罗斯': '🇷🇺', 'RU': '🇷🇺'
    }

    for (const [key, emoji] of Object.entries(emojiMap)) {
        if (name.includes(key)) {
            return `${emoji} ${name}`
        }
    }
    return `🌐 ${name}`
}
