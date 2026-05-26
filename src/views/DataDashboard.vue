<template>
  <div class="dashboard-overview">
    <div class="overview-header">
      <div class="header-info">
        <h2>管理后台概览</h2>
        <p>系统运行状态实时监控与分析</p>
      </div>
      <div class="header-ops">
        <el-button type="primary" size="default">问诊数据</el-button>
      </div>
    </div>

    <el-row :gutter="20" class="stat-cards">
      <el-col :span="6">
        <el-card shadow="never" class="overview-card border-blue">
          <div class="card-body">
            <div class="card-icon bg-light-blue"><el-icon><User /></el-icon></div>
            <div class="card-data">
              <div class="num">15</div>
              <div class="label">用户总数</div>
            </div>
          </div>
          <div class="card-footer"><span class="trend up">↑ 10% 较上周</span></div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never" class="overview-card border-green">
          <div class="card-body">
            <div class="card-icon bg-light-green"><el-icon><OfficeBuilding /></el-icon></div>
            <div class="card-data">
              <div class="num">8</div>
              <div class="label">租户总数</div>
            </div>
          </div>
          <div class="card-footer"><span class="trend">保持平稳</span></div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never" class="overview-card border-orange">
          <div class="card-body">
            <div class="card-icon bg-light-orange"><el-icon><DataLine /></el-icon></div>
            <div class="card-data">
              <div class="num">45</div>
              <div class="label">总分析数</div>
            </div>
          </div>
          <div class="card-footer"><span class="trend up">↑ 15% 本周</span></div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never" class="overview-card border-purple">
          <div class="card-body">
            <div class="card-icon bg-light-purple"><el-icon><Clock /></el-icon></div>
            <div class="card-data">
              <div class="num">{{ taskStore.globalProcessingCount + 112 }}</div>
              <div class="label">任务调度次</div>
            </div>
          </div>
          <div class="card-footer"><span class="trend down">↓ 5% 环比</span></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="chart-row">
      <el-col :span="14">
        <el-card shadow="never" header="用户增长趋势">
          <div class="mock-line-chart">
            <div class="chart-content">
              <div class="line-svg"></div>
              <div class="chart-axis">
                <span>1月</span><span>2月</span><span>3月</span><span>4月</span><span>5月</span><span>6月</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="10">
        <el-card shadow="never" header="项目任务占比">
          <div class="mock-pie-chart">
            <div class="donut"></div>
            <div class="chart-legend">
              <div class="legend-item"><span class="dot blue"></span> 平台状态回采</div>
              <div class="legend-item"><span class="dot green"></span> GEO批量生成</div>
              <div class="legend-item"><span class="dot gray"></span> 其他</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never" class="log-card">
      <template #header>
        <div class="log-header">
          <span>活跃日志</span>
          <el-link type="primary" :underline="false">查看更多</el-link>
        </div>
      </template>
      <div class="log-list">
        <div class="log-item" v-for="(log, index) in activityLogs" :key="index">
          <el-avatar :size="32" :icon="log.icon" :class="log.colorClass" />
          <div class="log-info">
            <div class="log-msg"><strong>{{ log.user }}</strong> {{ log.action }}</div>
            <div class="log-time">{{ log.time }}</div>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { User, OfficeBuilding, DataLine, Clock, Loading, Check, Warning } from '@element-plus/icons-vue'
import { useTaskStore } from '../store/task'

const taskStore = useTaskStore()

const activityLogs = ref([
  { user: 'Admin', action: '执行了 汉庭酒店GEO诊断 任务', time: '5分钟前', icon: Loading, colorClass: 'c-blue' },
  { user: 'System', action: '自动化调度：美团场景分析 已完成', time: '12分钟前', icon: Check, colorClass: 'c-green' },
  { user: 'Editor', action: '修改了 提示词库-通用模板', time: '35分钟前', icon: DataLine, colorClass: 'c-orange' },
  { user: 'Admin', action: 'API密钥到期预警提示', time: '1小时前', icon: Warning, colorClass: 'c-red' }
])
</script>

<style scoped>
.dashboard-overview { padding: 24px; }

/* 头部 */
.overview-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; }
.overview-header h2 { margin: 0; font-size: 22px; color: #303133; }
.overview-header p { margin: 6px 0 0; color: #909399; font-size: 14px; }

/* 指标卡片 */
.stat-cards { margin-bottom: 24px; }
.overview-card { border-radius: 8px; }
.card-body { display: flex; align-items: center; gap: 16px; padding-bottom: 12px; }
.card-icon { width: 48px; height: 48px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 24px; }
.card-data .num { font-size: 28px; font-weight: bold; color: #303133; }
.card-data .label { font-size: 13px; color: #909399; margin-top: 4px; }
.card-footer { border-top: 1px solid #f0f2f5; padding-top: 12px; font-size: 12px; color: #909399; }
.trend.up { color: #67c23a; }
.trend.down { color: #f56c6c; }

/* 边框与图标颜色对齐截图 */
.border-blue { border-top: 4px solid #409eff; }
.bg-light-blue { background: #e6f1fc; color: #409eff; }
.border-green { border-top: 4px solid #67c23a; }
.bg-light-green { background: #f0f9eb; color: #67c23a; }
.border-orange { border-top: 4px solid #e6a23c; }
.bg-light-orange { background: #fdf6ec; color: #e6a23c; }
.border-purple { border-top: 4px solid #909399; }
.bg-light-purple { background: #f4f4f5; color: #909399; }

/* 模拟图表样式 */
.chart-row { margin-bottom: 24px; }
.mock-line-chart { height: 260px; display: flex; flex-direction: column; justify-content: flex-end; }
.line-svg { height: 180px; background: linear-gradient(180deg, rgba(64,158,255,0.1) 0%, rgba(64,158,255,0) 100%); border-bottom: 2px solid #409eff; position: relative; }
.chart-axis { display: flex; justify-content: space-between; padding-top: 15px; color: #999; font-size: 12px; }

.mock-pie-chart { height: 260px; display: flex; align-items: center; justify-content: space-around; }
.donut { width: 140px; height: 140px; border-radius: 50%; border: 25px solid #409eff; border-right-color: #67c23a; border-bottom-color: #f4f4f5; }
.chart-legend { display: flex; flex-direction: column; gap: 10px; }
.legend-item { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #606266; }
.dot { width: 8px; height: 8px; border-radius: 50%; }
.dot.blue { background: #409eff; }
.dot.green { background: #67c23a; }
.dot.gray { background: #f4f4f5; }

/* 日志样式 */
.log-header { display: flex; justify-content: space-between; align-items: center; font-weight: bold; }
.log-list { display: flex; flex-direction: column; gap: 20px; }
.log-item { display: flex; align-items: center; gap: 12px; }
.log-info { display: flex; flex-direction: column; gap: 4px; }
.log-msg { font-size: 14px; color: #303133; }
.log-time { font-size: 12px; color: #c0c4cc; }
.c-blue { background: #e6f1fc; color: #409eff; }
.c-green { background: #f0f9eb; color: #67c23a; }
.c-orange { background: #fdf6ec; color: #e6a23c; }
.c-red { background: #fef0f0; color: #f56c6c; }
</style>