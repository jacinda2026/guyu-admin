<template>
  <div class="page-container">
    <div class="page-header">
      <div class="header-info">
        <h2>模型与数据源中台</h2>
        <p class="subtitle">表格化管控全平台大模型渠道与社交媒体 AI 问答流，支持多源路由切换</p>
      </div>
      <el-button type="primary" size="default" @click="handleAdd">+ 接入新通道</el-button>
    </div>

    <el-row :gutter="24" class="layout-body">
      <el-col :span="6">
        <el-card shadow="never" class="control-panel">
          <div class="panel-section">
            <h4 class="section-title">技术形态分类</h4>
            <div class="vertical-menu">
              <div :class="['menu-item', typeFilter === 'all' ? 'is-active' : '']" @click="typeFilter = 'all'">
                <span>全部平台</span>
                <el-tag size="small" type="info" round>{{ platformList.length }}</el-tag>
              </div>
              <div :class="['menu-item', typeFilter === 'LLM' ? 'is-active' : '']" @click="typeFilter = 'LLM'">
                <span>原生大模型 API</span>
                <el-tag size="small" type="primary" round>{{ platformList.filter(p => p.type === 'LLM').length }}</el-tag>
              </div>
              <div :class="['menu-item', typeFilter === 'SOCIAL' ? 'is-active' : '']" @click="typeFilter = 'SOCIAL'">
                <span>社交媒体 AI 问答</span>
                <el-tag size="small" type="warning" round>{{ platformList.filter(p => p.type === 'SOCIAL').length }}</el-tag>
              </div>
            </div>
          </div>

          <el-divider />

          <div class="panel-section">
            <h4 class="section-title">地域合规分类</h4>
            <el-radio-group v-model="regionFilter" size="default" class="vertical-radio">
              <el-radio-button label="all">全部区域</el-radio-button>
              <el-radio-button label="domestic">国内合规平台</el-radio-button>
              <el-radio-button label="overseas">国外数据源</el-radio-button>
            </el-radio-group>
          </div>

          <el-divider />

          <div class="panel-section">
            <h4 class="section-title">接口账单来源</h4>
            <el-select v-model="activeSource" style="width: 100%">
              <el-option v-for="s in sourceTypes" :key="s.value" :label="s.label" :value="s.label" />
            </el-select>
          </div>
        </el-card>
      </el-col>

      <el-col :span="18">
        <el-card shadow="never" class="table-card-wrapper">
          <el-table 
            :data="filteredPlatformList" 
            style="width: 100%" 
            stripe
            class="custom-pure-table"
          >
            <el-table-column type="index" label="序号" width="65" align="center" />

            <el-table-column label="状态" width="60" align="center">
              <template #default="{ row }">
                <div v-if="getConfig(activeSource, row.key)" class="status-indicator">
                  <span :class="['dot', getConfig(activeSource, row.key).enabled ? 'active' : 'inactive']"></span>
                </div>
                <span v-else class="text-gray">-</span>
              </template>
            </el-table-column>

            <el-table-column label="平台/模型名称" min-width="160">
              <template #default="{ row }">
                <div class="brand-column">
                  <span class="platform-name">{{ row.name }}</span>
                  <span class="model-code">{{ row.model }}</span>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="技术与地域分类" width="180">
              <template #default="{ row }">
                <div class="tags-column">
                  <el-tag size="small" :type="row.type === 'LLM' ? 'primary' : 'warning'" effect="light">
                    {{ row.type === 'LLM' ? '大模型' : '社媒AI' }}
                  </el-tag>
                  <el-tag size="small" :type="row.region === '国内' ? 'success' : 'danger'" effect="plain">
                    {{ row.region }}
                  </el-tag>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="已接入通道名" min-width="150" show-overflow-tooltip>
              <template #default="{ row }">
                <span v-if="getConfig(activeSource, row.key)" class="channel-title">
                  {{ getConfig(activeSource, row.key).title }}
                </span>
                <span v-else class="unconfigured-text">未接入</span>
              </template>
            </el-table-column>

            <el-table-column label="调度配置 (模式/RPM/权重/优先级)" min-width="240">
              <template #default="{ row }">
                <div v-if="getConfig(activeSource, row.key)" class="quota-table-cell">
                  <el-tag size="small" type="info" class="mode-tag">
                    {{ getConfig(activeSource, row.key).channelType }}
                  </el-tag>
                  <div class="quota-numbers">
                    <span>RPM: <strong>{{ getConfig(activeSource, row.key).rpm }}</strong></span>
                    <span>权重: <strong class="text-orange">{{ getConfig(activeSource, row.key).weight }}%</strong></span>
                    <span>级: <span :class="['priority-badge', getPriorityClass(getConfig(activeSource, row.key).priority)]">{{ getPriorityLabel(getConfig(activeSource, row.key).priority) }}</span></span>
                  </div>
                </div>
                <span v-else class="unconfigured-text">等待配置接入...</span>
              </template>
            </el-table-column>

            <el-table-column label="操作" width="220" fixed="right" align="right">
              <template #default="{ row }">
                <template v-if="getConfig(activeSource, row.key)">
                  <el-button type="primary" link @click="testChannel(getConfig(activeSource, row.key))">测试</el-button>
                  <el-divider direction="vertical" />
                  <el-switch 
                    v-model="getConfig(activeSource, row.key).enabled" 
                    inline-prompt
                    active-text="启"
                    inactive-text="停"
                    size="small"
                    @change="handleStatusChange(getConfig(activeSource, row.key))"
                  />
                  <el-divider direction="vertical" />
                  <el-button type="primary" link @click="handleEdit(getConfig(activeSource, row.key))">编辑</el-button>
                  <el-divider direction="vertical" />
                  <el-button type="danger" link @click="handleDelete(getConfig(activeSource, row.key))">解绑</el-button>
                </template>
                <template v-else>
                  <el-button type="primary" plain size="small" @click="quickAdd(activeSource, row)">
                    + 快速接入
                  </el-button>
                </template>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑渠道/数据源配置' : '新增渠道/数据源配置'" width="600px">
      <el-form :model="form" label-width="120px" label-position="left">
        <el-form-item label="接口来源" required>
          <el-select v-model="form.source" style="width: 100%">
            <el-option v-for="s in sourceTypes" :key="s.value" :label="s.label" :value="s.label" />
          </el-select>
        </el-form-item>
        <el-form-item label="挂载目标平台" required>
          <el-select v-model="form.platformKey" placeholder="选择原生模型或社媒AI平台" style="width: 100%">
            <el-option v-for="p in platformList" :key="p.key" :label="`[${p.region}-${p.type === 'LLM'?'大模型':'社媒'}] ${p.name}`" :value="p.key" />
          </el-select>
        </el-form-item>
        <el-form-item label="自定义通道名" required>
          <el-input v-model="form.title" placeholder="如：小红书AI搜索脚本源" />
        </el-form-item>
        <el-form-item label="数据获取模式" required>
          <el-select v-model="form.channelType" placeholder="选择协议或流类型" style="width: 100%">
            <el-option label="官方原生 API" value="官方原生" />
            <el-option label="Microsoft Azure 企业通道" value="Microsoft Azure" />
            <el-option label="自动化模拟(Web/App 爬虫自动化流水线)" value="自动化模拟流" />
            <el-option label="第三方中转/聚合平台" value="聚合中转" />
          </el-select>
        </el-form-item>
        <el-form-item label="网关 Base URL">
          <el-input v-model="form.baseUrl" placeholder="不填则走系统默认内置端点" />
        </el-form-item>
        <el-form-item label="凭证/API Key/Cookie" required>
          <el-input v-model="form.apiKey" type="password" show-password placeholder="请输入专属配置密钥或Session凭证" />
        </el-form-item>
        <el-divider content-position="left">高级频控、路由权重与分配</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="RPM 限制上限">
              <el-input-number v-model="form.rpm" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="最大并发数">
              <el-input-number v-model="form.concurrency" :min="1" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="负载路由权重%">
              <el-input-number v-model="form.weight" :min="0" :max="100" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="任务优先级">
              <el-radio-group v-model="form.priority">
                <el-radio :label="1">低</el-radio>
                <el-radio :label="2">中</el-radio>
                <el-radio :label="3">高</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="是否立刻启用">
          <el-switch v-model="form.enabled" active-text="激活" inactive-text="挂起" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">保存并投产</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const typeFilter = ref('all')
const regionFilter = ref('all')
const activeSource = ref('官方API')

const platformList = [
  { name: 'DeepSeek', model: 'DeepSeek-V3/R1', key: 'deepseek', region: '国内', type: 'LLM' },
  { name: 'Kimi', model: 'Moonshot-v1', key: 'kimi', region: '国内', type: 'LLM' },
  { name: '豆包', model: 'Doubao-pro', key: 'doubao', region: '国内', type: 'LLM' },
  { name: '通义千问', model: 'Qwen-max', key: 'qwen', region: '国内', type: 'LLM' },
  { name: '文心一言', model: 'Ernie-4.0', key: 'ernie', region: '国内', type: 'LLM' },
  { name: '腾讯元宝', model: 'Hunyuan-pro', key: 'hunyuan', region: '国内', type: 'LLM' },
  { name: 'ChatGPT', model: 'gpt-4o', key: 'openai', region: '国外', type: 'LLM' },
  { name: 'Claude', model: 'claude-3-5', key: 'claude', region: '国外', type: 'LLM' },
  { name: 'Perplexity', model: 'sonar-reasoning', key: 'perplexity', region: '国外', type: 'LLM' },
  { name: 'Google AIO', model: 'Gemini-1.5-Pro', key: 'google_aio', region: '国外', type: 'LLM' },
  { name: 'Grok', model: 'Grok-2', key: 'grok', region: '国外', type: 'LLM' },
  { name: '小红书 (AI 搜索助手)', model: '小红书内置模型', key: 'xhs_ai', region: '国内', type: 'SOCIAL' },
  { name: '知乎 (知乎直答)', model: '知海图 AI', key: 'zhihu_ai', region: '国内', type: 'SOCIAL' },
  { name: '抖音 (AI 搜索)', model: '火山引擎社媒专线', key: 'douyin_ai', region: '国内', type: 'SOCIAL' },
  { name: 'Reddit (AI Summaries)', model: 'Reddit-LLM层', key: 'reddit_ai', region: '国外', type: 'SOCIAL' },
  { name: 'X.com (Grok 信息流问答)', model: 'X-Grok-Stream', key: 'x_ai', region: '国外', type: 'SOCIAL' },
  { name: 'TikTok (TikTok AI Search)', model: 'TikTok-Global-Model', key: 'tiktok_ai', region: '国外', type: 'SOCIAL' }
]

const sourceTypes = [
  { label: '官方API', value: 'official' },
  { label: '新零售平台', value: 'aggregator' },
  { label: '模力平台', value: 'private' }
]

const apiKeys = ref([
  { id: 1, title: 'DeepSeek官方密钥', platformKey: 'deepseek', source: '官方API', enabled: true, rpm: 60, concurrency: 5, priority: 3, channelType: '官方原生', weight: 100 },
  { id: 2, title: '小红书自动化监测流', platformKey: 'xhs_ai', source: '官方API', enabled: true, rpm: 15, concurrency: 1, priority: 2, channelType: '自动化模拟流', weight: 100 },
  { id: 3, title: 'Perplexity中转通道', platformKey: 'perplexity', source: '新零售平台', enabled: true, rpm: 45, concurrency: 4, priority: 2, channelType: '聚合中转', weight: 50 }
])

const filteredPlatformList = computed(() => {
  return platformList.filter(p => {
    const matchType = typeFilter.value === 'all' || p.type === typeFilter.value
    const regionMap = { domestic: '国内', overseas: '国外' }
    const matchRegion = regionFilter.value === 'all' || p.region === regionMap[regionFilter.value]
    return matchType && matchRegion
  })
})

const getConfig = (sourceLabel, platformKey) => {
  return apiKeys.value.find(k => k.source === sourceLabel && k.platformKey === platformKey)
}

const getPriorityLabel = (val) => {
  return { 1: '低', 2: '中', 3: '高' }[val] || '中'
}

const getPriorityClass = (val) => {
  return { 1: 'b-low', 2: 'b-mid', 3: 'b-high' }[val] || 'b-mid'
}

const handleStatusChange = (item) => {
  ElMessage({ message: `[${item.title}] 通道调度状态已同步`, type: item.enabled ? 'success' : 'warning' })
}

const testChannel = (item) => {
  ElMessage.info(`正在通过 [${item.channelType}] 探活...`)
  setTimeout(() => {
    ElMessage.success(`[${item.title}] 连通正常，延迟: ${Math.floor(Math.random() * 120) + 70}ms`)
  }, 600)
}

const dialogVisible = ref(false)
const isEdit = ref(false)
const form = reactive({ id: null, title: '', platformKey: '', source: '', apiKey: '', baseUrl: '', enabled: true, rpm: 0, concurrency: 1, priority: 2, channelType: '官方原生', weight: 100 })

const handleAdd = () => {
  isEdit.value = false
  Object.assign(form, { id: null, title: '', platformKey: 'deepseek', source: activeSource.value, apiKey: '', baseUrl: '', enabled: true, rpm: 0, concurrency: 1, priority: 2, channelType: '官方原生', weight: 100 })
  dialogVisible.value = true
}

const quickAdd = (sourceLabel, platform) => {
  isEdit.value = false
  Object.assign(form, { id: null, title: platform.name + '专属通道', platformKey: platform.key, source: sourceLabel, apiKey: '', baseUrl: '', enabled: true, rpm: 0, concurrency: 1, priority: 2, channelType: platform.type === 'SOCIAL' ? '自动化模拟流' : '官方原生', weight: 100 })
  dialogVisible.value = true
}

const handleEdit = (item) => {
  isEdit.value = true
  Object.assign(form, { ...item })
  dialogVisible.value = true
}

const submitForm = () => {
  if (isEdit.value) {
    const idx = apiKeys.value.findIndex(k => k.id === form.id)
    apiKeys.value[idx] = { ...form }
    ElMessage.success('配置已更新')
  } else {
    apiKeys.value.push({ ...form, id: Date.now() })
    ElMessage.success('全新数据通道已成功载入')
  }
  dialogVisible.value = false
}

const handleDelete = (item) => {
  ElMessageBox.confirm(`确认解绑威胁移除 [${item.title}] 吗？`, '警告', { type: 'warning' }).then(() => {
    apiKeys.value = apiKeys.value.filter(k => k.id !== item.id)
    ElMessage.success('已安全下线')
  })
}
</script>

<style scoped>
.page-container { padding: 24px; background-color: #f5f7fa; min-height: 100vh; }
.page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; }
.header-info h2 { margin: 0; font-size: 22px; color: #303133; font-weight: 600; }
.subtitle { margin: 6px 0 0; color: #909399; font-size: 14px; }

.layout-body { margin-top: 20px; }

/* 左侧控制台面板 */
.control-panel { border: none; border-radius: 8px; background: #fff; padding: 10px; }
.section-title { font-size: 14px; color: #303133; margin: 0 0 16px 0; font-weight: 600; }
.vertical-menu { display: flex; flex-direction: column; gap: 8px; }
.menu-item { 
  display: flex; justify-content: space-between; align-items: center; 
  padding: 12px 16px; border-radius: 6px; cursor: pointer; font-size: 14px; color: #606266;
  transition: all 0.2s;
}
.menu-item:hover { background: #f5f7fa; color: #2b65f0; }
.menu-item.is-active { background: #e8f0fe; color: #2b65f0; font-weight: bold; }

.vertical-radio :deep(.el-radio-button) { display: block; width: 100%; margin-bottom: 6px; }
.vertical-radio :deep(.el-radio-button__inner) { display: block; width: 100%; border-radius: 4px !important; border: 1px solid #dcdfe6; border-left: 1px solid #dcdfe6; text-align: left; padding: 10px 16px; }
.vertical-radio :deep(.el-radio-button__orig-radio:checked + .el-radio-button__inner) { background-color: #2b65f0; border-color: #2b65f0; box-shadow: none; }

/* 右侧表格容器 */
.table-card-wrapper { border: none; border-radius: 8px; background: #fff; }

/* 纯表体内的细节对齐样式 */
.brand-column { display: flex; flex-direction: column; gap: 4px; }
.platform-name { font-weight: bold; color: #303133; font-size: 14px; }
.model-code { font-size: 11px; color: #909399; font-family: monospace; }

.tags-column { display: flex; gap: 6px; align-items: center; }

.channel-title { font-size: 13px; font-weight: bold; color: #303133; }
.unconfigured-text { font-size: 13px; color: #c0c4cc; font-style: italic; }

.quota-table-cell { display: flex; align-items: center; gap: 12px; }
.quota-numbers { display: flex; align-items: center; gap: 12px; font-size: 12px; color: #606266; }
.quota-numbers strong { color: #2b65f0; font-family: monospace; }
.text-orange { color: #e6a23c !important; }

/* 状态小圆点 */
.status-indicator { display: flex; justify-content: center; align-items: center; }
.dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
.dot.active { background: #67c23a; box-shadow: 0 0 6px #67c23a; }
.dot.inactive { background: #909399; }

.text-gray { color: #c0c4cc; }

/* 优先级小角标 */
.priority-badge { font-size: 11px; font-weight: bold; padding: 1px 4px; border-radius: 2px; }
.b-low { color: #909399; background: #f4f4f5; }
.b-mid { color: #e6a23c; background: #fdf6ec; }
.b-high { color: #f56c6c; background: #fef0f0; }

/* 表头背景优化 */
:deep(.el-table th.el-table__cell) { background-color: #fafafa !important; color: #303133; font-weight: 600; }
</style>