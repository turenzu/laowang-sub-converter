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
import { ref, reactive } from 'vue'
import ClientSelector from '../components/ClientSelector.vue'
import AdvancedOptions from '../components/AdvancedOptions.vue'
import ResultPanel from '../components/ResultPanel.vue'

const subscriptionUrl = ref('')
const selectedClient = ref('')
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
    // 构建转换 URL
    const baseUrl = window.location.origin
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

    // 生成转换后的链接
    convertedUrl.value = `${baseUrl}/api/convert?${params.toString()}`

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
  convertedUrl.value = ''
  error.value = ''
  advancedOptions.emoji = true
  advancedOptions.udp = true
  advancedOptions.skipCert = false
  advancedOptions.sort = false
  advancedOptions.filter = ''
  advancedOptions.rename = ''
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
