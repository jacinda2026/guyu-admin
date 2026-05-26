<template>
  <div class="template-center-container">
    <!-- 列表页 -->
    <template v-if="!configPageVisible">
      <div class="page-header mb-20">
        <h2 class="page-title">中央控制塔 —— 报告模板中心</h2>
        <p class="page-subtitle">定义和管辖全系统交付端研报的渲染层（View 层），支持不同算力通道的数据字段映射、可视化模块显隐及千人千面的研报逻辑控制。</p>
      </div>

      <el-card shadow="never" class="table-card">
        <div class="filter-bar mb-20">
          <div class="left-info">
            <el-input v-model="searchQuery" placeholder="检索模板名称或代码..." style="width: 280px;" clearable>
              <template #prefix><el-icon><Search /></el-icon></template>
            </el-input>
          </div>
          <el-button type="primary" @click="handleCreateTemplate">
            <el-icon><Plus /></el-icon> 签发新研报模板
          </el-button>
        </div>

        <el-table :data="filteredTemplates" style="width: 100%" stripe>
          <el-table-column prop="code" label="模板唯一代码" width="160" />
          <el-table-column label="报告模板名称" min-width="180">
            <template #default="{ row }">
              <span style="font-weight: bold; color: #303133;">{{ row.name }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="category" label="适用行业赛道" width="130" align="center" />
          <el-table-column label="核心分析模块" min-width="240" show-overflow-tooltip>
            <template #default="{ row }">
              <el-tag size="small" v-for="mod in row.activeModules" :key="mod" style="margin-right: 6px; margin-bottom: 2px;">
                {{ mod }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="版本状态" width="110" align="center">
            <template #default="{ row }">
              <el-tag :type="row.isDefault ? 'danger' : 'info'" effect="light" size="small">
                {{ row.isDefault ? '全局应用中' : '草稿备用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="updateTime" label="最后部署时间" width="160" />
          <el-table-column label="骨架调度" width="160" align="center" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="handleConfigTemplate(row)">
                <el-icon><Setting /></el-icon> 架构配置
              </el-button>
              <el-divider direction="vertical" />
              <el-button v-if="row.reportUrl" type="success" link size="small" @click="handlePreviewTemplate(row)">
                预览
              </el-button>
              <el-divider v-if="row.reportUrl" direction="vertical" />
              <el-button v-if="row.reportUrl" type="warning" link size="small" @click="handleDownloadTemplate(row)">
                下载
              </el-button>
              <el-divider direction="vertical" />
              <el-button type="danger" link size="small" :disabled="row.isDefault" @click="handleDeleteTemplate(row)">
                下线
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </template>

    <!-- 架构配置页 -->
    <template v-else>
      <div class="config-page-header mb-20">
        <div>
          <el-button link type="primary" class="back-btn" @click="backToList">
            <el-icon><ArrowLeft /></el-icon> 返回模板列表
          </el-button>
          <h2 class="page-title">深度研报模块逻辑解耦 —— {{ currentForm.name }}</h2>
          <p class="page-subtitle">统一配置模板级下载、短链分享、模块显隐和底层算力通道权重。</p>
        </div>
        <div class="config-actions">
          <el-button @click="backToList">取消</el-button>
          <el-button type="primary" :disabled="weightTotal !== 100" @click="saveTemplateCenter">部署并应用该交付骨架</el-button>
        </div>
      </div>

      <el-card shadow="never" class="table-card config-card">
        <el-form :model="currentForm" label-position="top">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="研报交付模板名称" required>
                <el-input v-model="currentForm.name" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="大后台识别代码(不可重名)" required>
                <el-input v-model="currentForm.code" :disabled="isEdit" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-divider><span class="divider-text">研报可视化交付层显隐控制</span></el-divider>

          <div class="delivery-permission-box">
            <div class="permission-item">
              <div>
                <strong>客户脱机下载 PDF</strong>
                <p>统一控制该模板下所有模块是否允许客户导出 PDF。</p>
              </div>
              <el-switch v-model="currentForm.allowDownloadPdf" />
            </div>
            <div class="permission-item">
              <div>
                <strong>全网加密短链分享</strong>
                <p>统一控制该模板是否生成外部可访问的加密分享短链。</p>
              </div>
              <el-switch v-model="currentForm.allowShortLinkShare" />
            </div>
          </div>
          
          <div class="module-control-list">
            <div class="module-list-head">
              <span class="col-index">序号</span>
              <span class="col-name">模块名称</span>
              <span class="col-desc">模块说明</span>
              <span class="col-status">是否展示</span>
            </div>
            <div
              v-for="(mod, index) in currentForm.modulesConfig"
              :key="mod.key"
              class="module-list-row"
            >
              <span class="col-index index-badge">{{ index + 1 }}</span>
              <span class="col-name module-name">{{ mod.label }}</span>
              <span class="col-desc module-desc">{{ mod.description }}</span>
              <span class="col-status">
                <el-switch v-model="mod.enabled" />
              </span>
            </div>
          </div>

          <el-divider><span class="divider-text">底层算力通道加权映射规范</span></el-divider>
          
          <el-form-item label="本研报模板强制关联的底层算力渠道权重 (对齐大后台控制中台)">
            <div class="channel-weight-box">
              <div class="c-w-item">
                <span class="label">官方API 返回率</span>
                <el-input-number v-model="currentForm.weightApi" :min="0" :max="100" size="small" />
                <span class="unit">%</span>
              </div>
              <div class="c-w-item">
                <span class="label">新零售平台 权重值</span>
                <el-input-number v-model="currentForm.weightNewRetail" :min="0" :max="100" size="small" />
                <span class="unit">%</span>
              </div>
              <div class="c-w-item">
                <span class="label">模力平台 私有化探针</span>
                <el-input-number v-model="currentForm.weightMoli" :min="0" :max="100" size="small" />
                <span class="unit">%</span>
              </div>
            </div>
            <div class="weight-total-tip mt-12">
              当前计算总加权权重：<strong :class="weightTotal === 100 ? 'text-success' : 'text-danger'">{{ weightTotal }}%</strong> 
              (算力清洗调度要求加权总和必须严格等于 100%)。
            </div>
          </el-form-item>
        </el-form>
      </el-card>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Setting, Search, ArrowLeft } from '@element-plus/icons-vue'

const searchQuery = ref('')
const configPageVisible = ref(false)
const isEdit = ref(false)

// 大后台预设的报告交付模板池（像素级对齐您的 HTML 研报资产）
const templatesList = ref([
  { 
    code: 'RPT_HOTEL_STANDARD', 
    name: '标准型酒旅全域可见度（GEO）研报模板', 
    category: '酒店餐饮',
    activeModules: ['GEO健康度大盘', '商圈差值拦截审计', '模型偏好矩阵', '90天心智净化路线图'], 
    isDefault: true, 
    updateTime: '2026-05-17 18:24' 
  },
  { 
    code: 'RPT_AI_BRAND_HEALTH', 
    name: 'AI品牌健康度检测报告', 
    category: '品牌GEO/AI搜索',
    activeModules: ['综合健康度', '趋势分析', '竞争格局', '人群画像', '内容主题', '信息源权威性', '语义图谱', '优化行动'], 
    isDefault: false, 
    updateTime: '2026-05-18 12:00',
    reportUrl: '/reports/ai-brand-health.html'
  },
  { 
    code: 'RPT_TAKEOUT_SCENARIO', 
    name: '餐饮外卖大模型信源提及率诊断模板', 
    category: '餐饮本地生活',
    activeModules: ['信源提及率分布', '正向情感率漏斗', '热词感知墙'], 
    isDefault: false, 
    updateTime: '2026-05-14 10:15' 
  },
  { 
    code: 'RPT_INFANT_NUTRITION', 
    name: '高价值母婴/乳铁蛋白品牌健康度监控模板', 
    category: '快消零售',
    activeModules: ['全网可见度', '极性情绪NLP审计', '流失风控预警', '长效长尾问答拦截'], 
    isDefault: false, 
    updateTime: '2026-04-28 09:30' 
  }
])

const filteredTemplates = computed(() => {
  if (!searchQuery.value) return templatesList.value
  const q = searchQuery.value.toLowerCase()
  return templatesList.value.filter(t => t.name.toLowerCase().includes(q) || t.code.toLowerCase().includes(q))
})

// 研报配置动态结构模型
const currentForm = reactive({
  name: '', code: '', allowDownloadPdf: true, allowShortLinkShare: true, weightApi: 50, weightNewRetail: 30, weightMoli: 20, modulesConfig: []
})

const weightTotal = computed(() => currentForm.weightApi + currentForm.weightNewRetail + currentForm.weightMoli)

// 默认酒店研报的核心组件显隐骨架
const getDefaultModulesSkeleton = () => [
  { key: 'summary', label: 'GEO综合健康分看板', enabled: true, description: '展示全网可见度分值、正面情绪、行业平均基准线及优势关联客群场景。' },
  { key: 'loss_alert', label: '商业流失预警 (SOV 差值拦截审计)', enabled: true, description: '核心风控模块。核算商务出差、机场中转等细分搜索场景下的可见度漏斗。' },
  { key: 'echarts_matrix', label: 'ECharts 偏好矩阵与分布式信源分布', enabled: true, description: '调用底层 ECharts 组件，极坐标渲染 Model Bias 以及横向条形图解析引用占比。' },
  { key: 'timeline_90', label: '90天品牌净化及优化路线打法时间轴', enabled: true, description: '输出交付最终承诺：第1-7天、第8-30天、第31-90天的阶段性修补打法建议。' }
]

// AI品牌健康度检测报告的交付层显隐骨架
const getAiBrandHealthModulesSkeleton = () => [
  { key: 'health', label: '综合健康度', enabled: true, description: '综合提及率、SOV、平均排名、正面情感、内容准确度、六维雷达图。' },
  { key: 'trend', label: '趋势分析', enabled: true, description: '提及率、SOV、情感、内容准确度的月度趋势与风险预警。' },
  { key: 'compete', label: '竞争格局', enabled: true, description: '品牌声量竞争矩阵、竞品多维指标、负面议题排名和增长势能。' },
  { key: 'opportunity', label: '机会洞察', enabled: true, description: '优化空间矩阵、SWOT战略分析、策略优先级排序。' },
  { key: 'audience', label: '人群画像', enabled: true, description: '核心人群分布、人群兴趣标签、人群×平台×情感交叉分析。' },
  { key: 'content', label: '内容主题', enabled: true, description: '主题提及热力图、主题×情感、竞品主题覆盖和AI回答准确度评判。' },
  { key: 'authority', label: '信息源权威性', enabled: true, description: 'AI引用来源类型、权威性评分、引用内容溯源TOP20和信息源优化建议。' },
  { key: 'semantic', label: '语义图谱', enabled: true, description: '品牌关联词云、语义距离图谱、话题聚类和语义演变路径。' },
  { key: 'action', label: '优化行动', enabled: true, description: '微观优化机会清单、优化行动路线图和验收指标。' }
]

const getModulesSkeleton = (code) => {
  return code === 'RPT_AI_BRAND_HEALTH' ? getAiBrandHealthModulesSkeleton() : getDefaultModulesSkeleton()
}

const handleCreateTemplate = () => {
  isEdit.value = false
  currentForm.name = ''
  currentForm.code = ''
  currentForm.allowDownloadPdf = true
  currentForm.allowShortLinkShare = true
  currentForm.weightApi = 40
  currentForm.weightNewRetail = 30
  currentForm.weightMoli = 30
  currentForm.modulesConfig = getDefaultModulesSkeleton()
  configPageVisible.value = true
}

const handleConfigTemplate = (row) => {
  isEdit.value = true
  currentForm.name = row.name
  currentForm.code = row.code
  currentForm.allowDownloadPdf = row.allowDownloadPdf ?? true
  currentForm.allowShortLinkShare = row.allowShortLinkShare ?? true
  currentForm.weightApi = row.code === 'RPT_HOTEL_STANDARD' ? 50 : 40
  currentForm.weightNewRetail = row.code === 'RPT_HOTEL_STANDARD' ? 30 : 30
  currentForm.weightMoli = row.code === 'RPT_HOTEL_STANDARD' ? 20 : 30
  currentForm.modulesConfig = getModulesSkeleton(row.code)
  configPageVisible.value = true
}


const backToList = () => {
  configPageVisible.value = false
}

const handlePreviewTemplate = (row) => {
  window.open(row.reportUrl, '_blank')
}

const handleDownloadTemplate = (row) => {
  const a = document.createElement('a')
  a.href = row.reportUrl
  a.download = `${row.code}.html`
  a.click()
}

const saveTemplateCenter = () => {
  const target = templatesList.value.find(t => t.code === currentForm.code)
  if (target) {
    target.name = currentForm.name
    target.allowDownloadPdf = currentForm.allowDownloadPdf
    target.allowShortLinkShare = currentForm.allowShortLinkShare
    target.activeModules = currentForm.modulesConfig.filter(mod => mod.enabled).map(mod => mod.label)
    target.updateTime = new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
  }
  ElMessage.success(`研报交付资产模板 [${currentForm.code}] 部署上线成功！大后台算法策略已同步更新。`)
  configPageVisible.value = false
}

const handleDeleteTemplate = (row) => {
  ElMessageBox.confirm(`确定要彻底下线并移除 [${row.name}] 的交付层定义吗？已下发工单可能受影响。`, '大后台最高安全警示', { type: 'error' }).then(() => {
    templatesList.value = templatesList.value.filter(t => t.code !== row.code)
    ElMessage.success('模板架构已彻底安全下线')
  })
}
</script>

<style scoped>
.template-center-container { padding: 24px; background-color: #f5f7fa; min-height: 100vh; }
.page-title { margin: 0 0 8px; font-size: 22px; color: #303133; font-weight: 600; }
.page-subtitle { margin: 0; color: #909399; font-size: 14px; line-height: 1.5; }
.mb-20 { margin-bottom: 20px; }
.mt-12 { margin-top: 12px; }

.table-card { border: none; border-radius: 8px; background: #fff; }
.filter-bar { display: flex; justify-content: space-between; align-items: center; }

.config-page-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; }
.back-btn { padding-left: 0; margin-bottom: 8px; }
.config-actions { display: flex; gap: 12px; align-items: center; padding-top: 6px; }
.config-card { padding-bottom: 12px; }
.divider-text { font-size: 13px; color: #909399; font-weight: bold; }


.delivery-permission-box { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin-bottom: 16px; }
.permission-item { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 14px 16px; border: 1px solid #d9ecff; border-radius: 8px; background: #f5f9ff; }
.permission-item strong { display: block; font-size: 14px; color: #303133; margin-bottom: 4px; }
.permission-item p { margin: 0; font-size: 12px; color: #909399; line-height: 1.5; }

/* 研报模块列表展示 */
.module-control-list { border: 1px solid #e4e7ed; border-radius: 8px; overflow: hidden; background: #fff; margin-bottom: 24px; }
.module-list-head,
.module-list-row { display: grid; grid-template-columns: 72px 180px minmax(280px, 1fr) 140px; align-items: center; column-gap: 16px; padding: 12px 16px; }
.module-list-head { background: #f5f7fa; color: #606266; font-size: 13px; font-weight: 600; border-bottom: 1px solid #e4e7ed; }
.module-list-row { min-height: 64px; border-bottom: 1px solid #f0f2f5; transition: background-color 0.2s; }
.module-list-row:last-child { border-bottom: none; }
.module-list-row:hover { background: #f8fbff; }
.col-index { text-align: center; }
.col-status { display: flex; justify-content: center; }
.index-badge { width: 28px; height: 28px; line-height: 28px; border-radius: 50%; background: #eef5ff; color: #2b65f0; font-weight: 700; justify-self: center; }
.module-name { font-size: 14px; color: #303133; font-weight: 600; }
.module-desc { font-size: 12px; color: #909399; line-height: 1.5; }

/* 算力通道比重盒 */
.channel-weight-box { display: flex; gap: 24px; background: #fdfdfd; border: 1px solid #e4e7ed; border-radius: 6px; padding: 16px; }
.c-w-item { display: flex; align-items: center; gap: 8px; }
.c-w-item .label { font-size: 13px; color: #606266; font-weight: 500; }
.c-w-item .unit { font-size: 13px; color: #909399; font-weight: bold; }
.weight-total-tip { font-size: 13px; color: #606266; }

.text-success { color: #67c23a; font-weight: bold; }
.text-danger { color: #f56c6c; font-weight: bold; }

@media (max-width: 960px) {
  .config-page-header { flex-direction: column; }
  .delivery-permission-box { grid-template-columns: 1fr; }
  .module-list-head,
  .module-list-row { grid-template-columns: 56px 140px minmax(180px, 1fr) 90px; column-gap: 10px; }
  .channel-weight-box { flex-direction: column; gap: 12px; }
}
</style>