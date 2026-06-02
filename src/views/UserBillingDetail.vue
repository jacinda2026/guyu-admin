<template>
  <section class="billing-detail-page">
    <div class="page-heading">
      <div>
        <p>{{ activeUser.email }} / {{ activeUser.tenant }}</p>
      </div>
      <el-tag :type="activeUser.status === '欠费' ? 'danger' : 'success'" effect="plain">{{ activeUser.status }}</el-tag>
    </div>

    <div class="summary-grid">
      <div class="summary-card">
        <span>当前余额</span>
        <strong :class="getBalanceClass(activeUser)">¥{{ formatMoney(activeUser.balance) }}</strong>
      </div>
      <div class="summary-card">
        <span>累计充值</span>
        <strong>¥{{ formatMoney(activeUser.totalRecharge) }}</strong>
      </div>
      <div class="summary-card">
        <span>累计消耗</span>
        <strong>¥{{ formatMoney(activeUser.totalConsume) }}</strong>
      </div>
      <div class="summary-card">
        <span>本月消耗</span>
        <strong>¥{{ formatMoney(activeUser.monthConsume) }}</strong>
      </div>
    </div>

    <el-card shadow="never" class="trend-card">
      <div class="trend-header">
        <div>
          <strong>每日费用消耗趋势</strong>
          <span>按当前用户的消耗流水统计每天的消耗费用</span>
        </div>
        <div class="trend-actions">
          <el-radio-group v-model="trendRangeType" size="small">
            <el-radio-button label="7d">最近7天</el-radio-button>
            <el-radio-button label="30d">最近30天</el-radio-button>
            <el-radio-button label="custom">指定时间段</el-radio-button>
          </el-radio-group>
          <template v-if="trendRangeType === 'custom'">
            <el-date-picker v-model="trendStartDate" type="date" value-format="YYYY-MM-DD" size="small" class="trend-date-picker" placeholder="开始时间" />
            <span class="date-separator">至</span>
            <el-date-picker v-model="trendEndDate" type="date" value-format="YYYY-MM-DD" size="small" class="trend-date-picker" placeholder="结束时间" />
          </template>
          <b>合计 ¥{{ formatMoney(currentConsumeTotal) }}</b>
        </div>
      </div>
      <div ref="consumeTrendRef" class="consume-trend-chart"></div>
    </el-card>

    <el-card shadow="never" class="panel-card">
      <el-tabs v-model="activeTab">
        <el-tab-pane :label="`费用详情记录（${currentConsumeDailyRows.length}天）`" name="fee">
          <el-table :data="currentConsumeDailyRows" class="billing-table compact-table" size="small" style="width: 100%" :header-cell-style="headerCellStyle">
            <el-table-column prop="date" label="日期" width="140" />
            <el-table-column prop="consumeCount" label="消耗笔数" width="100" align="right" />
            <el-table-column prop="amount" label="当日消耗费用" width="140" align="right">
              <template #default="{ row }">¥{{ formatMoney(row.amount) }}</template>
            </el-table-column>
            <el-table-column prop="projects" label="关联项目" min-width="180" show-overflow-tooltip />
            <el-table-column prop="models" label="调用模型" min-width="160" show-overflow-tooltip />
            <el-table-column prop="taskIds" label="关联任务ID" min-width="180" show-overflow-tooltip />
          </el-table>
        </el-tab-pane>

        <el-tab-pane :label="`充值记录（${currentRechargeRecords.length}条）`" name="recharge">
          <el-table :data="currentRechargeRecords" class="billing-table compact-table" size="small" style="width: 100%" :header-cell-style="headerCellStyle">
            <el-table-column prop="time" label="充值时间" width="150" show-overflow-tooltip />
            <el-table-column prop="amount" label="充值金额" width="110" align="right">
              <template #default="{ row }">¥{{ formatMoney(row.amount) }}</template>
            </el-table-column>
            <el-table-column prop="method" label="充值方式" width="110" show-overflow-tooltip />
            <el-table-column prop="before" label="充值前余额" width="115" align="right">
              <template #default="{ row }">¥{{ formatMoney(row.before) }}</template>
            </el-table-column>
            <el-table-column prop="after" label="充值后余额" width="115" align="right">
              <template #default="{ row }">¥{{ formatMoney(row.after) }}</template>
            </el-table-column>
            <el-table-column prop="operator" label="操作人" width="90" show-overflow-tooltip />
            <el-table-column prop="reason" label="充值原因" min-width="220" show-overflow-tooltip />
            <el-table-column label="状态" width="74" align="center">
              <template #default="{ row }">
                <el-tag effect="plain" type="success" size="small">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="74" align="center" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="openRecordDetail(row, 'recharge')">详情</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane :label="`消耗记录（${currentConsumeRecords.length}条）`" name="consume">
          <el-table :data="currentConsumeRecords" class="billing-table compact-table" size="small" style="width: 100%" :header-cell-style="headerCellStyle">
            <el-table-column prop="time" label="消耗时间" width="150" show-overflow-tooltip />
            <el-table-column prop="type" label="消耗类型" width="110" show-overflow-tooltip />
            <el-table-column prop="project" label="关联项目" min-width="130" show-overflow-tooltip />
            <el-table-column prop="taskId" label="关联任务ID" width="120" show-overflow-tooltip />
            <el-table-column prop="model" label="模型名称" width="95" show-overflow-tooltip />
            <el-table-column prop="quantity" label="消耗数量" width="100" align="right" show-overflow-tooltip />
            <el-table-column prop="unitPrice" label="单价" width="80" align="right">
              <template #default="{ row }">¥{{ formatMoney(row.unitPrice) }}</template>
            </el-table-column>
            <el-table-column prop="amount" label="消耗金额" width="100" align="right">
              <template #default="{ row }">¥{{ formatMoney(row.amount) }}</template>
            </el-table-column>
            <el-table-column prop="before" label="扣费前余额" width="115" align="right">
              <template #default="{ row }">¥{{ formatMoney(row.before) }}</template>
            </el-table-column>
            <el-table-column prop="after" label="扣费后余额" width="115" align="right">
              <template #default="{ row }">¥{{ formatMoney(row.after) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="74" align="center" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="openRecordDetail(row, 'consume')">详情</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <el-drawer v-model="recordDetailVisible" title="资金操作流水审计详情" size="560px" destroy-on-close>
      <div v-if="selectedRecordDetail" class="audit-drawer-content">
        <div class="detail-money-banner" :class="selectedRecordDetail.kind === 'recharge' ? 'bg-success' : 'bg-warning'">
          <div class="m-label">{{ selectedRecordDetail.kind === 'recharge' ? '充值凭证金额' : '消费扣费金额' }}</div>
          <div class="m-value">
            <span class="symbol">{{ selectedRecordDetail.kind === 'recharge' ? '+' : '-' }}</span>
            <span class="currency">¥</span>
            <span class="num">{{ formatMoney(selectedRecordDetail.amount) }}</span>
          </div>
          <div class="m-status">
            <el-tag size="small" :type="selectedRecordDetail.kind === 'recharge' ? 'success' : 'warning'" effect="dark">
              {{ selectedRecordDetail.kind === 'recharge' ? '入账成功 / 已核验' : '扣费成功 / 已核销' }}
            </el-tag>
          </div>
        </div>

        <h4 class="audit-section-title">核心记账凭证</h4>
        <el-descriptions :column="1" border size="small" class="audit-descriptions">
          <el-descriptions-item label="全局流水单号"><span class="mono-text">{{ selectedRecordDetail.orderId }}</span></el-descriptions-item>
          <el-descriptions-item label="当前用户"><strong>{{ activeUser.name }}</strong></el-descriptions-item>
          <el-descriptions-item label="归属租户"><strong>{{ activeUser.tenant }}</strong></el-descriptions-item>
          <el-descriptions-item label="资金变动性质">
            <el-tag size="small" :type="selectedRecordDetail.kind === 'recharge' ? 'success' : 'warning'">
              {{ selectedRecordDetail.kind === 'recharge' ? '充值账户' : '消费扣费' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="结算核销时间">{{ selectedRecordDetail.time }}</el-descriptions-item>
          <el-descriptions-item label="后台经办操作员"><span class="operator-tag">{{ selectedRecordDetail.operator }}</span></el-descriptions-item>
        </el-descriptions>

        <h4 class="audit-section-title">核销与数据资产关联</h4>
        <el-descriptions :column="1" border size="small" class="audit-descriptions">
          <el-descriptions-item label="充值/扣费方式"><span class="text-bold">{{ selectedRecordDetail.method }}</span></el-descriptions-item>
          <el-descriptions-item label="关联项目">{{ selectedRecordDetail.project }}</el-descriptions-item>
          <el-descriptions-item label="关联任务ID"><span class="mono-text">{{ selectedRecordDetail.taskId }}</span></el-descriptions-item>
          <el-descriptions-item label="三方流水号 / 凭证码"><span class="mono-text">{{ selectedRecordDetail.proofNo }}</span></el-descriptions-item>
        </el-descriptions>

        <h4 class="audit-section-title">财务备注说明</h4>
        <div class="audit-remark-box">
          <p class="remark-text">{{ selectedRecordDetail.notice }}</p>
        </div>
      </div>
    </el-drawer>
  </section>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import * as echarts from 'echarts'

const route = useRoute()
const activeTab = ref('fee')
const recordDetailVisible = ref(false)
const selectedRecordDetail = ref(null)
const consumeTrendRef = ref(null)
const trendRangeType = ref('7d')
const trendStartDate = ref('2026-05-21')
const trendEndDate = ref('2026-05-27')
let consumeTrendChart = null

const users = [
  { id: 1, name: 'Regular User', email: 'user@guyugeo.com', tenant: '谷雨GEO', balance: 8260, totalRecharge: 12000, giftQuota: 0, totalConsume: 3740, monthConsume: 1280, status: '正常' },
  { id: 2, name: 'Manager User', email: 'manager@guyugeo.com', tenant: '谷雨GEO', balance: 15200, totalRecharge: 20000, giftQuota: 0, totalConsume: 4800, monthConsume: 2320, status: '正常' },
  { id: 3, name: 'System Admin', email: 'admin@guyugeo.com', tenant: '谷雨GEO', balance: 30000, totalRecharge: 30000, giftQuota: 0, totalConsume: 0, monthConsume: 0, status: '正常' },
  { id: 4, name: '李佳英', email: 'liquiying@guyuai.com', tenant: '初敏保湿霜', balance: 3180, totalRecharge: 8000, giftQuota: 0, totalConsume: 4820, monthConsume: 1560, status: '正常' },
  { id: 5, name: '蒲文静', email: 'puwenjing@guyuai.com', tenant: '初敏保湿霜', balance: 1260, totalRecharge: 5000, giftQuota: 5000, totalConsume: 3740, monthConsume: 980, status: '正常' },
  { id: 6, name: '张鹏', email: '657025171@qq.com', tenant: '汽车之家', balance: 920, totalRecharge: 3000, giftQuota: 0, totalConsume: 2080, monthConsume: 640, status: '正常' },
  { id: 7, name: '王雨晴', email: 'wangyuqing@guyuai.com', tenant: '卓牧羊奶粉项目', balance: -126.8, totalRecharge: 2000, giftQuota: 0, totalConsume: 2126.8, monthConsume: 486.8, status: '欠费' }
]

const rechargeRecords = [
  { userId: 1, time: '2026-05-20 10:18', amount: 6000, method: '线上支付', before: 2260, after: 8260, operator: 'System', reason: '企业线上充值', status: '成功' },
  { userId: 1, time: '2026-05-09 09:30', amount: 6000, method: '后台充值', before: 0, after: 6000, operator: 'admin', reason: '初始化账户额度', status: '成功' },
  { userId: 2, time: '2026-05-22 13:08', amount: 5000, method: '微信支付', before: 10200, after: 15200, operator: 'System', reason: '微信商户订单 WX202605221308', status: '成功' },
  { userId: 4, time: '2026-05-10 16:00', amount: 5000, method: '线上支付', before: 420, after: 5420, operator: 'System', reason: '项目监控充值', status: '成功' },
  { userId: 7, time: '2026-04-18 10:12', amount: 2000, method: '微信支付', before: 0, after: 2000, operator: 'System', reason: '项目账户充值', status: '成功' }
]

const consumeRecords = [
  { userId: 1, time: '2026-05-21 09:20', type: '监控任务', project: '初敏保湿霜', taskId: 'MT-052101', model: 'DeepSeek', quantity: '48 问题', unitPrice: 0.1, amount: 4.8, before: 8358, after: 8353.2 },
  { userId: 1, time: '2026-05-22 10:16', type: '监控任务', project: '初敏保湿霜', taskId: 'MT-052201', model: '豆包', quantity: '60 问题', unitPrice: 0.1, amount: 6, before: 8353.2, after: 8347.2 },
  { userId: 1, time: '2026-05-23 11:08', type: '截图存证', project: '初敏保湿霜', taskId: 'SC-052301', model: '-', quantity: '18 张', unitPrice: 0.2, amount: 3.6, before: 8347.2, after: 8343.6 },
  { userId: 1, time: '2026-05-24 15:22', type: '深度思考', project: '初敏保湿霜', taskId: 'DT-052401', model: 'Kimi', quantity: '42 次', unitPrice: 0.1, amount: 4.2, before: 8343.6, after: 8339.4 },
  { userId: 1, time: '2026-05-25 17:10', type: 'AI报告', project: '初敏保湿霜', taskId: 'RP-052501', model: '通义千问', quantity: '2 份', unitPrice: 1, amount: 2, before: 8339.4, after: 8337.4 },
  { userId: 1, time: '2026-05-26 10:20', type: '监控任务', project: '初敏保湿霜', taskId: 'MT-052201', model: 'DeepSeek', quantity: '39 问题', unitPrice: 0.8, amount: 31.2, before: 8309.2, after: 8278 },
  { userId: 1, time: '2026-05-26 10:42', type: '报告导出', project: '初敏保湿霜', taskId: 'EXP-052601', model: '-', quantity: '1 份', unitPrice: 18, amount: 18, before: 8278, after: 8260 },
  { userId: 2, time: '2026-05-26 09:58', type: '截图采集', project: '谷雨AI', taskId: 'MT-052601', model: 'Kimi', quantity: '120 张', unitPrice: 0.2, amount: 24, before: 15224, after: 15200 },
  { userId: 4, time: '2026-05-26 10:31', type: '大模型调用', project: '初敏保湿霜', taskId: 'MT-052201', model: '豆包', quantity: '186 次', unitPrice: 0.35, amount: 65.1, before: 3245.1, after: 3180 },
  { userId: 5, time: '2026-05-25 18:20', type: '复测任务', project: '初敏保湿霜', taskId: 'RT-052501', model: '通义千问', quantity: '60 问题', unitPrice: 0.6, amount: 36, before: 1296, after: 1260 },
  { userId: 7, time: '2026-05-27 09:46', type: '定时监控任务', project: '卓牧羊奶粉项目', taskId: 'MT-052701', model: 'DeepSeek', quantity: '96 次', unitPrice: 0.1, amount: 9.6, before: -117.2, after: -126.8 }
]

const headerCellStyle = {
  background: '#f8fafc',
  color: '#64748b',
  fontWeight: 700,
  height: '44px'
}

const activeUser = computed(() => {
  const id = Number(route.params.id)
  return users.find(user => user.id === id) || users[0]
})

const currentRechargeRecords = computed(() => rechargeRecords.filter(record => record.userId === activeUser.value.id))
const currentConsumeRecords = computed(() => consumeRecords.filter(record => record.userId === activeUser.value.id))
const trendDates = computed(() => {
  if (trendRangeType.value === 'custom' && trendStartDate.value && trendEndDate.value) {
    return buildDateRange(trendStartDate.value, trendEndDate.value)
  }
  return buildRecentDates(trendRangeType.value === '30d' ? 30 : 7)
})
const currentConsumeTotal = computed(() => currentConsumeTrendData.value.reduce((sum, item) => sum + item.value, 0))
const currentConsumeTrendData = computed(() => {
  const valueMap = trendDates.value.reduce((result, date) => {
    result[date] = 0
    return result
  }, {})
  currentConsumeRecords.value.forEach(record => {
    const date = record.time.slice(0, 10)
    if (date in valueMap) valueMap[date] += Number(record.amount || 0)
  })
  return trendDates.value.map(date => ({
    date,
    label: date.slice(5),
    value: Number(valueMap[date].toFixed(2))
  }))
})
const currentConsumeDailyRows = computed(() => [...currentConsumeTrendData.value].reverse().map(day => {
  const records = currentConsumeRecords.value.filter(record => record.time.startsWith(day.date))
  return {
    date: day.date,
    consumeCount: records.length,
    amount: day.value,
    projects: [...new Set(records.map(record => record.project).filter(Boolean))].join('、') || '-',
    models: [...new Set(records.map(record => record.model).filter(Boolean))].join('、') || '-',
    taskIds: records.map(record => record.taskId).filter(Boolean).join('、') || '-'
  }
}))

const formatMoney = (value) => Number(value || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const toDate = (dateText) => {
  const [year, month, day] = dateText.split('-').map(Number)
  return new Date(year, month - 1, day)
}
const formatDate = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
const buildDateRange = (start, end) => {
  const dates = []
  const endDate = toDate(end)
  for (const cursor = toDate(start); cursor <= endDate; cursor.setDate(cursor.getDate() + 1)) {
    dates.push(formatDate(cursor))
  }
  return dates
}
const buildRecentDates = (days) => {
  const endDate = toDate('2026-05-27')
  const startDate = new Date(endDate)
  startDate.setDate(endDate.getDate() - days + 1)
  return buildDateRange(formatDate(startDate), formatDate(endDate))
}
const getBalanceClass = (row) => ({
  'balance-value': true,
  'is-arrears': row.status === '欠费' || Number(row.balance) < 0
})

const getConsumeTrendOption = () => ({
  grid: { left: 46, right: 24, top: 36, bottom: 36 },
  tooltip: { trigger: 'axis', valueFormatter: value => `¥${formatMoney(value)}` },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: currentConsumeTrendData.value.map(item => item.label),
    axisTick: { show: false },
    axisLine: { lineStyle: { color: '#e5e7eb' } },
    axisLabel: { color: '#64748b' }
  },
  yAxis: {
    type: 'value',
    minInterval: 1,
    axisLabel: { color: '#64748b', formatter: value => value >= 10000 ? `${value / 10000}万` : value },
    splitLine: { lineStyle: { color: '#eef2f7' } }
  },
  series: [{
    name: '费用消耗',
    type: 'line',
    smooth: true,
    symbol: 'circle',
    symbolSize: 7,
    lineStyle: { width: 3, color: '#f97316' },
    itemStyle: { color: '#f97316' },
    label: {
      show: true,
      position: 'top',
      color: '#f97316',
      fontSize: 12,
      fontWeight: 700,
      formatter: params => Number(params.value || 0) > 0 ? `¥${formatMoney(params.value)}` : ''
    },
    areaStyle: { color: 'rgba(249, 115, 22, 0.12)' },
    data: currentConsumeTrendData.value.map(item => item.value)
  }]
})

const renderConsumeTrend = () => {
  if (!consumeTrendRef.value) return
  consumeTrendChart ||= echarts.init(consumeTrendRef.value)
  consumeTrendChart.setOption(getConsumeTrendOption(), true)
}
const resizeConsumeTrend = () => consumeTrendChart?.resize()

const openRecordDetail = (row, kind) => {
  selectedRecordDetail.value = buildRecordDetail(row, kind)
  recordDetailVisible.value = true
}
const buildRecordDetail = (row, kind) => {
  if (kind === 'recharge') {
    return {
      kind,
      orderId: row.orderId || `RC_${row.userId}_${row.time.replace(/[-:\s]/g, '').slice(0, 12)}`,
      amount: row.amount,
      time: row.time,
      operator: row.operator || 'System',
      method: row.method,
      project: activeUser.value.tenant,
      taskId: 'N/A',
      proofNo: row.proofNo || `${row.method === '微信支付' ? 'WXPAY' : 'ADMIN'}_${row.time.replace(/[-:\s]/g, '').slice(0, 12)}`,
      notice: row.reason || '该笔充值暂无补充备注说明。'
    }
  }
  return {
    kind,
    orderId: row.orderId || `CS_${row.userId}_${row.time.replace(/[-:\s]/g, '').slice(0, 12)}`,
    amount: row.amount,
    time: row.time,
    operator: row.operator || 'System',
    method: row.type,
    project: row.project || activeUser.value.tenant,
    taskId: row.taskId || 'N/A',
    proofNo: row.proofNo || `BILL_${row.taskId || row.userId}_${row.time.replace(/[-:\s]/g, '').slice(0, 12)}`,
    notice: `${row.model || '-'} ${row.quantity || ''}，单价 ¥${formatMoney(row.unitPrice)}，扣费前余额 ¥${formatMoney(row.before)}，扣费后余额 ¥${formatMoney(row.after)}。`
  }
}

onMounted(() => {
  nextTick(renderConsumeTrend)
  window.addEventListener('resize', resizeConsumeTrend)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeConsumeTrend)
  consumeTrendChart?.dispose()
})
watch([currentConsumeTrendData, trendRangeType, trendStartDate, trendEndDate], () => {
  nextTick(renderConsumeTrend)
})
</script>

<style scoped>
.billing-detail-page { min-height: 100%; padding: 28px 36px; background: #f5f7fb; }
.page-heading { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 18px; }
.page-heading p { margin: 0; color: #8a95a6; font-size: 14px; }
.summary-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; margin-bottom: 16px; }
.summary-card { padding: 16px 18px; border: 1px solid #e5e7eb; border-radius: 8px; background: #fff; }
.summary-card span { display: block; color: #8a95a6; font-size: 13px; }
.summary-card strong { display: block; margin-top: 8px; color: #111827; font-size: 24px; line-height: 1; }
.balance-value { color: #1d4ed8; font-weight: 900; }
.balance-value.is-arrears { color: #dc2626; }
.trend-card { margin-bottom: 16px; border: 1px solid #e5e7eb; border-radius: 8px; }
:deep(.trend-card .el-card__body) { padding: 16px 18px 12px; }
.trend-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 8px; }
.trend-header strong { display: block; color: #111827; font-size: 16px; }
.trend-header span { display: block; margin-top: 4px; color: #8a95a6; font-size: 13px; }
.trend-header b { color: #f97316; font-size: 18px; white-space: nowrap; }
.trend-actions { display: flex; align-items: center; justify-content: flex-end; flex-wrap: wrap; gap: 10px; }
.trend-date-picker { width: 136px; }
.date-separator { color: #94a3b8; font-size: 13px; }
.consume-trend-chart { width: 100%; height: 240px; }
.panel-card { border: 1px solid #e5e7eb; border-radius: 8px; }
:deep(.panel-card .el-card__body) { padding: 16px; }
:deep(.billing-table .el-table__cell) { white-space: nowrap; }
:deep(.compact-table .el-table__cell) { padding: 7px 0; }
:deep(.compact-table .cell) { padding: 0 8px; }
.audit-drawer-content { padding: 0 4px; }
.detail-money-banner { border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 24px; }
.detail-money-banner.bg-success { background: linear-gradient(135deg, #f0f9eb 0%, #e1f3d8 100%); border: 1px solid #c2e7b0; }
.detail-money-banner.bg-success .num,
.detail-money-banner.bg-success .symbol,
.detail-money-banner.bg-success .currency { color: #67c23a; }
.detail-money-banner.bg-warning { background: linear-gradient(135deg, #fdf6ec 0%, #faecd8 100%); border: 1px solid #f5dab1; }
.detail-money-banner.bg-warning .num,
.detail-money-banner.bg-warning .symbol,
.detail-money-banner.bg-warning .currency { color: #e6a23c; }
.m-label { color: #606266; font-size: 14px; }
.m-value { margin: 8px 0; font-weight: 900; line-height: 1; }
.m-value .symbol { font-size: 22px; vertical-align: 12px; }
.m-value .currency { font-size: 24px; margin: 0 3px; vertical-align: 10px; }
.m-value .num { font-family: Georgia, 'Times New Roman', serif; font-size: 42px; }
.audit-section-title { margin: 20px 0 12px; padding-left: 12px; border-left: 3px solid #2b65f0; color: #303133; font-size: 16px; font-weight: 800; }
.audit-descriptions { margin-bottom: 16px; }
.mono-text { font-family: Consolas, Monaco, monospace; color: #606266; }
.operator-tag { display: inline-block; padding: 2px 10px; border-radius: 6px; background: #f0f2f5; color: #909399; font-weight: 700; }
.text-bold { font-weight: 800; color: #303133; }
.audit-remark-box { background: #f8f9fa; border: 1px solid #e4e7ed; border-radius: 6px; padding: 14px; }
.remark-text { margin: 0; color: #606266; line-height: 1.7; }
</style>

