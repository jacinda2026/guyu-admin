<template>
  <div class="smart-center">
    <div class="smart-toolbar">
      <div class="filter-group">
        <el-select v-model="filters.type" class="filter-select" placeholder="技能类型">
          <el-option label="技能类型 全部" value="all" />
          <el-option label="GEO 工具" value="geo" />
          <el-option label="内容工具" value="content" />
          <el-option label="数据工具" value="data" />
          <el-option label="线索工具" value="lead" />
        </el-select>
        <el-select v-model="filters.creator" class="filter-select" placeholder="创建人">
          <el-option label="创建人 由我创建" value="me" />
          <el-option label="创建人 全部" value="all" />
          <el-option label="创建人 范范" value="范范" />
          <el-option label="创建人 午未" value="午未" />
          <el-option label="创建人 Lee" value="Lee" />
        </el-select>
        <el-select v-model="filters.status" class="filter-select" placeholder="技能状态">
          <el-option label="技能状态 全部" value="all" />
          <el-option label="可用" value="active" />
        </el-select>
      </div>
    </div>

    <div class="skill-grid">
      <button
        v-for="skill in filteredSkills"
        :key="skill.id || skill.name"
        type="button"
        class="skill-card"
        :class="{ 'is-unavailable': skill.unavailable }"
        @click="openSkill(skill)"
      >
        <div class="skill-content">
          <div class="skill-title-row">
            <h3>{{ skill.name }}</h3>
            <el-icon class="verified-icon"><CircleCheckFilled /></el-icon>
          </div>
          <p>{{ skill.description }}</p>
          <div class="skill-tag-row">
            <span class="skill-tag">技能</span>
            <span class="new-tag">{{ skill.unavailable ? '暂不可用' : 'New' }}</span>
          </div>
          <div class="skill-meta">
            <span class="creator-dot">{{ skill.creator.slice(0, 1) }}</span>
            <span>{{ skill.creator }}</span>
            <span>最近编辑 {{ skill.updatedAt }}</span>
          </div>
        </div>
        <div class="skill-icon" :class="skill.theme">
          <el-icon>
            <component :is="skill.iconComponent" />
          </el-icon>
        </div>
      </button>
    </div>

    <el-empty v-if="!loading && !filteredSkills.length" description="暂无技能" />

    <el-dialog
      v-model="runDialogVisible"
      :title="activeSkill ? activeSkill.name : '运行技能'"
      width="680px"
      class="skill-run-dialog"
      destroy-on-close
    >
      <div v-if="activeSkill" class="run-dialog-body">
        <p class="run-dialog-desc">{{ activeSkill.description }}</p>
        <el-form label-position="top" class="run-form">
          <el-form-item
            v-for="field in activeSkill.inputSchema || []"
            :key="field.key"
            :label="field.label"
            :required="field.required"
          >
            <el-input
              v-if="field.type === 'textarea'"
              v-model="runForm[field.key]"
              type="textarea"
              :rows="5"
              :placeholder="field.placeholder || `请输入${field.label}`"
            />
            <el-input
              v-else
              v-model="runForm[field.key]"
              :placeholder="field.placeholder || `请输入${field.label}`"
            />
          </el-form-item>
        </el-form>

        <div v-if="runResult" class="run-result">
          <div class="run-result-title">运行结果</div>
          <pre>{{ runResult }}</pre>
        </div>
      </div>
      <template #footer>
        <el-button @click="runDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="running" @click="runActiveSkill">运行</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Aim,
  CircleCheckFilled,
  Collection,
  Connection,
  Cpu,
  DataAnalysis,
  DocumentChecked,
  EditPen,
  Files,
  TrendCharts
} from '@element-plus/icons-vue'

const iconMap = {
  Aim,
  Collection,
  Connection,
  Cpu,
  DataAnalysis,
  DocumentChecked,
  EditPen,
  Files,
  TrendCharts
}

const filters = reactive({
  type: 'all',
  creator: 'me',
  status: 'all'
})

const loading = ref(false)
const skills = ref([])
const runDialogVisible = ref(false)
const activeSkill = ref(null)
const running = ref(false)
const runResult = ref('')
const runForm = reactive({})

const defaultSkills = [
  {
    id: 'brand-question-expand',
    name: '基础品牌/产品信息的问题库拓展',
    description: '围绕品牌、产品、场景和用户意图生成问题库，补齐 GEO 监测的基础提问资产。',
    type: 'geo',
    creator: '范范',
    updatedAt: '05-23 15:21',
    runMode: 'external',
    url: 'https://824wnmw2vg.coze.site/',
    icon: 'Collection',
    theme: 'theme-blue'
  },
  {
    id: 'keyword-expand',
    name: '关键词拓展工具',
    description: '当前内置关键词拓展能力，支持从核心词延展长尾词、场景词和内容选题方向。',
    type: 'geo',
    creator: '午未',
    updatedAt: '05-22 17:36',
    runMode: 'external',
    url: 'https://g6h7wzq7r2.coze.site/',
    icon: 'TrendCharts',
    theme: 'theme-pink',
    inputSchema: [
      { key: 'keyword', label: '核心关键词', type: 'text', required: true },
      { key: 'industry', label: '行业/场景', type: 'text' }
    ]
  },
  {
    id: 'seo-geo-diagnosis',
    name: 'SEO/GEO网站诊断工具',
    description: '检测站点结构、内容收录、关键词覆盖和 GEO 可见性，输出诊断与优化建议。',
    type: 'geo',
    creator: 'Lee',
    updatedAt: '05-21 10:08',
    runMode: 'external',
    url: 'https://7npqkgyhsj.coze.site/',
    icon: 'Aim',
    theme: 'theme-cyan'
  },
  {
    id: 'content-writing-publish',
    name: '内容撰写和发布工具',
    description: '面向 SEO/GEO 内容生产，辅助撰写文章、发布稿和多平台分发素材。',
    type: 'content',
    creator: '范范',
    updatedAt: '05-20 18:42',
    runMode: 'external',
    url: 'https://trnj3bcm64.coze.site/',
    icon: 'EditPen',
    theme: 'theme-purple'
  },
  {
    id: 'content-effectiveness-check',
    name: '发文内容有效性检查工具',
    description: '检查待发布内容的主题覆盖、关键词匹配、可读性和 AI 收录友好度。',
    type: 'content',
    creator: '午未',
    updatedAt: '05-18 14:09',
    runMode: 'external',
    url: 'https://j7nh9tfd99.coze.site/',
    icon: 'DocumentChecked',
    theme: 'theme-green'
  },
  {
    id: 'content-insight-strategy',
    name: '内容洞察和策略分析',
    description: '汇总内容表现、用户意图和平台反馈，沉淀可执行的内容策略与选题机会。',
    type: 'data',
    creator: 'Lee',
    updatedAt: '05-16 09:35',
    runMode: 'external',
    url: 'https://geocmsgy.coze.site/',
    icon: 'DataAnalysis',
    theme: 'theme-orange'
  },
  {
    id: 'lead-management',
    name: '谷雨客户线索管理工具',
    description: '管理客户线索、跟进状态和转化过程，连接 GEO 服务交付与销售协同。',
    type: 'lead',
    creator: '范范',
    updatedAt: '05-12 16:18',
    runMode: 'external',
    url: 'https://ds.guyuai.com/',
    icon: 'Connection',
    theme: 'theme-indigo'
  },
  {
    id: 'keyword-traffic',
    name: '关键词流量工具',
    description: '分析关键词搜索流量、趋势变化和机会等级，为内容与投放优先级提供依据。',
    type: 'data',
    creator: '午未',
    updatedAt: '05-10 11:27',
    runMode: 'external',
    url: 'https://guyuhudong01.coze.site/',
    icon: 'Files',
    theme: 'theme-slate'
  }
]

const normalizeSkill = (skill) => ({
  ...skill,
  creator: skill.creator || '范范',
  updatedAt: skill.updatedAt || '-',
  runMode: skill.runMode || (skill.url ? 'external' : 'workflow'),
  iconComponent: iconMap[skill.icon] || Cpu
})

const filteredSkills = computed(() => {
  let list = skills.value.map(normalizeSkill)
  if (filters.type !== 'all') {
    list = list.filter(skill => skill.type === filters.type)
  }
  if (filters.creator !== 'all') {
    const creator = filters.creator === 'me' ? '范范' : filters.creator
    list = list.filter(skill => skill.creator === creator)
  }
  return list
})

const loadSkills = async () => {
  loading.value = true
  try {
    const response = await fetch('/api/client/skills')
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const result = await response.json()
    skills.value = Array.isArray(result.data) ? result.data : defaultSkills
  } catch (error) {
    skills.value = defaultSkills
    ElMessage.warning('未连接 Coze 代理服务，已使用本地技能配置')
  } finally {
    loading.value = false
  }
}

const resetRunForm = (schema = []) => {
  Object.keys(runForm).forEach(key => delete runForm[key])
  schema.forEach((field) => {
    runForm[field.key] = ''
  })
  runResult.value = ''
}

const openSkill = (skill) => {
  if (skill.unavailable) {
    ElMessage.warning(skill.unavailableReason || '该技能地址暂不可用')
    return
  }
  if (skill.runMode === 'external' && skill.url) {
    window.open(skill.url, '_blank', 'noopener,noreferrer')
    return
  }
  if (skill.runMode === 'iframe' && skill.url) {
    window.open(skill.url, '_blank', 'noopener,noreferrer')
    return
  }
  activeSkill.value = skill
  resetRunForm(skill.inputSchema || [])
  runDialogVisible.value = true
}

const runActiveSkill = async () => {
  if (!activeSkill.value) return
  const missingField = (activeSkill.value.inputSchema || []).find(field => field.required && !String(runForm[field.key] || '').trim())
  if (missingField) {
    ElMessage.warning(`请填写${missingField.label}`)
    return
  }

  running.value = true
  runResult.value = ''
  try {
    const response = await fetch(`/api/client/skills/${encodeURIComponent(activeSkill.value.id)}/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inputs: { ...runForm } })
    })
    const result = await response.json()
    if (!response.ok) {
      throw new Error(result.message || result.code || `HTTP ${response.status}`)
    }
    runResult.value = JSON.stringify(result.data || result, null, 2)
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '技能运行失败')
  } finally {
    running.value = false
  }
}

onMounted(loadSkills)
</script>

<style scoped>
.smart-center {
  min-height: 100%;
  padding-bottom: 24px;
}

.smart-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-select {
  width: 228px;
}

.skill-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(260px, 1fr));
  gap: 12px;
}

.skill-card {
  min-height: 172px;
  padding: 18px 16px 14px;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  background: #fff;
  display: flex;
  justify-content: space-between;
  gap: 16px;
  text-align: left;
  cursor: pointer;
  box-sizing: border-box;
  transition: border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
}

.skill-card:hover {
  border-color: #bfd0ff;
  box-shadow: 0 10px 30px rgba(31, 41, 55, 0.08);
  transform: translateY(-1px);
}

.skill-card.is-unavailable {
  border-style: dashed;
  background: #fafafa;
}

.skill-card.is-unavailable .skill-content,
.skill-card.is-unavailable .skill-icon {
  opacity: 0.58;
}

.skill-card.is-unavailable:hover {
  border-color: #f3b7b7;
  box-shadow: none;
  transform: none;
}

.skill-content {
  min-width: 0;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.skill-title-row {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.skill-title-row h3 {
  margin: 0;
  font-size: 17px;
  line-height: 24px;
  color: #111827;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.verified-icon {
  flex: 0 0 auto;
  font-size: 15px;
  color: #63d587;
}

.skill-content p {
  margin: 6px 0 0;
  min-height: 44px;
  color: #9aa3b2;
  font-size: 14px;
  line-height: 22px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.skill-tag-row {
  margin-top: auto;
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  height: 24px;
  padding: 0 10px;
  border: 1px solid #edf0f5;
  border-radius: 6px;
  background: #fff;
  color: #111827;
  font-size: 12px;
  font-weight: 700;
}

.new-tag {
  margin-left: 5px;
  color: #a8b0bd;
  font-weight: 500;
}

.skill-meta {
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  color: #5b6472;
  font-size: 12px;
  white-space: nowrap;
}

.creator-dot {
  width: 16px;
  height: 16px;
  border-radius: 999px;
  background: #3b82f6;
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 800;
}

.skill-icon {
  flex: 0 0 68px;
  width: 68px;
  height: 68px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 34px;
  box-shadow: inset 0 1px 8px rgba(255, 255, 255, 0.75);
}

.theme-blue { background: linear-gradient(135deg, #e8f3ff, #b9dcff); color: #2b65f0; }
.theme-pink { background: linear-gradient(135deg, #f6ecff, #ffd7e5); color: #f06c9a; }
.theme-cyan { background: linear-gradient(135deg, #e8fbff, #bceeff); color: #0e9ac7; }
.theme-purple { background: linear-gradient(135deg, #f0ecff, #d9ccff); color: #7657d8; }
.theme-green { background: linear-gradient(135deg, #ecfff6, #c7f1df); color: #1aa05f; }
.theme-orange { background: linear-gradient(135deg, #fff7e8, #ffd9a9); color: #d97706; }
.theme-indigo { background: linear-gradient(135deg, #edf2ff, #c9d8ff); color: #4f46e5; }
.theme-slate { background: linear-gradient(135deg, #f7fafc, #dbe4ee); color: #64748b; }

.skill-run-dialog :deep(.el-dialog) {
  border-radius: 10px;
}

.run-dialog-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.run-dialog-desc {
  margin: 0;
  color: #64748b;
  font-size: 14px;
  line-height: 22px;
}

.run-form :deep(.el-form-item) {
  margin-bottom: 14px;
}

.run-form :deep(.el-form-item__label) {
  color: #111827;
  font-weight: 700;
}

.run-result {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f8fafc;
  overflow: hidden;
}

.run-result-title {
  padding: 10px 12px;
  border-bottom: 1px solid #e5e7eb;
  color: #111827;
  font-size: 13px;
  font-weight: 800;
}

.run-result pre {
  margin: 0;
  padding: 12px;
  max-height: 280px;
  overflow: auto;
  color: #334155;
  font-size: 12px;
  line-height: 18px;
  white-space: pre-wrap;
  word-break: break-word;
}

@media (max-width: 1440px) {
  .skill-grid { grid-template-columns: repeat(3, minmax(260px, 1fr)); }
}

@media (max-width: 1100px) {
  .skill-grid { grid-template-columns: repeat(2, minmax(260px, 1fr)); }
}

@media (max-width: 760px) {
  .smart-toolbar { align-items: stretch; flex-direction: column; }
  .filter-group { flex-direction: column; align-items: stretch; }
  .filter-select { width: 100%; }
  .skill-grid { grid-template-columns: 1fr; }
  .skill-card { border-radius: 12px; }
}
</style>
