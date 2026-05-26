<template>
  <div class="data-overview-container">
    
    <div class="project-info-header">
      <div class="info-group">
        <div class="info-item"><span>监控品牌：</span><strong>{{ currentOverview.brand }}</strong></div>
        <div class="info-item"><span>监控问题：</span><strong>{{ currentOverview.questionCount }}</strong></div>
        <div class="info-item"><span>数据更新：</span><strong>09:00:00</strong></div>
      </div>
      <div class="info-group">
        <div class="info-item"><span>监控周期：</span><strong>每日/2次</strong></div>
        <div class="info-item"><span>下次执行：</span><strong>18:00:00</strong></div>
        <div class="info-item"><span>创建时间：</span><strong>2026/04/18</strong></div>
      </div>
      <div class="info-group">
        <div class="info-item" style="display: flex; align-items: center; gap: 8px;">
          <span>监控平台：</span><strong>5个</strong>
          <div class="logo-stack single"><span class="logo-badge logo-doubao" style="width:20px;height:20px;font-size:10px;">豆</span></div>
          <div class="logo-stack single"><span class="logo-badge logo-deepseek" style="width:20px;height:20px;font-size:10px;">D</span></div>
          <div class="logo-stack single"><span class="logo-badge logo-ernie" style="width:20px;height:20px;font-size:10px;">文</span></div>
          <div class="logo-stack single"><span class="logo-badge logo-qwen" style="width:20px;height:20px;font-size:10px;">千</span></div>
        </div>
        <div class="info-item"><span>今日任务进度：</span><strong>{{ currentOverview.todayProgress }}</strong></div>
      </div>
      <div class="info-group actions">
        <el-tag type="warning" effect="dark" size="large" style="border-radius: 4px;">运行中</el-tag>
        <el-button plain>导出数据</el-button>
        <el-button plain>立即执行</el-button>
      </div>
    </div>

    <div class="card filter-card">
      <div class="filter-row">
        <div class="model-filter" ref="modelFilterRef">
          <button class="model-trigger" @click="toggleModelMenu">
            <span class="left">
              <span class="logo-stack" :class="{'single': isAllModelsSelected(filterState.selectedModels)}">
                <template v-if="isAllModelsSelected(filterState.selectedModels)">
                  <span class="logo-badge logo-all">全</span>
                </template>
                <template v-else>
                  <span v-for="mod in getSelectedModelItems(filterState.selectedModels).slice(0,4)" :key="mod.code" class="logo-badge" :class="mod.logoClass">{{ mod.mark }}</span>
                </template>
              </span>
              <span>{{ isAllModelsSelected(filterState.selectedModels) ? '所有模型' : `已选择 ${filterState.selectedModels.length} 个模型` }}</span>
            </span>
            <span class="chevron"></span>
          </button>
          
          <div class="model-menu" :class="{ show: modelMenuOpen }">
            <div class="model-menu-body">
              <button 
                v-for="item in modelOptions" :key="item.code"
                class="model-option"
                :class="{
                  'all': item.code === 'ALL',
                  'selected': isModelChecked(item.code),
                  'locked': isModelLocked(item.code)
                }"
                @click="togglePendingModel(item.code)"
                type="button"
              >
                <span class="checkbox"></span>
                <span v-if="item.code === 'ALL'" class="logo-stack single"><span class="logo-badge" :class="item.logoClass">{{ item.mark }}</span></span>
                <span v-else class="logo-badge" :class="item.logoClass">{{ item.mark }}</span>
                <span class="model-name">{{ item.name }}</span>
              </button>
            </div>
            <div class="model-menu-hint">至少选择 1 个模型</div>
            <div class="model-menu-footer">
              <div class="footer-actions">
                <button class="ghost-btn" @click="cancelModelSelection">取消</button>
                <button class="primary-btn" @click="confirmModelSelection">确定</button>
              </div>
            </div>
          </div>
        </div>

        <div class="segmented">
          <button :class="{ active: filterState.mode === 'LAST_7_DAYS' }" @click="setQuickDate('LAST_7_DAYS', 7)">最近7天</button>
          <button :class="{ active: filterState.mode === 'LAST_30_DAYS' }" @click="setQuickDate('LAST_30_DAYS', 30)">最近30天</button>
          <button :class="{ active: filterState.mode === 'CUSTOM_RANGE' }" @click="openDateModal('CUSTOM_RANGE')">自定义时间段</button>
          <button :class="{ active: filterState.mode === 'SINGLE_DAY' }" @click="openDateModal('SINGLE_DAY')">单日</button>
          <button :class="{ active: filterState.mode === 'COMPARE' }" @click="openDateModal('COMPARE')">对比</button>
        </div>

        <div class="selected-info">{{ selectedDateText }}</div>
      </div>
    </div>

    <div class="dashboard-grid">
      <el-row :gutter="16" class="mb-16">
        <el-col :span="16">
          <el-card shadow="never" class="chart-card">
            <template #header><div class="c-head"><span>本品提及率趋势</span></div></template>
            <div ref="lineChart1Ref" style="height: 280px; width: 100%;"></div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card shadow="never" class="chart-card">
            <template #header><div class="c-head"><span>提及率 TOP10</span><button type="button" class="view-all-link" @click="openMentionRateDetail">查看全部 <span class="view-arrow">→</span></button></div></template>
            <div ref="barChart1Ref" class="side-chart"></div>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="16" class="mb-16">
        <el-col :span="16">
          <el-card shadow="never" class="chart-card">
            <template #header><div class="c-head"><span>本品平均推荐顺位趋势</span></div></template>
            <div ref="lineChart2Ref" style="height: 280px; width: 100%;"></div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card shadow="never" class="chart-card">
            <template #header><div class="c-head"><span>平均推荐顺位 TOP10</span><button type="button" class="view-all-link" @click="openAvgRankDetail">查看全部 <span class="view-arrow">→</span></button></div></template>
            <div ref="barChart2Ref" class="side-chart"></div>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="16" class="mb-16">
        <el-col :span="16">
          <el-card shadow="never" class="chart-card rank-card" style="height: 100%;">
            <template #header><div class="c-head"><span><el-icon><List /></el-icon> 行业竞品排名</span></div></template>
            <el-table :data="tableRankData" style="width: 100%" size="small" class="rank-table">
              <el-table-column prop="rank" label="#" width="56" align="center" />
              <el-table-column prop="brand" label="品牌" min-width="96">
                <template #default="{ row }">
                  <span class="brand-name-cell">{{ row.brand }}</span>
                </template>
              </el-table-column>
              <el-table-column label="提及率">
                <template #default="{row}"><span class="table-val"><span class="metric-main">{{row.v1}}</span><span class="up" v-if="row.d1"><span class="trend-arrow arrow-up"></span>{{row.d1}}</span><span class="down" v-else><span class="trend-arrow arrow-down"></span>{{row.d1_down}}</span></span></template>
              </el-table-column>
              <el-table-column label="首推率">
                <template #default="{row}"><span class="table-val"><span class="metric-main">{{row.v2}}</span><span class="up" v-if="row.d2"><span class="trend-arrow arrow-up"></span>{{row.d2}}</span><span class="muted" v-else>—</span></span></template>
              </el-table-column>
              <el-table-column label="平均顺位">
                <template #default="{row}"><span class="table-val"><span class="metric-main">{{row.v3}}</span><span class="down rank-better" v-if="row.d3"><span class="trend-arrow arrow-down"></span>{{row.d3}}</span></span></template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card shadow="never" class="chart-card mention-change-card" style="height: 100%;">
            <template #header>
              <div class="mention-change-head">
                <div class="mention-change-title">
                  <span class="rocket-icon">♙</span>
                  <span>提及率变化</span>
                  <span class="help-icon">?</span>
                </div>
                <button type="button" class="view-all-link" @click="openMentionChangeDetail">
                  查看全部 <span class="view-arrow">→</span>
                </button>
              </div>
            </template>
            <div ref="waterfallChartRef" class="mention-change-chart side-chart"></div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <div class="date-modal-mask" :class="{ show: dateModalVisible }" @click.self="closeDateModal">
      <div class="date-modal">
        <div class="date-modal-header">
          <h3>{{ dateModalTitle }}</h3>
          <button class="date-modal-close" @click="closeDateModal">×</button>
        </div>
        <div class="date-modal-body">
          <div class="date-modal-row" v-if="pendingDate?.mode === 'CUSTOM_RANGE'">
            <label>时间段</label>
            <input type="date" v-model="pendingDate.startDate" />
            <span>至</span>
            <input type="date" v-model="pendingDate.endDate" />
          </div>
          <div class="date-modal-row" v-if="pendingDate?.mode === 'SINGLE_DAY'">
            <label>选择日期</label>
            <input type="date" v-model="pendingDate.date" />
          </div>
          <div class="date-modal-row" v-if="pendingDate?.mode === 'COMPARE'">
            <label>当前日期</label><input type="date" v-model="pendingDate.currentDate" />
            <label>对比日期</label><input type="date" v-model="pendingDate.compareDate" />
          </div>
        </div>
        <div class="date-modal-footer">
          <button class="ghost-btn" @click="closeDateModal">取消</button>
          <button class="primary-btn" @click="confirmDateModal">确定</button>
        </div>
      </div>
    </div>

    <div class="chart-detail-mask" :class="{ show: mentionRateDialogVisible }" @click.self="closeMentionRateDetail">
      <div class="chart-detail-modal mention-rate-detail-modal">
        <div class="chart-detail-header">
          <h3>品牌提及率排名详情</h3>
          <button class="chart-detail-close" @click="closeMentionRateDetail">×</button>
        </div>
        <div ref="mentionRateDetailRef" class="mention-rate-detail-chart"></div>
        <div class="chart-detail-footer">
          无提及的品牌: 红色小象、优泽、施巴、兔头妈妈
        </div>
      </div>
    </div>

    <div class="chart-detail-mask" :class="{ show: avgRankDialogVisible }" @click.self="closeAvgRankDetail">
      <div class="chart-detail-modal mention-rate-detail-modal">
        <div class="chart-detail-header">
          <h3>品牌平均推荐顺位排名详情</h3>
          <button class="chart-detail-close" @click="closeAvgRankDetail">×</button>
        </div>
        <div ref="avgRankDetailRef" class="mention-rate-detail-chart"></div>
        <div class="chart-detail-footer">
          无有效顺位的品牌: 红色小象、优泽、施巴、兔头妈妈
        </div>
      </div>
    </div>

    <div class="chart-detail-mask" :class="{ show: mentionChangeDialogVisible }" @click.self="closeMentionChangeDetail">
      <div class="chart-detail-modal">
        <div class="chart-detail-header">
          <h3>品牌提及率变化详情</h3>
          <button class="chart-detail-close" @click="closeMentionChangeDetail">×</button>
        </div>
        <div ref="mentionChangeDetailRef" class="mention-change-detail-chart"></div>
        <div class="chart-detail-footer">
          无变化的品牌：优泽、兔头妈妈、润本、爱舒屋、红色小象、青蛙王子
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, reactive, computed, nextTick, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { List } from '@element-plus/icons-vue'
import * as echarts from 'echarts'

// --- 基础状态预设 ---
const today = '2026-04-15'
const route = useRoute()

// --- 模型选择逻辑重构为 Vue 响应式 ---
const modelOptions = [
  { code: 'ALL', name: '所有模型', mark: '全', logoClass: 'logo-all' },
  { code: 'deepseek-chat', name: 'DeepSeek', mark: 'D', logoClass: 'logo-deepseek' },
  { code: 'doubao', name: '豆包', mark: '豆', logoClass: 'logo-doubao' },
  { code: 'qwen', name: '通义千问', mark: '千', logoClass: 'logo-qwen' },
  { code: 'yuanbao', name: '腾讯元宝', mark: '元', logoClass: 'logo-yuanbao' },
  { code: 'ernie', name: '文心一言', mark: '文', logoClass: 'logo-ernie' }
]
const selectableModels = modelOptions.filter(item => item.code !== 'ALL')

const filterState = reactive({
  mode: 'LAST_7_DAYS',
  startDate: '2026-04-09',
  endDate: '2026-04-15',
  date: '2026-04-15',
  currentDate: '2026-04-15',
  compareDate: '2026-04-14',
  selectedModels: ['deepseek-chat', 'doubao', 'qwen', 'yuanbao', 'ernie']
})

const buildTableRows = (items) => items.slice(0, 10).map((item, index) => ({
  rank: index + 1,
  brand: item.brand,
  v1: `${item.mention.toFixed(1)}%`,
  ...(item.mentionDelta >= 0 ? { d1: `${Math.abs(item.mentionDelta).toFixed(1)}%` } : { d1_down: `${Math.abs(item.mentionDelta).toFixed(1)}%` }),
  v2: `${item.first.toFixed(1)}%`,
  d2: `${item.firstDelta.toFixed(1)}%`,
  v3: item.rankValue.toFixed(1),
  d3: item.rankDelta.toFixed(1)
}))

const projectOverviewConfigs = {
  'proj-shuangyanpi': {
    brand: '初敏',
    questionCount: 40,
    todayProgress: '40/80',
    tableRows: buildTableRows([
      { brand: '初敏', mention: 86.7, mentionDelta: 6.7, first: 53.3, firstDelta: 8.3, rankValue: 1.9, rankDelta: 0.5 },
      { brand: '艾维诺', mention: 80.0, mentionDelta: 3.3, first: 45.0, firstDelta: 5.0, rankValue: 2.2, rankDelta: 0.2 },
      { brand: '贝亲', mention: 73.3, mentionDelta: -3.4, first: 31.7, firstDelta: 2.0, rankValue: 2.7, rankDelta: 0.4 },
      { brand: '戴可思', mention: 66.7, mentionDelta: 5.0, first: 25.0, firstDelta: 3.6, rankValue: 3.1, rankDelta: 0.6 },
      { brand: '妙思乐', mention: 58.3, mentionDelta: -6.7, first: 18.3, firstDelta: 1.7, rankValue: 3.6, rankDelta: 0.3 },
      { brand: '启初', mention: 51.7, mentionDelta: 3.3, first: 16.7, firstDelta: 1.3, rankValue: 4.1, rankDelta: 0.2 },
      { brand: '理肤泉', mention: 48.0, mentionDelta: -2.0, first: 15.0, firstDelta: 1.0, rankValue: 4.8, rankDelta: 0.4 },
      { brand: '丝塔芙', mention: 43.7, mentionDelta: -3.3, first: 13.3, firstDelta: 0.8, rankValue: 5.3, rankDelta: 0.3 },
      { brand: '松达', mention: 37.0, mentionDelta: 1.7, first: 10.0, firstDelta: 0.7, rankValue: 5.9, rankDelta: 0.5 },
      { brand: '适乐肤', mention: 33.3, mentionDelta: -1.4, first: 8.3, firstDelta: 0.5, rankValue: 6.5, rankDelta: 0.4 }
    ]),
    rateTop: [
      { brand: '纽强', value: 90 }, { brand: '初敏', value: 80 }, { brand: '艾维诺', value: 80 }, { brand: '丝塔芙', value: 53.3 }, { brand: '芮洣舒', value: 40 },
      { brand: '科赫', value: 40 }, { brand: '凡士林', value: 33.3 }, { brand: '松达', value: 30 }, { brand: '妙思乐', value: 26.7 }, { brand: '适乐肤', value: 23.3 }
    ],
    rankTop: [
      { brand: '初敏', value: 1.9 }, { brand: '艾维诺', value: 2.2 }, { brand: '贝亲', value: 2.7 }, { brand: '戴可思', value: 3.1 }, { brand: '妙思乐', value: 3.6 },
      { brand: '启初', value: 4.1 }, { brand: '理肤泉', value: 4.8 }, { brand: '丝塔芙', value: 5.3 }, { brand: '松达', value: 5.9 }, { brand: '适乐肤', value: 6.5 }
    ]
  },
  'proj-jinan': {
    brand: '卓牧',
    questionCount: 40,
    todayProgress: '36/80',
    tableRows: buildTableRows([
      { brand: '卓牧', mention: 84.0, mentionDelta: 5.3, first: 50.0, firstDelta: 6.0, rankValue: 2.0, rankDelta: 0.4 },
      { brand: '佳贝艾特', mention: 78.3, mentionDelta: 2.7, first: 42.0, firstDelta: 3.3, rankValue: 2.4, rankDelta: 0.2 },
      { brand: '蓝河', mention: 69.7, mentionDelta: -1.7, first: 34.0, firstDelta: 2.2, rankValue: 2.9, rankDelta: 0.3 },
      { brand: '蓓康僖', mention: 62.0, mentionDelta: 4.0, first: 26.7, firstDelta: 1.8, rankValue: 3.5, rankDelta: 0.5 },
      { brand: '羊滋滋', mention: 56.3, mentionDelta: -2.3, first: 20.0, firstDelta: 1.5, rankValue: 4.0, rankDelta: 0.3 },
      { brand: '可诺贝儿', mention: 49.0, mentionDelta: 3.0, first: 16.7, firstDelta: 1.0, rankValue: 4.7, rankDelta: 0.4 },
      { brand: '朵恩', mention: 43.3, mentionDelta: -1.3, first: 14.0, firstDelta: 0.8, rankValue: 5.2, rankDelta: 0.3 },
      { brand: '美羚', mention: 38.7, mentionDelta: 1.0, first: 11.3, firstDelta: 0.7, rankValue: 5.8, rankDelta: 0.5 },
      { brand: '圣唐', mention: 32.0, mentionDelta: -2.0, first: 9.0, firstDelta: 0.5, rankValue: 6.4, rankDelta: 0.4 },
      { brand: '卡洛塔妮', mention: 27.3, mentionDelta: 1.3, first: 7.0, firstDelta: 0.4, rankValue: 7.1, rankDelta: 0.6 }
    ]),
    rateTop: [
      { brand: '卓牧', value: 84 }, { brand: '佳贝艾特', value: 78.3 }, { brand: '蓝河', value: 69.7 }, { brand: '蓓康僖', value: 62 }, { brand: '羊滋滋', value: 56.3 },
      { brand: '可诺贝儿', value: 49 }, { brand: '朵恩', value: 43.3 }, { brand: '美羚', value: 38.7 }, { brand: '圣唐', value: 32 }, { brand: '卡洛塔妮', value: 27.3 }
    ],
    rankTop: [
      { brand: '卓牧', value: 2.0 }, { brand: '佳贝艾特', value: 2.4 }, { brand: '蓝河', value: 2.9 }, { brand: '蓓康僖', value: 3.5 }, { brand: '羊滋滋', value: 4.0 },
      { brand: '可诺贝儿', value: 4.7 }, { brand: '朵恩', value: 5.2 }, { brand: '美羚', value: 5.8 }, { brand: '圣唐', value: 6.4 }, { brand: '卡洛塔妮', value: 7.1 }
    ]
  }
}

const fallbackOverview = projectOverviewConfigs['proj-shuangyanpi']
const currentProjectId = computed(() => route.params.id || 'proj-shuangyanpi')
const currentOverview = computed(() => projectOverviewConfigs[currentProjectId.value] || fallbackOverview)

const modelMenuOpen = ref(false)
const pendingModels = ref(null)
const modelFilterRef = ref(null)

const isAllModelsSelected = (list) => selectableModels.every(m => list.includes(m.code))
const getSelectedModelItems = (list) => selectableModels.filter(m => list.includes(m.code))
const isModelChecked = (code) => {
  const currentList = pendingModels.value || filterState.selectedModels
  return code === 'ALL' ? isAllModelsSelected(currentList) : currentList.includes(code)
}
const isModelLocked = (code) => {
  const currentList = pendingModels.value || filterState.selectedModels
  return code !== 'ALL' && currentList.includes(code) && currentList.length === 1
}

const toggleModelMenu = () => {
  if (modelMenuOpen.value) { cancelModelSelection() }
  else { pendingModels.value = [...filterState.selectedModels]; modelMenuOpen.value = true }
}

const togglePendingModel = (code) => {
  let pending = [...(pendingModels.value || filterState.selectedModels)]
  if (code === 'ALL') { pendingModels.value = selectableModels.map(m => m.code); return }
  if (pending.includes(code)) {
    if (pending.length === 1) return // 至少保留一个
    pending = pending.filter(c => c !== code)
  } else { pending.push(code) }
  pendingModels.value = pending
}

const confirmModelSelection = () => {
  if (!pendingModels.value || pendingModels.value.length === 0) return
  filterState.selectedModels = [...pendingModels.value]
  modelMenuOpen.value = false
  pendingModels.value = null
  refreshCharts() // 重新拉取数据
}

const cancelModelSelection = () => {
  modelMenuOpen.value = false
  pendingModels.value = null
}

// 全局点击关闭下拉框
const handleClickOutside = (e) => {
  if (modelMenuOpen.value && modelFilterRef.value && !modelFilterRef.value.contains(e.target)) {
    cancelModelSelection()
  }
}

// --- 日期选择逻辑重构 ---
const dateModalVisible = ref(false)
const pendingDate = ref(null)

const setQuickDate = (mode, days) => {
  filterState.mode = mode
  filterState.endDate = today
  const d = new Date(today + 'T00:00:00')
  d.setDate(d.getDate() - (days - 1))
  filterState.startDate = d.toISOString().slice(0, 10)
  refreshCharts()
}

const openDateModal = (mode) => {
  pendingDate.value = { mode, startDate: filterState.startDate, endDate: filterState.endDate, date: filterState.date, currentDate: filterState.currentDate, compareDate: filterState.compareDate }
  dateModalVisible.value = true
}

const closeDateModal = () => { dateModalVisible.value = false; pendingDate.value = null }

const confirmDateModal = () => {
  const p = pendingDate.value
  filterState.mode = p.mode
  if (p.mode === 'CUSTOM_RANGE') { filterState.startDate = p.startDate; filterState.endDate = p.endDate }
  if (p.mode === 'SINGLE_DAY') { filterState.date = p.date }
  if (p.mode === 'COMPARE') { filterState.currentDate = p.currentDate; filterState.compareDate = p.compareDate }
  closeDateModal()
  refreshCharts()
}

const dateModalTitle = computed(() => {
  if (pendingDate.value?.mode === 'CUSTOM_RANGE') return '选择自定义时间段'
  if (pendingDate.value?.mode === 'SINGLE_DAY') return '选择单日日期'
  if (pendingDate.value?.mode === 'COMPARE') return '选择两天对比日期'
  return '选择日期'
})

const selectedDateText = computed(() => {
  if (filterState.mode === 'LAST_7_DAYS') return `最近7天：${filterState.startDate} ~ ${filterState.endDate}`
  if (filterState.mode === 'LAST_30_DAYS') return `最近30天：${filterState.startDate} ~ ${filterState.endDate}`
  if (filterState.mode === 'CUSTOM_RANGE') return `自定义：${filterState.startDate} ~ ${filterState.endDate}`
  if (filterState.mode === 'SINGLE_DAY') return `单日：${filterState.date}`
  if (filterState.mode === 'COMPARE') return `两天对比：${filterState.currentDate} vs ${filterState.compareDate}`
  return ''
})

const formatDateLabel = (date) => {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${month}-${day}`
}

const getDateRangeLabels = (startDate, endDate) => {
  const start = new Date(`${startDate}T00:00:00`)
  const end = new Date(`${endDate}T00:00:00`)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) return [formatDateLabel(new Date(`${today}T00:00:00`))]

  const labels = []
  const cursor = new Date(start)
  while (cursor <= end && labels.length < 90) {
    labels.push(formatDateLabel(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  return labels
}

const getActiveTrendDates = () => {
  if (filterState.mode === 'SINGLE_DAY') return getDateRangeLabels(filterState.date, filterState.date)
  if (filterState.mode === 'COMPARE') return [filterState.compareDate, filterState.currentDate].map(date => formatDateLabel(new Date(`${date}T00:00:00`)))
  return getDateRangeLabels(filterState.startDate, filterState.endDate)
}

const createTrendValues = (baseData, pointCount, precision = 1, bounds = {}, volatility = 1.2) => {
  if (pointCount <= 1) return [baseData[baseData.length - 1]]
  const lastIndex = baseData.length - 1
  return Array.from({ length: pointCount }, (_, index) => {
    const position = (index / (pointCount - 1)) * lastIndex
    const left = Math.floor(position)
    const right = Math.min(lastIndex, left + 1)
    const ratio = position - left
    const interpolated = baseData[left] + (baseData[right] - baseData[left]) * ratio
    const wave = (Math.sin(index * 0.9) + Math.cos(index * 1.7) * 0.55) * volatility
    const min = bounds.min ?? -Infinity
    const max = bounds.max ?? Infinity
    const value = Math.min(max, Math.max(min, interpolated + wave))
    return Number(value.toFixed(precision))
  })
}

// --- 底部图表模拟数据 ---
const tableRankData = ref(currentOverview.value.tableRows)

const trendDates = ['04-09', '04-10', '04-11', '04-12', '04-13', '04-14', '04-15']
const modelMentionRateSeries = {
  'deepseek-chat': { name: 'DeepSeek', color: '#10b981', data: [58.3, 66.7, 53.3, 70, 63.3, 76.7, 68.3] },
  doubao: { name: '豆包', color: '#245bff', data: [73.3, 61.7, 66.7, 55, 78.3, 70, 86.7] },
  qwen: { name: '通义千问', color: '#f59e0b', data: [46.7, 55, 48.3, 60, 51.7, 63.3, 58.3] },
  yuanbao: { name: '腾讯元宝', color: '#8b5cf6', data: [63.3, 58.3, 73.3, 66.7, 80, 71.7, 76.7] },
  ernie: { name: '文心一言', color: '#ef4444', data: [38.3, 46.7, 41.7, 56.7, 48.3, 60, 53.3] }
}
const modelAvgRankSeries = {
  'deepseek-chat': { name: 'DeepSeek', color: '#10b981', data: [3.8, 2.9, 4.1, 2.6, 3.3, 2.4, 3.0] },
  doubao: { name: '豆包', color: '#245bff', data: [2.7, 3.4, 2.2, 4.0, 2.1, 2.8, 1.9] },
  qwen: { name: '通义千问', color: '#f59e0b', data: [4.8, 4.1, 5.2, 3.7, 4.5, 3.2, 4.0] },
  yuanbao: { name: '腾讯元宝', color: '#8b5cf6', data: [3.1, 4.0, 2.8, 3.5, 2.4, 3.1, 2.6] },
  ernie: { name: '文心一言', color: '#ef4444', data: [5.5, 4.7, 5.9, 4.2, 5.0, 3.8, 4.6] }
}
const mentionChangeData = [
  { brand: '初敏', value: 80 },
  { brand: '艾维诺', value: 53.3 },
  { brand: '纽强', value: 13.3 },
  { brand: '启初', value: 6.7 },
  { brand: '玉泽', value: 3.3 },
  { brand: '加州宝宝', value: -3.3 },
  { brand: '宫中秘策', value: -3.3 },
  { brand: '维蕾德', value: -3.3 },
  { brand: '霏丝佳', value: -3.3 },
  { brand: '贝亲', value: -3.3 },
  { brand: '戴可思', value: -6.7 },
  { brand: '凡士林', value: -10 },
  { brand: '施巴', value: -16.7 },
  { brand: '理肤泉', value: -16.7 },
  { brand: '郁美净', value: -20 },
  { brand: '芮洣舒', value: -23.3 },
  { brand: '优色林', value: -30 },
  { brand: '妙思乐', value: -40 },
  { brand: '松达', value: -40 },
  { brand: '顺峰宝宝', value: -40 },
  { brand: '丝塔芙', value: -43.3 },
  { brand: '科赫', value: -50 },
  { brand: '适乐肤', value: -53.3 },
  { brand: '雅漾', value: -60 },
  { brand: '华西珐玛', value: -63.3 }
]

// ECharts 实例化
const lineChart1Ref = ref(null)
const barChart1Ref = ref(null)
const lineChart2Ref = ref(null)
const barChart2Ref = ref(null)
const waterfallChartRef = ref(null)
const mentionRateDetailRef = ref(null)
const avgRankDetailRef = ref(null)
const mentionChangeDetailRef = ref(null)
const mentionRateDialogVisible = ref(false)
const avgRankDialogVisible = ref(false)
const mentionChangeDialogVisible = ref(false)

const chartInsts = []
let mentionRateDetailChart = null
let avgRankDetailChart = null
let mentionChangeDetailChart = null

const formatPercentChange = (value) => {
  const abs = Math.abs(value)
  const text = Number.isInteger(abs) ? abs.toFixed(0) : abs.toFixed(1)
  return `${value > 0 ? '+' : '-'}${text}%`
}

const getMentionColor = (value) => {
  if (value >= 70) return '#b7043d'
  if (value >= 40) return '#df3730'
  if (value >= 10) return '#ff7147'
  if (value >= 5) return '#ffb35e'
  if (value > 0) return '#ffe28b'
  if (value <= -58) return '#41409d'
  if (value <= -50) return '#5b86bd'
  if (value <= -40) return '#7cb6d5'
  if (value <= -15) return '#dff3f7'
  return '#ffedaa'
}

const buildMentionSeriesData = (data, predicate) => data.map(item => {
  if (!predicate(item.value)) return null
  return {
    value: item.value,
    itemStyle: {
      color: getMentionColor(item.value),
      borderRadius: 0,
      shadowBlur: item.value >= 70 ? 14 : 0,
      shadowColor: 'rgba(15, 23, 42, 0.28)',
      shadowOffsetX: item.value >= 70 ? 5 : 0,
      shadowOffsetY: item.value >= 70 ? 5 : 0
    }
  }
})

const createMentionBarSeries = ({ data, compact, predicate, position, labelTone, markLine = false }) => ({
  type: 'bar',
  barWidth: compact ? 20 : 18,
  barGap: '-100%',
  data: buildMentionSeriesData(data, predicate),
  label: {
    show: true,
    position,
    distance: compact ? 8 : 6,
    formatter: params => params.value == null ? '' : `{${labelTone}|${formatPercentChange(params.value)}}`,
    verticalAlign: 'middle',
    rich: {
      light: {
        color: '#fff',
        fontSize: 11,
        fontWeight: 500,
        lineHeight: compact ? 20 : 18,
        align: 'center'
      },
      dark: {
        color: '#5f6368',
        fontSize: 11,
        fontWeight: 500,
        lineHeight: compact ? 20 : 18,
        align: 'center'
      }
    }
  },
  ...(markLine ? {
    markLine: {
      symbol: 'none',
      silent: true,
      label: { show: false },
      lineStyle: { color: '#e5e7eb', width: 1 },
      data: [{ xAxis: 0 }]
    }
  } : {})
})

const createMentionChangeOption = (data, compact = false) => ({
  grid: {
    left: compact ? 78 : 96,
    right: compact ? 26 : 72,
    top: compact ? 10 : 20,
    bottom: compact ? 8 : 24,
    containLabel: true
  },
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'shadow' },
    formatter: (params) => {
      const item = params[0]
      return `${item.name}<br/>提及率变化：<strong>${formatPercentChange(item.value)}</strong>`
    }
  },
  xAxis: {
    type: 'value',
    min: -80,
    max: 90,
    axisLabel: { show: false },
    axisLine: { show: false },
    axisTick: { show: false },
    interval: 40,
    splitLine: { show: true, lineStyle: { color: '#ecf1f6', type: 'dashed', width: 1 } }
  },
  yAxis: {
    type: 'category',
    inverse: true,
    data: data.map(item => item.brand),
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: '#262626', fontSize: 14, fontWeight: 500, margin: 10 },
    splitLine: { show: compact, lineStyle: { color: '#f1f4f8', width: 1 } }
  },
  series: [
    createMentionBarSeries({
      data,
      compact,
      predicate: value => value >= 40,
      position: 'insideRight',
      labelTone: 'light',
      markLine: true
    }),
    createMentionBarSeries({
      data,
      compact,
      predicate: value => value > 0 && value < 40,
      position: 'right',
      labelTone: 'dark'
    }),
    createMentionBarSeries({
      data,
      compact,
      predicate: value => value <= -40,
      position: 'insideLeft',
      labelTone: 'light'
    }),
    createMentionBarSeries({
      data,
      compact,
      predicate: value => value < 0 && value > -40,
      position: 'left',
      labelTone: 'dark'
    })
  ]
})

const top10BlueColors = ['#1f477e', '#17577f', '#2f70a9', '#3b8bc2', '#4aa1d2', '#56b3de', '#67c1e2', '#78c9e6', '#86d0ea', '#9eddf0']
const mentionRateFullData = [
  { brand: '纽强', value: 86.3 },
  { brand: '初敏', value: 80.7 },
  { brand: '薇诺娜', value: 70 },
  { brand: '丝塔芙', value: 67.3 },
  { brand: '科赫', value: 57.7 },
  { brand: '艾维诺', value: 48 },
  { brand: '凡士林', value: 43.7 },
  { brand: '顺峰宝宝', value: 37 },
  { brand: '妙思乐', value: 30 },
  { brand: '松达', value: 27.3 },
  { brand: '适乐肤', value: 22.7 },
  { brand: '雅漾', value: 17.7 },
  { brand: '优色林', value: 16 },
  { brand: '华西珐玛', value: 15 },
  { brand: '启初', value: 9.7 },
  { brand: '戴可思', value: 9 },
  { brand: '郁美净', value: 7.3 },
  { brand: '理肤泉', value: 4.3 },
  { brand: '霏丝佳', value: 3.7 },
  { brand: '加州宝宝', value: 2 },
  { brand: '玉泽', value: 1 },
  { brand: '贝亲', value: 0.7 },
  { brand: '宫中秘策', value: 0.7 },
  { brand: '维蕾德', value: 0.3 },
  { brand: '爱舒屋', value: 0.3 },
  { brand: '青蛙王子', value: 0.3 },
  { brand: '润本', value: 0.3 }
]
const avgRankFullData = [
  { brand: '初敏', value: 1.9 },
  { brand: '艾维诺', value: 2.2 },
  { brand: '贝亲', value: 2.7 },
  { brand: '戴可思', value: 3.1 },
  { brand: '妙思乐', value: 3.6 },
  { brand: '启初', value: 4.1 },
  { brand: '理肤泉', value: 4.8 },
  { brand: '丝塔芙', value: 5.3 },
  { brand: '松达', value: 5.9 },
  { brand: '适乐肤', value: 6.5 },
  { brand: '纽强', value: 6.9 },
  { brand: '科赫', value: 7.4 },
  { brand: '凡士林', value: 7.8 },
  { brand: '顺峰宝宝', value: 8.2 },
  { brand: '雅漾', value: 8.6 },
  { brand: '优色林', value: 9.1 },
  { brand: '华西珐玛', value: 9.4 },
  { brand: '郁美净', value: 9.8 },
  { brand: '霏丝佳', value: 10.2 },
  { brand: '加州宝宝', value: 10.6 },
  { brand: '玉泽', value: 11.1 },
  { brand: '贝德美', value: 11.7 },
  { brand: '宫中秘策', value: 12.2 },
  { brand: '维蕾德', value: 12.8 },
  { brand: '爱舒屋', value: 13.3 },
  { brand: '青蛙王子', value: 13.9 },
  { brand: '润本', value: 14.5 }
]

const createBlueTop10Option = ({ brands, values, labels, max = 100 }) => ({
  grid: { left: 72, right: 18, top: 8, bottom: 8, containLabel: true },
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'shadow' },
    formatter: (params) => {
      const item = params[0]
      return `${item.name}<br/><strong>${labels[item.dataIndex]}</strong>`
    }
  },
  xAxis: {
    type: 'value',
    min: 0,
    max,
    axisLabel: { show: false },
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: { show: true, lineStyle: { color: '#e8edf3', type: 'dashed', width: 1 } }
  },
  yAxis: {
    type: 'category',
    inverse: true,
    data: brands,
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: {
      color: '#262626',
      fontSize: 14,
      fontWeight: 500,
      margin: 12
    }
  },
  series: [{
    type: 'bar',
    barWidth: 20,
    data: values.map((value, index) => ({
      value,
      labelText: labels[index],
      itemStyle: {
        color: top10BlueColors[index] || top10BlueColors[top10BlueColors.length - 1],
        borderRadius: 0,
        shadowBlur: index === 1 ? 12 : 0,
        shadowColor: 'rgba(15, 23, 42, 0.3)',
        shadowOffsetX: index === 1 ? 4 : 0,
        shadowOffsetY: index === 1 ? 5 : 0
      }
    })),
    label: {
      show: true,
      position: 'insideRight',
      distance: 8,
      formatter: params => `{light|${params.data.labelText}}`,
      rich: {
        light: {
          color: '#fff',
          fontSize: 11,
          fontWeight: 500,
          lineHeight: 20,
          align: 'center'
        },
        dark: {
          color: '#5f6368',
          fontSize: 11,
          fontWeight: 500,
          lineHeight: 20,
          align: 'center'
        }
      }
    }
  }]
})

const formatRateLabel = (value) => `${Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1)}%`

const createMentionRateDetailOption = () => ({
  grid: { left: 68, right: 36, top: 96, bottom: 116, containLabel: true },
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'shadow' },
    formatter: (params) => {
      const item = params[0]
      return `${item.name}<br/>提及率: <strong>${formatRateLabel(item.value)}</strong>`
    }
  },
  xAxis: {
    type: 'category',
    data: currentOverview.value.rateTop.map(item => item.brand),
    axisLine: { show: true, lineStyle: { color: '#d7dce2' } },
    axisTick: { show: false },
    axisLabel: {
      color: '#9aa1ad',
      fontSize: 14,
      fontWeight: 500,
      interval: 0,
      rotate: 45,
      margin: 14
    }
  },
  yAxis: {
    type: 'value',
    min: 0,
    max: 100,
    interval: 20,
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: {
      color: '#9aa1ad',
      fontSize: 14,
      formatter: '{value}%'
    },
    splitLine: { show: true, lineStyle: { color: '#e9edf2', type: 'dashed', width: 1 } }
  },
  series: [{
    type: 'bar',
    barWidth: 36,
    data: currentOverview.value.rateTop.map((item, index) => ({
      value: item.value,
      itemStyle: {
        color: index < 2
          ? ['#1f477e', '#214f88'][index]
          : `rgba(${30 + index * 5}, ${92 + index * 4}, ${150 + index * 3}, ${Math.max(0.38, 0.94 - index * 0.022)})`
      }
    })),
    label: {
      show: true,
      position: 'top',
      distance: 8,
      rotate: 0,
      color: '#68717d',
      fontSize: 12,
      fontWeight: 500,
      align: 'center',
      formatter: params => formatRateLabel(params.value)
    }
  }]
})

const renderMentionRateDetail = () => {
  if (!mentionRateDetailRef.value) return
  if (mentionRateDetailChart) mentionRateDetailChart.dispose()
  mentionRateDetailChart = echarts.init(mentionRateDetailRef.value)
  mentionRateDetailChart.setOption(createMentionRateDetailOption())
}

const openMentionRateDetail = async () => {
  mentionRateDialogVisible.value = true
  await nextTick()
  renderMentionRateDetail()
}

const closeMentionRateDetail = () => {
  mentionRateDialogVisible.value = false
  if (mentionRateDetailChart) {
    mentionRateDetailChart.dispose()
    mentionRateDetailChart = null
  }
}

const createAvgRankDetailOption = () => ({
  grid: { left: 68, right: 36, top: 96, bottom: 116, containLabel: true },
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'shadow' },
    formatter: (params) => {
      const item = params[0]
      return `${item.name}<br/>平均推荐顺位: <strong>${Number(item.data.rankValue).toFixed(1)}</strong>`
    }
  },
  xAxis: {
    type: 'category',
    data: currentOverview.value.rankTop.map(item => item.brand),
    axisLine: { show: true, lineStyle: { color: '#d7dce2' } },
    axisTick: { show: false },
    axisLabel: {
      color: '#9aa1ad',
      fontSize: 14,
      fontWeight: 500,
      interval: 0,
      rotate: 45,
      margin: 14
    }
  },
  yAxis: {
    type: 'value',
    min: 0,
    max: 14,
    interval: 2,
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: {
      color: '#9aa1ad',
      fontSize: 14,
      formatter: value => value === 0 ? '' : Number(15 - value).toFixed(0)
    },
    splitLine: { show: true, lineStyle: { color: '#e9edf2', type: 'dashed', width: 1 } }
  },
  series: [{
    type: 'bar',
    barWidth: 36,
    data: currentOverview.value.rankTop.map((item, index) => ({
      value: Number((15 - item.value).toFixed(1)),
      rankValue: item.value,
      itemStyle: {
        color: index < 2
          ? ['#1f477e', '#214f88'][index]
          : `rgba(${30 + index * 5}, ${92 + index * 4}, ${150 + index * 3}, ${Math.max(0.38, 0.94 - index * 0.022)})`
      }
    })),
    label: {
      show: true,
      position: 'top',
      distance: 8,
      color: '#68717d',
      fontSize: 12,
      fontWeight: 500,
      align: 'center',
      formatter: params => Number(params.data.rankValue).toFixed(1)
    }
  }]
})

const renderAvgRankDetail = () => {
  if (!avgRankDetailRef.value) return
  if (avgRankDetailChart) avgRankDetailChart.dispose()
  avgRankDetailChart = echarts.init(avgRankDetailRef.value)
  avgRankDetailChart.setOption(createAvgRankDetailOption())
}

const openAvgRankDetail = async () => {
  avgRankDialogVisible.value = true
  await nextTick()
  renderAvgRankDetail()
}

const closeAvgRankDetail = () => {
  avgRankDialogVisible.value = false
  if (avgRankDetailChart) {
    avgRankDetailChart.dispose()
    avgRankDetailChart = null
  }
}

const renderMentionChangeDetail = () => {
  if (!mentionChangeDetailRef.value) return
  if (mentionChangeDetailChart) mentionChangeDetailChart.dispose()
  mentionChangeDetailChart = echarts.init(mentionChangeDetailRef.value)
  mentionChangeDetailChart.setOption(createMentionChangeOption(mentionChangeData, false))
}

const openMentionChangeDetail = async () => {
  mentionChangeDialogVisible.value = true
  await nextTick()
  renderMentionChangeDetail()
}

const closeMentionChangeDetail = () => {
  mentionChangeDialogVisible.value = false
  if (mentionChangeDetailChart) {
    mentionChangeDetailChart.dispose()
    mentionChangeDetailChart = null
  }
}

const refreshCharts = () => {
  chartInsts.forEach(c => c.dispose())
  chartInsts.length = 0

  if (lineChart1Ref.value) {
    const c = echarts.init(lineChart1Ref.value); chartInsts.push(c)
    const visibleModelCodes = filterState.selectedModels.filter(code => modelMentionRateSeries[code])
    const activeTrendDates = getActiveTrendDates()
    c.setOption({
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'line', lineStyle: { color: '#94a3b8', width: 1 } },
        backgroundColor: '#fff',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        padding: [10, 12],
        textStyle: { color: '#111827', fontSize: 12 },
        formatter: (params) => {
          const rows = params.map(item => {
            const value = typeof item.value === 'number' ? item.value.toFixed(1) : item.value
            return `${item.marker}<span style="display:inline-block;min-width:72px;">${item.seriesName}</span><strong>${value}%</strong>`
          })
          return [`<div style="margin-bottom:6px;color:#64748b;">2026-${params[0].axisValue}</div>`, ...rows].join('<br/>')
        }
      },
      legend: {
        top: 0,
        left: 'center',
        icon: 'circle',
        itemWidth: 8,
        itemHeight: 8,
        textStyle: { color: '#334155', fontSize: 12 },
        data: visibleModelCodes.map(code => modelMentionRateSeries[code].name)
      },
      grid: {left: '3%', right: '4%', top: 42, bottom: '3%', containLabel: true},
      xAxis: {type: 'category', boundaryGap: false, data: activeTrendDates},
      yAxis: {type: 'value', min: 0, max: 100, axisLabel: {formatter: '{value}%'}},
      series: visibleModelCodes.map(code => {
        const item = modelMentionRateSeries[code]
        return {
          name: item.name,
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 7,
          lineStyle: { width: 2 },
          itemStyle: { color: item.color },
          emphasis: { focus: 'series' },
          data: createTrendValues(item.data, activeTrendDates.length, 1, { min: 0, max: 100 }, 4.2)
        }
      })
    })
  }

  if (barChart1Ref.value) {
    const c = echarts.init(barChart1Ref.value); chartInsts.push(c)
    const topItems = currentOverview.value.rateTop
    const brands = topItems.map(item => item.brand)
    const values = topItems.map(item => item.value)
    c.setOption(createBlueTop10Option({
      brands,
      values,
      labels: values.map(value => `${Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1)}%`)
    }))
  }

  if (lineChart2Ref.value) {
    const c = echarts.init(lineChart2Ref.value); chartInsts.push(c)
    const visibleModelCodes = filterState.selectedModels.filter(code => modelAvgRankSeries[code])
    const activeTrendDates = getActiveTrendDates()
    const avgRankSeries = visibleModelCodes.map(code => {
      const item = modelAvgRankSeries[code]
      return {
        code,
        ...item,
        values: createTrendValues(item.data, activeTrendDates.length, 1, { min: 1, max: 10 }, 0.45)
      }
    })
    const rankValues = avgRankSeries.flatMap(item => item.values)
    const yAxisMax = Math.max(5, Math.ceil(Math.max(...rankValues, 1)))
    c.setOption({
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'line', lineStyle: { color: '#94a3b8', width: 1 } },
        backgroundColor: '#fff',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        padding: [10, 12],
        textStyle: { color: '#111827', fontSize: 12 },
        formatter: (params) => {
          const rows = params.map(item => {
            const value = typeof item.value === 'number' ? item.value.toFixed(1) : item.value
            return `${item.marker}<span style="display:inline-block;min-width:72px;">${item.seriesName}</span><strong>平均顺位 ${value}</strong>`
          })
          return [`<div style="margin-bottom:6px;color:#64748b;">2026-${params[0].axisValue}</div>`, ...rows].join('<br/>')
        }
      },
      legend: {
        top: 0,
        left: 'center',
        icon: 'circle',
        itemWidth: 8,
        itemHeight: 8,
        textStyle: { color: '#334155', fontSize: 12 },
        data: visibleModelCodes.map(code => modelAvgRankSeries[code].name)
      },
      grid: {left: '3%', right: '4%', top: 42, bottom: '3%', containLabel: true},
      xAxis: {type: 'category', boundaryGap: false, data: activeTrendDates},
      yAxis: {
        type: 'value',
        inverse: true,
        min: 1,
        max: yAxisMax,
        interval: 1,
        name: '',
        nameTextStyle: { color: '#64748b', fontSize: 12 },
        axisLabel: {
          formatter: value => Number(value).toFixed(0)
        }
      },
      series: avgRankSeries.map(item => {
        return {
          name: item.name,
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 7,
          lineStyle: { width: 2 },
          itemStyle: { color: item.color },
          emphasis: { focus: 'series' },
          data: item.values
        }
      })
    })
  }

  if (barChart2Ref.value) {
    const c = echarts.init(barChart2Ref.value); chartInsts.push(c)
    const rankItems = currentOverview.value.rankTop
    const brands = rankItems.map(item => item.brand)
    const ranks = rankItems.map(item => item.value)
    const values = ranks.map(rank => Number(((7 - rank) / 5.1 * 100).toFixed(1)))
    c.setOption(createBlueTop10Option({
      brands,
      values,
      labels: ranks.map(rank => rank.toFixed(1)),
      max: 100
    }))
  }

  if (waterfallChartRef.value) {
    const c = echarts.init(waterfallChartRef.value); chartInsts.push(c)
    c.setOption(createMentionChangeOption([
      ...mentionChangeData.slice(0, 5),
      ...mentionChangeData.slice(-5)
    ], true))
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  refreshCharts()
})

watch(currentProjectId, async () => {
  tableRankData.value = currentOverview.value.tableRows
  closeMentionRateDetail()
  closeAvgRankDetail()
  closeMentionChangeDetail()
  await nextTick()
  refreshCharts()
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  chartInsts.forEach(c => c.dispose())
  if (mentionRateDetailChart) mentionRateDetailChart.dispose()
  if (avgRankDetailChart) avgRankDetailChart.dispose()
  if (mentionChangeDetailChart) mentionChangeDetailChart.dispose()
})
</script>

<style scoped>
.data-overview-container { padding-bottom: 40px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", sans-serif; }

/* 1. 顶部基础属性信息栏对齐截图 */
.project-info-header { display: flex; flex-wrap: wrap; gap: 40px; padding: 20px; background: #fff; border-bottom: 1px solid #e5e7eb; margin-bottom: 20px; border-radius: 8px; }
.info-group { display: flex; flex-direction: column; gap: 8px; }
.info-item { font-size: 13px; color: #4b5563; }
.info-item strong { color: #111827; margin-left: 4px; }
.actions { flex-direction: row; align-items: center; margin-left: auto; gap: 12px; }

/* 2. 原生 HTML CSS 复刻 (局部限定避免污染) */
.card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; box-shadow: 0 4px 14px rgba(15, 23, 42, 0.03); }
.filter-card { padding: 16px; margin-bottom: 20px; }
.filter-row { display: flex; align-items: center; flex-wrap: wrap; gap: 12px; }

.segmented { display: inline-flex; padding: 4px; gap: 4px; border-radius: 12px; background: #eef2ff; border: 1px solid #dbe4ff; }
.segmented button { border: 0; background: transparent; color: #4b5563; cursor: pointer; border-radius: 9px; padding: 9px 14px; font-weight: 600; font-size: 13px; transition: all 0.2s; }
.segmented button.active { background: #245bff; color: #fff; box-shadow: 0 4px 10px rgba(36,91,255,.22); }
.primary-btn { height: 36px; border: 0; border-radius: 10px; background: #245bff; color: #fff; padding: 0 16px; cursor: pointer; font-weight: 700; }
.ghost-btn { height: 36px; border: 1px solid #d1d5db; border-radius: 10px; background: #fff; padding: 0 12px; cursor: pointer; color: #374151; font-weight: 600; }

/* 核心：大模型下拉框 CSS 完全复刻 */
.model-filter { position: relative; }
.model-trigger { height: 42px; min-width: 260px; border: 1px solid #dbe3ef; border-radius: 10px; background: #fff; padding: 0 14px; display: inline-flex; align-items: center; justify-content: space-between; gap: 12px; cursor: pointer; font-size: 14px; font-weight: bold; color: #111827; }
.model-trigger .left { display: inline-flex; align-items: center; gap: 10px; }
.chevron { width: 8px; height: 8px; border-right: 2px solid #111827; border-bottom: 2px solid #111827; transform: rotate(45deg); margin-top: -4px; }
.model-menu { display: none; position: absolute; top: 50px; left: 0; z-index: 20; width: 430px; background: #fff; border: 1px solid #dbe3ef; border-radius: 12px; box-shadow: 0 18px 45px rgba(15,23,42,.14); overflow: hidden; }
.model-menu.show { display: block; }
.model-option { width: 100%; border: 0; background: #fff; display: flex; align-items: center; gap: 14px; padding: 12px 18px; cursor: pointer; font-size: 14px; color: #111827; text-align: left; }
.model-option:hover { background: #f8fafc; }
.model-option.all { border-bottom: 1px solid #e5e7eb; }
.model-option.locked { cursor: not-allowed; opacity: .6; }
.model-menu-body { max-height: 360px; overflow: auto; }
.model-menu-hint { padding: 10px 18px 12px; border-top: 1px solid #eef2f7; color: #64748b; font-size: 12px; font-weight: 700; background: #f8fafc; }
.model-menu-footer { padding: 12px 16px; display: flex; align-items: center; justify-content: flex-end; gap: 12px; background: #fff; border-top: 1px solid #eef2f7; }
.footer-actions { display: flex; gap: 10px; }

.checkbox { width: 20px; height: 20px; border: 1px solid #d5dde8; border-radius: 6px; background: #fff; display: inline-flex; align-items: center; justify-content: center; flex: 0 0 auto; }
.model-option.selected .checkbox { background: #16aeea; border-color: #16aeea; }
.model-option.selected .checkbox::after { content: ''; width: 6px; height: 10px; border-right: 2px solid #fff; border-bottom: 2px solid #fff; transform: rotate(45deg) translate(-1px,-1px); }

/* Logo 渐变色池 */
.logo-stack { display: inline-flex; align-items: center; min-width: 88px; height: 26px; }
.logo-stack.single { min-width: 26px; width: 26px; }
.logo-badge { width: 26px; height: 26px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; color: #fff; font-size: 13px; font-weight: 900; border: 2px solid #fff; box-shadow: 0 2px 6px rgba(15,23,42,.16); margin-left: -8px; flex: 0 0 auto; line-height: 1; }
.logo-badge:first-child { margin-left: 0; }
.logo-all { background: linear-gradient(135deg,#94a3b8,#475569); }
.logo-deepseek { background: linear-gradient(135deg,#5b6cff,#2563eb); }
.logo-doubao { background: linear-gradient(135deg,#8b5cf6 0%,#8b5cf6 45%,#06b6d4 46%,#22c55e 100%); }
.logo-qwen { background: linear-gradient(135deg,#8b5cf6,#6366f1); }
.logo-yuanbao { background: linear-gradient(135deg,#38bdf8,#2563eb); }
.logo-ernie { background: linear-gradient(135deg,#0ea5e9,#2563eb); }

.selected-info { margin-left: auto; color: #245bff; background: #f0f5ff; border: 1px solid #dbeafe; padding: 8px 14px; border-radius: 10px; font-size: 13px; font-weight: bold; }

/* 3. 日期弹窗 */
.date-modal-mask { display: none; position: fixed; inset: 0; z-index: 50; background: rgba(15, 23, 42, 0.34); align-items: center; justify-content: center; padding: 24px; }
.date-modal-mask.show { display: flex; }
.date-modal { width: min(640px, 100%); background: #fff; border-radius: 16px; border: 1px solid #e5e7eb; box-shadow: 0 24px 70px rgba(15, 23, 42, .26); overflow: hidden; }
.date-modal-header { padding: 16px 20px; border-bottom: 1px solid #eef2f7; display: flex; align-items: center; justify-content: space-between; }
.date-modal-header h3 { margin: 0; font-size: 16px; font-weight: bold; }
.date-modal-close { width: 30px; height: 30px; border: 0; border-radius: 8px; background: #f3f4f6; cursor: pointer; font-size: 18px; line-height: 1; }
.date-modal-body { padding: 20px; }
.date-modal-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.date-modal-row input[type="date"] { height: 38px; border: 1px solid #d1d5db; border-radius: 8px; padding: 0 10px; font-family: inherit; }
.date-modal-row label { font-size: 13px; font-weight: bold; color: #374151; }
.date-modal-footer { padding: 14px 20px; background: #f9fafb; border-top: 1px solid #eef2f7; display: flex; justify-content: flex-end; gap: 10px; }

.chart-detail-mask { display: none; position: fixed; inset: 0; z-index: 60; background: rgba(15, 23, 42, 0.36); align-items: center; justify-content: center; padding: 28px; }
.chart-detail-mask.show { display: flex; }
.chart-detail-modal { width: min(1180px, 100%); height: min(840px, calc(100vh - 56px)); background: #fff; border-radius: 4px; box-shadow: 0 24px 70px rgba(15, 23, 42, .22); display: flex; flex-direction: column; overflow: hidden; }
.chart-detail-header { height: 58px; padding: 0 24px 0 30px; display: flex; align-items: center; justify-content: space-between; flex: 0 0 auto; }
.chart-detail-header h3 { margin: 0; color: #111827; font-size: 20px; font-weight: 800; }
.chart-detail-close { width: 34px; height: 34px; border: 0; background: transparent; color: #8a9099; cursor: pointer; font-size: 32px; line-height: 1; }
.mention-rate-detail-modal { width: min(1460px, 100%); height: min(900px, calc(100vh - 56px)); }
.mention-rate-detail-chart { flex: 1 1 auto; min-height: 0; width: 100%; padding: 0 34px; box-sizing: border-box; }
.mention-change-detail-chart { flex: 1 1 auto; min-height: 0; width: 100%; padding: 0 24px; box-sizing: border-box; }
.chart-detail-footer { flex: 0 0 auto; padding: 14px 30px 22px; color: #8a9099; font-size: 14px; }

/* 4. 看板卡片与排版 */
.mb-16 { margin-bottom: 16px; }
.chart-card { border-radius: 12px; border: 1px solid #e5e7eb; box-shadow: 0 2px 10px rgba(0,0,0,0.02); }
:deep(.chart-card .el-card__header) { padding: 14px 20px; border-bottom: 1px solid #f3f4f6; background: #fff; border-radius: 12px 12px 0 0; }
.c-head { display: flex; justify-content: space-between; align-items: center; font-weight: bold; font-size: 15px; color: #111827; }
.side-chart {
  height: 280px;
  width: 100%;
}

.mention-change-card {
  height: 100%;
  border-radius: 12px;
  overflow: hidden;
}
.mention-change-card :deep(.el-card__header) {
  padding: 14px 20px;
  border-bottom: 1px solid #f3f4f6;
}
.mention-change-card :deep(.el-card__body) {
  padding: 20px;
}
.mention-change-head {
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.mention-change-title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #111827;
  font-size: 15px;
  font-weight: 700;
  line-height: 1;
}
.rocket-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  color: #1f2329;
  font-size: 16px;
  transform: rotate(180deg);
}
.help-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border: 1px solid #d9dadd;
  border-radius: 50%;
  color: #c7c9cf;
  font-size: 12px;
  font-weight: 800;
}
.view-all-link {
  border: 0;
  background: transparent;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: #409eff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}
.view-arrow {
  font-size: 16px;
  line-height: 1;
  transform: translateY(-1px);
}
.mention-change-chart {
  margin: 0;
}

.rank-card :deep(.el-card__body) { padding: 0; }
.rank-table {
  --el-table-border-color: #f0f2f5;
  --el-table-header-bg-color: #fafafa;
  --el-table-row-hover-bg-color: #f7fbff;
  color: #262626;
  font-size: 14px;
}
.rank-table :deep(.el-table__header-wrapper th.el-table__cell) {
  height: 48px;
  background: #fafafa;
  color: #5f6673;
  font-size: 14px;
  font-weight: 600;
  border-bottom: 1px solid #f0f0f0;
}
.rank-table :deep(.el-table__body td.el-table__cell) {
  height: 44px;
  padding: 6px 0;
  border-bottom: 1px solid #f5f5f5;
}
.rank-table :deep(.el-table__cell .cell) {
  padding: 0 14px;
}
.rank-table :deep(.el-table__body tr:nth-child(1) td.el-table__cell) {
  background: #fffdf8;
}
.rank-table :deep(.el-table__body tr:nth-child(1) .brand-name-cell) {
  color: #111827;
  font-weight: 700;
}
.brand-name-cell {
  color: #262626;
  font-size: 14px;
  font-weight: 500;
}
.table-val {
  min-width: 0;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #262626;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.metric-main {
  min-width: 44px;
  color: #262626;
  font-size: 14px;
  font-weight: 500;
}
.table-val .up,
.table-val .down,
.table-val .muted {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 12px;
  font-weight: 500;
  line-height: 1;
}
.trend-arrow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
  width: 12px;
  height: 15px;
  flex: 0 0 12px;
}
.trend-arrow::before {
  content: '';
  position: absolute;
  left: 5px;
  width: 2px;
  height: 9px;
  border-radius: 2px;
  background: currentColor;
}
.trend-arrow::after {
  content: '';
  position: absolute;
  left: 2px;
  width: 8px;
  height: 8px;
  border-left: 2px solid currentColor;
  border-top: 2px solid currentColor;
  box-sizing: border-box;
}
.arrow-up::before {
  top: 5px;
}
.arrow-up::after {
  top: 1px;
  transform: rotate(45deg);
}
.arrow-down::before {
  top: 1px;
}
.arrow-down::after {
  bottom: 1px;
  transform: rotate(225deg);
}
.table-val .up { color: #ff4d4f; }
.table-val .down { color: #52c41a; }
.table-val .rank-better { color: #52c41a; }
.table-val .muted { color: #999; }
</style>
