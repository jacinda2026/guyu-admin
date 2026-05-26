<template>
  <div class="export-center-page">
    <div class="page-toolbar">
      <div class="toolbar-title">
        <h2>导出中心</h2>
        <p>查看报告、任务数据和截图包的后台生成进度，完成后可下载到本地</p>
      </div>
      <div class="toolbar-actions">
        <el-input v-model="keyword" clearable placeholder="搜索报告名称 / 项目 / 导出内容" :prefix-icon="Search" class="search-input" />
        <el-button plain><el-icon><Refresh /></el-icon>刷新</el-button>
      </div>
    </div>

    <div class="summary-row">
      <div v-for="item in summaryCards" :key="item.label" class="summary-card">
        <span>{{ item.label }}</span>
        <strong>{{ item.value }}</strong>
      </div>
    </div>

    <el-card shadow="never" class="export-card">
      <div class="table-toolbar">
        <el-radio-group v-model="activeStatus" size="small">
          <el-radio-button label="all">全部</el-radio-button>
          <el-radio-button label="pending">排队中</el-radio-button>
          <el-radio-button label="processing">生成中</el-radio-button>
          <el-radio-button label="success">已完成</el-radio-button>
          <el-radio-button label="failed">失败</el-radio-button>
        </el-radio-group>
        <div class="table-extra">
          <el-select v-model="exportType" size="small" style="width: 132px">
            <el-option label="全部类型" value="all" />
            <el-option label="日报" value="daily" />
            <el-option label="周报" value="weekly" />
            <el-option label="月报" value="monthly" />
            <el-option label="任务数据" value="task-data" />
            <el-option label="截图包" value="screenshot" />
          </el-select>
        </div>
      </div>

      <el-table :data="filteredJobs" class="export-table" style="width: 100%" :header-cell-style="headerCellStyle">
        <el-table-column prop="project" label="所属项目" min-width="120" show-overflow-tooltip />
        <el-table-column prop="source" label="任务来源" width="100" />
        <el-table-column prop="reportName" label="报告名称" min-width="280" show-overflow-tooltip />
        <el-table-column prop="name" label="导出内容" min-width="130" show-overflow-tooltip />
        <el-table-column label="在线地址" width="96" align="center">
          <template #default="{ row }">
            <a v-if="row.onlineUrl" class="table-link" :href="row.onlineUrl" target="_blank" rel="noopener noreferrer">查看</a>
            <span v-else class="muted-text">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="range" label="时间范围" min-width="170" show-overflow-tooltip />
        <el-table-column prop="fileSize" label="文件大小" width="96" align="center" />
        <el-table-column prop="createdAt" label="创建时间" width="150" />
        <el-table-column prop="finishedAt" label="完成时间" width="150">
          <template #default="{ row }">{{ row.finishedAt || '-' }}</template>
        </el-table-column>
        <el-table-column label="状态" width="96" align="center">
          <template #default="{ row }">
            <el-tag :type="statusMeta[row.status].type" effect="plain" size="small">{{ statusMeta[row.status].text }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" align="center" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.status === 'success'" link type="primary" @click="downloadJob(row)">下载</el-button>
            <el-button v-else-if="row.status === 'failed'" link type="primary" @click="retryJob(row)">重试</el-button>
            <span v-else class="muted-text">等待生成</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, Search } from '@element-plus/icons-vue'

const keyword = ref('')
const activeStatus = ref('all')
const exportType = ref('all')

const statusMeta = {
  pending: { text: '排队中', type: 'info' },
  processing: { text: '生成中', type: 'primary' },
  success: { text: '已完成', type: 'success' },
  failed: { text: '失败', type: 'danger' }
}

const exportJobs = ref([
  {
    id: 'EXP-052601',
    type: 'daily',
    name: '监控日报',
    reportName: '初敏保湿霜_日报_2026-05-26',
    project: '初敏保湿霜',
    source: '监控报告',
    range: '2026-05-26',
    createdAt: '2026-05-26 10:36',
    status: 'success',
    fileSize: '2.4 MB',
    finishedAt: '2026-05-26 10:38',
    onlineUrl: 'https://example.com/reports/chumin-daily-20260526'
  },
  {
    id: 'EXP-052602',
    type: 'screenshot',
    name: '截图包',
    reportName: '初敏保湿霜_MT-052201_截图包_2026-05-22',
    project: '初敏保湿霜',
    source: '监控任务',
    range: '2026-05-22 10:20',
    createdAt: '2026-05-26 10:40',
    status: 'processing',
    fileSize: '-',
    finishedAt: '',
    onlineUrl: ''
  },
  {
    id: 'EXP-052603',
    type: 'task-data',
    name: '执行问题明细',
    reportName: '初敏保湿霜_MT-052201_执行问题明细_2026-05-22',
    project: '初敏保湿霜',
    source: '监控任务',
    range: '2026-05-22 10:20',
    createdAt: '2026-05-26 10:42',
    status: 'pending',
    fileSize: '-',
    finishedAt: '',
    onlineUrl: ''
  },
  {
    id: 'EXP-052504',
    type: 'weekly',
    name: '监控周报',
    reportName: '初敏保湿霜_周报_第17周_2026-05-18_2026-05-24',
    project: '初敏保湿霜',
    source: '监控报告',
    range: '2026-05-18 至 2026-05-24',
    createdAt: '2026-05-25 09:12',
    status: 'success',
    fileSize: '5.8 MB',
    finishedAt: '2026-05-25 09:18',
    onlineUrl: 'https://example.com/reports/chumin-weekly-2026w17'
  },
  {
    id: 'EXP-052505',
    type: 'monthly',
    name: '监控月报',
    reportName: '初敏保湿霜_月报_2026-05-01_2026-05-25',
    project: '初敏保湿霜',
    source: '监控报告',
    range: '2026-05-01 至 2026-05-25',
    createdAt: '2026-05-25 18:30',
    status: 'failed',
    fileSize: '-',
    finishedAt: '2026-05-25 18:36',
    onlineUrl: ''
  }
])

const filteredJobs = computed(() => {
  const key = keyword.value.trim().toLowerCase()
  return exportJobs.value.filter(job => {
    const statusMatched = activeStatus.value === 'all' || job.status === activeStatus.value
    const typeMatched = exportType.value === 'all' || job.type === exportType.value
    const keywordMatched = !key || `${job.name}${job.reportName}${job.project}`.toLowerCase().includes(key)
    return statusMatched && typeMatched && keywordMatched
  })
})

const summaryCards = computed(() => [
  { label: '全部导出', value: exportJobs.value.length },
  { label: '生成中', value: exportJobs.value.filter(job => job.status === 'processing' || job.status === 'pending').length },
  { label: '已完成', value: exportJobs.value.filter(job => job.status === 'success').length },
  { label: '失败', value: exportJobs.value.filter(job => job.status === 'failed').length }
])

const headerCellStyle = {
  background: '#f8fafc',
  color: '#64748b',
  fontWeight: 700,
  height: '42px'
}

const downloadJob = (row) => {
  ElMessage.success(`开始下载 ${row.reportName}`)
}

const retryJob = (row) => {
  row.status = 'pending'
  row.finishedAt = ''
  ElMessage.success(`${row.reportName} 已重新加入导出队列`)
}

</script>

<style scoped>
.export-center-page { display: flex; flex-direction: column; gap: 16px; }
.page-toolbar { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.toolbar-title h2 { margin: 0; color: #111827; font-size: 22px; }
.toolbar-title p { margin: 8px 0 0; color: #8a95a6; font-size: 14px; }
.toolbar-actions { display: flex; align-items: center; gap: 10px; }
.search-input { width: 280px; }
.summary-row { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; }
.summary-card { padding: 16px 18px; border: 1px solid #e5e7eb; border-radius: 8px; background: #fff; }
.summary-card span { display: block; color: #8a95a6; font-size: 13px; }
.summary-card strong { display: block; margin-top: 8px; color: #111827; font-size: 26px; line-height: 1; }
.export-card { border: 1px solid #e5e7eb; border-radius: 8px; }
.table-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
.table-extra { display: flex; align-items: center; gap: 10px; }
.table-link { color: #2563eb; text-decoration: none; font-weight: 600; }
.table-link:hover { text-decoration: underline; text-underline-offset: 3px; }
.muted-text { color: #94a3b8; font-size: 13px; }
:deep(.export-table .el-table__cell) { white-space: nowrap; }
:deep(.el-card__body) { padding: 16px; }
@media (max-width: 960px) {
  .page-toolbar, .table-toolbar { flex-direction: column; align-items: stretch; }
  .toolbar-actions { justify-content: space-between; }
  .search-input { width: 100%; }
  .summary-row { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
</style>
