<template>
  <div class="page-container">
    <div class="page-header">
      <div class="header-text">
        <h2>数据库管理</h2>
        <p class="subtitle">管理数据模型、表结构和性能监控</p>
      </div>
    </div>

    <el-card shadow="never" header="数据表结构">
      <el-table :data="tables" style="width: 100%" header-row-class-name="table-header">
        <el-table-column prop="name" label="表名" min-width="150" />
        <el-table-column prop="desc" label="描述" min-width="200" />
        <el-table-column prop="rows" label="记录数" width="120" align="center" />
        <el-table-column prop="size" label="大小" width="120" align="center" />
        <el-table-column label="操作" width="120" align="center" fixed="right">
          <template #default>
            <el-button type="primary" size="small" plain>查看结构</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
const tables = [
  { name: 'user', desc: '用户信息表', rows: 15, size: '2.3MB' },
  { name: 'project', desc: '项目信息表', rows: 8, size: '1.1MB' },
  { name: 'monitoring_task', desc: '监测任务表', rows: 45, size: '5.2MB' },
  { name: 'ai_response', desc: 'AI响应表', rows: 120, size: '12.8MB' }
]
</script>

<style scoped>
.page-container { padding: 24px; }
.header-text h2 { margin: 0; }
.subtitle { color: #909399; font-size: 14px; margin-top: 6px; margin-bottom: 20px; }
:deep(.table-header th) { background-color: #fafafa !important; font-weight: bold; }
</style>