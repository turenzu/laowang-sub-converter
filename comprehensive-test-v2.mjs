/**
 * LaoWang Sub-Converter 综合测试脚本 v2
 * 测试所有协议解析和转换功能
 */

import { parseSubscription, addEmoji } from './server/utils/parsers.js'
import { convertToTarget } from './server/utils/converters.js'

// 测试用的节点链接样本 (覆盖所有支持的协议)
const testNodes = {
    // SS - SIP002 格式
    ss: 'ss://YWVzLTI1Ni1nY206cGFzc3dvcmQxMjM=@example.com:8388#SS%20Test%20Node',

    // SSR 格式
    ssr: 'ssr://ZXhhbXBsZS5jb206ODM4ODpvcmlnaW46YWVzLTI1Ni1jZmI6cGxhaW46Y0dGemMzZHZjbVF4TWpNPS8_cmVtYXJrcz1VMU5TVUNCVVpYTjBJRTV2WkdV',

    // VMess 格式
    vmess: 'vmess://eyJ2IjoiMiIsInBzIjoiVk1lc3MgVGVzdCBOb2RlIiwiYWRkIjoiZXhhbXBsZS5jb20iLCJwb3J0IjoiNDQzIiwiaWQiOiJhM2MxOTRlMi0zMGRlLTQxMTItYTZlYi01OTMzYmVmN2VmNjciLCJhaWQiOiIwIiwibmV0Ijoid3MiLCJ0eXBlIjoibm9uZSIsImhvc3QiOiJ3cy5leGFtcGxlLmNvbSIsInBhdGgiOiIvd3MiLCJ0bHMiOiJ0bHMifQ==',

    // VLESS 格式
    vless: 'vless://a3c194e2-30de-4112-a6eb-5933bef7ef67@example.com:443?encryption=none&type=ws&security=tls&path=%2Fws&host=ws.example.com#VLESS%20Test%20Node',

    // VLESS Reality 格式
    vlessReality: 'vless://a3c194e2-30de-4112-a6eb-5933bef7ef67@example.com:443?encryption=none&type=tcp&security=reality&sni=www.microsoft.com&pbk=abcdefghijklmnopqrstuvwxyz123456&sid=abcd1234&flow=xtls-rprx-vision#VLESS%20Reality%20Test',

    // Trojan 格式
    trojan: 'trojan://password123@example.com:443?sni=example.com&alpn=h2%2Chttp%2F1.1#Trojan%20Test%20Node',

    // Hysteria 格式
    hysteria: 'hysteria://example.com:443?auth=password123&upmbps=100&downmbps=100&alpn=h3&obfs=xplus&peer=example.com&insecure=0#Hysteria%20Test%20Node',

    // Hysteria2 格式
    hysteria2: 'hysteria2://password123@example.com:443?sni=example.com&obfs=salamander&obfs-password=obfspass#Hysteria2%20Test%20Node',

    // TUIC 格式
    tuic: 'tuic://a3c194e2-30de-4112-a6eb-5933bef7ef67:password123@example.com:443?congestion_control=bbr&alpn=h3&sni=example.com&udp_relay_mode=native#TUIC%20Test%20Node'
}

// 所有支持的客户端
const allClients = [
    'clash', 'clashmeta', 'surge', 'quantumultx', 'shadowrocket',
    'loon', 'v2rayn', 'v2rayng', 'nekobox', 'surfboard', 'stash', 'singbox'
]

// 测试结果
const testReport = {
    timestamp: new Date().toISOString(),
    summary: { total: 0, passed: 0, failed: 0, warnings: 0 },
    tests: {
        parsing: {},
        conversion: {},
        compatibility: {}
    }
}

// 辅助函数: 记录测试结果
function logTest(category, name, passed, details = {}) {
    testReport.summary.total++
    if (passed) {
        testReport.summary.passed++
        console.log(`  ✅ ${name}`)
    } else {
        testReport.summary.failed++
        console.log(`  ❌ ${name}`)
    }
    testReport.tests[category][name] = { passed, ...details }
}

// 辅助函数: 记录警告
function logWarning(category, name, message) {
    testReport.summary.warnings++
    console.log(`  ⚠️ ${name}: ${message}`)
    if (!testReport.tests[category][name]) {
        testReport.tests[category][name] = {}
    }
    testReport.tests[category][name].warning = message
}

// ============ 测试 1: 协议解析测试 ============
console.log('\n' + '='.repeat(60))
console.log('📋 测试 1: 协议解析测试')
console.log('='.repeat(60))

const parsedNodes = {}

for (const [protocol, uri] of Object.entries(testNodes)) {
    console.log(`\n🔍 测试 ${protocol.toUpperCase()} 解析:`)

    try {
        const nodes = parseSubscription(uri)
        const passed = nodes.length === 1

        if (passed) {
            parsedNodes[protocol] = nodes[0]
            logTest('parsing', `${protocol}_parse`, true, {
                nodeCount: nodes.length,
                nodeName: nodes[0]?.name,
                nodeType: nodes[0]?.type,
                server: nodes[0]?.server,
                port: nodes[0]?.port
            })

            // 验证关键字段
            const node = nodes[0]
            if (!node.server || !node.port) {
                logWarning('parsing', `${protocol}_parse`, '缺少 server 或 port')
            }
            if (!node.name) {
                logWarning('parsing', `${protocol}_parse`, '缺少节点名称')
            }

            // 特殊字段验证
            if (protocol === 'ssr' && (!node.protocol || !node.obfs)) {
                logWarning('parsing', `${protocol}_parse`, 'SSR 缺少 protocol 或 obfs')
            }
            if (protocol === 'vlessReality' && !node.reality) {
                logWarning('parsing', `${protocol}_parse`, 'VLESS Reality 缺少 reality 配置')
            }
            if (protocol === 'hysteria' && !node.auth) {
                logWarning('parsing', `${protocol}_parse`, 'Hysteria 缺少 auth')
            }
            if (protocol === 'hysteria2' && !node.password) {
                logWarning('parsing', `${protocol}_parse`, 'Hysteria2 缺少 password')
            }
            if (protocol === 'tuic' && (!node.uuid || !node.password)) {
                logWarning('parsing', `${protocol}_parse`, 'TUIC 缺少 uuid 或 password')
            }

        } else {
            logTest('parsing', `${protocol}_parse`, false, { error: '解析失败或节点数量不正确' })
        }
    } catch (e) {
        logTest('parsing', `${protocol}_parse`, false, { error: e.message })
    }
}

// ============ 测试 2: 转换功能测试 ============
console.log('\n' + '='.repeat(60))
console.log('🔄 测试 2: 转换功能测试')
console.log('='.repeat(60))

// 使用所有已解析的节点进行转换测试
const allParsedNodes = Object.values(parsedNodes).filter(Boolean)

if (allParsedNodes.length === 0) {
    console.log('❌ 没有可用的已解析节点进行转换测试')
} else {
    console.log(`\n📦 使用 ${allParsedNodes.length} 个已解析节点进行转换测试:\n`)

    for (const client of allClients) {
        try {
            const output = convertToTarget(allParsedNodes, client, {
                udp: true,
                skipCert: false
            })

            const passed = output && output.length > 0
            const details = {
                outputLength: output?.length || 0,
                outputType: typeof output,
                hasContent: !!output
            }

            if (passed) {
                // 验证输出格式
                if (client === 'singbox' || client === 'nekobox') {
                    try {
                        JSON.parse(output)
                        details.validJson = true
                    } catch (e) {
                        details.validJson = false
                        logWarning('conversion', `to_${client}`, 'JSON 格式无效')
                    }
                }

                if (['clash', 'clashmeta', 'stash'].includes(client)) {
                    details.hasYamlHeader = output.includes('proxies:')
                    if (!details.hasYamlHeader) {
                        logWarning('conversion', `to_${client}`, '缺少 YAML proxies 头')
                    }
                }

                if (['shadowrocket', 'v2rayn', 'v2rayng'].includes(client)) {
                    details.isBase64 = /^[A-Za-z0-9+/=]+$/.test(output.replace(/\s/g, ''))
                }
            }

            logTest('conversion', `to_${client}`, passed, details)

        } catch (e) {
            logTest('conversion', `to_${client}`, false, { error: e.message })
        }
    }
}

// ============ 测试 3: 协议兼容性矩阵测试 ============
console.log('\n' + '='.repeat(60))
console.log('🔗 测试 3: 协议兼容性矩阵测试')
console.log('='.repeat(60))

// 定义哪些客户端支持哪些协议
const clientProtocolSupport = {
    clash: ['ss', 'vmess', 'vless', 'vlessReality', 'trojan', 'hysteria', 'hysteria2', 'tuic', 'ssr'],
    clashmeta: ['ss', 'vmess', 'vless', 'vlessReality', 'trojan', 'hysteria', 'hysteria2', 'tuic', 'ssr'],
    stash: ['ss', 'vmess', 'vless', 'vlessReality', 'trojan', 'hysteria', 'hysteria2', 'tuic', 'ssr'],
    surge: ['ss', 'vmess', 'vless', 'trojan', 'hysteria2', 'tuic'],
    quantumultx: ['ss', 'vmess', 'vless', 'trojan', 'hysteria2'],
    shadowrocket: ['ss', 'vmess', 'vless', 'vlessReality', 'trojan', 'hysteria', 'hysteria2', 'tuic', 'ssr'],
    loon: ['ss', 'vmess', 'vless', 'trojan', 'hysteria2'],
    v2rayn: ['ss', 'vmess', 'vless', 'vlessReality', 'trojan', 'hysteria', 'hysteria2', 'tuic', 'ssr'],
    v2rayng: ['ss', 'vmess', 'vless', 'vlessReality', 'trojan', 'hysteria', 'hysteria2', 'tuic', 'ssr'],
    nekobox: ['ss', 'vmess', 'vless', 'vlessReality', 'trojan', 'hysteria', 'hysteria2', 'tuic', 'ssr'],
    surfboard: ['ss', 'vmess', 'vless', 'trojan'],
    singbox: ['ss', 'vmess', 'vless', 'vlessReality', 'trojan', 'hysteria', 'hysteria2', 'tuic', 'ssr']
}

console.log('\n📊 协议支持矩阵测试:\n')

const compatibilityMatrix = {}

for (const [client, supportedProtocols] of Object.entries(clientProtocolSupport)) {
    compatibilityMatrix[client] = {}

    for (const protocol of supportedProtocols) {
        if (parsedNodes[protocol]) {
            try {
                const output = convertToTarget([parsedNodes[protocol]], client, {
                    udp: true,
                    skipCert: false
                })

                // 检查输出中是否包含有效内容
                let hasValidContent = false

                if (client === 'singbox' || client === 'nekobox') {
                    try {
                        const json = JSON.parse(output)
                        hasValidContent = json.outbounds && json.outbounds.length > 1
                    } catch (e) { }
                } else if (['clash', 'clashmeta', 'stash'].includes(client)) {
                    hasValidContent = output.includes('proxies:') && output.includes('name:')
                } else if (['shadowrocket', 'v2rayn', 'v2rayng'].includes(client)) {
                    // Base64 解码检查
                    try {
                        const decoded = Buffer.from(output, 'base64').toString()
                        hasValidContent = decoded.includes('://') || decoded.length > 10
                    } catch (e) { }
                } else {
                    // Surge, Quantumult X, Loon 等文本格式
                    hasValidContent = output && output.length > 20
                }

                compatibilityMatrix[client][protocol] = hasValidContent ? '✅' : '⚠️'

            } catch (e) {
                compatibilityMatrix[client][protocol] = '❌'
            }
        } else {
            compatibilityMatrix[client][protocol] = '⏭️'
        }
    }
}

// 打印兼容性矩阵
const protocols = Object.keys(parsedNodes)
console.log('Client'.padEnd(15) + protocols.map(p => p.padEnd(12)).join(''))
console.log('-'.repeat(15 + protocols.length * 12))

for (const [client, results] of Object.entries(compatibilityMatrix)) {
    let row = client.padEnd(15)
    for (const protocol of protocols) {
        row += (results[protocol] || '➖').padEnd(12)
    }
    console.log(row)
}

testReport.tests.compatibility = compatibilityMatrix

// ============ 测试 4: Emoji 添加测试 ============
console.log('\n' + '='.repeat(60))
console.log('🏳️ 测试 4: Emoji 添加测试')
console.log('='.repeat(60) + '\n')

const emojiTests = [
    { name: '香港节点', expected: '🇭🇰' },
    { name: 'HK Node', expected: '🇭🇰' },
    { name: '日本东京', expected: '🇯🇵' },
    { name: 'US Server', expected: '🇺🇸' },
    { name: 'Singapore', expected: '🇸🇬' },
    { name: 'Unknown Location', expected: '🌐' }
]

for (const test of emojiTests) {
    const result = addEmoji(test.name)
    const passed = result.includes(test.expected)
    logTest('parsing', `emoji_${test.name}`, passed, {
        input: test.name,
        output: result,
        expected: test.expected
    })
}

// ============ 测试 5: 边缘情况测试 ============
console.log('\n' + '='.repeat(60))
console.log('🔬 测试 5: 边缘情况测试')
console.log('='.repeat(60) + '\n')

// 测试空输入
try {
    const emptyResult = parseSubscription('')
    logTest('parsing', 'empty_input', emptyResult.length === 0, {
        result: emptyResult.length === 0 ? '正确返回空数组' : '应返回空数组'
    })
} catch (e) {
    logTest('parsing', 'empty_input', false, { error: e.message })
}

// 测试无效输入
try {
    const invalidResult = parseSubscription('invalid://malformed-url')
    logTest('parsing', 'invalid_input', invalidResult.length === 0, {
        result: invalidResult.length === 0 ? '正确忽略无效链接' : '应忽略无效链接'
    })
} catch (e) {
    logTest('parsing', 'invalid_input', false, { error: e.message })
}

// 测试 Base64 编码的订阅内容
try {
    const base64Content = Buffer.from(testNodes.ss + '\n' + testNodes.vmess).toString('base64')
    const base64Result = parseSubscription(base64Content)
    logTest('parsing', 'base64_subscription', base64Result.length === 2, {
        result: `解析出 ${base64Result.length} 个节点`,
        expected: '应解析出 2 个节点'
    })
} catch (e) {
    logTest('parsing', 'base64_subscription', false, { error: e.message })
}

// 测试空节点数组转换
try {
    const emptyConvert = convertToTarget([], 'clash', { udp: true, skipCert: false })
    logTest('conversion', 'empty_nodes', emptyConvert.includes('proxies:'), {
        result: '空节点数组转换正常'
    })
} catch (e) {
    logTest('conversion', 'empty_nodes', false, { error: e.message })
}

// ============ 生成最终报告 ============
console.log('\n' + '='.repeat(60))
console.log('📊 测试报告摘要')
console.log('='.repeat(60))
console.log(`
┌─────────────────────────────────────────┐
│  测试时间: ${testReport.timestamp}  │
├─────────────────────────────────────────┤
│  总测试数: ${String(testReport.summary.total).padStart(3)}                            │
│  通过: ${String(testReport.summary.passed).padStart(3)} ✅                            │
│  失败: ${String(testReport.summary.failed).padStart(3)} ❌                            │
│  警告: ${String(testReport.summary.warnings).padStart(3)} ⚠️                            │
├─────────────────────────────────────────┤
│  通过率: ${((testReport.summary.passed / testReport.summary.total) * 100).toFixed(1)}%                           │
└─────────────────────────────────────────┘
`)

// 协议解析统计
const parsingTests = Object.entries(testReport.tests.parsing).filter(([k]) => k.includes('_parse'))
const parsingPassed = parsingTests.filter(([, v]) => v.passed).length
console.log(`📋 协议解析: ${parsingPassed}/${parsingTests.length} 通过`)

// 客户端转换统计
const conversionTests = Object.entries(testReport.tests.conversion).filter(([k]) => k.startsWith('to_'))
const conversionPassed = conversionTests.filter(([, v]) => v.passed).length
console.log(`🔄 客户端转换: ${conversionPassed}/${conversionTests.length} 通过`)

// 保存详细报告
import fs from 'fs'
const reportPath = './test-report-v2.json'
fs.writeFileSync(reportPath, JSON.stringify(testReport, null, 2))
console.log(`\n📁 详细报告已保存: ${reportPath}`)

// 如果有失败，列出失败项
if (testReport.summary.failed > 0) {
    console.log('\n❌ 失败的测试:')
    for (const [category, tests] of Object.entries(testReport.tests)) {
        if (typeof tests === 'object' && !Array.isArray(tests)) {
            for (const [name, result] of Object.entries(tests)) {
                if (result && result.passed === false) {
                    console.log(`   - [${category}] ${name}: ${result.error || '未知错误'}`)
                }
            }
        }
    }
}

// 如果有警告，列出警告项
if (testReport.summary.warnings > 0) {
    console.log('\n⚠️ 警告:')
    for (const [category, tests] of Object.entries(testReport.tests)) {
        if (typeof tests === 'object' && !Array.isArray(tests)) {
            for (const [name, result] of Object.entries(tests)) {
                if (result && result.warning) {
                    console.log(`   - [${category}] ${name}: ${result.warning}`)
                }
            }
        }
    }
}

console.log('\n' + '='.repeat(60))
console.log('✅ 测试完成!')
console.log('='.repeat(60) + '\n')

// 退出码
process.exit(testReport.summary.failed > 0 ? 1 : 0)
