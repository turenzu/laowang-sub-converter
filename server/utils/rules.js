/**
 * 规则分流配置模板
 * 支持 Clash/ClashMeta 格式的规则配置
 */

// 预设规则模板
export const rulePresets = {
    // 基础模板 - 最小化规则
    basic: {
        name: '基础模板',
        description: '最小化规则配置',
        proxyGroups: [
            { name: '🚀 节点选择', type: 'select', proxies: ['♻️ 自动选择', 'DIRECT'] },
            { name: '♻️ 自动选择', type: 'url-test', proxies: [], url: 'http://www.gstatic.com/generate_204', interval: 300 }
        ],
        rules: [
            'GEOIP,LAN,DIRECT',
            'GEOIP,CN,DIRECT',
            'MATCH,🚀 节点选择'
        ]
    },

    // 标准模板 - 推荐使用
    standard: {
        name: '标准模板',
        description: '平衡的规则配置，适合日常使用',
        proxyGroups: [
            { name: '🚀 节点选择', type: 'select', proxies: ['♻️ 自动选择', '🎯 全球直连'] },
            { name: '♻️ 自动选择', type: 'url-test', proxies: [], url: 'http://www.gstatic.com/generate_204', interval: 300 },
            { name: '📲 电报信息', type: 'select', proxies: ['🚀 节点选择'] },
            { name: '🎥 流媒体', type: 'select', proxies: ['🚀 节点选择'] },
            { name: '🤖 AI 服务', type: 'select', proxies: ['🚀 节点选择'] },
            { name: '🎯 全球直连', type: 'select', proxies: ['DIRECT'] },
            { name: '🛑 广告拦截', type: 'select', proxies: ['REJECT'] },
            { name: '🐟 漏网之鱼', type: 'select', proxies: ['🚀 节点选择', '🎯 全球直连'] }
        ],
        rules: [
            // 广告拦截
            'DOMAIN-SUFFIX,ad.com,🛑 广告拦截',
            'DOMAIN-KEYWORD,adservice,🛑 广告拦截',
            'DOMAIN-KEYWORD,tracking,🛑 广告拦截',
            // AI 服务
            'DOMAIN-SUFFIX,openai.com,🤖 AI 服务',
            'DOMAIN-SUFFIX,ai.com,🤖 AI 服务',
            'DOMAIN-SUFFIX,claude.ai,🤖 AI 服务',
            'DOMAIN-SUFFIX,anthropic.com,🤖 AI 服务',
            'DOMAIN-SUFFIX,bard.google.com,🤖 AI 服务',
            'DOMAIN-SUFFIX,gemini.google.com,🤖 AI 服务',
            // 电报
            'DOMAIN-SUFFIX,t.me,📲 电报信息',
            'DOMAIN-SUFFIX,telegram.org,📲 电报信息',
            'DOMAIN-SUFFIX,telegram.me,📲 电报信息',
            'IP-CIDR,91.108.56.0/22,📲 电报信息',
            'IP-CIDR,91.108.4.0/22,📲 电报信息',
            'IP-CIDR,149.154.160.0/20,📲 电报信息',
            // 流媒体
            'DOMAIN-SUFFIX,netflix.com,🎥 流媒体',
            'DOMAIN-SUFFIX,netflix.net,🎥 流媒体',
            'DOMAIN-SUFFIX,nflxvideo.net,🎥 流媒体',
            'DOMAIN-SUFFIX,youtube.com,🎥 流媒体',
            'DOMAIN-SUFFIX,ytimg.com,🎥 流媒体',
            'DOMAIN-SUFFIX,googlevideo.com,🎥 流媒体',
            'DOMAIN-SUFFIX,spotify.com,🎥 流媒体',
            'DOMAIN-SUFFIX,twitch.tv,🎥 流媒体',
            // 国内直连
            'DOMAIN-SUFFIX,cn,🎯 全球直连',
            'DOMAIN-SUFFIX,taobao.com,🎯 全球直连',
            'DOMAIN-SUFFIX,tmall.com,🎯 全球直连',
            'DOMAIN-SUFFIX,jd.com,🎯 全球直连',
            'DOMAIN-SUFFIX,qq.com,🎯 全球直连',
            'DOMAIN-SUFFIX,weixin.com,🎯 全球直连',
            'DOMAIN-SUFFIX,bilibili.com,🎯 全球直连',
            'DOMAIN-SUFFIX,163.com,🎯 全球直连',
            'DOMAIN-SUFFIX,126.com,🎯 全球直连',
            'DOMAIN-SUFFIX,baidu.com,🎯 全球直连',
            // 最终规则
            'GEOIP,LAN,🎯 全球直连',
            'GEOIP,CN,🎯 全球直连',
            'MATCH,🐟 漏网之鱼'
        ]
    },

    // 开发者模板
    developer: {
        name: '开发者模板',
        description: '针对开发者优化，包含 GitHub、NPM 等',
        proxyGroups: [
            { name: '🚀 节点选择', type: 'select', proxies: ['♻️ 自动选择', '🎯 全球直连'] },
            { name: '♻️ 自动选择', type: 'url-test', proxies: [], url: 'http://www.gstatic.com/generate_204', interval: 300 },
            { name: '💻 开发工具', type: 'select', proxies: ['🚀 节点选择'] },
            { name: '🤖 AI 服务', type: 'select', proxies: ['🚀 节点选择'] },
            { name: '🎯 全球直连', type: 'select', proxies: ['DIRECT'] },
            { name: '🐟 漏网之鱼', type: 'select', proxies: ['🚀 节点选择', '🎯 全球直连'] }
        ],
        rules: [
            // AI 服务
            'DOMAIN-SUFFIX,openai.com,🤖 AI 服务',
            'DOMAIN-SUFFIX,claude.ai,🤖 AI 服务',
            'DOMAIN-SUFFIX,anthropic.com,🤖 AI 服务',
            'DOMAIN-SUFFIX,github.copilot.com,🤖 AI 服务',
            // 开发工具
            'DOMAIN-SUFFIX,github.com,💻 开发工具',
            'DOMAIN-SUFFIX,githubusercontent.com,💻 开发工具',
            'DOMAIN-SUFFIX,githubassets.com,💻 开发工具',
            'DOMAIN-SUFFIX,github.io,💻 开发工具',
            'DOMAIN-SUFFIX,npmjs.org,💻 开发工具',
            'DOMAIN-SUFFIX,npmjs.com,💻 开发工具',
            'DOMAIN-SUFFIX,yarnpkg.com,💻 开发工具',
            'DOMAIN-SUFFIX,docker.com,💻 开发工具',
            'DOMAIN-SUFFIX,docker.io,💻 开发工具',
            'DOMAIN-SUFFIX,stackoverflow.com,💻 开发工具',
            'DOMAIN-SUFFIX,stackexchange.com,💻 开发工具',
            'DOMAIN-SUFFIX,vercel.com,💻 开发工具',
            'DOMAIN-SUFFIX,vercel.app,💻 开发工具',
            'DOMAIN-SUFFIX,netlify.com,💻 开发工具',
            'DOMAIN-SUFFIX,netlify.app,💻 开发工具',
            'DOMAIN-SUFFIX,cloudflare.com,💻 开发工具',
            'DOMAIN-SUFFIX,heroku.com,💻 开发工具',
            'DOMAIN-SUFFIX,digitalocean.com,💻 开发工具',
            // 直连
            'GEOIP,LAN,🎯 全球直连',
            'GEOIP,CN,🎯 全球直连',
            'MATCH,🐟 漏网之鱼'
        ]
    },

    // 游戏加速模板
    gaming: {
        name: '游戏加速模板',
        description: '针对游戏优化，低延迟节点优先',
        proxyGroups: [
            { name: '🚀 节点选择', type: 'select', proxies: ['⚡ 低延迟', '🎯 全球直连'] },
            { name: '⚡ 低延迟', type: 'url-test', proxies: [], url: 'http://www.gstatic.com/generate_204', interval: 150, tolerance: 50 },
            { name: '🎮 游戏平台', type: 'select', proxies: ['⚡ 低延迟', '🚀 节点选择'] },
            { name: '🎯 全球直连', type: 'select', proxies: ['DIRECT'] },
            { name: '🐟 漏网之鱼', type: 'select', proxies: ['🚀 节点选择', '🎯 全球直连'] }
        ],
        rules: [
            // Steam
            'DOMAIN-SUFFIX,steamcommunity.com,🎮 游戏平台',
            'DOMAIN-SUFFIX,steampowered.com,🎮 游戏平台',
            'DOMAIN-SUFFIX,steamstatic.com,🎮 游戏平台',
            'DOMAIN-SUFFIX,steamcontent.com,🎮 游戏平台',
            // Epic
            'DOMAIN-SUFFIX,epicgames.com,🎮 游戏平台',
            'DOMAIN-SUFFIX,unrealengine.com,🎮 游戏平台',
            // PlayStation
            'DOMAIN-SUFFIX,playstation.com,🎮 游戏平台',
            'DOMAIN-SUFFIX,playstation.net,🎮 游戏平台',
            // Xbox
            'DOMAIN-SUFFIX,xbox.com,🎮 游戏平台',
            'DOMAIN-SUFFIX,xboxlive.com,🎮 游戏平台',
            // Nintendo
            'DOMAIN-SUFFIX,nintendo.com,🎮 游戏平台',
            'DOMAIN-SUFFIX,nintendo.net,🎮 游戏平台',
            // EA
            'DOMAIN-SUFFIX,ea.com,🎮 游戏平台',
            'DOMAIN-SUFFIX,origin.com,🎮 游戏平台',
            // Riot
            'DOMAIN-SUFFIX,riotgames.com,🎮 游戏平台',
            'DOMAIN-SUFFIX,leagueoflegends.com,🎮 游戏平台',
            // Battle.net
            'DOMAIN-SUFFIX,battle.net,🎮 游戏平台',
            'DOMAIN-SUFFIX,blizzard.com,🎮 游戏平台',
            // Discord
            'DOMAIN-SUFFIX,discord.com,🎮 游戏平台',
            'DOMAIN-SUFFIX,discord.gg,🎮 游戏平台',
            'DOMAIN-SUFFIX,discordapp.com,🎮 游戏平台',
            // 直连
            'GEOIP,LAN,🎯 全球直连',
            'GEOIP,CN,🎯 全球直连',
            'MATCH,🐟 漏网之鱼'
        ]
    },

    // 流媒体解锁模板
    streaming: {
        name: '流媒体解锁模板',
        description: '针对流媒体服务优化',
        proxyGroups: [
            { name: '🚀 节点选择', type: 'select', proxies: ['♻️ 自动选择', '🎯 全球直连'] },
            { name: '♻️ 自动选择', type: 'url-test', proxies: [], url: 'http://www.gstatic.com/generate_204', interval: 300 },
            { name: '📺 Netflix', type: 'select', proxies: ['🚀 节点选择'] },
            { name: '🎬 Disney+', type: 'select', proxies: ['🚀 节点选择'] },
            { name: '▶️ YouTube', type: 'select', proxies: ['🚀 节点选择'] },
            { name: '🎵 Spotify', type: 'select', proxies: ['🚀 节点选择'] },
            { name: '🎯 全球直连', type: 'select', proxies: ['DIRECT'] },
            { name: '🐟 漏网之鱼', type: 'select', proxies: ['🚀 节点选择', '🎯 全球直连'] }
        ],
        rules: [
            // Netflix
            'DOMAIN-SUFFIX,netflix.com,📺 Netflix',
            'DOMAIN-SUFFIX,netflix.net,📺 Netflix',
            'DOMAIN-SUFFIX,nflxvideo.net,📺 Netflix',
            'DOMAIN-SUFFIX,nflximg.net,📺 Netflix',
            'DOMAIN-SUFFIX,nflximg.com,📺 Netflix',
            'DOMAIN-SUFFIX,nflxso.net,📺 Netflix',
            'DOMAIN-SUFFIX,nflxext.com,📺 Netflix',
            // Disney+
            'DOMAIN-SUFFIX,disney.com,🎬 Disney+',
            'DOMAIN-SUFFIX,disneyplus.com,🎬 Disney+',
            'DOMAIN-SUFFIX,dssott.com,🎬 Disney+',
            'DOMAIN-SUFFIX,disneystreaming.com,🎬 Disney+',
            'DOMAIN-SUFFIX,bamgrid.com,🎬 Disney+',
            // YouTube
            'DOMAIN-SUFFIX,youtube.com,▶️ YouTube',
            'DOMAIN-SUFFIX,ytimg.com,▶️ YouTube',
            'DOMAIN-SUFFIX,googlevideo.com,▶️ YouTube',
            'DOMAIN-SUFFIX,youtu.be,▶️ YouTube',
            'DOMAIN-SUFFIX,yt.be,▶️ YouTube',
            // Spotify
            'DOMAIN-SUFFIX,spotify.com,🎵 Spotify',
            'DOMAIN-SUFFIX,scdn.co,🎵 Spotify',
            'DOMAIN-SUFFIX,spotifycdn.com,🎵 Spotify',
            'DOMAIN-SUFFIX,audio-ak-spotify-com.akamaized.net,🎵 Spotify',
            // HBO Max
            'DOMAIN-SUFFIX,hbomax.com,📺 Netflix',
            'DOMAIN-SUFFIX,hbo.com,📺 Netflix',
            // Prime Video
            'DOMAIN-SUFFIX,primevideo.com,📺 Netflix',
            'DOMAIN-SUFFIX,amazon.com,📺 Netflix',
            // 直连
            'GEOIP,LAN,🎯 全球直连',
            'GEOIP,CN,🎯 全球直连',
            'MATCH,🐟 漏网之鱼'
        ]
    }
}

// 获取所有可用的规则模板
export function getRulePresets() {
    return Object.entries(rulePresets).map(([id, preset]) => ({
        id,
        name: preset.name,
        description: preset.description,
        groupCount: preset.proxyGroups.length,
        ruleCount: preset.rules.length
    }))
}

// 根据模板 ID 获取完整配置
export function getRulePreset(presetId) {
    return rulePresets[presetId] || rulePresets.basic
}

// 将规则模板应用到节点列表
export function applyRulePreset(nodes, presetId, options = {}) {
    const preset = getRulePreset(presetId)

    // 构建代理组
    const nodeNames = nodes.map(n => n.name)
    const proxyGroups = preset.proxyGroups.map(group => {
        const g = { ...group }

        // 如果是自动选择组或需要所有节点的组
        if (group.type === 'url-test' || group.type === 'fallback' || group.type === 'load-balance') {
            g.proxies = [...nodeNames]
        } else if (group.name === '🚀 节点选择') {
            // 节点选择组包含所有节点
            g.proxies = [...g.proxies.filter(p => !p.includes('自动')), '♻️ 自动选择', ...nodeNames]
        }

        // 替换掉模板中的自动选择引用
        if (g.proxies && g.proxies.includes('🚀 节点选择') && group.name !== '🚀 节点选择') {
            // 保持原样，使用节点选择组
        }

        return g
    })

    return {
        proxyGroups,
        rules: preset.rules
    }
}
