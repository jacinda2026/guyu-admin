<template>
  <section class="pricing-page">
    <el-card shadow="never" class="panel-card">
      <template #header>
        <div class="card-header">
          <div>
            <strong>计费规则详情</strong>
            <span>单价定义与账户欠费控制</span>
          </div>
          <div class="card-actions">
            <template v-if="isEditing">
              <el-button plain @click="addPricingRule">新增计费项目</el-button>
              <el-button plain @click="resetPricing">恢复默认</el-button>
              <el-button @click="cancelEdit">取消</el-button>
              <el-button type="primary" @click="confirmSavePricing">保存</el-button>
            </template>
            <el-button v-else type="primary" @click="startEdit">编辑</el-button>
          </div>
        </div>
      </template>

      <div class="threshold-panel">
        <div>
          <strong>账户欠费阈值设置</strong>
          <p>当账户欠费达到该金额时，系统将强制停止该账户下所有定时任务。</p>
        </div>
        <div class="threshold-control">
          <template v-if="isEditing">
            <span>欠费达到</span>
            <el-input-number
              v-model="draftOverdueThreshold"
              :min="0"
              :step="10"
              :precision="2"
              controls-position="right"
              class="threshold-input"
            />
            <span>元</span>
          </template>
          <template v-else>
            <span class="threshold-value">欠费 ¥{{ formatPrice(overdueThreshold) }}</span>
          </template>
        </div>
      </div>

      <el-table :data="tableRules" class="pricing-table" border>
        <el-table-column label="计费项目" min-width="170">
          <template #default="{ row, $index }">
            <el-input v-if="isEditing" v-model="draftRules[$index].name" placeholder="请输入计费项目" />
            <span v-else>{{ row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column label="说明" min-width="260">
          <template #default="{ row, $index }">
            <el-input v-if="isEditing" v-model="draftRules[$index].description" placeholder="请输入说明" />
            <span v-else>{{ row.description }}</span>
          </template>
        </el-table-column>
        <el-table-column label="计费单位" width="170" align="center">
          <template #default="{ row, $index }">
            <el-input v-if="isEditing" v-model="draftRules[$index].unit" placeholder="计费单位" />
            <span v-else>{{ row.unit }}</span>
          </template>
        </el-table-column>
        <el-table-column label="单价" width="180" align="right">
          <template #default="{ row, $index }">
            <el-input-number
              v-if="isEditing"
              v-model="draftRules[$index].unitPrice"
              :min="0"
              :step="0.01"
              :precision="2"
              controls-position="right"
              class="price-input"
            />
            <span v-else>¥{{ formatPrice(row.unitPrice) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="描述" min-width="240">
          <template #default="{ row }">
            <span class="price-line">{{ row.name }}:¥{{ formatPrice(row.unitPrice) }}/{{ row.unit }}</span>
          </template>
        </el-table-column>
        <el-table-column v-if="isEditing" label="操作" width="90" align="center" fixed="right">
          <template #default="{ $index }">
            <el-button link type="danger" @click="removePricingRule($index)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </section>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const defaultRules = [
  {
    key: 'base_model',
    name: '基础模型费用',
    description: '每个问题调用一个基础模型时产生的基础扣费。',
    unit: '问题/次/模型',
    unitPrice: 0.1
  },
  {
    key: 'deep_thinking',
    name: '深度思考功能',
    description: '启用深度思考能力后，按问题、次数和模型叠加计费。',
    unit: '问题/次/模型',
    unitPrice: 0.1
  },
  {
    key: 'screenshot_evidence',
    name: '截图存证功能',
    description: '启用截图存证后，按问题、次数和模型叠加计费。',
    unit: '问题/次/模型',
    unitPrice: 0.1
  },
  {
    key: 'ai_keyword_expansion',
    name: 'AI拓词',
    description: '调用一次生成10条问题。',
    unit: '次',
    unitPrice: 1
  },
  {
    key: 'ai_report',
    name: 'AI报告',
    description: '调用一次生成一份报告。',
    unit: '次',
    unitPrice: 1
  }
]

const pricingRules = reactive(defaultRules.map(item => ({ ...item })))
const draftRules = reactive(defaultRules.map(item => ({ ...item })))
const overdueThreshold = ref(100)
const draftOverdueThreshold = ref(100)
const isEditing = ref(false)

const tableRules = computed(() => (isEditing.value ? draftRules : pricingRules))

const formatPrice = value => Number(value || 0).toFixed(2)

const replaceRules = (target, source) => {
  target.splice(0, target.length, ...source.map(item => ({ ...item })))
}

const syncDraft = () => {
  replaceRules(draftRules, pricingRules)
  draftOverdueThreshold.value = overdueThreshold.value
}

const startEdit = () => {
  syncDraft()
  isEditing.value = true
}

const cancelEdit = () => {
  syncDraft()
  isEditing.value = false
}

const addPricingRule = () => {
  draftRules.push({
    key: `custom_${Date.now()}`,
    name: '',
    description: '',
    unit: '次',
    unitPrice: 0
  })
}

const removePricingRule = index => {
  draftRules.splice(index, 1)
}

const resetPricing = () => {
  replaceRules(draftRules, defaultRules)
  draftOverdueThreshold.value = 100
  ElMessage.success('已恢复默认定价')
}

const validateDraftRules = () => {
  const invalidRule = draftRules.find(item => !item.name.trim() || !item.unit.trim())
  if (invalidRule) {
    ElMessage.warning('请完善计费项目和计费单位')
    return false
  }
  return true
}

const confirmSavePricing = async () => {
  if (!validateDraftRules()) return

  try {
    await ElMessageBox.confirm(
      '调整费用定价和账户欠费阈值会影响后续计费与定时任务执行，请确认是否保存本次修改？',
      '确认保存费用定价',
      {
        type: 'warning',
        confirmButtonText: '确认保存',
        cancelButtonText: '取消'
      }
    )
    replaceRules(pricingRules, draftRules)
    overdueThreshold.value = draftOverdueThreshold.value
    isEditing.value = false
    ElMessage.success('费用定价已保存')
  } catch {
    ElMessage.info('已取消保存')
  }
}
</script>

<style scoped>
.pricing-page { min-height: 100%; padding: 28px 36px; background: #f5f7fb; color: #1f2937; }
.card-actions { display: flex; align-items: center; gap: 12px; }
.panel-card { border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 18px; }
.card-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.card-header > div:first-child { display: flex; flex-direction: column; gap: 4px; }
.card-header strong { color: #111827; font-size: 16px; }
.card-header span { color: #6b7280; font-size: 13px; }
.threshold-panel { display: flex; align-items: center; justify-content: space-between; gap: 18px; padding: 14px 16px; margin-bottom: 16px; border: 1px solid #fde68a; border-radius: 8px; background: #fffbeb; }
.threshold-panel strong { color: #111827; font-size: 15px; }
.threshold-panel p { margin: 6px 0 0; color: #92400e; font-size: 13px; }
.threshold-control { display: flex; align-items: center; gap: 10px; color: #6b7280; white-space: nowrap; }
.threshold-input { width: 150px; }
.threshold-value { color: #b45309; font-size: 16px; font-weight: 800; }
.pricing-table { width: 100%; }
.pricing-table :deep(th.el-table__cell) { background: #f8fafc; color: #4b5563; font-weight: 700; }
.price-input { width: 130px; }
.price-line { color: #111827; font-weight: 600; white-space: nowrap; }

@media (max-width: 980px) {
  .pricing-page { padding: 20px; }
  .card-actions { flex-wrap: wrap; }
  .card-header,
  .threshold-panel { align-items: flex-start; flex-direction: column; }
  .threshold-control { flex-wrap: wrap; }
}
</style>
