<template>
  <div class="sentiment-management-container">
    <div class="page-header mb-20">
      <h2 class="page-title">全域舆情监测项目管理</h2>
      <p class="page-subtitle">归档并管控全网 AI 舆情风控拦截任务。在此追踪各个品牌及酒店主体的舆情健康度，一键穿透全景高级分析在线报告。</p>
    </div>

    <el-card shadow="never" class="table-card">
      <div class="filter-bar mb-20">
        <el-input v-model="searchQuery" placeholder="输入目标品牌或工单号检索..." style="width: 320px;" clearable>
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <el-button type="danger" @click="handleCreateTask">
          <el-icon><Plus /></el-icon> 提交新舆情监测任务
        </el-button>
      </div>

      <el-table :data="filteredTasks" style="width: 100%" stripe>
        <el-table-column prop="id" label="监测工单号" width="130" />
        <el-table-column label="目标监测主体/品牌" min-width="180">
          <template #default="{ row }">
            <strong style="color: #303133;">{{ row.targetName }}</strong>
          </template>
        </el-table-column>
        <el-table-column prop="cycle" label="监测统计周期" min-width="180" />
        <el-table-column prop="createTime" label="项目创建时间" width="150" />
        
        <el-table-column label="舆情风险评级" width="130" align="center">
          <template #default="{ row }">
            <el-tag :type="getRiskTagType(row.riskLevel)" effect="dark" size="small">
              {{ row.riskLevel }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === '已交付' ? 'success' : 'warning'" size="small" effect="plain">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="快捷交付操作" width="160" align="center" fixed="right">
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
          <span class="dialog-title">提交新舆情监测任务</span>
          <span class="dialog-tip">任务提交后进入异步采集队列，可在项目列表查看分析进度。</span>
        </div>
      </template>

      <div class="task-create-body">
        <section class="form-section">
          <div class="section-title">监测对象</div>
          <el-form :model="createForm" label-position="top" class="task-form">
            <el-row :gutter="16">
              <el-col :span="12">
                <el-form-item label="目标监测主体/品牌" required>
                  <el-input v-model="createForm.targetName" maxlength="80" placeholder="例如：奥迪E7X与智己LS7换壳舆情" />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="主体类型">
                  <el-select v-model="createForm.entityType" class="full-width">
                    <el-option label="品牌/产品" value="brand" />
                    <el-option label="酒店/门店" value="hotel" />
                    <el-option label="人物/机构" value="organization" />
                    <el-option label="事件专项" value="event" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="风险等级预设">
                  <el-select v-model="createForm.riskLevel" class="full-width">
                    <el-option label="暂无风险" value="暂无风险" />
                    <el-option label="中度风险" value="中度风险" />
                    <el-option label="极度高危" value="极度高危" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item label="别名/关联名称">
              <el-input v-model="createForm.aliases" placeholder="多个名称用 / 分隔，例如：Audi E7X / 智己LS7 / 换壳" />
            </el-form-item>
          </el-form>
        </section>

        <section class="form-section">
          <div class="section-title">采集范围</div>
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="监测统计周期" required>
                <el-date-picker
                  v-model="createForm.cycleRange"
                  type="daterange"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                  class="full-width"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="采集平台">
                <el-checkbox-group v-model="createForm.platforms" class="checkbox-grid">
                  <el-checkbox label="AI问答" />
                  <el-checkbox label="搜索引擎" />
                  <el-checkbox label="小红书" />
                  <el-checkbox label="抖音" />
                  <el-checkbox label="知乎" />
                  <el-checkbox label="新闻媒体" />
                </el-checkbox-group>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="核心监测关键词" required>
                <el-input
                  v-model="createForm.keywords"
                  type="textarea"
                  :rows="4"
                  placeholder="每行一个关键词，例如：
奥迪E7X换壳
智己LS7底盘
品牌负面评价"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="负面/风险词">
                <el-input
                  v-model="createForm.riskWords"
                  type="textarea"
                  :rows="4"
                  placeholder="每行一个风险词，例如：虚假宣传、质量问题、投诉、维权"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </section>

        <section class="form-section">
          <div class="section-title">分析配置</div>
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
                  <el-checkbox label="负面信源清单" />
                  <el-checkbox label="AI回答截图" />
                  <el-checkbox label="处置建议" />
                  <el-checkbox label="在线报告" />
                  <el-checkbox label="日报提醒" />
                </el-checkbox-group>
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="重点关注说明">
            <el-input
              v-model="createForm.focus"
              type="textarea"
              :rows="3"
              placeholder="补充本次任务重点，例如：关注换壳争议是否影响AI推荐、重点追踪高传播负面内容来源。"
            />
          </el-form-item>
        </section>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="createDialogVisible = false">取消</el-button>
          <el-button type="danger" @click="submitSentimentTask">
            <el-icon><Plus /></el-icon>
            提交任务
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive, ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Plus, Monitor } from '@element-plus/icons-vue'

const searchQuery = ref('')
const createDialogVisible = ref(false)

const createForm = reactive({
  targetName: '',
  entityType: 'brand',
  riskLevel: '中度风险',
  aliases: '',
  cycleRange: [],
  platforms: ['AI问答', '搜索引擎', '新闻媒体'],
  keywords: '',
  riskWords: '',
  models: ['DeepSeek', '豆包', 'Kimi', '通义千问'],
  deliverables: ['风险评级', '负面信源清单', 'AI回答截图', '处置建议', '在线报告'],
  focus: ''
})

// 舆情工单归档池，数据完美对齐您的奥迪与 AuraLuxe 舆情资产
const sentimentTasksData = ref([
  { id: 'TAS-MOCK-AUDI', targetName: '奥迪E7X与智己LS7「换壳」舆情审计项目', cycle: '2026-04-10 至 2026-05-18', createTime: '2026-05-16 10:00', riskLevel: '极度高危', status: '已交付' },
  { id: 'TAS-827311', targetName: 'AuraLuxe (高端奢华空气净化家电)', cycle: '2026-04-01 至 2026-05-15', createTime: '2026-05-15 14:20', riskLevel: '中度风险', status: '已交付' },
  { id: 'TAS-829104', targetName: '汉庭北京新国展祥云小镇店', cycle: '2026-05-01 至 2026-05-17', createTime: '2026-05-17 19:20', riskLevel: '暂无风险', status: '分析中' }
])

const filteredTasks = computed(() => {
  if (!searchQuery.value) return sentimentTasksData.value
  const q = searchQuery.value.toLowerCase()
  return sentimentTasksData.value.filter(t => t.targetName.toLowerCase().includes(q) || t.id.toLowerCase().includes(q))
})

const getRiskTagType = (level) => {
  if (level === '极度高危') return 'danger'
  if (level === '中度风险') return 'warning'
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

const resetCreateForm = () => {
  createForm.targetName = ''
  createForm.entityType = 'brand'
  createForm.riskLevel = '中度风险'
  createForm.aliases = ''
  createForm.cycleRange = []
  createForm.platforms = ['AI问答', '搜索引擎', '新闻媒体']
  createForm.keywords = ''
  createForm.riskWords = ''
  createForm.models = ['DeepSeek', '豆包', 'Kimi', '通义千问']
  createForm.deliverables = ['风险评级', '负面信源清单', 'AI回答截图', '处置建议', '在线报告']
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
  if (!createForm.cycleRange || createForm.cycleRange.length !== 2) {
    ElMessage.warning('请选择监测统计周期')
    return
  }
  if (!createForm.keywords.trim()) {
    ElMessage.warning('请填写核心监测关键词')
    return
  }

  const now = new Date()
  const task = {
    id: `TAS-${String(now.getTime()).slice(-6)}`,
    targetName: createForm.targetName.trim(),
    cycle: `${createForm.cycleRange[0]} 至 ${createForm.cycleRange[1]}`,
    createTime: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
    riskLevel: createForm.riskLevel,
    status: '分析中'
  }

  sentimentTasksData.value.unshift(task)
  createDialogVisible.value = false
  ElMessage.success('已提交新舆情监测任务，系统正在进入异步采集与分析队列')
}
</script>

<style scoped>
.sentiment-management-container { padding: 4px 0; }
.page-title { margin: 0 0 8px; font-size: 22px; color: #303133; font-weight: 600; }
.page-subtitle { margin: 0; color: #909399; font-size: 14px; }
.mb-20 { margin-bottom: 20px; }
.table-card { border: none; border-radius: 8px; background: #fff; }
.filter-bar { display: flex; justify-content: space-between; align-items: center; }
.cursor-pointer { cursor: pointer; }
.dialog-header { display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; }
.dialog-title { color: #111827; font-size: 18px; font-weight: 800; }
.dialog-tip { color: #94a3b8; font-size: 12px; }
.sentiment-task-dialog :deep(.el-dialog) { border-radius: 10px; }
.sentiment-task-dialog :deep(.el-dialog__body) { padding: 8px 24px 0; max-height: 72vh; overflow-y: auto; }
.task-create-body { display: flex; flex-direction: column; gap: 14px; }
.form-section { border: 1px solid #d8dee8; border-radius: 10px; padding: 18px 20px 4px; background: #fff; }
.section-title { border-left: 4px solid #f56c6c; padding-left: 10px; margin-bottom: 16px; color: #111827; font-size: 16px; font-weight: 800; line-height: 1; }
.task-form :deep(.el-form-item), .form-section :deep(.el-form-item) { margin-bottom: 16px; }
.form-section :deep(.el-form-item__label) { color: #111827; font-weight: 700; }
.full-width { width: 100%; }
.checkbox-grid, .model-list { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px 12px; }
.checkbox-grid :deep(.el-checkbox), .model-list :deep(.el-checkbox) { margin-right: 0; }
.dialog-footer { display: flex; justify-content: center; gap: 16px; }

@media (max-width: 900px) {
  .filter-bar { align-items: stretch; flex-direction: column; gap: 12px; }
  .filter-bar .el-input { width: 100% !important; }
  .checkbox-grid, .model-list { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
</style>
