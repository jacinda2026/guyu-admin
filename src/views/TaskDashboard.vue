<template>
  <section class="realtime-dashboard">
    <div class="page-head">
      <div>
        <button v-if="viewMode !== 'list'" type="button" class="back-link" @click="backToPrevious">{{ backText }}</button>
        <h2>{{ pageTitle }}</h2>
        <p>{{ pageDesc }}</p>
      </div>
      <div class="refresh-badge">
        <span class="pulse-dot"></span>
        {{ lastRefreshAt }} 自动刷新
      </div>
    </div>

    <el-row v-if="viewMode === 'list'" :gutter="16" class="metric-row">
      <el-col :span="6" v-for="metric in metrics" :key="metric.label">
        <el-card shadow="never" class="metric-card">
          <div class="metric-icon" :class="metric.type">
            <el-icon><component :is="metric.icon" /></el-icon>
          </div>
          <div>
            <div class="metric-value">{{ metric.value }}</div>
            <div class="metric-label">{{ metric.label }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <template v-if="viewMode === 'list'">
    <el-card shadow="never" class="panel-card">
      <div class="panel-toolbar">
        <div>
          <span class="panel-title">执行中 / 排队中项目</span>
          <el-tag size="small" effect="plain">共 {{ visibleProjectCount }} 个</el-tag>
        </div>
        <div class="toolbar-right">
          <el-select v-model="filters.status" placeholder="项目状态" clearable style="width: 130px">
            <el-option label="执行中" value="running" />
            <el-option label="排队中" value="queued" />
            <el-option label="异常" value="error" />
          </el-select>
          <el-input v-model="filters.keyword" placeholder="搜索项目/用户" clearable style="width: 190px">
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
        </div>
      </div>

      <el-table :data="filteredProjects" class="monitor-table project-table" height="310">
        <el-table-column label="调度项目" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">
            <button type="button" class="project-link" @click="openProjectDetail(row)">{{ row.name }}</button>
          </template>
        </el-table-column>
        <el-table-column label="监控模型" min-width="170">
          <template #default="{ row }">
            <div class="model-badges">
              <el-tooltip v-for="model in row.models" :key="model.model" :content="model.model" placement="top">
                <span class="model-badge" :class="getModelClass(model.model)">{{ getModelShortName(model.model) }}</span>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="userName" label="用户" width="96" />
        <el-table-column label="项目状态" width="98" align="center">
          <template #default="{ row }">
            <el-tag :type="getProjectStatusType(row.status)" effect="plain">{{ getProjectStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="执行 / 计划时间" width="172">
          <template #default="{ row }">
            <span v-if="row.status === 'queued'">{{ row.planTime }}</span>
            <span v-else>{{ row.executionTime }}</span>
          </template>
        </el-table-column>
        <el-table-column label="总问题数" width="90" align="center">
          <template #default="{ row }">{{ row.questionCount }}</template>
        </el-table-column>
        <el-table-column label="任务进度" min-width="210">
          <template #default="{ row }">
            <div class="progress-cell">
              <el-progress :percentage="getProjectProgress(row)" :stroke-width="8" />
              <span>{{ row.completed }}/{{ row.totalModelTasks }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="queuedTasks" label="排队任务" width="92" align="center" />
        <el-table-column prop="failed" label="失败数" width="82" align="center" />
      </el-table>
    </el-card>

    <el-card shadow="never" class="panel-card">
      <div class="panel-toolbar">
        <div>
          <span class="panel-title">模型排队压力</span>
          <el-tag size="small" effect="plain">按模型队列聚合</el-tag>
        </div>
      </div>

      <el-table :data="modelQueueRows" class="monitor-table" height="292">
        <el-table-column prop="model" label="模型" width="120" />
        <el-table-column prop="channel" label="通道" width="126" />
        <el-table-column label="队列情况" min-width="260">
          <template #default="{ row }">
            <div class="queue-summary">
              <span>高 {{ row.priority.high }}</span>
              <span>中 {{ row.priority.medium }}</span>
              <span>低 {{ row.priority.low }}</span>
              <strong>合计 {{ row.queued }}</strong>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="队列优先级" min-width="210">
          <template #default="{ row }">
            <div class="priority-stack">
              <span class="high" :style="{ width: getPriorityWidth(row, 'high') }"></span>
              <span class="medium" :style="{ width: getPriorityWidth(row, 'medium') }"></span>
              <span class="low" :style="{ width: getPriorityWidth(row, 'low') }"></span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="waitingTime" label="最长等待" width="110" align="center" />
        <el-table-column prop="todayPlan" label="今日计划" width="100" align="center" />
        <el-table-column label="今日负载" width="136" align="center">
          <template #default="{ row }">
            <span :class="['load-text', { danger: row.load >= 180 }]">{{ row.load }}%</span>
          </template>
        </el-table-column>
        <el-table-column label="执行状态" width="96" align="center">
          <template #default="{ row }">
            <el-tag :type="getProjectStatusType(row.status)" effect="plain">{{ getProjectStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    </template>

    <el-row v-else-if="viewMode === 'detail'" :gutter="16" class="content-row">
      <el-col :span="24">
        <el-card shadow="never" class="panel-card">
          <div class="panel-toolbar compact">
            <div>
              <span class="panel-title">{{ selectedProject.name }} · 任务进度</span>
              <el-tag size="small" effect="plain">{{ selectedProject.questionCount }} 个问题</el-tag>
            </div>
            <el-button type="primary" size="small" @click="openTaskList">详情</el-button>
          </div>

          <el-table :data="selectedProject.models" class="monitor-table" height="420">
            <el-table-column prop="model" label="模型" width="140" />
            <el-table-column prop="channel" label="通道" width="150" show-overflow-tooltip />
            <el-table-column label="进度" min-width="170">
              <template #default="{ row }">
                <div class="progress-cell compact-progress">
                  <el-progress :percentage="getModelProgress(row)" :stroke-width="8" />
                  <span>{{ row.completed }}/{{ row.total }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="queued" label="排队" width="70" align="center" />
            <el-table-column label="状态" width="90" align="center">
              <template #default="{ row }">
                <el-tag :type="getProjectStatusType(row.status)" effect="plain">{{ getProjectStatusText(row.status) }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <template v-else>
      <el-card shadow="never" class="panel-card">
        <div class="panel-toolbar compact">
          <div>
            <span class="panel-title">任务列表</span>
            <el-tag size="small" effect="plain">共 {{ selectedQuestionRows.length }} 条任务</el-tag>
          </div>
        </div>

        <el-table :data="selectedQuestionRows" class="monitor-table" height="520">
          <el-table-column prop="no" label="No." width="64" align="center" />
          <el-table-column prop="question" label="问题内容" min-width="220" show-overflow-tooltip />
          <el-table-column prop="channelType" label="通道类型" width="104" align="center" />
          <el-table-column prop="modelCode" label="模型代码" width="118" align="center">
            <template #default="{ row }"><el-tag type="success" effect="plain">{{ row.modelCode }}</el-tag></template>
          </el-table-column>
          <el-table-column label="深度思索" width="88" align="center">
            <template #default="{ row }"><span :class="row.deepThinking ? 'cap-yes' : 'cap-no'">{{ row.deepThinking ? '√' : 'x' }}</span></template>
          </el-table-column>
          <el-table-column label="全部截图" width="88" align="center">
            <template #default="{ row }"><span :class="row.allScreenshot ? 'cap-yes' : 'cap-no'">{{ row.allScreenshot ? '√' : 'x' }}</span></template>
          </el-table-column>
          <el-table-column label="截图" width="72" align="center">
            <template #default="{ row }"><span :class="row.screenshot ? 'cap-yes' : 'cap-no'">{{ row.screenshot ? '√' : 'x' }}</span></template>
          </el-table-column>
          <el-table-column label="分享链接" width="88" align="center">
            <template #default="{ row }"><span :class="row.shareLink ? 'cap-yes' : 'cap-no'">{{ row.shareLink ? '√' : 'x' }}</span></template>
          </el-table-column>
          <el-table-column label="状态" width="90" align="center">
            <template #default="{ row }">
              <el-tag :type="getTaskStatusType(row.status)" effect="plain">{{ getTaskStatusText(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="priority" label="优先级" width="82" align="center">
            <template #default="{ row }">
              <el-tag :type="row.priority >= 0 ? 'success' : 'warning'" effect="plain">{{ row.priority }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="retry" label="重试次数" width="96" align="center" />
          <el-table-column prop="createdAt" label="创建时间" width="160" />
          <el-table-column prop="finishedAt" label="完成时间" width="160">
            <template #default="{ row }">{{ row.finishedAt || '-' }}</template>
          </el-table-column>
          <el-table-column label="操作" width="90" align="center" fixed="right">
            <template #default>
              <el-button size="small" type="primary">详情</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </template>
  </section>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { Loading, Search, Tickets, VideoPlay, Warning } from '@element-plus/icons-vue'
import { useTaskStore } from '../store/task'

const taskStore = useTaskStore()

const filters = reactive({
  status: '',
  keyword: ''
})

const viewMode = ref('list')

const projects = ref([
  {
    id: 1,
    name: '初敏保湿霜',
    userName: '林雪',
    status: 'running',
    executionTime: '2026-05-26 00:00:29',
    planTime: '',
    questionCount: 200,
    failed: 0,
    models: [
      { model: 'DeepSeek', channel: '标准通道', status: 'running', total: 200, completed: 166, queued: 34 },
      { model: 'Kimi', channel: '增强通道', status: 'running', total: 200, completed: 142, queued: 58 },
      { model: '豆包', channel: '增强通道', status: 'running', total: 200, completed: 121, queued: 79 },
      { model: '通义千问', channel: '增强通道 II', status: 'running', total: 200, completed: 108, queued: 92 },
      { model: '腾讯元宝', channel: '标准通道', status: 'running', total: 200, completed: 96, queued: 104 },
      { model: '文心一言', channel: '增强通道 II', status: 'error', total: 200, completed: 73, queued: 127 }
    ]
  },
  {
    id: 2,
    name: '谷雨AI',
    userName: '周宁',
    status: 'running',
    executionTime: '2026-05-26 00:00:29',
    planTime: '',
    questionCount: 186,
    failed: 0,
    models: [
      { model: 'DeepSeek', channel: '标准通道', status: 'running', total: 186, completed: 124, queued: 62 },
      { model: 'Kimi', channel: '增强通道', status: 'running', total: 186, completed: 119, queued: 67 },
      { model: '豆包', channel: '增强通道', status: 'running', total: 186, completed: 136, queued: 50 },
      { model: '通义千问', channel: '增强通道 II', status: 'running', total: 186, completed: 101, queued: 85 },
      { model: '腾讯元宝', channel: '标准通道', status: 'running', total: 186, completed: 94, queued: 92 },
      { model: '文心一言', channel: '增强通道 II', status: 'running', total: 186, completed: 116, queued: 70 }
    ]
  },
  {
    id: 3,
    name: '贵州茅台',
    userName: '赵晨',
    status: 'queued',
    executionTime: '',
    planTime: '2026-05-26 12:00:00',
    questionCount: 186,
    failed: 0,
    models: [
      { model: 'DeepSeek', channel: '标准通道', status: 'queued', total: 186, completed: 0, queued: 186 },
      { model: 'Kimi', channel: '增强通道', status: 'queued', total: 186, completed: 0, queued: 186 },
      { model: '豆包', channel: '增强通道', status: 'queued', total: 186, completed: 0, queued: 186 },
      { model: '通义千问', channel: '增强通道 II', status: 'queued', total: 186, completed: 0, queued: 186 },
      { model: '腾讯元宝', channel: '标准通道', status: 'queued', total: 186, completed: 0, queued: 186 },
      { model: '文心一言', channel: '增强通道 II', status: 'queued', total: 186, completed: 0, queued: 186 }
    ]
  },
  {
    id: 4,
    name: '小米汽车SU7',
    userName: '王悦',
    status: 'running',
    executionTime: '2026-05-26 00:01:12',
    planTime: '',
    questionCount: 186,
    failed: 0,
    models: [
      { model: 'DeepSeek', channel: '标准通道', status: 'running', total: 186, completed: 111, queued: 75 },
      { model: 'Kimi', channel: '增强通道', status: 'running', total: 186, completed: 107, queued: 79 },
      { model: '豆包', channel: '增强通道', status: 'running', total: 186, completed: 91, queued: 95 },
      { model: '通义千问', channel: '增强通道 II', status: 'running', total: 186, completed: 99, queued: 87 },
      { model: '腾讯元宝', channel: '标准通道', status: 'running', total: 186, completed: 83, queued: 103 },
      { model: '文心一言', channel: '增强通道 II', status: 'running', total: 186, completed: 88, queued: 98 }
    ]
  },
  {
    id: 5,
    name: '卓牧羊奶粉GEO优化',
    userName: '刘洋',
    status: 'queued',
    executionTime: '',
    planTime: '2026-05-27 00:00:00',
    questionCount: 186,
    failed: 0,
    models: [
      { model: 'DeepSeek', channel: '标准通道', status: 'queued', total: 186, completed: 0, queued: 186 },
      { model: 'Kimi', channel: '增强通道', status: 'queued', total: 186, completed: 0, queued: 186 },
      { model: '豆包', channel: '增强通道', status: 'queued', total: 186, completed: 0, queued: 186 },
      { model: '通义千问', channel: '增强通道 II', status: 'queued', total: 186, completed: 0, queued: 186 },
      { model: '腾讯元宝', channel: '标准通道', status: 'queued', total: 186, completed: 0, queued: 186 },
      { model: '文心一言', channel: '增强通道 II', status: 'queued', total: 186, completed: 0, queued: 186 }
    ]
  }
])

const selectedProjectId = ref(1)

const questionRows = ref([
  { projectId: 1, no: 1, question: '湿疹宝宝保湿霜哪个牌子效果好', channelType: '增强通道', modelCode: 'deepseek', deepThinking: true, allScreenshot: true, screenshot: true, shareLink: true, status: 'completed', priority: -9, retry: '0 / 3', createdAt: '2026-05-26 00:00:29', finishedAt: '2026-05-26 00:01:12' },
  { projectId: 1, no: 2, question: '湿疹宝宝反复瘙痒用哪个面霜好', channelType: '增强通道 II', modelCode: 'wenxin', deepThinking: true, allScreenshot: true, screenshot: true, shareLink: false, status: 'completed', priority: 6, retry: '0 / 3', createdAt: '2026-05-26 00:00:30', finishedAt: '2026-05-26 00:01:18' },
  { projectId: 1, no: 3, question: '湿疹宝宝保湿霜哪个牌子效果好', channelType: '标准通道', modelCode: 'hunyuan', deepThinking: false, allScreenshot: false, screenshot: false, shareLink: false, status: 'completed', priority: -5, retry: '0 / 3', createdAt: '2026-05-26 00:00:29', finishedAt: '2026-05-26 00:01:06' },
  { projectId: 1, no: 4, question: '宝宝湿疹护理膏哪个牌子好用', channelType: '增强通道', modelCode: 'wenxin', deepThinking: true, allScreenshot: true, screenshot: true, shareLink: true, status: 'running', priority: 6, retry: '0 / 3', createdAt: '2026-05-26 00:00:29', finishedAt: '' },
  { projectId: 1, no: 5, question: '宝宝湿疹无激素面霜哪个牌子好', channelType: '增强通道 II', modelCode: 'wenxin', deepThinking: true, allScreenshot: true, screenshot: true, shareLink: false, status: 'pending', priority: -9, retry: '0 / 3', createdAt: '2026-05-26 00:00:29', finishedAt: '' },
  { projectId: 1, no: 6, question: '儿童湿疹舒缓霜什么牌子有效', channelType: '标准通道', modelCode: 'doubao', deepThinking: false, allScreenshot: false, screenshot: false, shareLink: false, status: 'completed', priority: -4, retry: '0 / 3', createdAt: '2026-05-26 00:00:29', finishedAt: '2026-05-26 00:01:04' },
  { projectId: 1, no: 7, question: '宝宝湿疹护理膏哪个牌子好用', channelType: '增强通道', modelCode: 'doubao', deepThinking: true, allScreenshot: true, screenshot: true, shareLink: true, status: 'completed', priority: 2, retry: '0 / 3', createdAt: '2026-05-26 00:00:29', finishedAt: '2026-05-26 00:01:10' },
  { projectId: 1, no: 8, question: '儿童湿疹止痒润肤霜排行榜', channelType: '增强通道 II', modelCode: 'hunyuan', deepThinking: true, allScreenshot: true, screenshot: true, shareLink: false, status: 'completed', priority: 10, retry: '0 / 3', createdAt: '2026-05-26 00:00:30', finishedAt: '2026-05-26 00:01:17' },
  { projectId: 2, no: 1, question: '谷雨AI品牌声量近期表现', channelType: '增强通道', modelCode: 'kimi', deepThinking: true, allScreenshot: true, screenshot: true, shareLink: true, status: 'running', priority: 5, retry: '0 / 3', createdAt: '2026-05-26 00:01:04', finishedAt: '' },
  { projectId: 4, no: 1, question: '小米汽车SU7用户口碑分析', channelType: '增强通道 II', modelCode: 'tongyi', deepThinking: true, allScreenshot: true, screenshot: true, shareLink: false, status: 'running', priority: 3, retry: '0 / 3', createdAt: '2026-05-26 00:01:26', finishedAt: '' }
])

const modelQueueRows = ref([
  { model: 'DeepSeek', channel: '标准通道', status: 'running', queued: 438, priority: { high: 116, medium: 214, low: 108 }, waitingTime: '08:42', todayPlan: 1680, load: 126 },
  { model: 'Kimi', channel: '增强通道', status: 'running', queued: 512, priority: { high: 168, medium: 256, low: 88 }, waitingTime: '11:09', todayPlan: 1920, load: 148 },
  { model: '豆包', channel: '增强通道', status: 'running', queued: 476, priority: { high: 122, medium: 280, low: 74 }, waitingTime: '09:31', todayPlan: 1840, load: 139 },
  { model: '通义千问', channel: '增强通道 II', status: 'queued', queued: 268, priority: { high: 54, medium: 151, low: 63 }, waitingTime: '05:16', todayPlan: 1320, load: 82 },
  { model: '腾讯元宝', channel: '标准通道', status: 'running', queued: 693, priority: { high: 244, medium: 317, low: 132 }, waitingTime: '18:47', todayPlan: 2160, load: 236 },
  { model: '文心一言', channel: '增强通道 II', status: 'error', queued: 186, priority: { high: 81, medium: 73, low: 32 }, waitingTime: '22:10', todayPlan: 1180, load: 188 }
])

const lastRefreshAt = ref('10:12:08')

const selectedProject = computed(() => projects.value.find(item => item.id === selectedProjectId.value) || projects.value[0])
const selectedQuestionRows = computed(() => questionRows.value.filter(item => item.projectId === selectedProject.value.id))

const visibleProjects = computed(() => projects.value.filter(item => ['running', 'queued', 'error'].includes(item.status)))
const visibleProjectCount = computed(() => visibleProjects.value.length)
const runningProjectCount = computed(() => projects.value.filter(item => item.status === 'running').length)
const queuedProjectCount = computed(() => projects.value.filter(item => item.status === 'queued').length)
const totalQueuedTasks = computed(() => modelQueueRows.value.reduce((sum, item) => sum + item.queued, 0))
const abnormalCount = computed(() => projects.value.filter(item => item.status === 'error').length + modelQueueRows.value.filter(item => item.status === 'error').length)

const metrics = computed(() => [
  { label: '执行中的项目', value: runningProjectCount.value, icon: VideoPlay, type: 'blue' },
  { label: '排队中的项目', value: queuedProjectCount.value, icon: Tickets, type: 'green' },
  { label: '模型排队任务', value: totalQueuedTasks.value.toLocaleString(), icon: Loading, type: 'purple' },
  { label: '异常模型/项目', value: abnormalCount.value, icon: Warning, type: 'red' }
])

const pageTitle = computed(() => {
  if (viewMode.value === 'detail') return `${selectedProject.value.name} · 任务进度`
  if (viewMode.value === 'taskList') return `${selectedProject.value.name} · 任务列表`
  return '实时任务监控'
})

const pageDesc = computed(() => {
  if (viewMode.value === 'detail') return '查看该项目下每个模型的任务进度。'
  if (viewMode.value === 'taskList') return '查看本次执行记录下的每一条任务详情。'
  return '基于任务调度、执行记录和问题任务队列的实时运行看板。'
})

const backText = computed(() => viewMode.value === 'taskList' ? '返回任务进度' : '返回实时监控')

const filteredProjects = computed(() => {
  return visibleProjects.value.filter(item => {
    const matchStatus = filters.status ? item.status === filters.status : true
    const matchKeyword = filters.keyword ? item.name.includes(filters.keyword) || item.userName.includes(filters.keyword) : true
    return matchStatus && matchKeyword
  })
})

const openProjectDetail = row => {
  selectedProjectId.value = row.id
  viewMode.value = 'detail'
}

const openTaskList = () => {
  viewMode.value = 'taskList'
}

const backToPrevious = () => {
  if (viewMode.value === 'taskList') {
    viewMode.value = 'detail'
    return
  }
  backToList()
}

const backToList = () => {
  viewMode.value = 'list'
}

const getProjectProgress = row => {
  if (!row.totalModelTasks) return 0
  return Math.round((row.completed / row.totalModelTasks) * 100)
}

const getModelProgress = row => Math.round((row.completed / row.total) * 100)

const getProjectStatusType = status => {
  const dict = { running: 'primary', queued: 'warning', idle: 'success', error: 'danger' }
  return dict[status] || 'info'
}

const getProjectStatusText = status => {
  const dict = { running: '执行中', queued: '排队中', idle: '空闲中', error: '异常' }
  return dict[status] || '未知'
}

const getTaskStatusType = status => {
  const dict = { pending: 'info', running: 'primary', completed: 'success', failed: 'danger' }
  return dict[status] || 'info'
}

const getTaskStatusText = status => {
  const dict = { pending: '排队中', running: '执行中', completed: '已完成', failed: '失败' }
  return dict[status] || '未知'
}

const getPriorityWidth = (row, key) => {
  if (!row.queued) return '0%'
  return `${Math.max(4, Math.round((row.priority[key] / row.queued) * 100))}%`
}

const getModelClass = model => {
  const dict = {
    DeepSeek: 'deepseek',
    Kimi: 'moonshot',
    '豆包': 'doubao',
    '通义千问': 'qwen',
    '腾讯元宝': 'hunyuan',
    '文心一言': 'ernie'
  }
  return dict[model] || 'default'
}

const getModelShortName = model => {
  const dict = {
    DeepSeek: 'D',
    Kimi: 'K',
    '豆包': '豆',
    '通义千问': 'Q',
    '腾讯元宝': '元',
    '文心一言': '文'
  }
  return dict[model] || model.slice(0, 1)
}

const hydrateProjectTotals = () => {
  projects.value.forEach(project => {
    project.completed = project.models.reduce((sum, model) => sum + model.completed, 0)
    project.totalModelTasks = project.models.reduce((sum, model) => sum + model.total, 0)
    project.queuedTasks = project.models.reduce((sum, model) => sum + model.queued, 0)
    project.failed = project.models.filter(model => model.status === 'error').length
  })
}

const tick = () => {
  const now = new Date()
  lastRefreshAt.value = now.toLocaleTimeString('zh-CN', { hour12: false })

  projects.value.forEach(project => {
    if (project.status !== 'running') return
    project.models.forEach(model => {
      if (model.status !== 'running') return
      const step = project.id === 1 ? 2 : 1
      const nextCompleted = Math.min(model.total, model.completed + step)
      model.queued = Math.max(0, model.queued - (nextCompleted - model.completed))
      model.completed = nextCompleted
      if (model.completed >= model.total) model.status = 'idle'
    })
  })

  modelQueueRows.value.forEach(item => {
    if (item.status === 'error') return
    const delta = Math.floor(Math.random() * 11) - 4
    item.queued = Math.max(0, item.queued + delta)
    item.priority.medium = Math.max(0, item.priority.medium + delta)
    item.load = Math.max(20, Math.round((item.queued / Math.max(item.todayPlan / 10, 1)) * 100))
  })

  hydrateProjectTotals()
  taskStore.updateCount(runningProjectCount.value + selectedQuestionRows.value.filter(item => item.status === 'running').length)
}

let timer = null
onMounted(() => {
  hydrateProjectTotals()
  taskStore.updateCount(runningProjectCount.value + selectedQuestionRows.value.filter(item => item.status === 'running').length)
  timer = window.setInterval(tick, 3000)
})

onUnmounted(() => {
  if (timer) window.clearInterval(timer)
})
</script>

<style scoped>
.realtime-dashboard {
  padding: 24px;
  background: #f5f7fb;
  min-height: 100%;
}

.page-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 18px;
}

.page-head h2 {
  margin: 0;
  color: #1f2d3d;
  font-size: 24px;
  font-weight: 700;
}

.page-head p {
  margin: 8px 0 0;
  color: #7a8797;
  font-size: 14px;
}

.back-link {
  padding: 0;
  margin-bottom: 10px;
  color: #2563eb;
  background: transparent;
  border: 0;
  cursor: pointer;
  font-size: 14px;
}

.back-link:hover {
  text-decoration: underline;
}

.refresh-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #2563eb;
  font-size: 13px;
  padding: 8px 12px;
  background: #eef5ff;
  border: 1px solid #cfe1ff;
  border-radius: 6px;
}

.pulse-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #22c55e;
}

.metric-row,
.content-row {
  margin-bottom: 16px;
}

.metric-card :deep(.el-card__body) {
  display: flex;
  align-items: center;
  gap: 14px;
  height: 78px;
}

.metric-icon {
  width: 40px;
  height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  border-radius: 6px;
  font-size: 20px;
}

.metric-icon.blue { background: #3b82f6; }
.metric-icon.green { background: #10b981; }
.metric-icon.purple { background: #8b5cf6; }
.metric-icon.red { background: #ef4444; }

.metric-value {
  color: #111827;
  font-size: 24px;
  font-weight: 700;
  line-height: 1;
}

.metric-label {
  margin-top: 8px;
  color: #6b7280;
  font-size: 13px;
}

.panel-card {
  margin-bottom: 16px;
  border-radius: 8px;
}

.panel-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.panel-toolbar > div {
  display: flex;
  align-items: center;
  gap: 10px;
}

.panel-title {
  color: #111827;
  font-size: 16px;
  font-weight: 700;
}

.toolbar-right {
  display: flex;
  gap: 10px;
}

.monitor-table {
  font-size: 13px;
}

.project-link {
  padding: 0;
  color: #2563eb;
  background: transparent;
  border: 0;
  cursor: pointer;
  font: inherit;
  font-weight: 600;
}

.project-link:hover {
  color: #1d4ed8;
  text-decoration: underline;
}

.model-badges {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.model-badge {
  width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  border-radius: 50%;
  font-size: 11px;
  font-weight: 800;
  line-height: 1;
}

.model-badge.deepseek { background: #4f6bed; }
.model-badge.moonshot { background: #111827; }
.model-badge.doubao { background: linear-gradient(135deg, #7c3aed, #22d3ee); }
.model-badge.qwen { background: #7c3aed; }
.model-badge.hunyuan { background: #0ea5e9; }
.model-badge.ernie { background: #2563eb; }
.model-badge.default { background: #64748b; }

.progress-cell {
  display: grid;
  grid-template-columns: 1fr 70px;
  align-items: center;
  gap: 10px;
}

.progress-cell.compact-progress {
  grid-template-columns: 1fr 60px;
}

.progress-cell span {
  color: #64748b;
  font-size: 12px;
}

.cap-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.cap-list span {
  padding: 2px 6px;
  color: #2563eb;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 4px;
  font-size: 12px;
}

.cap-yes {
  color: #22c55e;
  font-size: 18px;
  font-weight: 800;
}

.cap-no {
  color: #ef4444;
  font-size: 16px;
  font-weight: 800;
}

.queue-summary {
  display: flex;
  align-items: center;
  gap: 14px;
  color: #64748b;
}

.queue-summary strong {
  color: #111827;
}

.priority-stack {
  display: flex;
  width: 100%;
  height: 10px;
  background: #e5e7eb;
  border-radius: 999px;
  overflow: hidden;
}

.priority-stack span {
  display: block;
  height: 100%;
}

.priority-stack .high { background: #ef4444; }
.priority-stack .medium { background: #f59e0b; }
.priority-stack .low { background: #3b82f6; }

.load-text {
  color: #2563eb;
  font-weight: 700;
}

.load-text.danger {
  color: #ef4444;
}
</style>
