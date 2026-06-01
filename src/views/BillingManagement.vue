<template>
  <div class="page-container">
    <div class="page-header">
      <div class="header-info">
        <h2>大模型费用管理</h2>
        <p class="subtitle">管理大模型的充值、消耗情况，精准区分付费流量与活动赠送流量</p>
      </div>
      <div class="header-ops">
        <el-button type="warning" size="default" plain @click="openGrantDialog(null)">+ 赠送额度录入</el-button>
        <el-button type="primary" size="default" @click="openRechargeDialog(null)">+ 线下充值录入</el-button>
      </div>
    </div>

    <el-card shadow="never" class="filter-card">
      <div class="filter-wrapper">
        <div class="filter-left">
          <el-popover
            placement="bottom-start"
            :width="280"
            trigger="click"
            popper-style="padding: 12px 0;"
          >
            <template #reference>
              <div class="custom-date-trigger">
                <el-icon class="icon-cal"><Calendar /></el-icon>
                <span class="date-text">{{ dateLabel }}</span>
                <el-icon class="icon-arrow"><ArrowDown /></el-icon>
              </div>
            </template>
            
            <div class="custom-date-panel">
              <ul class="date-shortcuts">
                <li :class="{ active: dateLabel === '最近7天' }" @click="selectDateShortcut('最近7天')">最近7天</li>
                <li :class="{ active: dateLabel === '最近30天' }" @click="selectDateShortcut('最近30天')">最近30天</li>
                <li :class="{ active: dateLabel === '最近90天' }" @click="selectDateShortcut('最近90天')">最近90天</li>
              </ul>
              <div class="date-mode-toggle">
                <div class="toggle-track">
                  <div class="toggle-btn" :class="{ active: dateMode === 'range' }" @click="dateMode = 'range'">时间段</div>
                  <div class="toggle-btn" :class="{ active: dateMode === 'date' }" @click="dateMode = 'date'">日期</div>
                </div>
              </div>
              <div class="mini-calendar-wrapper">
                <el-calendar v-model="customDateVal">
                  <template #date-cell="{ data }">
                    <span>{{ parseInt(data.day.split('-')[2]) }}</span>
                  </template>
                </el-calendar>
              </div>
            </div>
          </el-popover>
        </div>
        
        <div class="filter-right">
          <el-select v-model="filterSource" placeholder="全部通道" style="width: 140px" clearable @change="handleFilterChange">
            <el-option label="官方API" value="官方API" />
            <el-option label="新零售平台" value="新零售平台" />
            <el-option label="模力平台" value="模力平台" />
          </el-select>
        </div>
      </div>
    </el-card>

    <el-row :gutter="20" class="analysis-row">
      <el-col :span="16">
        <el-card shadow="never">
          <template #header>
            <div class="card-title-inline">
              <span>近期算力消耗走势 (按Token/自动化流水划分)</span>
              <el-tag size="small" type="primary" effect="plain">核算单位：元 (¥)</el-tag>
            </div>
          </template>
          <div class="chart-container">
            <div ref="costTrendChartRef" style="width: 100%; height: 240px;"></div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never" header="平台资金池状态">
          <div class="kpi-grid">
            <div class="kpi-item">
              <div class="kpi-label">平台总付费余额</div>
              <div class="kpi-value text-primary">¥ 128,400.00</div>
            </div>
            <div class="kpi-item">
              <div class="kpi-label">赠送未消费额度</div>
              <div class="kpi-value text-warning">¥ 15,200.00</div>
            </div>
            <div class="kpi-item">
              <div class="kpi-label">今日预估总消费</div>
              <div class="kpi-value">¥ 3,420.50</div>
            </div>
            <div class="kpi-item">
              <div class="kpi-label">余额预警账户数</div>
              <div class="kpi-value text-danger">2 个</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never" class="tabs-card">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="资金操作审计" name="recharge">
          <el-table :data="rechargeHistory" style="width: 100%">
            <el-table-column prop="orderId" label="流水单号" width="200" />
            <el-table-column prop="tenant" label="大模型账户" min-width="150" />
            <el-table-column label="入账金额" align="right" width="150">
              <template #default="{ row }">
                <span :class="row.type === '充值' ? 'text-success' : 'text-warning'" style="font-weight: bold;">
                  + ¥ {{ row.amount }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="变动类型" align="center" width="120">
              <template #default="{ row }">
                <el-tag :type="row.type === '充值' ? 'success' : 'warning'" effect="light" size="small">
                  {{ row.type }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="method" label="方式/事由" align="center" />
            <el-table-column prop="operator" label="操作员" align="center" width="100" />
            <el-table-column prop="time" label="操作时间" width="160" />
            <el-table-column label="操作" width="100" align="center" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="openAuditDetails(row)">详情</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="消费流水与审计明细" name="consumption">
          <div class="tab-tip">当前筛选条件共产生 <strong>{{ filteredConsumptionLogs.length }}</strong> 条消费审计记录</div>
          <el-table :data="filteredConsumptionLogs" style="width: 100%" stripe>
            <el-table-column type="index" label="No." width="60" align="center" />
            <el-table-column prop="time" label="消费时间" width="160" />
            <el-table-column prop="tenant" label="大模型账户" min-width="150" />
            <el-table-column prop="target" label="消费项目 (GEO 任务)" min-width="180" />
            <el-table-column label="调用模型 / 底层渠道" width="180">
              <template #default="{ row }">
                <div class="text-bold">{{ row.model }}</div>
                <div class="text-sub">{{ row.channel }}</div>
              </template>
            </el-table-column>
            <el-table-column prop="tokens" label="消耗 Tokens" align="right" width="120">
              <template #default="{ row }">
                <span style="font-family: monospace">{{ row.tokens }}</span>
              </template>
            </el-table-column>
            <el-table-column label="资金性质" align="center" width="100">
              <template #default="{ row }">
                <el-tag size="small" :type="row.fundType === '赠送' ? 'warning' : 'primary'" effect="plain">
                  {{ row.fundType }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="扣费金额" align="right" width="120">
              <template #default="{ row }">
                <span :class="row.fundType === '赠送' ? 'text-warning' : 'text-orange'">- ¥ {{ row.amount }}</span>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

      </el-tabs>
    </el-card>

    <el-dialog v-model="rechargeVisible" :title="selectedAccount ? `大模型账户充值 - ${selectedAccount.accountName}` : '线下充值录入'" width="500px" destroy-on-close>
      <el-form :model="rechargeForm" label-width="100px" label-position="left">
        <el-form-item label="充值账户" v-if="!selectedAccount" required>
          <el-select v-model="rechargeForm.accountName" placeholder="请选择大模型账户" style="width: 100%">
            <el-option v-for="account in modelAccounts" :key="account.accountName" :label="account.accountName" :value="account.accountName" />
          </el-select>
        </el-form-item>
        <el-form-item label="充值金额" required>
          <el-input-number v-model="rechargeForm.amount" :min="1" :step="500" style="width: 100%" />
        </el-form-item>
        <el-form-item label="充值渠道" required>
          <el-radio-group v-model="rechargeForm.method">
            <el-radio label="微信充值">微信支付</el-radio>
            <el-radio label="对公转账">对公转账</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="转账凭证号" v-if="rechargeForm.method === '对公转账'">
          <el-input v-model="rechargeForm.proof" placeholder="请输入银行流水号或打款附言代码" />
        </el-form-item>
        <el-form-item label="财务备注">
          <el-input v-model="rechargeForm.notice" type="textarea" placeholder="记录本次充值事由..." />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rechargeVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmRecharge">确认资金入账</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="grantVisible" :title="selectedAccount ? `赠送额度 - ${selectedAccount.accountName}` : '全平台额度赠送'" width="480px" destroy-on-close>
      <el-form :model="grantForm" label-width="100px" label-position="left">
        <el-form-item label="获赠账户" v-if="!selectedAccount" required>
          <el-select v-model="grantForm.accountName" placeholder="请选择大模型账户" style="width: 100%">
            <el-option v-for="account in modelAccounts" :key="account.accountName" :label="account.accountName" :value="account.accountName" />
          </el-select>
        </el-form-item>
        <el-form-item label="赠送金额" required>
          <el-input-number v-model="grantForm.amount" :min="1" :step="100" style="width: 100%" />
        </el-form-item>
        <el-form-item label="赠送类型" required>
          <el-select v-model="grantForm.type" style="width: 100%">
            <el-option label="新账户体验赠送" value="trial" />
            <el-option label="接口故障补偿" value="comp" />
            <el-option label="市场营销活动" value="marketing" />
          </el-select>
        </el-form-item>
        <el-form-item label="有效期至">
          <el-date-picker v-model="grantForm.expire" type="date" placeholder="留空则永久有效" style="width: 100%" />
        </el-form-item>
        <el-form-item label="操作说明">
          <el-input v-model="grantForm.notice" type="textarea" placeholder="请记录本次赠送的具体原因，以便审计" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="grantVisible = false">取消</el-button>
        <el-button type="warning" @click="confirmGrant">确认下发额度</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="auditDrawerVisible" title="资金操作流水审计详情" size="560px" destroy-on-close>
      <div v-if="selectedAuditRow" class="audit-drawer-content">
        <div class="detail-money-banner" :class="selectedAuditRow.type === '充值' ? 'bg-success' : 'bg-warning'">
          <div class="m-label">{{ selectedAuditRow.type }}凭证金额</div>
          <div class="m-value">
            <span class="symbol">+</span>
            <span class="currency">¥</span>
            <span class="num">{{ parseFloat(selectedAuditRow.amount).toFixed(2) }}</span>
          </div>
          <div class="m-status"><el-tag size="small" type="success" effect="dark">入账成功 / 已核验</el-tag></div>
        </div>
        <h4 class="section-title">核心记账凭证</h4>
        <el-descriptions :column="1" border size="small" class="audit-descriptions">
          <el-descriptions-item label="全局流水单号"><span class="mono-text">{{ selectedAuditRow.orderId }}</span></el-descriptions-item>
          <el-descriptions-item label="大模型账户"><strong>{{ selectedAuditRow.tenant }}</strong></el-descriptions-item>
          <el-descriptions-item label="资金变动性质"><el-tag size="small" :type="selectedAuditRow.type === '充值' ? 'success' : 'warning'">{{ selectedAuditRow.type }}账户</el-tag></el-descriptions-item>
          <el-descriptions-item label="结算核销时间">{{ selectedAuditRow.time }}</el-descriptions-item>
          <el-descriptions-item label="后台经办操作员"><span class="operator-tag">{{ selectedAuditRow.operator }}</span></el-descriptions-item>
        </el-descriptions>
        <h4 class="section-title">核销与数据资产关联</h4>
        <el-descriptions :column="1" border size="small" class="audit-descriptions">
          <el-descriptions-item label="充值/下发方式"><span class="text-bold">{{ selectedAuditRow.method }}</span></el-descriptions-item>
          <el-descriptions-item label="三方流水号 / 凭证码"><span class="mono-text">{{ selectedAuditRow.proofNo || 'N/A（内部划转审计）' }}</span></el-descriptions-item>
        </el-descriptions>
        <h4 class="section-title">财务备注说明</h4>
        <div class="audit-remark-box"><p class="remark-text">{{ selectedAuditRow.notice || '该笔操作暂无补充备注说明。' }}</p></div>
      </div>
    </el-drawer>

  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { Calendar, ArrowDown } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts' // 🌟 引入核心图表库

// --- 日期控制中心状态 ---
const dateLabel = ref('最近7天')
const dateMode = ref('range')
const customDateVal = ref(new Date())

const selectDateShortcut = (label) => {
  dateLabel.value = label
  ElMessage.success(`时间范围已切换为：${label}`)
}

// --- 表格高级筛选状态 ---
const filterSource = ref('')
const activeTab = ref('recharge')
const rechargeVisible = ref(false)
const grantVisible = ref(false)
const selectedAccount = ref(null)

// 抽屉状态
const auditDrawerVisible = ref(false)
const selectedAuditRow = ref(null)

// 🌟 ECharts 响应式挂载点与实例
const costTrendChartRef = ref(null)
let costTrendChartInstance = null

const openAuditDetails = (row) => {
  selectedAuditRow.value = row
  auditDrawerVisible.value = true
}

// --- 原始数据集 ---
const modelAccounts = ref([
  { accountName: 'DeepSeek 官方API账户' },
  { accountName: 'Kimi Moonshot账户' },
  { accountName: '豆包 Doubao-pro账户' },
  { accountName: '通义千问 Qwen-max账户' }
])

const consumptionLogs = ref([
  { time: '2026-05-15 10:20:12', tenant: '谷雨GEO科技有限公司', target: '汉庭SEO核心词诊断', model: 'DeepSeek-V3', channel: '官方API', tokens: '45,000', fundType: '赠送', amount: '4.50' },
  { time: '2026-05-15 09:15:33', tenant: '汉庭南京店-营销部', target: '小红书品牌声量生成', model: 'Kimi (Moonshot-v1)', channel: '官方API', tokens: '12,500', fundType: '付费', amount: '1.25' },
  { time: '2026-05-14 22:40:01', tenant: '谷雨GEO科技有限公司', target: '全量关键词回采清洗', model: '豆包 Doubao-pro', channel: '新零售平台', tokens: '120,000', fundType: '付费', amount: '9.60' },
  { time: '2026-05-14 18:10:45', tenant: '创新科技实验组', target: '行业报告数据抽取', model: '通义千问 Qwen-max', channel: '模力平台', tokens: '35,000', fundType: '付费', amount: '3.50' }
])

const rechargeHistory = ref([
  { orderId: 'WX_83729104', tenant: '谷雨GEO科技有限公司', amount: '5000.00', type: '充值', method: '微信充值', operator: 'Admin', time: '2026-05-15 10:00', proofNo: 'WXPAY_202605159012941', notice: '企业用户自主扫码充值入账。' },
  { orderId: 'GIFT_2991023', tenant: '汉庭南京店-营销部', amount: '500.00', type: '赠送', method: '新客体验', operator: 'Admin', time: '2026-05-14 16:30', proofNo: 'SYS_GRANT_MKT_09A', notice: '下发新客体验额度。' },
  { orderId: 'BANK_9928311', tenant: '创新科技实验组', amount: '2000.00', type: '充值', method: '对公转账', operator: 'System', time: '2026-05-14 15:20', proofNo: 'CCB_991028340192', notice: '线下对公回单手工平账。' }
])

// 🌟 核心升级：消费流水与审计明细的多维过滤联动
const filteredConsumptionLogs = computed(() => {
  return consumptionLogs.value.filter(log => {
    const matchSource = !filterSource.value || log.channel === filterSource.value
    return matchSource
  })
})

// --- 图表初始化中心 ---
const initTrendChart = () => {
  if (!costTrendChartRef.value) return
  costTrendChartInstance = echarts.init(costTrendChartRef.value)
  costTrendChartInstance.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { bottom: 0, icon: 'circle', data: ['官方API', '模力平台', '新零售平台'] },
    grid: { left: '4%', right: '4%', bottom: '12%', top: '8%', containLabel: true },
    xAxis: { type: 'category', data: ['05-11', '05-12', '05-13', '05-14', '05-15', '05-16', '05-17'] },
    yAxis: { type: 'value', axisLabel: { formatter: '¥{value}' } },
    series: [
      { name: '官方API', type: 'bar', stack: 'total', color: '#2b65f0', data: [120, 145, 188, 240, 152, 210, 185] },
      { name: '模力平台', type: 'bar', stack: 'total', color: '#e6a23c', data: [45, 60, 58, 30, 85, 40, 55] },
      { name: '新零售平台', type: 'bar', stack: 'total', color: '#909399', data: [15, 30, 22, 45, 12, 28, 20] }
    ]
  })
}

const handleFilterChange = () => {
  // 模拟当筛选器改变时，图表动态抖动刷新效果
  if (costTrendChartInstance) {
    costTrendChartInstance.showLoading({ text: '智能审计核算中...', color: '#2b65f0' })
    setTimeout(() => {
      costTrendChartInstance.hideLoading()
    }, 400)
  }
}

const handleResize = () => { costTrendChartInstance?.resize() }

onMounted(() => {
  initTrendChart()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  costTrendChartInstance?.dispose()
})

// --- 表单交互核心 ---
const rechargeForm = reactive({ accountName: '', amount: 1000, method: '微信充值', proof: '', notice: '' })
const grantForm = reactive({ accountName: '', amount: 100, type: 'trial', expire: '', notice: '' })

const openRechargeDialog = (account) => {
  selectedAccount.value = account
  rechargeForm.accountName = account ? account.accountName : ''
  rechargeForm.amount = 1000
  rechargeVisible.value = true
}
const confirmRecharge = () => { ElMessage.success('资金录入成功'); rechargeVisible.value = false }

const openGrantDialog = (account) => {
  selectedAccount.value = account
  grantForm.accountName = account ? account.accountName : ''
  grantForm.amount = 100
  grantVisible.value = true
}
const confirmGrant = () => { ElMessage.success('赠送额度下发成功'); grantVisible.value = false }
</script>

<style scoped>
.page-container { padding: 24px; background-color: #f5f7fa; min-height: 100vh; }
.page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; }
.header-info h2 { margin: 0; font-size: 22px; color: #303133; font-weight: 600; }
.subtitle { margin: 6px 0 0; color: #909399; font-size: 14px; }

/* 筛选卡片 */
.custom-date-trigger {
  display: flex; align-items: center; padding: 6px 12px; border: 1px solid #dcdfe6;
  border-radius: 4px; background: #fff; cursor: pointer; transition: all 0.2s; height: 32px; box-sizing: border-box;
}
.custom-date-trigger:hover { border-color: #c0c4cc; }
.custom-date-trigger .icon-cal { font-size: 15px; color: #606266; }
.custom-date-trigger .date-text { margin: 0 10px; font-size: 14px; color: #303133; }
.custom-date-trigger .icon-arrow { font-size: 12px; color: #909399; margin-left: auto; }

.date-shortcuts { list-style: none; padding: 0 12px 10px; margin: 0 0 12px 0; border-bottom: 1px solid #ebeef5; }
.date-shortcuts li { padding: 8px 12px; border-radius: 4px; color: #303133; font-size: 14px; cursor: pointer; margin-bottom: 2px; transition: background 0.2s; }
.date-shortcuts li:hover { background-color: #f5f7fa; }
.date-shortcuts li.active { background-color: #f4f6f8; font-weight: bold; }
.date-mode-toggle { padding: 0 16px 12px; }
.toggle-track { display: flex; background: #f4f4f5; border-radius: 6px; padding: 3px; }
.toggle-btn { flex: 1; text-align: center; padding: 6px 0; font-size: 13px; cursor: pointer; border-radius: 4px; color: #606266; transition: all 0.2s; }
.toggle-btn.active { background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.1); color: #303133; font-weight: 500; }
.mini-calendar-wrapper { padding: 0 8px; }
:deep(.mini-calendar-wrapper .el-calendar__header) { padding: 4px 8px; border-bottom: none; }
:deep(.mini-calendar-wrapper .el-calendar__title) { font-size: 14px; }
:deep(.mini-calendar-wrapper .el-calendar__body) { padding: 0 8px 8px; }
:deep(.mini-calendar-wrapper .el-calendar-table thead th) { padding: 4px 0; font-size: 13px; font-weight: normal; color: #909399; }
:deep(.mini-calendar-wrapper .el-calendar-table .el-calendar-day) { height: 32px; padding: 0; display: flex; align-items: center; justify-content: center; }
:deep(.mini-calendar-wrapper .el-calendar-table td) { border: none; }
:deep(.mini-calendar-wrapper .el-calendar-table td.is-selected .el-calendar-day) { background-color: #f4f4f5; border-radius: 50%; color: #303133; width: 32px; margin: 0 auto; }

.filter-card { margin-bottom: 20px; border: none; border-radius: 8px; }
:deep(.filter-card .el-card__body) { padding: 16px 20px; }
.filter-wrapper { display: flex; justify-content: space-between; align-items: center; }
.filter-left, .filter-right { display: flex; align-items: center; }

/* 图表区结构调整 */
.card-title-inline { display: flex; justify-content: space-between; align-items: center; font-weight: bold; font-size: 14px; color: #303133; }
.analysis-row { margin-bottom: 24px; }
.chart-container { height: 240px; }

.kpi-grid { display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 16px; height: 240px; }
.kpi-item { background: #fcfcfc; border: 1px solid #f0f2f5; border-radius: 8px; display: flex; flex-direction: column; justify-content: center; align-items: center; }
.kpi-label { font-size: 13px; color: #909399; margin-bottom: 8px; }
.kpi-value { font-size: 22px; font-weight: bold; color: #303133; }

.tabs-card { border: none; border-radius: 8px; }
.tab-tip { font-size: 13px; color: #606266; margin-bottom: 16px; background: #f4f4f5; padding: 8px 12px; border-radius: 4px; }

.tenant-detail-link { font-weight: bold; font-size: 14px; }
.text-danger { color: #f56c6c; font-weight: bold; }
.text-success { color: #67c23a; font-weight: bold; }
.text-warning { color: #e6a23c; font-weight: bold; }
.text-orange { color: #f39c12; font-weight: bold; }
.text-primary { color: #2b65f0; font-weight: bold; }
.text-bold { font-weight: bold; color: #303133; }
.text-sub { font-size: 12px; color: #909399; margin-top: 2px; }
:deep(.el-tabs__item) { height: 50px; font-size: 15px; }

/* 详情抽屉公共样式 */
.audit-drawer-content { padding: 0 4px; }
.detail-money-banner { border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 24px; }
.detail-money-banner.bg-success { background: linear-gradient(135deg, #f0f9eb 0%, #e1f3d8 100%); border: 1px solid #c2e7b0; }
.detail-money-banner.bg-success .num, .detail-money-banner.bg-success .symbol, .detail-money-banner.bg-success .currency { color: #67c23a; }
.detail-money-banner.bg-warning { background: linear-gradient(135deg, #fdf6ec 0%, #faecd8 100%); border: 1px solid #f5dab1; }
.detail-money-banner.bg-warning .num, .detail-money-banner.bg-warning .symbol, .detail-money-banner.bg-warning .currency { color: #e6a23c; }
.m-label { font-size: 13px; color: #606266; margin-bottom: 6px; font-weight: 500; }
.m-value { display: flex; justify-content: center; align-items: baseline; margin-bottom: 6px; }
.m-value .symbol { font-size: 20px; font-weight: bold; margin-right: 4px; }
.m-value .currency { font-size: 16px; font-weight: bold; margin-right: 2px; }
.m-value .num { font-size: 32px; font-weight: bold; font-family: monospace; }
.section-title { font-size: 14px; color: #303133; margin: 24px 0 12px 0; padding-left: 8px; border-left: 3px solid #2b65f0; font-weight: 600; }
.audit-descriptions { margin-bottom: 16px; }
.mono-text { font-family: monospace; font-weight: 500; color: #4a4a4a; font-size: 13px; }
.operator-tag { background: #f4f4f5; color: #909399; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
.audit-remark-box { background: #f8f9fa; border: 1px solid #e4e7ed; border-radius: 6px; padding: 14px; }
.remark-text { margin: 0; color: #606266; line-height: 1.6; font-size: 13px; }

/* 资产透视全景镜像布局 */
.client-billing-mirror { padding: 4px 8px; }
.mirror-asset-row { margin-bottom: 28px; }
.mirror-card { background: #fff; border: 1px solid #e4e7ed; border-radius: 8px; padding: 16px; transition: all 0.2s; }
.mirror-card:hover { border-color: #2b65f0; }
.m-meta { display: flex; justify-content: space-between; align-items: center; color: #909399; font-size: 12px; }
.m-val { margin: 12px 0 8px 0; display: flex; align-items: baseline; }
.m-val .c { font-size: 16px; font-weight: bold; color: #303133; margin-right: 2px; }
.m-val .n { font-size: 26px; font-weight: bold; color: #303133; font-family: monospace; line-height: 1; }
.m-val .u { font-size: 13px; font-weight: bold; margin-left: 2px; }
.m-foot { font-size: 11px; color: #c0c4cc; }

.bg-blue-light { background: linear-gradient(135deg, #ffffff 0%, #f0v5ff 100%); border-color: #d1e3ff; }
.bg-blue-light .n, .bg-blue-light .c { color: #2b65f0; }
.bg-green-light { background: linear-gradient(135deg, #ffffff 0%, #f0f9eb 100%); border-color: #e1f3d8; }
.bg-green-light .n, .bg-green-light .c { color: #67c23a; }

.mirror-section-header { display: flex; justify-content: space-between; align-items: center; margin-top: 16px; padding-bottom: 8px; border-bottom: 1px dashed #e4e7ed; }
.m-sec-title { font-size: 14px; font-weight: bold; color: #303133; }
.text-bold-s { font-weight: bold; font-size: 13px; color: #303133; }
.text-sub-s { font-size: 11px; color: #909399; margin-top: 1px; }
.mt-12 { margin-top: 12px; }
</style>
