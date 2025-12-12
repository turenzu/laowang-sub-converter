// Cloudflare Workers - Subscription Converter API
// Uses Web Standard APIs (no Node.js Buffer)

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

// Base64 helper functions (Web API compatible)
function base64Decode(str) {
    try {
        return atob(str)
    } catch (e) {
        return str
    }
}

function base64Encode(str) {
    return btoa(str)
}

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url)

        // Handle CORS preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type'
                }
            })
        }

        // Route handling
        if (url.pathname === '/api/convert' || url.pathname === '/convert') {
            return handleConvert(request, url)
        }

        // Serve static files or return 404
        return new Response('LaoWang Sub-converter API\n\nUsage: /api/convert?target=clash&url=<subscription_url>', {
            headers: { 'Content-Type': 'text/plain' }
        })
    }
}

async function handleConvert(request, url) {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
    }

    try {
        const target = url.searchParams.get('target')
        const subUrl = url.searchParams.get('url')
        const emoji = url.searchParams.get('emoji') ?? '1'
        const udp = url.searchParams.get('udp') ?? '1'
        const scert = url.searchParams.get('scert') ?? '0'
        const sort = url.searchParams.get('sort') ?? '0'
        const include = url.searchParams.get('include') ?? ''
        const exclude = url.searchParams.get('exclude') ?? ''
        const rename = url.searchParams.get('rename') ?? ''

        // Validate parameters
        if (!target || !SUPPORTED_CLIENTS[target]) {
            return new Response(JSON.stringify({
                error: 'Invalid target client',
                supported: Object.keys(SUPPORTED_CLIENTS)
            }), {
                status: 400,
                headers: { ...headers, 'Content-Type': 'application/json' }
            })
        }

        if (!subUrl) {
            return new Response(JSON.stringify({ error: 'Subscription URL is required' }), {
                status: 400,
                headers: { ...headers, 'Content-Type': 'application/json' }
            })
        }

        // Fetch subscription
        const subscriptionUrl = decodeURIComponent(subUrl)
        const response = await fetch(subscriptionUrl, {
            headers: { 'User-Agent': 'LaoWang-Sub-Converter/1.0' }
        })

        if (!response.ok) {
            return new Response(JSON.stringify({ error: 'Failed to fetch subscription' }), {
                status: 502,
                headers: { ...headers, 'Content-Type': 'application/json' }
            })
        }

        const rawContent = await response.text()

        // Parse subscription
        let nodes = parseSubscription(rawContent)

        // Apply filters
        if (include) {
            const keywords = include.split('|')
            nodes = nodes.filter(node => keywords.some(kw => node.name.includes(kw)))
        }

        if (exclude) {
            const keywords = exclude.split('|')
            nodes = nodes.filter(node => !keywords.some(kw => node.name.includes(kw)))
        }

        // Sort
        if (sort === '1') {
            nodes.sort((a, b) => a.name.localeCompare(b.name))
        }

        // Add emoji
        if (emoji === '1') {
            nodes = nodes.map(node => ({ ...node, name: addEmoji(node.name) }))
        }

        // Rename
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

        // Convert to target format
        const output = convertToTarget(nodes, target, {
            udp: udp === '1',
            skipCert: scert === '1'
        })

        // Set content type
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

        return new Response(output, {
            headers: {
                ...headers,
                'Content-Type': contentTypes[target] || 'text/plain',
                'Content-Disposition': `attachment; filename="config.${target === 'singbox' ? 'json' :
                    ['clash', 'clashmeta', 'stash'].includes(target) ? 'yaml' :
                        ['surge', 'loon', 'surfboard'].includes(target) ? 'conf' : 'txt'
                    }"`
            }
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: 'Conversion failed', message: error.message }), {
            status: 500,
            headers: { ...headers, 'Content-Type': 'application/json' }
        })
    }
}

function parseSubscription(content) {
    const nodes = []

    // Try Base64 decode
    try {
        const decoded = base64Decode(content)
        if (decoded.includes('://')) {
            content = decoded
        }
    } catch (e) { }

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

function parseSS(uri) {
    try {
        const url = new URL(uri)
        const name = decodeURIComponent(url.hash.slice(1)) || 'SS Node'
        const [method, password] = base64Decode(url.username).split(':')

        return {
            type: 'ss', name,
            server: url.hostname,
            port: parseInt(url.port),
            method, password
        }
    } catch (e) {
        return null
    }
}

function parseVmess(uri) {
    try {
        const data = JSON.parse(base64Decode(uri.slice(8)))
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

function addEmoji(name) {
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
        if (name.includes(key)) return `${emoji} ${name}`
    }
    return `🌐 ${name}`
}

function convertToTarget(nodes, target, options) {
    switch (target) {
        case 'clash':
        case 'clashmeta':
        case 'stash':
            return convertToClash(nodes, options)
        case 'surge':
            return convertToSurge(nodes)
        case 'quantumultx':
            return convertToQuantumultX(nodes)
        case 'shadowrocket':
        case 'v2rayn':
        case 'v2rayng':
            return convertToBase64(nodes)
        case 'loon':
            return convertToLoon(nodes)
        case 'singbox':
            return convertToSingBox(nodes)
        default:
            return ''
    }
}

function convertToClash(nodes, options) {
    const proxies = nodes.map(node => {
        const base = { name: node.name, server: node.server, port: node.port }
        if (options.udp) base.udp = true

        switch (node.type) {
            case 'ss':
                return { ...base, type: 'ss', cipher: node.method, password: node.password }
            case 'vmess':
                return {
                    ...base, type: 'vmess', uuid: node.uuid, alterId: node.alterId,
                    cipher: 'auto', network: node.network, tls: node.tls,
                    'skip-cert-verify': options.skipCert,
                    ...(node.ws ? { 'ws-opts': node.ws } : {})
                }
            case 'vless':
                return { ...base, type: 'vless', uuid: node.uuid, flow: node.flow }
            case 'trojan':
                return { ...base, type: 'trojan', password: node.password, sni: node.sni }
            default:
                return base
        }
    })

    const config = {
        proxies,
        'proxy-groups': [
            { name: '🚀 节点选择', type: 'select', proxies: ['♻️ 自动选择', 'DIRECT', ...nodes.map(n => n.name)] },
            { name: '♻️ 自动选择', type: 'url-test', proxies: nodes.map(n => n.name), url: 'http://www.gstatic.com/generate_204', interval: 300 }
        ]
    }

    return `# LaoWang Sub-converter 生成\n# 节点数量: ${nodes.length}\n# 生成时间: ${new Date().toISOString()}\n\n${yamlStringify(config)}`
}

function yamlStringify(obj, indent = 0) {
    const spaces = '  '.repeat(indent)
    let result = ''

    if (Array.isArray(obj)) {
        for (const item of obj) {
            if (typeof item === 'object') {
                result += `${spaces}-\n${yamlStringify(item, indent + 1)}`
            } else {
                result += `${spaces}- ${item}\n`
            }
        }
    } else if (typeof obj === 'object') {
        for (const [key, value] of Object.entries(obj)) {
            if (value === undefined || value === null) continue
            if (typeof value === 'object') {
                result += `${spaces}${key}:\n${yamlStringify(value, indent + 1)}`
            } else if (typeof value === 'string' && value.includes(':')) {
                result += `${spaces}${key}: "${value}"\n`
            } else {
                result += `${spaces}${key}: ${value}\n`
            }
        }
    }
    return result
}

function convertToSurge(nodes) {
    return nodes.map(node => {
        switch (node.type) {
            case 'ss': return `${node.name} = ss, ${node.server}, ${node.port}, encrypt-method=${node.method}, password=${node.password}`
            case 'vmess': return `${node.name} = vmess, ${node.server}, ${node.port}, username=${node.uuid}`
            case 'trojan': return `${node.name} = trojan, ${node.server}, ${node.port}, password=${node.password}`
            default: return ''
        }
    }).filter(Boolean).join('\n')
}

function convertToQuantumultX(nodes) {
    return nodes.map(node => {
        switch (node.type) {
            case 'ss': return `shadowsocks=${node.server}:${node.port}, method=${node.method}, password=${node.password}, tag=${node.name}`
            case 'vmess': return `vmess=${node.server}:${node.port}, method=auto, password=${node.uuid}, tag=${node.name}`
            case 'trojan': return `trojan=${node.server}:${node.port}, password=${node.password}, tag=${node.name}`
            default: return ''
        }
    }).filter(Boolean).join('\n')
}

function convertToLoon(nodes) {
    return nodes.map(node => {
        switch (node.type) {
            case 'ss': return `${node.name} = Shadowsocks,${node.server},${node.port},${node.method},"${node.password}"`
            case 'vmess': return `${node.name} = vmess,${node.server},${node.port},auto,"${node.uuid}"`
            case 'trojan': return `${node.name} = trojan,${node.server},${node.port},"${node.password}"`
            default: return ''
        }
    }).filter(Boolean).join('\n')
}

function convertToBase64(nodes) {
    const links = nodes.map(node => {
        switch (node.type) {
            case 'ss':
                return `ss://${base64Encode(`${node.method}:${node.password}`)}@${node.server}:${node.port}#${encodeURIComponent(node.name)}`
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

                return `vmess://${base64Encode(JSON.stringify(vmessData))}`
            case 'trojan':
                return `trojan://${node.password}@${node.server}:${node.port}?peer=${encodeURIComponent(node.sni || node.server)}#${encodeURIComponent(node.name)}`
            default: return ''
        }
    }).filter(Boolean)

    return base64Encode(links.join('\n'))
}

function convertToSingBox(nodes) {
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
                        insecure: true // Worker env usually needs this or param check
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
                        insecure: true
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
