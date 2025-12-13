import express from 'express'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const router = express.Router()

// 获取 __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 数据存储路径
const DATA_FILE = path.join(__dirname, '../data/shortlinks.json')

// 确保数据目录存在
function ensureDataDir() {
    const dir = path.dirname(DATA_FILE)
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
    }
    if (!fs.existsSync(DATA_FILE)) {
        fs.writeFileSync(DATA_FILE, JSON.stringify({ links: {} }))
    }
}

// 读取数据
function readData() {
    ensureDataDir()
    try {
        return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'))
    } catch (e) {
        return { links: {} }
    }
}

// 写入数据
function writeData(data) {
    ensureDataDir()
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2))
}

// 生成短码
function generateShortCode(length = 6) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    const randomBytes = crypto.randomBytes(length)
    for (let i = 0; i < length; i++) {
        result += chars[randomBytes[i] % chars.length]
    }
    return result
}

// 创建短链接
router.post('/', (req, res) => {
    try {
        const { url } = req.body

        if (!url) {
            return res.status(400).json({ error: 'URL is required' })
        }

        // 验证 URL 格式
        try {
            new URL(url)
        } catch (e) {
            return res.status(400).json({ error: 'Invalid URL format' })
        }

        const data = readData()

        // 检查是否已存在相同 URL
        for (const [code, link] of Object.entries(data.links)) {
            if (link.originalUrl === url) {
                const baseUrl = `${req.protocol}://${req.get('host')}`
                return res.json({
                    shortUrl: `${baseUrl}/s/${code}`,
                    id: code,
                    originalUrl: url,
                    created: link.createdAt,
                    clicks: link.clicks
                })
            }
        }

        // 生成新短码
        let shortCode
        do {
            shortCode = generateShortCode()
        } while (data.links[shortCode])

        // 存储短链接
        data.links[shortCode] = {
            originalUrl: url,
            createdAt: new Date().toISOString(),
            clicks: 0
        }

        writeData(data)

        const baseUrl = `${req.protocol}://${req.get('host')}`
        res.json({
            shortUrl: `${baseUrl}/s/${shortCode}`,
            id: shortCode,
            originalUrl: url,
            created: data.links[shortCode].createdAt,
            clicks: 0
        })

    } catch (error) {
        console.error('Create short link error:', error)
        res.status(500).json({ error: 'Failed to create short link' })
    }
})

// 获取所有短链接
router.get('/list', (req, res) => {
    try {
        const data = readData()
        const baseUrl = `${req.protocol}://${req.get('host')}`

        const links = Object.entries(data.links).map(([code, link]) => ({
            id: code,
            shortUrl: `${baseUrl}/s/${code}`,
            originalUrl: link.originalUrl,
            clicks: link.clicks,
            createdAt: link.createdAt
        }))

        res.json({ links })
    } catch (error) {
        console.error('List short links error:', error)
        res.status(500).json({ error: 'Failed to list short links' })
    }
})

// 删除短链接
router.delete('/:code', (req, res) => {
    try {
        const { code } = req.params
        const data = readData()

        if (!data.links[code]) {
            return res.status(404).json({ error: 'Short link not found' })
        }

        delete data.links[code]
        writeData(data)

        res.json({ success: true })
    } catch (error) {
        console.error('Delete short link error:', error)
        res.status(500).json({ error: 'Failed to delete short link' })
    }
})

// 短链接跳转
router.get('/:code', (req, res) => {
    try {
        const { code } = req.params
        const data = readData()

        const link = data.links[code]
        if (!link) {
            return res.status(404).json({ error: 'Short link not found' })
        }

        // 更新点击次数
        link.clicks++
        writeData(data)

        // 重定向到原始 URL
        res.redirect(302, link.originalUrl)
    } catch (error) {
        console.error('Redirect error:', error)
        res.status(500).json({ error: 'Redirect failed' })
    }
})

// 获取短链接统计
router.get('/:code/stats', (req, res) => {
    try {
        const { code } = req.params
        const data = readData()

        const link = data.links[code]
        if (!link) {
            return res.status(404).json({ error: 'Short link not found' })
        }

        const baseUrl = `${req.protocol}://${req.get('host')}`
        res.json({
            id: code,
            shortUrl: `${baseUrl}/s/${code}`,
            originalUrl: link.originalUrl,
            clicks: link.clicks,
            createdAt: link.createdAt
        })
    } catch (error) {
        console.error('Get stats error:', error)
        res.status(500).json({ error: 'Failed to get stats' })
    }
})

export default router
