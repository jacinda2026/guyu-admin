<template>
  <div class="project-center-container">
    <div class="page-header mb-20">
      <div>
        <h2 class="page-title">项目中心</h2>
        <p class="page-subtitle">管理全量 AI 舆情与 GEO 监控项目，实时追踪诊断周期、模型覆盖面及数据更新状态。</p>
      </div>
    </div>

    <el-card shadow="never" class="table-card mb-20">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="项目名称：">
          <el-input v-model="searchForm.projectName" placeholder="请输入项目名称" clearable style="width: 200px;" />
        </el-form-item>
        <el-form-item label="用户信息：">
          <el-input v-model="searchForm.userInfo" placeholder="请输入用户信息" clearable style="width: 200px;" />
        </el-form-item>
        <el-form-item class="search-actions">
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
        <el-form-item class="search-create-action">
          <el-button type="primary" class="create-project-btn" @click="openCreateProject">+ 创建项目</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="table-card">
      <el-table :data="tableData" style="width: 100%" :header-cell-style="{'text-align': 'center', 'background-color': '#f9fafc', 'color': '#333'}">
        <el-table-column label="项目名称" align="center" min-width="140">
          <template #default="{ row }">
            <el-link type="primary" :underline="false" class="project-link" @click="enterProjectWorkspace(row)">
              {{ row.projectName }}
            </el-link>
          </template>
        </el-table-column>

        <el-table-column prop="userInfo" label="用户信息" align="center" width="100" />
        <el-table-column prop="questionCount" label="问题数" align="center" width="80" />

        <el-table-column label="监控模型" align="center" min-width="180">
          <template #default="{ row }">
            <div class="model-icons">
              <el-tooltip v-for="(model, index) in row.models" :key="index" :content="model.name" placement="top">
                <span class="model-badge" :class="model.class">
                  {{ model.label }}
                </span>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="cycle" label="监控周期" align="center" width="100" />

        <el-table-column label="监控状态" align="center" width="100">
          <template #default="{ row }">
            <span :class="['status-text', getStatusClass(row.status)]">{{ row.status }}</span>
          </template>
        </el-table-column>

        <el-table-column label="执行进度" align="center" min-width="260">
          <template #default="{ row }">
            <div v-if="row.executionProgress?.running" class="run-progress-cell">
              <div class="run-model-progress-list">
                <span
                  v-for="model in row.executionProgress.models"
                  :key="model.name"
                  class="run-model-progress"
                >
                  {{ model.name }} {{ model.completedQuestions }}/{{ model.totalQuestions }}
                </span>
              </div>
            </div>
            <span v-else class="run-progress-idle">-</span>
          </template>
        </el-table-column>

        <el-table-column prop="updateTime" label="数据更新" align="center" width="160" />
        <el-table-column prop="createTime" label="创建时间" align="center" width="120" />
        <el-table-column label="操作" align="center" width="210" fixed="right">
          <template #default="{ row }">
            <div class="table-actions">
              <el-button v-if="row.status === '停止'" link type="primary" @click="openStartProject(row)">启动</el-button>
              <el-button v-else link type="primary" @click="stopProject(row)">停止</el-button>
              <el-button link type="primary" :disabled="row.executionProgress?.running" @click="runProjectNow(row)">
                {{ row.executionProgress?.running ? '执行中' : '手动执行' }}
              </el-button>
              <el-button link type="danger" @click="deleteProject(row)">删除</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <span class="total-text">共 400 条记录 第 {{ currentPage }} / 80 页</span>
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="prev, pager, next, sizes, jumper"
          :total="400"
        />
      </div>
    </el-card>

    <el-dialog
      v-model="createDialogVisible"
      width="1040px"
      class="create-project-dialog"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <template #header>
        <div class="create-dialog-header">
          <span class="create-dialog-title">创建品牌项目</span>
          <span class="create-dialog-tip">项目信息创建后，支持在配置中心修改。</span>
        </div>
      </template>
      <div class="create-project-body">
        <section class="create-section project-name-section">
          <div class="section-bar project-name-bar">
            <div class="section-title">项目名称</div>
            <div class="project-name-input-wrap">
              <el-input
                v-model="createForm.projectName"
                maxlength="100"
                show-word-limit
                placeholder="请输入项目名称"
                class="project-name-input"
              />
            </div>
          </div>
        </section>

        <section class="create-section own-brand-section">
          <div class="section-bar own-brand-title-bar">
            <div class="section-title">本品品牌</div>
            <div class="section-actions"></div>
          </div>
          <div v-if="createForm.ownBrand.name" class="brand-compact-list own-brand-compact-list">
            <div class="brand-compact-item own-brand-compact-item">
              <span class="brand-index compact-index">1</span>
              <div class="brand-summary one-line-summary" :title="formatCompetitorName(createForm.ownBrand)">
                <span class="brand-main-name">{{ createForm.ownBrand.name }}</span>
                <span v-for="alias in createForm.ownBrand.aliases" :key="alias" class="brand-alias-inline">/ {{ alias }}</span>
              </div>
              <div class="item-icon-actions">
                <el-tooltip content="编辑" placement="top">
                  <el-button type="primary" link :icon="Edit" class="icon-action-btn" @click="openOwnBrandDialog" />
                </el-tooltip>
                <el-tooltip content="删除" placement="top">
                  <el-button type="danger" link :icon="Delete" class="icon-action-btn" @click="removeOwnBrand" />
                </el-tooltip>
              </div>
            </div>
          </div>
          <div v-else class="compact-empty-row own-brand-empty-row">
            <span>暂无本品品牌</span>
            <el-button type="primary" link @click="openOwnBrandDialog">立即添加</el-button>
          </div>
        </section>

        <section class="create-section">
          <div class="section-bar">
            <div class="section-title title-with-count">竞品品牌 <span class="section-count">共{{ createForm.competitors.length}}个品牌</span></div>
            <div class="section-actions">
              <el-button type="primary" @click="openCompetitorDialog">+ 添加竞品</el-button>
            </div>
          </div>
          <div v-if="createForm.competitors.length" class="brand-compact-list">
            <div v-for="(item, index) in createForm.competitors" :key="index" class="brand-compact-item">
              <span class="brand-index compact-index">{{ index + 1 }}</span>
              <div class="brand-summary one-line-summary" :title="formatCompetitorName(item)">
                <span class="brand-main-name">{{ item.name }}</span>
                <span v-for="alias in item.aliases" :key="alias" class="brand-alias-inline">/ {{ alias }}</span>
              </div>
              <div class="item-icon-actions">
                <el-tooltip content="编辑" placement="top">
                  <el-button type="primary" link :icon="Edit" class="icon-action-btn" @click="editCompetitor(item)" />
                </el-tooltip>
                <el-tooltip content="删除" placement="top">
                  <el-button type="danger" link :icon="Delete" class="icon-action-btn" @click="removeCompetitor(index)" />
                </el-tooltip>
              </div>
            </div>
          </div>
          <div v-else class="compact-empty-row">
            <span>暂无竞品品牌</span>
            <el-button type="primary" link @click="openCompetitorDialog">立即添加</el-button>
          </div>
        </section>

        <section class="create-section">
          <div class="section-bar">
            <div class="section-title title-with-count">问题管理 <span class="section-count">共{{ createForm.questions.length}}个问题</span></div>
            <div class="section-actions question-actions">
              <el-button type="primary" plain @click="openQuestionExpandTool">AI拓词</el-button>
              <el-button type="primary" @click="openQuestionDialog">+ 添加问题</el-button>
            </div>
          </div>
          <div v-if="filteredQuestions.length" class="question-card-list">
            <div v-for="(item, index) in filteredQuestions" :key="index" class="question-card-item">
              <span class="question-index">{{ index + 1 }}</span>
              <div class="question-text">{{ item.text }}</div>
              <div class="item-icon-actions">
                <el-tooltip content="编辑" placement="top">
                  <el-button type="primary" link :icon="Edit" class="icon-action-btn" @click="editQuestion(item)" />
                </el-tooltip>
                <el-tooltip content="删除" placement="top">
                  <el-button type="danger" link :icon="Delete" class="icon-action-btn" @click="removeQuestionByItem(item)" />
                </el-tooltip>
              </div>
            </div>
          </div>
          <div v-else class="compact-empty-row">
            <span>暂无问题</span>
            <el-button type="primary" link @click="openQuestionDialog">立即添加</el-button>
          </div>
        </section>

        <section class="create-section monitor-create-section">
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
              <el-switch v-model="createForm.monitor.enabled" active-text="开" inactive-text="关" inline-prompt />
              <div class="inline-form-item deadline-inline">
                <el-tooltip content="到期后自动关闭监控" placement="top">
                  <span class="inline-label tooltip-title">监控截止日期</span>
                </el-tooltip>
              <el-segmented v-model="createForm.monitor.endDateMode" :options="deadlineModeOptions" />
              <el-date-picker
                v-if="createForm.monitor.endDateMode === 'date'"
                v-model="createForm.monitor.endDate"
                type="date"
                format="YYYY/MM/DD"
                value-format="YYYY/MM/DD"
                placeholder="选择日期"
                :disabled-date="disablePastDate"
                :editable="false"
                @change="normalizeMonitorEndDate(createForm.monitor)"
                class="date-picker"
              />
              </div>
            </div>
          </div>
          <div class="monitor-form-row monitor-row-main">
            <div class="inline-form-item">
              <span class="inline-label">监控周期</span>
              <el-select v-model="createForm.monitor.period" class="period-select">
                <el-option label="每日" value="daily" />
                <el-option label="每周" value="weekly" />
                <el-option label="间隔" value="interval" />
              </el-select>
            </div>
            <el-checkbox-group v-if="createForm.monitor.period === 'weekly'" v-model="createForm.monitor.weekdays" class="weekday-list">
              <el-checkbox v-for="day in weekdayOptions" :key="day.value" :label="day.value">{{ day.label }}</el-checkbox>
            </el-checkbox-group>
            <template v-if="createForm.monitor.period === 'interval'">
              <div class="inline-form-item">
                <span class="inline-label">开始日期</span>
                <el-date-picker v-model="createForm.monitor.startDate" type="date" format="YYYY/MM/DD" value-format="YYYY/MM/DD" class="date-picker" />
              </div>
              <div class="inline-form-item">
                <span class="inline-label">间隔天数</span>
                <el-input-number v-model="createForm.monitor.intervalDays" :min="1" :max="365" controls-position="right" class="small-number" />
              </div>
            </template>
            <div class="inline-form-item daily-count-item">
              <span class="inline-label">单日次数</span>
              <el-input-number v-model="createForm.monitor.dailyTimes" :min="1" :max="24" controls-position="right" class="small-number" @change="syncSplitTimes" />
            </div>
            <div v-if="createForm.monitor.dailyTimes === 1" class="inline-form-item execute-time-inline single-time-inline">
              <span class="inline-label">执行时间</span>
              <div class="time-list">
                <el-time-picker v-model="createForm.monitor.splitTimes[0]" format="HH:mm" value-format="HH:mm" class="time-picker compact-time" />
              </div>
            </div>
          </div>
          <div v-if="createForm.monitor.dailyTimes > 1" class="monitor-form-row execute-row-inline">
            <div class="inline-form-item">
              <span class="inline-label">执行方式</span>
              <el-segmented v-model="createForm.monitor.executeMode" :options="executeModeOptions" />
            </div>
            <div class="inline-form-item execute-time-inline">
              <span class="inline-label">执行时间</span>
              <div v-show="createForm.monitor.executeMode === 'continuous'" class="time-list">
                <el-time-picker v-model="createForm.monitor.continuousTime" format="HH:mm" value-format="HH:mm" class="time-picker compact-time" />
              </div>
              <div v-show="createForm.monitor.executeMode === 'split'" class="time-list">
                <el-time-picker
                  v-for="(_, index) in createForm.monitor.splitTimes"
                  :key="index"
                  v-model="createForm.monitor.splitTimes[index]"
                  format="HH:mm"
                  value-format="HH:mm"
                  class="time-picker compact-time"
                />
              </div>
            </div>
          </div>
        </section>

        <section class="create-section">
          <div class="section-title">模型配置</div>
          <div class="channel-options">
            <button
              type="button"
              class="channel-option"
              :class="{ active: createForm.collectChannel === 'standard' }"
              @click="setCollectChannel('standard')"
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
              :class="{ active: createForm.collectChannel === 'enhanced' }"
              @click="setCollectChannel('enhanced')"
            >
              <span class="channel-check">✓</span>
              <span class="channel-title-row">
                <span class="channel-name">增强通道</span>
                <span class="channel-tag">能力完整</span>
              </span>
              <span class="channel-features">含完整能力：联网搜索、答案采集、信源采集、深度思考、全部截图、提及截图</span>
            </button>
          </div>

          <div class="model-grid-create">
            <div v-for="model in createForm.models" :key="model.key" class="create-model-card" :class="{ active: model.enabled }">
              <el-checkbox v-model="model.enabled" class="model-title-check">
                <span class="model-logo" :class="model.logoClass">{{ model.short }}</span>
                {{ model.name }}
              </el-checkbox>
              <div v-if="createForm.collectChannel === 'enhanced'" class="model-children">
                <el-checkbox v-model="model.deepThinking" :disabled="!model.enabled">深度思考</el-checkbox>
                <div class="screenshot-checks">
                  <el-checkbox
                    v-model="model.allScreenshot"
                    :disabled="!model.enabled"
                    @change="value => handleScreenshotChange(model, 'all', value)"
                  >全部截图</el-checkbox>
                  <el-checkbox
                    v-model="model.mentionScreenshot"
                    :disabled="!model.enabled"
                    @change="value => handleScreenshotChange(model, 'mention', value)"
                  >提及截图</el-checkbox>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <span class="billing-cost-rule">基础调用、深度思考、截图均按 ¥0.10/问题/次/模型计费</span>
          <div class="billing-estimate-tip">
            <span>预计单天消耗</span>
            <span class="billing-cost-amount">¥{{ estimatedDailyCost }}</span>
          </div>
          <el-button @click="createDialogVisible = false">取消</el-button>
          <el-button class="save-only-btn" @click="saveCreateProject(false)">保存</el-button>
          <el-button type="primary" @click="saveCreateProject(true)">保存并立刻执行一次</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="startDialogVisible" title="启动监控" width="520px" append-to-body>
      <div class="start-project-dialog">
        <div class="start-project-name">{{ startTargetProject?.projectName }}</div>
        <div class="inline-form-item deadline-inline">
          <el-tooltip content="到期后自动关闭监控" placement="top">
            <span class="inline-label tooltip-title">监控截止日期</span>
          </el-tooltip>
          <el-segmented v-model="startForm.endDateMode" :options="deadlineModeOptions" />
          <el-date-picker
            v-if="startForm.endDateMode === 'date'"
            v-model="startForm.endDate"
            type="date"
            format="YYYY/MM/DD"
            value-format="YYYY/MM/DD"
            placeholder="选择日期"
            :disabled-date="disablePastDate"
            :editable="false"
            @change="normalizeMonitorEndDate(startForm)"
            class="date-picker"
          />
        </div>
      </div>
      <template #footer>
        <el-button @click="startDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmStartProject">确认启动</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="ownBrandDialogVisible" :title="ownBrandDialogTitle" width="520px" append-to-body>
      <el-form :model="ownBrandForm" label-width="96px" class="own-brand-dialog-form">
        <el-form-item label="本品名称">
          <el-input v-model="ownBrandForm.name" maxlength="100" placeholder="请输入本品主名称，例如：卓牧" />
        </el-form-item>
        <el-form-item label="别名信息">
          <el-input
            v-model="ownBrandForm.aliasesText"
            type="textarea"
            :rows="5"
            placeholder="多个别名可用 / 分隔或换行填写
示例：
zhuomu / Jomilk / 卓牧羊奶粉"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="ownBrandDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmOwnBrand">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="batchDialogVisible" title="添加竞品" width="520px" append-to-body>
      <el-input
        v-model="batchCompetitorText"
        type="textarea"
        :rows="10"
        placeholder="支持批量添加，每行一个竞品品牌
示例：
宝马/BMW
奔驰/梅赛德斯/Benz/Mercedes"
      />
      <template #footer>
        <el-button @click="batchDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmBatchCompetitors">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="competitorEditDialogVisible" title="修改竞品" width="520px" append-to-body>
      <el-form :model="competitorEditForm" label-width="96px" class="own-brand-dialog-form">
        <el-form-item label="竞品名称">
          <el-input v-model="competitorEditForm.name" maxlength="100" placeholder="请输入竞品主名称，例如：宝马" />
        </el-form-item>
        <el-form-item label="别名信息">
          <el-input
            v-model="competitorEditForm.aliasesText"
            type="textarea"
            :rows="5"
            placeholder="多个别名可用 / 分隔或换行填写
示例：
BMW / 宝马汽车"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="competitorEditDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmEditCompetitor">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="questionDialogVisible" title="添加问题" width="560px" append-to-body>
      <el-input
        v-model="batchQuestionText"
        type="textarea"
        :rows="10"
        placeholder="支持批量添加，每行一个问题
示例：
新能源汽车品牌有哪些
十万左右的新能源汽车推荐"
      />
      <template #footer>
        <el-button @click="questionDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmBatchQuestions">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Edit, Delete } from '@element-plus/icons-vue'

const router = useRouter()

const searchForm = reactive({
  projectName: '',
  userInfo: ''
})

const currentPage = ref(1)
const pageSize = ref(10)
const createDialogVisible = ref(false)
const startDialogVisible = ref(false)
const startTargetProject = ref(null)
const startForm = reactive({
  endDateMode: 'permanent',
  endDate: '2026/07/11'
})
const ownBrandDialogVisible = ref(false)
const ownBrandForm = reactive({ name: '', aliasesText: '' })
const competitorEditDialogVisible = ref(false)
const competitorEditTarget = ref(null)
const competitorEditForm = reactive({ name: '', aliasesText: '' })
const batchDialogVisible = ref(false)
const batchCompetitorText = ref('')
const questionDialogVisible = ref(false)
const batchQuestionText = ref('')
const questionSearch = ref('')
const selectedQuestions = ref([])

const MODEL_DICT = {
  doubao: { label: '豆', name: '豆包', class: 'm-blue' },
  yuanbao: { label: '元', name: '元宝', class: 'm-green' },
  deepseek: { label: 'D', name: 'DeepSeek', class: 'm-indigo' },
  qwen: { label: '千', name: '通义千问', class: 'm-purple' },
  wenxin: { label: '文', name: '文心一言', class: 'm-purple' },
  kimi: { label: 'K', name: 'Kimi', class: 'm-cyan' }
}

const tableData = ref([
  {
    id: 'proj-jinan', projectName: '卓牧羊奶粉项目', userInfo: '李桂英', questionCount: 40,
    models: [MODEL_DICT.doubao, MODEL_DICT.yuanbao, MODEL_DICT.deepseek, MODEL_DICT.qwen, MODEL_DICT.wenxin, MODEL_DICT.kimi],
    cycle: '每日/2次', monitorEndDate: '永久', autoCloseOnExpire: false, status: '运行中', updateTime: '2026.05.20 12:22:10', createTime: '2026.05.11'
  },
  {
    id: 'proj-shuangyanpi', projectName: '初敏护肤品项目', userInfo: '张鹏', questionCount: 30,
    models: [MODEL_DICT.doubao, MODEL_DICT.yuanbao, MODEL_DICT.deepseek, MODEL_DICT.qwen, MODEL_DICT.wenxin, MODEL_DICT.kimi],
    cycle: '每日/2次', monitorEndDate: '永久', autoCloseOnExpire: false, status: '运行中', updateTime: '2026.05.20 12:22:10', createTime: '2026.05.11'
  },
  {
    id: 'proj-meirongzhen', projectName: '美容针', userInfo: '郭丽', questionCount: 20,
    models: [MODEL_DICT.doubao, MODEL_DICT.yuanbao, MODEL_DICT.deepseek, MODEL_DICT.qwen, MODEL_DICT.wenxin, MODEL_DICT.kimi],
    cycle: '每日/2次', monitorEndDate: '永久', autoCloseOnExpire: false, status: '停止', updateTime: '2026.05.20 12:22:10', createTime: '2026.05.11'
  },
  {
    id: 'proj-remaji', projectName: '热玛吉', userInfo: '郭丽', questionCount: 11,
    models: [MODEL_DICT.doubao, MODEL_DICT.yuanbao, MODEL_DICT.deepseek, MODEL_DICT.qwen, MODEL_DICT.wenxin, MODEL_DICT.kimi],
    cycle: '每周/2次', monitorEndDate: '2026/07/31', autoCloseOnExpire: true, status: '停止', updateTime: '2026.05.20 12:22:10', createTime: '2026.05.11'
  },
  {
    id: 'proj-neimeng', projectName: '内蒙古美白项目', userInfo: '郭丽', questionCount: 23,
    models: [MODEL_DICT.doubao, MODEL_DICT.yuanbao, MODEL_DICT.deepseek, MODEL_DICT.qwen, MODEL_DICT.wenxin, MODEL_DICT.kimi],
    cycle: '手动', monitorEndDate: '永久', autoCloseOnExpire: false, status: '停止', updateTime: '2026.05.20 12:22:10', createTime: '2026.05.11'
  }
])

const weekdayOptions = [
  { label: '周一', value: 'mon' },
  { label: '周二', value: 'tue' },
  { label: '周三', value: 'wed' },
  { label: '周四', value: 'thu' },
  { label: '周五', value: 'fri' },
  { label: '周六', value: 'sat' },
  { label: '周日', value: 'sun' }
]

const executeModeOptions = [
  { label: '连续完成', value: 'continuous' },
  { label: '分时执行', value: 'split' }
]

const deadlineModeOptions = [
  { label: '日期', value: 'date' },
  { label: '永久', value: 'permanent' }
]

const getStartOfDayTime = (value) => {
  const date = value instanceof Date ? value : new Date(typeof value?.valueOf === 'function' ? value.valueOf() : value)
  date.setHours(0, 0, 0, 0)
  return date.getTime()
}

const disablePastDate = (date) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return getStartOfDayTime(date) < today.getTime()
}

const isPastDateValue = (value) => {
  if (!value) return false
  return disablePastDate(String(value).replaceAll('/', '-'))
}

const normalizeMonitorEndDate = (monitor) => {
  if (monitor.endDateMode === 'date' && isPastDateValue(monitor.endDate)) {
    monitor.endDate = ''
    ElMessage.warning('监控截止日期不能早于当天')
  }
}

const createDefaultForm = () => ({
  projectName: '',
  productName: '',
  ownBrand: { name: '', aliases: [] },
  competitors: [],
  questions: [],
  monitor: {
    enabled: true,
    period: 'daily',
    weekdays: ['mon'],
    startDate: '2026/05/12',
    endDateMode: 'permanent',
    endDate: '2026/07/11',
    intervalDays: 2,
    dailyTimes: 1,
    executeMode: 'split',
    continuousTime: '02:00',
    splitTimes: ['02:00']
  },
  collectChannel: 'standard',
  models: [
    { key: 'doubao', name: '豆包', short: '豆', logoClass: 'logo-rainbow', enabled: true, deepThinking: false, allScreenshot: false, mentionScreenshot: false },
    { key: 'yuanbao', name: '元宝', short: '元', logoClass: 'logo-green', enabled: true, deepThinking: false, allScreenshot: false, mentionScreenshot: false },
    { key: 'deepseek', name: 'DeepSeek', short: 'D', logoClass: 'logo-blue', enabled: true, deepThinking: false, allScreenshot: false, mentionScreenshot: false },
    { key: 'qwen', name: '通义千问', short: '千', logoClass: 'logo-purple', enabled: true, deepThinking: false, allScreenshot: false, mentionScreenshot: false },
    { key: 'wenxin', name: '文心一言', short: '文', logoClass: 'logo-indigo', enabled: true, deepThinking: false, allScreenshot: false, mentionScreenshot: false },
    { key: 'kimi', name: 'Kimi', short: 'K', logoClass: 'logo-dark', enabled: true, deepThinking: false, allScreenshot: false, mentionScreenshot: false }
  ]
})

const createForm = reactive(createDefaultForm())

const resetCreateForm = () => {
  Object.assign(createForm, createDefaultForm())
  questionSearch.value = ''
  selectedQuestions.value = []
  batchCompetitorText.value = ''
  batchQuestionText.value = ''
  ownBrandForm.name = ''
  ownBrandForm.aliasesText = ''
}

const ownBrandDialogTitle = computed(() => createForm.ownBrand.name ? '修改本品' : '添加本品')

const filteredQuestions = computed(() => {
  const keyword = questionSearch.value.trim()
  if (!keyword) return createForm.questions
  return createForm.questions.filter(item => item.text.includes(keyword))
})

const MODEL_UNIT_PRICE = 0.1

const estimatedDailyCost = computed(() => {
  const questionCount = createForm.questions.length
  const dailyTimes = Number(createForm.monitor.dailyTimes) || 0
  const enabledModels = createForm.models.filter(item => item.enabled)
  const baseUnits = questionCount * dailyTimes * enabledModels.length
  const enhancedUnits = createForm.collectChannel === 'enhanced'
    ? enabledModels.reduce((total, model) => {
      const deepThinkingUnits = model.deepThinking ? 1 : 0
      const screenshotUnits = model.allScreenshot || model.mentionScreenshot ? 1 : 0
      return total + questionCount * dailyTimes * (deepThinkingUnits + screenshotUnits)
    }, 0)
    : 0
  return ((baseUnits + enhancedUnits) * MODEL_UNIT_PRICE).toFixed(2)
})

const handleSearch = () => { console.log('查询条件:', searchForm) }
const resetSearch = () => { searchForm.projectName = ''; searchForm.userInfo = '' }

const getStatusClass = (status) => {
  if (status === '运行中') return 'text-success'
  if (status === '停止') return 'text-muted'
  return 'text-muted'
}

const enterProjectWorkspace = (row) => {
  const projectId = row.id || 'demo-project'
  router.push(`/project/${projectId}/dashboard`)
}

const formatNow = () => {
  const now = new Date()
  return `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
}

const isSameDay = (left, right) => {
  return left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
}

const estimateManualRunCost = (row) => {
  const questionCount = Number(row.questionCount) || 0
  const modelCount = Array.isArray(row.models) ? row.models.length : 0
  return (questionCount * modelCount * 0.1).toFixed(2)
}

const getPlatformCount = (row) => Array.isArray(row.models) ? row.models.length : 0

const startRunProgress = (row) => {
  const totalQuestions = Math.max(1, Number(row.questionCount) || 1)
  const models = Array.isArray(row.models) && row.models.length ? row.models : []
  const platformCount = models.length
  if (row.executionProgress?.timerId) {
    window.clearInterval(row.executionProgress.timerId)
  }
  row.executionProgress = {
    running: true,
    completedQuestions: 0,
    totalQuestions,
    completedWorkload: 0,
    totalWorkload: totalQuestions * Math.max(1, platformCount),
    platformCount,
    models: models.map(model => ({
      name: model.name,
      completedQuestions: 0,
      totalQuestions
    })),
    startedAt: new Date().toISOString(),
    timerId: null
  }
  const step = Math.max(1, Math.ceil(totalQuestions / 12))
  row.executionProgress.timerId = window.setInterval(() => {
    row.executionProgress.models.forEach((model, index) => {
      const modelStep = Math.max(1, step - (index % 2))
      model.completedQuestions = Math.min(totalQuestions, model.completedQuestions + modelStep)
    })
    row.executionProgress.completedWorkload = row.executionProgress.models.reduce(
      (total, model) => total + model.completedQuestions,
      0
    )
    row.executionProgress.completedQuestions = Math.min(
      totalQuestions,
      Math.floor(row.executionProgress.completedWorkload / Math.max(1, platformCount))
    )
    if (row.executionProgress.completedWorkload >= row.executionProgress.totalWorkload) {
      window.clearInterval(row.executionProgress.timerId)
      row.executionProgress.running = false
      row.executionProgress.finishedAt = new Date().toISOString()
      row.updateTime = formatNow()
      ElMessage.success(`项目「${row.projectName}」执行完成`)
    }
  }, 800)
}

const stopProject = async (row) => {
  try {
    await ElMessageBox.confirm(
      '停止后，不会自动执行监控任务，后续仍可以手动执行任务',
      '停止定时任务',
      {
        confirmButtonText: '确认停止',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
  } catch (error) {
    return
  }
  row.status = '停止'
  ElMessage.success(`已停止项目「${row.projectName}」的自动监控，仍可手动执行`)
}

const openStartProject = (row) => {
  startTargetProject.value = row
  if (row.monitorEndDate && row.monitorEndDate !== '永久') {
    startForm.endDateMode = 'date'
    startForm.endDate = row.monitorEndDate
  } else {
    startForm.endDateMode = 'permanent'
    startForm.endDate = '2026/07/11'
  }
  startDialogVisible.value = true
}

const confirmStartProject = () => {
  const target = startTargetProject.value
  if (!target) return
  if (startForm.endDateMode === 'date' && !startForm.endDate) {
    ElMessage.warning('请选择监控截止日期，或指定为永久')
    return
  }
  if (startForm.endDateMode === 'date' && isPastDateValue(startForm.endDate)) {
    ElMessage.warning('监控截止日期不能早于当天')
    return
  }
  target.status = '运行中'
  target.monitorEndDate = startForm.endDateMode === 'permanent' ? '永久' : startForm.endDate
  target.autoCloseOnExpire = startForm.endDateMode === 'date'
  target.updateTime = formatNow()
  startDialogVisible.value = false
  startTargetProject.value = null
  ElMessage.success(`已启动项目「${target.projectName}」的自动监控`)
}

const runProjectNow = async (row) => {
  if (row.executionProgress?.running) {
    ElMessage.warning(`项目「${row.projectName}」正在执行中`)
    return
  }
  const now = new Date()
  const lastRunAt = row.lastManualRunAt ? new Date(row.lastManualRunAt) : null
  const minutesSinceLastRun = lastRunAt ? Math.floor((now.getTime() - lastRunAt.getTime()) / 60000) : null
  const hasRunToday = lastRunAt && isSameDay(now, lastRunAt)
  const confirmMessage = hasRunToday
    ? minutesSinceLastRun <= 30
      ? `项目「${row.projectName}」在 ${minutesSinceLastRun || 1} 分钟内已经手动执行过一次，是否继续执行？`
      : `项目「${row.projectName}」今天已经手动执行过一次，是否继续执行？`
    : `确认立即手动执行项目「${row.projectName}」？`
  const runCost = estimateManualRunCost(row)

  try {
    setBillingConfirmTip(`本次执行预计消耗 ¥${runCost}`)
    await ElMessageBox.confirm(confirmMessage, '手动执行确认', {
      confirmButtonText: '确认执行',
      cancelButtonText: '取消',
      type: hasRunToday ? 'warning' : 'info',
      customClass: 'billing-confirm-box'
    })
  } catch (error) {
    return
  } finally {
    clearBillingConfirmTip()
  }

  row.lastManualRunAt = now.toISOString()
  startRunProgress(row)
  ElMessage.success(`已开始手动执行项目：${row.projectName}`)
}

const setBillingConfirmTip = (content) => {
  document.documentElement.style.setProperty('--billing-confirm-tip', `"${content}"`)
}

const clearBillingConfirmTip = () => {
  document.documentElement.style.removeProperty('--billing-confirm-tip')
}

const deleteProject = async (row) => {
  try {
    await ElMessageBox.confirm(`删除后将移除项目「${row.projectName}」，相关监控任务也将不再展示。是否确认删除？`, '删除项目', {
      confirmButtonText: '确认删除',
      cancelButtonText: '取消',
      type: 'warning',
      confirmButtonClass: 'el-button--danger'
    })
  } catch (error) {
    return
  }
  const index = tableData.value.findIndex(item => item.id === row.id)
  if (index > -1) tableData.value.splice(index, 1)
  ElMessage.success('项目已删除')
}

const openCreateProject = () => {
  resetCreateForm()
  createDialogVisible.value = true
}

const openCompetitorDialog = () => {
  batchCompetitorText.value = ''
  batchDialogVisible.value = true
}

const addCompetitor = () => {
  createForm.competitors.push({ name: '', aliases: [] })
}

const removeCompetitor = (index) => {
  createForm.competitors.splice(index, 1)
}

const formatCompetitorName = (item) => {
  return [item.name, ...(item.aliases || [])].filter(Boolean).join(' / ')
}

const parseBrandNames = (value) => {
  const names = String(value || '')
    .split(/[\/／]/)
    .map(item => item.trim())
    .filter(Boolean)
  const [name, ...aliases] = names
  return { name: name || '', aliases: [...new Set(aliases)] }
}

const parseAliasText = (value) => {
  return String(value || '')
    .split(/[\/／\n\r，,]/)
    .map(item => item.trim())
    .filter(Boolean)
}

const openOwnBrandDialog = () => {
  ownBrandForm.name = createForm.ownBrand.name || ''
  ownBrandForm.aliasesText = (createForm.ownBrand.aliases || []).join(' / ')
  ownBrandDialogVisible.value = true
}

const confirmOwnBrand = () => {
  const name = ownBrandForm.name.trim()
  if (!name) {
    ElMessage.warning('请填写本品名称')
    return
  }
  createForm.ownBrand.name = name
  createForm.ownBrand.aliases = [...new Set(parseAliasText(ownBrandForm.aliasesText).filter(item => item !== name))]
  ownBrandDialogVisible.value = false
}

const removeOwnBrand = () => {
  createForm.ownBrand.name = ''
  createForm.ownBrand.aliases = []
}

const editCompetitor = (item) => {
  competitorEditTarget.value = item
  competitorEditForm.name = item.name || ''
  competitorEditForm.aliasesText = (item.aliases || []).join(' / ')
  competitorEditDialogVisible.value = true
}

const confirmEditCompetitor = () => {
  const target = competitorEditTarget.value
  const name = competitorEditForm.name.trim()
  if (!target) return
  if (!name) {
    ElMessage.warning('请填写竞品名称')
    return
  }
  target.name = name
  target.aliases = [...new Set(parseAliasText(competitorEditForm.aliasesText).filter(item => item !== name))]
  competitorEditDialogVisible.value = false
  competitorEditTarget.value = null
}

const normalizeName = (value) => String(value || '').trim().toLowerCase()

const getCompetitorNameSet = () => {
  const set = new Set()
  createForm.competitors.forEach((item) => {
    ;[item.name, ...(item.aliases || [])].forEach((name) => {
      const key = normalizeName(name)
      if (key) set.add(key)
    })
  })
  return set
}

const confirmBatchCompetitors = () => {
  const rows = batchCompetitorText.value.split('\n').map(item => item.trim()).filter(Boolean)
  const existedNames = getCompetitorNameSet()
  let addedCount = 0
  let skippedCount = 0

  rows.forEach((line) => {
    const names = line
      .split(/[\/／]/)
      .map(item => item.trim())
      .filter(Boolean)
    const uniqueNames = []
    const lineNameSet = new Set()

    names.forEach((name) => {
      const key = normalizeName(name)
      if (key && !lineNameSet.has(key)) {
        uniqueNames.push(name)
        lineNameSet.add(key)
      }
    })

    const [name, ...aliases] = uniqueNames
    if (!name) return

    const hasDuplicate = uniqueNames.some(item => existedNames.has(normalizeName(item)))
    if (hasDuplicate) {
      skippedCount += 1
      return
    }

    createForm.competitors.push({ name, aliases })
    uniqueNames.forEach(item => existedNames.add(normalizeName(item)))
    addedCount += 1
  })

  batchCompetitorText.value = ''
  batchDialogVisible.value = false
  if (skippedCount) {
    ElMessage.success(`已添加${addedCount}个竞品，已过滤${skippedCount}条重复竞品`)
  } else if (addedCount) {
    ElMessage.success(`已添加${addedCount}个竞品`)
  }
}

const openQuestionDialog = () => {
  batchQuestionText.value = ''
  questionDialogVisible.value = true
}

const openQuestionExpandTool = () => {
  window.open('https://g6h7wzq7r2.coze.site/', '_blank', 'noopener,noreferrer')
}

const confirmBatchQuestions = () => {
  const rows = batchQuestionText.value.split('\n').map(item => item.trim()).filter(Boolean)
  const existedQuestions = new Set(createForm.questions.map(item => normalizeName(item.text)))
  let addedCount = 0
  let skippedCount = 0

  rows.forEach((text) => {
    const key = normalizeName(text)
    if (!key) return
    if (existedQuestions.has(key)) {
      skippedCount += 1
      return
    }
    createForm.questions.push({ text })
    existedQuestions.add(key)
    addedCount += 1
  })

  batchQuestionText.value = ''
  questionDialogVisible.value = false
  if (skippedCount) {
    ElMessage.success(`已添加${addedCount}个问题，已过滤${skippedCount}条重复问题`)
  } else if (addedCount) {
    ElMessage.success(`已添加${addedCount}个问题`)
  }
}

const editQuestion = (row) => {
  ElMessageBox.prompt('请输入监控问题', '编辑问题', {
    inputValue: row.text,
    confirmButtonText: '确定',
    cancelButtonText: '取消'
  }).then(({ value }) => {
    row.text = value
  }).catch(() => {})
}


const removeQuestion = (index) => {
  createForm.questions.splice(index, 1)
}

const removeQuestionByItem = (item) => {
  const index = createForm.questions.indexOf(item)
  if (index > -1) createForm.questions.splice(index, 1)
}

const deleteCheckedQuestions = () => {
  const selectedSet = new Set(selectedQuestions.value)
  createForm.questions = createForm.questions.filter(item => !selectedSet.has(item))
  selectedQuestions.value = []
}

const getEvenlyTimes = (count) => {
  if (count <= 1) return ['02:00']
  const interval = Math.floor((24 * 60) / count)
  return Array.from({ length: count }, (_, index) => {
    const totalMinutes = index * interval
    const hour = String(Math.floor(totalMinutes / 60)).padStart(2, '0')
    const minute = String(totalMinutes % 60).padStart(2, '0')
    return `${hour}:${minute}`
  })
}

const syncSplitTimes = () => {
  createForm.monitor.splitTimes = getEvenlyTimes(createForm.monitor.dailyTimes)
}

const setCollectChannel = (channel) => {
  createForm.collectChannel = channel
  // 只切换全局采集通道，不重置模型勾选状态。
  // 标准通道下客户已选择的模型，切到增强通道后继续保留。
  // 增强通道能力项默认不自动勾选，由客户按模型自行选择。
}

const handleScreenshotChange = (model, type, value) => {
  if (!value) return
  if (type === 'all') model.mentionScreenshot = false
  if (type === 'mention') model.allScreenshot = false
}

const saveCreateProject = async (runImmediately = false) => {
  createForm.projectName = String(createForm.projectName || '').trim()
  if (!createForm.projectName) {
    ElMessage.warning('请填写项目名称')
    return
  }
  const ownBrand = createForm.ownBrand
  if (!ownBrand.name) {
    ElMessage.warning('请添加本品品牌')
    return
  }
  if (!createForm.competitors.length) {
    ElMessage.warning('请至少添加一个竞品品牌')
    return
  }
  if (!createForm.questions.length) {
    ElMessage.warning('请至少添加一个问题')
    return
  }
  if (createForm.monitor.enabled && createForm.monitor.endDateMode === 'date' && !createForm.monitor.endDate) {
    ElMessage.warning('请选择监控截止日期，或指定为永久')
    return
  }
  if (createForm.monitor.enabled && createForm.monitor.endDateMode === 'date' && isPastDateValue(createForm.monitor.endDate)) {
    ElMessage.warning('监控截止日期不能早于当天')
    return
  }

  try {
    await ElMessageBox.confirm(
      runImmediately
        ? '保存后会立即生效，并立刻执行一次问题监测，是否确认？'
        : '保存后会立即生效，但不会立刻执行监测，是否确认？',
      '确认保存',
      {
        confirmButtonText: '确认保存',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
  } catch (error) {
    return
  }

  const enabledModels = createForm.models.filter(item => item.enabled).map(item => {
    if (item.key === 'doubao') return MODEL_DICT.doubao
    if (item.key === 'yuanbao') return MODEL_DICT.yuanbao
    if (item.key === 'deepseek') return MODEL_DICT.deepseek
    if (item.key === 'qwen') return MODEL_DICT.qwen
    if (item.key === 'wenxin') return MODEL_DICT.wenxin
    if (item.key === 'kimi') return MODEL_DICT.kimi
    return { label: item.short.slice(0, 1), name: item.name, class: 'm-indigo' }
  })
  tableData.value.unshift({
    id: `proj-${Date.now()}`,
    projectName: createForm.projectName,
    monitorBrand: ownBrand.name,
    monitorBrandAliases: ownBrand.aliases,
    userInfo: '当前用户',
    questionCount: createForm.questions.length,
    models: enabledModels,
    cycle: `${createForm.monitor.period === 'daily' ? '每日' : createForm.monitor.period === 'weekly' ? '每周' : '间隔'}/${createForm.monitor.dailyTimes}次`,
    monitorEndDate: createForm.monitor.endDateMode === 'permanent' ? '永久' : createForm.monitor.endDate,
    autoCloseOnExpire: createForm.monitor.endDateMode === 'date',
    status: createForm.monitor.enabled ? '运行中' : '停止',
    updateTime: runImmediately ? formatNow() : '-',
    lastManualRunAt: runImmediately ? new Date().toISOString() : undefined,
    createTime: new Date().toISOString().slice(0, 10).replaceAll('-', '.')
  })
  createDialogVisible.value = false
  ElMessage.success(runImmediately ? '项目创建成功，已开始执行一次监测' : '项目创建成功')
}

</script>

<style scoped>
.project-center-container { padding-bottom: 40px; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.page-title { margin: 0 0 8px; font-size: 22px; color: #303133; font-weight: 600; }
.page-subtitle { margin: 0; color: #909399; font-size: 14px; }
.create-project-btn { min-width: 104px; }
.search-create-action { margin-left: auto !important; margin-right: 0 !important; }
.search-actions { margin-right: 12px !important; }
.mb-20 { margin-bottom: 20px; }
.table-card { border: none; border-radius: 8px; background: #fff; }
.search-form { display: flex; align-items: center; padding-top: 18px; width: 100%; flex-wrap: wrap; }
:deep(.el-form-item) { margin-bottom: 18px; margin-right: 24px; }
:deep(.el-form-item__label) { font-weight: 500; color: #333; }
.project-link { font-weight: bold; font-size: 14px; }
.model-icons { display: flex; justify-content: center; gap: 6px; cursor: default; }
.model-badge { display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 50%; font-size: 12px; font-weight: bold; color: #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: transform 0.2s ease; }
.model-badge:hover { transform: scale(1.1); }
.m-blue { background: linear-gradient(135deg, #3b82f6, #60a5fa); }
.m-cyan { background: linear-gradient(135deg, #06b6d4, #22d3ee); }
.m-purple { background: linear-gradient(135deg, #a855f7, #c084fc); }
.m-indigo { background: linear-gradient(135deg, #4f46e5, #818cf8); border-radius: 6px; }
.m-violet { background: linear-gradient(135deg, #7c3aed, #a78bfa); clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%); border-radius: 0; }
.status-text { font-size: 13px; font-weight: 500; }
.text-success { color: #0f9f59; font-weight: 700; }
.text-muted { color: #909399; }
.run-progress-cell { display: flex; flex-direction: column; align-items: stretch; min-width: 150px; }
.run-model-progress-list { display: flex; flex-wrap: wrap; justify-content: center; gap: 4px; }
.run-model-progress { display: inline-flex; align-items: center; height: 20px; padding: 0 6px; border-radius: 4px; background: #fff7ed; color: #c2410c; border: 1px solid #fed7aa; font-size: 11px; font-weight: 700; line-height: 18px; white-space: nowrap; }
.run-progress-idle { color: #c0c4cc; }
.table-actions { display: inline-flex; align-items: center; justify-content: center; gap: 8px; white-space: nowrap; }
.table-actions :deep(.el-button) { margin-left: 0; padding: 0; }
:global(.billing-confirm-box .el-message-box__btns) { display: flex; align-items: center; gap: 10px; }
:global(.billing-confirm-box .el-message-box__btns::before) { content: var(--billing-confirm-tip); margin-right: auto; color: #dc2626; font-size: 15px; font-weight: 900; }
.pagination-wrapper { display: flex; justify-content: space-between; align-items: center; margin-top: 24px; padding-top: 16px; }
.total-text { font-size: 13px; color: #909399; }
:deep(.el-pagination.is-background .el-pager li:not(.is-disabled).is-active) { background-color: #2b65f0; }

.create-project-dialog :deep(.el-dialog) { border-radius: 10px; }
.create-project-dialog :deep(.el-dialog__header) { padding: 20px 24px 8px; margin-right: 0; }
.create-project-dialog :deep(.el-dialog__title) { font-weight: 800; color: #111827; }
.create-dialog-header {
  display: flex;
  align-items: baseline;
  gap: 12px;
  flex-wrap: wrap;
}
.create-dialog-title {
  font-size: 18px;
  font-weight: 800;
  color: #111827;
}
.create-dialog-tip {
  font-size: 12px;
  color: #64748b;
  font-weight: 400;
}
.create-project-dialog :deep(.el-dialog__body) { padding: 8px 24px 0; max-height: 78vh; overflow-y: auto; }
.create-project-dialog :deep(.el-dialog__footer) { padding: 18px 24px 22px; }
.create-project-body { display: flex; flex-direction: column; gap: 12px; }
.create-section { border: 1px solid #d8dee8; border-radius: 12px; padding: 18px 20px; background: #fff; }
.section-title { border-left: 4px solid #409eff; padding-left: 12px; font-size: 17px; font-weight: 800; color: #111827; margin-bottom: 16px; line-height: 1; }
.title-with-count {
  display: inline-flex;
  align-items: baseline;
  gap: 8px;
}
.section-count {
  font-size: 12px;
  color: #94a3b8;
  font-weight: 500;
  line-height: 1;
}

.section-bar { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 14px; }
.section-bar .section-title { margin-bottom: 0; }
.section-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.basic-create-section { padding-top: 20px; padding-bottom: 10px; }
.basic-inline-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(280px, 1fr));
  gap: 12px 40px;
  align-items: center;
}
.basic-inline-form :deep(.el-form-item) {
  margin-right: 0;
  margin-bottom: 12px;
  align-items: center;
}
.basic-inline-form :deep(.el-form-item__label) {
  width: 112px;
  justify-content: flex-start;
  padding: 0 12px 0 0;
  color: #111827;
  font-weight: 700;
  line-height: 32px;
}
.basic-inline-form :deep(.el-form-item__content) {
  flex: 1;
  min-width: 0;
}
.basic-inline-form :deep(.el-input) {
  max-width: 280px;
}
.ai-btn { background: #f59e0b; border-color: #d97706; color: #111827; font-weight: 700; }
.compact-table { width: 100%; }
.compact-table :deep(.el-table__header th) { background: #f8fafc; color: #64748b; font-weight: 800; }
.brand-name-cell { display: grid; grid-template-columns: 160px 1fr; gap: 8px; }
.helper-text { margin: 10px 0 0; color: #8c8c8c; font-size: 12px; white-space: pre-line; }
.question-actions { flex: 1; justify-content: flex-end; }
.danger-outline { color: #f43f5e; border-color: #fb7185; background: #fff; }
.purple-outline { color: #7c3aed; border-color: #a78bfa; background: #fff; }
.dialog-pagination { display: flex; align-items: center; justify-content: space-between; color: #64748b; font-size: 13px; margin-top: 14px; }
.monitor-create-section .section-bar { margin-bottom: 12px; }
.monitor-title-bar { justify-content: flex-start; }
.section-title-with-switch { display: inline-flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.section-title-with-switch .section-title { margin-bottom: 0; }
.deadline-inline { flex: 0 1 auto; }
.monitor-desc { padding: 12px 14px; border-radius: 8px; background: #fff7ed; border: 1px solid #fdba74; color: #c2410c; line-height: 20px; margin-bottom: 18px; }
.monitor-desc strong { margin-right: 8px; color: #9a3412; }
.monitor-form-row { display: flex; align-items: center; gap: 16px 24px; flex-wrap: wrap; margin-bottom: 16px; }
.tooltip-title { cursor: help; }
.monitor-row-main { align-items: center; }
.execute-row-inline { align-items: flex-start; }
.execute-time-inline { align-items: flex-start; flex: 1 1 auto; min-width: 0; }
.single-time-inline { flex: 0 0 auto; }
.inline-form-item { display: inline-flex; align-items: center; gap: 12px; }
.inline-label { white-space: nowrap; color: #111827; font-weight: 700; font-size: 15px; }
.period-select { width: 128px; }
.date-picker { width: 150px; }
.small-number { width: 96px; }
.weekday-list { display: flex; flex-wrap: wrap; gap: 8px 18px; }
.weekday-list :deep(.el-checkbox) { margin-right: 0; }

.time-list { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; max-width: 100%; }
.compact-time { width: 92px !important; flex: 0 0 92px; }
.compact-time :deep(.el-input__wrapper) { padding-left: 6px; padding-right: 6px; }
.compact-time :deep(.el-input__prefix), .compact-time :deep(.el-input__suffix) { display: none; }
.compact-time :deep(.el-input__inner) { text-align: center; }
.channel-options { display: grid; grid-template-columns: repeat(2, minmax(260px, 1fr)); gap: 14px; margin-bottom: 16px; }
.channel-option { position: relative; min-height: 100px; padding: 14px 16px 14px 42px; border: 2px solid #cbd5e1; border-radius: 10px; background: #ffffff; color: #1f2937; text-align: left; cursor: pointer; box-sizing: border-box; transition: all 0.18s ease; }
.channel-option.active { border-color: #2563eb; background: linear-gradient(180deg, #eff6ff 0%, #dbeafe 100%); box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.14); }
.channel-check { position: absolute; left: 14px; top: 17px; width: 20px; height: 20px; border-radius: 999px; border: 2px solid #cbd5e1; color: transparent; display: inline-flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 800; }
.channel-option.active .channel-check { background: #2563eb; border-color: #2563eb; color: #fff; }
.channel-title-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.channel-name { font-size: 16px; font-weight: 800; color: #111827; }
.channel-tag { display: inline-flex; padding: 2px 8px; border-radius: 999px; background: #f1f5f9; color: #475569; font-size: 12px; font-weight: 600; }
.channel-option.active .channel-tag { background: #2563eb; color: #fff; }
.channel-features { display: block; margin-top: 8px; color: #475569; font-size: 13px; line-height: 18px; }
.model-grid-create { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
.create-model-card { background: #f8fafc; border: 1px solid #dbe3ee; border-radius: 10px; padding: 16px; min-height: 112px; box-sizing: border-box; }
.create-model-card.active { border-color: #2563eb; background: #eff6ff; }
.model-title-check :deep(.el-checkbox__label) { font-size: 16px; color: #1f2937; font-weight: 700; }
.model-logo { display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 6px; color: #fff; font-size: 12px; margin-right: 8px; }
.logo-blue { background: #2563eb; }
.logo-dark { background: #111827; }
.logo-rainbow { background: linear-gradient(135deg, #60a5fa, #8b5cf6, #22c55e); }
.logo-purple { background: #8b5cf6; }
.logo-green { background: #22c55e; }
.logo-indigo { background: #4f46e5; }
.model-children { margin-top: 12px; padding-top: 10px; border-top: 1px solid #bfdbfe; display: flex; flex-direction: column; gap: 8px; }
.model-children :deep(.el-checkbox) { margin-right: 0; }
.screenshot-checks { display: flex; gap: 14px; flex-wrap: wrap; }
.dialog-footer { display: flex; justify-content: flex-end; align-items: center; gap: 18px; width: 100%; }
.billing-cost-rule { margin-right: auto; color: #94a3b8; font-size: 13px; white-space: nowrap; }
.billing-estimate-tip { display: flex; align-items: center; gap: 8px; color: #64748b; font-size: 13px; white-space: nowrap; }
.billing-cost-amount { color: #dc2626; font-size: 18px; font-weight: 900; }
.save-only-btn { border-color: #2563eb; color: #2563eb; background: #fff; font-weight: 700; }
.save-only-btn:hover,
.save-only-btn:focus { border-color: #1d4ed8; color: #1d4ed8; background: #eff6ff; }
.start-project-dialog { display: flex; flex-direction: column; gap: 18px; padding: 4px 0; }
.start-project-name { color: #111827; font-size: 15px; font-weight: 800; }


.project-name-section {
  padding-bottom: 14px;
}

.project-name-bar {
  align-items: center;
  justify-content: flex-start;
  gap: 18px;
}

.project-name-input-wrap {
  flex: 0 1 420px;
  max-width: 420px;
}

.project-name-input {
  width: 100%;
}

.own-brand-title-bar {
  margin-bottom: 10px;
}


.own-brand-compact-list {
  grid-template-columns: minmax(260px, 420px);
}

.own-brand-compact-item {
  background: #f8fafc;
}

.own-brand-empty-row {
  width: 100%;
}

.own-brand-dialog-form :deep(.el-textarea__inner) {
  line-height: 22px;
}

.brand-compact-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 10px;
}

.question-card-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 10px;
}

.brand-compact-item,
.question-card-item {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 40px;
  padding: 7px 6px 7px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #f8fafc;
  box-sizing: border-box;
}

.brand-index,
.question-index {
  flex: 0 0 26px;
  width: 26px;
  height: 26px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #e0ecff;
  color: #2563eb;
  font-size: 13px;
  font-weight: 800;
}

.compact-index {
  align-self: flex-start;
  margin-top: 1px;
}

.brand-summary {
  flex: 1;
  min-width: 0;
}

.one-line-summary {
  color: #111827;
  font-size: 14px;
  line-height: 22px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 4px;
}

.brand-main-name {
  flex: 0 0 auto;
  font-weight: 800;
}

.brand-alias-inline {
  flex: 0 1 auto;
  min-width: 0;
  color: #64748b;
  font-size: 12px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-icon-actions {
  flex: 0 0 auto;
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0;
}

.icon-action-btn {
  width: 22px;
  height: 22px;
  padding: 0;
}

.question-text {
  flex: 1;
  min-width: 0;
  color: #111827;
  font-size: 14px;
  line-height: 20px;
  word-break: break-all;
}

.mini-empty {
  padding: 18px 0;
  background: #f8fafc;
  border: 1px dashed #d8dee8;
  border-radius: 10px;
}

.compact-empty-row {
  min-height: 44px;
  padding: 0 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: #64748b;
  font-size: 14px;
  background: #f8fafc;
  border: 1px dashed #d8dee8;
  border-radius: 10px;
  box-sizing: border-box;
}

.compact-empty-row .el-button {
  padding: 0;
}

.simple-count {
  justify-content: flex-start;
}

@media (max-width: 900px) {
  .page-header { flex-direction: column; }
  .basic-inline-form, .channel-options, .model-grid-create, .brand-compact-list, .question-card-list { grid-template-columns: 1fr; }
  .basic-inline-form :deep(.el-form-item) { flex-direction: column; align-items: flex-start; }
  .basic-inline-form :deep(.el-form-item__label) { width: auto; line-height: 22px; padding-bottom: 6px; }
  .question-actions { justify-content: flex-start; }
  .execute-time-inline { min-width: 100%; }
}
</style>
