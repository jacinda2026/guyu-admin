<template>
  <div class="sentiment-management-container">
    <div class="page-header mb-20">
      <h2 class="page-title">舆情监控项目</h2>
      <p class="page-subtitle">通过舆情问题采集 AI 回答、风险信源和负面表达，持续追踪品牌、产品、事件或门店的 AI 舆情健康度。</p>
    </div>

    <el-row :gutter="16" class="overview-row mb-20">
      <el-col :span="6" v-for="item in overviewStats" :key="item.label">
        <el-card shadow="never" class="overview-card">
          <div class="overview-label">{{ item.label }}</div>
          <div class="overview-value" :class="item.type">{{ item.value }}</div>
          <div class="overview-desc">{{ item.desc }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never" class="table-card">
      <div class="filter-bar mb-20">
        <el-input v-model="searchQuery" placeholder="输入主体、项目或工单号检索..." style="width: 320px;" clearable>
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <el-button type="primary" class="create-project-btn" @click="handleCreateTask">
          <el-icon><Plus /></el-icon> 创建项目
        </el-button>
      </div>

      <el-table :data="filteredTasks" style="width: 100%" stripe>
        <el-table-column prop="id" label="项目编号" width="130" />
        <el-table-column label="舆情监控项目" min-width="240">
          <template #default="{ row }">
            <el-link type="primary" :underline="false" class="project-link" @click="enterSentimentProject(row)">
              {{ row.targetName }}
            </el-link>
            <div class="row-sub">{{ row.entityType }} · {{ row.projectType }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="questionCount" label="舆情问题数" width="110" align="center" />
        <el-table-column label="模型覆盖" width="150" align="center">
          <template #default="{ row }">
            <span class="model-count">{{ row.models }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="cycle" label="监控周期" min-width="180" />
        <el-table-column prop="createTime" label="项目创建时间" width="150" />
        
        <el-table-column label="风险评级" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getRiskTagType(row.riskLevel)" effect="dark" size="small">
              {{ row.riskLevel }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="riskSourceCount" label="风险信源" width="100" align="center" />

        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === '已交付' ? 'success' : 'warning'" size="small" effect="plain">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="160" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" plain @click="openSentimentReportStandalone(row)">
              <el-icon><Monitor /></el-icon> 穿透在线报告
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      v-model="createDialogVisible"
      width="1040px"
      class="sentiment-task-dialog create-project-dialog"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <template #header>
        <div class="dialog-header">
          <span class="dialog-title">创建舆情项目</span>
          <span class="dialog-tip">项目会按照配置的问题、模型和平台定期采集 AI 舆情数据。</span>
        </div>
      </template>

      <el-form :model="createForm" label-position="top" class="task-create-body">
        <section class="form-section project-name-section">
          <div class="basic-form-grid">
            <div class="basic-form-row">
              <div class="basic-form-label">项目名称</div>
              <el-input
                v-model="createForm.projectName"
                maxlength="120"
                show-word-limit
                placeholder="请输入项目名称"
                class="project-name-input"
              />
            </div>
            <div class="basic-form-row vertical">
              <div class="basic-form-label required">检测主体</div>
              <el-input
                v-model="createForm.targetName"
                maxlength="120"
                placeholder="例如：谷雨智能有限公司"
              />
              <div class="field-tip">输入品牌名、公司名、产品名或事件名称</div>
            </div>
            <div class="basic-form-row vertical">
              <div class="basic-form-label required">主体类型</div>
              <el-radio-group v-model="createForm.entityType" class="entity-type-grid">
                <el-radio-button
                v-for="item in entityTypeOptions"
                :key="item.value"
                  :label="item.value"
                  class="entity-type-option"
              >
                <span class="entity-name">{{ item.label }}</span>
                <span class="entity-example">{{ item.example }}</span>
                </el-radio-button>
              </el-radio-group>
            </div>
          </div>
        </section>

        <section class="form-section">
          <div class="section-bar">
            <div class="section-title title-with-count">问题管理 <span class="section-count">共{{ createQuestionCount }}个问题</span></div>
            <div class="section-actions question-actions">
              <el-button type="primary" plain @click="openIssueExpandTool">AI拓词</el-button>
            </div>
          </div>
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="监控问题" required>
                <el-input
                  v-model="createForm.questions"
                  type="textarea"
                  :rows="5"
                  placeholder="每行一个问题，例如：
奥迪E7X换壳争议是否属实？
这次质量投诉会不会影响购买？
用户对该品牌售后有哪些负面反馈？"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="核心监测关键词" required>
                <el-input
                  v-model="createForm.keywords"
                  type="textarea"
                  :rows="5"
                  placeholder="每行一个关键词，例如：
换壳争议
质量投诉
虚假宣传
售后维权"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </section>

        <section class="form-section monitor-create-section">
          <div class="section-bar monitor-title-bar">
            <div class="section-title-with-switch">
              <div class="section-title">监控配置</div>
              <el-switch v-model="createForm.monitor.enabled" active-text="开" inactive-text="关" inline-prompt />
            </div>
          </div>
          <div class="monitor-form-row monitor-row-main">
            <div class="inline-form-item">
              <span class="inline-label">监控周期</span>
              <el-select v-model="createForm.monitor.period" class="period-select">
                <el-option label="每日" value="daily" />
                <el-option label="每周" value="weekly" />
                <el-option label="间隔" value="interval" />
              </el-select>
            </div>
            <el-checkbox-group v-if="createForm.monitor.period === 'weekly'" v-model="createForm.monitor.weekdays" class="weekday-list">
              <el-checkbox v-for="day in weekdayOptions" :key="day.value" :label="day.value">{{ day.label }}</el-checkbox>
            </el-checkbox-group>
            <template v-if="createForm.monitor.period === 'interval'">
              <div class="inline-form-item">
                <span class="inline-label">开始日期</span>
                <el-date-picker v-model="createForm.monitor.startDate" type="date" format="YYYY/MM/DD" value-format="YYYY/MM/DD" class="date-picker" />
              </div>
              <div class="inline-form-item">
                <span class="inline-label">间隔天数</span>
                <el-input-number v-model="createForm.monitor.intervalDays" :min="1" :max="365" controls-position="right" class="small-number" />
              </div>
            </template>
            <div class="inline-form-item daily-count-item">
              <span class="inline-label">单日次数</span>
              <el-input-number v-model="createForm.monitor.dailyTimes" :min="1" :max="24" controls-position="right" class="small-number" @change="syncCreateSplitTimes" />
            </div>
            <div class="inline-form-item execute-time-inline">
              <span class="inline-label">执行时间</span>
              <div class="time-list">
                <el-time-picker
                  v-for="(_, index) in createForm.monitor.splitTimes"
                  :key="index"
                  v-model="createForm.monitor.splitTimes[index]"
                  format="HH:mm"
                  value-format="HH:mm"
                  class="time-picker compact-time"
                />
              </div>
            </div>
          </div>
        </section>

        <section class="form-section">
          <div class="section-title">模型配置</div>
          <div class="channel-options">
            <button
              type="button"
              class="channel-option"
              :class="{ active: createForm.collectChannel === 'standard' }"
              @click="setCollectChannel('standard')"
            >
              <span class="channel-check">✓</span>
              <span class="channel-title-row">
                <span class="channel-name">标准通道</span>
                <span class="channel-tag">日常监控</span>
              </span>
              <span class="channel-features">含标准能力：联网搜索、答案采集、信源采集</span>
            </button>
            <button
              type="button"
              class="channel-option"
              :class="{ active: createForm.collectChannel === 'enhanced' }"
              @click="setCollectChannel('enhanced')"
            >
              <span class="channel-check">✓</span>
              <span class="channel-title-row">
                <span class="channel-name">增强通道</span>
                <span class="channel-tag">能力完整</span>
              </span>
              <span class="channel-features">含完整能力：联网搜索、答案采集、信源采集、深度思考、全部截图、提及截图</span>
            </button>
          </div>

          <div class="model-grid-create">
            <div v-for="model in createForm.models" :key="model.key" class="create-model-card" :class="{ active: model.enabled }">
              <el-checkbox v-model="model.enabled" class="model-title-check">
                <span class="model-logo" :class="model.logoClass">{{ model.short }}</span>
                {{ model.name }}
              </el-checkbox>
              <div v-if="createForm.collectChannel === 'enhanced'" class="model-children">
                <el-checkbox v-model="model.deepThinking" :disabled="!model.enabled">深度思考</el-checkbox>
                <div class="screenshot-checks">
                  <el-checkbox
                    v-model="model.allScreenshot"
                    :disabled="!model.enabled"
                    @change="value => handleScreenshotChange(model, 'all', value)"
                  >全部截图</el-checkbox>
                  <el-checkbox
                    v-model="model.mentionScreenshot"
                    :disabled="!model.enabled"
                    @change="value => handleScreenshotChange(model, 'mention', value)"
                  >提及截图</el-checkbox>
                </div>
              </div>
            </div>
          </div>
        </section>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <span class="billing-rule">基础调用、深度思考、截图均按 ¥0.10/问题/次/模型计费</span>
          <span class="billing-estimate">预计单天消耗 <strong>¥{{ createEstimatedDailyCost }}</strong></span>
          <el-button @click="createDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitSentimentTask">
            <el-icon><Plus /></el-icon>
            创建项目
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search, Plus, Monitor } from '@element-plus/icons-vue'

const router = useRouter()
const searchQuery = ref('')
const createDialogVisible = ref(false)

const getDefaultCreateModels = () => [
  { key: 'doubao', name: '豆包', short: '豆', logoClass: 'logo-rainbow', enabled: true, deepThinking: false, allScreenshot: false, mentionScreenshot: false },
  { key: 'yuanbao', name: '元宝', short: '元', logoClass: 'logo-green', enabled: true, deepThinking: false, allScreenshot: false, mentionScreenshot: false },
  { key: 'deepseek', name: 'DeepSeek', short: 'D', logoClass: 'logo-blue', enabled: true, deepThinking: false, allScreenshot: false, mentionScreenshot: false },
  { key: 'qwen', name: '通义千问', short: '千', logoClass: 'logo-purple', enabled: true, deepThinking: false, allScreenshot: false, mentionScreenshot: false },
  { key: 'wenxin', name: '文心一言', short: '文', logoClass: 'logo-indigo', enabled: true, deepThinking: false, allScreenshot: false, mentionScreenshot: false },
  { key: 'kimi', name: 'Kimi', short: 'K', logoClass: 'logo-dark', enabled: true, deepThinking: false, allScreenshot: false, mentionScreenshot: false }
]

const entityTypeOptions = [
  { label: '品牌/产品', value: '品牌/产品', example: '卓牧羊奶粉、奥迪E7X' },
  { label: '门店/地点', value: '门店/地点', example: '汉庭某门店、某医院' },
  { label: '事件专项', value: '事件专项', example: '换壳争议、质量投诉' },
  { label: '人物/机构', value: '人物/机构', example: '某CEO、某MCN机构' },
  { label: '竞品/行业', value: '竞品/行业', example: '羊奶粉行业、新能源SUV' }
]

const createForm = reactive({
  projectName: '',
  targetName: '',
  entityType: '品牌/产品',
  questions: '',
  keywords: '',
  collectChannel: 'standard',
  models: getDefaultCreateModels(),
  monitor: {
    enabled: true,
    period: 'daily',
    weekdays: ['mon'],
    startDate: '2026/06/03',
    intervalDays: 1,
    dailyTimes: 1,
    splitTimes: ['09:30']
  }
})

const weekdayOptions = [
  { label: '周一', value: 'mon' },
  { label: '周二', value: 'tue' },
  { label: '周三', value: 'wed' },
  { label: '周四', value: 'thu' },
  { label: '周五', value: 'fri' },
  { label: '周六', value: 'sat' },
  { label: '周日', value: 'sun' }
]

const createQuestionCount = computed(() => createForm.questions.split('\n').map(item => item.trim()).filter(Boolean).length)
const MODEL_UNIT_PRICE = 0.1
const createEstimatedDailyCost = computed(() => {
  const questionCount = createQuestionCount.value
  const dailyTimes = Number(createForm.monitor.dailyTimes) || 0
  const enabledModels = createForm.models.filter(item => item.enabled)
  const baseUnits = questionCount * dailyTimes * enabledModels.length
  const enhancedUnits = createForm.collectChannel === 'enhanced'
    ? enabledModels.reduce((total, model) => {
      const deepThinkingUnits = model.deepThinking ? 1 : 0
      const screenshotUnits = model.allScreenshot || model.mentionScreenshot ? 1 : 0
      return total + questionCount * dailyTimes * (deepThinkingUnits + screenshotUnits)
    }, 0)
    : 0
  return ((baseUnits + enhancedUnits) * MODEL_UNIT_PRICE).toFixed(2)
})

const overviewStats = computed(() => {
  const total = sentimentTasksData.value.length
  const highRisk = sentimentTasksData.value.filter(item => item.riskLevel === '极度高危').length
  const running = sentimentTasksData.value.filter(item => item.status === '分析中').length
  const questionTotal = sentimentTasksData.value.reduce((sum, item) => sum + Number(item.questionCount || 0), 0)
  return [
    { label: '舆情项目', value: total, desc: '覆盖品牌、事件、门店和行业', type: 'primary' },
    { label: '高危项目', value: highRisk, desc: '需要优先复核与处置', type: 'danger' },
    { label: '舆情问题', value: questionTotal, desc: '用于采集 AI 回答与信源', type: 'primary' },
    { label: '分析中', value: running, desc: '异步采集与报告生成中', type: 'warning' }
  ]
})

// 舆情工单归档池，数据完美对齐您的奥迪与 AuraLuxe 舆情资产
const sentimentTasksData = ref([
  { id: 'SEN-MOCK-AUDI', targetName: '奥迪E7X与智己LS7「换壳」舆情审计项目', entityType: '事件专项', projectType: '事件专项追踪', questionCount: 36, models: '6个', riskSourceCount: 18, cycle: '2026-04-10 至 2026-05-18', createTime: '2026-05-16 10:00', riskLevel: '极度高危', status: '已交付' },
  { id: 'SEN-827311', targetName: 'AuraLuxe 高端空气净化家电口碑监控', entityType: '品牌/产品', projectType: '产品口碑监测', questionCount: 28, models: '5个', riskSourceCount: 7, cycle: '2026-04-01 至 2026-05-15', createTime: '2026-05-15 14:20', riskLevel: '中度风险', status: '已交付' },
  { id: 'SEN-829104', targetName: '汉庭北京新国展祥云小镇店舆情监控', entityType: '门店/地点', projectType: '门店口碑监测', questionCount: 18, models: '4个', riskSourceCount: 1, cycle: '2026-05-01 至 2026-05-17', createTime: '2026-05-17 19:20', riskLevel: '暂无风险', status: '分析中' }
])

const filteredTasks = computed(() => {
  if (!searchQuery.value) return sentimentTasksData.value
  const q = searchQuery.value.toLowerCase()
  return sentimentTasksData.value.filter(t =>
    t.targetName.toLowerCase().includes(q) ||
    t.id.toLowerCase().includes(q) ||
    t.entityType.toLowerCase().includes(q) ||
    t.projectType.toLowerCase().includes(q)
  )
})

const getRiskTagType = (level) => {
  if (level === '极度高危') return 'danger'
  if (level === '中度风险') return 'warning'
  if (level === '待评估') return 'info'
  return 'success'
}

// 🌟 核心跳转：直接带参数在新标签页打开 public/ai_sentiment_insight_report.html
const openSentimentReportStandalone = (row) => {
  if (row.status === '分析中') {
    ElMessage.warning('大后台分布式 Agent 异步计算未完成，请稍后刷新穿透！')
    return
  }
  ElMessage.success(`正在为您安全唤起 [${row.targetName}] 的高级舆情在线报告...`)
  
  // 映射公有目录 public 下的绝对路径地址
  const targetUrl = `/ai_sentiment_insight_report.html?id=${row.id}&risk=${encodeURIComponent(row.riskLevel)}&task=preview`
  window.open(targetUrl, '_blank')
}

const enterSentimentProject = (row) => {
  router.push(`/sentiment-project/${row.id}/overview`)
}

const resetCreateForm = () => {
  createForm.projectName = ''
  createForm.targetName = ''
  createForm.entityType = '品牌/产品'
  createForm.questions = ''
  createForm.keywords = ''
  createForm.collectChannel = 'standard'
  createForm.models = getDefaultCreateModels()
  createForm.monitor.enabled = true
  createForm.monitor.period = 'daily'
  createForm.monitor.weekdays = ['mon']
  createForm.monitor.startDate = '2026/06/03'
  createForm.monitor.intervalDays = 1
  createForm.monitor.dailyTimes = 1
  createForm.monitor.splitTimes = ['09:30']
}

const handleCreateTask = () => {
  resetCreateForm()
  createDialogVisible.value = true
}

const syncCreateSplitTimes = () => {
  const current = createForm.monitor.splitTimes.slice(0, createForm.monitor.dailyTimes)
  while (current.length < createForm.monitor.dailyTimes) {
    current.push(current[current.length - 1] || '09:30')
  }
  createForm.monitor.splitTimes = current
}

const openIssueExpandTool = () => {
  window.open('https://6zyknbc5d7.coze.site/', '_blank', 'noopener,noreferrer')
}

const setCollectChannel = (channel) => {
  createForm.collectChannel = channel
}

const handleScreenshotChange = (model, type, value) => {
  if (!value) return
  if (type === 'all') model.mentionScreenshot = false
  if (type === 'mention') model.allScreenshot = false
}

const submitSentimentTask = () => {
  if (!createForm.projectName.trim()) {
    ElMessage.warning('请填写项目名称')
    return
  }
  if (!createForm.targetName.trim()) {
    ElMessage.warning('请填写检测主体')
    return
  }
  if (!createForm.questions.trim()) {
    ElMessage.warning('请填写核心舆情问题')
    return
  }
  if (!createForm.keywords.trim()) {
    ElMessage.warning('请填写核心监测关键词')
    return
  }

  const now = new Date()
  const questionCount = createForm.questions.split('\n').map(item => item.trim()).filter(Boolean).length
  const intelligentType = inferSentimentProjectType(createForm.entityType, createForm.targetName, createForm.questions)
  const enabledModelCount = createForm.models.filter(item => item.enabled).length
  const task = {
    id: `SEN-${String(now.getTime()).slice(-6)}`,
    targetName: createForm.projectName.trim(),
    monitorSubject: createForm.targetName.trim(),
    entityType: intelligentType.entityType,
    projectType: intelligentType.projectType,
    questionCount,
    models: `${enabledModelCount}个`,
    riskSourceCount: 0,
    cycle: '持续监测',
    createTime: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
    riskLevel: '待评估',
    status: '分析中'
  }

  sentimentTasksData.value.unshift(task)
  createDialogVisible.value = false
  ElMessage.success('已创建项目，系统正在进入异步采集与分析队列')
}

const inferSentimentProjectType = (entityType, topic, questions) => {
  const text = `${topic} ${questions}`.toLowerCase()
  if (entityType === '竞品/行业') return { entityType, projectType: '竞品舆情对比' }
  if (entityType === '门店/地点') return { entityType, projectType: '门店口碑监测' }
  if (entityType === '事件专项') return { entityType, projectType: '事件专项追踪' }
  if (entityType === '人物/机构') return { entityType, projectType: '品牌声誉监测' }
  if (/竞品|对比|行业|赛道|品类/.test(text)) {
    return { entityType: '竞品/行业', projectType: '竞品舆情对比' }
  }
  if (/事件|争议|事故|热搜|舆情|投诉|曝光|危机|负面|造假|虚假|安全/.test(text)) {
    return { entityType: '事件专项', projectType: '事件专项追踪' }
  }
  if (/门店|酒店|门市|分店|商场|医院|景区|地址|本地/.test(text)) {
    return { entityType: '门店/地点', projectType: '门店口碑监测' }
  }
  if (/ceo|创始人|高管|主播|医生|老师|人物|机构|公司|学校|协会/.test(text)) {
    return { entityType: '人物/机构', projectType: '品牌声誉监测' }
  }
  if (/ai|回答|推荐|引用|信源|认知/.test(text)) {
    return { entityType: '品牌/产品', projectType: 'AI认知监测' }
  }
  if (/质量|功效|成分|价格|口碑|体验|产品/.test(text)) {
    return { entityType: '品牌/产品', projectType: '产品口碑监测' }
  }
  return { entityType: '品牌/产品', projectType: '品牌声誉监测' }
}
</script>

<style scoped>
.sentiment-management-container { padding: 4px 0; }
.page-title { margin: 0 0 8px; font-size: 22px; color: #303133; font-weight: 600; }
.page-subtitle { margin: 0; color: #909399; font-size: 14px; }
.mb-20 { margin-bottom: 20px; }
.overview-row { align-items: stretch; }
.overview-card { border: none; border-radius: 8px; height: 100%; }
.overview-label { color: #909399; font-size: 13px; margin-bottom: 10px; }
.overview-value { color: #2b65f0; font-size: 28px; font-weight: 800; line-height: 1; }
.overview-value.danger { color: #f56c6c; }
.overview-value.warning { color: #e6a23c; }
.overview-desc { margin-top: 10px; color: #64748b; font-size: 12px; }
.table-card { border: none; border-radius: 8px; background: #fff; }
.filter-bar { display: flex; justify-content: space-between; align-items: center; }
.create-project-btn { min-width: 104px; }
.cursor-pointer { cursor: pointer; }
.project-link { font-weight: 700; font-size: 14px; }
.row-sub { margin-top: 4px; color: #909399; font-size: 12px; }
.model-count { color: #303133; font-weight: 700; }
.dialog-header { display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; }
.dialog-title { color: #111827; font-size: 18px; font-weight: 800; }
.dialog-tip { color: #94a3b8; font-size: 12px; }
.sentiment-task-dialog :deep(.el-dialog) { border-radius: 10px; }
.sentiment-task-dialog :deep(.el-dialog__body) { padding: 12px 24px 0; max-height: 72vh; overflow-y: auto; background: #f6f8fb; }
.sentiment-task-dialog :deep(.el-dialog__footer) { border-top: 1px solid #edf0f5; padding: 14px 24px 18px; }
.create-project-dialog :deep(.el-dialog__header) { padding: 20px 24px 8px; margin-right: 0; }
.create-project-dialog :deep(.el-dialog__body) { padding: 8px 24px 0; max-height: 78vh; overflow-y: auto; background: #f6f8fb; }
.create-project-dialog :deep(.el-dialog__footer) { padding: 18px 24px 22px; }
.task-create-body { display: flex; flex-direction: column; gap: 12px; }
.form-section { border: 1px solid #d8dee8; border-radius: 12px; padding: 18px 20px; background: #fff; }
.project-name-section { padding: 24px 26px; }
.section-bar { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 14px; }
.basic-form-grid { display: flex; flex-direction: column; gap: 18px; }
.basic-form-row { display: grid; grid-template-columns: 96px minmax(0, 1fr); align-items: center; gap: 14px; }
.basic-form-row.vertical { display: block; }
.basic-form-label { color: #111827; font-size: 15px; font-weight: 800; line-height: 22px; }
.basic-form-label.required::before { content: '* '; color: #ef4444; font-weight: 800; }
.project-name-input { width: 100%; }
.field-tip { margin-top: 8px; color: #64748b; font-size: 13px; line-height: 20px; }
.entity-type-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; width: 100%; margin-top: 10px; }
.entity-type-grid :deep(.el-radio-button__inner) { display: flex; align-items: center; gap: 8px; width: 100%; min-height: 52px; padding: 0 16px; border: 1px solid #d8dee8 !important; border-radius: 10px !important; background: #fff; box-shadow: none !important; text-align: left; box-sizing: border-box; }
.entity-type-grid :deep(.el-radio-button.is-active .el-radio-button__inner) { border-color: #2f7df6 !important; background: #eff6ff; color: #111827; box-shadow: 0 0 0 2px rgba(47, 125, 246, 0.12) !important; }
.entity-type-grid :deep(.el-radio-button__inner)::before { content: ''; flex: 0 0 16px; width: 16px; height: 16px; border: 2px solid #94a3b8; border-radius: 999px; box-sizing: border-box; }
.entity-type-grid :deep(.el-radio-button.is-active .el-radio-button__inner)::before { border: 5px solid #2f7df6; }
.entity-name { color: #111827; font-size: 15px; font-weight: 700; white-space: nowrap; }
.entity-example { min-width: 0; color: #94a3b8; font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.section-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.title-with-count { display: inline-flex; align-items: baseline; gap: 8px; }
.section-count { color: #94a3b8; font-size: 12px; font-weight: 600; }
.monitor-title-bar { margin-bottom: 12px; }
.section-title-with-switch { display: flex; align-items: center; gap: 12px; }
.monitor-form-row { display: flex; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 16px; }
.inline-form-item { display: inline-flex; align-items: center; gap: 8px; min-height: 34px; }
.inline-label { color: #64748b; font-size: 13px; font-weight: 700; white-space: nowrap; }
.period-select { width: 112px; }
.weekday-list { display: inline-flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.weekday-list :deep(.el-checkbox) { margin-right: 0; }
.date-picker { width: 138px; }
.small-number { width: 104px; }
.time-list { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
.compact-time { width: 104px; }
.section-head { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
.section-index { display: inline-flex; align-items: center; justify-content: center; flex: 0 0 22px; width: 22px; height: 22px; border-radius: 50%; background: #f56c6c; color: #fff; font-size: 12px; font-weight: 800; }
.section-head > div { display: flex; align-items: center; gap: 10px; min-width: 0; }
.section-title { color: #111827; font-size: 15px; font-weight: 800; line-height: 1.1; }
.section-desc { color: #94a3b8; font-size: 12px; }
.task-create-body :deep(.el-form-item) { margin-bottom: 16px; }
.form-section :deep(.el-form-item__label) { color: #1f2937; font-size: 13px; font-weight: 700; line-height: 1.2; margin-bottom: 8px; }
.full-width { width: 100%; }
.channel-options { display: grid; grid-template-columns: repeat(2, minmax(260px, 1fr)); gap: 14px; margin: 14px 0 16px; }
.channel-option { position: relative; min-height: 100px; padding: 14px 16px 14px 42px; border: 2px solid #cbd5e1; border-radius: 10px; background: #ffffff; color: #1f2937; text-align: left; cursor: pointer; box-sizing: border-box; transition: all 0.18s ease; }
.channel-option.active { border-color: #2563eb; background: linear-gradient(180deg, #eff6ff 0%, #dbeafe 100%); box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.14); }
.channel-check { position: absolute; left: 16px; top: 20px; display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 50%; border: 2px solid #cbd5e1; color: transparent; font-size: 14px; font-weight: 900; }
.channel-option.active .channel-check { background: #2563eb; border-color: #2563eb; color: #fff; }
.channel-title-row { display: flex; align-items: center; gap: 8px; }
.channel-name { color: #111827; font-size: 16px; font-weight: 800; }
.channel-tag { display: inline-flex; align-items: center; height: 24px; padding: 0 8px; border-radius: 999px; background: #eef2f7; color: #64748b; font-size: 12px; font-weight: 800; }
.channel-option.active .channel-tag { background: #2563eb; color: #fff; }
.channel-features { display: block; margin-top: 8px; color: #475569; font-size: 13px; line-height: 18px; }
.model-grid-create { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
.create-model-card { background: #f8fafc; border: 1px solid #dbe3ee; border-radius: 10px; padding: 16px; min-height: 112px; box-sizing: border-box; }
.create-model-card.active { border-color: #2563eb; background: #eff6ff; }
.model-title-check :deep(.el-checkbox__label) { font-size: 16px; color: #1f2937; font-weight: 700; }
.model-logo { display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 6px; color: #fff; font-size: 12px; margin-right: 8px; }
.logo-blue { background: #2563eb; }
.logo-dark { background: #111827; }
.logo-rainbow { background: linear-gradient(135deg, #60a5fa, #8b5cf6, #22c55e); }
.logo-purple { background: #8b5cf6; }
.logo-green { background: #22c55e; }
.logo-indigo { background: #4f46e5; }
.model-children { margin-top: 12px; padding-top: 10px; border-top: 1px solid #bfdbfe; display: flex; flex-direction: column; gap: 8px; }
.model-children :deep(.el-checkbox) { margin-right: 0; }
.screenshot-checks { display: flex; gap: 14px; flex-wrap: wrap; }
.dialog-footer { display: flex; justify-content: flex-end; align-items: center; gap: 12px; width: 100%; }
.billing-rule { margin-right: auto; color: #94a3b8; font-size: 13px; white-space: nowrap; }
.billing-estimate { color: #64748b; font-size: 13px; font-weight: 700; white-space: nowrap; }
.billing-estimate strong { color: #dc2626; font-size: 18px; font-weight: 900; }

@media (max-width: 900px) {
  .filter-bar { align-items: stretch; flex-direction: column; gap: 12px; }
  .filter-bar .el-input { width: 100% !important; }
  .entity-type-grid { grid-template-columns: 1fr; }
  .channel-options, .model-grid-create { grid-template-columns: 1fr; }
}
</style>
