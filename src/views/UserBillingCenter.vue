<template>
  <section class="billing-page">
    <div class="page-heading">
      <div>
        <h1>用户费用</h1>
        <p>按用户账户查看充值、消耗、余额和明细记录。</p>
      </div>
      <el-button type="primary" @click="openRecharge(activeUser || users[0])">+ 用户充值</el-button>
    </div>

    <div class="summary-grid">
      <div v-for="item in summaryCards" :key="item.label" class="summary-card">
        <span>{{ item.label }}</span>
        <strong>{{ item.value }}</strong>
      </div>
    </div>

    <div class="trend-toolbar">
      <el-radio-group v-model="trendRangeType" size="small">
        <el-radio-button label="7d">最近7天</el-radio-button>
        <el-radio-button label="30d">最近30天</el-radio-button>
        <el-radio-button label="custom">指定时间段</el-radio-button>
      </el-radio-group>
      <el-date-picker
        v-if="trendRangeType === 'custom'"
        v-model="trendStartDate"
        type="date"
        placeholder="开始时间"
        value-format="YYYY-MM-DD"
        size="small"
        class="trend-date-picker"
      />
      <span v-if="trendRangeType === 'custom'" class="date-separator">至</span>
      <el-date-picker
        v-if="trendRangeType === 'custom'"
        v-model="trendEndDate"
        type="date"
        placeholder="结束时间"
        value-format="YYYY-MM-DD"
        size="small"
        class="trend-date-picker"
      />
    </div>

    <div class="trend-grid">
      <el-card shadow="never" class="trend-card">
        <div class="trend-header">
          <strong>整体充值趋势</strong>
          <span>{{ trendRangeLabel }}</span>
        </div>
        <div ref="rechargeTrendRef" class="trend-chart"></div>
      </el-card>
      <el-card shadow="never" class="trend-card">
        <div class="trend-header">
          <strong>每天消耗趋势</strong>
          <span>{{ trendRangeLabel }}</span>
        </div>
        <div ref="consumeTrendRef" class="trend-chart"></div>
      </el-card>
    </div>

    <el-card shadow="never" class="panel-card">
      <div class="table-toolbar">
        <el-input v-model="keyword" clearable placeholder="搜索用户名 / 邮箱 / 租户" :prefix-icon="Search" class="search-input" />
        <el-select v-model="tenantFilter" clearable placeholder="全部租户" style="width: 180px">
          <el-option v-for="tenant in tenants" :key="tenant" :label="tenant" :value="tenant" />
        </el-select>
      </div>

      <el-table :data="filteredUsers" class="billing-table compact-table" size="small" style="width: 100%" :header-cell-style="headerCellStyle">
        <el-table-column label="用户名" width="108" show-overflow-tooltip>
          <template #default="{ row }">
            <button type="button" class="user-link" @click="selectUser(row)">
              <strong>{{ row.name }}</strong>
            </button>
          </template>
        </el-table-column>
        <el-table-column prop="email" label="用户邮箱" min-width="150" show-overflow-tooltip />
        <el-table-column prop="tenant" label="归属租户" min-width="120" show-overflow-tooltip />
        <el-table-column prop="balance" label="当前余额" width="92" align="right">
          <template #default="{ row }">
            <span :class="getBalanceClass(row)">¥{{ formatMoney(row.balance) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="totalRecharge" label="累计充值" width="92" align="right">
          <template #default="{ row }">¥{{ formatMoney(row.totalRecharge) }}</template>
        </el-table-column>
        <el-table-column prop="giftQuota" label="赠送额度" width="92" align="right">
          <template #default="{ row }">¥{{ formatMoney(row.giftQuota) }}</template>
        </el-table-column>
        <el-table-column prop="totalConsume" label="累计消耗" width="92" align="right">
          <template #default="{ row }">¥{{ formatMoney(row.totalConsume) }}</template>
        </el-table-column>
        <el-table-column prop="monthConsume" label="本月消耗" width="92" align="right">
          <template #default="{ row }">¥{{ formatMoney(row.monthConsume) }}</template>
        </el-table-column>
        <el-table-column prop="lastRechargeAt" label="最近充值时间" width="126" show-overflow-tooltip />
        <el-table-column label="状态" width="68" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === '正常' ? 'success' : 'warning'" effect="plain" size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="96" fixed="right">
          <template #default="{ row }">
            <div class="action-group">
              <el-button link type="primary" @click="openBillingDetail(row)">详情</el-button>
              <el-button link type="primary" @click="openRecharge(row)">充值</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="detailVisible" width="1080px" class="billing-detail-dialog" destroy-on-close>
      <template #header>
        <div class="detail-header">
          <div>
            <span class="section-title">{{ activeUser.name }} · 费用明细</span>
            <span class="section-subtitle">{{ activeUser.email }} / {{ activeUser.tenant }}</span>
          </div>
          <el-tag effect="plain" type="success">余额 ¥{{ formatMoney(activeUser.balance) }}</el-tag>
        </div>
      </template>

      <el-tabs v-model="activeTab">
        <el-tab-pane :label="`充值记录（${currentRechargeRecords.length}条）`" name="recharge">
          <el-table :data="currentRechargeRecords" class="billing-table compact-table" size="small" height="420" style="width: 100%" :header-cell-style="headerCellStyle">
            <el-table-column prop="time" label="充值时间" width="140" show-overflow-tooltip />
            <el-table-column prop="amount" label="充值金额" width="105" align="right">
              <template #default="{ row }">¥{{ formatMoney(row.amount) }}</template>
            </el-table-column>
            <el-table-column prop="method" label="充值方式" width="100" show-overflow-tooltip />
            <el-table-column prop="before" label="充值前余额" width="105" align="right">
              <template #default="{ row }">¥{{ formatMoney(row.before) }}</template>
            </el-table-column>
            <el-table-column prop="after" label="充值后余额" width="105" align="right">
              <template #default="{ row }">¥{{ formatMoney(row.after) }}</template>
            </el-table-column>
            <el-table-column prop="operator" label="操作人" width="90" show-overflow-tooltip />
            <el-table-column prop="reason" label="充值原因" min-width="180" show-overflow-tooltip />
            <el-table-column label="状态" width="74" align="center">
              <template #default="{ row }"><el-tag effect="plain" type="success" size="small">{{ row.status }}</el-tag></template>
            </el-table-column>
            <el-table-column label="操作" width="74" align="center" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="openRecordDetail(row, 'recharge')">详情</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane :label="`消耗记录（${currentConsumeRecords.length}条）`" name="consume">
          <el-table :data="currentConsumeRecords" class="billing-table compact-table" size="small" height="420" style="width: 100%" :header-cell-style="headerCellStyle">
            <el-table-column prop="time" label="消耗时间" width="140" show-overflow-tooltip />
            <el-table-column prop="type" label="消耗类型" width="100" show-overflow-tooltip />
            <el-table-column prop="project" label="关联项目" min-width="105" show-overflow-tooltip />
            <el-table-column prop="taskId" label="关联任务ID" width="108" show-overflow-tooltip />
            <el-table-column prop="model" label="模型名称" width="88" show-overflow-tooltip />
            <el-table-column prop="quantity" label="消耗数量" width="92" align="right" show-overflow-tooltip />
            <el-table-column prop="unitPrice" label="单价" width="76" align="right">
              <template #default="{ row }">¥{{ formatMoney(row.unitPrice) }}</template>
            </el-table-column>
            <el-table-column prop="amount" label="消耗金额" width="92" align="right">
              <template #default="{ row }">¥{{ formatMoney(row.amount) }}</template>
            </el-table-column>
            <el-table-column prop="before" label="扣费前余额" width="104" align="right">
              <template #default="{ row }">¥{{ formatMoney(row.before) }}</template>
            </el-table-column>
            <el-table-column prop="after" label="扣费后余额" width="104" align="right">
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
    </el-dialog>

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
          <el-descriptions-item label="全局流水单号">
            <span class="mono-text">{{ selectedRecordDetail.orderId }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="当前用户">
            <strong>{{ activeUser.name }}</strong>
          </el-descriptions-item>
          <el-descriptions-item label="归属租户">
            <strong>{{ activeUser.tenant }}</strong>
          </el-descriptions-item>
          <el-descriptions-item label="资金变动性质">
            <el-tag size="small" :type="selectedRecordDetail.kind === 'recharge' ? 'success' : 'warning'">
              {{ selectedRecordDetail.kind === 'recharge' ? '充值账户' : '消费扣费' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="结算核销时间">{{ selectedRecordDetail.time }}</el-descriptions-item>
          <el-descriptions-item label="后台经办操作员">
            <span class="operator-tag">{{ selectedRecordDetail.operator }}</span>
          </el-descriptions-item>
        </el-descriptions>

        <h4 class="audit-section-title">核销与数据资产关联</h4>
        <el-descriptions :column="1" border size="small" class="audit-descriptions">
          <el-descriptions-item label="充值/扣费方式">
            <span class="text-bold">{{ selectedRecordDetail.method }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="关联项目">
            <span>{{ selectedRecordDetail.project }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="关联任务ID">
            <span class="mono-text">{{ selectedRecordDetail.taskId }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="三方流水号 / 凭证码">
            <span class="mono-text">{{ selectedRecordDetail.proofNo }}</span>
          </el-descriptions-item>
        </el-descriptions>

        <h4 class="audit-section-title">财务备注说明</h4>
        <div class="audit-remark-box">
          <p class="remark-text">{{ selectedRecordDetail.notice }}</p>
        </div>
      </div>
    </el-drawer>

    <el-dialog v-model="rechargeVisible" title="用户充值" width="460px">
      <el-form :model="rechargeForm" label-width="90px">
        <el-form-item label="充值用户" required>
          <el-select v-model="rechargeForm.userId" filterable style="width: 100%" placeholder="请选择充值用户">
            <el-option
              v-for="user in users"
              :key="user.id"
              :label="`${user.name} / ${user.email}`"
              :value="user.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="充值金额">
          <el-input-number v-model="rechargeForm.amount" :min="1" :step="100" style="width: 100%" />
        </el-form-item>
        <el-form-item label="充值方式">
          <el-select v-model="rechargeForm.method" style="width: 100%">
            <el-option label="后台充值" value="后台充值" />
            <el-option label="线上支付" value="线上支付" />
            <el-option label="微信支付" value="微信支付" />
            <el-option label="赠送额度" value="赠送额度" />
            <el-option label="调账" value="调账" />
          </el-select>
        </el-form-item>
        <el-form-item label="充值原因" required>
          <el-input v-model="rechargeForm.reason" type="textarea" :rows="3" placeholder="请输入本次充值原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rechargeVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmRecharge">确认充值</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'

const router = useRouter()
const keyword = ref('')
const tenantFilter = ref('')
const activeTab = ref('recharge')
const detailVisible = ref(false)
const recordDetailVisible = ref(false)
const selectedRecordDetail = ref(null)
const rechargeVisible = ref(false)
const rechargeTarget = ref(null)
const rechargeTrendRef = ref(null)
const consumeTrendRef = ref(null)
const trendRangeType = ref('7d')
const trendStartDate = ref('2026-05-20')
const trendEndDate = ref('2026-05-26')
let rechargeTrendChart = null
let consumeTrendChart = null

const users = ref([
  { id: 1, name: 'Regular User', email: 'user@guyugeo.com', tenant: '谷雨GEO', balance: 8260, totalRecharge: 12000, giftQuota: 0, totalConsume: 3740, monthConsume: 1280, lastRechargeAt: '2026-05-20 10:18', lastConsumeAt: '2026-05-26 10:42', status: '正常' },
  { id: 2, name: 'Manager User', email: 'manager@guyugeo.com', tenant: '谷雨GEO', balance: 15200, totalRecharge: 20000, giftQuota: 0, totalConsume: 4800, monthConsume: 2320, lastRechargeAt: '2026-05-18 14:22', lastConsumeAt: '2026-05-26 09:58', status: '正常' },
  { id: 3, name: 'System Admin', email: 'admin@guyugeo.com', tenant: '谷雨GEO', balance: 30000, totalRecharge: 30000, giftQuota: 0, totalConsume: 0, monthConsume: 0, lastRechargeAt: '2026-05-09 09:30', lastConsumeAt: '-', status: '正常' },
  { id: 4, name: '李佳英', email: 'liquiying@guyuai.com', tenant: '初敏保湿霜', balance: 3180, totalRecharge: 8000, giftQuota: 0, totalConsume: 4820, monthConsume: 1560, lastRechargeAt: '2026-05-10 16:00', lastConsumeAt: '2026-05-26 10:31', status: '正常' },
  { id: 5, name: '蒲文静', email: 'puwenjing@guyuai.com', tenant: '初敏保湿霜', balance: 1260, totalRecharge: 5000, giftQuota: 5000, totalConsume: 3740, monthConsume: 980, lastRechargeAt: '2026-04-28 11:20', lastConsumeAt: '2026-05-25 18:20', status: '正常' },
  { id: 6, name: '张鹏', email: '657025171@qq.com', tenant: '汽车之家', balance: 920, totalRecharge: 3000, giftQuota: 0, totalConsume: 2080, monthConsume: 640, lastRechargeAt: '2026-04-22 15:45', lastConsumeAt: '2026-05-24 12:08', status: '正常' },
  { id: 7, name: '王雨晴', email: 'wangyuqing@guyuai.com', tenant: '卓牧羊奶粉项目', balance: -126.8, totalRecharge: 2000, giftQuota: 0, totalConsume: 2126.8, monthConsume: 486.8, lastRechargeAt: '2026-04-18 10:12', lastConsumeAt: '2026-05-27 09:46', status: '欠费' }
])

const rechargeRecords = ref([
  { userId: 1, time: '2026-05-20 10:18', amount: 6000, method: '线上支付', before: 2260, after: 8260, operator: 'System', reason: '企业线上充值', status: '成功' },
  { userId: 1, time: '2026-05-09 09:30', amount: 6000, method: '后台充值', before: 0, after: 6000, operator: 'admin', reason: '初始化账户额度', status: '成功' },
  { userId: 2, time: '2026-05-22 13:08', amount: 5000, method: '微信支付', before: 10200, after: 15200, operator: 'System', reason: '微信商户订单 WX202605221308', status: '成功' },
  { userId: 2, time: '2026-05-18 14:22', amount: 10000, method: '后台充值', before: 5200, after: 15200, operator: 'admin', reason: '客户月度续费', status: '成功' },
  { userId: 3, time: '2026-05-09 09:30', amount: 30000, method: '调账', before: 0, after: 30000, operator: 'admin', reason: '系统管理员测试额度调账', status: '成功' },
  { userId: 4, time: '2026-05-10 16:00', amount: 5000, method: '线上支付', before: 420, after: 5420, operator: 'System', reason: '项目监控充值', status: '成功' },
  { userId: 5, time: '2026-04-28 11:20', amount: 5000, method: '赠送额度', before: 0, after: 5000, operator: 'admin', reason: '试用期赠送额度', status: '成功' },
  { userId: 6, time: '2026-04-22 15:45', amount: 3000, method: '微信支付', before: 0, after: 3000, operator: 'System', reason: '微信支付充值', status: '成功' }
])

const consumeRecords = ref([
  { userId: 1, time: '2026-05-26 10:42', type: '报告导出', project: '初敏保湿霜', taskId: 'EXP-052601', model: '-', quantity: '1 份', unitPrice: 18, amount: 18, before: 8278, after: 8260 },
  { userId: 1, time: '2026-05-26 10:20', type: '监控任务', project: '初敏保湿霜', taskId: 'MT-052201', model: 'DeepSeek', quantity: '39 问题', unitPrice: 0.8, amount: 31.2, before: 8309.2, after: 8278 },
  { userId: 2, time: '2026-05-26 09:58', type: '截图采集', project: '谷雨AI', taskId: 'MT-052601', model: 'Kimi', quantity: '120 张', unitPrice: 0.2, amount: 24, before: 15224, after: 15200 },
  { userId: 4, time: '2026-05-26 10:31', type: '大模型调用', project: '初敏保湿霜', taskId: 'MT-052201', model: '豆包', quantity: '186 次', unitPrice: 0.35, amount: 65.1, before: 3245.1, after: 3180 },
  { userId: 5, time: '2026-05-25 18:20', type: '复测任务', project: '初敏保湿霜', taskId: 'RT-052501', model: '通义千问', quantity: '60 问题', unitPrice: 0.6, amount: 36, before: 1296, after: 1260 },
  { userId: 7, time: '2026-05-27 09:46', type: '定时监控任务', project: '卓牧羊奶粉项目', taskId: 'MT-052701', model: 'DeepSeek', quantity: '96 次', unitPrice: 0.1, amount: 9.6, before: -117.2, after: -126.8 }
])

const rechargeForm = reactive({
  userId: null,
  amount: 100,
  method: '后台充值',
  reason: ''
})

const activeUser = ref(users.value[0])

const tenants = computed(() => [...new Set(users.value.map(user => user.tenant))])
const filteredUsers = computed(() => {
  const key = keyword.value.trim().toLowerCase()
  return users.value.filter(user => {
    const tenantMatched = !tenantFilter.value || user.tenant === tenantFilter.value
    const keyMatched = !key || `${user.name}${user.email}${user.tenant}`.toLowerCase().includes(key)
    return tenantMatched && keyMatched
  })
})

const summaryCards = computed(() => [
  { label: '用户余额合计', value: `¥${formatMoney(users.value.reduce((sum, user) => sum + user.balance, 0))}` },
  { label: '累计充值', value: `¥${formatMoney(users.value.reduce((sum, user) => sum + user.totalRecharge, 0))}` },
  { label: '累计消耗', value: `¥${formatMoney(users.value.reduce((sum, user) => sum + user.totalConsume, 0))}` },
  { label: '本月消耗', value: `¥${formatMoney(users.value.reduce((sum, user) => sum + user.monthConsume, 0))}` }
])

const currentRechargeRecords = computed(() => rechargeRecords.value.filter(record => record.userId === activeUser.value.id))
const currentConsumeRecords = computed(() => consumeRecords.value.filter(record => record.userId === activeUser.value.id))
const today = '2026-05-27'
const trendDates = computed(() => {
  if (trendRangeType.value === 'custom' && trendStartDate.value && trendEndDate.value) {
    return buildDateRange(trendStartDate.value, trendEndDate.value)
  }
  return buildRecentDates(trendRangeType.value === '30d' ? 30 : 7)
})
const trendRangeLabel = computed(() => {
  const dates = trendDates.value
  if (!dates.length) return '-'
  if (trendRangeType.value === '7d') return '最近 7 天'
  if (trendRangeType.value === '30d') return '最近 30 天'
  return `${dates[0]} 至 ${dates[dates.length - 1]}`
})

const rechargeTrendData = computed(() => buildTrendData(rechargeRecords.value))
const consumeTrendData = computed(() => buildTrendData(consumeRecords.value))

const headerCellStyle = {
  background: '#f8fafc',
  color: '#64748b',
  fontWeight: 700,
  height: '44px'
}

const formatMoney = (value) => Number(value || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const getBalanceClass = (row) => ({
  'balance-value': true,
  'is-arrears': row.status === '欠费' || Number(row.balance) < 0
})

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
  const startDate = toDate(start)
  const endDate = toDate(end)
  const dates = []
  for (const cursor = new Date(startDate); cursor <= endDate; cursor.setDate(cursor.getDate() + 1)) {
    dates.push(formatDate(cursor))
  }
  return dates
}

const buildRecentDates = (days) => {
  const endDate = toDate(today)
  const startDate = new Date(endDate)
  startDate.setDate(endDate.getDate() - days + 1)
  return buildDateRange(formatDate(startDate), formatDate(endDate))
}

const buildTrendData = (records) => {
  const dates = trendDates.value
  const valueMap = dates.reduce((result, date) => {
    result[date] = 0
    return result
  }, {})
  records.forEach(record => {
    const date = record.time.slice(0, 10)
    if (date in valueMap) {
      valueMap[date] += Number(record.amount || 0)
    }
  })
  return dates.map(date => ({
    date: date.slice(5),
    value: Number(valueMap[date].toFixed(2))
  }))
}

const getTrendOption = ({ title, data, color, areaColor }) => ({
  grid: { left: 44, right: 18, top: 24, bottom: 34 },
  tooltip: {
    trigger: 'axis',
    valueFormatter: value => `¥${formatMoney(value)}`
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: data.map(item => item.date),
    axisTick: { show: false },
    axisLine: { lineStyle: { color: '#e5e7eb' } },
    axisLabel: { color: '#64748b' }
  },
  yAxis: {
    type: 'value',
    minInterval: 1,
    axisLabel: {
      color: '#64748b',
      formatter: value => value >= 10000 ? `${value / 10000}万` : value
    },
    splitLine: { lineStyle: { color: '#eef2f7' } }
  },
  series: [
    {
      name: title,
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 7,
      lineStyle: { width: 3, color },
      itemStyle: { color },
      areaStyle: { color: areaColor },
      data: data.map(item => item.value)
    }
  ]
})

const renderTrendCharts = () => {
  if (!rechargeTrendRef.value || !consumeTrendRef.value) return
  rechargeTrendChart ||= echarts.init(rechargeTrendRef.value)
  consumeTrendChart ||= echarts.init(consumeTrendRef.value)
  rechargeTrendChart.setOption(getTrendOption({
    title: '整体充值',
    data: rechargeTrendData.value,
    color: '#2563eb',
    areaColor: 'rgba(37, 99, 235, 0.12)'
  }))
  consumeTrendChart.setOption(getTrendOption({
    title: '每日消耗',
    data: consumeTrendData.value,
    color: '#f97316',
    areaColor: 'rgba(249, 115, 22, 0.12)'
  }))
}

const resizeTrendCharts = () => {
  rechargeTrendChart?.resize()
  consumeTrendChart?.resize()
}

const selectUser = (row) => {
  activeUser.value = row
}

const openBillingDetail = (row) => {
  router.push({ name: 'UserBillingDetail', params: { id: row.id } })
}

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

const openRecharge = (row) => {
  rechargeTarget.value = row
  rechargeForm.userId = row?.id || activeUser.value?.id || users.value[0]?.id
  rechargeForm.amount = 100
  rechargeForm.method = '后台充值'
  rechargeForm.reason = ''
  rechargeVisible.value = true
}

const confirmRecharge = async () => {
  if (!rechargeForm.reason.trim()) {
    ElMessage.warning('请填写充值原因')
    return
  }
  const target = users.value.find(user => user.id === rechargeForm.userId)
  if (!target) {
    ElMessage.warning('请选择充值用户')
    return
  }
  rechargeTarget.value = target
  try {
    await ElMessageBox.confirm(
      `确认给用户「${target.name}」充值 ¥${formatMoney(rechargeForm.amount)}？充值后余额将变为 ¥${formatMoney(target.balance + rechargeForm.amount)}。`,
      '确认充值',
      {
        type: 'warning',
        confirmButtonText: '确认充值',
        cancelButtonText: '取消'
      }
    )
  } catch {
    return
  }
  const before = target.balance
  target.balance += rechargeForm.amount
  target.totalRecharge += rechargeForm.amount
  if (rechargeForm.method === '赠送额度') {
    target.giftQuota = (target.giftQuota || 0) + rechargeForm.amount
  }
  target.lastRechargeAt = '2026-05-26 11:30'
  rechargeRecords.value.unshift({
    userId: target.id,
    time: target.lastRechargeAt,
    amount: rechargeForm.amount,
    method: rechargeForm.method,
    before,
    after: target.balance,
    operator: 'admin',
    reason: rechargeForm.reason,
    status: '成功'
  })
  activeUser.value = target
  rechargeVisible.value = false
  ElMessage.success('充值记录已创建')
}

onMounted(() => {
  nextTick(renderTrendCharts)
  window.addEventListener('resize', resizeTrendCharts)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeTrendCharts)
  rechargeTrendChart?.dispose()
  consumeTrendChart?.dispose()
})

watch([rechargeTrendData, consumeTrendData, trendRangeType, trendStartDate, trendEndDate], () => {
  nextTick(renderTrendCharts)
})
</script>

<style scoped>
.billing-page { min-height: 100%; padding: 28px 36px; background: #f5f7fb; }
.page-heading { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 20px; }
.page-heading h1 { margin: 0; color: #0f172a; font-size: 24px; font-weight: 800; }
.page-heading p { margin: 8px 0 0; color: #8a95a6; font-size: 14px; }
.summary-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; margin-bottom: 16px; }
.summary-card { padding: 16px 18px; border: 1px solid #e5e7eb; border-radius: 8px; background: #fff; }
.summary-card span { display: block; color: #8a95a6; font-size: 13px; }
.summary-card strong { display: block; margin-top: 8px; color: #111827; font-size: 24px; line-height: 1; }
.trend-toolbar { display: flex; align-items: center; gap: 12px; margin: 0 0 12px; }
.date-separator { color: #94a3b8; font-size: 13px; }
.trend-date-picker { width: 136px; }
.trend-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; margin-bottom: 16px; }
.trend-card { border: 1px solid #e5e7eb; border-radius: 8px; }
:deep(.trend-card .el-card__body) { padding: 16px 18px 12px; }
.trend-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.trend-header strong { color: #111827; font-size: 15px; }
.trend-header span { color: #8a95a6; font-size: 12px; }
.trend-chart { width: 100%; height: 220px; }
.panel-card { margin-bottom: 16px; border: 1px solid #e5e7eb; border-radius: 8px; }
:deep(.panel-card .el-card__body) { padding: 16px; }
.table-toolbar { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 14px; }
.search-input { width: 280px; }
.user-link { display: inline-flex; align-items: center; padding: 0; border: 0; background: transparent; cursor: pointer; }
.user-link strong { color: #2563eb; font-size: 14px; }
.balance-value {
  display: inline-block;
  color: #1d4ed8;
  font-weight: 900;
}
.balance-value.is-arrears {
  color: #dc2626;
}
.action-group { display: inline-flex; align-items: center; gap: 8px; white-space: nowrap; }
.action-group :deep(.el-button) { margin-left: 0; }
:deep(.billing-table .el-table__cell) { white-space: nowrap; }
:deep(.compact-table .el-table__cell) { padding: 7px 0; }
:deep(.compact-table .cell) { padding: 0 8px; }
:deep(.billing-detail-dialog .el-dialog__header) { padding: 18px 20px 12px; margin-right: 40px; }
:deep(.billing-detail-dialog .el-dialog__body) { padding: 0 20px 20px; }
.detail-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.section-title { display: block; color: #111827; font-weight: 800; font-size: 16px; }
.section-subtitle { display: block; margin-top: 4px; color: #8a95a6; font-size: 13px; }
.form-static { color: #111827; font-weight: 700; }
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
