<template>
  <div class="billing-container">
    <div class="page-header">
      <div class="header-info">
        <h2>资产与额度中心</h2>
        <p class="subtitle">实时掌控全网 GEO 诊断算力消耗，支持自主充值与精细化账单审计</p>
      </div>
      <div class="header-ops">
        <el-button type="warning" plain><el-icon><Document /></el-icon> 申请开具发票</el-button>
      </div>
    </div>

    <el-row :gutter="20" class="asset-row">
      <el-col :span="6">
        <el-card shadow="never" class="asset-card active-balance">
          <div class="asset-meta">
            <span class="label">充值可用余额 (本金)</span>
            <el-icon class="asset-icon"><Wallet /></el-icon>
          </div>
          <div class="asset-value">
            <span class="currency">¥</span>
            <span class="num">8,420.00</span>
          </div>
          <div class="asset-footer">永久有效</div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card shadow="never" class="asset-card grant-balance">
          <div class="asset-meta">
            <span class="label">平台赠送额度 (体验金)</span>
            <el-icon class="asset-icon"><Present /></el-icon> </div>
          <div class="asset-value">
            <span class="currency">¥</span>
            <span class="num">4,030.00</span>
          </div>
          <div class="asset-footer">有效期至：2026-12-31</div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card shadow="never" class="asset-card">
          <div class="asset-meta">
            <span class="label">本月累计消耗 Tokens</span>
            <el-icon class="asset-icon"><Cpu /></el-icon>
          </div>
          <div class="asset-value">
            <span class="num text-blue">4.82</span>
            <span class="unit">M</span>
          </div>
          <div class="asset-footer">约合 4,820,000 次模型交互</div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card shadow="never" class="asset-card">
          <div class="asset-meta">
            <span class="label">今日预估消耗金额</span>
            <el-icon class="asset-icon"><PieChart /></el-icon>
          </div>
          <div class="asset-value">
            <span class="currency">¥</span>
            <span class="num text-orange">45.50</span>
          </div>
          <div class="asset-footer">包含实时监测与自动重试</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="middle-row">
      <el-col :span="16">
        <el-card shadow="never" class="trend-card">
          <template #header>
            <div class="card-title">近期算力消耗走势 (按Token/自动化流水划分)</div>
          </template>
          <div ref="costTrendRef" class="echarts-box"></div>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card shadow="never" class="recharge-card">
          <template #header>
            <div class="card-title">企业账户自主充值</div>
          </template>
          
          <div class="package-grid">
            <div 
              v-for="pkg in rechargePackages" 
              :key="pkg.amount" 
              class="package-item"
              :class="{ 'is-selected': selectedPackage === pkg.amount }"
              @click="selectedPackage = pkg.amount"
            >
              <div class="p-amount">¥{{ pkg.amount }}</div>
              <div class="p-bonus" v-if="pkg.bonus">送 ¥{{ pkg.bonus }}</div>
            </div>
          </div>

          <div class="custom-amount-input">
            <el-input-number 
              v-model="customAmount" 
              :min="100" 
              :max="100000" 
              placeholder="自定义充值金额(最低100)" 
              style="width: 100%"
              @focus="selectedPackage = null"
            />
          </div>

          <div class="pay-actions">
            <el-button type="primary" size="large" class="w-100" @click="handleRecharge">
              立即获取充值付款码
            </el-button>
          </div>
          <p class="pay-tip">支持微信、支付宝及企业网银对公转账</p>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never" class="table-card">
      <template #header>
        <div class="table-header-bar">
          <span class="card-title">消费流水与审计明细</span>
          <div class="table-filters">
            <el-select v-model="filterSource" placeholder="算力通道来源" clearable size="small" style="width: 150px; margin-right: 12px;">
              <el-option label="官方API" value="官方API" />
              <el-option label="New Retail Platform" value="新零售平台" />
              <el-option label="Moli Platform" value="模力平台" />
            </el-select>
            <el-date-picker
              v-model="filterDate"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              size="small"
              style="width: 240px"
            />
          </div>
        </div>
      </template>

      <el-table :data="billLog" style="width: 100%" stripe>
        <el-table-column prop="time" label="结算时间" width="160" />
        <el-table-column prop="taskName" label="关联诊断任务" min-width="180" show-overflow-tooltip />
        
        <el-table-column label="消耗类型" width="130">
          <template #default="{ row }">
            <el-tag size="small" :type="row.type === '大模型API' ? 'primary' : 'warning'">
              {{ row.type }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="target" label="核算目标" width="130" />
        
        <el-table-column label="算力通道" width="130">
          <template #default="{ row }">
            <span class="source-text">{{ row.source }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="tokens" label="消耗Tokens" width="120" align="right">
          <template #default="{ row }">
            <span class="token-num">{{ row.tokens.toLocaleString() }}</span>
          </template>
        </el-table-column>

        <el-table-column label="实扣金额" width="120" align="right">
          <template #default="{ row }">
            <span class="cost-num">¥{{ row.cost.toFixed(2) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="扣费账户" width="110" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="row.wallet === '本金' ? 'success' : 'info'" effect="plain">
              {{ row.wallet }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
// 🌟 这里的 Gift 已经修正为了 Present
import { Wallet, Present, Cpu, PieChart, Document } from '@element-plus/icons-vue'

const costTrendRef = ref(null)
let costTrendChart = null

const selectedPackage = ref(1000)
const customAmount = ref(null)
const filterSource = ref('')
const filterDate = ref('')

const rechargePackages = [
  { amount: 500, bonus: 0 },
  { amount: 1000, bonus: 100 },
  { amount: 3000, bonus: 400 },
  { amount: 5000, bonus: 800 }
]

const billLog = ref([
  { time: '2026-05-16 09:12:04', taskName: '全网连锁酒店可见度日更回查', type: '大模型API', target: 'DeepSeek-V3', source: '官方API', tokens: 145000, cost: 14.50, wallet: '赠送额度' },
  { time: '2026-05-15 22:45:11', taskName: '小红书商圈种草心智快照捕获', type: '社媒AI问报', target: '小红书AI助手', source: '模力平台', tokens: 50000, cost: 5.00, wallet: '本金' },
  { time: '2026-05-15 14:20:55', taskName: '携程竞品评论情绪极性提炼', type: '大模型API', target: 'Kimi (v1)', source: '官方API', tokens: 82000, cost: 8.20, wallet: '赠送额度' },
  { time: '2026-05-14 11:05:30', taskName: '谷歌 AIO 跨境文旅收录频次扫描', type: '大模型API', target: 'Google AIO', source: '新零售平台', tokens: 120000, cost: 12.00, wallet: '本金' },
  { time: '2026-05-13 18:33:12', taskName: '知乎直答垂直场景精细化审计', type: '社媒AI问答', target: '知乎直答', source: '模力平台', tokens: 58000, cost: 5.80, wallet: '赠送额度' }
])

const initChart = () => {
  costTrendChart = echarts.init(costTrendRef.value)
  costTrendChart.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { bottom: 0, icon: 'circle' },
    grid: { left: '3%', right: '4%', bottom: '10%', containLabel: true },
    xAxis: { type: 'category', data: ['05-10', '05-11', '05-12', '05-13', '05-14', '05-15', '05-16'] },
    yAxis: { type: 'value', axisLabel: { formatter: '¥{value}' } },
    series: [
      { name: '官方API消耗', type: 'bar', stack: 'total', color: '#2b65f0', data: [32, 45, 28, 40, 52, 22, 14.5] },
      { name: '模力平台消耗', type: 'bar', stack: 'total', color: '#e6a23c', data: [15, 20, 18, 5.8, 12, 5, 0] },
      { name: '新零售平台消耗', type: 'bar', stack: 'total', color: '#909399', data: [0, 12, 0, 0, 12, 0, 0] }
    ]
  })
}

const handleRecharge = () => {
  const finalAmount = selectedPackage.value || customAmount.value
  if (!finalAmount) {
    ElMessage.warning('请选择或输入有效的充值金额')
    return
  }
  ElMessage.success(`充值收银台唤起成功：已生成 ¥${finalAmount} 预付订单`)
}

const handleResize = () => { costTrendChart?.resize() }

onMounted(() => {
  initChart()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  costTrendChart?.dispose()
})
</script>

<style scoped>
/* 保持原有样式不变 */
.billing-container { padding-bottom: 30px; }
.page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; }
.header-info h2 { margin: 0; font-size: 24px; color: #303133; font-weight: 600; }
.subtitle { margin: 6px 0 0; color: #909399; font-size: 14px; }
.asset-row { margin-bottom: 24px; }
.asset-card { border: none; border-radius: 8px; background: #fff; }
.asset-meta { display: flex; justify-content: space-between; align-items: center; color: #909399; font-size: 13px; }
.asset-icon { font-size: 18px; }
.asset-value { margin: 16px 0 12px 0; display: flex; align-items: baseline; }
.asset-value .currency { font-size: 18px; font-weight: bold; margin-right: 2px; color: #303133; }
.asset-value .num { font-size: 30px; font-weight: bold; color: #303133; line-height: 1; font-family: monospace; }
.asset-value .unit { font-size: 14px; margin-left: 2px; font-weight: bold; color: #303133; }
.asset-footer { font-size: 12px; color: #c0c4cc; }
.active-balance { background: linear-gradient(135deg, #ffffff 0%, #f0v5ff 100%); border: 1px solid #e8f0fe !important; }
.active-balance .num, .active-balance .currency { color: #2b65f0; }
.grant-balance .num, .grant-balance .currency { color: #67c23a; }
.text-blue { color: #2b65f0 !important; }
.text-orange { color: #e6a23c !important; }
.middle-row { margin-bottom: 24px; }
.trend-card, .recharge-card, .table-card { border: none; border-radius: 8px; background: #fff; }
.card-title { font-weight: bold; font-size: 15px; color: #303133; }
.echarts-box { height: 300px; width: 100%; }
.package-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 16px; }
.package-item { border: 1px solid #dcdfe6; border-radius: 6px; padding: 14px; text-align: center; cursor: pointer; transition: all 0.2s; }
.package-item:hover { border-color: #2b65f0; background: #fcfdfe; }
.package-item.is-selected { border-color: #2b65f0; background: #f0f5ff; }
.package-item .p-amount { font-size: 18px; font-weight: bold; color: #303133; }
.package-item.is-selected .p-amount { color: #2b65f0; }
.package-item .p-bonus { font-size: 11px; color: #67c23a; margin-top: 4px; font-weight: bold; }
.custom-amount-input { margin-bottom: 16px; }
.pay-actions { margin-bottom: 12px; }
.w-100 { width: 100%; }
.pay-tip { font-size: 11px; color: #909399; text-align: center; margin: 0; }
.table-header-bar { display: flex; justify-content: space-between; align-items: center; }
.table-filters { display: flex; align-items: center; }
.source-text { font-size: 13px; color: #4a4a4a; font-weight: 500; }
.token-num { font-family: monospace; color: #606266; font-weight: 500; }
.cost-num { font-family: monospace; font-weight: bold; color: #303133; }
</style>