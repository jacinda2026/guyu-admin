<template>
  <div class="billing-page">
    <div class="page-card">
      <div class="page-head">
        <div>
          <h1>费用详情</h1>
          <p>查看充值、消耗、退款等完整资金流水</p>
        </div>
        <div class="head-actions">
          <span class="remind">余额提醒 <i></i></span>
          <button class="recharge-btn" type="button" @click="router.push('/billing/recharge')">账户充值</button>
        </div>
      </div>

      <div class="filters">
        <label>时间范围：</label>
        <el-select v-model="dateRange" class="filter-select">
          <el-option label="最近30天" value="30" />
          <el-option label="最近7天" value="7" />
          <el-option label="全部" value="all" />
        </el-select>
        <label>交易类型：</label>
        <el-select v-model="tradeType" class="filter-select">
          <el-option label="全部" value="all" />
          <el-option label="充值" value="recharge" />
          <el-option label="监控消耗" value="consume" />
        </el-select>
        <el-button>查询</el-button>
      </div>

      <div class="summary-grid">
        <div class="summary-card red"><span>总消耗</span><strong>¥2.04</strong></div>
        <div class="summary-card green"><span>总充值</span><strong>¥5.04</strong></div>
        <div class="summary-card blue"><span>代金券</span><strong>¥0.00</strong></div>
        <div class="summary-card dark"><span>当前余额</span><strong>¥2.38</strong></div>
      </div>

      <el-table :data="pagedRows" class="billing-table" border>
        <el-table-column prop="time" label="时间" width="160" />
        <el-table-column label="变动类型" width="120">
          <template #default="{ row }">
            <span class="type-tag" :class="row.type === '充值' ? 'is-recharge' : 'is-consume'">{{ row.type }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="id" label="类型ID" min-width="170" />
        <el-table-column label="余额变动" width="120" align="right">
          <template #default="{ row }">
            <span :class="row.amount > 0 ? 'money-plus' : 'money-minus'">{{ row.amount > 0 ? '+' : '' }}¥{{ row.amount.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="变动前余额" width="120" align="right">
          <template #default="{ row }">¥{{ row.before.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column label="变动后余额" width="120" align="right">
          <template #default="{ row }">¥{{ row.after.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="210" />
      </el-table>

      <div class="pager">
        <button disabled>‹</button>
        <button class="active">1</button>
        <button>2</button>
        <button>3</button>
        <button>4</button>
        <button>5</button>
        <button>6</button>
        <button>...</button>
        <button>11</button>
        <button>›</button>
        <span>Go to</span>
        <input value="1" />
        <span>Total 210</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const dateRange = ref('30')
const tradeType = ref('all')

const rows = [
  { time: '2026-05-21 13:00:55', type: '充值', id: 'b1bed71d-64fb-46fb-9483-b2306ea4715a', amount: 3, before: 0, after: 3, remark: '充值' },
  ...Array.from({ length: 20 }, (_, index) => {
    const before = Number(((index + 1) * 0.01).toFixed(2))
    return {
      time: `2026-05-20 12:${String(10 - Math.floor(index / 3)).padStart(2, '0')}:${String(59 - index * 3).padStart(2, '0')}`,
      type: '监控消耗',
      id: `${['e7961d68', '65d8d744', 'b334fc74', 'e1a7cab6'][index % 4]}-${String(4000 + index)}-4b7c-bf35-5afb088e7b22`,
      amount: -0.01,
      before,
      after: Number(Math.max(0, before - 0.01).toFixed(2)),
      remark: '大模型品牌监控+深度思考'
    }
  })
]

const pagedRows = computed(() => rows)
</script>

<style scoped>
.billing-page { min-height: calc(100vh - 108px); padding: 0 24px 32px; background: #f5f6f8; color: #111827; }
.page-card { max-width: 1320px; min-height: 980px; margin: 0 auto; padding: 28px 36px 32px; background: #fff; border-radius: 14px; }
.page-head { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 26px; }
.page-head h1 { margin: 0 0 8px; font-size: 22px; font-weight: 800; }
.page-head p { margin: 0; color: #7c8794; font-size: 14px; }
.head-actions { display: flex; align-items: center; gap: 16px; color: #374151; }
.remind { display: inline-flex; align-items: center; gap: 8px; font-size: 14px; }
.remind i { width: 28px; height: 16px; border-radius: 10px; background: #d1d5db; display: inline-block; }
.recharge-btn { height: 34px; border: 1px solid #e5eaf0; border-radius: 6px; background: #fff; padding: 0 14px; cursor: pointer; box-shadow: 0 2px 8px rgba(15,23,42,.06); }
.filters { display: flex; align-items: center; gap: 14px; margin: 0 0 28px 6px; }
.filters label { color: #374151; font-size: 14px; }
.filter-select { width: 150px; }
.summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 22px; }
.summary-card { height: 76px; border: 1px solid #e5eaf0; border-radius: 10px; padding: 14px 16px; box-shadow: 0 4px 14px rgba(15,23,42,.08); }
.summary-card span { display: block; color: #7c8794; font-size: 13px; margin-bottom: 8px; }
.summary-card strong { display: block; font-size: 24px; line-height: 1; }
.summary-card.red strong { color: #f00013; }
.summary-card.green strong { color: #00a862; }
.summary-card.blue strong { color: #2468ff; }
.summary-card.dark strong { color: #111827; }
.billing-table { width: 100%; color: #4b5563; font-size: 13px; }
.billing-table :deep(th.el-table__cell) { background: #fff; color: #6b7280; font-weight: 700; height: 40px; }
.billing-table :deep(td.el-table__cell) { height: 52px; }
.type-tag { display: inline-flex; padding: 3px 8px; border-radius: 4px; font-size: 12px; }
.type-tag.is-recharge { background: #e7f8dc; color: #52a51e; }
.type-tag.is-consume { background: #ffecec; color: #f05a5a; }
.money-plus { color: #00a862; font-weight: 700; }
.money-minus { color: #f00013; font-weight: 700; }
.pager { display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 28px; color: #6b7280; }
.pager button { min-width: 30px; height: 30px; border: 0; border-radius: 2px; background: #f1f4f8; color: #4b5563; cursor: pointer; }
.pager button.active { background: #2b8cff; color: #fff; }
.pager input { width: 52px; height: 28px; border: 1px solid #d9dee7; border-radius: 4px; text-align: center; }
</style>
