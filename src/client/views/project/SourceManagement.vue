<template>
  <div class="source-management-page">
    <section class="page-card">
      <div class="page-header">
        <div>
          <div class="page-title">信源管理</div>
          <div class="page-desc">管理全网采集信源、客户目标信源池和差异运算结果，用于判断品牌信源覆盖、竞品信源、低质信源和缺失信源。</div>
        </div>
      </div>

      <div class="filter-card">
        <div class="filter-row">
          <div class="segmented">
            <button :class="{ active: timeRangeType === '7d' }" @click="timeRangeType = '7d'">最近7天</button>
            <button :class="{ active: timeRangeType === '30d' }" @click="timeRangeType = '30d'">最近30天</button>
            <button :class="{ active: timeRangeType === 'custom' }" @click="openDateModal">自定义时间段</button>
          </div>
          <div class="selected-info">{{ activeRangeLabel }}</div>
        </div>
      </div>

      <div class="summary-grid">
        <div class="summary-card">
          <span>全网采集信源</span>
          <strong>{{ rangeCollectedSources.length }}</strong>
          <p>大模型回答中引用的 URL 级信源</p>
        </div>
        <div class="summary-card">
          <span>命中品牌</span>
          <strong>{{ brandHitCount }}</strong>
          <p>标题或摘要中命中本品品牌</p>
        </div>
        <div class="summary-card warning">
          <span>竞品信源</span>
          <strong>{{ competitorSourceCount }}</strong>
          <p>疑似正在强化竞品认知</p>
        </div>
        <div class="summary-card danger">
          <span>低质信源</span>
          <strong>{{ lowQualityCount }}</strong>
          <p>低权重、内容农场或过时信源</p>
        </div>
      </div>

      <el-tabs v-model="activeTab" class="source-tabs">
        <el-tab-pane label="自有信源库" name="target">
          <div class="table-toolbar">
            <el-input v-model="keyword" class="search-input" placeholder="搜索文章标题、URL、关联问题或关联模型" :prefix-icon="Search" clearable />
            <el-select v-model="statusFilter" class="status-filter" placeholder="当前状态" clearable>
              <el-option label="已收录" value="已收录" />
              <el-option label="未收录" value="未收录" />
              <el-option label="待优化" value="待优化" />
              <el-option label="已失效" value="已失效" />
            </el-select>
            <div class="toolbar-spacer"></div>
            <el-button @click="downloadTemplate">下载模板</el-button>
            <el-button type="primary" @click="importDialogVisible = true">导入信源</el-button>
            <el-button type="primary" plain @click="openSourceDialog()">+ 添加信源</el-button>
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
            <el-input v-model="collectedKeyword" class="search-input" placeholder="搜索域名、URL、文章标题、摘要、模型或问题" :prefix-icon="Search" clearable />
            <el-select v-model="sentimentFilter" class="status-filter" placeholder="情感" clearable>
              <el-option label="负面" value="负面" />
              <el-option label="中性" value="中性" />
              <el-option label="正面" value="正面" />
            </el-select>
            <el-select v-model="categoryFilter" class="status-filter" placeholder="所属品牌" clearable>
              <el-option label="本品" value="本品" />
              <el-option label="竞品" value="竞品" />
              <el-option label="行业通用" value="行业通用" />
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
            <el-table-column prop="sentiment" label="情感" width="86" align="center">
              <template #default="{ row }">
                <el-tag :type="sentimentTagType(row.sentiment)" effect="plain">{{ row.sentiment }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="category" label="所属品牌" width="100" align="center">
              <template #default="{ row }">
                <el-tag effect="plain">{{ row.category }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="rangeCount" label="引用次数" width="92" align="center" />
            <el-table-column label="判断标记" min-width="190">
              <template #default="{ row }">
                <div class="tag-list">
                  <el-tag v-if="row.brandHit" type="success" size="small" effect="plain">命中品牌</el-tag>
                  <el-tag v-if="row.competitorSource" type="warning" size="small" effect="plain">竞品信源</el-tag>
                  <el-tag v-if="row.lowQuality" type="danger" size="small" effect="plain">低质信源</el-tag>
                </div>
              </template>
            </el-table-column>
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

    <div class="date-modal-mask" :class="{ show: dateModalVisible }" @click.self="closeDateModal">
      <div class="date-modal">
        <div class="date-modal-header">
          <h3>选择自定义时间段</h3>
          <button class="date-modal-close" type="button" @click="closeDateModal">×</button>
        </div>
        <div class="date-modal-body">
          <div class="date-modal-row">
            <label>时间段</label>
            <input type="date" v-model="pendingDateRange.startDate" />
            <span>至</span>
            <input type="date" v-model="pendingDateRange.endDate" />
          </div>
        </div>
        <div class="date-modal-footer">
          <button class="ghost-btn" type="button" @click="closeDateModal">取消</button>
          <button class="primary-btn" type="button" @click="confirmDateModal">确定</button>
        </div>
      </div>
    </div>

    <el-dialog v-model="sourceDialogVisible" title="添加信源" width="720px">
      <el-form label-position="top">
        <el-form-item label="文章标题">
          <el-input v-model="sourceForm.name" placeholder="例如：品牌官网介绍、官方旗舰店商品页、知乎专栏文章、小红书账号主页" />
        </el-form-item>
        <el-form-item label="信源 URL / 域名">
          <el-input v-model="sourceForm.match" placeholder="支持完整 URL，也支持域名级别，例如 https://example.com/news 或 example.com" @blur="sourceForm.domain = parseDomain(sourceForm.match)" />
        </el-form-item>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="平台">
              <el-input v-model="sourceForm.platform" placeholder="例如：官网、京东、知乎、小红书" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="域名">
              <el-input v-model="sourceForm.domain" placeholder="系统会根据 URL 自动解析" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="发布时间">
              <el-date-picker v-model="sourceForm.publishTime" type="date" value-format="YYYY-MM-DD" placeholder="选择发布时间" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="信源类型">
              <el-select v-model="sourceForm.type" style="width: 100%">
                <el-option label="官网" value="官网" />
                <el-option label="百科" value="百科" />
                <el-option label="新闻稿" value="新闻稿" />
                <el-option label="社媒账号" value="社媒账号" />
                <el-option label="垂直媒体" value="垂直媒体" />
                <el-option label="电商页" value="电商页" />
                <el-option label="测评页" value="测评页" />
                <el-option label="白皮书" value="白皮书" />
                <el-option label="视频号" value="视频号" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所属品牌">
              <el-select v-model="sourceForm.category" style="width: 100%">
                <el-option label="本品" value="本品" />
                <el-option label="竞品" value="竞品" />
                <el-option label="行业通用" value="行业通用" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="当前状态">
              <el-select v-model="sourceForm.status" style="width: 100%">
                <el-option label="已收录" value="已收录" />
                <el-option label="未收录" value="未收录" />
                <el-option label="待优化" value="待优化" />
                <el-option label="已失效" value="已失效" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="权威等级">
              <el-radio-group v-model="sourceForm.weight">
                <el-radio-button label="A级" />
                <el-radio-button label="B级" />
                <el-radio-button label="C级" />
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="关联问题">
              <el-select v-model="sourceForm.relatedQuestions" multiple filterable allow-create default-first-option placeholder="这篇文章被哪些问题的答案引用" style="width: 100%">
                <el-option v-for="item in questionOptions" :key="item" :label="item" :value="item" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="关联模型">
              <el-select v-model="sourceForm.relatedModels" multiple placeholder="这篇文章被哪些大模型引用" style="width: 100%">
                <el-option v-for="model in modelOptions" :key="model" :label="model" :value="model" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="sourceDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmSource">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="importDialogVisible" title="导入信源列表" width="620px">
      <div class="import-box">
        <el-upload drag action="#" :auto-upload="false" accept=".xlsx,.xls,.csv">
          <el-icon class="upload-icon"><UploadFilled /></el-icon>
          <div class="upload-title">将 Excel / CSV 文件拖到此处，或点击上传</div>
          <div class="upload-desc">字段建议：文章标题、URL/域名、平台、信源类型、所属品牌、权威等级、关联问题、关联模型、当前状态</div>
        </el-upload>
        <el-input
          v-model="batchText"
          type="textarea"
          :rows="6"
          class="batch-input"
          placeholder="也可以直接粘贴信源，每行一个。示例：
卓牧羊奶粉品牌官网介绍, zhuomu.example.com, 官网, 官网, 本品, A级, 卓牧羊奶粉安全吗？;卓牧羊奶粉口碑怎么样？, 豆包;DeepSeek;Kimi, 未收录
卓牧羊奶粉官方旗舰店商品页, https://mall.example.com/zhuomu, 官方旗舰店, 电商页, 本品, A级, 卓牧羊奶粉真实评价怎么样？, 豆包;元宝, 已收录
知乎专栏：中老年羊奶粉怎么选, https://zhuanlan.zhihu.com/zhuomu, 知乎, 社媒账号, 本品, B级, 羊奶粉哪个牌子更适合长期喝？, 通义千问;文心一言, 待优化"
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
import { Search, UploadFilled } from '@element-plus/icons-vue'

const keyword = ref('')
const collectedKeyword = ref('')
const activeTab = ref('target')
const statusFilter = ref('')
const categoryFilter = ref('')
const sentimentFilter = ref('')
const collectedPage = ref(1)
const collectedPageSize = ref(20)
const sourceDialogVisible = ref(false)
const importDialogVisible = ref(false)
const editingSourceId = ref(null)
const batchText = ref('')
const timeRangeType = ref('7d')
const customDateRange = ref([])
const dateModalVisible = ref(false)
const pendingDateRange = reactive({
  startDate: '2026-05-23',
  endDate: '2026-05-29'
})

const timeRangeOptions = [
  { label: '最近7天', value: '7d' },
  { label: '最近30天', value: '30d' },
  { label: '自定义时间段', value: 'custom' }
]

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

const openDateModal = () => {
  pendingDateRange.startDate = customDateRange.value?.[0] || rangeStartDate.value
  pendingDateRange.endDate = customDateRange.value?.[1] || rangeEndDate.value
  dateModalVisible.value = true
}

const closeDateModal = () => {
  dateModalVisible.value = false
}

const confirmDateModal = () => {
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
  closeDateModal()
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

const rangeCollectedSources = computed(() => collectedSourceList.value
  .filter(item => isInActiveRange(item.publishTime))
  .map(item => ({ ...item, rangeCount: item.count }))
)

const filteredSources = computed(() => {
  const key = keyword.value.trim().toLowerCase()
  return rangeSources.value.filter(item => {
    const matchKeyword = !key || `${item.name}${item.platform}${item.type}${item.category}${item.match}${item.domain}${(item.relatedQuestions || []).join('')}${(item.relatedModels || []).join('')}${item.status}`.toLowerCase().includes(key)
    const matchStatus = !statusFilter.value || item.status === statusFilter.value
    return matchKeyword && matchStatus
  })
})

const filteredCollectedSources = computed(() => {
  const key = collectedKeyword.value.trim().toLowerCase()
  return rangeCollectedSources.value.filter(item => {
    const matchKeyword = !key || `${item.domain}${item.url}${item.platform}${item.title}${item.summary}${item.models.join('')}${item.questions.join('')}`.toLowerCase().includes(key)
    const matchSentiment = !sentimentFilter.value || item.sentiment === sentimentFilter.value
    const matchCategory = !categoryFilter.value || item.category === categoryFilter.value
    return matchKeyword && matchSentiment && matchCategory
  })
})

const pagedCollectedSources = computed(() => {
  const start = (collectedPage.value - 1) * collectedPageSize.value
  return filteredCollectedSources.value.slice(start, start + collectedPageSize.value)
})

const collectedRowIndex = (index) => (collectedPage.value - 1) * collectedPageSize.value + index + 1

const brandHitCount = computed(() => rangeCollectedSources.value.filter(item => item.brandHit).length)
const competitorSourceCount = computed(() => rangeCollectedSources.value.filter(item => item.competitorSource).length)
const lowQualityCount = computed(() => rangeCollectedSources.value.filter(item => item.lowQuality).length)

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
    `删除后，「${row.name}」将从自有信源库中移除，后续可通过导入或添加重新维护。`,
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
.page-desc { margin-top: 8px; color: #64748b; font-size: 13px; }
.header-actions { display: flex; gap: 10px; flex-shrink: 0; }
.filter-card { padding: 16px; margin-bottom: 20px; border: 1px solid #e5e7eb; border-radius: 8px; background: #fff; }
.filter-row { display: flex; align-items: center; flex-wrap: wrap; gap: 12px; }
.segmented { display: inline-flex; padding: 4px; gap: 4px; border-radius: 12px; background: #eef2ff; border: 1px solid #dbe4ff; }
.segmented button { border: 0; background: transparent; color: #4b5563; cursor: pointer; border-radius: 9px; padding: 9px 14px; font-weight: 600; font-size: 13px; transition: all 0.2s; }
.segmented button.active { background: #245bff; color: #fff; box-shadow: 0 4px 10px rgba(36,91,255,.22); }
.selected-info { margin-left: auto; color: #245bff; background: #f0f5ff; border: 1px solid #dbeafe; padding: 8px 14px; border-radius: 10px; font-size: 13px; font-weight: 800; }
.date-modal-mask { display: none; position: fixed; inset: 0; z-index: 50; background: rgba(15, 23, 42, 0.34); align-items: center; justify-content: center; padding: 24px; }
.date-modal-mask.show { display: flex; }
.date-modal { width: min(640px, 100%); background: #fff; border-radius: 16px; border: 1px solid #e5e7eb; box-shadow: 0 24px 70px rgba(15, 23, 42, .26); overflow: hidden; }
.date-modal-header { padding: 16px 20px; border-bottom: 1px solid #eef2f7; display: flex; align-items: center; justify-content: space-between; }
.date-modal-header h3 { margin: 0; font-size: 16px; font-weight: 800; color: #111827; }
.date-modal-close { width: 30px; height: 30px; border: 0; border-radius: 8px; background: #f3f4f6; cursor: pointer; font-size: 18px; line-height: 1; }
.date-modal-body { padding: 20px; }
.date-modal-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.date-modal-row input[type="date"] { height: 38px; border: 1px solid #d1d5db; border-radius: 8px; padding: 0 10px; font-family: inherit; color: #111827; }
.date-modal-row label { font-size: 13px; font-weight: 800; color: #374151; }
.date-modal-footer { padding: 14px 20px; background: #f9fafb; border-top: 1px solid #eef2f7; display: flex; justify-content: flex-end; gap: 10px; }
.ghost-btn { height: 36px; padding: 0 18px; border: 1px solid #d1d5db; border-radius: 8px; background: #fff; color: #374151; font-weight: 700; cursor: pointer; }
.primary-btn { height: 36px; padding: 0 20px; border: 0; border-radius: 8px; background: #245bff; color: #fff; font-weight: 800; cursor: pointer; }
.summary-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; margin-bottom: 16px; }
.summary-card { padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px; background: #f8fafc; }
.summary-card span { color: #64748b; font-size: 13px; }
.summary-card strong { display: block; margin-top: 8px; color: #2563eb; font-size: 28px; line-height: 1; }
.summary-card.warning strong { color: #f59e0b; }
.summary-card.danger strong { color: #ef4444; }
.summary-card p { margin: 8px 0 0; color: #94a3b8; font-size: 12px; }
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
.upload-icon { color: #409eff; font-size: 32px; }
.upload-title { color: #111827; font-weight: 700; }
.upload-desc { margin-top: 6px; color: #94a3b8; font-size: 12px; }
.batch-input { width: 100%; }
.bulk-alert { margin-bottom: 14px; }
@media (max-width: 1100px) {
  .summary-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .page-header, .diff-panel { flex-direction: column; align-items: stretch; }
}
</style>
