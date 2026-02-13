import { parseSubscription } from './server/utils/parsers.js'
import { convertToTarget } from './server/utils/converters.js'
import fs from 'fs'

// Mock Subscription Data covering all protocols
const mockSubscription = `
# SS (SIP002)
ss://YWVzLTI1Ni1nY206cGFzc3dvcmRAMTI3LjAuMC4xOjg4ODg=#SS-SIP002
# SS (Legacy)
ss://YWVzLTI1Ni1nY206cGFzc3dvcmRAMTI3LjAuMC4xOjg4ODg#SS-Legacy
# VMess (TCP)
vmess://ew0KICAidiI6ICIyIiwNCiAgInBzIjogIlZNZXNzLVRDUCIsDQogICJhZGQiOiAiMTI3LjAuMC4xIiwNCiAgInBvcnQiOiAiNDQzIiwNCiAgImlkIjogImFkODBiYjRkLWY2MzItNDU1Ny04NTViLTk4ZGMzODllNzZlNzk1IiwNCiAgImFpZCI6ICIwIiwNCiAgIm5ldCI6ICJ0Y3AiLA0KICAidHlwZSI6ICJub25lIiwNCiAgImhvc3QiOiAiIiwNCiAgInBhdGgiOiAiIiwNCiAgInRscyI6ICIiDQp9
# VMess (WS+TLS) - Corrected Base64
vmess://ew0KICAidiI6ICIyIiwNCiAgInBzIjogIlZNZXNzLVdTLVRMUyIsDQogICJhZGQiOiAiZXhhbXBsZS5jb20iLA0KICAicG9ydCI6ICI0NDMiLA0KICAiaWQiOiAiYWQ4MGJiNGQtZjYzMi00NTU3LTg1NWItOThkYzM4OWU3Njk1IiwNCiAgImFpZCI6ICIwIiwNCiAgIm5ldCI6ICJ3cyIsDQogICJ0eXBlIjogIm5vbmUiLA0KICAiaG9zdCI6ICJleGFtcGxlLmNvbSIsDQogICJwYXRoIjogIi93cyIsDQogICJ0bHMiOiAidGxzIg0KfQ==
# VLESS (TCP+XTLS-Reality)
vless://uuid@example.com:443?security=reality&sni=google.com&fp=chrome&pbk=7_...&sid=123456&type=tcp&flow=xtls-rprx-vision#VLESS-Reality
# VLESS (WS+TLS)
vless://uuid@example.com:443?security=tls&type=ws&host=example.com&path=%2Fws#VLESS-WS-TLS
# Trojan (TCP+TLS)
trojan://password@example.com:443?sni=example.com#Trojan-TLS
# Hysteria 1
hysteria://example.com:443?auth=password&upmbps=100&downmbps=100&alpn=h3&obfs=x&peer=example.com#Hysteria-1
# Hysteria 2
hysteria2://password@example.com:443?sni=example.com&obfs=salamander&obfs-password=pwd&insecure=1#Hysteria-2
# TUIC
tuic://uuid:password@example.com:443?congestion_control=bbr&alpn=h3&sni=example.com&udp_relay_mode=native&allow_insecure=1#TUIC
# SSR
ssr://MTI3LjAuMC4xOjg4ODg6YXV0aF9hZXMxMjhfbWQ1OmNoYWNoYTIwOnBsYWluOllXVnpMVElMOne8dXJsNjRfZGVjb2RlPj4gIyBTU1I=
`

async function runTests() {
    console.log('--- Starting Comprehensive Protocol Test ---\n')

    // 1. Parsing
    console.log('1. Testing Parsers...')
    const nodes = parseSubscription(mockSubscription)
    console.log(`Parsed ${nodes.length} nodes from mock subscription.`)

    // Save to file for inspection
    fs.writeFileSync('test_parse_result.json', JSON.stringify(nodes, null, 2))
    console.log('Saved parse result to test_parse_result.json')

    // Validate Parse Results
    const expectedTypes = ['ss', 'ss', 'vmess', 'vmess', 'vless', 'vless', 'trojan', 'hysteria', 'hysteria2', 'tuic', 'ssr']
    let parseErrors = 0
    nodes.forEach((node, index) => {
        if (!node.type) {
            console.error(`❌ Node ${index} has no type!`)
            parseErrors++
        }
        console.log(`✅ Node ${index + 1}: [${node.type}] ${node.name}`)
    })

    if (parseErrors > 0) {
        console.error('❌ Parsing failed with errors.')
        process.exit(1)
    } else {
        console.log('✅ Parsing successful.\n')
    }

    // 2. Conversion to Targets
    const targets = [
        'clash',
        'clashmeta',
        'singbox',
        'surge',
        'quantumultx',
        'loon',
        'v2rayn',
        'shadowrocket'
    ]

    for (const target of targets) {
        console.log(`2. Testing Conversion to [${target.toUpperCase()}]...`)
        try {
            const options = { udp: true, skipCert: false }
            const result = convertToTarget(nodes, target, options)

            if (!result || result.trim().length === 0) {
                console.error(`❌ Conversion to ${target} returned empty result.`)
                continue
            }

            // Basic Validation
            if (target === 'clash' || target === 'clashmeta') {
                if (!result.includes('proxies:')) console.error(`❌ ${target} output missing 'proxies:'`)
            } else if (target === 'singbox') {
                try {
                    JSON.parse(result)
                } catch (e) {
                    console.error(`❌ ${target} output is not valid JSON: ${e.message}`)
                }
            }

            // Write output to file for inspection
            const filename = `test_output_${target}.${target === 'singbox' ? 'json' : (target.includes('clash') ? 'yaml' : 'txt')}`
            fs.writeFileSync(filename, result)
            console.log(`✅ Converted to ${target}. Saved to ${filename}`)

        } catch (error) {
            console.error(`❌ Conversion to ${target} failed:`, error)
        }
    }
    console.log('\n--- Test Completed ---')
}

runTests().catch(console.error)
