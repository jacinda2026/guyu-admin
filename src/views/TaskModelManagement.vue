<template>
  <div class="task-model-management-container">
    <el-card class="model-management-card" shadow="never">
      <template #header>
        <div class="model-management-header">
          <div>
            <div class="section-title-row">
              <div class="section-title">模型通道管理</div>
              <el-tag type="success" effect="light">已启用 {{ enabledModelCount }} / 18</el-tag>
            </div>
            <div class="section-subtitle">3 个大模型通道，每个通道集成 6 个大模型，可按通道管理模型启停与增强能力。</div>
          </div>
          <div class="model-actions">
            <template v-if="activeTab === 'config' && editing">
              <el-button @click="cancelEdit">取消</el-button>
              <el-button type="primary" @click="saveModelConfig">保存</el-button>
            </template>
            <el-button v-else-if="activeTab === 'config'" type="primary" @click="startEdit">编辑</el-button>
          </div>
        </div>
      </template>

      <el-tabs v-model="activeTab" class="model-tabs" @tab-change="handleTabChange">
        <el-tab-pane label="问题情况" name="tasks">
          <div class="channel-list">
            <section
              v-for="channel in modelChannels"
              :key="channel.key"
              class="channel-section"
              :class="{ disabled: !channel.enabled }"
            >
              <div class="channel-header">
                <div class="channel-main">
                  <div class="channel-title-row">
                    <strong>{{ channel.name }}</strong>
                    <el-tag size="small" :type="channel.key === 'standard' ? 'info' : 'primary'">{{ channel.tag }}</el-tag>
                    <el-tag :type="channel.enabled ? 'success' : 'info'" effect="light">
                      {{ channel.enabled ? '通道启用' : '通道停用' }}
                    </el-tag>
                  </div>
                </div>
                <div class="channel-controls">
                  <div class="enabled-count">{{ getChannelQueuedCount(channel) }} 个问题排队</div>
                </div>
              </div>

              <el-table :data="channel.models" border class="model-table">
                <el-table-column label="模型名称" width="160">
                  <template #default="{ row: model }">
                    <div class="model-name-cell">
                      <span class="model-logo" :class="model.logoClass">{{ model.short }}</span>
                      <span class="model-name">{{ model.name }}</span>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column label="排队问题" width="110" align="center">
                  <template #default="{ row: model }">
                    <span class="queue-count" :class="{ warning: model.taskStats.queued >= 200 }">{{ model.taskStats.queued }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="今日计划问题" width="120" align="center">
                  <template #default="{ row: model }">
                    {{ model.taskStats.todayTotal }}
                  </template>
                </el-table-column>
                <el-table-column label="实际完成问题" width="130" align="center">
                  <template #default="{ row: model }">
                    <span class="completed-count">{{ model.taskStats.completed }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="失败问题" width="110" align="center">
                  <template #default="{ row: model }">
                    <span class="failed-count" :class="{ danger: model.taskStats.failed > 0 }">
                      {{ model.taskStats.failed }}
                    </span>
                  </template>
                </el-table-column>
                <el-table-column label="今日负载" min-width="180">
                  <template #default="{ row: model }">
                    <div class="load-meter">
                      <div class="load-bar">
                        <span
                          class="load-bar-fill"
                          :class="{ danger: model.taskStats.load >= 100 }"
                          :style="{ width: `${getLoadBarWidth(model.taskStats.load)}%` }"
                        />
                      </div>
                      <span class="load-text" :class="{ danger: model.taskStats.load >= 100 }">{{ model.taskStats.load }}%</span>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column label="执行状态" width="120" align="center">
                  <template #default="{ row: model }">
                    <el-tag :type="getExecutionStatusType(model.executionStatus)" effect="dark">
                      {{ getExecutionStatusText(model.executionStatus) }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="备注" min-width="220" show-overflow-tooltip>
                  <template #default="{ row: model }">
                    <span
                      class="status-remark"
                      :class="{ danger: model.executionStatus === 'abnormal' }"
                    >
                      {{ model.taskStats.remark || '-' }}
                    </span>
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="100" align="center" fixed="right">
                  <template #default="{ row: model }">
                    <el-button
                      link
                      :type="model.executionStatus === 'abnormal' ? 'danger' : 'primary'"
                      @click="openModelLogs(channel, model)"
                    >
                      查看日志
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
            </section>
          </div>
        </el-tab-pane>

        <el-tab-pane label="模型配置" name="config">
          <div class="channel-list">
            <section
              v-for="channel in modelChannels"
              :key="channel.key"
              class="channel-section"
              :class="{ disabled: !channel.enabled }"
            >
              <div class="channel-header">
                <div class="channel-main">
                  <div class="channel-title-row">
                    <strong>{{ channel.name }}</strong>
                    <el-tag size="small" :type="channel.key === 'standard' ? 'info' : 'primary'">{{ channel.tag }}</el-tag>
                    <el-tag :type="channel.enabled ? 'success' : 'info'" effect="light">
                      {{ channel.enabled ? '通道启用' : '通道停用' }}
                    </el-tag>
                  </div>
                  <div class="channel-description">{{ channel.description }}</div>
                </div>
                <div class="channel-controls">
                  <div class="enabled-count">{{ getChannelEnabledCount(channel) }} / 6 模型启用</div>
                  <el-switch
                    v-model="channel.enabled"
                    :disabled="!editing"
                    active-text="启用"
                    inactive-text="停用"
                    inline-prompt
                  />
                </div>
              </div>

              <el-table :data="channel.models" border class="model-table">
                <el-table-column label="模型名称" width="160">
                  <template #default="{ row: model }">
                    <div class="model-name-cell">
                      <span class="model-logo" :class="model.logoClass">{{ model.short }}</span>
                      <span class="model-name">{{ model.name }}</span>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column label="联网搜索" width="120" align="center">
                  <template #default="{ row: model }">
                    <el-tag :type="model.webSearch ? 'success' : 'info'" effect="light">
                      {{ model.webSearch ? '支持' : '不支持' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="深度思考" width="120" align="center">
                  <template #default="{ row: model }">
                    <el-tag :type="model.deepThinking ? 'success' : 'info'" effect="light">
                      {{ model.deepThinking ? '支持' : '不支持' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="全部截图" width="120" align="center">
                  <template #default="{ row: model }">
                    <el-tag :type="model.allScreenshot ? 'success' : 'info'" effect="light">
                      {{ model.allScreenshot ? '支持' : '不支持' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="提及截图" width="120" align="center">
                  <template #default="{ row: model }">
                    <el-tag :type="model.mentionScreenshot ? 'success' : 'info'" effect="light">
                      {{ model.mentionScreenshot ? '支持' : '不支持' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="分享链接" width="120" align="center">
                  <template #default="{ row: model }">
                    <el-tag :type="model.shareLink ? 'success' : 'info'" effect="light">
                      {{ model.shareLink ? '支持' : '不支持' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="每日负载上限" width="170" align="center">
                  <template #default="{ row: model }">
                    <div class="load-limit-cell">
                      <el-input-number
                        v-if="editingLoadLimitKey === modelRuntimeKey(channel, model)"
                        v-model="model.dailyLoadLimit"
                        :min="1000"
                        :max="999999"
                        :step="100"
                        controls-position="right"
                      />
                      <el-tooltip v-else content="点击编辑" placement="top">
                        <button
                          type="button"
                          class="editable-value"
                          @click="startLoadLimitEdit(channel, model)"
                        >
                          {{ model.dailyLoadLimit.toLocaleString() }}
                        </button>
                      </el-tooltip>
                      <template v-if="editingLoadLimitKey === modelRuntimeKey(channel, model)">
                        <el-button type="primary" link @click="saveLoadLimit(channel, model)">保存</el-button>
                        <el-button link @click="cancelLoadLimitEdit">取消</el-button>
                      </template>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column label="执行状态" width="120" align="center">
                  <template #default="{ row: model }">
                    <el-tag :type="getExecutionStatusType(model.executionStatus)" effect="dark">
                      {{ getExecutionStatusText(model.executionStatus) }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="启用" width="130" align="center">
                  <template #default="{ row: model }">
                    <el-switch
                      v-model="model.enabled"
                      :disabled="!editing || !channel.enabled"
                      active-text="启用"
                      inactive-text="停用"
                      inline-prompt
                    />
                  </template>
                </el-table-column>
              </el-table>
            </section>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <el-dialog v-model="logVisible" :title="logDialogTitle" width="920px">
      <el-table :data="selectedModelLogs" border class="log-table">
        <el-table-column prop="time" label="时间" width="160" />
        <el-table-column prop="type" label="类型" width="110" />
        <el-table-column prop="code" label="错误码" width="170" show-overflow-tooltip />
        <el-table-column prop="message" label="异常信息" min-width="260" show-overflow-tooltip />
        <el-table-column prop="affected" label="影响问题数" width="110" align="center" />
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getLogStatusType(row.status)" effect="plain" size="small">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const taskStatsMap = {
  standard: {
    deepseek: { queued: 86, todayTotal: 1280, completed: 1048, failed: 0, load: 48, remark: '-' },
    moonshot: { queued: 64, todayTotal: 1168, completed: 986, failed: 0, load: 42, remark: '-' },
    doubao: { queued: 128, todayTotal: 1540, completed: 1236, failed: 1, load: 61, remark: '-' },
    qwen: { queued: 72, todayTotal: 1326, completed: 1114, failed: 0, load: 46, remark: '-' },
    hunyuan: { queued: 48, todayTotal: 1094, completed: 972, failed: 0, load: 35, remark: '-' },
    ernie: { queued: 58, todayTotal: 1182, completed: 1026, failed: 0, load: 39, remark: '-' }
  },
  enhanced: {
    deepseek: { queued: 186, todayTotal: 1846, completed: 1384, failed: 2, load: 72, remark: '-' },
    moonshot: { queued: 142, todayTotal: 1732, completed: 1296, failed: 0, load: 66, remark: '-' },
    doubao: { queued: 214, todayTotal: 2108, completed: 1562, failed: 3, load: 84, remark: '-' },
    qwen: { queued: 168, todayTotal: 1905, completed: 1420, failed: 0, load: 70, remark: '-' },
    hunyuan: { queued: 104, todayTotal: 1456, completed: 1188, failed: 0, load: 58, remark: '-' },
    ernie: { queued: 136, todayTotal: 1608, completed: 1264, failed: 1, load: 63, remark: '-' }
  },
  'enhanced-ii': {
    deepseek: { queued: 252, todayTotal: 2360, completed: 1688, failed: 31, load: 128, remark: '队列阻塞，排队问题持续增长' },
    moonshot: { queued: 340, todayTotal: 2184, completed: 928, failed: 10, load: 316, remark: '连续10个问题，重试3次失败' },
    doubao: { queued: 208, todayTotal: 2298, completed: 1716, failed: 0, load: 80, remark: '-' },
    qwen: { queued: 196, todayTotal: 2076, completed: 1584, failed: 7, load: 76, remark: '接口限流，部分问题重试中' },
    hunyuan: { queued: 154, todayTotal: 1824, completed: 1370, failed: 0, load: 68, remark: '-' },
    ernie: { queued: 178, todayTotal: 1940, completed: 1486, failed: 0, load: 71, remark: '-' }
  }
}

const buildModelList = (channelKey, enabled = true, capabilities = {}) => ([
  { key: 'deepseek', name: 'DeepSeek', short: 'DS', logoClass: 'deepseek', executionStatus: 'running', dailyLoadLimit: 3000, enabled, taskStats: taskStatsMap[channelKey].deepseek, ...capabilities },
  { key: 'moonshot', name: 'Kimi', short: 'K', logoClass: 'moonshot', executionStatus: 'running', dailyLoadLimit: 2800, enabled, taskStats: taskStatsMap[channelKey].moonshot, ...capabilities },
  { key: 'doubao', name: '豆包', short: '豆', logoClass: 'doubao', executionStatus: 'running', dailyLoadLimit: 3500, enabled, taskStats: taskStatsMap[channelKey].doubao, ...capabilities },
  { key: 'qwen', name: '通义千问', short: 'Q', logoClass: 'qwen', executionStatus: 'running', dailyLoadLimit: 3200, enabled, taskStats: taskStatsMap[channelKey].qwen, ...capabilities },
  { key: 'hunyuan', name: '腾讯元宝', short: '元', logoClass: 'hunyuan', executionStatus: 'idle', dailyLoadLimit: 2600, enabled, taskStats: taskStatsMap[channelKey].hunyuan, ...capabilities },
  { key: 'ernie', name: '文心一言', short: '文', logoClass: 'ernie', executionStatus: 'idle', dailyLoadLimit: 2600, enabled, taskStats: taskStatsMap[channelKey].ernie, ...capabilities }
])

const standardCapabilities = { webSearch: true, deepThinking: false, allScreenshot: false, mentionScreenshot: false, shareLink: false }
const enhancedCapabilities = { webSearch: true, deepThinking: true, allScreenshot: true, mentionScreenshot: true, shareLink: true }
const fullCapabilities = { webSearch: true, deepThinking: true, allScreenshot: true, mentionScreenshot: true, shareLink: false }

const createModelChannels = () => ([
  {
    key: 'standard',
    name: '标准通道',
    tag: '日常监控',
    description: '含标准能力：联网搜索、答案采集、信源采集',
    enabled: true,
    models: buildModelList('standard', true, standardCapabilities)
  },
  {
    key: 'enhanced',
    name: '增强通道',
    tag: '能力完整',
    description: '含完整能力：联网搜索、答案采集、信源采集、深度思考、全部截图、提及截图',
    enabled: true,
    models: buildModelList('enhanced', true, enhancedCapabilities)
  },
  {
    key: 'enhanced-ii',
    name: '增强通道 II',
    tag: '能力完整',
    description: '含完整能力：联网搜索、答案采集、信源采集、深度思考、全部截图、提及截图',
    enabled: true,
    models: buildModelList('enhanced-ii', true, fullCapabilities).map(model => (
      model.key === 'moonshot' ? { ...model, executionStatus: 'abnormal' } : model
    ))
  }
])

const modelChannels = ref(createModelChannels())
const activeTab = ref('tasks')
const editing = ref(false)
const editingSnapshot = ref('')
const editingLoadLimitKey = ref('')
const loadLimitSnapshot = ref(null)
const logVisible = ref(false)
const selectedLogChannel = ref(null)
const selectedLogModel = ref(null)

const modelLogMap = {
  'standard:deepseek': [
    { time: '2026-05-27 10:20', type: '运行记录', code: 'OK', message: '问题派发正常，接口响应稳定', affected: 0, status: '正常' }
  ],
  'standard:moonshot': [
    { time: '2026-05-27 10:18', type: '运行记录', code: 'OK', message: '问题执行正常，暂无异常', affected: 0, status: '正常' }
  ],
  'enhanced:deepseek': [
    { time: '2026-05-27 10:12', type: '队列积压', code: 'QUEUE_DELAY', message: '截图问题较多，平均等待时间升高', affected: 42, status: '观察中' },
    { time: '2026-05-27 09:56', type: '运行记录', code: 'OK', message: '模型调用成功率 98.6%', affected: 0, status: '正常' }
  ],
  'enhanced:doubao': [
    { time: '2026-05-27 10:16', type: '队列积压', code: 'QUEUE_HIGH', message: '排队量偏高，建议关注完成速度', affected: 58, status: '观察中' }
  ],
  'enhanced-ii:deepseek': [
    { time: '2026-05-27 10:21', type: '队列阻塞', code: 'QUEUE_BLOCKED', message: '排队问题持续增长，实际完成问题增长缓慢', affected: 96, status: '未处理' },
    { time: '2026-05-27 10:08', type: '问题失败', code: 'MODEL_CALL_TIMEOUT', message: '连续调用超时，问题进入重试队列', affected: 31, status: '重试中' }
  ],
  'enhanced-ii:moonshot': [
    { time: '2026-05-27 10:18', type: '欠费', code: 'PAYMENT_REQUIRED', message: '供应商账户余额不足，模型调用持续失败', affected: 64, status: '未处理' },
    { time: '2026-05-27 10:23', type: '问题失败', code: 'MODEL_CALL_FAILED', message: '连续调用失败，问题进入重试队列', affected: 18, status: '重试中' }
  ],
  'enhanced-ii:qwen': [
    { time: '2026-05-27 10:14', type: '接口限流', code: 'RATE_LIMITED', message: '供应商接口触发限流，部分问题延迟重试', affected: 37, status: '重试中' }
  ]
}

const enabledModelCount = computed(() => modelChannels.value.reduce((total, channel) => {
  return total + channel.models.filter(model => channel.enabled && model.enabled).length
}, 0))

const getChannelEnabledCount = (channel) => channel.enabled ? channel.models.filter(model => model.enabled).length : 0
const getChannelQueuedCount = (channel) => channel.models.reduce((total, model) => total + model.taskStats.queued, 0)
const modelRuntimeKey = (channel, model) => `${channel.key}:${model.key}`
const getLoadBarWidth = (load) => Math.min(100, Math.round(load / 3))
const getExecutionStatusText = (status) => {
  const statusMap = {
    running: '执行中',
    idle: '空闲中',
    abnormal: '异常'
  }
  return statusMap[status] || '空闲中'
}
const getExecutionStatusType = (status) => {
  const typeMap = {
    running: 'primary',
    idle: 'success',
    abnormal: 'danger'
  }
  return typeMap[status] || 'info'
}
const selectedModelLogs = computed(() => {
  if (!selectedLogChannel.value || !selectedLogModel.value) return []
  const key = modelRuntimeKey(selectedLogChannel.value, selectedLogModel.value)
  return modelLogMap[key] || [
    { time: '2026-05-27 10:20', type: '运行记录', code: 'OK', message: '问题执行正常，暂无异常', affected: 0, status: '正常' }
  ]
})
const logDialogTitle = computed(() => {
  if (!selectedLogChannel.value || !selectedLogModel.value) return '模型日志'
  return `${selectedLogChannel.value.name} / ${selectedLogModel.value.name} · 模型日志`
})
const getLogStatusType = (status) => {
  const statusMap = {
    正常: 'success',
    观察中: 'warning',
    重试中: 'warning',
    未处理: 'danger'
  }
  return statusMap[status] || 'info'
}
const openModelLogs = (channel, model) => {
  selectedLogChannel.value = channel
  selectedLogModel.value = model
  logVisible.value = true
}

const handleTabChange = () => {
  if (editing.value) cancelEdit()
}

const startEdit = () => {
  cancelLoadLimitEdit()
  editingSnapshot.value = JSON.stringify(modelChannels.value)
  editing.value = true
}

const cancelEdit = () => {
  if (editingSnapshot.value) {
    modelChannels.value = JSON.parse(editingSnapshot.value)
  }
  editing.value = false
  editingSnapshot.value = ''
}

const startLoadLimitEdit = (channel, model) => {
  if (editing.value) return
  editingLoadLimitKey.value = modelRuntimeKey(channel, model)
  loadLimitSnapshot.value = model.dailyLoadLimit
}

const cancelLoadLimitEdit = () => {
  if (!editingLoadLimitKey.value) return
  const [channelKey, modelKey] = editingLoadLimitKey.value.split(':')
  const channel = modelChannels.value.find(item => item.key === channelKey)
  const model = channel?.models.find(item => item.key === modelKey)
  if (model && loadLimitSnapshot.value !== null) {
    model.dailyLoadLimit = loadLimitSnapshot.value
  }
  editingLoadLimitKey.value = ''
  loadLimitSnapshot.value = null
}

const saveLoadLimit = (channel, model) => {
  editingLoadLimitKey.value = ''
  loadLimitSnapshot.value = null
  ElMessage.success(`${channel.name} / ${model.name} 每日负载上限已保存`)
}

const saveModelConfig = () => {
  ElMessageBox.confirm(
    '模型变更会影响客户的监控任务，可能导致采集结果、执行能力和任务稳定性发生变化。是否确认保存？',
    '严重警告',
    {
      confirmButtonText: '确认保存',
      cancelButtonText: '取消',
      type: 'warning',
      dangerouslyUseHTMLString: false
    }
  ).then(() => {
    editing.value = false
    editingSnapshot.value = ''
    ElMessage.success('模型通道配置已保存')
  }).catch(() => {})
}
</script>

<style scoped>
.task-model-management-container { padding: 20px; }
.model-management-card { border-radius: 8px; }
.model-management-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.section-title-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.section-title { font-size: 18px; font-weight: 700; color: #1f2937; line-height: 1.3; }
.section-subtitle { margin-top: 4px; font-size: 13px; color: #64748b; }
.model-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; justify-content: flex-end; }
.model-tabs { margin-top: -4px; }
:deep(.model-tabs .el-tabs__header) { margin: 0 0 10px; }
.channel-list { display: flex; flex-direction: column; gap: 12px; }
.channel-section { border: 1px solid #dbe3ee; border-radius: 8px; background: #ffffff; overflow: hidden; }
.channel-section.disabled { background: #f8fafc; }
.channel-header { display: flex; align-items: center; justify-content: space-between; gap: 18px; padding: 10px 14px; border-bottom: 1px solid #e5edf7; background: #f8fbff; }
.channel-main { min-width: 0; }
.channel-title-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.channel-title-row strong { color: #1f2937; font-size: 16px; }
.channel-description { margin-top: 4px; color: #64748b; font-size: 12px; line-height: 1.4; }
.channel-controls { display: flex; align-items: center; gap: 12px; flex: 0 0 auto; }
.enabled-count { color: #334155; font-size: 13px; font-weight: 700; white-space: nowrap; }
.model-table { margin: 8px 14px 12px; width: calc(100% - 28px); }
.model-name-cell { display: flex; align-items: center; gap: 12px; min-width: 0; }
.model-logo { width: 30px; height: 30px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; flex: 0 0 auto; color: #fff; font-size: 13px; font-weight: 800; }
.model-logo.deepseek { background: #4f6bed; }
.model-logo.moonshot { background: #111827; }
.model-logo.doubao { background: linear-gradient(135deg, #7c3aed, #22d3ee); }
.model-logo.qwen { background: #7c3aed; }
.model-logo.hunyuan { background: #0ea5e9; }
.model-logo.ernie { background: #2563eb; }
.model-name { min-width: 0; color: #1f2937; font-size: 15px; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.load-meter { display: flex; align-items: center; gap: 8px; }
.load-bar { width: 72px; height: 8px; border-radius: 999px; background: #e5e7eb; overflow: hidden; flex: 0 0 auto; }
.load-bar-fill { display: block; height: 100%; border-radius: inherit; background: #2563eb; }
.load-bar-fill.danger { background: #dc2626; }
.load-text { min-width: 42px; color: #334155; font-size: 12px; font-weight: 700; }
.load-text.danger { color: #dc2626; }
.load-limit-cell { display: flex; align-items: center; justify-content: center; gap: 6px; flex-wrap: wrap; }
.load-limit-cell :deep(.el-input-number) { width: 112px; }
.editable-value { padding: 0; border: 0; background: transparent; color: #2563eb; font: inherit; font-weight: 700; cursor: pointer; }
.editable-value:hover { color: #1d4ed8; text-decoration: underline; }
.queue-count { color: #1f2937; font-weight: 700; }
.queue-count.warning { color: #dc2626; }
.completed-count { color: #059669; font-weight: 700; }
.failed-count { color: #94a3b8; font-weight: 700; }
.failed-count.danger { color: #dc2626; }
.status-remark { color: #64748b; font-size: 13px; }
.status-remark.danger { color: #dc2626; font-weight: 700; }
.log-table { width: 100%; }
:deep(.model-table .el-table__cell) { padding: 6px 0; }
:deep(.model-table .el-table__header .el-table__cell) { padding: 7px 0; }

@media (max-width: 768px) {
  .model-management-header { flex-direction: column; align-items: stretch; }
  .model-actions { justify-content: flex-start; }
  .channel-header { flex-direction: column; align-items: stretch; }
  .channel-controls { flex-wrap: wrap; }
  .model-table { margin: 12px; width: calc(100% - 24px); }
}
</style>
