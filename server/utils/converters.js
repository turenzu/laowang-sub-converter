
// 转换核心逻辑
export function convertToTarget(nodes, target, options) {
    switch (target) {
        case 'clash':
        case 'clashmeta':
        case 'stash':
            return convertToClash(nodes, options)
        case 'surge':
        case 'surfboard':
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

// Clash/ClashMeta/Stash 格式
function convertToClash(nodes, options) {
    const proxies = nodes.map(node => {
        switch (node.type) {
            case 'ss':
                return {
                    name: node.name,
                    type: 'ss',
                    server: node.server,
                    port: node.port,
                    cipher: node.method,
                    password: node.password,
                    udp: options.udp
                }
            case 'vmess':
                const vmess = {
                    name: node.name,
                    type: 'vmess',
                    server: node.server,
                    port: node.port,
                    uuid: node.uuid,
                    alterId: node.alterId,
                    cipher: 'auto',
                    udp: options.udp
                }
                if (node.tls) {
                    vmess.tls = true
                    vmess['skip-cert-verify'] = options.skipCert
                }
                if (node.network === 'ws' && node.ws) {
                    vmess.network = 'ws'
                    vmess['ws-opts'] = {
                        path: node.ws.path || '/'
                    }
                    if (node.ws.headers && node.ws.headers.Host) {
                        vmess['ws-opts'].headers = { Host: node.ws.headers.Host }
                    }
                }
                return vmess
            case 'vless':
                const vless = {
                    name: node.name,
                    type: 'vless',
                    server: node.server,
                    port: node.port,
                    uuid: node.uuid,
                    udp: options.udp,
                    network: node.network
                }
                if (node.flow) vless.flow = node.flow
                if (node.tls) {
                    vless.tls = true
                    vless['skip-cert-verify'] = options.skipCert
                }
                if (node.network === 'ws' && node.ws) {
                    vless['ws-opts'] = {
                        path: node.ws.path || '/',
                        headers: node.ws.headers
                    }
                }
                if (node.network === 'grpc' && node.grpc) {
                    vless['grpc-opts'] = {
                        'grpc-service-name': node.grpc.serviceName
                    }
                }
                if (node.reality) {
                    vless['reality-opts'] = {
                        'public-key': node.reality.publicKey,
                        'short-id': node.reality.shortId
                    }
                    if (node.reality.sni) vless.servername = node.reality.sni
                }
                return vless
            case 'trojan':
                const trojan = {
                    name: node.name,
                    type: 'trojan',
                    server: node.server,
                    port: node.port,
                    password: node.password,
                    udp: options.udp,
                    'skip-cert-verify': options.skipCert
                }
                if (node.sni) trojan.sni = node.sni
                if (node.alpn && node.alpn.length) trojan.alpn = node.alpn
                return trojan
            default:
                return null
        }
    }).filter(Boolean)

    // 构建完整的 Clash 配置
    const config = {
        proxies: proxies,
        'proxy-groups': [
            {
                name: '🚀 节点选择',
                type: 'select',
                proxies: ['♻️ 自动选择', 'DIRECT', ...nodes.map(n => n.name)]
            },
            {
                name: '♻️ 自动选择',
                type: 'url-test',
                proxies: nodes.map(n => n.name),
                url: 'http://www.gstatic.com/generate_204',
                interval: 300
            }
        ]
    }

    // 转换为 YAML 格式
    return `# LaoWang Sub-converter 生成
# 节点数量: ${nodes.length}
# 生成时间: ${new Date().toISOString()}

${yamlStringify(config)}`
}

// Surge 格式
function convertToSurge(nodes, options) {
    return nodes.map(node => {
        switch (node.type) {
            case 'ss':
                return `${node.name} = ss, ${node.server}, ${node.port}, encrypt-method=${node.method}, password=${node.password}`
            case 'vmess':
                let vmess = `${node.name} = vmess, ${node.server}, ${node.port}, username=${node.uuid}`
                if (node.tls) vmess += ', tls=true'
                if (node.ws) {
                    vmess += ', ws=true'
                    if (node.ws.path) vmess += `, ws-path=${node.ws.path}`
                    if (node.ws.headers && node.ws.headers.Host) vmess += `, ws-headers=Host:${node.ws.headers.Host}`
                }
                if (options.skipCert) vmess += ', skip-cert-verify=true'
                return vmess
            case 'vless':
                // Surge VLESS support is limited/external usually, but we output standard format if applicable
                // Surge 5 支持 VLESS
                let vless = `${node.name} = vless, ${node.server}, ${node.port}, username=${node.uuid}`
                if (node.tls) vless += ', tls=true'
                if (options.skipCert) vless += ', skip-cert-verify=true'
                if (node.network === 'ws' && node.ws) {
                    vless += ', ws=true'
                    if (node.ws.path) vless += `, ws-path=${node.ws.path}`
                }
                if (node.reality) {
                    // Surge doesn't fully support Reality in standardized config yet commonly, but passing params best effort
                }
                return vless
            case 'trojan':
                let trojan = `${node.name} = trojan, ${node.server}, ${node.port}, password=${node.password}`
                if (node.sni) trojan += `, sni=${node.sni}`
                if (options.skipCert) trojan += ', skip-cert-verify=true'
                return trojan
            default:
                return ''
        }
    }).filter(Boolean).join('\n')
}

// Quantumult X 格式
function convertToQuantumultX(nodes, options) {
    return nodes.map(node => {
        switch (node.type) {
            case 'ss':
                return `shadowsocks=${node.server}:${node.port}, method=${node.method}, password=${node.password}, tag=${node.name}`
            case 'vmess':
                let vmess = `vmess=${node.server}:${node.port}, method=auto, password=${node.uuid}, tag=${node.name}`
                if (node.tls) vmess += ', tls=1'
                if (node.ws) {
                    vmess += ', obfs=ws'
                    if (node.ws.path) vmess += `, obfs-uri=${node.ws.path}`
                    if (node.ws.headers && node.ws.headers.Host) vmess += `, obfs-host=${node.ws.headers.Host}`
                }
                if (options.skipCert) vmess += ', tls-verification=false'
                return vmess
            case 'vless':
                let vless = `vless=${node.server}:${node.port}, method=none, password=${node.uuid}, tag=${node.name}`
                if (node.tls) vless += ', tls=1'
                if (options.skipCert) vless += ', tls-verification=false'
                if (node.network === 'ws' && node.ws) {
                    vless += ', obfs=ws'
                    if (node.ws.path) vless += `, obfs-uri=${node.ws.path}`
                }
                return vless
            case 'trojan':
                let trojan = `trojan=${node.server}:${node.port}, password=${node.password}, tag=${node.name}`
                if (node.sni) trojan += `, tls-host=${node.sni}`
                if (options.skipCert) trojan += ', tls-verification=false'
                return trojan
            default:
                return ''
        }
    }).filter(Boolean).join('\n')
}

// Loon 格式
function convertToLoon(nodes, options) {
    return nodes.map(node => {
        switch (node.type) {
            case 'ss':
                return `${node.name} = Shadowsocks,${node.server},${node.port},${node.method},"${node.password}"`
            case 'vmess':
                let vmess = `${node.name} = vmess,${node.server},${node.port},auto,"${node.uuid}"`
                if (node.ws) {
                    vmess += ',transport=ws'
                    if (node.ws.path) vmess += `,path=${node.ws.path}`
                    if (node.ws.headers && node.ws.headers.Host) vmess += `,host=${node.ws.headers.Host}`
                }
                if (node.tls) vmess += ',over-tls=true'
                if (options.skipCert) vmess += ',skip-cert-verify=true'
                return vmess
            case 'vless':
                let vless = `${node.name} = vless,${node.server},${node.port},"${node.uuid}"`
                if (node.ws) {
                    vless += ',transport=ws'
                    if (node.ws.path) vless += `,path=${node.ws.path}`
                    if (node.ws.headers && node.ws.headers.Host) vless += `,host=${node.ws.headers.Host}`
                }
                if (node.tls) vless += ',over-tls=true'
                return vless
            case 'trojan':
                let trojan = `${node.name} = trojan,${node.server},${node.port},"${node.password}"`
                if (node.sni) trojan += `,sni=${node.sni}`
                if (options.skipCert) trojan += ',skip-cert-verify=true'
                return trojan
            default:
                return ''
        }
    }).filter(Boolean).join('\n')
}

// Base64 格式 (Shadowrocket, V2RayN)
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
            case 'vless':
                // simple vless://uuid@host:port?params#name
                let vless = `vless://${node.uuid}@${node.server}:${node.port}?encryption=none&type=${node.network}`
                if (node.tls) vless += '&security=tls'
                if (node.flow) vless += `&flow=${node.flow}`
                if (node.ws) {
                    if (node.ws.path) vless += `&path=${encodeURIComponent(node.ws.path)}`
                    if (node.ws.headers && node.ws.headers.Host) vless += `&host=${encodeURIComponent(node.ws.headers.Host)}`
                }
                if (node.grpc) {
                    if (node.grpc.serviceName) vless += `&serviceName=${encodeURIComponent(node.grpc.serviceName)}`
                }
                if (node.reality) {
                    vless += '&security=reality'
                    if (node.reality.publicKey) vless += `&pbk=${node.reality.publicKey}`
                    if (node.reality.shortId) vless += `&sid=${node.reality.shortId}`
                    if (node.reality.sni) vless += `&sni=${node.reality.sni}`
                }
                vless += `#${encodeURIComponent(node.name)}`
                return vless
            case 'trojan':
                return `trojan://${node.password}@${node.server}:${node.port}?peer=${encodeURIComponent(node.sni || node.server)}#${encodeURIComponent(node.name)}`
            default:
                return ''
        }
    }).filter(Boolean)

    return Buffer.from(links.join('\n')).toString('base64')
}

// SingBox 格式
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
            case 'vless':
                const vless = {
                    ...base,
                    type: 'vless',
                    uuid: node.uuid,
                    flow: node.flow
                }
                if (node.tls) {
                    vless.tls = {
                        enabled: true,
                        server_name: node.reality?.sni || node.ws?.headers?.Host || node.server,
                        insecure: options.skipCert
                    }
                    if (node.reality) {
                        vless.tls.reality = {
                            enabled: true,
                            public_key: node.reality.publicKey,
                            short_id: node.reality.shortId
                        }
                    }
                }
                if (node.network === 'ws' && node.ws) {
                    vless.transport = {
                        type: 'ws',
                        path: node.ws.path,
                        headers: node.ws.headers
                    }
                }
                return vless
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


// 简单的 YAML 序列化
function yamlStringify(obj, indent = 0) {
    const spaces = '  '.repeat(indent)
    let result = ''

    for (const [key, value] of Object.entries(obj)) {
        if (Array.isArray(value)) {
            result += `${spaces}${key}:\n`
            for (const item of value) {
                if (typeof item === 'object' && item !== null) {
                    const lines = yamlStringifyObject(item, indent + 1)
                    result += `${spaces}  - ${lines}\n`
                } else {
                    result += `${spaces}  - ${item}\n`
                }
            }
        } else if (typeof value === 'object' && value !== null) {
            result += `${spaces}${key}:\n${yamlStringify(value, indent + 1)}`
        } else {
            result += `${spaces}${key}: ${value}\n`
        }
    }
    return result
}

function yamlStringifyObject(obj, indent = 0) {
    const spaces = '  '.repeat(indent)
    let lines = []
    let first = true

    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            if (first) {
                lines.push(`${key}:`)
                first = false
            } else {
                lines.push(`${spaces}${key}:`)
            }
            for (const [k, v] of Object.entries(value)) {
                if (typeof v === 'object' && v !== null) {
                    lines.push(`${spaces}  ${k}:`)
                    for (const [k2, v2] of Object.entries(v)) {
                        if (typeof v2 === 'object' && v2 !== null) {
                            // Simple recursion for one level deep
                            lines.push(`${spaces}    ${k2}:`)
                            for (const [k3, v3] of Object.entries(v2)) {
                                lines.push(`${spaces}      ${k3}: ${v3}`)
                            }
                        } else {
                            lines.push(`${spaces}    ${k2}: ${v2}`)
                        }
                    }
                } else {
                    lines.push(`${spaces}  ${k}: ${v}`)
                }
            }
        } else if (first) {
            lines.push(`${key}: ${value}`)
            first = false
        } else {
            lines.push(`${spaces}${key}: ${value}`)
        }
    }
    return lines.join('\n')
}
