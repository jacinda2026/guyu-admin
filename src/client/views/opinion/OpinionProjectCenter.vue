<template>
  <div class="opinion-center">
    <div class="page-header">
      <div>
        <h2>AI 全域舆情深钻系统</h2>
        <p>以项目为单位管理检测主题，进入项目后开展问题生成、线索深钻、证据链和报告输出。</p>
      </div>
      <el-button type="primary">
        <el-icon><Plus /></el-icon>
        创建深钻项目
      </el-button>
    </div>

    <el-row :gutter="16" class="stats-row">
      <el-col :span="6" v-for="item in stats" :key="item.label">
        <el-card shadow="never" class="stat-card">
          <div class="stat-label">{{ item.label }}</div>
          <div class="stat-value" :class="item.type">{{ item.value }}</div>
          <div class="stat-desc">{{ item.desc }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never" class="table-card">
      <div class="filter-bar">
        <el-input v-model="keyword" placeholder="搜索检测主题、项目编号..." clearable style="width: 320px;">
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
      </div>
      <el-table :data="filteredProjects" stripe>
        <el-table-column prop="id" label="项目编号" width="140" />
        <el-table-column label="检测主题" min-width="260">
          <template #default="{ row }">
            <el-link type="primary" :underline="false" class="project-link" @click="enterProject(row)">
              {{ row.topic }}
            </el-link>
            <div class="row-sub">{{ row.desc }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="industry" label="行业/场景" width="140" />
        <el-table-column prop="riskLevel" label="风险等级" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="row.riskLevel === '高' ? 'danger' : row.riskLevel === '中' ? 'warning' : 'success'" size="small" effect="dark">
              {{ row.riskLevel }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="clues" label="线索数" width="90" align="center" />
        <el-table-column prop="evidence" label="证据数" width="90" align="center" />
        <el-table-column prop="reports" label="报告" width="90" align="center" />
        <el-table-column prop="updatedAt" label="最近更新" width="150" />
        <el-table-column label="操作" width="130" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" plain @click="enterProject(row)">进入项目</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, Search } from '@element-plus/icons-vue'

const router = useRouter()
const keyword = ref('')

const projects = ref([
  { id: 'OP-AUDI-E7X', topic: '奥迪E7X换壳争议深钻', desc: '判断争议是否扩散、是否影响购买决策和AI回答倾向', industry: '汽车', riskLevel: '高', clues: 12, evidence: 38, reports: 4, updatedAt: '2026-05-29 18:30' },
  { id: 'OP-MILK-001', topic: '卓牧羊奶粉口碑深钻', desc: '识别功效、安全、竞品对比和购买决策相关风险', industry: '母婴/食品', riskLevel: '中', clues: 8, evidence: 24, reports: 3, updatedAt: '2026-05-29 15:20' },
  { id: 'OP-HOTEL-HT', topic: '汉庭门店差评深钻', desc: '聚合门店服务、卫生、价格争议和平台评价证据', industry: '酒店/门店', riskLevel: '低', clues: 4, evidence: 13, reports: 2, updatedAt: '2026-05-28 21:10' }
])

const stats = computed(() => [
  { label: '深钻项目', value: projects.value.length, desc: '覆盖品牌、事件、门店和行业', type: 'primary' },
  { label: '高风险项目', value: projects.value.filter(item => item.riskLevel === '高').length, desc: '需要优先处理', type: 'danger' },
  { label: '舆情线索', value: projects.value.reduce((sum, item) => sum + item.clues, 0), desc: '已聚类风险线索', type: 'warning' },
  { label: '证据链', value: projects.value.reduce((sum, item) => sum + item.evidence, 0), desc: '可追溯证据资产', type: 'primary' }
])

const filteredProjects = computed(() => {
  if (!keyword.value) return projects.value
  const q = keyword.value.toLowerCase()
  return projects.value.filter(item => item.topic.toLowerCase().includes(q) || item.id.toLowerCase().includes(q))
})

const enterProject = (row) => {
  router.push(`/opinion-project/${row.id}/overview`)
}
</script>

<style scoped>
.opinion-center { display: flex; flex-direction: column; gap: 16px; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.page-header h2 { margin: 0 0 8px; color: #111827; font-size: 22px; font-weight: 800; }
.page-header p { margin: 0; color: #64748b; font-size: 14px; }
.stats-row { align-items: stretch; }
.stat-card, .table-card { border: none; border-radius: 8px; }
.stat-label { color: #64748b; font-size: 13px; }
.stat-value { margin-top: 8px; color: #2563eb; font-size: 28px; font-weight: 800; line-height: 1; }
.stat-value.danger { color: #f56c6c; }
.stat-value.warning { color: #e6a23c; }
.stat-desc { margin-top: 10px; color: #94a3b8; font-size: 12px; }
.filter-bar { display: flex; justify-content: space-between; margin-bottom: 16px; }
.project-link { font-weight: 800; }
.row-sub { margin-top: 4px; color: #94a3b8; font-size: 12px; }
</style>
