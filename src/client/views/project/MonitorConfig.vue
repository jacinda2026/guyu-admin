<template>
  <div class="config-page monitor-config-page">
    <section class="monitor-card">
      <el-button type="primary" class="edit-btn" @click="handleEditSave">
        {{ editing ? '保存' : '编辑' }}
      </el-button>

      <div class="config-section monitor-basic monitor-create-section">
        <div class="section-bar monitor-title-bar">
          <div class="section-title-with-switch">
            <el-tooltip
              placement="top"
              effect="dark"
              content="开启后，会按照监控周期自动执行监控任务。
每日：每天执行；
每周：可选择周一至周日，支持多选；
间隔：从开始日期起，按指定天数间隔执行。"
            >
              <div class="section-title tooltip-title">监控配置</div>
            </el-tooltip>
            <el-switch v-model="enabled" :disabled="!editing" active-text="开" inactive-text="关" inline-prompt />
          </div>
        </div>

        <div class="monitor-form-row monitor-row-main">
          <div class="inline-form-item">
            <span class="inline-label">监控周期</span>
            <el-select v-model="basic.period" :disabled="!editing" class="period-select">
              <el-option label="每日" value="daily" />
              <el-option label="每周" value="weekly" />
              <el-option label="间隔" value="interval" />
            </el-select>
          </div>

          <el-checkbox-group
            v-if="basic.period === 'weekly'"
            v-model="basic.weekdays"
            class="weekday-list"
          >
            <el-checkbox
              v-for="day in weekdayOptions"
              :key="day.value"
              :label="day.value"
              :disabled="!editing"
            >{{ day.label }}</el-checkbox>
          </el-checkbox-group>

          <template v-if="basic.period === 'interval'">
            <div class="inline-form-item">
              <span class="inline-label">开始日期</span>
              <el-date-picker
                v-model="basic.startDate"
                :disabled="!editing"
                type="date"
                format="YYYY/MM/DD"
                value-format="YYYY/MM/DD"
                class="date-picker compact-date-picker"
              />
            </div>
            <div class="inline-form-item">
              <span class="inline-label">间隔天数</span>
              <el-input-number
                v-model="basic.intervalDays"
                :disabled="!editing"
                :min="1"
                :max="365"
                controls-position="right"
                class="small-number"
              />
            </div>
          </template>

          <div class="inline-form-item daily-count-item">
            <span class="inline-label">单日次数</span>
            <el-input-number
              v-model="basic.askTimes"
              :disabled="!editing"
              :min="1"
              :max="24"
              controls-position="right"
              class="small-number"
            />
          </div>

          <div v-if="basic.askTimes === 1" class="inline-form-item execute-time-inline single-time-inline">
            <span class="inline-label">执行时间</span>
            <div class="time-list">
              <el-time-picker
                v-model="basic.splitTimes[0]"
                :disabled="!editing"
                format="HH:mm"
                value-format="HH:mm"
                :clearable="false"
                class="time-picker compact-time"
              />
            </div>
          </div>
        </div>

        <div v-if="basic.askTimes > 1" class="monitor-form-row execute-row-inline">
          <div class="inline-form-item">
            <span class="inline-label">执行方式</span>
            <el-segmented
              v-model="basic.executionMode"
              :disabled="!editing"
              :options="executeModeOptions"
            />
          </div>
          <div class="inline-form-item execute-time-inline">
            <span class="inline-label">执行时间</span>
            <div v-show="basic.executionMode === 'continuous'" class="time-list">
              <el-tooltip
                effect="dark"
                placement="top"
                :content="`从该时间开始连续执行 ${basic.askTimes} 次`"
              >
                <el-time-picker
                  v-model="basic.executionTime"
                  :disabled="!editing"
                  format="HH:mm"
                  value-format="HH:mm"
                  :clearable="false"
                  class="time-picker compact-time"
                />
              </el-tooltip>
            </div>
            <div v-show="basic.executionMode === 'split'" class="time-list">
              <el-tooltip
                v-for="(_, index) in basic.splitTimes"
                :key="index"
                effect="dark"
                placement="top"
                :content="`按多个时间点分时执行 ${basic.askTimes} 次，默认均匀分配，可手动调整`"
              >
                <el-time-picker
                  v-model="basic.splitTimes[index]"
                  :disabled="!editing"
                  format="HH:mm"
                  value-format="HH:mm"
                  :clearable="false"
                  class="time-picker compact-time"
                />
              </el-tooltip>
            </div>
          </div>
        </div>
      </div>

      <div class="config-section model-config-section">
        <div class="section-title">模型配置</div>

        <div class="channel-panel">
          <div class="channel-title">采集通道</div>
          <div class="channel-options" :class="{ 'is-disabled': !editing }">
            <button
              type="button"
              class="channel-option"
              :class="{ active: collectChannel === 'standard' }"
              :disabled="!editing"
              @click="collectChannel = 'standard'"
            >
              <span class="channel-check">✓</span>
              <span class="channel-title-row">
                <span class="channel-name">标准通道</span>
                <span class="channel-tag">日常监控</span>
              </span>
              <span class="channel-features">含标准能力：联网搜索、答案采集、信源采集</span>
            </button>
            <button
              type="button"
              class="channel-option"
              :class="{ active: collectChannel === 'enhanced' }"
              :disabled="!editing"
              @click="collectChannel = 'enhanced'"
            >
              <span class="channel-check">✓</span>
              <span class="channel-title-row">
                <span class="channel-name">增强通道</span>
                <span class="channel-tag">能力完整</span>
              </span>
              <span class="channel-features">含完整能力：联网搜索、答案采集、信源采集、深度思考、全部截图、提及截图</span>
            </button>
          </div>
        </div>

        <div class="model-subtitle">监控模型</div>
        <div class="model-grid model-grid-simple">
          <div
            v-for="model in models"
            :key="model.name"
            class="model-card simple-model-card"
            :class="{ 'enhanced-model-card': collectChannel === 'enhanced', 'model-enabled': model.enabled }"
          >
            <el-checkbox v-model="model.enabled" :disabled="!editing" class="model-main-check">
              {{ model.name }}
            </el-checkbox>

            <div v-if="collectChannel === 'enhanced'" class="model-enhanced-config">
              <el-checkbox
                v-model="model.deepThinking"
                :disabled="!editing || !model.enabled"
                class="child-check deep-thinking-check"
              >深度思考</el-checkbox>

              <div class="screenshot-checks">
                <el-checkbox
                  v-model="model.allScreenshot"
                  :disabled="!editing || !model.enabled"
                  class="child-check"
                  @change="value => handleScreenshotChange(model, 'all', value)"
                >全部截图</el-checkbox>
                <el-checkbox
                  v-model="model.mentionScreenshot"
                  :disabled="!editing || !model.enabled"
                  class="child-check"
                  @change="value => handleScreenshotChange(model, 'mention', value)"
                >提及截图</el-checkbox>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="config-section metric-section">
        <div class="section-title">监控达标规则</div>
        <div class="section-desc">设置项目的监控结果判断标准，用于判断每次任务、日报、周报、月报是否达标。</div>
        <div class="metric-grid">
          <div class="metric-item">
            <el-checkbox v-model="metrics.mentionRate" :disabled="!editing">提及率</el-checkbox>
            <el-input-number
              v-model="metrics.mentionRateTarget"
              :disabled="!editing"
              :min="0"
              :max="100"
              controls-position="right"
              class="metric-number"
            />
            <span class="unit">%</span>
          </div>

          <div class="metric-item">
            <el-checkbox v-model="metrics.avgRank" :disabled="!editing">平均顺位</el-checkbox>
            <el-select v-model="metrics.avgRankTarget" :disabled="!editing" class="mini-select">
              <el-option label="前三" value="top3" />
              <el-option label="前五" value="top5" />
              <el-option label="前十" value="top10" />
            </el-select>
          </div>

          <div class="metric-item">
            <el-checkbox v-model="metrics.monthlyDays" :disabled="!editing" @change="handleMonthlyDaysChange">每月达标天数</el-checkbox>
            <el-input-number
              v-model="metrics.monthlyDaysTarget"
              :disabled="!editing"
              :min="1"
              :max="31"
              controls-position="right"
              class="metric-number"
            />
          </div>
        </div>
      </div>

    </section>
  </div>
</template>

<script setup>
import { reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const MONITOR_METRIC_CONFIG_KEY = 'guyu-monitor-metric-config'
const editing = ref(false)

const handleEditSave = async () => {
  if (!editing.value) {
    editing.value = true
    return
  }

  if (metrics.monthlyDays && basic.period !== 'daily') {
    ElMessage.warning('每月达标天数需要监控周期选择每日，否则无法统计该指标')
    return
  }

  try {
    await ElMessageBox.confirm(
      '保存后会立即生效，是否确认保存当前监控配置？',
      '确认保存',
      {
        confirmButtonText: '确认保存',
        cancelButtonText: '取消',
        type: 'warning',
        closeOnClickModal: false,
        closeOnPressEscape: false
      }
    )
    saveMonitorMetricConfig()
    editing.value = false
    ElMessage.success('保存成功，配置已立即生效')
  } catch (error) {
    // 用户取消保存，继续保持编辑状态
  }
}

const enabled = ref(true)
const basic = reactive({
  period: 'daily',
  askTimes: 1,
  executionMode: 'split',
  executionTime: '02:00',
  weekdays: ['mon'],
  startDate: '2026/05/12',
  intervalDays: 2,
  splitTimes: ['02:00']
})



const executeModeOptions = [
  { label: '连续完成', value: 'continuous' },
  { label: '分时执行', value: 'split' }
]

const weekdayOptions = [
  { label: '周一', value: 'mon' },
  { label: '周二', value: 'tue' },
  { label: '周三', value: 'wed' },
  { label: '周四', value: 'thu' },
  { label: '周五', value: 'fri' },
  { label: '周六', value: 'sat' },
  { label: '周日', value: 'sun' }
]

const generateEvenTimes = count => {
  const safeCount = Math.max(1, Number(count) || 1)
  if (safeCount === 1) return ['02:00']

  const minutesStep = Math.floor((24 * 60) / safeCount)
  return Array.from({ length: safeCount }, (_, index) => {
    const totalMinutes = index * minutesStep
    const hours = String(Math.floor(totalMinutes / 60)).padStart(2, '0')
    const minutes = String(totalMinutes % 60).padStart(2, '0')
    return `${hours}:${minutes}`
  })
}

basic.splitTimes = generateEvenTimes(basic.askTimes)

watch(
  () => basic.askTimes,
  value => {
    basic.splitTimes = generateEvenTimes(value)
  }
)
const collectChannel = ref('standard')
const models = reactive([
  { name: '豆包', enabled: true, deepThinking: true, allScreenshot: true, mentionScreenshot: false },
  { name: '元宝', enabled: true, deepThinking: true, allScreenshot: false, mentionScreenshot: true },
  { name: 'DeepSeek', enabled: true, deepThinking: true, allScreenshot: false, mentionScreenshot: false },
  { name: '通义千问', enabled: true, deepThinking: true, allScreenshot: true, mentionScreenshot: false },
  { name: '文心一言', enabled: true, deepThinking: false, allScreenshot: false, mentionScreenshot: false },
  { name: 'Kimi', enabled: true, deepThinking: false, allScreenshot: false, mentionScreenshot: true }
])

const handleScreenshotChange = (model, type, value) => {
  if (!value) return
  if (type === 'all') {
    model.mentionScreenshot = false
  }
  if (type === 'mention') {
    model.allScreenshot = false
  }
}
const metrics = reactive({
  mentionRate: false,
  mentionRateTarget: 70,
  avgRank: false,
  avgRankTarget: 'top3',
  monthlyDays: false,
  monthlyDaysTarget: 22
})
const loadMonitorMetricConfig = () => {
  try {
    const raw = localStorage.getItem(MONITOR_METRIC_CONFIG_KEY)
    if (!raw) return
    const saved = JSON.parse(raw)
    Object.assign(metrics, {
      mentionRate: Boolean(saved.mentionRate?.enabled),
      mentionRateTarget: saved.mentionRate?.target ?? metrics.mentionRateTarget,
      avgRank: Boolean(saved.avgRank?.enabled),
      avgRankTarget: saved.avgRank?.target ?? metrics.avgRankTarget,
      monthlyDays: Boolean(saved.monthlyDays?.enabled),
      monthlyDaysTarget: saved.monthlyDays?.target ?? metrics.monthlyDaysTarget
    })
  } catch (error) {
    localStorage.removeItem(MONITOR_METRIC_CONFIG_KEY)
  }
}
const saveMonitorMetricConfig = () => {
  localStorage.setItem(MONITOR_METRIC_CONFIG_KEY, JSON.stringify({
    mentionRate: { enabled: metrics.mentionRate, target: metrics.mentionRateTarget },
    avgRank: { enabled: metrics.avgRank, target: metrics.avgRankTarget },
    monthlyDays: { enabled: metrics.monthlyDays, target: metrics.monthlyDaysTarget }
  }))
}
loadMonitorMetricConfig()
const handleMonthlyDaysChange = (value) => {
  if (!value || basic.period === 'daily') return
  metrics.monthlyDays = false
  ElMessage.warning('每月达标天数需要监控周期选择每日，否则无法统计该指标')
}
watch(
  () => basic.period,
  value => {
    if (value !== 'daily' && metrics.monthlyDays) {
      metrics.monthlyDays = false
      ElMessage.warning('每月达标天数需要监控周期选择每日，否则无法统计该指标')
    }
  }
)
</script>

<style scoped>
.config-page {
  --brand-blue: #2563eb;
  --brand-blue-light: #eff6ff;
  --brand-blue-soft: #dbeafe;
  --el-color-primary: var(--brand-blue);
  min-height: 100vh;
  background: #eef1f5;
  padding: 16px 18px 80px;
  color: #111827;
  box-sizing: border-box;
}

.monitor-card {
  width: 100%;
  max-width: 1220px;
  min-height: calc(100vh - 96px);
  background: #fff;
  border-radius: 8px;
  padding: 28px 48px 64px;
  box-sizing: border-box;
  position: relative;
  overflow: hidden;
}

.edit-btn {
  position: absolute;
  right: 48px;
  top: 32px;
  min-width: 72px;
  height: 40px;
  border-radius: 4px;
}

.config-section {
  margin-bottom: 48px;
}

.section-title {
  border-left: 4px solid #1f2937;
  padding-left: 10px;
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 14px;
  line-height: 1;
}

.section-desc {
  margin: 0 0 18px 14px;
  color: #8a95a6;
  font-size: 13px;
}

.basic-row {
  display: flex;
  flex-direction: column;
  gap: 22px;
  padding-left: 34px;
}

.schedule-row {
  max-width: 1060px;
}

.schedule-line {
  display: flex;
  align-items: center;
  gap: 20px 28px;
  flex-wrap: wrap;
}

.ask-line {
  display: flex;
  align-items: flex-start;
  gap: 18px 28px;
  flex-wrap: wrap;
  width: 100%;
}

.schedule-tip {
  margin: -10px 0 22px 34px;
  max-width: 880px;
  padding: 12px 14px;
  border-radius: 8px;
  background: #fff7ed;
  border: 1px solid #fed7aa;
  color: #9a3412;
  font-size: 13px;
  line-height: 20px;
}

.tip-title {
  font-weight: 800;
  margin-right: 8px;
}

.form-item {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: auto;
  min-height: 40px;
}

.compact-form-item {
  gap: 12px;
}

.form-item-ask,
.form-item-exec-mode {
  align-items: center;
  height: 40px;
}

.form-item label {
  color: #111827;
  font-size: 16px;
  line-height: 40px;
  white-space: nowrap;
}

.small-select {
  width: 150px;
}

.ask-number {
  width: 140px;
}

.form-item-times {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  min-width: 0;
  min-height: 40px;
  flex: 0 0 100%;
  width: 100%;
  flex-wrap: nowrap;
  margin-top: 2px;
}

.form-item-times > label {
  flex: 0 0 auto;
  height: 40px;
  line-height: 40px;
  align-self: start;
}

.execution-time-control-shell {
  min-width: 0;
  min-height: 40px;
  padding-top: 0;
  display: block;
  flex: 1 1 auto;
  max-width: calc(100% - 88px);
}

.continuous-time-control,
.split-time-list {
  min-height: 40px;
  align-items: flex-start;
}

.continuous-time-control {
  display: flex;
}

.time-picker {
  width: 112px !important;
}

.single-time-picker,
.split-time-picker {
  height: 40px;
  line-height: 40px;
  vertical-align: top;
}

.single-time-picker {
  flex: 0 0 112px;
  width: 112px !important;
}

.time-picker :deep(.el-input__wrapper),
.single-time-picker :deep(.el-input__wrapper),
.split-time-picker :deep(.el-input__wrapper),
.ask-number :deep(.el-input__wrapper),
.execution-mode-group :deep(.el-radio-button__inner) {
  height: 40px;
  min-height: 40px;
  box-sizing: border-box;
}

.time-picker :deep(.el-input__inner),
.single-time-picker :deep(.el-input__inner),
.split-time-picker :deep(.el-input__inner),
.ask-number :deep(.el-input__inner) {
  height: 38px;
  line-height: 38px;
}

.execution-mode-group {
  height: 40px;
  display: inline-flex;
  align-items: stretch;
  vertical-align: top;
}

.execution-mode-group :deep(.el-radio-button__inner) {
  height: 40px;
  padding: 0 16px;
  line-height: 38px;
  font-weight: 600;
}

.split-time-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 10px;
  width: 100%;
  max-width: 100%;
  align-content: flex-start;
}

.split-time-picker {
  flex: 0 0 112px;
  width: 112px !important;
  max-width: 112px;
}

.split-time-picker :deep(.el-input__wrapper) {
  border-radius: 8px;
}

.split-time-list :deep(.el-date-editor.el-input),
.split-time-list :deep(.el-date-editor.el-input__wrapper),
.split-time-list :deep(.el-input),
.continuous-time-control :deep(.el-date-editor.el-input),
.continuous-time-control :deep(.el-input) {
  width: 112px !important;
  max-width: 112px !important;
}


.execution-note {
  color: #64748b;
  font-size: 13px;
  white-space: nowrap;
}

.date-picker {
  width: 170px;
}

.interval-number {
  width: 120px;
}

.form-item-weekly {
  flex: 1 1 520px;
  min-width: 420px;
}

.weekday-inline-group {
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
}

.weekday-inline-item {
  margin-right: 0;
}

.weekday-inline-item :deep(.el-checkbox__label) {
  font-size: 16px;
  font-weight: 600;
  color: #243244;
}

.weekday-inline-item :deep(.el-checkbox__input.is-checked + .el-checkbox__label) {
  color: var(--brand-blue);
  font-weight: 700;
}

.model-config-section {
  margin-bottom: 44px;
}

.channel-panel {
  margin-left: 34px;
  max-width: 980px;
  background: #f8fafc;
  border: 1px solid #dbe3ee;
  border-radius: 8px;
  padding: 18px 20px;
  box-sizing: border-box;
  margin-bottom: 24px;
}

.channel-title {
  font-size: 16px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 12px;
}

.channel-options {
  display: grid;
  grid-template-columns: repeat(2, minmax(260px, 1fr));
  gap: 14px;
}

.channel-option {
  position: relative;
  min-height: 104px;
  padding: 14px 16px 14px 42px;
  border: 2px solid #cbd5e1;
  border-radius: 10px;
  background: #ffffff;
  color: #1f2937;
  text-align: left;
  cursor: pointer;
  box-sizing: border-box;
  transition: border-color 0.18s ease, background-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
}

.channel-option:hover:not(:disabled) {
  border-color: #60a5fa;
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.14);
  transform: translateY(-1px);
}

.channel-option.active {
  border-color: #2563eb;
  background: linear-gradient(180deg, #eff6ff 0%, #dbeafe 100%);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.14), 0 8px 18px rgba(37, 99, 235, 0.16);
}

.channel-option:disabled {
  cursor: default;
  opacity: 1;
}

.channel-option.active:disabled {
  border-color: #2563eb;
  background: #dbeafe;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.channel-check {
  position: absolute;
  left: 14px;
  top: 17px;
  width: 20px;
  height: 20px;
  border-radius: 999px;
  border: 2px solid #cbd5e1;
  color: transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 800;
  line-height: 1;
  box-sizing: border-box;
}

.channel-option.active .channel-check {
  background: #2563eb;
  border-color: #2563eb;
  color: #ffffff;
}

.channel-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.channel-name {
  display: inline-flex;
  font-size: 16px;
  font-weight: 800;
  line-height: 22px;
  color: #111827;
}

.channel-option.active .channel-name {
  color: #1d4ed8;
}

.channel-tag {
  display: inline-flex;
  margin-top: 0;
  padding: 2px 8px;
  border-radius: 999px;
  background: #f1f5f9;
  color: #475569;
  font-size: 12px;
  font-weight: 600;
  line-height: 18px;
}

.channel-option.active .channel-tag {
  background: #2563eb;
  color: #ffffff;
}

.channel-features {
  display: block;
  margin-top: 8px;
  color: #475569;
  font-size: 13px;
  line-height: 18px;
  font-weight: 500;
}

.channel-option.active .channel-features {
  color: #1e40af;
}

.model-subtitle {
  margin-left: 34px;
  margin-bottom: 12px;
  font-size: 16px;
  font-weight: 700;
  color: #111827;
}

.model-grid {
  padding-left: 34px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  align-items: stretch;
  max-width: 980px;
}

.model-grid-simple {
  grid-template-columns: repeat(3, minmax(160px, 1fr));
}

.model-card {
  background: #f8fafc;
  border: 1px solid #dbe3ee;
  border-radius: 10px;
  padding: 14px 16px;
  box-sizing: border-box;
  overflow: hidden;
  transition: border-color 0.18s ease, background-color 0.18s ease, box-shadow 0.18s ease;
}

.model-card.model-enabled {
  border-color: var(--brand-blue);
  background: var(--brand-blue-light);
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.08);
}

.simple-model-card {
  min-height: 58px;
  display: flex;
  align-items: center;
}

.enhanced-model-card {
  min-height: 144px;
  align-items: flex-start;
  flex-direction: column;
  gap: 12px;
}

.model-main-check {
  width: 100%;
  font-weight: 800;
}

.model-main-check :deep(.el-checkbox__label) {
  font-size: 15px;
  font-weight: 800;
  color: #1f2937;
}

.model-card.model-enabled .model-main-check :deep(.el-checkbox__label) {
  color: var(--brand-blue);
}

.model-enhanced-config {
  width: 100%;
  padding: 12px 12px 10px;
  border-top: 1px solid #bfdbfe;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.72);
  display: flex;
  flex-direction: column;
  gap: 10px;
  box-sizing: border-box;
}

.model-enhanced-config :deep(.el-checkbox__label) {
  font-size: 13px;
  font-weight: 500;
  color: #475569;
}

.model-enhanced-config :deep(.el-checkbox__input.is-checked + .el-checkbox__label) {
  color: var(--brand-blue);
  font-weight: 700;
}

.child-check {
  margin-right: 0;
}

.deep-thinking-check {
  width: fit-content;
}

.screenshot-checks {
  display: flex;
  align-items: center;
  gap: 18px;
  flex-wrap: wrap;
}

.screenshot-checks :deep(.el-checkbox) {
  margin-right: 0;
}

.metric-grid {
  padding-left: 34px;
  display: grid;
  grid-template-columns: repeat(2, minmax(220px, 280px));
  gap: 22px 36px;
  align-items: center;
  max-width: 680px;
}

.metric-item {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.metric-number {
  width: 110px;
  flex: 0 0 auto;
}

.unit {
  font-weight: 600;
  color: #111827;
}

.mini-select {
  width: 100px;
}

:deep(.el-checkbox),
:deep(.el-radio) {
  color: #243244;
}

:deep(.el-checkbox__label),
:deep(.el-radio__label) {
  font-size: 14px;
  line-height: 20px;
  padding-left: 8px;
  color: #243244;
}


:deep(.el-checkbox__input.is-checked .el-checkbox__inner),
:deep(.el-radio__input.is-checked .el-radio__inner) {
  background-color: var(--brand-blue);
  border-color: var(--brand-blue);
}

:deep(.el-checkbox__input.is-checked + .el-checkbox__label),
:deep(.el-radio__input.is-checked + .el-radio__label) {
  color: var(--brand-blue);
}

/* 只禁止编辑，不降低可读性 */
:deep(.el-checkbox.is-disabled),
:deep(.el-radio.is-disabled),
:deep(.el-checkbox.is-disabled .el-checkbox__label),
:deep(.el-radio.is-disabled .el-radio__label) {
  color: #334155;
  cursor: default;
  opacity: 1;
}

:deep(.el-checkbox__input.is-disabled .el-checkbox__inner),
:deep(.el-radio__input.is-disabled .el-radio__inner) {
  background-color: #fff;
  border-color: #cbd5e1;
}

:deep(.el-checkbox__input.is-disabled.is-checked .el-checkbox__inner),
:deep(.el-radio__input.is-disabled.is-checked .el-radio__inner) {
  background-color: var(--brand-blue);
  border-color: var(--brand-blue);
}

:deep(.el-checkbox__input.is-disabled.is-checked .el-checkbox__inner::after) {
  border-color: #fff;
}

:deep(.el-radio__input.is-disabled.is-checked .el-radio__inner::after) {
  background-color: #fff;
}

:deep(.el-input.is-disabled .el-input__wrapper),
:deep(.el-select .el-input.is-disabled .el-input__wrapper),
:deep(.el-input-number.is-disabled .el-input__wrapper) {
  background-color: #f8fafc;
  border: 1px solid #d7dee8;
  box-shadow: none;
  opacity: 1;
}

:deep(.el-input.is-disabled .el-input__inner),
:deep(.el-select .el-input.is-disabled .el-input__inner),
:deep(.el-input-number.is-disabled .el-input__inner) {
  color: #334155;
  -webkit-text-fill-color: #334155;
}

:deep(.el-input-number.is-disabled .el-input-number__decrease),
:deep(.el-input-number.is-disabled .el-input-number__increase) {
  background-color: #eef2f7;
  border-color: #d7dee8;
  color: #64748b;
}

@media (max-width: 900px) {
  .monitor-card {
    padding: 24px 24px 48px;
  }

  .edit-btn {
    right: 24px;
  }

  .basic-row,
  .model-grid,
  .metric-grid {
    padding-left: 12px;
  }

 .schedule-tip {
    margin-left: 12px;
  }

  .channel-panel,
  .model-subtitle {
    margin-left: 12px;
  }

  .channel-options {
    grid-template-columns: 1fr;
  }

  .model-grid-simple {
    grid-template-columns: 1fr;
  }

  .ask-line {
    grid-template-columns: 1fr;
  }

  .metric-grid {
    grid-template-columns: 1fr;
  }

  .form-item-times {
    flex-basis: 100%;
  }
}


/* 与创建项目保持一致的监控配置布局 */
.monitor-basic.monitor-create-section {
  margin-bottom: 44px;
}
.monitor-title-bar {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  margin-bottom: 14px;
}
.section-title-with-switch {
  display: inline-flex;
  align-items: center;
  gap: 12px;
}
.section-title-with-switch .section-title {
  margin-bottom: 0;
}
.tooltip-title {
  cursor: help;
}
.monitor-form-row {
  display: flex;
  align-items: center;
  gap: 16px 24px;
  flex-wrap: wrap;
  margin: 0 0 16px 34px;
  max-width: 1060px;
}
.monitor-row-main {
  align-items: center;
}
.execute-row-inline {
  align-items: flex-start;
}
.inline-form-item {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  min-height: 40px;
}
.inline-label {
  white-space: nowrap;
  color: #111827;
  font-weight: 700;
  font-size: 15px;
  line-height: 40px;
}
.period-select {
  width: 128px;
}
.compact-date-picker,
.date-picker.compact-date-picker {
  width: 150px;
}
.small-number {
  width: 96px;
}
.weekday-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 18px;
}
.weekday-list :deep(.el-checkbox) {
  margin-right: 0;
}
.execute-time-inline {
  align-items: flex-start;
  flex: 1 1 auto;
  min-width: 0;
}
.single-time-inline {
  flex: 0 0 auto;
}
.time-list {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  max-width: 100%;
  min-height: 40px;
}
.compact-time,
.time-picker.compact-time {
  width: 92px !important;
  flex: 0 0 92px;
}
.compact-time :deep(.el-input__wrapper) {
  padding-left: 6px;
  padding-right: 6px;
}
.compact-time :deep(.el-input__prefix),
.compact-time :deep(.el-input__suffix) {
  display: none;
}
.compact-time :deep(.el-input__inner) {
  text-align: center;
}


/* 创建项目同款：监控配置显示态/编辑态保持同一布局，仅禁用交互 */
.monitor-create-section .section-bar {
  margin-bottom: 12px;
}

.monitor-create-section .section-title {
  margin-bottom: 0;
}

.monitor-form-row {
  display: flex !important;
  align-items: center !important;
  gap: 16px 24px !important;
  flex-wrap: wrap !important;
  margin: 0 0 16px 34px !important;
  max-width: 1060px !important;
}

.monitor-row-main {
  align-items: center !important;
}

.execute-row-inline {
  align-items: flex-start !important;
}

.inline-form-item {
  display: inline-flex !important;
  align-items: center !important;
  gap: 12px !important;
  min-height: 40px !important;
}

.execute-time-inline {
  align-items: flex-start !important;
  flex: 1 1 auto !important;
  min-width: 0 !important;
}

.single-time-inline {
  flex: 0 0 auto !important;
}

.inline-label {
  white-space: nowrap !important;
  color: #111827 !important;
  font-weight: 700 !important;
  font-size: 15px !important;
  line-height: 40px !important;
}

.period-select {
  width: 128px !important;
}

.compact-date-picker,
.date-picker.compact-date-picker {
  width: 150px !important;
}

.small-number {
  width: 96px !important;
}

.weekday-list {
  display: flex !important;
  flex-wrap: wrap !important;
  gap: 8px 18px !important;
}

.weekday-list :deep(.el-checkbox) {
  margin-right: 0 !important;
}

.time-list {
  display: flex !important;
  align-items: center !important;
  flex-wrap: wrap !important;
  gap: 8px !important;
  max-width: 100% !important;
  min-height: 40px !important;
}

.compact-time,
.time-picker.compact-time {
  width: 92px !important;
  flex: 0 0 92px !important;
  max-width: 92px !important;
}

.compact-time :deep(.el-input__wrapper) {
  padding-left: 6px !important;
  padding-right: 6px !important;
}

.compact-time :deep(.el-input__prefix),
.compact-time :deep(.el-input__suffix) {
  display: none !important;
}

.compact-time :deep(.el-input__inner) {
  text-align: center !important;
}

.monitor-create-section :deep(.el-input.is-disabled .el-input__wrapper),
.monitor-create-section :deep(.el-select .el-input.is-disabled .el-input__wrapper),
.monitor-create-section :deep(.el-input-number.is-disabled .el-input__wrapper) {
  background-color: #f8fafc !important;
  border: 1px solid #d7dee8 !important;
  box-shadow: none !important;
  opacity: 1 !important;
}

.monitor-create-section :deep(.el-input.is-disabled .el-input__inner),
.monitor-create-section :deep(.el-select .el-input.is-disabled .el-input__inner),
.monitor-create-section :deep(.el-input-number.is-disabled .el-input__inner) {
  color: #334155 !important;
  -webkit-text-fill-color: #334155 !important;
}

@media (max-width: 900px) {
  .monitor-form-row {
    margin-left: 12px !important;
  }
}

</style>
