<!-- VERSION: SourceManagement_v20260604_1426 | changes: 修复两个Tab共用时间弹窗visible导致同时弹出 -->
<template>
  <div class="source-management-page">
    <section class="page-card">
      <el-tabs v-model="activeTab" class="source-tabs">
        <el-tab-pane label="我的信源" name="target">
          <div class="table-toolbar">
            <el-popover v-model:visible="targetTimePanelVisible" placement="bottom-start" trigger="click" :width="260" popper-class="source-time-popover" @show="syncPendingDateRange">
              <template #reference>
                <button type="button" class="time-trigger">
                  <el-icon><Calendar /></el-icon>
                  <span>{{ timeTriggerLabel }}</span>
                  <span class="trigger-caret">⌄</span>
                </button>
              </template>
              <div class="time-panel">
                <button type="button" :class="{ active: timeRangeType === '7d' }" @click="setQuickRange('7d')">最近7天</button>
                <button type="button" :class="{ active: timeRangeType === '30d' }" @click="setQuickRange('30d')">最近30天</button>
                <div class="time-panel-divider"></div>
                <div class="date-range-editor">
                  <span>时间段</span>
                  <input type="date" v-model="pendingDateRange.startDate" />
                  <input type="date" v-model="pendingDateRange.endDate" />
                </div>
                <div class="time-panel-footer">
                  <span>{{ activeRangeLabel }}</span>
                  <button type="button" @click="confirmDateRange">确定</button>
                </div>
              </div>
            </el-popover>
            <el-select v-model="modelFilter" class="model-filter" placeholder="所有模型" multiple collapse-tags collapse-tags-tooltip clearable>
              <el-option v-for="model in modelOptions" :key="model" :label="model" :value="model" />
            </el-select>
            <el-select v-model="questionFilter" class="question-filter" placeholder="全部问题" multiple collapse-tags collapse-tags-tooltip clearable>
              <el-option v-for="question in allQuestionOptions" :key="question" :label="question" :value="question" />
            </el-select>
            <el-input v-model="keyword" class="search-input" placeholder="搜索域名、URL、文章标题、摘要" :prefix-icon="Search" clearable />
            <el-select v-model="statusFilter" class="status-filter" placeholder="当前状态" clearable>
              <el-option label="已收录" value="已收录" />
              <el-option label="未收录" value="未收录" />
              <el-option label="待优化" value="待优化" />
              <el-option label="已失效" value="已失效" />
            </el-select>
            <div class="toolbar-spacer"></div>
            <el-button type="primary" @click="importDialogVisible = true">添加信源</el-button>
            <el-button @click="checkInvalidLinks">失效链接检测</el-button>
          </div>

          <el-table :data="filteredSources" class="source-table" :header-cell-style="headerCellStyle">
            <el-table-column type="index" label="序号" width="64" fixed="left" />
            <el-table-column prop="name" label="文章标题" min-width="210" fixed="left">
              <template #default="{ row }">
                <a class="source-link" :href="sourceHref(row)" target="_blank" rel="noopener noreferrer">{{ row.name }}</a>
                <div class="source-url">{{ row.match }}</div>
              </template>
            </el-table-column>
            <el-table-column prop="platform" label="平台" width="110" />
            <el-table-column prop="domain" label="域名" min-width="170" show-overflow-tooltip />
            <el-table-column prop="type" label="信源类型" width="110" />
            <el-table-column label="关联问题" min-width="260">
              <template #default="{ row }">
                <div class="tag-list">
                  <el-tag v-for="question in row.relatedQuestions || []" :key="question" size="small" effect="plain">{{ question }}</el-tag>
                  <span v-if="!(row.relatedQuestions || []).length">-</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="关联模型" width="130" align="center">
              <template #default="{ row }">
                <div class="model-icons">
                  <span
                    v-for="model in row.relatedModels || []"
                    :key="model"
                    class="model-icon"
                    :class="modelIconClass(model)"
                    :title="model"
                  >{{ modelIconText(model) }}</span>
                  <span v-if="!(row.relatedModels || []).length">-</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="rangeCount" label="引用次数" width="92" align="center" />
            <el-table-column prop="weight" label="权威等级" width="96" align="center">
              <template #default="{ row }">
                <el-tag :type="weightTagType(row.weight)" effect="plain">{{ row.weight }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="当前状态" width="98" align="center">
              <template #default="{ row }">
                <el-tag :type="sourceStatusTagType(row.status)" effect="plain">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="publishTime" label="发布时间" width="120" />
            <el-table-column label="操作" width="86" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" @click="removeSource(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="全网采集信源" name="collected">
          <div class="table-toolbar">
            <el-popover v-model:visible="collectedTimePanelVisible" placement="bottom-start" trigger="click" :width="260" popper-class="source-time-popover" @show="syncPendingDateRange">
              <template #reference>
                <button type="button" class="time-trigger">
                  <el-icon><Calendar /></el-icon>
                  <span>{{ timeTriggerLabel }}</span>
                  <span class="trigger-caret">⌄</span>
                </button>
              </template>
              <div class="time-panel">
                <button type="button" :class="{ active: timeRangeType === '7d' }" @click="setQuickRange('7d')">最近7天</button>
                <button type="button" :class="{ active: timeRangeType === '30d' }" @click="setQuickRange('30d')">最近30天</button>
                <div class="time-panel-divider"></div>
                <div class="date-range-editor">
                  <span>时间段</span>
                  <input type="date" v-model="pendingDateRange.startDate" />
                  <input type="date" v-model="pendingDateRange.endDate" />
                </div>
                <div class="time-panel-footer">
                  <span>{{ activeRangeLabel }}</span>
                  <button type="button" @click="confirmDateRange">确定</button>
                </div>
              </div>
            </el-popover>
            <el-select v-model="modelFilter" class="model-filter" placeholder="所有模型" multiple collapse-tags collapse-tags-tooltip clearable>
              <el-option v-for="model in modelOptions" :key="model" :label="model" :value="model" />
            </el-select>
            <el-select v-model="questionFilter" class="question-filter" placeholder="全部问题" multiple collapse-tags collapse-tags-tooltip clearable>
              <el-option v-for="question in allQuestionOptions" :key="question" :label="question" :value="question" />
            </el-select>
            <el-input v-model="collectedKeyword" class="search-input" placeholder="搜索域名、URL、文章标题、摘要" :prefix-icon="Search" clearable />
            <el-select v-model="categoryFilter" class="status-filter" placeholder="所属品牌" clearable>
              <el-option label="本品" value="本品" />
              <el-option label="竞品" value="竞品" />
              <el-option label="行业通用" value="行业通用" />
            </el-select>
            <el-select v-model="ownershipFilter" class="status-filter" placeholder="归属状态" clearable>
              <el-option label="我的信源" value="我的信源" />
              <el-option label="待布局信源" value="待布局信源" />
              <el-option label="竞品信源" value="竞品信源" />
            </el-select>
            <el-select v-model="riskTypeFilter" class="status-filter" placeholder="风险标识" clearable>
              <el-option label="正常" value="正常" />
              <el-option label="负面信源" value="负面信源" />
              <el-option label="竞品信源" value="竞品信源" />
              <el-option label="低质信源" value="低质信源" />
              <el-option label="投诉信源" value="投诉信源" />
              <el-option label="过期信源" value="过期信源" />
            </el-select>
            <div class="toolbar-spacer"></div>
          </div>

          <el-table :data="pagedCollectedSources" class="source-table collected-table" :header-cell-style="headerCellStyle">
            <el-table-column type="index" label="序号" width="64" fixed="left" :index="collectedRowIndex" />
            <el-table-column label="文章标题" min-width="280" fixed="left">
              <template #default="{ row }">
                <a class="source-link" :href="row.url" target="_blank" rel="noopener noreferrer">{{ row.title }}</a>
                <div class="source-url">{{ row.url }}</div>
              </template>
            </el-table-column>
            <el-table-column prop="platform" label="平台" width="110" />
            <el-table-column prop="domain" label="域名" min-width="170" show-overflow-tooltip />
            <el-table-column label="关联问题" min-width="220" show-overflow-tooltip>
              <template #default="{ row }">
                <div class="tag-list">
                  <el-tag v-for="question in row.questions || []" :key="question" size="small" effect="plain">{{ question }}</el-tag>
                  <span v-if="!(row.questions || []).length">-</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="关联模型" width="130" align="center">
              <template #default="{ row }">
                <div class="model-icons">
                  <span
                    v-for="model in row.models"
                    :key="model"
                    class="model-icon"
                    :class="modelIconClass(model)"
                    :title="model"
                  >{{ modelIconText(model) }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="category" label="所属品牌" width="100" align="center">
              <template #default="{ row }">
                <el-tag effect="plain">{{ row.category }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="归属状态" width="116" align="center">
              <template #default="{ row }">
                <el-tag :type="ownershipTagType(row.ownershipStatus)" effect="plain">{{ row.ownershipStatus }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="风险标识" min-width="170">
              <template #default="{ row }">
                <div class="tag-list">
                  <el-tag
                    v-for="tag in row.riskTags"
                    :key="tag"
                    size="small"
                    :type="riskTagType(tag)"
                    effect="plain"
                  >{{ tag }}</el-tag>
                  <el-tag v-if="!row.riskTags.length" size="small" type="success" effect="plain">正常</el-tag>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="rangeCount" label="引用次数" width="92" align="center" />
            <el-table-column prop="publishTime" label="发布时间" width="120" />
            <el-table-column prop="summary" label="摘要" min-width="260" show-overflow-tooltip />
            </el-table>

          <div class="pagination-bar">
            <span>共 {{ filteredCollectedSources.length }} 条全网采集信源</span>
            <el-pagination
              v-model:current-page="collectedPage"
              v-model:page-size="collectedPageSize"
              background
              layout="sizes, prev, pager, next, jumper"
              :page-sizes="[10, 20, 50, 100]"
              :total="filteredCollectedSources.length"
            />
          </div>
        </el-tab-pane>


      </el-tabs>
    </section>



    <el-dialog v-model="importDialogVisible" title="添加信源列表" width="620px">
      <div class="import-box">
        <div class="upload-panel">
          <el-button class="template-btn" size="small" plain @click="downloadTemplate">下载模板</el-button>
          <el-upload drag action="#" :auto-upload="false" accept=".xlsx,.xls,.csv">
            <el-icon class="upload-icon"><UploadFilled /></el-icon>
            <div class="upload-title">将 Excel / CSV 文件拖到此处，或点击上传</div>
            <div class="upload-desc">字段建议：文章标题、URL/域名、平台、信源类型、所属品牌、权威等级、关联问题、关联模型、当前状态</div>
          </el-upload>
        </div>
        <el-input
          v-model="batchText"
          type="textarea"
          :rows="6"
          class="batch-input"
          placeholder="可以直接粘贴信源，每行一个。示例：
https://mall.example.com/zhuomu
https://mall.example.com/title1
https://mall.example.com/title2"
        />
      </div>
      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmImport">导入</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Calendar, Search, UploadFilled } from '@element-plus/icons-vue'

const keyword = ref('')
const collectedKeyword = ref('')
const sourceEffectTab = ref('unusedSources')
const activeTab = ref('target')
const statusFilter = ref('')
const categoryFilter = ref('')
const ownershipFilter = ref('')
const riskTypeFilter = ref('')
const modelFilter = ref([])
const questionFilter = ref([])
const collectedPage = ref(1)
const collectedPageSize = ref(20)
const sourceDialogVisible = ref(false)
const importDialogVisible = ref(false)
const editingSourceId = ref(null)
const batchText = ref('')
const timeRangeType = ref('7d')
const customDateRange = ref([])
const targetTimePanelVisible = ref(false)
const collectedTimePanelVisible = ref(false)
const pendingDateRange = reactive({
  startDate: '2026-05-23',
  endDate: '2026-05-29'
})

const modelOptions = ['豆包', '元宝', '通义千问', 'Kimi', 'DeepSeek', '文心一言']
const questionOptions = [
  '卓牧羊奶粉安全吗？',
  '卓牧羊奶粉口碑怎么样？',
  '卓牧羊奶粉真实评价怎么样？',
  '羊奶粉哪个牌子更适合长期喝？'
]

const sourceForm = reactive({
  name: '',
  match: '',
  domain: '',
  platform: '',
  publishTime: '',
  type: '官网',
  category: '本品',
  weight: 'A级',
  relatedQuestions: [],
  relatedModels: [],
  status: '未收录'
})

const sourceList = ref([
  { id: 1, name: '卓牧羊奶粉品牌官网介绍', platform: '官网', type: '官网', category: '本品', match: 'zhuomu.example.com', domain: 'zhuomu.example.com', publishTime: '2026-05-20', weight: 'A级', status: '未收录', count: 3, count7d: 0, count30d: 3, relatedQuestions: ['卓牧羊奶粉安全吗？', '卓牧羊奶粉口碑怎么样？'], relatedModels: ['DeepSeek', 'Kimi'] },
  { id: 2, name: '卓牧羊奶粉官方旗舰店商品页', platform: '官方旗舰店', type: '电商页', category: '本品', match: 'https://mall.example.com/zhuomu', domain: 'mall.example.com', publishTime: '2026-05-22', weight: 'A级', status: '已收录', count: 6, count7d: 2, count30d: 6, relatedQuestions: ['卓牧羊奶粉真实评价怎么样？', '卓牧羊奶粉售后评价如何？'], relatedModels: ['豆包', '元宝'] },
  { id: 3, name: '知乎专栏：中老年羊奶粉怎么选', platform: '知乎', type: '社媒账号', category: '本品', match: 'https://zhuanlan.zhihu.com/zhuomu', domain: 'zhuanlan.zhihu.com', publishTime: '2026-05-18', weight: 'B级', status: '待优化', count: 4, count7d: 1, count30d: 4, relatedQuestions: ['羊奶粉哪个牌子更适合长期喝？', '卓牧羊奶粉适合中老年人喝吗？'], relatedModels: ['通义千问', '文心一言'] },
  { id: 4, name: '2026 羊奶粉行业白皮书', platform: '行业研究', type: '白皮书', category: '行业通用', match: 'https://research.example.com/goat-milk-whitepaper', domain: 'research.example.com', publishTime: '2026-05-15', weight: 'B级', status: '未收录', count: 0, count7d: 0, count30d: 0, relatedQuestions: [], relatedModels: [] },
  { id: 5, name: '竞品羊奶粉测评对比文章', platform: '测评站', type: '测评页', category: '竞品', match: 'https://review.example.com/competitor-goat-milk', domain: 'review.example.com', publishTime: '2026-05-12', weight: 'C级', status: '已失效', count: 2, count7d: 0, count30d: 2, relatedQuestions: ['卓牧羊奶粉口碑怎么样？', '羊奶粉品牌对比哪个好？'], relatedModels: ['豆包', 'DeepSeek'] }
])

const collectedSourceList = ref([
  {
    id: 'C001',
    domain: 'zhihu.com',
    url: 'https://www.zhihu.com/question/93200001',
    platform: '知乎',
    publishTime: '2026-05-21',
    title: '卓牧羊奶粉适合中老年人喝吗？真实评价如何？',
    summary: '回答提到卓牧羊奶粉在蛋白质和钙含量上表现稳定，但也引用了部分用户对价格和口感的负面反馈。',
    count: 12,
    models: ['豆包', 'DeepSeek', 'Kimi'],
    questions: ['卓牧羊奶粉适合中老年人喝吗？', '卓牧羊奶粉口碑怎么样？'],
    sentiment: '中性',
    category: '本品',
    brandHit: true,
    competitorSource: false,
    lowQuality: false
  },
  {
    id: 'C002',
    domain: 'jd.com',
    url: 'https://item.jd.com/mock-zhuomu.html',
    platform: '京东',
    publishTime: '2026-05-22',
    title: '卓牧羊奶粉商品评价',
    summary: '评价集中在溶解度、甜度和物流体验，部分差评提到包装破损和售后响应慢。',
    count: 8,
    models: ['通义千问', '文心一言'],
    questions: ['卓牧羊奶粉真实评价怎么样？'],
    sentiment: '负面',
    category: '本品',
    brandHit: true,
    competitorSource: false,
    lowQuality: false
  },
  {
    id: 'C003',
    domain: 'xiaohongshu.com',
    url: 'https://www.xiaohongshu.com/explore/mock',
    platform: '小红书',
    publishTime: '2026-05-23',
    title: '中老年羊奶粉怎么选，几个品牌对比',
    summary: '内容将卓牧与竞品进行对比，竞品被描述为渠道更稳定、评价更多。',
    count: 6,
    models: ['豆包', '元宝'],
    questions: ['羊奶粉哪个牌子更适合长期喝？'],
    sentiment: '负面',
    category: '竞品',
    brandHit: true,
    competitorSource: true,
    lowQuality: false
  },
  {
    id: 'C004',
    domain: 'health-rank.example.com',
    url: 'https://health-rank.example.com/goat-milk-top10',
    platform: '内容站',
    publishTime: '2026-05-24',
    title: '2026十大羊奶粉排行榜',
    summary: '页面堆砌排行榜关键词，来源不明，缺少检测依据，疑似低质 SEO 内容。',
    count: 5,
    models: ['DeepSeek'],
    questions: ['羊奶粉排行榜有哪些？'],
    sentiment: '负面',
    category: '行业通用',
    brandHit: false,
    competitorSource: true,
    lowQuality: true
  }
])

const rangeStartDate = computed(() => {
  if (timeRangeType.value === '7d') return '2026-05-23'
  if (timeRangeType.value === '30d') return '2026-05-01'
  return customDateRange.value?.[0] || '2026-05-01'
})

const rangeEndDate = computed(() => {
  if (timeRangeType.value === '7d') return '2026-05-29'
  if (timeRangeType.value === '30d') return '2026-05-29'
  return customDateRange.value?.[1] || '2026-05-29'
})

const activeRangeLabel = computed(() => `${rangeStartDate.value} 至 ${rangeEndDate.value}`)

const formatMonthDay = (value) => {
  const [, month, day] = String(value).split('-')
  return `${Number(month)}/${Number(day)}`
}

const timeTriggerLabel = computed(() => {
  if (timeRangeType.value === '7d') return '最近7天'
  if (timeRangeType.value === '30d') return '最近30天'
  return `${formatMonthDay(rangeStartDate.value)} - ${formatMonthDay(rangeEndDate.value)}`
})

const syncPendingDateRange = () => {
  pendingDateRange.startDate = customDateRange.value?.[0] || rangeStartDate.value
  pendingDateRange.endDate = customDateRange.value?.[1] || rangeEndDate.value
}

const setQuickRange = (type) => {
  timeRangeType.value = type
  targetTimePanelVisible.value = false
  collectedTimePanelVisible.value = false
}

const confirmDateRange = () => {
  if (!pendingDateRange.startDate || !pendingDateRange.endDate) {
    ElMessage.warning('请选择完整的时间段')
    return
  }
  if (pendingDateRange.startDate > pendingDateRange.endDate) {
    ElMessage.warning('开始日期不能晚于结束日期')
    return
  }
  customDateRange.value = [pendingDateRange.startDate, pendingDateRange.endDate]
  timeRangeType.value = 'custom'
  targetTimePanelVisible.value = false
  collectedTimePanelVisible.value = false
}

const isInActiveRange = (date) => {
  if (!date) return false
  return date >= rangeStartDate.value && date <= rangeEndDate.value
}

const sourceRangeCount = (item) => {
  if (timeRangeType.value === '7d') return item.count7d ?? 0
  if (timeRangeType.value === '30d') return item.count30d ?? item.count ?? 0
  return isInActiveRange(item.publishTime) ? (item.count30d ?? item.count ?? 0) : 0
}

const rangeSources = computed(() => sourceList.value.map(item => ({
  ...item,
  rangeCount: sourceRangeCount(item),
  status: sourceRangeCount(item) > 0 ? '已收录' : item.status
})))

function isCollectedMatchedWithOwnSource(item) {
  return sourceList.value.some(source => isSameSource(source, item))
}

function isComplaintSource(item) {
  const text = `${item.domain || ''}${item.url || ''}${item.title || ''}${item.summary || ''}`.toLowerCase()
  return /黑猫|投诉|消费保|complaint|315|heimao/.test(text)
}

function isExpiredSource(item) {
  if (!item.publishTime) return false
  const date = new Date(item.publishTime)
  if (Number.isNaN(date.getTime())) return false
  const diffDays = Math.floor((new Date('2026-06-04').getTime() - date.getTime()) / (24 * 60 * 60 * 1000))
  return diffDays > 365
}

function getCollectedRiskTags(item) {
  return [
    item.sentiment === '负面' ? '负面信源' : '',
    item.competitorSource || item.category === '竞品' ? '竞品信源' : '',
    item.lowQuality ? '低质信源' : '',
    isComplaintSource(item) ? '投诉信源' : '',
    isExpiredSource(item) ? '过期信源' : ''
  ].filter(Boolean)
}

function getCollectedOwnershipStatus(item) {
  if (isCollectedMatchedWithOwnSource(item)) return '我的信源'
  if (item.competitorSource || item.category === '竞品') return '竞品信源'
  return '待布局信源'
}

const rangeCollectedSources = computed(() => collectedSourceList.value
  .filter(item => isInActiveRange(item.publishTime))
  .map(item => {
    const riskTags = getCollectedRiskTags(item)
    return {
      ...item,
      rangeCount: item.count,
      ownershipStatus: getCollectedOwnershipStatus(item),
      riskTags,
      riskStatus: riskTags.length ? '风险信源' : '正常'
    }
  })
)

const filteredSources = computed(() => {
  const key = keyword.value.trim().toLowerCase()
  return rangeSources.value.filter(item => {
    const matchKeyword = !key || `${item.name}${item.platform}${item.type}${item.category}${item.match}${item.domain}${(item.relatedQuestions || []).join('')}${(item.relatedModels || []).join('')}${item.status}`.toLowerCase().includes(key)
    const matchStatus = !statusFilter.value || item.status === statusFilter.value
    const matchModel = !modelFilter.value.length || modelFilter.value.some(model => (item.relatedModels || []).includes(model))
    const matchQuestion = !questionFilter.value.length || questionFilter.value.some(question => (item.relatedQuestions || []).includes(question))
    return matchKeyword && matchStatus && matchModel && matchQuestion
  })
})

const filteredCollectedSources = computed(() => {
  const key = collectedKeyword.value.trim().toLowerCase()
  return rangeCollectedSources.value.filter(item => {
    const matchKeyword = !key || `${item.domain}${item.url}${item.platform}${item.title}${item.summary}${item.models.join('')}${item.questions.join('')}`.toLowerCase().includes(key)
    const matchCategory = !categoryFilter.value || item.category === categoryFilter.value
    const matchOwnership = !ownershipFilter.value || item.ownershipStatus === ownershipFilter.value
    const matchRisk = !riskTypeFilter.value || (riskTypeFilter.value === '正常' ? !item.riskTags.length : item.riskTags.includes(riskTypeFilter.value))
    const matchModel = !modelFilter.value.length || modelFilter.value.some(model => (item.models || []).includes(model))
    const matchQuestion = !questionFilter.value.length || questionFilter.value.some(question => (item.questions || []).includes(question))
    return matchKeyword && matchCategory && matchOwnership && matchRisk && matchModel && matchQuestion
  })
})


const normalizeDomain = (value = '') => parseDomain(value).toLowerCase().replace(/^m\./, '').replace(/^www\./, '')

const rootDomain = (value = '') => {
  const domain = normalizeDomain(value)
  if (!domain || domain === '未提供') return domain
  const platformDomains = ['zhihu.com', 'xiaohongshu.com', 'jd.com', 'baidu.com', 'weibo.com', 'bilibili.com', 'douyin.com', 'toutiao.com']
  const matched = platformDomains.find(item => domain === item || domain.endsWith(`.${item}`))
  if (matched) return matched
  const parts = domain.split('.').filter(Boolean)
  return parts.length >= 2 ? parts.slice(-2).join('.') : domain
}


const compareBaseCollectedSources = computed(() => {
  return rangeCollectedSources.value.filter(item => {
    const matchModel = !modelFilter.value.length || modelFilter.value.some(model => (item.models || []).includes(model))
    return matchModel
  })
})

const getMatchDetail = (source, collected) => {
  const sourceRaw = source.match || source.url || source.domain || ''
  const collectedRaw = collected.url || collected.domain || ''
  const sourceUrl = /^https?:\/\//i.test(sourceRaw) ? sourceRaw.toLowerCase() : `https://${sourceRaw}`.toLowerCase()
  const collectedUrl = /^https?:\/\//i.test(collectedRaw) ? collectedRaw.toLowerCase() : `https://${collectedRaw}`.toLowerCase()
  const sourceDomain = normalizeDomain(source.domain || sourceRaw)
  const collectedDomain = normalizeDomain(collected.domain || collectedRaw)
  const sourceRoot = rootDomain(source.domain || sourceRaw)
  const collectedRoot = rootDomain(collected.domain || collectedRaw)

  if (sourceRaw && collectedRaw && sourceUrl === collectedUrl) {
    return { matched: true, type: 'URL精确' }
  }
  if (sourceDomain && collectedDomain && sourceDomain === collectedDomain) {
    return { matched: true, type: '域名匹配' }
  }
  if (sourceRoot && collectedRoot && sourceRoot === collectedRoot) {
    return { matched: true, type: '根域名匹配' }
  }
  return { matched: false, type: '未匹配' }
}

const isSameSource = (source, collected) => getMatchDetail(source, collected).matched

const daysBetween = (date, endDate = rangeEndDate.value) => {
  if (!date) return '-'
  const start = new Date(date)
  const end = new Date(endDate)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return '-'
  const diff = Math.ceil((end - start) / (24 * 60 * 60 * 1000))
  return diff > 0 ? diff : 0
}

const sourceEffectSuggestion = (source) => {
  const type = source.type || ''
  if (type.includes('官网')) return '补充 FAQ、产品参数、适用场景、品牌背书和竞品对比内容，并提升页面可抓取性。'
  if (type.includes('新闻')) return '将新闻稿二次分发到权威媒体、行业垂媒、百家号、搜狐号等外部平台。'
  if (type.includes('知乎')) return '改成问题型标题，补充真实场景、对比信息和品牌差异化答案。'
  if (type.includes('小红书') || type.includes('社媒')) return '增加体验、测评、避坑、对比类内容，并围绕监控问题设置标题和正文关键词。'
  if (type.includes('电商')) return '补充商品问答、买家评价、参数一致性和售后说明，提升平台内可见度。'
  if (type.includes('白皮书')) return '将白皮书拆成多篇可搜索文章，并分发到第三方媒体、知乎和行业平台。'
  return '围绕目标问题补充结构化内容、外部分发和引用链路建设。'
}

const questionEffectSuggestion = (question) => {
  if (/评价|口碑|真实/i.test(question)) return '建议发布口碑、真实评价、用户反馈、测评体验类内容，并优先布局知乎、小红书和电商问答。'
  if (/哪个|推荐|排行|排名|品牌/i.test(question)) return '建议发布榜单、选购指南、横向对比和第三方测评内容，争取进入推荐类答案信源。'
  if (/安全|功效|效果|成分|适合/i.test(question)) return '建议发布成分原理、检测报告、专家背书、适用人群和注意事项内容。'
  if (/价格|怎么买|渠道|旗舰店/i.test(question)) return '建议补充官方价格、购买渠道、旗舰店和售后保障说明。'
  if (/对比|竞品|哪个好/i.test(question)) return '建议建设本品 vs 竞品差异化内容，突出核心优势和权威证据。'
  return '建议围绕该问题新增专题文章、FAQ 页面、第三方媒体稿和社媒内容投放。'
}

const allQuestionOptions = computed(() => {
  const set = new Set(questionOptions)
  rangeCollectedSources.value.forEach(item => (item.questions || []).forEach(question => set.add(question)))
  rangeSources.value.forEach(item => (item.relatedQuestions || []).forEach(question => set.add(question)))
  return Array.from(set).filter(Boolean)
})

const activeQuestionOptions = computed(() => {
  return questionFilter.value.length ? questionFilter.value : allQuestionOptions.value
})

const effectRangeSources = computed(() => rangeSources.value)

const ownSourceEffectRows = computed(() => {
  return effectRangeSources.value.map(source => {
    const hits = compareBaseCollectedSources.value.filter(collected => isSameSource(source, collected))
    const hitCount = hits.reduce((sum, item) => sum + Number(item.rangeCount || 0), 0)
    const hitModels = Array.from(new Set(hits.flatMap(item => item.models || [])))
    const hitQuestions = Array.from(new Set(hits.flatMap(item => item.questions || [])))
    const strongestMatch = hits.map(item => getMatchDetail(source, item).type).find(type => type === 'URL精确') || hits.map(item => getMatchDetail(source, item).type).find(type => type === '域名匹配') || (hits.length ? '根域名匹配' : '未匹配')

    return {
      ...source,
      hitCount,
      hitModels,
      hitQuestions,
      strongestMatch,
      effectStatus: hitCount > 0 ? '已被引用' : '未被引用',
      unquotedDays: hitCount > 0 ? 0 : daysBetween(source.publishTime),
      reason: hitCount > 0 ? '已进入 AI 答案引用链路' : (source.weight === 'A级' ? '重点信源未被引用，疑似收录或分发不足' : '内容未进入当前监测问题的引用链路'),
      suggestion: hitCount > 0 ? '持续观察引用次数、模型覆盖和情感变化。' : sourceEffectSuggestion(source)
    }
  })
})

const unusedOwnSources = computed(() => ownSourceEffectRows.value.filter(item => item.hitCount === 0))
const usedOwnSources = computed(() => ownSourceEffectRows.value.filter(item => item.hitCount > 0))

const questionSourceCoverage = computed(() => {
  return activeQuestionOptions.value.map(question => {
    const questionSources = compareBaseCollectedSources.value.filter(source => (source.questions || []).includes(question))
    const ownHits = questionSources.filter(collected => rangeSources.value.some(own => isSameSource(own, collected)))
    const models = Array.from(new Set(questionSources.flatMap(item => item.models || [])))
    const ownModels = Array.from(new Set(ownHits.flatMap(item => item.models || [])))
    const externalDomains = Array.from(new Set(questionSources.map(item => item.domain || parseDomain(item.url)).filter(Boolean)))
    const totalSourceQuoteCount = questionSources.reduce((sum, item) => sum + Number(item.rangeCount || 0), 0)
    const ownSourceQuoteCount = ownHits.reduce((sum, item) => sum + Number(item.rangeCount || 0), 0)

    return {
      question,
      totalSourceCount: questionSources.length,
      totalSourceQuoteCount,
      ownSourceCount: ownHits.length,
      ownSourceQuoteCount,
      models,
      ownModels,
      externalDomains,
      status: ownHits.length > 0 ? '有我的信源' : '无我的信源',
      suggestion: ownHits.length > 0 ? '该问题已有我的信源参与，可继续提升引用次数和模型覆盖。' : questionEffectSuggestion(question)
    }
  })
})

const noOwnSourceQuestions = computed(() => {
  return questionSourceCoverage.value.filter(item => item.ownSourceCount === 0)
})

const ownSourceQuestionCoverageRate = computed(() => {
  const total = questionSourceCoverage.value.length
  if (!total) return 0
  const covered = questionSourceCoverage.value.filter(item => item.ownSourceCount > 0).length
  return Math.round((covered / total) * 100)
})

const sourceEffectSummary = computed(() => {
  const messages = []
  if (unusedOwnSources.value.length > 0) {
    messages.push(`当前有 ${unusedOwnSources.value.length} 条我的信源未被任何大模型回答引用，说明这些内容尚未进入 AI 答案引用链路，建议优先优化 A级信源和重点问题相关内容。`)
  } else {
    messages.push('当前我的信源均已被至少一个大模型回答引用，信源建设效果较好。')
  }
  if (noOwnSourceQuestions.value.length > 0) {
    messages.push(`当前有 ${noOwnSourceQuestions.value.length} 个监控问题没有引用任何我的信源，说明这些问题下我的内容参与度不足，建议围绕这些问题加强文章投放和外部平台分发。`)
  } else {
    messages.push('当前所有监控问题均已引用我的信源，问题维度覆盖较完整。')
  }
  messages.push(`当前我的信源问题覆盖率为 ${ownSourceQuestionCoverageRate.value}%。`)
  return messages
})

const compareStats = computed(() => {
  const collectedTotalCount = compareBaseCollectedSources.value.reduce((sum, item) => sum + Number(item.rangeCount || 0), 0)
  const ownedCount = usedOwnSources.value.reduce((sum, item) => sum + Number(item.hitCount || 0), 0)
  return {
    targetTotal: effectRangeSources.value.length,
    usedOwnSourceCount: usedOwnSources.value.length,
    unusedOwnSourceCount: unusedOwnSources.value.length,
    noOwnSourceQuestionCount: noOwnSourceQuestions.value.length,
    questionCoverageRate: ownSourceQuestionCoverageRate.value,
    ownedQuoteCount: ownedCount,
    allQuoteCount: collectedTotalCount,
    ownedQuoteText: `${ownedCount}/${collectedTotalCount}`,
    ownedQuoteRate: collectedTotalCount ? Math.round((ownedCount / collectedTotalCount) * 100) : 0,
    coverageRate: effectRangeSources.value.length ? Math.round((usedOwnSources.value.length / effectRangeSources.value.length) * 100) : 0
  }
})

const compareConclusions = computed(() => {
  const stats = compareStats.value
  const result = []
  result.push(`当前我的信源共 ${stats.targetTotal} 条，已被引用 ${stats.usedOwnSourceCount} 条，未被引用 ${stats.unusedOwnSourceCount} 条，自有引用/全网引用为 ${stats.ownedQuoteText}。`)
  result.push(...sourceEffectSummary.value)
  if (!stats.unusedOwnSourceCount && !stats.noOwnSourceQuestionCount) result.push('当前我的信源引用效果较健康，可继续观察模型覆盖和引用次数变化。')
  return Array.from(new Set(result))
})

const ownershipTagType = (status) => {
  if (status === '我的信源') return 'success'
  if (status === '待布局信源') return 'primary'
  if (status === '竞品信源') return 'warning'
  return 'info'
}

const riskTagType = (tag) => {
  if (tag === '负面信源' || tag === '低质信源' || tag === '投诉信源') return 'danger'
  if (tag === '竞品信源' || tag === '过期信源') return 'warning'
  return 'info'
}

const pagedCollectedSources = computed(() => {
  const start = (collectedPage.value - 1) * collectedPageSize.value
  return filteredCollectedSources.value.slice(start, start + collectedPageSize.value)
})

const collectedRowIndex = (index) => (collectedPage.value - 1) * collectedPageSize.value + index + 1

const headerCellStyle = { background: '#f8fafc', color: '#334155', fontWeight: 800 }

const weightTagType = (weight) => {
  if (weight === 'A级') return 'warning'
  if (weight === 'B级') return 'primary'
  return 'info'
}

const sentimentTagType = (sentiment) => {
  if (sentiment === '负面') return 'danger'
  if (sentiment === '正面') return 'success'
  return 'info'
}

const sourceStatusTagType = (status) => {
  if (status === '已收录') return 'success'
  if (status === '待优化') return 'warning'
  if (status === '已失效') return 'danger'
  return 'info'
}

const modelIconMap = {
  豆包: { text: '豆', className: 'model-doubao' },
  元宝: { text: '元', className: 'model-yuanbao' },
  通义千问: { text: '千', className: 'model-qianwen' },
  Kimi: { text: 'K', className: 'model-kimi' },
  DeepSeek: { text: 'D', className: 'model-deepseek' },
  文心一言: { text: '文', className: 'model-wenxin' }
}

const modelIconText = (model) => modelIconMap[model]?.text || model.slice(0, 1)
const modelIconClass = (model) => modelIconMap[model]?.className || ''

const sourceHref = (row) => {
  const value = row.match || row.domain || ''
  if (!value) return '#'
  return /^https?:\/\//i.test(value) ? value : `https://${value}`
}

const parseDomain = (value = '') => {
  const raw = value.trim()
  if (!raw) return ''
  try {
    const normalized = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
    return new URL(normalized).hostname.replace(/^www\./, '')
  } catch {
    return raw.split('/')[0].replace(/^www\./, '')
  }
}

const resetSourceForm = () => {
  editingSourceId.value = null
  sourceForm.name = ''
  sourceForm.match = ''
  sourceForm.domain = ''
  sourceForm.platform = ''
  sourceForm.publishTime = ''
  sourceForm.type = '官网'
  sourceForm.category = '本品'
  sourceForm.weight = 'A级'
  sourceForm.relatedQuestions = []
  sourceForm.relatedModels = []
  sourceForm.status = '未收录'
  sourceForm.count = 0
}

const openSourceDialog = (row) => {
  if (!row) {
    resetSourceForm()
  } else {
    editingSourceId.value = row.id
    sourceForm.name = row.name
    sourceForm.match = row.match
    sourceForm.domain = row.domain || parseDomain(row.match)
    sourceForm.platform = row.platform
    sourceForm.publishTime = row.publishTime
    sourceForm.type = row.type
    sourceForm.category = row.category
    sourceForm.weight = row.weight
    sourceForm.relatedQuestions = [...(row.relatedQuestions || [])]
    sourceForm.relatedModels = [...(row.relatedModels || [])]
    sourceForm.status = row.status
    sourceForm.count = row.count || 0
  }
  sourceDialogVisible.value = true
}

const oneClickOptimizeQuestion = (row) => {
  resetSourceForm()
  sourceForm.name = `${row.question} - 待投放优化文章`
  sourceForm.match = ''
  sourceForm.domain = ''
  sourceForm.platform = '待定平台'
  sourceForm.publishTime = rangeEndDate.value
  sourceForm.type = '新闻稿'
  sourceForm.category = '本品'
  sourceForm.weight = 'A级'
  sourceForm.relatedQuestions = [row.question]
  sourceForm.relatedModels = [...(row.models || [])]
  sourceForm.status = '待优化'
  sourceDialogVisible.value = true
  ElMessage.success('已生成优化信源草稿，请补充文章标题和URL后保存')
}

const confirmSource = () => {
  if (!sourceForm.name.trim() || !sourceForm.match.trim()) {
    ElMessage.warning('请填写文章标题和信源 URL / 域名')
    return
  }
  const normalizedDomain = sourceForm.domain || parseDomain(sourceForm.match)
  const duplicate = sourceList.value.find(item =>
    item.id !== editingSourceId.value &&
    (item.name.trim() === sourceForm.name.trim() || item.domain === normalizedDomain)
  )
  if (duplicate) {
    ElMessage.warning(`已存在相同信源：${duplicate.name}`)
    return
  }
  if (editingSourceId.value) {
    const target = sourceList.value.find(item => item.id === editingSourceId.value)
    if (target) {
      Object.assign(target, {
        ...sourceForm,
        domain: normalizedDomain,
        relatedQuestions: [...sourceForm.relatedQuestions],
        relatedModels: [...sourceForm.relatedModels],
        count: sourceForm.count || 0
      })
    }
  } else {
    sourceList.value.unshift({
      id: Date.now(),
      ...sourceForm,
      domain: normalizedDomain,
      relatedQuestions: [...sourceForm.relatedQuestions],
      relatedModels: [...sourceForm.relatedModels],
      count: 0
    })
  }
  sourceDialogVisible.value = false
  ElMessage.success('信源已保存')
}

const removeSource = async (row) => {
  const confirmed = await ElMessageBox.confirm(
    `删除后，「${row.name}」将从我的信源库中移除，后续可通过导入或添加重新维护。`,
    '删除信源',
    {
      type: 'warning',
      confirmButtonText: '确认删除',
      cancelButtonText: '取消',
      confirmButtonClass: 'el-button--danger'
    }
  ).then(() => true).catch(() => false)
  if (!confirmed) return
  sourceList.value = sourceList.value.filter(item => item.id !== row.id)
}

const confirmImport = () => {
  const rows = batchText.value.split('\n').map(item => item.trim()).filter(Boolean)
  let addedCount = 0
  let duplicateCount = 0
  rows.forEach((line) => {
    const [
      name,
      match,
      platform = '',
      type = '官网',
      category = '本品',
      weight = 'B级',
      questions = '',
      models = '',
      status = '未收录'
    ] = line.split(',').map(item => item?.trim())
    if (!name || !match) return
    const domain = parseDomain(match)
    const exists = sourceList.value.some(item => item.name === name || item.domain === domain)
    if (exists) {
      duplicateCount += 1
      return
    }
    sourceList.value.unshift({
      id: Date.now() + Math.random(),
      name,
      platform,
      type,
      category,
      match,
      domain,
      weight,
      relatedQuestions: questions ? questions.split(';').map(item => item.trim()).filter(Boolean) : [],
      relatedModels: models ? models.split(';').map(item => item.trim()).filter(Boolean) : [],
      status,
      count: 0
    })
    addedCount += 1
  })
  batchText.value = ''
  importDialogVisible.value = false
  ElMessage.success(rows.length ? `已导入 ${addedCount} 条信源，自动过滤 ${duplicateCount} 条重复信源` : '上传文件将在接入后解析导入')
}

const downloadTemplate = () => {
  ElMessage.success('模板字段：文章标题、URL/域名、平台、信源类型、所属品牌、权威等级、关联问题、关联模型、当前状态')
}

const dedupeSources = () => {
  const seen = new Set()
  const before = sourceList.value.length
  sourceList.value = sourceList.value.filter((item) => {
    const key = `${item.name}|${item.domain || parseDomain(item.match)}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
  ElMessage.success(`自动去重完成，移除 ${before - sourceList.value.length} 条重复信源`)
}

const checkInvalidLinks = () => {
  sourceList.value = sourceList.value.map(item => ({
    ...item,
    status: /invalid|bbs\./i.test(item.match) ? '已失效' : item.status
  }))
  ElMessage.success('失效链接检测已完成')
}

const dedupeCollectedSources = () => {
  const seen = new Set()
  const before = collectedSourceList.value.length
  collectedSourceList.value = collectedSourceList.value.filter((item) => {
    const key = item.url || `${item.domain}-${item.title}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
  ElMessage.success(`全网采集信源去重完成，移除 ${before - collectedSourceList.value.length} 条重复 URL`)
}

</script>

<style scoped>
.source-management-page { padding: 0; }
.page-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 22px 24px; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 18px; }
.page-title { color: #111827; font-size: 22px; font-weight: 800; line-height: 1.2; }
.header-actions { display: flex; gap: 10px; flex-shrink: 0; }
.model-filter { width: 170px; }
.question-filter { width: 260px; }
.effect-question-filter { width: 320px; }
.time-trigger { height: 34px; display: inline-flex; align-items: center; gap: 8px; padding: 0 12px; border: 1px solid #dbe3ef; border-radius: 7px; background: #fff; color: #111827; font-size: 13px; font-weight: 700; cursor: pointer; box-shadow: 0 1px 2px rgba(15, 23, 42, .04); }
.time-trigger:hover { border-color: #93c5fd; color: #2563eb; }
.trigger-caret { color: #64748b; font-size: 12px; }
.time-panel { display: flex; flex-direction: column; gap: 4px; padding: 4px; }
.time-panel > button { height: 32px; padding: 0 8px; border: 0; border-radius: 6px; background: transparent; color: #111827; text-align: left; font-size: 13px; cursor: pointer; }
.time-panel > button:hover, .time-panel > button.active { background: #eff6ff; color: #2563eb; font-weight: 800; }
.time-panel-divider { height: 1px; margin: 6px 0; background: #e5e7eb; }
.date-range-editor { display: grid; grid-template-columns: 1fr; gap: 8px; padding: 4px; color: #64748b; font-size: 12px; }
.date-range-editor input { height: 32px; border: 1px solid #dbe3ef; border-radius: 7px; padding: 0 8px; color: #111827; font-family: inherit; }
.time-panel-footer { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 8px 4px 2px; color: #64748b; font-size: 12px; }
.time-panel-footer button { height: 30px; padding: 0 12px; border: 0; border-radius: 6px; background: #2563eb; color: #fff; font-weight: 800; cursor: pointer; }
.diff-panel { display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 14px 16px; border: 1px solid #dbeafe; border-radius: 8px; background: #eff6ff; margin-bottom: 16px; }
.panel-title { color: #111827; font-size: 15px; font-weight: 800; }
.panel-desc { margin-top: 4px; color: #64748b; font-size: 13px; }
.diff-tags { display: flex; gap: 8px; flex-shrink: 0; }
.source-tabs { margin-top: 8px; }
.source-tabs :deep(.el-tabs__header) { margin-bottom: 10px; }
.source-tabs :deep(.el-tabs__item) { font-size: 15px; font-weight: 800; }
.section-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin: 20px 0 12px; padding-top: 4px; }
.section-heading.target-heading { margin-top: 26px; padding-top: 18px; border-top: 1px solid #e5e7eb; }
.section-title { color: #111827; font-size: 18px; font-weight: 800; }
.section-heading p { margin: 6px 0 0; color: #64748b; font-size: 13px; }
.section-actions { display: flex; gap: 10px; flex-shrink: 0; }
.table-toolbar { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; flex-wrap: wrap; }
.search-input { width: 360px; }
.status-filter { width: 150px; }
.model-filter { width: 140px; }
.toolbar-spacer { flex: 1; min-width: 16px; }
.source-table { width: 100%; }
.source-name { color: #111827; font-weight: 800; }
.source-link { color: #2563eb; font-weight: 800; text-decoration: none; }
.source-link:hover { text-decoration: underline; text-underline-offset: 3px; }
.source-url { margin-top: 4px; color: #64748b; font-size: 12px; word-break: break-all; }
.collected-table { margin-bottom: 4px; }
.pagination-bar { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 14px 0 0; color: #64748b; font-size: 13px; }
.tag-list { display: flex; gap: 5px; flex-wrap: wrap; }
.model-icons { display: flex; align-items: center; justify-content: center; gap: 6px; }
.model-icon { width: 24px; height: 24px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; color: #fff; font-size: 11px; font-weight: 800; letter-spacing: 0; background: #64748b; cursor: default; }
.model-doubao { background: #3b82f6; }
.model-yuanbao { background: #22c55e; }
.model-qianwen { background: #8b5cf6; }
.model-kimi { background: #111827; }
.model-deepseek { background: #2563eb; }
.model-wenxin { background: #6366f1; }
.status-pill { display: inline-flex; align-items: center; height: 24px; padding: 0 8px; border-radius: 999px; font-size: 12px; font-weight: 700; }
.status-pill.covered { color: #16a34a; background: #dcfce7; }
.status-pill.missing { color: #b45309; background: #fef3c7; }
.status-pill.unexpected { color: #dc2626; background: #fee2e2; }
.link-status { display: inline-flex; align-items: center; height: 22px; padding: 0 7px; border-radius: 6px; font-size: 12px; font-weight: 700; }
.link-status.valid { color: #15803d; background: #dcfce7; }
.link-status.invalid { color: #dc2626; background: #fee2e2; }
.link-status.unknown { color: #64748b; background: #f1f5f9; }
.import-box { display: flex; flex-direction: column; gap: 14px; }
.upload-panel { position: relative; }
.template-btn { position: absolute; top: 12px; right: 12px; z-index: 2; background: #fff; }
.upload-icon { color: #409eff; font-size: 32px; }
.upload-title { color: #111827; font-weight: 700; }
.upload-desc { margin-top: 6px; color: #94a3b8; font-size: 12px; }
.batch-input { width: 100%; }
.bulk-alert { margin-bottom: 14px; }

.compare-hero { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 16px 18px; border: 1px solid #dbeafe; border-radius: 10px; background: linear-gradient(135deg, #eff6ff 0%, #f8fafc 100%); margin-bottom: 14px; }
.compare-title { color: #111827; font-size: 17px; font-weight: 900; }
.compare-desc { margin-top: 5px; color: #64748b; font-size: 13px; }
.moved-desc { margin: -4px 0 14px; }
.tab-count { display: inline-flex; align-items: center; justify-content: center; min-width: 20px; height: 18px; margin-left: 6px; padding: 0 6px; border-radius: 999px; font-size: 12px; font-weight: 800; background: #f1f5f9; color: #475569; }
.tab-count.success { background: #dcfce7; color: #15803d; }
.tab-count.warning { background: #fef3c7; color: #b45309; }
.tab-count.danger { background: #fee2e2; color: #b91c1c; }
.compare-kpi-grid { display: grid; grid-template-columns: repeat(6, minmax(120px, 1fr)); gap: 12px; margin-bottom: 14px; }
.compare-kpi-card { padding: 13px 14px; border: 1px solid #e5e7eb; border-radius: 10px; background: #fff; box-shadow: 0 1px 2px rgba(15, 23, 42, .04); }
.compare-kpi-card span { display: block; color: #64748b; font-size: 12px; font-weight: 700; }
.compare-kpi-card strong { display: block; margin-top: 6px; color: #111827; font-size: 26px; line-height: 1; }
.compare-kpi-card em { display: block; margin-top: 7px; color: #94a3b8; font-size: 12px; font-style: normal; }
.compare-kpi-card.success strong { color: #16a34a; }
.compare-kpi-card.warning strong { color: #d97706; }
.compare-kpi-card.primary strong { color: #2563eb; }
.compare-kpi-card.danger strong { color: #dc2626; }
.compare-toolbar { padding-top: 2px; }
.compare-conclusion { padding: 14px 16px; border: 1px solid #e5e7eb; border-radius: 10px; background: #f8fafc; margin-bottom: 14px; }
.conclusion-title { color: #111827; font-size: 14px; font-weight: 900; margin-bottom: 8px; }
.compare-conclusion ol { margin: 0; padding-left: 20px; color: #334155; font-size: 13px; line-height: 1.75; }
.compare-status-tabs { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
.compare-status-tabs button { height: 32px; padding: 0 12px; border: 1px solid #dbe3ef; border-radius: 999px; background: #fff; color: #334155; font-size: 13px; font-weight: 800; cursor: pointer; }
.compare-status-tabs button.active { border-color: #2563eb; color: #2563eb; background: #eff6ff; }
.compare-status-tabs button.success.active { border-color: #16a34a; color: #16a34a; background: #dcfce7; }
.compare-status-tabs button.warning.active { border-color: #d97706; color: #d97706; background: #fef3c7; }
.compare-status-tabs button.primary.active { border-color: #2563eb; color: #2563eb; background: #eff6ff; }
.compare-status-tabs button.danger.active { border-color: #dc2626; color: #dc2626; background: #fee2e2; }
.compare-table { margin-top: 2px; }


.source-effect-panel { padding: 14px 16px 16px; border: 1px solid #e5e7eb; border-radius: 10px; background: #fff; margin-bottom: 14px; }
.no-own-tab-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
.no-own-tab-title { color: #111827; font-size: 15px; font-weight: 900; }
.effect-summary-tags { display: flex; gap: 8px; flex-wrap: wrap; flex-shrink: 0; }
.effect-tabs :deep(.el-tabs__header) { margin-bottom: 10px; }
.effect-tabs :deep(.el-tabs__item) { font-size: 14px; font-weight: 800; }
.effect-alert { margin-bottom: 12px; }
.effect-table { margin-top: 4px; }

@media (max-width: 1100px) {
  .page-header, .diff-panel, .compare-hero, .no-own-tab-toolbar { flex-direction: column; align-items: stretch; }
  .compare-kpi-grid { grid-template-columns: repeat(2, minmax(120px, 1fr)); }
  .global-model-filter, .effect-question-filter { width: 100%; }
}
</style>
