<template>
  <div class="converter-page">
    <div class="container">
      <div class="page-header">
        <h1 class="page-title">
          <span class="text-gradient">{{ $t('converter.title') }}</span>
        </h1>
        <p class="page-subtitle">{{ $t('converter.subtitle') }}</p>
      </div>

      <div class="converter-form glass-card">
        <!-- 订阅链接输入 -->
        <div class="form-group">
          <label class="form-label">{{ $t('converter.inputLabel') }}</label>
          <textarea 
            class="form-textarea"
            v-model="subscriptionUrl"
            :placeholder="$t('converter.inputPlaceholder')"
            rows="4"
          ></textarea>
        </div>

        <!-- 客户端选择 -->
        <!-- API ??? -->
        <div class="form-group api-selector">
          <label class="form-label"> API ?</label>
          <div class="api-options">
            <label v-for="api in apiSources" :key="api.id" class="api-option" :class="{ active: selectedApi === api.id }">
              <input type="radio" :value="api.id" v-model="selectedApi" />
              <span class="api-name">{{ api.name }}</span>
              <span class="api-desc">{{ api.desc }}</span>
            </label>
          </div>
        </div>

        <ClientSelector v-model="selectedClient" />

        <!-- 高级选项 -->
        <AdvancedOptions v-model="advancedOptions" />

        <!-- 操作按钮 -->
        <div class="form-actions">
          <button 
            class="btn btn-primary" 
            @click="convertSubscription"
            :disabled="!subscriptionUrl || !selectedClient || loading"
          >
            <span v-if="loading">⏳ {{ $t('common.loading') }}</span>
            <span v-else>🔄 {{ $t('converter.convert') }}</span>
          </button>
          <button class="btn btn-secondary" @click="resetForm">
            🔄 {{ $t('converter.reset') }}
          </button>
        </div>

        <!-- 结果显示 -->
        <ResultPanel v-if="convertedUrl" :result="convertedUrl" />

        <!-- 错误提示 -->
        <div v-if="error" class="error-message">
          ⚠️ {{ error }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import ClientSelector from '../components/ClientSelector.vue'
import AdvancedOptions from '../components/AdvancedOptions.vue'
import ResultPanel from '../components/ResultPanel.vue'

const subscriptionUrl = ref('')
const selectedClient = ref('')
const selectedApi = ref('local')

// 备用 API 源配置
const apiSources = [
  { id: 'local', name: '本地服务', desc: '使用本项目后端', url: '' },
  { id: 'v1mk', name: 'v1.mk', desc: '第三方 API', url: 'https://api.v1.mk' },
  { id: 'xeton', name: 'xeton.dev', desc: '第三方 API', url: 'https://sub.xeton.dev' },
  { id: 'dler', name: 'dler.io', desc: '第三方 API', url: 'https://api.dler.io' }
]

// 获取当前选中的 API 信息
const currentApi = computed(() => {
  return apiSources.find(api => api.id === selectedApi.value) || apiSources[0]
})

const advancedOptions = reactive({
  emoji: true,
  udp: true,
  skipCert: false,
  sort: false,
  filter: '',
  rename: ''
})

const loading = ref(false)
const convertedUrl = ref('')
const error = ref('')

const convertSubscription = async () => {
  if (!subscriptionUrl.value || !selectedClient.value) return

  loading.value = true
  error.value = ''
  convertedUrl.value = ''

  try {
    // 根据选择的 API 构建基础 URL
    let apiBaseUrl = ''
    if (selectedApi.value === 'local') {
      apiBaseUrl = window.location.origin
    } else {
      apiBaseUrl = currentApi.value.url
    }

    const params = new URLSearchParams({
      target: selectedClient.value,
      url: subscriptionUrl.value,
      emoji: advancedOptions.emoji ? '1' : '0',
      udp: advancedOptions.udp ? '1' : '0',
      scert: advancedOptions.skipCert ? '1' : '0',
      sort: advancedOptions.sort ? '1' : '0'
    })

    if (advancedOptions.filter) {
      params.append('include', advancedOptions.filter)
    }

    if (advancedOptions.rename) {
      params.append('rename', advancedOptions.rename)
    }
    
    if (advancedOptions.rulePreset) {
      params.append('rulePreset', advancedOptions.rulePreset)
    }

    // 根据不同 API 构建转换链接
    if (selectedApi.value === 'local') {
      convertedUrl.value = `${apiBaseUrl}/api/convert?${params.toString()}`
    } else {
      // 第三方 API 使用 /sub 接口 (可能不支持 rulePreset，但我们还是传过去)
      convertedUrl.value = `${apiBaseUrl}/sub?${params.toString()}`
    }

    // 模拟 API 调用延迟
    await new Promise(resolve => setTimeout(resolve, 500))

  } catch (err) {
    error.value = err.message || '转换失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  subscriptionUrl.value = ''
  selectedClient.value = ''
  selectedApi.value = 'local'
  convertedUrl.value = ''
  error.value = ''
  advancedOptions.emoji = true
  advancedOptions.udp = true
  advancedOptions.skipCert = false
  advancedOptions.sort = false
  advancedOptions.filter = ''
  advancedOptions.rename = ''
  advancedOptions.rulePreset = ''
}
</script>

<style scoped>
.converter-page {
  padding-top: 100px;
  padding-bottom: 4rem;
  min-height: 100vh;
}

.page-header {
  text-align: center;
  margin-bottom: 3rem;
}

.page-title {
  font-size: var(--font-size-3xl);
  margin-bottom: 0.5rem;
}

.page-subtitle {
  color: var(--color-text-secondary);
}

.converter-form {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: var(--spacing-xl);
}

.error-message {
  margin-top: var(--spacing-lg);
  padding: var(--spacing-md);
  background: rgba(255, 0, 110, 0.1);
  border: 1px solid rgba(255, 0, 110, 0.3);
  border-radius: var(--radius-md);
  color: var(--color-accent-pink);
  text-align: center;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
