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
        <el-button type="danger" @click="handleCreateTask">
          <el-icon><Plus /></el-icon> 创建舆情监控项目
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
      width="920px"
      class="sentiment-task-dialog"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <template #header>
        <div class="dialog-header">
          <span class="dialog-title">创建舆情监控项目</span>
          <span class="dialog-tip">项目会按照配置的问题、模型和平台定期采集 AI 舆情数据。</span>
        </div>
      </template>

      <el-form :model="createForm" label-position="top" class="task-create-body">
        <section class="form-section">
          <div class="section-head">
            <span class="section-index">1</span>
            <div>
              <div class="section-title">基础信息</div>
              <div class="section-desc">定义本次舆情监测的主体和场景。</div>
            </div>
          </div>
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="检测主题" required>
                <el-input
                  v-model="createForm.targetName"
                  maxlength="120"
                  placeholder="例如：奥迪E7X换壳争议、卓牧羊奶粉口碑"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="主题描述">
                <el-input
                  v-model="createForm.focus"
                  maxlength="160"
                  placeholder="例如：重点判断负面是否扩散、哪些平台风险最高、是否影响购买"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </section>

        <section class="form-section">
          <div class="section-head">
            <span class="section-index">2</span>
            <div>
              <div class="section-title">问题与关键词</div>
              <div class="section-desc">用问题驱动采集，用关键词扩大信源覆盖。</div>
            </div>
          </div>
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="核心舆情问题" required>
                <el-input
                  v-model="createForm.questions"
                  type="textarea"
                  :rows="5"
                  placeholder="每行一个问题，例如：
某品牌最近有什么负面新闻？
某事件是否属实？
这个争议会不会影响购买？"
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
奥迪E7X换壳
智己LS7底盘
品牌负面评价"
                />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="问题方向">
                <el-checkbox-group v-model="createForm.questionTypes" class="checkbox-grid">
                  <el-checkbox label="负面舆情" />
                  <el-checkbox label="负面新闻" />
                  <el-checkbox label="用户投诉" />
                  <el-checkbox label="质量问题" />
                  <el-checkbox label="安全风险" />
                  <el-checkbox label="价格争议" />
                  <el-checkbox label="虚假宣传" />
                  <el-checkbox label="功效质疑" />
                  <el-checkbox label="服务体验" />
                  <el-checkbox label="竞品对比" />
                  <el-checkbox label="事件核查" />
                  <el-checkbox label="风险归因" />
                  <el-checkbox label="购买影响" />
                  <el-checkbox label="处置建议" />
                </el-checkbox-group>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="负面/风险词">
                <el-input
                  v-model="createForm.riskWords"
                  placeholder="例如：虚假宣传、质量问题、投诉、维权"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </section>

        <section class="form-section">
          <div class="section-head">
            <span class="section-index">3</span>
            <div>
              <div class="section-title">采集与交付</div>
              <div class="section-desc">选择采集平台、AI 模型和最终输出内容。</div>
            </div>
          </div>
          <el-form-item label="采集平台">
            <el-checkbox-group v-model="createForm.platforms" class="checkbox-grid wide">
              <el-checkbox label="AI问答" />
              <el-checkbox label="搜索引擎" />
              <el-checkbox label="小红书" />
              <el-checkbox label="抖音" />
              <el-checkbox label="知乎" />
              <el-checkbox label="新闻媒体" />
              <el-checkbox label="论坛/社区" />
              <el-checkbox label="投诉平台" />
              <el-checkbox label="电商评价" />
            </el-checkbox-group>
          </el-form-item>
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="大模型覆盖">
                <el-checkbox-group v-model="createForm.models" class="model-list">
                  <el-checkbox label="DeepSeek" />
                  <el-checkbox label="豆包" />
                  <el-checkbox label="Kimi" />
                  <el-checkbox label="通义千问" />
                  <el-checkbox label="元宝" />
                  <el-checkbox label="文心一言" />
                </el-checkbox-group>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="交付内容">
                <el-checkbox-group v-model="createForm.deliverables" class="model-list">
                  <el-checkbox label="风险评级" />
                  <el-checkbox label="风险问题清单" />
                  <el-checkbox label="负面信源清单" />
                  <el-checkbox label="正负面词云" />
                  <el-checkbox label="AI回答截图" />
                  <el-checkbox label="竞品对比" />
                  <el-checkbox label="处置建议" />
                  <el-checkbox label="在线报告" />
                  <el-checkbox label="日报提醒" />
                </el-checkbox-group>
              </el-form-item>
            </el-col>
          </el-row>
        </section>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="createDialogVisible = false">取消</el-button>
          <el-button type="danger" @click="submitSentimentTask">
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

const createForm = reactive({
  targetName: '',
  questions: '',
  questionTypes: ['负面舆情', '负面新闻', '事件核查', '购买影响'],
  platforms: ['AI问答', '搜索引擎', '新闻媒体'],
  keywords: '',
  riskWords: '',
  models: ['DeepSeek', '豆包', 'Kimi', '通义千问'],
  deliverables: ['风险评级', '风险问题清单', '负面信源清单', 'AI回答截图', '处置建议', '在线报告'],
  focus: ''
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
  createForm.targetName = ''
  createForm.questions = ''
  createForm.questionTypes = ['负面舆情', '负面新闻', '事件核查', '购买影响']
  createForm.platforms = ['AI问答', '搜索引擎', '新闻媒体']
  createForm.keywords = ''
  createForm.riskWords = ''
  createForm.models = ['DeepSeek', '豆包', 'Kimi', '通义千问']
  createForm.deliverables = ['风险评级', '风险问题清单', '负面信源清单', 'AI回答截图', '处置建议', '在线报告']
  createForm.focus = ''
}

const handleCreateTask = () => {
  resetCreateForm()
  createDialogVisible.value = true
}

const submitSentimentTask = () => {
  if (!createForm.targetName.trim()) {
    ElMessage.warning('请填写目标监测主体/品牌')
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
  const intelligentType = inferSentimentProjectType(createForm.targetName, createForm.questions)
  const task = {
    id: `SEN-${String(now.getTime()).slice(-6)}`,
    targetName: createForm.targetName.trim(),
    entityType: intelligentType.entityType,
    projectType: intelligentType.projectType,
    questionCount,
    models: `${createForm.models.length}个`,
    riskSourceCount: 0,
    cycle: '持续监测',
    createTime: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
    riskLevel: '待评估',
    status: '分析中'
  }

  sentimentTasksData.value.unshift(task)
  createDialogVisible.value = false
  ElMessage.success('已创建舆情监控项目，系统正在进入异步采集与分析队列')
}

const inferSentimentProjectType = (topic, questions) => {
  const text = `${topic} ${questions}`.toLowerCase()
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
.task-create-body { display: flex; flex-direction: column; gap: 12px; }
.form-section { border: 1px solid #e5eaf2; border-radius: 8px; padding: 16px 18px 2px; background: #fff; }
.section-head { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
.section-index { display: inline-flex; align-items: center; justify-content: center; flex: 0 0 22px; width: 22px; height: 22px; border-radius: 50%; background: #f56c6c; color: #fff; font-size: 12px; font-weight: 800; }
.section-head > div { display: flex; align-items: center; gap: 10px; min-width: 0; }
.section-title { color: #111827; font-size: 15px; font-weight: 800; line-height: 1.1; }
.section-desc { color: #94a3b8; font-size: 12px; }
.task-create-body :deep(.el-form-item) { margin-bottom: 16px; }
.form-section :deep(.el-form-item__label) { color: #1f2937; font-size: 13px; font-weight: 700; line-height: 1.2; margin-bottom: 8px; }
.full-width { width: 100%; }
.checkbox-grid, .model-list { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.checkbox-grid.wide { grid-template-columns: repeat(6, minmax(0, 1fr)); }
.checkbox-grid :deep(.el-checkbox), .model-list :deep(.el-checkbox) {
  align-items: center;
  height: 34px;
  margin-right: 0;
  padding: 0 10px;
  border: 1px solid #e5eaf2;
  border-radius: 6px;
  background: #fafcff;
}
.checkbox-grid :deep(.el-checkbox.is-checked), .model-list :deep(.el-checkbox.is-checked) { border-color: #f56c6c; background: #fff5f5; }
.checkbox-grid :deep(.el-checkbox__label), .model-list :deep(.el-checkbox__label) { color: #334155; font-size: 13px; }
.dialog-footer { display: flex; justify-content: flex-end; gap: 12px; }

@media (max-width: 900px) {
  .filter-bar { align-items: stretch; flex-direction: column; gap: 12px; }
  .filter-bar .el-input { width: 100% !important; }
  .checkbox-grid, .checkbox-grid.wide, .model-list { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
</style>
