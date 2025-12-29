<template>
  <div class="health-check-container">
    <div class="header">
      <h2>🩺 节点健康检测</h2>
      <p>检测订阅节点的连通性和延迟，自动过滤无效节点</p>
    </div>

    <div class="card input-card">
        <div class="form-group">
            <label>订阅链接 / 节点列表</label>
            <div class="input-group">
                <input 
                    type="text" 
                    v-model="subscriptionUrl" 
                    placeholder="输入订阅链接 (HTTP/HTTPS)" 
                    @keyup.enter="startCheck"
                />
                <button class="btn btn-primary" @click="startCheck" :disabled="loading">
                    {{ loading ? '检测中...' : '开始检测' }}
                </button>
            </div>
            <div class="helper-text">支持各种协议的订阅链接，也可以直接输入节点内容</div>
        </div>
    </div>

    <div v-if="results.length > 0" class="card result-card">
        <div class="summary-bar">
            <div class="summary-item online">
                <span class="label">在线</span>
                <span class="value">{{ summary.online }}</span>
            </div>
            <div class="summary-item offline">
                <span class="label">离线</span>
                <span class="value">{{ summary.offline }}</span>
            </div>
            <div class="summary-item latency">
                <span class="label">平均延迟</span>
                <span class="value">{{ summary.avgLatency }}ms</span>
            </div>
        </div>

        <div class="filter-bar">
            <button 
                v-for="filter in ['all', 'online', 'offline']" 
                :key="filter"
                :class="['btn', 'btn-sm', currentFilter === filter ? 'btn-primary' : 'btn-outline']"
                @click="currentFilter = filter"
            >
                {{ filter === 'all' ? '全部' : filter === 'online' ? '在线' : '离线' }}
            </button>
            <span class="flex-grow"></span>
            <button class="btn btn-sm btn-outline" @click="exportOnlineNodes" v-if="summary.online > 0">
                导出在线节点
            </button>
        </div>

        <div class="node-list">
            <div 
                v-for="(node, index) in filteredResults" 
                :key="index" 
                :class="['node-item', node.status]"
            >
                <div class="node-status">
                    <div class="status-dot"></div>
                </div>
                <div class="node-info">
                    <div class="node-name">{{ node.name }}</div>
                    <div class="node-server">{{ node.type.toUpperCase() }} • {{ node.server }}:{{ node.port }}</div>
                </div>
                <div class="node-latency">
                    <span v-if="node.status === 'online'" :class="getLatencyClass(node.latency)">
                        {{ node.latency }}ms
                    </span>
                    <span v-else class="error-msg">
                        超时
                    </span>
                </div>
            </div>
        </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const subscriptionUrl = ref('')
const loading = ref(false)
const results = ref([])
const summary = ref({ total: 0, online: 0, offline: 0, avgLatency: 0 })
const currentFilter = ref('all')

const filteredResults = computed(() => {
    if (currentFilter.value === 'all') return results.value
    return results.value.filter(n => n.status === currentFilter.value)
})

const getLatencyClass = (latency) => {
    if (latency < 100) return 'latency-good'
    if (latency < 300) return 'latency-ok'
    return 'latency-bad'
}

const startCheck = async () => {
    if (!subscriptionUrl.value) return
    
    loading.value = true
    results.value = []
    
    try {
        // 判断是URL还是直接内容
        const isUrl = subscriptionUrl.value.startsWith('http')
        const payload = isUrl ? { url: subscriptionUrl.value } : { nodes: [] /* TODO: Parse content */ }
        
        // 如果不是URL，可能是直接的节点内容，这里简化处理，只支持URL
        if (!isUrl) {
           alert('暂时只支持 HTTP/HTTPS 订阅链接')
           loading.value = false
           return
        }
        
        const apiBase = import.meta.env.PROD ? '/api' : 'http://localhost:3000/api'
        const res = await fetch(`${apiBase}/health/check`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        
        const data = await res.json()
        if (data.error) throw new Error(data.error)
        
        results.value = data.nodes
        summary.value = data.summary
        
    } catch (e) {
        alert('检测失败: ' + e.message)
    } finally {
        loading.value = false
    }
}

const exportOnlineNodes = () => {
    alert('导出功能开发中...')
}
</script>

<style scoped>
.health-check-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
}

.header {
    text-align: center;
    margin-bottom: 2rem;
}

.card {
    background: var(--card-bg);
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.input-group {
    display: flex;
    gap: 1rem;
    margin-top: 0.5rem;
}

input {
    flex: 1;
    padding: 0.75rem 1rem;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    background: var(--input-bg);
    color: var(--text-color);
}

.summary-bar {
    display: flex;
    justify-content: space-around;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--border-color);
}

.summary-item {
    text-align: center;
}

.summary-item .label {
    display: block;
    font-size: 0.875rem;
    color: var(--text-muted);
    margin-bottom: 0.25rem;
}

.summary-item .value {
    font-size: 1.5rem;
    font-weight: bold;
}

.summary-item.online .value { color: #10b981; }
.summary-item.offline .value { color: #ef4444; }

.filter-bar {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
}

.node-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.node-item {
    display: flex;
    align-items: center;
    padding: 0.75rem;
    background: var(--bg-color);
    border-radius: 8px;
    border: 1px solid transparent;
}

.node-item.online { border-color: #10b98133; }
.node-item.offline { border-color: #ef444433; opacity: 0.7; }

.status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-right: 1rem;
}

.online .status-dot { background: #10b981; }
.offline .status-dot { background: #ef4444; }

.node-info {
    flex: 1;
}

.node-name {
    font-weight: 500;
}

.node-server {
    font-size: 0.75rem;
    color: var(--text-muted);
}

.latency-good { color: #10b981; }
.latency-ok { color: #f59e0b; }
.latency-bad { color: #ef4444; }

.error-msg {
    color: #ef4444;
    font-size: 0.875rem;
}

@media (prefers-color-scheme: dark) {
    .health-check-container {
        --card-bg: #1f2937;
        --input-bg: #374151;
        --border-color: #4b5563;
        --text-color: #f3f4f6;
        --text-muted: #9ca3af;
        --bg-color: #111827;
    }
}

@media (prefers-color-scheme: light) {
    .health-check-container {
        --card-bg: #ffffff;
        --input-bg: #f9fafb;
        --border-color: #e5e7eb;
        --text-color: #1f2937;
        --text-muted: #6b7280;
        --bg-color: #f3f4f6;
    }
}
</style>
