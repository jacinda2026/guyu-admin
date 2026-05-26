<template>
  <div class="page-container">
    <div class="page-header">
      <div class="header-info">
        <h2>大后台数据分析</h2>
        <p class="subtitle">全平台资源消耗监控与系统运行能效分析</p>
      </div>
      <div class="header-ops">
        <el-radio-group v-model="timeRange" size="default">
          <el-radio-button label="today">今日</el-radio-button>
          <el-radio-button label="week">本周</el-radio-button>
          <el-radio-button label="month">本月</el-radio-button>
        </el-radio-group>
      </div>
    </div>

    <el-row :gutter="20" class="stat-cards">
      <el-col :span="6" v-for="item in adminStats" :key="item.title">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-label">{{ item.title }}</div>
          <div class="stat-value">{{ item.value }}</div>
          <div class="stat-footer">
            <span class="label">较昨日</span>
            <span :class="['trend', item.type]">{{ item.trend }}</span>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="chart-rows">
      <el-col :span="16">
        <el-card shadow="never" header="全平台 Token 消耗趋势 (按接口来源分类)">
          <div class="chart-placeholder admin-bg">
            <div class="mock-line-container">
              <div class="mock-line blue"></div>
              <div class="mock-line green"></div>
              <div class="mock-line orange"></div>
            </div>
            <el-empty description="资源消耗波形同步中..." />
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never" header="6 大平台接口调用负载">
          <div class="chart-placeholder admin-bg mini">
            <div class="mock-bar-container">
              <div class="bar-item" v-for="i in 6" :key="i" :style="{height: (20 + i*12) + '%'}"></div>
            </div>
            <el-empty description="负载分布计算中" />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="24">
        <el-card shadow="never" header="高频调用租户排行 (Top 10)">
          <el-table :data="topTenants" style="width: 100%" stripe>
            <el-table-column type="index" label="排名" width="80" align="center" />
            <el-table-column prop="name" label="租户名称" />
            <el-table-column prop="calls" label="今日调用量" align="center" />
            <el-table-column prop="tokens" label="消耗 Tokens" align="center" />
            <el-table-column label="健康度" width="150" align="center">
              <template #default="{ row }">
                <el-progress :percentage="row.health" :status="row.health > 90 ? 'success' : 'warning'" />
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const timeRange = ref('today')

const adminStats = [
  { title: '全平台总请求', value: '42.8k', trend: '+5.2%', type: 'up' },
  { title: '全天 Token 消耗', value: '8.45M', trend: '+12.8%', type: 'up' },
  { title: '平均响应延迟', value: '1.24s', trend: '-150ms', type: 'down' },
  { title: '异常熔断次数', value: '3', trend: '0', type: 'stable' }
]

const topTenants = ref([
  { name: '谷雨GEO科技有限公司', calls: '12,402', tokens: '2.1M', health: 98 },
  { name: '创新科技中心', calls: '8,120', tokens: '1.4M', health: 95 },
  { name: '演示项目-A', calls: '5,400', tokens: '0.8M', health: 82 }
])
</script>

<style scoped>
.page-container { padding: 24px; background-color: #f5f7fa; min-height: 100vh; }
.page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; }
.stat-cards { margin-bottom: 24px; }
.stat-card { border-radius: 8px; border: none; }
.stat-label { font-size: 14px; color: #909399; margin-bottom: 12px; }
.stat-value { font-size: 30px; font-weight: bold; color: #2b65f0; }
.stat-footer { margin-top: 12px; font-size: 12px; color: #999; }
.trend.up { color: #f56c6c; margin-left: 5px; font-weight: bold; }
.trend.down { color: #67c23a; margin-left: 5px; font-weight: bold; }
.trend.stable { color: #909399; margin-left: 5px; }

.chart-rows { margin-bottom: 24px; }
.chart-placeholder { 
  height: 350px; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  background: #fff; 
  border-radius: 4px; 
  position: relative;
  overflow: hidden;
}
.admin-bg { background-color: #fcfcfc; }

/* 模拟背景图表线 */
.mock-line-container { position: absolute; width: 100%; height: 100%; opacity: 0.1; }
.mock-line { position: absolute; bottom: 50px; width: 100%; height: 2px; }
.mock-line.blue { border-bottom: 2px solid #2b65f0; transform: skewY(-5deg); }
.mock-line.green { border-bottom: 2px solid #67c23a; transform: translateY(-30px) skewY(-2deg); }

.mock-bar-container { position: absolute; bottom: 0; width: 100%; height: 100%; display: flex; align-items: flex-end; justify-content: space-around; padding: 0 40px; opacity: 0.05; }
.bar-item { width: 20px; background: #2b65f0; border-radius: 4px 4px 0 0; }
</style>