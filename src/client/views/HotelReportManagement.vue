<template>
  <div class="report-list-container">
    <div class="page-header mb-20">
      <h2 class="page-title">酒店单店诊断项目</h2>
      <p class="page-subtitle">归档并管控全量下发的历史酒店 GEO 诊断工单。支持在线提取问卷链接、下载基础体验报告与商业版穿透。</p>
    </div>

    <el-card shadow="never" class="table-card">
      <div class="filter-bar mb-20">
        <el-input v-model="searchQuery" placeholder="输入酒店名称、单号或手机号检索..." style="width: 320px;" clearable>
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <el-button type="primary" @click="$router.push('/report')">
          <el-icon><Plus /></el-icon> 发起新诊断任务
        </el-button>
      </div>

      <el-table :data="filteredReports" style="width: 100%" stripe>
        <el-table-column prop="id" label="诊断单号" width="110" />
        <el-table-column label="目标诊断酒店" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">
            <span :class="{'text-placeholder': row.status === '待填写'}">{{ row.hotelName }}</span>
          </template>
        </el-table-column>
        <el-table-column label="客户问卷名称" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.status === '待填写'" class="text-placeholder">- 等待客户提交 -</span>
            <el-link v-else type="primary" :underline="false" class="survey-link" @click="openSurveyDetail(row)">
              <el-icon style="margin-right: 4px;"><Document /></el-icon>{{ row.surveyName }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column label="联系人" width="90">
          <template #default="{ row }">
            <span v-if="row.status === '待填写'" class="text-placeholder">-</span>
            <span>{{ row.contact }}</span>
          </template>
        </el-table-column>
        <el-table-column label="手机号" width="120"><template #default="{ row }"><span class="mono">{{ row.phone }}</span></template></el-table-column>
        <el-table-column label="已解锁权限" width="110">
          <template #default="{ row }">
            <el-tag :type="row.package === 'pro' ? 'danger' : 'info'" effect="plain" size="small">{{ row.package === 'pro' ? '深度商业版' : '基础体验版' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="140" />
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }"><el-tag :type="getStatusType(row.status)" size="small" effect="dark">{{ row.status }}</el-tag></template>
        </el-table-column>
        <el-table-column label="快捷操作" width="370" align="right" fixed="right">
          <template #default="{ row }">
            <template v-if="row.status === '已交付'">
              <el-button type="primary" link size="small" @click="openBasicReportStandalone(row)">阅览基础版</el-button>
              <el-button v-if="row.package === 'pro'" type="danger" link size="small" style="font-weight: bold;" @click="openReportView(row, 'pro')"><el-icon><DataLine /></el-icon> 阅览商业版</el-button>
              <el-button v-if="row.package === 'basic'" type="warning" link size="small" style="font-weight: bold;" @click="upgradeToPro(row)"><el-icon><Unlock /></el-icon> 升级商业版</el-button>
              <el-divider direction="vertical" />
              <el-dropdown trigger="click" @command="(cmd) => handleCommand(cmd, row)">
                <span class="el-dropdown-link text-success cursor-pointer"><el-icon><Share /></el-icon> 分享 <el-icon><ArrowDown /></el-icon></span>
                <template #dropdown><el-dropdown-menu><el-dropdown-item command="share_basic">分享基础版</el-dropdown-item><el-dropdown-item command="share_pro" v-if="row.package === 'pro'">分享商业版</el-dropdown-item></el-dropdown-menu></template>
              </el-dropdown>
              <el-button type="info" link size="small" @click="deleteReport(row)" style="margin-left:12px;">删除</el-button>
            </template>
            <template v-else-if="row.status === '待填写'">
              <el-button type="success" link size="small" @click="handleCommand('share_survey', row)"><el-icon><CopyDocument /></el-icon> 提取问卷链接</el-button>
              <el-divider direction="vertical" />
              <el-button type="info" link size="small" @click="deleteReport(row)">删除</el-button>
            </template>
            <template v-else><span class="text-muted small"><el-icon class="is-loading"><Loading /></el-icon> 模型核算中...</span></template>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="surveyDetailVisible" title="客户原始填报资料审计" width="800px" destroy-on-close>
      <div v-if="currentSurvey" class="survey-detail-body">
        
        <h4 class="survey-sec-title">基础身份与对接信息</h4>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="客户名称"><strong style="color: #303133;">{{ currentSurvey.hotelName }}</strong></el-descriptions-item>
          <el-descriptions-item label="品牌 / 管理方">{{ currentSurvey.brandName }}</el-descriptions-item>
          <el-descriptions-item label="联系人 / 电话">{{ currentSurvey.contact }}</el-descriptions-item>
          <el-descriptions-item label="认证手机号"><span class="mono" style="color: #2b65f0;">{{ currentSurvey.phone }}</span></el-descriptions-item>
          <el-descriptions-item label="城市商圈">{{ currentSurvey.cityArea }}</el-descriptions-item>
          <el-descriptions-item label="酒店地址" :span="2">{{ currentSurvey.hotelAddress }}</el-descriptions-item>
        </el-descriptions>

        <h4 class="survey-sec-title mt-20">营销与竞争情报</h4>
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="主要客群场景">
            <el-tag size="small" type="warning" effect="light" v-for="tag in currentSurvey.scenes" :key="tag" style="margin-right: 6px;">{{ tag }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="主要竞品">
            <span style="color: #e6a23c; font-weight: 500;">{{ currentSurvey.knownCompetitors }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="重点平台 / 信源">
            <span style="color: #67c23a; font-weight: 500;">{{ currentSurvey.platforms }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="期望推荐词">
            <span style="color: #2b65f0; font-weight: 500;">{{ currentSurvey.recommendKeywords }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="酒店核心卖点">
            <div style="line-height: 1.6; color: #606266;">{{ currentSurvey.sellingPoints }}</div>
          </el-descriptions-item>
          <el-descriptions-item label="本次诊断目标">
            <div class="goal-highlight-box">
              {{ currentSurvey.businessGoal }}
            </div>
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <template #footer>
        <el-button @click="surveyDetailVisible = false">关闭阅览</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="reportViewVisible" fullscreen :show-close="false" class="report-fullscreen-dialog" @opened="initECharts">
      <template #header="{ close }">
        <div class="report-view-header">
          <span class="report-head-title">GEO 品牌深度诊断研报 (深度商业版) - {{ currentViewReport?.hotelName }}</span>
          <div class="head-actions"><el-button type="primary" plain @click="handlePrint">离线下载 PDF</el-button><el-button type="danger" @click="close">关闭阅览</el-button></div>
        </div>
      </template>
      <div class="report-paper-wrapper">
        <div class="report-paper-body">
          <div class="report-cover-banner">
            <div class="c-left"><h2>{{ currentViewReport?.hotelName }}</h2><p>酒店全域大模型 AI 可见度（GEO）诊断与心智渗透度深度研报</p></div>
          </div>
          <div class="report-padding-content">
            <div id="biasChartRef" ref="modelBiasChartRef" style="width:100%; height:240px;"></div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Plus, Download, Close, CopyDocument, ArrowDown, Unlock, Loading, Share, DataLine, Document } from '@element-plus/icons-vue'
import * as echarts from 'echarts'

const searchQuery = ref('')
const reportViewVisible = ref(false)
const surveyDetailVisible = ref(false)
const currentViewReport = ref(null)
const currentSurvey = ref(null)

// 🌟 数据层：补全前端 HTML 原生问卷对应的全部结构化字段
const reportsData = ref([
  { 
    id: 'GEO-829104', hotelName: '汉庭北京新国展祥云小镇店', surveyName: '汉庭新国展店营销诊断问卷', contact: '王经理', phone: '13812345678', package: 'basic', createTime: '2026-05-17 19:20', status: '已交付', 
    brandName: '华住 / 汉庭', cityArea: '北京顺义 · 新国展', hotelAddress: '北京市顺义区安泰大街祥云小镇附近',
    scenes: ['商务出差', '机场中转', '展会住宿'],
    sellingPoints: '免费停车、机器人服务、自助洗衣房、智能客控、55寸投屏电视',
    platforms: '携程、美团、抖音、小红书、官网、百度地图',
    recommendKeywords: '新国展附近酒店、首都机场中转酒店、顺义性价比酒店',
    knownCompetitors: '桔子水晶、希尔顿欢朋、远航国际、亚朵',
    businessGoal: '提升 AI 推荐可见度，找出被竞品截流的场景，并给出 30 天优化动作。'
  },
  { 
    id: 'GEO-827311', hotelName: '桔子水晶北京首都国际会展中心酒店', surveyName: '桔子水晶AI可见度调研表', contact: '李总', phone: '13988889999', package: 'pro', createTime: '2026-05-15 13:05', status: '已交付', 
    brandName: '华住 / 桔子水晶', cityArea: '北京朝阳 · 首都机场', hotelAddress: '北京市朝阳区首都机场T3航站楼周边',
    scenes: ['机场中转', '商务出差'],
    sellingPoints: '豪华套房、双冰箱双电视、设计感、高端商务接送',
    platforms: '官网、高德地图、飞猪',
    recommendKeywords: '首都机场高端酒店、T3航站楼附近住宿',
    knownCompetitors: '全季酒店, 亚朵酒店',
    businessGoal: '针对高端商务出差人群，确立区域内 AI 智能问答的推荐垄断地位。'
  }
])

const filteredReports = computed(() => {
  if (!searchQuery.value) return reportsData.value
  return reportsData.value.filter(r => r.hotelName.includes(searchQuery.value))
})

const getStatusType = (status) => status === '已交付' ? 'success' : 'info'
const openSurveyDetail = (row) => { currentSurvey.value = row; surveyDetailVisible.value = true }
const openReportView = (row, type) => { currentViewReport.value = row; reportViewVisible.value = true }

const openBasicReportStandalone = (row) => {
  window.open(`/hotel_ai_report_sample_standalone.html?id=${row.id}`, '_blank')
}

const handleCommand = (cmd) => ElMessage.success('操作指令成功')
const upgradeToPro = (row) => { row.package = 'pro'; ElMessage.success('成功激活商业版') }
const deleteReport = (row) => { reportsData.value = reportsData.value.filter(r => r.id !== row.id) }

const modelBiasChartRef = ref(null)
const initECharts = () => {
  if (!modelBiasChartRef.value) return
  const inst = echarts.init(modelBiasChartRef.value)
  inst.setOption({ radar: { indicator: [{name:'可见度',max:100}] }, series: [{type:'radar',data:[[80]]}] })
}
const handlePrint = () => window.print()
</script>

<style scoped>
.report-list-container { padding: 4px 0; }
.page-title { margin: 0 0 8px; font-size: 22px; color: #303133; font-weight: 600; }
.page-subtitle { margin: 0; color: #909399; font-size: 14px; }
.mb-20 { margin-bottom: 20px; }
.mb-24 { margin-bottom: 24px; }
.mt-20 { margin-top: 20px; }
.table-card { border: none; border-radius: 8px; background: #fff; }
.filter-bar { display: flex; justify-content: space-between; align-items: center; }
.cursor-pointer { cursor: pointer; }
.survey-link { font-weight: 500; font-size: 13px; }
.mono { font-family: monospace; font-size: 13px; }
.text-placeholder { color: #c0c4cc; font-style: italic; }

/* 🌟 问卷详情专属排版更新 */
.survey-detail-body { padding: 0 12px; }
.survey-sec-title { font-size: 14px; font-weight: bold; color: #303133; margin: 0 0 12px 0; padding-left: 8px; border-left: 3px solid #2b65f0; }
.goal-highlight-box { line-height: 1.6; color: #303133; font-weight: bold; background: #f5f7fa; padding: 10px 14px; border-radius: 6px; border: 1px dashed #c0c4cc; }

/* 研报全屏 Dialog */
:deep(.report-fullscreen-dialog .el-dialog__header) { padding: 0; margin: 0; }
:deep(.report-fullscreen-dialog .el-dialog__body) { padding: 0; height: 100vh; display: flex; flex-direction: column; background: #f5f7fa; overflow: hidden; }

.report-view-header { display: flex; justify-content: space-between; align-items: center; padding: 0 24px; height: 60px; background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,0.05); z-index: 10; flex-shrink: 0; }
.report-head-title { font-size: 15px; font-weight: bold; color: #303133; }
.report-paper-wrapper { flex: 1; overflow-y: auto; padding: 32px 0; display: flex; justify-content: center; }
.report-paper-body { width: 900px; background: #ffffff; border: 1px solid #d9e0ea; border-radius: 8px; box-shadow: 0 12px 32px rgba(26,36,55,0.08); overflow: hidden; height: fit-content; }
.report-cover-banner { display: flex; justify-content: space-between; gap: 24px; padding: 28px; color: #ffffff; background: linear-gradient(135deg, #10243b 0%, #1a4269 60%, #c67b38 100%); }
.report-cover-banner h2 { margin: 0 0 6px 0; font-size: 24px; font-weight: 800; color: #fff; }
.report-cover-banner p { margin: 0; color: rgba(255,255,255,0.85); font-size: 13px; }
.c-right { font-size: 11px; text-align: right; line-height: 1.7; color: rgba(255,255,255,0.7); }
.report-padding-content { padding: 26px; }
</style>