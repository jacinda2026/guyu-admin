<template>
  <section class="execution-history-container">
    <div class="project-header-bar">
      <div class="back-action" @click="$router.back()">
        <el-icon><ArrowLeft /></el-icon>
        <span>返回调度中心</span>
      </div>
      <el-divider direction="vertical" />
      <div class="current-project">
        <span class="label">当前查看项目：</span>
        <span class="project-name">{{ currentTaskName }}</span>
      </div>
    </div>

    <el-card shadow="never" class="history-card">
      <div class="toolbar">
        <div class="toolbar-left">
          <span class="title">执行历史记录</span>
          <el-tag type="info" class="total-tag">共 {{ pagination.total }} 次执行</el-tag>
        </div>
        <div class="toolbar-right">
          <el-date-picker v-model="filters.dateRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" size="default" style="width: 280px" />
          <el-button type="primary" @click="handleFilter">筛选</el-button>
        </div>
      </div>

      <el-table :data="records" style="width: 100%" class="history-table" header-row-class-name="table-header">
        <el-table-column label="No." width="70" align="center">
          <template #default="{ $index }"><span>{{ $index + 1 }}</span></template>
        </el-table-column>
        <el-table-column label="状态" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 'success' ? 'success' : 'primary'" effect="plain">
              {{ row.status === 'success' ? '已完成' : '执行中' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="totalTasks" label="总任务数" width="100" align="center">
           <template #default="{ row }"><span class="task-number gray-bg">{{ row.totalTasks }}</span></template>
        </el-table-column>
        <el-table-column prop="completed" label="成功数" width="100" align="center">
          <template #default="{ row }"><span class="task-number green-bg">{{ row.completed }}</span></template>
        </el-table-column>
        <el-table-column prop="failed" label="失败数" width="100" align="center">
          <template #default="{ row }">
            <span class="task-number" :class="row.failed > 0 ? 'red-bg-active' : 'red-bg-dim'">{{ row.failed }}</span>
          </template>
        </el-table-column>
        <el-table-column label="开始时间" min-width="210" align="center">
          <template #default="{ row }">
            <div class="time-block">
              <div class="time-main">{{ row.startTime }}</div>
              <div class="time-zone">UTC+8 (北京时间)</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" align="center" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="info" class="detail-btn" @click="openDetail(row)">查看明细</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination v-model:current-page="pagination.currentPage" :page-size="10" layout="total, prev, pager, next" :total="records.length" />
      </div>
    </el-card>

    <el-dialog
      v-model="detailVisible"
      title="执行详情"
      width="850px"
      destroy-on-close
    >
      <div class="detail-grid">
        <div class="grid-label">执行ID</div>
        <div class="grid-content">{{ selectedRow.execId }}</div>
        <div class="grid-label">状态</div>
        <div class="grid-content">
          <el-tag type="success" effect="plain" v-if="selectedRow.status === 'success'">已完成</el-tag>
          <el-tag type="primary" effect="plain" v-else>执行中</el-tag>
        </div>

        <div class="grid-label">计划执行时间</div>
        <div class="grid-content">
          <div class="inner-time">{{ selectedRow.planTime }}</div>
          <div class="inner-tz">UTC+8 (北京时间)</div>
        </div>
        <div class="grid-label">创建时间</div>
        <div class="grid-content">
          <div class="inner-time">{{ selectedRow.createTime }}</div>
          <div class="inner-tz">UTC+8 (北京时间)</div>
        </div>

        <div class="grid-label">总任务数</div>
        <div class="grid-content">{{ selectedRow.totalTasks }}</div>
        <div class="grid-label">已完成任务数</div>
        <div class="grid-content">{{ selectedRow.completed }}</div>

        <div class="grid-label">失败任务数</div>
        <div class="grid-content">{{ selectedRow.failed }}</div>
        <div class="grid-label">开始时间</div>
        <div class="grid-content">
          <div class="inner-time">{{ selectedRow.startTime }}</div>
          <div class="inner-tz">UTC+8 (北京时间)</div>
        </div>

        <div class="grid-label">完成时间</div>
        <div class="grid-content col-span-3">
          <div class="inner-time" v-if="selectedRow.endTime">{{ selectedRow.endTime }}</div>
          <div class="inner-tz" v-if="selectedRow.endTime">UTC+8 (北京时间)</div>
          <span v-else>-</span>
        </div>
      </div>
    </el-dialog>
  </section>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ArrowLeft } from '@element-plus/icons-vue'

const currentTaskName = ref("全量数据回查-1")
const detailVisible = ref(false)
const selectedRow = ref({})

const filters = reactive({ status: '', dateRange: [] })
const pagination = reactive({ currentPage: 1, pageSize: 10, total: 13 })

// 补全了多条模拟数据
const records = ref([
  { id: 1, execId: "39e77aa5-e10e-43e4-87c6-632abfe1c131", status: "success", totalTasks: 155, completed: 155, failed: 0, planTime: "2026-05-14 11:43:13.723", createTime: "2026-05-14 11:43:13.730", startTime: "2026-05-14 11:43:13.896", endTime: "2026-05-14 13:10:14.231" },
  { id: 2, execId: "40f88bb6-f21f-54f5-98d7-743bcgf2d242", status: "success", totalTasks: 155, completed: 155, failed: 0, planTime: "2026-05-13 16:44:07.543", createTime: "2026-05-13 16:44:07.600", startTime: "2026-05-13 16:44:07.830", endTime: "2026-05-13 17:19:47.243" },
  { id: 3, execId: "51g99cc7-g32g-65g6-09e8-854cdhg3e353", status: "success", totalTasks: 155, completed: 155, failed: 0, planTime: "2026-05-12 13:04:14.628", createTime: "2026-05-12 13:04:14.700", startTime: "2026-05-12 13:04:14.877", endTime: "2026-05-12 13:39:18.793" },
  { id: 4, execId: "62h00dd8-h43h-76h7-10f9-965deih4f464", status: "running", totalTasks: 155, completed: 92, failed: 0, planTime: "2026-05-15 00:00:22.381", createTime: "2026-05-15 00:00:22.400", startTime: "2026-05-15 00:00:24.887", endTime: null }
])

const openDetail = (row) => {
  selectedRow.value = row
  detailVisible.value = true // 修复了这里的 .value 引用
}

const handleFilter = () => {}
</script>

<style scoped>
.execution-history-container { padding: 24px; background-color: #f5f7fa; min-height: 100vh; }
.project-header-bar { background: #fff; padding: 12px 20px; border-radius: 4px; margin-bottom: 20px; display: flex; align-items: center; border: 1px solid #ebeef5; }
.back-action { display: flex; align-items: center; gap: 6px; color: #409eff; cursor: pointer; font-size: 14px; }
.project-name { font-weight: bold; color: #303133; margin-left: 8px; }

.history-card { border-radius: 8px; border: 1px solid #ebeef5; }
.toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.toolbar-left { display: flex; align-items: center; gap: 12px; }
.title { font-size: 16px; font-weight: bold; color: #303133; }
.total-tag { border-radius: 12px; font-size: 12px; color: #909399; background-color: #f4f4f5; border: none; }
.toolbar-right { display: flex; gap: 12px; }

/* 详情网格布局 - 严格还原截图 */
.detail-grid { display: grid; grid-template-columns: 140px 1fr 140px 1fr; border-top: 1px solid #ebeef5; border-left: 1px solid #ebeef5; }
.grid-label { background-color: #f8f9fb; padding: 14px 16px; border-right: 1px solid #ebeef5; border-bottom: 1px solid #ebeef5; color: #606266; font-weight: bold; display: flex; align-items: center; }
.grid-content { padding: 14px 16px; border-right: 1px solid #ebeef5; border-bottom: 1px solid #ebeef5; color: #303133; display: flex; flex-direction: column; justify-content: center; word-break: break-all; }
.col-span-3 { grid-column: span 3; }

.inner-time { font-family: 'Courier New', Courier, monospace; font-size: 14px; color: #333; }
.inner-tz { font-size: 12px; color: #999; font-style: italic; margin-top: 4px; }

.time-block { display: flex; flex-direction: column; align-items: center; }
.time-main { font-family: monospace; color: #666; font-size: 13px; }
.time-zone { color: #ccc; font-size: 12px; transform: scale(0.9); }

.task-number { display: inline-block; padding: 2px 8px; border-radius: 4px; font-family: monospace; min-width: 32px; text-align: center; }
.gray-bg { background-color: #f4f4f5; color: #909399; border: 1px solid #e9e9eb; }
.green-bg { background-color: #f0f9eb; color: #67c23a; border: 1px solid #e1f3d8; }
.red-bg-active { background-color: #fef0f0; color: #f56c6c; border: 1px solid #fde2e2; }
.red-bg-dim { background-color: #fef0f0; color: #fab6b6; border: 1px solid #fde2e2; }

.detail-btn { border-radius: 16px; background-color: #909399; color: #fff; border: none; padding: 5px 15px; }
.pagination-wrapper { margin-top: 24px; display: flex; justify-content: center; }

:deep(.table-header th) { background-color: #fafafa !important; color: #606266; font-weight: bold; }
</style>