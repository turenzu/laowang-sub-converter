const fs = require('fs');
let content = fs.readFileSync('src/views/Converter.vue', 'utf8');

// ?? API ??? HTML
const oldClientSelector = '<ClientSelector v-model="selectedClient" />';
const newApiSelector = `<!-- API ??? -->
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

        <ClientSelector v-model="selectedClient" />`;

content = content.replace(oldClientSelector, newApiSelector);

// ?? API ?????
const oldScriptSetup = `const subscriptionUrl = ref('')
const selectedClient = ref('')`;

const newScriptSetup = `const subscriptionUrl = ref('')
const selectedClient = ref('')
const selectedApi = ref('local')

// ?? API ???
const apiSources = [
  { id: 'local', name: '????', desc: '??????', url: '' },
  { id: 'v1mk', name: 'v1.mk', desc: '????API', url: 'https://api.v1.mk' },
  { id: 'xeton', name: 'xeton.dev', desc: '????API', url: 'https://sub.xeton.dev' },
  { id: 'dler', name: 'dler.io', desc: '????API', url: 'https://api.dler.io' }
]`;

content = content.replace(oldScriptSetup, newScriptSetup);

// ??????????? API
const oldConvertLogic = `// ???? URL
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

    // ????????
    convertedUrl.value = \`\${baseUrl}/api/convert?\${params.toString()}\`

    // ?? API ????
    await new Promise(resolve => setTimeout(resolve, 500))`;

const newConvertLogic = `// ??????? API ?
    const currentApi = apiSources.find(a => a.id === selectedApi.value)
    const baseUrl = currentApi.url || window.location.origin
    
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

    // ?????????????? API
    let success = false
    let currentIndex = apiSources.findIndex(a => a.id === selectedApi.value)
    
    for (let i = 0; i < apiSources.length && !success; i++) {
      const tryApi = apiSources[(currentIndex + i) % apiSources.length]
      const tryUrl = (tryApi.url || window.location.origin) + '/api/convert?' + params.toString()
      
      try {
        const response = await fetch(tryUrl, { method: 'HEAD', mode: 'no-cors' })
        convertedUrl.value = tryUrl
        success = true
        
        if (i > 0) {
          // ?????? API
          selectedApi.value = tryApi.id
          console.log('??????? API:', tryApi.name)
        }
      } catch (e) {
        console.log('API ???:', tryApi.name, e.message)
        if (i === apiSources.length - 1) {
          // ?? API ????????
          convertedUrl.value = window.location.origin + '/api/convert?' + params.toString()
        }
      }
    }`;

content = content.replace(oldConvertLogic, newConvertLogic);

// ????
const oldStyle = `.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>`;

const newStyle = `.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.api-selector {
  margin-bottom: var(--spacing-lg);
}

.api-options {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.api-option {
  display: flex;
  flex-direction: column;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s;
}

.api-option:hover {
  background: rgba(255, 255, 255, 0.1);
}

.api-option.active {
  background: rgba(0, 212, 255, 0.1);
  border-color: var(--color-primary);
}

.api-option input {
  display: none;
}

.api-name {
  font-weight: 600;
  color: var(--color-text);
  font-size: 0.9rem;
}

.api-desc {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  margin-top: 0.25rem;
}
</style>`;

content = content.replace(oldStyle, newStyle);

fs.writeFileSync('src/views/Converter.vue', content, 'utf8');
console.log('Converter.vue updated with backup API');
