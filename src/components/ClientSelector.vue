<template>
  <div class="client-selector">
    <label class="form-label">{{ $t('converter.targetClient') }}</label>
    
    <div class="client-grid">
      <button
        v-for="client in clients"
        :key="client.id"
        class="client-card"
        :class="{ active: modelValue === client.id }"
        @click="$emit('update:modelValue', client.id)"
      >
        <div class="client-icon">{{ client.icon }}</div>
        <div class="client-info">
          <div class="client-name">{{ client.name }}</div>
          <div class="client-platform">{{ client.platform }}</div>
        </div>
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  modelValue: {
    type: String,
    default: ''
  }
})

defineEmits(['update:modelValue'])

const clients = [
  { id: 'clash', name: 'Clash', platform: '全平台', icon: '🔥' },
  { id: 'clashmeta', name: 'Clash Meta', platform: '全平台', icon: '⚡' },
  { id: 'surge', name: 'Surge', platform: 'iOS/macOS', icon: '🌊' },
  { id: 'quantumultx', name: 'Quantumult X', platform: 'iOS', icon: '🔮' },
  { id: 'shadowrocket', name: 'Shadowrocket', platform: 'iOS', icon: '🚀' },
  { id: 'loon', name: 'Loon', platform: 'iOS', icon: '🎈' },
  { id: 'v2rayn', name: 'V2RayN', platform: 'Windows', icon: '💻' },
  { id: 'v2rayng', name: 'V2RayNG', platform: 'Android', icon: '📱' },
  { id: 'nekobox', name: 'NekoBox', platform: 'Android', icon: '🐱' },
  { id: 'surfboard', name: 'Surfboard', platform: 'Android', icon: '🏄' },
  { id: 'stash', name: 'Stash', platform: 'iOS/macOS', icon: '📦' },
  { id: 'singbox', name: 'sing-box', platform: '全平台', icon: '📦' }
]
</script>

<style scoped>
.client-selector {
  margin-bottom: var(--spacing-xl);
}

.client-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: var(--spacing-md);
}

.client-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  text-align: left;
  font-family: inherit;
  color: var(--color-text-primary);
}

.client-card:hover {
  background: rgba(0, 212, 255, 0.05);
  border-color: var(--color-border-hover);
  transform: translateY(-2px);
}

.client-card.active {
  background: rgba(0, 212, 255, 0.1);
  border-color: var(--color-accent-cyan);
  box-shadow: var(--shadow-glow-cyan);
}

.client-icon {
  font-size: 1.5rem;
}

.client-info {
  flex: 1;
  min-width: 0;
}

.client-name {
  font-weight: 600;
  font-size: var(--font-size-sm);
}

.client-platform {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
</style>
