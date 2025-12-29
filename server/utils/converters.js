import yaml from 'js-yaml'
import { applyRulePreset } from './rules.js'

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
        case 'nekobox':
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
            case 'hysteria':
                return {
                    name: node.name,
                    type: 'hysteria',
                    server: node.server,
                    port: node.port,
                    auth_str: node.auth,
                    up: node.up,
                    down: node.down,
                    alpn: [node.alpn || 'h3'],
                    obfs: node.obfs || '',
                    sni: node.sni,
                    'skip-cert-verify': node.insecure || options.skipCert,
                    udp: options.udp
                }
            case 'hysteria2':
                const hy2 = {
                    name: node.name,
                    type: 'hysteria2',
                    server: node.server,
                    port: node.port,
                    password: node.password,
                    sni: node.sni,
                    'skip-cert-verify': node.insecure || options.skipCert,
                    udp: options.udp
                }
                if (node.obfs) {
                    hy2.obfs = node.obfs
                    hy2['obfs-password'] = node.obfsPassword || ''
                }
                return hy2
            case 'tuic':
                return {
                    name: node.name,
                    type: 'tuic',
                    server: node.server,
                    port: node.port,
                    uuid: node.uuid,
                    password: node.password,
                    alpn: node.alpn || ['h3'],
                    'congestion-controller': node.congestion || 'bbr',
                    'disable-sni': false,
                    'reduce-rtt': true,
                    sni: node.sni,
                    'skip-cert-verify': node.insecure || options.skipCert,
                    'udp-relay-mode': node.udpRelayMode || 'native',
                    udp: options.udp
                }
            case 'ssr':
                return {
                    name: node.name,
                    type: 'ssr',
                    server: node.server,
                    port: node.port,
                    cipher: node.method,
                    password: node.password,
                    protocol: node.protocol,
                    'protocol-param': node.protocolParam || '',
                    obfs: node.obfs,
                    'obfs-param': node.obfsParam || '',
                    udp: options.udp
                }
            default:
                return null
        }
    }).filter(Boolean)

    // 构建完整的 Clash 配置
    const nodeNames = nodes.map(n => n.name)

    // 如果有规则模板配置
    let proxyGroups, rules
    if (options.rulePreset) {
        try {
            const ruleConfig = applyRulePreset(nodes, options.rulePreset, options)
            proxyGroups = ruleConfig.proxyGroups
            rules = ruleConfig.rules
        } catch (e) {
            console.error('Failed to apply rule preset:', e)
            // 如果加载规则失败，使用默认配置
            proxyGroups = [
                { name: '🚀 节点选择', type: 'select', proxies: ['♻️ 自动选择', 'DIRECT', ...nodeNames] },
                { name: '♻️ 自动选择', type: 'url-test', proxies: nodeNames, url: 'http://www.gstatic.com/generate_204', interval: 300 }
            ]
            rules = ['GEOIP,LAN,DIRECT', 'GEOIP,CN,DIRECT', 'MATCH,🚀 节点选择']
        }
    } else {
        // 默认配置
        proxyGroups = [
            { name: '🚀 节点选择', type: 'select', proxies: ['♻️ 自动选择', 'DIRECT', ...nodeNames] },
            { name: '♻️ 自动选择', type: 'url-test', proxies: nodeNames, url: 'http://www.gstatic.com/generate_204', interval: 300 }
        ]
        rules = ['GEOIP,LAN,DIRECT', 'GEOIP,CN,DIRECT', 'MATCH,🚀 节点选择']
    }

    const config = {
        proxies: proxies,
        'proxy-groups': proxyGroups,
        rules: rules
    }

    // 转换为 YAML 格式
    return `# LaoWang Sub-converter 生成
# 节点数量: ${nodes.length}
# 规则模板: ${options.rulePreset || 'default'}
# 生成时间: ${new Date().toISOString()}

${yaml.dump(config, { lineWidth: -1 })}`
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
                // Surge 5 支持 VLESS
                let vless = `${node.name} = vless, ${node.server}, ${node.port}, username=${node.uuid}`
                if (node.tls) vless += ', tls=true'
                if (options.skipCert) vless += ', skip-cert-verify=true'
                if (node.network === 'ws' && node.ws) {
                    vless += ', ws=true'
                    if (node.ws.path) vless += `, ws-path=${node.ws.path}`
                }
                return vless
            case 'trojan':
                let trojan = `${node.name} = trojan, ${node.server}, ${node.port}, password=${node.password}`
                if (node.sni) trojan += `, sni=${node.sni}`
                if (options.skipCert) trojan += ', skip-cert-verify=true'
                return trojan
            case 'hysteria2':
                let hy2 = `${node.name} = hysteria2, ${node.server}, ${node.port}, password=${node.password}`
                if (node.sni) hy2 += `, sni=${node.sni}`
                if (options.skipCert || node.insecure) hy2 += ', skip-cert-verify=true'
                return hy2
            case 'tuic':
                let tuic = `${node.name} = tuic, ${node.server}, ${node.port}, token=${node.uuid}:${node.password}`
                if (node.sni) tuic += `, sni=${node.sni}`
                if (options.skipCert || node.insecure) tuic += ', skip-cert-verify=true'
                return tuic
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
            case 'hysteria2':
                let hy2 = `hysteria2=${node.server}:${node.port}, password=${node.password}, tag=${node.name}`
                if (node.sni) hy2 += `, sni=${node.sni}`
                if (options.skipCert || node.insecure) hy2 += ', tls-verification=false'
                return hy2
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
            case 'hysteria2':
                let hy2 = `${node.name} = Hysteria2,${node.server},${node.port},"${node.password}"`
                if (node.sni) hy2 += `,sni=${node.sni}`
                if (options.skipCert || node.insecure) hy2 += ',skip-cert-verify=true'
                return hy2
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
                    vless = vless.replace('&security=tls', '&security=reality')
                    if (node.reality.publicKey) vless += `&pbk=${node.reality.publicKey}`
                    if (node.reality.shortId) vless += `&sid=${node.reality.shortId}`
                    if (node.reality.sni) vless += `&sni=${node.reality.sni}`
                    vless += '&fp=chrome'
                }
                vless += `#${encodeURIComponent(node.name)}`
                return vless
            case 'trojan':
                // 使用 sni 参数而不是 peer，更兼容
                let trojan = `trojan://${encodeURIComponent(node.password)}@${node.server}:${node.port}`
                trojan += `?sni=${encodeURIComponent(node.sni || node.server)}`
                if (node.alpn && node.alpn.length) trojan += `&alpn=${encodeURIComponent(node.alpn.join(','))}`
                trojan += `#${encodeURIComponent(node.name)}`
                return trojan
            case 'hysteria':
                let hy1 = `hysteria://${node.server}:${node.port}`
                hy1 += `?auth=${encodeURIComponent(node.auth)}`
                hy1 += `&upmbps=${node.up}&downmbps=${node.down}`
                if (node.alpn) hy1 += `&alpn=${node.alpn}`
                if (node.obfs) hy1 += `&obfs=${node.obfs}`
                if (node.sni) hy1 += `&peer=${encodeURIComponent(node.sni)}`
                if (node.insecure) hy1 += '&insecure=1'
                hy1 += `#${encodeURIComponent(node.name)}`
                return hy1
            case 'hysteria2':
                let hy2 = `hysteria2://${encodeURIComponent(node.password)}@${node.server}:${node.port}`
                if (node.sni) hy2 += `?sni=${encodeURIComponent(node.sni)}`
                if (node.obfs) hy2 += `&obfs=${node.obfs}&obfs-password=${encodeURIComponent(node.obfsPassword || '')}`
                if (node.insecure) hy2 += '&insecure=1'
                hy2 += `#${encodeURIComponent(node.name)}`
                return hy2
            case 'tuic':
                let tuic = `tuic://${node.uuid}:${encodeURIComponent(node.password)}@${node.server}:${node.port}`
                tuic += `?congestion_control=${node.congestion || 'bbr'}`
                if (node.alpn && node.alpn.length) tuic += `&alpn=${encodeURIComponent(node.alpn.join(','))}`
                if (node.sni) tuic += `&sni=${encodeURIComponent(node.sni)}`
                if (node.udpRelayMode) tuic += `&udp_relay_mode=${node.udpRelayMode}`
                if (node.insecure) tuic += '&allow_insecure=1'
                tuic += `#${encodeURIComponent(node.name)}`
                return tuic
            case 'ssr':
                // SSR 使用特殊的 Base64 编码格式
                const ssrMain = `${node.server}:${node.port}:${node.protocol}:${node.method}:${node.obfs}:${Buffer.from(node.password).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')}`
                let ssrParams = ''
                if (node.protocolParam) ssrParams += `protoparam=${Buffer.from(node.protocolParam).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')}`
                if (node.obfsParam) ssrParams += `&obfsparam=${Buffer.from(node.obfsParam).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')}`
                const remarks = Buffer.from(node.name).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
                ssrParams += `&remarks=${remarks}`
                const ssrFull = ssrParams ? `${ssrMain}/?${ssrParams}` : ssrMain
                return `ssr://${Buffer.from(ssrFull).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')}`
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
                if (node.alpn && node.alpn.length) {
                    trojan.tls = trojan.tls || { enabled: true }
                    trojan.tls.alpn = node.alpn
                }
                return trojan
            case 'hysteria':
                return {
                    ...base,
                    type: 'hysteria',
                    auth_str: node.auth,
                    up_mbps: parseInt(node.up) || 100,
                    down_mbps: parseInt(node.down) || 100,
                    tls: {
                        enabled: true,
                        server_name: node.sni || node.server,
                        insecure: node.insecure || options.skipCert,
                        alpn: [node.alpn || 'h3']
                    },
                    obfs: node.obfs || undefined
                }
            case 'hysteria2':
                const hy2 = {
                    ...base,
                    type: 'hysteria2',
                    password: node.password,
                    tls: {
                        enabled: true,
                        server_name: node.sni || node.server,
                        insecure: node.insecure || options.skipCert
                    }
                }
                if (node.obfs) {
                    hy2.obfs = {
                        type: node.obfs,
                        password: node.obfsPassword || ''
                    }
                }
                return hy2
            case 'tuic':
                return {
                    ...base,
                    type: 'tuic',
                    uuid: node.uuid,
                    password: node.password,
                    congestion_control: node.congestion || 'bbr',
                    udp_relay_mode: node.udpRelayMode || 'native',
                    tls: {
                        enabled: true,
                        server_name: node.sni || node.server,
                        insecure: node.insecure || options.skipCert,
                        alpn: node.alpn || ['h3']
                    }
                }
            case 'ssr':
                return {
                    ...base,
                    type: 'shadowsocksr',
                    method: node.method,
                    password: node.password,
                    protocol: node.protocol,
                    protocol_param: node.protocolParam || '',
                    obfs: node.obfs,
                    obfs_param: node.obfsParam || ''
                }
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
