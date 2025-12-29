<template>
  <div class="merge-container">
    <div class="header">
      <h2>📎 订阅合并</h2>
      <p>将多个订阅合并为一个，自动去重并统一格式</p>
    </div>

    <div class="card">
        <div class="form-group">
            <label>订阅链接列表 (每行一个)</label>
            <textarea 
                v-model="urlsContent" 
                rows="5"
                placeholder="https://example.com/sub1&#10;https://example.com/sub2"
            ></textarea>
        </div>

        <div class="options-grid">
            <div class="option-item">
                <label>目标客户端</label>
                <select v-model="target">
                    <option value="clash">Clash</option>
                    <option value="surge">Surge</option>
                    <option value="singbox">Sing-Box</option>
                    <option value="quantumultx">Quantumult X</option>
                </select>
            </div>
            <div class="option-check">
                <label>
                    <input type="checkbox" v-model="options.dedupe"> 去除重复节点
                </label>
            </div>
             <div class="option-check">
                <label>
                    <input type="checkbox" v-model="options.emoji"> 添加 Emoji
                </label>
            </div>
             <div class="option-check">
                <label>
                    <input type="checkbox" v-model="options.sort"> 排序节点
                </label>
            </div>
        </div>

        <div class="action-bar">
            <button class="btn btn-outline" @click="previewMerge" :disabled="loading">
                {{ loading ? '处理中...' : '预览节点' }}
            </button>
            <button class="btn btn-primary" @click="downloadMerge" :disabled="loading">
                合并并下载
            </button>
        </div>
    </div>

    <div v-if="previewResult" class="card result-card">
        <h3>合并预览</h3>
        <div class="stats-row">
            <div class="stat">
                <div class="val">{{ previewResult.total }}</div>
                <div class="lbl">总节点数</div>
            </div>
            <div class="stat" v-for="(count, type) in previewResult.byType" :key="type">
                <div class="val">{{ count }}</div>
                <div class="lbl">{{ type.toUpperCase() }}</div>
            </div>
        </div>
        
        <div class="preview-list">
            <div v-for="(node, i) in previewResult.nodes" :key="i" class="mini-node">
                {{ node.name }}
            </div>
        </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const urlsContent = ref('')
const target = ref('clash')
const loading = ref(false)
const previewResult = ref(null)
const options = ref({
    dedupe: true,
    emoji: true,
    sort: false
})

const getUrls = () => urlsContent.value.split('\n').map(u => u.trim()).filter(u => u.startsWith('http'))

const previewMerge = async () => {
    const urls = getUrls()
    if (urls.length === 0) return alert('请输入至少一个有效的订阅链接')
    
    loading.value = true
    try {
        const apiBase = import.meta.env.PROD ? '/api' : 'http://localhost:3000/api'
        const res = await fetch(`${apiBase}/merge/preview`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ urls, dedupe: options.value.dedupe })
        })
        const data = await res.json()
        previewResult.value = data
    } catch (e) {
        alert('预览失败: ' + e.message)
    } finally {
        loading.value = false
    }
}

const downloadMerge = () => {
    const urls = getUrls()
    if (urls.length === 0) return alert('请输入至少一个有效的订阅链接')
    
    // 构建下载请求 - 实际上我们应该使用 fetch 然后 blob 下载，或者直接跳转
    // 这里为了简单，我们使用 fetch + blob
    
    loading.value = true
    const apiBase = import.meta.env.PROD ? '/api' : 'http://localhost:3000/api'
    
    fetch(`${apiBase}/merge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            urls,
            target: target.value,
            ...options.value
        })
    })
    .then(res => res.blob())
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `merged-config.${target.value === 'singbox' ? 'json' : 'yaml'}`; 
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
    })
    .catch(e => alert('合并下载失败: ' + e.message))
    .finally(() => loading.value = false)
}
</script>

<style scoped>
/* Reuse styles from HealthCheck or define new ones */
.merge-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
}

.header { text-align: center; margin-bottom: 2rem; }

.card {
    background: var(--card-bg);
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    background: var(--input-bg);
    color: var(--text-color);
    resize: vertical;
}

.options-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 1rem;
    margin: 1.5rem 0;
}

.action-bar {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
}

.stats-row {
    display: flex;
    gap: 2rem;
    margin-bottom: 1rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--border-color);
    flex-wrap: wrap;
}

.stat { text-align: center; }
.stat .val { font-size: 1.5rem; font-weight: bold; }
.stat .lbl { font-size: 0.75rem; color: var(--text-muted); }

.preview-list {
    max-height: 300px;
    overflow-y: auto;
    font-size: 0.875rem;
}
.mini-node {
    padding: 4px 0;
    border-bottom: 1px solid var(--border-color);
}

@media (prefers-color-scheme: dark) {
    .merge-container {
        --card-bg: #1f2937;
        --input-bg: #374151;
        --border-color: #4b5563;
        --text-color: #f3f4f6;
        --text-muted: #9ca3af;
    }
}

@media (prefers-color-scheme: light) {
    .merge-container {
        --card-bg: #ffffff;
        --input-bg: #f9fafb;
        --border-color: #e5e7eb;
        --text-color: #1f2937;
        --text-muted: #6b7280;
    }
}
</style>
