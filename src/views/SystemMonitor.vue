<template>
  <div class="page-container">
    <div class="page-header">
      <div class="header-text">
        <h2>服务运维</h2>
        <p class="subtitle">监控系统服务状态和性能指标</p>
      </div>
    </div>

    <el-card shadow="never" header="服务状态监控">
      <el-table :data="services" style="width: 100%">
        <el-table-column prop="name" label="服务名称" min-width="150" />
        <el-table-column label="状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag type="success" size="small" effect="light">运行中</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="uptime" label="运行时间" width="180" align="center" />
        <el-table-column label="CPU使用率" width="150" align="center">
          <template #default="{ row }">
            <el-progress :percentage="row.cpu" :stroke-width="10" />
          </template>
        </el-table-column>
        <el-table-column label="内存使用率" width="150" align="center">
          <template #default="{ row }">
            <el-progress :percentage="row.mem" :stroke-width="10" color="#67c23a" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" align="center" fixed="right">
          <template #default>
            <el-button type="primary" size="small" plain>查看日志</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
const services = [
  { name: '数据采集服务', uptime: '2天3小时', cpu: 15, mem: 45 },
  { name: '数据分析服务', uptime: '1天8小时', cpu: 28, mem: 62 },
  { name: 'API网关服务', uptime: '5天12小时', cpu: 8, mem: 23 },
  { name: '数据库服务', uptime: '10天6小时', cpu: 35, mem: 78 }
]
</script>

<style scoped>
.page-container { padding: 24px; }
.header-text h2 { margin: 0; }
.subtitle { color: #909399; font-size: 14px; margin-top: 6px; margin-bottom: 20px; }
</style>