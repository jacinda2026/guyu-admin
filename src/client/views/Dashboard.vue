<template>
  <div class="dashboard-container">
    <div class="page-header">
      <div class="greeting">
        <h2 class="title">品牌 AI 健康度大盘</h2>
        <p class="subtitle">数据更新时间: 2026-05-16 09:30 | 监测品牌: <strong>汉庭酒店</strong></p>
      </div>
      <div class="actions">
        <el-button plain><el-icon><Download /></el-icon> 导出月度报告</el-button>
        <el-button type="primary"><el-icon><Plus /></el-icon> 发起深度诊断</el-button>
      </div>
    </div>

    <el-row :gutter="20" class="kpi-row">
      <el-col :span="6" v-for="kpi in kpiCards" :key="kpi.label">
        <el-card shadow="hover" class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-title">{{ kpi.label }}</span>
            <el-tooltip :content="kpi.tip" placement="top">
              <el-icon class="kpi-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
          <div class="kpi-body">
            <span class="kpi-value" :class="kpi.color">{{ kpi.value }}</span>
            <span class="kpi-unit" v-if="kpi.unit">{{ kpi.unit }}</span>
          </div>
          <div class="kpi-footer">
            <span class="trend" :class="kpi.trend >= 0 ? 'up' : 'down'">
              <el-icon><Top v-if="kpi.trend >= 0" /><Bottom v-else /></el-icon>
              {{ Math.abs(kpi.trend) }}% 较上周
            </span>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="chart-row">
      <el-col :span="10">
        <el-card shadow="never" class="chart-card">
          <template #header>
            <div class="card-title">全域 AI 可见度分布 (SOV)</div>
          </template>
          <div ref="radarChartRef" class="echarts-container"></div>
        </el-card>
      </el-col>
      <el-col :span="14">
        <el-card shadow="never" class="chart-card">
          <template #header>
            <div class="card-title">近30天品牌正向情感趋势</div>
          </template>
          <div ref="trendChartRef" class="echarts-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="feed-row">
      <el-col :span="14">
        <el-card shadow="never" class="feed-card">
          <template #header>
            <div class="card-title">
              实时监测任务流
              <el-tag size="small" type="success" effect="plain" class="live-tag">LIVE</el-tag>
            </div>
          </template>
          <el-table :data="liveTasks" style="width: 100%" :show-header="false">
            <el-table-column width="50">
              <template #default>
                <el-icon class="spin-icon text-primary"><Loading /></el-icon>
              </template>
            </el-table-column>
            <el-table-column prop="name" min-width="180">
              <template #default="{ row }">
                <div class="task-name">{{ row.name }}</div>
                <div class="task-meta">调用接口: {{ row.model }}</div>
              </template>
            </el-table-column>
            <el-table-column width="150">
              <template #default="{ row }">
                <el-progress :percentage="row.progress" :stroke-width="6" striped striped-flow />
              </template>
            </el-table-column>
            <el-table-column width="100" align="right">
              <template #default="{ row }">
                <span class="task-time">{{ row.time }}</span>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <el-col :span="10">
        <el-card shadow="never" class="feed-card">
          <template #header>
            <div class="card-title">最新洞察报告</div>
          </template>
          <div class="report-list">
            <div class="report-item" v-for="report in recentReports" :key="report.id">
              <div class="report-icon">
                <el-icon><DataAnalysis /></el-icon>
              </div>
              <div class="report-content">
                <div class="r-title">{{ report.title }}</div>
                <div class="r-date">{{ report.date }}</div>
              </div>
              <el-button type="primary" link>查看</el-button>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { 
  Download, Plus, QuestionFilled, Top, Bottom, 
  Loading, DataAnalysis 
} from '@element-plus/icons-vue'

// --- KPI 数据 ---
const kpiCards = ref([
  { label: '综合品牌可见度', value: '82.4', unit: '分', tip: '综合大模型及社媒AI的品牌被提及概率', trend: 5.2, color: 'text-primary' },
  { label: '大模型首选推荐率', value: '68.5', unit: '%', tip: '在行业通用提问中，AI首选推荐本品牌的概率', trend: 12.1, color: 'text-success' },
  { label: '正向情感占比', value: '91.2', unit: '%', tip: 'AI 生成内容中评价为正向及中性的比例', trend: -1.5, color: 'text-warning' },
  { label: '今日消耗额度', value: '45.50', unit: '元', tip: '今日自动化监测消耗的总额度', trend: 2.4, color: 'text-danger' }
])

// --- 实时任务流 ---
const liveTasks = ref([
  { name: '南京核心商圈酒店口碑扫描', model: 'DeepSeek-V3', progress: 65, time: '运行中' },
  { name: '小红书品牌种草词关联分析', model: '小红书内置AI源', progress: 30, time: '运行中' },
  { name: '竞品可见度对比 (全平台)', model: 'GPT-4o 专线', progress: 90, time: '即将完成' }
])

// --- 最新报告 ---
const recentReports = ref([
  { id: 1, title: '2026年Q2 酒店行业大模型可见度诊断报告', date: '2026-05-15' },
  { id: 2, title: '小红书/抖音 AI 搜索心智渗透率周报', date: '2026-05-12' },
  { id: 3, title: '核心竞品 (全季/如家) 情感口碑拦截分析', date: '2026-05-08' }
])

// --- ECharts 图表初始化 ---
const radarChartRef = ref(null)
const trendChartRef = ref(null)
let radarChart = null
let trendChart = null

const initCharts = () => {
  // 1. 跨平台可见度雷达图
  radarChart = echarts.init(radarChartRef.value)
  radarChart.setOption({
    tooltip: {},
    legend: { bottom: 0, icon: 'circle' },
    radar: {
      indicator: [
        { name: 'DeepSeek', max: 100 },
        { name: 'Kimi', max: 100 },
        { name: '豆包', max: 100 },
        { name: '小红书 AI搜索', max: 100 },
        { name: '知乎直答', max: 100 },
        { name: 'ChatGPT (海外)', max: 100 }
      ],
      radius: '65%',
      splitArea: { areaStyle: { color: ['#f8f9fa', '#fff'] } }
    },
    series: [{
      name: '可见度对比',
      type: 'radar',
      data: [
        { value: [85, 90, 78, 65, 88, 45], name: '汉庭 (本品牌)', areaStyle: { color: 'rgba(43,101,240,0.2)' }, lineStyle: { color: '#2b65f0' }, itemStyle: { color: '#2b65f0' } },
        { value: [60, 70, 85, 90, 60, 50], name: '如家 (竞品A)', areaStyle: { color: 'rgba(230,162,60,0.2)' }, lineStyle: { color: '#e6a23c' }, itemStyle: { color: '#e6a23c' } }
      ]
    }]
  })

  // 2. 品牌正向情感趋势面积图
  trendChart = echarts.init(trendChartRef.value)
  trendChart.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '5%', containLabel: true },
    xAxis: { type: 'category', boundaryGap: false, data: ['05-01', '05-04', '05-07', '05-10', '05-13', '05-16'] },
    yAxis: { type: 'value', min: 70, max: 100, axisLabel: { formatter: '{value}%' } },
    series: [
      {
        name: '正向情感占比',
        type: 'line',
        smooth: true,
        lineStyle: { width: 3, color: '#67c23a' },
        showSymbol: false,
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(103,194,58,0.3)' },
            { offset: 1, color: 'rgba(103,194,58,0.01)' }
          ])
        },
        data: [82, 85, 84, 88, 89, 91.2]
      }
    ]
  })
}

const resizeCharts = () => {
  radarChart?.resize()
  trendChart?.resize()
}

onMounted(() => {
  initCharts()
  window.addEventListener('resize', resizeCharts)
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeCharts)
  radarChart?.dispose()
  trendChart?.dispose()
})
</script>

<style scoped>
.dashboard-container { padding-bottom: 24px; }

/* 头部样式 */
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.greeting .title { margin: 0; font-size: 24px; color: #303133; font-weight: bold; }
.greeting .subtitle { margin: 8px 0 0; font-size: 13px; color: #909399; }
.actions { display: flex; gap: 12px; }

/* KPI 卡片 */
.kpi-row { margin-bottom: 24px; }
.kpi-card { border-radius: 8px; border: none; }
.kpi-header { display: flex; justify-content: space-between; align-items: center; color: #909399; font-size: 13px; }
.kpi-icon { cursor: help; }
.kpi-body { margin: 16px 0; display: flex; align-items: baseline; }
.kpi-value { font-size: 32px; font-weight: bold; line-height: 1; }
.kpi-unit { font-size: 14px; margin-left: 4px; color: #606266; }
.kpi-footer { font-size: 12px; border-top: 1px solid #f0f2f5; padding-top: 12px; }
.trend { display: flex; align-items: center; gap: 2px; }
.trend.up { color: #f56c6c; } /* 国内习惯红涨绿跌 */
.trend.down { color: #67c23a; }

/* 文本颜色集 */
.text-primary { color: #2b65f0; }
.text-success { color: #67c23a; }
.text-warning { color: #e6a23c; }
.text-danger { color: #f56c6c; }

/* 图表区 */
.chart-row { margin-bottom: 24px; }
.chart-card { border-radius: 8px; border: none; }
.card-title { font-weight: bold; font-size: 15px; color: #303133; display: flex; align-items: center; gap: 8px; }
.echarts-container { height: 320px; width: 100%; }

/* 流水卡片区 */
.feed-card { border-radius: 8px; border: none; height: 100%; }
.live-tag { transform: scale(0.85); transform-origin: left; }
.spin-icon { font-size: 18px; animation: spin 2s linear infinite; }
@keyframes spin { 100% { transform: rotate(360deg); } }
.task-name { font-size: 14px; font-weight: 500; color: #303133; margin-bottom: 4px; }
.task-meta { font-size: 12px; color: #909399; }
.task-time { font-size: 12px; color: #909399; }

/* 报告列表 */
.report-list { display: flex; flex-direction: column; gap: 16px; }
.report-item { display: flex; align-items: center; justify-content: space-between; padding-bottom: 16px; border-bottom: 1px solid #f0f2f5; }
.report-item:last-child { border-bottom: none; padding-bottom: 0; }
.report-icon { width: 36px; height: 36px; background: #f0f5ff; color: #2b65f0; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 18px; }
.report-content { flex: 1; margin: 0 12px; display: flex; flex-direction: column; gap: 4px; }
.r-title { font-size: 13px; font-weight: 500; color: #303133; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px; }
.r-date { font-size: 12px; color: #909399; }
</style>