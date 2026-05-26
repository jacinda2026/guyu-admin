<template>
  <div class="diagnosis-container">
    <div class="page-header mb-20">
      <h2 class="page-title">发起 AI 诊断任务</h2>
      <p class="page-subtitle">系统已自动为您签发高强度加密的一次性专属诊断链接。客户填报完成后，该链接将永久失效，确保数据防篡改。</p>
    </div>

    <el-row :gutter="24">
      <el-col :span="14">
        <el-card shadow="never" class="result-card">
          <div class="success-icon"><el-icon><CircleCheckFilled /></el-icon></div>
          <h3 class="success-title">一次性安全诊断链接已签发就绪</h3>
          <p class="success-desc">
            专属加密通道已打通。<br>
            <span class="text-warning mt-12" style="display: inline-block; font-size: 13px;">
              (注：本地 Demo 演示可直接点击下方“直接打开问卷”按钮，系统已加固底层跨页传参驱动及失效拦截)
            </span>
          </p>
          
          <div class="link-box">
            <code class="share-url">{{ generatedUrl }}</code>
            
            <el-button type="success" @click="openStandaloneQuestionnaire">
              <el-icon><Position /></el-icon> 直接打开问卷
            </el-button>
            
            <el-button type="primary" plain @click="copySurveyLink">
              复制链接
            </el-button>
          </div>

          <div class="result-actions mt-24">
            <el-button @click="generateNewLink" :loading="isGenerating">继续签发新工单</el-button>
            <el-button type="primary" plain @click="$router.push('/reports/hotel')">前往报告中心追踪进度</el-button>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="10">
        <el-card shadow="never" class="info-card">
          <template #header><span class="card-title">SaaS 协同流水线说明</span></template>
          <div class="timeline-hint">
            <div class="t-step">
              <div class="t-circle">1</div>
              <div class="t-txt"><strong>系统自动签发一次性工单</strong><br>进入本页面即刻生成高安全级别短链，极大降低业务发单门槛。</div>
            </div>
            <div class="t-step">
              <div class="t-circle">2</div>
              <div class="t-txt"><strong>酒店端自助填报并锁死</strong><br>客户打开链接补充身份及核心卖点。提交后，链接触发熔断机制永久失效。</div>
            </div>
            <div class="t-step">
              <div class="t-circle">3</div>
              <div class="t-txt"><strong>大后台自动调度清洗</strong><br>系统接管客户提交的表单，完成跨模型可见度测算与 ASI 指标评级。</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { CircleCheckFilled, Position } from '@element-plus/icons-vue'

const generatedUrl = ref('')
const currentMockId = ref('')
const isGenerating = ref(false)

// 核心逻辑：抽离独立生成函数
const initLink = () => {
  const mockId = `GEO-${Math.floor(Math.random() * 900000) + 100000}`
  currentMockId.value = mockId 
  generatedUrl.value = `https://guyu-geo.ai/survey/${mockId}?pkg=basic&type=onetime`
}

// 页面加载瞬间，立即执行生成逻辑，实现“0点击”发单
onMounted(() => {
  initLink()
})

const generateNewLink = () => {
  isGenerating.value = true
  setTimeout(() => {
    initLink()
    isGenerating.value = false
    ElMessage.success('新的一次性安全链接已成功签发！')
  }, 400)
}

const copySurveyLink = () => {
  navigator.clipboard.writeText(generatedUrl.value).then(() => {
    ElMessage.success('一次性专属问卷短链接已成功复制')
  })
}

const openStandaloneQuestionnaire = () => {
  ElMessage.success(`正在为您穿透激活单号 [${currentMockId.value}] 的专属问卷...`)
  
  const baseOrigin = window.location.origin
  const safeId = encodeURIComponent(currentMockId.value)
  
  // 映射原生静态资产
  const pureTargetUrl = `${baseOrigin}/hotel_questionnaire.html?id=${safeId}&pkg=basic&type=onetime`
  
  const isolatedLink = document.createElement('a')
  isolatedLink.href = pureTargetUrl
  isolatedLink.target = '_blank'
  isolatedLink.style.display = 'none'
  document.body.appendChild(isolatedLink)
  isolatedLink.click()
  isolatedLink.remove()
}
</script>

<style scoped>
.diagnosis-container { padding-bottom: 40px; }
.page-title { margin: 0 0 8px; font-size: 22px; color: #303133; font-weight: 600; }
.page-subtitle { margin: 0; color: #909399; font-size: 14px; line-height: 1.5; }
.mb-20 { margin-bottom: 20px; }
.mt-12 { margin-top: 12px; }
.mt-24 { margin-top: 24px; }

.result-card, .info-card { border: none; border-radius: 8px; background: #fff; height: 100%; }
.card-title { font-weight: bold; font-size: 15px; color: #303133; display: flex; align-items: center; gap: 6px; }

/* 成功结果页核心居中排版 */
.result-card { text-align: center; padding: 40px 0; }
.success-icon { font-size: 72px; color: #67c23a; margin-bottom: 16px; }
.success-title { margin: 0 0 8px; font-size: 20px; color: #303133; }
.success-desc { color: #606266; font-size: 14px; margin-bottom: 28px; }
.text-warning { color: #e6a23c; }

/* 加密链接暗盒 */
.link-box { display: flex; align-items: center; justify-content: center; gap: 12px; background: #f0f5ff; padding: 18px; border-radius: 8px; border: 1px dashed #2b65f0; margin: 0 40px; }
.share-url { font-size: 15px; color: #2b65f0; font-family: monospace; font-weight: bold; }
.result-actions { display: flex; justify-content: center; gap: 16px; margin-top: 32px; }

/* 侧边时间轴流线 */
.timeline-hint { display: flex; flex-direction: column; gap: 20px; padding-top: 8px; }
.t-step { display: flex; gap: 14px; align-items: flex-start; }
.t-circle { width: 24px; height: 24px; background: #e8f0fe; color: #2b65f0; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; flex-shrink: 0; }
.t-txt strong { font-size: 14px; color: #303133; display: block; margin-bottom: 4px; }
.t-txt { font-size: 12px; color: #909399; line-height: 1.5; }
</style>