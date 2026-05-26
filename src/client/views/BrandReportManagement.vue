<template>
  <div class="report-list-container">
    <div class="page-header mb-20">
      <h2 class="page-title">品牌全域健康度检测</h2>
      <p class="page-subtitle">中央控制塔下属模块。归档并管控集团级母品牌大模型全链路 ASI 可见度资产，深度审计跨模型提及份额与语义图谱。</p>
    </div>

    <el-card shadow="never" class="table-card">
      <div class="filter-bar mb-20">
        <el-input v-model="brandSearchQuery" placeholder="输入目标品牌名称检索全域报告..." style="width: 320px;" clearable>
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
      </div>

      <el-table :data="filteredBrandReports" style="width: 100%" stripe>
        <el-table-column prop="id" label="监测单号" width="120" />
        <el-table-column label="目标监测品牌" min-width="180">
          <template #default="{ row }">
            <span class="brand-name-text">{{ row.brandName }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="cycle" label="监测统计周期" min-width="180" />
        
        <el-table-column prop="createTime" label="检测创建时间" width="150" />

        <el-table-column label="AI 综合健康分 (ASI)" width="160" align="center">
          <template #default="{ row }">
            <span class="asi-score-badge">{{ row.asiScore }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="sov" label="AI SOV 提及份额" width="140" align="right" />
        <el-table-column prop="accuracy" label="生成信息准确度" width="140" align="right" />
        
        <el-table-column label="快捷交付操作" width="240" align="right" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" plain @click="openBrandReportStandalone(row)">
              <el-icon><DataAnalysis /></el-icon> 穿透全景看板
            </el-button>
            <el-button type="warning" size="small" @click="downloadBrandReportStandalone(row)">
              <el-icon><Download /></el-icon> 导出 PDF
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Download, DataAnalysis } from '@element-plus/icons-vue'

const brandSearchQuery = ref('')

// 数据源中同步补全 createTime 字段，完美映射历史归档节点
const brandReportsData = ref([
  { 
    id: 'ASI-20260501', 
    brandName: 'AuraLuxe (高端奢华空气净化家电)', 
    cycle: '2026-04-01 至 2026-05-15', 
    createTime: '2026-05-16 10:00',
    asiScore: '74.5 分', 
    sov: '28.4%', 
    accuracy: '81.2%' 
  },
  { 
    id: 'ASI-20260412', 
    brandName: '谷雨乳铁蛋白营养素品牌', 
    cycle: '2026-03-01 至 2026-04-15', 
    createTime: '2026-04-16 14:25',
    asiScore: '68.2 分', 
    sov: '19.5%', 
    accuracy: '74.0%' 
  }
])

const filteredBrandReports = computed(() => {
  if (!brandSearchQuery.value) return brandReportsData.value
  const q = brandSearchQuery.value.toLowerCase()
  return brandReportsData.value.filter(b => b.brandName.toLowerCase().includes(q))
})

// 直接打开 public 目录下的增强版品牌全景报告 HTML
const openBrandReportStandalone = (row) => {
  ElMessage.success(`正在为您安全唤起 [${row.brandName}] 的全域 AI 监测报告链接...`)
  const targetUrl = `/ai_brand_health_report_enhanced.html?id=${row.id}&task=preview`
  window.open(targetUrl, '_blank')
}

// 导出 PDF 快捷直达
const downloadBrandReportStandalone = (row) => {
  ElMessage.success(`已发起 [${row.brandName}] 研报打印队列，请在弹出页选择另存为 PDF...`)
  const targetUrl = `/ai_brand_health_report_enhanced.html?id=${row.id}&action=print`
  window.open(targetUrl, '_blank')
}
</script>

<style scoped>
.report-list-container { padding: 4px 0; }
.page-title { margin: 0 0 8px; font-size: 22px; color: #303133; font-weight: 600; }
.page-subtitle { margin: 0; color: #909399; font-size: 14px; }
.mb-20 { margin-bottom: 20px; }
.table-card { border: none; border-radius: 8px; background: #fff; }
.filter-bar { display: flex; justify-content: space-between; align-items: center; }

.brand-name-text { font-weight: bold; color: #303133; }
.asi-score-badge { font-size: 15px; font-weight: 800; color: #f56c6c; font-family: monospace; }
</style>