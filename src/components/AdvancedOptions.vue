<template>
  <div class="advanced-options">
    <button class="toggle-btn" @click="isOpen = !isOpen">
      <span>{{ $t('converter.advancedOptions') }}</span>
      <svg 
        class="arrow" 
        :class="{ rotated: isOpen }" 
        width="16" height="16" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        stroke-width="2"
      >
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
    </button>

    <transition name="expand">
      <div v-if="isOpen" class="options-panel">
        <div class="options-grid">
          <!-- 开关选项 -->
          <label class="checkbox-item">
            <input type="checkbox" v-model="options.emoji" />
            <span class="checkmark"></span>
            <span>{{ $t('options.emoji') }}</span>
          </label>

          <label class="checkbox-item">
            <input type="checkbox" v-model="options.udp" />
            <span class="checkmark"></span>
            <span>{{ $t('options.udp') }}</span>
          </label>

          <label class="checkbox-item">
            <input type="checkbox" v-model="options.skipCert" />
            <span class="checkmark"></span>
            <span>{{ $t('options.skipCert') }}</span>
          </label>

          <label class="checkbox-item">
            <input type="checkbox" v-model="options.sort" />
            <span class="checkmark"></span>
            <span>{{ $t('options.sort') }}</span>
          </label>
        </div>

        <!-- 规则模板 -->
        <div class="form-group">
          <label class="form-label">规则配置模板</label>
          <select v-model="options.rulePreset" class="form-select">
            <option value="">默认模板</option>
            <option value="basic">基础模板 (最小化)</option>
            <option value="standard">标准模板 (推荐)</option>
            <option value="developer">开发者模板 (GitHub/NPM)</option>
            <option value="gaming">游戏加速模板</option>
            <option value="streaming">流媒体解锁模板</option>
          </select>
        </div>

        <!-- 过滤规则 -->
        <div class="form-group">
          <label class="form-label">{{ $t('options.filter') }}</label>
          <input 
            type="text" 
            class="form-input" 
            v-model="options.filter"
            :placeholder="$t('options.filterPlaceholder')"
          />
        </div>

        <!-- 重命名规则 -->
        <div class="form-group">
          <label class="form-label">{{ $t('options.rename') }}</label>
          <textarea 
            class="form-textarea" 
            v-model="options.rename"
            :placeholder="$t('options.renamePlaceholder')"
            rows="3"
          ></textarea>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:modelValue'])

const isOpen = ref(false)

const options = reactive({
  emoji: true,
  udp: true,
  skipCert: false,
  sort: false,
  filter: '',
  rename: '',
  rulePreset: ''
})

watch(options, (newVal) => {
  emit('update:modelValue', { ...newVal })
}, { deep: true })
</script>

<style scoped>
.advanced-options {
  margin-bottom: var(--spacing-xl);
}

.toggle-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: var(--spacing-md);
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  font-family: inherit;
  font-size: var(--font-size-base);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.toggle-btn:hover {
  background: rgba(0, 0, 0, 0.3);
  border-color: var(--color-border-hover);
}

.arrow {
  transition: transform var(--transition-fast);
}

.arrow.rotated {
  transform: rotate(180deg);
}

.options-panel {
  margin-top: var(--spacing-md);
  padding: var(--spacing-lg);
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.options-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  cursor: pointer;
  color: var(--color-text-secondary);
  transition: color var(--transition-fast);
}

.checkbox-item:hover {
  color: var(--color-text-primary);
}

.checkbox-item input {
  display: none;
}

.checkmark {
  width: 18px;
  height: 18px;
  border: 2px solid var(--color-border);
  border-radius: 4px;
  position: relative;
  transition: all var(--transition-fast);
}

.checkbox-item input:checked + .checkmark {
  background: var(--color-accent-cyan);
  border-color: var(--color-accent-cyan);
}

.checkbox-item input:checked + .checkmark::after {
  content: '';
  position: absolute;
  left: 5px;
  top: 2px;
  width: 4px;
  height: 8px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

/* Animation */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
  margin-top: 0;
}

.expand-enter-to,
.expand-leave-from {
  opacity: 1;
  max-height: 500px;
}

.form-select {
  width: 100%;
  padding: 10px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  font-family: inherit;
  margin-top: 5px;
}
</style>
