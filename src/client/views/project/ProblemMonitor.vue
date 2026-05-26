<template>
  <div class="problem-monitor-page">
    <template v-if="isTagDetailPage">
      <div class="detail-header">
        <div>
          <h2>{{ currentTagName }}</h2>
          <p>该标签下共 {{ currentTagQuestions.length }} 个监控问题，展示这一组问题的汇总数据。</p>
        </div>
        <el-button text type="primary" @click="backToList">返回问题监控</el-button>
      </div>

      <el-row :gutter="14" class="summary-row">
        <el-col v-for="item in tagDetailCards" :key="item.label" :span="6">
          <div class="summary-card">
            <span class="metric-title">
              {{ item.label }}
              <el-tooltip :content="item.tip" placement="top">
                <i class="help-dot">?</i>
              </el-tooltip>
            </span>
            <strong>{{ item.value }}</strong>
            <p>{{ item.desc }}</p>
          </div>
        </el-col>
      </el-row>

      <el-row :gutter="14" class="chart-row">
        <el-col :span="12">
          <el-card shadow="never" class="chart-card tag-list-card">
            <template #header><strong>标签下问题提及率</strong></template>
            <div class="tag-rank-list">
              <button
                v-for="(item, index) in tagMentionList"
                :key="item.id"
                type="button"
                class="tag-rank-item"
                @click="goToQuestion(item)"
              >
                <span class="rank-no">{{ index + 1 }}</span>
                <span class="tag-rank-main">
                  <strong>{{ item.question }}</strong>
                  <em>{{ item.askCount }} 次提问</em>
                </span>
                <span :class="['metric-pill', item.mentionRate >= 70 ? 'is-good' : 'is-risk']">{{ item.mentionRate }}%</span>
              </button>
            </div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card shadow="never" class="chart-card tag-list-card">
            <template #header><strong>标签下问题平均顺位</strong></template>
            <div class="tag-rank-list">
              <button
                v-for="(item, index) in tagRankList"
                :key="item.id"
                type="button"
                class="tag-rank-item"
                @click="goToQuestion(item)"
              >
                <span class="rank-no">{{ index + 1 }}</span>
                <span class="tag-rank-main">
                  <strong>{{ item.question }}</strong>
                  <em>{{ item.askCount }} 次提问</em>
                </span>
                <span :class="['metric-pill', item.avgRank <= 3 ? 'is-good' : 'is-risk']">第 {{ item.avgRank }} 位</span>
              </button>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <el-card shadow="never" class="table-card">
        <template #header><strong>标签问题明细</strong></template>
        <el-table :data="currentTagQuestions" class="monitor-table" style="width: 100%" :header-cell-style="headerCellStyle" :cell-style="cellStyle">
          <el-table-column type="index" label="序号" width="64" align="center" />
          <el-table-column label="监控问题" min-width="280" show-overflow-tooltip>
            <template #default="{ row }">
              <button type="button" class="question-link" @click="goToQuestion(row)">{{ row.question }}</button>
            </template>
          </el-table-column>
          <el-table-column prop="askCount" label="提问次数" width="100" align="center" />
          <el-table-column label="本品提及率" width="120" align="center">
            <template #default="{ row }"><span :class="row.mentionRate >= 70 ? 'pass-text' : 'fail-text'">{{ row.mentionRate }}%</span></template>
          </el-table-column>
          <el-table-column label="平均顺位" width="110" align="center">
            <template #default="{ row }"><span :class="row.avgRank <= 3 ? 'pass-text' : 'fail-text'">{{ row.avgRank }}</span></template>
          </el-table-column>
          <el-table-column label="覆盖模型" min-width="168">
            <template #default="{ row }">
              <div class="model-icons">
                <el-tooltip v-for="model in row.models" :key="model" :content="model" placement="top">
                  <span class="model-icon" :class="modelIconClass(model)">{{ modelIconText(model) }}</span>
                </el-tooltip>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="96" align="center">
            <template #default="{ row }"><el-button link type="primary" @click="goToQuestion(row)">详情</el-button></template>
          </el-table-column>
        </el-table>
      </el-card>
    </template>

    <template v-else-if="!isDetailPage">
      <div class="page-toolbar">
        <div>
          <h2>问题监控</h2>
          <p>按监控问题维度汇总提问次数、提及率、推荐顺位、回答质量和标签分布。</p>
        </div>
        <div class="toolbar-actions">
          <el-input v-model="keyword" clearable placeholder="搜索监控问题 / 标签 / 品牌" :prefix-icon="Search" class="search-input" />
          <el-button plain><el-icon><Download /></el-icon>导出</el-button>
          <el-button type="primary" @click="handleEditSave">{{ editing ? '保存' : '编辑' }}</el-button>
        </div>
      </div>

      <el-row :gutter="14" class="summary-row">
        <el-col v-for="item in summaryCards" :key="item.label" :span="6">
          <div class="summary-card">
            <span class="metric-title">
              {{ item.label }}
              <el-tooltip :content="item.tip" placement="top">
                <i class="help-dot">?</i>
              </el-tooltip>
            </span>
            <strong>{{ item.value }}</strong>
            <p>{{ item.desc }}</p>
          </div>
        </el-col>
      </el-row>

      <el-row :gutter="14" class="top-list-row">
        <el-col :span="12">
          <el-card shadow="never" class="top-list-card">
            <template #header><strong>本品提及率高的问题 TOP10</strong></template>
            <div v-for="(item, index) in mentionTopQuestions" :key="item.id" class="top-list-item">
              <span class="rank-no">{{ index + 1 }}</span>
              <button type="button" class="top-question" @click="goToQuestion(item)">{{ item.question }}</button>
              <strong class="top-value">{{ item.mentionRate }}%</strong>
            </div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card shadow="never" class="top-list-card">
            <template #header><strong>平均顺位靠前的问题 TOP10</strong></template>
            <div v-for="(item, index) in rankTopQuestions" :key="item.id" class="top-list-item">
              <span class="rank-no">{{ index + 1 }}</span>
              <button type="button" class="top-question" @click="goToQuestion(item)">{{ item.question }}</button>
              <strong class="top-value">{{ item.avgRank }}</strong>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <el-card shadow="never" class="tag-metric-card">
        <template #header><strong>标签维度数据</strong></template>
        <el-table :data="tagMetrics" size="small" style="width: 100%" :header-cell-style="headerCellStyle" :cell-style="cellStyle">
          <el-table-column prop="tag" label="标签" min-width="150">
            <template #default="{ row }"><el-tag size="small" effect="plain">{{ row.tag }}</el-tag></template>
          </el-table-column>
          <el-table-column prop="count" label="问题数" width="90" align="center" />
          <el-table-column prop="askCount" label="提问次数" width="100" align="center" />
          <el-table-column label="平均提及率" width="120" align="center">
            <template #default="{ row }">{{ row.mentionRate }}%</template>
          </el-table-column>
          <el-table-column prop="avgRank" label="平均顺位" width="110" align="center" />
          <el-table-column prop="topQuestion" label="最高提及问题" min-width="240" show-overflow-tooltip />
          <el-table-column label="操作" width="100" align="center">
            <template #default="{ row }">
              <el-button link type="primary" @click="viewTagDetail(row)">查看详情</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <el-card shadow="never" class="table-card">
        <div class="table-title-row">
          <div>
            <h3>监控问题列表明细</h3>
            <p>一行代表一个监控问题，每个问题只归属一个真实问题标签。</p>
          </div>
          <el-button v-if="editing" type="primary" plain @click="handleAddQuestion">
            <el-icon><Plus /></el-icon>添加监控问题
          </el-button>
        </div>

        <el-table :data="pagedQuestions" class="monitor-table" row-key="id" style="width: 100%" :header-cell-style="headerCellStyle" :cell-style="cellStyle">
          <el-table-column v-if="editing" type="selection" width="42" />
          <el-table-column label="序号" width="64" align="center">
            <template #default="{ $index }">{{ (page - 1) * pageSize + $index + 1 }}</template>
          </el-table-column>
          <el-table-column label="监控问题" min-width="280" show-overflow-tooltip>
            <template #default="{ row }">
              <button type="button" class="question-link" @click="goToQuestion(row)">{{ row.question }}</button>
              <div class="question-meta">最近提问 {{ row.lastQueryTime }}</div>
            </template>
          </el-table-column>
          <el-table-column prop="tag" label="标签" width="150">
            <template #default="{ row }"><el-tag size="small">{{ row.tag }}</el-tag></template>
          </el-table-column>
          <el-table-column prop="askCount" label="提问次数" width="92" align="center" />
          <el-table-column label="本品提及率" width="112" align="center">
            <template #default="{ row }"><span :class="row.mentionRate >= 70 ? 'pass-text' : 'fail-text'">{{ row.mentionRate }}%</span></template>
          </el-table-column>
          <el-table-column label="平均顺位" width="96" align="center">
            <template #default="{ row }"><span :class="row.avgRank <= 3 ? 'pass-text' : 'fail-text'">{{ row.avgRank }}</span></template>
          </el-table-column>
          <el-table-column label="中正率" width="86" align="center">
            <template #default="{ row }">{{ row.neutralRate }}%</template>
          </el-table-column>
          <el-table-column label="准确率" width="86" align="center">
            <template #default="{ row }">{{ row.accuracyRate }}%</template>
          </el-table-column>
          <el-table-column label="覆盖模型" min-width="168">
            <template #default="{ row }">
              <div class="model-icons">
                <el-tooltip v-for="model in row.models" :key="model" :content="model" placement="top">
                  <span class="model-icon" :class="modelIconClass(model)">{{ modelIconText(model) }}</span>
                </el-tooltip>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="提及竞品品牌" min-width="190">
            <template #default="{ row }">
              <div class="tag-wrap">
                <el-tag v-for="brand in row.competitorMentions.slice(0, 3)" :key="brand" size="small" effect="plain">{{ brand }}</el-tag>
                <el-tooltip v-if="row.competitorMentions.length > 3" :content="row.competitorMentions.slice(3).join('、')" placement="top">
                  <el-tag size="small" effect="plain">+{{ row.competitorMentions.length - 3 }}</el-tag>
                </el-tooltip>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="108" align="center" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="goToQuestion(row)">详情</el-button>
              <el-button v-if="editing" link type="danger" @click="handleDeleteQuestion(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination-row">
          <span>共 {{ filteredQuestions.length }} 个监控问题</span>
          <el-pagination
            v-model:current-page="page"
            v-model:page-size="pageSize"
            background
            layout="sizes, prev, pager, next, jumper"
            :page-sizes="[10, 20, 50, 100]"
            :total="filteredQuestions.length"
            @size-change="handlePageSizeChange"
          />
        </div>
      </el-card>
    </template>

    <template v-else>
      <div v-if="currentQuestion" class="question-detail-page">
        <div class="detail-header">
          <div>
            <h2>{{ currentQuestion.question }}</h2>
            <p>{{ currentQuestion.tag }} · 累计提问 {{ currentQuestion.askCount }} 次 · 最近 {{ currentQuestion.lastQueryTime }}</p>
          </div>
        </div>

        <el-row :gutter="14" class="summary-row">
          <el-col v-for="item in detailCards" :key="item.label" :span="6">
            <div class="summary-card">
              <span class="metric-title">
                {{ item.label }}
                <el-tooltip :content="item.tip" placement="top">
                  <i class="help-dot">?</i>
                </el-tooltip>
              </span>
              <strong>{{ item.value }}</strong>
              <p>{{ item.desc }}</p>
            </div>
          </el-col>
        </el-row>

        <el-row :gutter="14" class="chart-row">
          <el-col :span="12"><el-card shadow="never" class="chart-card"><template #header><strong>本品提及率趋势</strong></template><div ref="mentionTrendRef" class="chart-box"></div></el-card></el-col>
          <el-col :span="12"><el-card shadow="never" class="chart-card"><template #header><strong>平均推荐顺位趋势</strong></template><div ref="rankTrendRef" class="chart-box"></div></el-card></el-col>
          <el-col :span="12"><el-card shadow="never" class="chart-card"><template #header><strong>各模型提及率</strong></template><div ref="modelRateRef" class="chart-box"></div></el-card></el-col>
          <el-col :span="12"><el-card shadow="never" class="chart-card"><template #header><strong>当前问题竞品提及 TOP10</strong></template><div ref="competitorRef" class="chart-box"></div></el-card></el-col>
        </el-row>

        <el-card shadow="never" class="table-card">
          <template #header>
            <div class="table-title-row">
              <div>
                <h3>问题执行记录</h3>
                <p>展示该监控问题在不同模型和轮次下的回答结果。</p>
              </div>
            </div>
          </template>
          <el-table :data="currentQuestion.records" class="monitor-table" style="width: 100%" :header-cell-style="headerCellStyle" :cell-style="cellStyle">
            <el-table-column type="index" label="序号" width="64" align="center" />
            <el-table-column prop="model" label="模型" width="120" />
            <el-table-column prop="queryTime" label="查询时间" width="150" />
            <el-table-column label="本品提及" width="96" align="center"><template #default="{ row }"><el-tag :type="row.mentioned ? 'success' : 'danger'" effect="plain" size="small">{{ row.mentioned ? '已提及' : '未提及' }}</el-tag></template></el-table-column>
            <el-table-column prop="rank" label="本品顺位" width="96" align="center" />
            <el-table-column prop="sentiment" label="情绪" width="96" align="center" />
            <el-table-column label="提及竞品品牌" min-width="220"><template #default="{ row }"><div class="tag-wrap"><el-tag v-for="brand in row.brands" :key="brand" size="small" effect="plain">{{ brand }}</el-tag></div></template></el-table-column>
            <el-table-column prop="summary" label="回答摘要" min-width="260" show-overflow-tooltip />
          </el-table>
        </el-card>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Download, Plus, Search } from '@element-plus/icons-vue'
import * as echarts from 'echarts'

const route = useRoute()
const router = useRouter()
const keyword = ref('')
const editing = ref(false)
const page = ref(1)
const pageSize = ref(20)

const mentionTrendRef = ref(null)
const rankTrendRef = ref(null)
const modelRateRef = ref(null)
const competitorRef = ref(null)
const chartInstances = []

const models = ['豆包', '元宝', 'DeepSeek', '通义千问', '文心一言', 'Kimi']
const competitorPool = ['艾维诺', '贝亲', '妙思乐', '纽强', '丝塔芙', '启初', '玉泽', '理肤泉', '戴可思', '松达', '凡士林', '施巴', '适乐肤', '薇诺娜', '优色林']
const tagPool = ['湿疹护理', '敏感肌与屏障修护', '保湿防干裂', '选购测评与榜单', '安全温和', '未分类']
const baseQuestions = [
  '湿疹宝宝护肤品牌推荐', '婴儿湿疹用什么护肤品好', '儿童湿疹霜排行榜', '湿疹宝宝面霜什么牌子好用',
  '宝宝湿疹护肤哪个牌子好', '婴儿湿疹特护护肤霜', '儿童湿疹特护霜', '新生儿湿疹膏推荐',
  '湿疹宝宝皮肤干痒红用什么保湿霜', '宝宝湿疹红疹修护霜', '婴儿皮肤干痒红裂护理霜', '宝宝湿疹润肤霜',
  '新生儿湿疹怎么护理', '宝宝湿疹反复怎么办', '婴儿湿疹如何保湿', '湿疹宝宝怎么好得快',
  '敏感肌宝宝护肤品', '秋冬宝宝皮肤干痒护理', '新生儿皮肤屏障修复霜', '换季敏感宝宝护肤品推荐',
  '宝宝护肤品怎么选', '婴幼儿护肤品选购攻略', '婴儿护肤品好物推荐清单', '宝宝敏感肌护肤推荐品牌',
  '敏感肌面霜前10品牌', '儿童过敏护肤推荐品牌', '婴幼儿护肤全套产品推荐', '新生儿护肤品精选推荐',
  '幼童护肤品测评推荐', '宝宝舒缓修护护肤品推荐', '新生儿补水护肤品推荐', '婴幼儿防皴防干裂护肤品推荐',
  '宝宝敏感肌专用护肤品推荐', '婴幼儿屏障修护护肤品推荐', '宝宝泛红干痒护肤品推荐', '婴幼儿清爽保湿护肤品推荐',
  '无激素婴儿湿疹霜', '温和安全的宝宝湿疹霜', '适合敏感肌宝宝的湿疹霜'
]

const classifyQuestion = (text) => {
  if (/无激素|温和|安全/.test(text)) return '安全温和'
  if (/湿疹/.test(text)) return '湿疹护理'
  if (/敏感肌|屏障|修护|舒缓|过敏|泛红/.test(text)) return '敏感肌与屏障修护'
  if (/保湿|补水|防皴|干裂|干痒|秋冬|换季|清爽/.test(text)) return '保湿防干裂'
  if (/推荐|排行榜|前10|测评|选购|攻略|清单|精选|全套|怎么选|好物/.test(text)) return '选购测评与榜单'
  return '未分类'
}

const createQuestion = (text, index) => {
  const askCount = 36 + index * 5 + (index % 4) * 3
  const mentionRate = Math.max(24, Math.min(94, 63 + ((index * 11) % 34) - (index % 5) * 4))
  const avgRank = Number(Math.max(1.2, Math.min(7.8, 1.7 + (index % 9) * 0.46 + (index % 4) * 0.18)).toFixed(1))
  const trendDates = Array.from({ length: 10 }, (_, i) => `05-${String(14 + i).padStart(2, '0')}`)
  const trend = trendDates.map((date, i) => ({
    date,
    mentionRate: Math.round(Math.max(22, Math.min(96, mentionRate + Math.sin((i + index) * 0.8) * 9 + ((i % 3) - 1) * 4))),
    avgRank: Number(Math.max(1, Math.min(8, avgRank + Math.cos((i + index) * 0.7) * 0.55 + ((i % 4) - 1.5) * 0.12)).toFixed(1))
  }))
  const competitorMentions = competitorPool.slice(index % 8, (index % 8) + 6)
  const brandMentions = competitorPool
    .map((brand, i) => ({ brand, value: Math.max(4, 62 - i * 4 + ((index + i) % 5) * 2) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10)
  return {
    id: `Q${String(index + 1).padStart(3, '0')}`,
    question: text,
    tag: classifyQuestion(text),
    askCount,
    mentionRate,
    avgRank,
    neutralRate: Math.min(98, 72 + (index * 5) % 24),
    accuracyRate: Math.min(96, 68 + (index * 6) % 25),
    models,
    competitorMentions,
    lastQueryTime: `2026/05/${String(22 - (index % 4)).padStart(2, '0')} ${String(9 + (index % 7)).padStart(2, '0')}:30`,
    trend,
    modelRates: models.map((model, i) => ({ model, value: Math.max(35, Math.min(96, mentionRate + (i - 2) * 4 + (index % 3) * 2)) })),
    brandMentions,
    records: Array.from({ length: 12 }, (_, i) => ({
      id: `${index}-${i}`,
      model: models[i % models.length],
      queryTime: `2026/05/${String(22 - (i % 5)).padStart(2, '0')} ${String(10 + i).padStart(2, '0')}:12`,
      mentioned: (i + index) % 4 !== 1,
      rank: (i + index) % 4 !== 1 ? ((i + index) % 5) + 1 : '-',
      sentiment: i % 5 === 0 ? '中性' : '正向',
      brands: competitorMentions.slice(0, 2 + (i % 3)),
      summary: '回答围绕宝宝湿疹护理、保湿修护和温和安全展开，并提及多个母婴护肤品牌。'
    }))
  }
}

const questions = ref(baseQuestions.map(createQuestion))
const isDetailPage = computed(() => Boolean(route.params.questionId))
const isTagDetailPage = computed(() => Boolean(route.query.tag) && !isDetailPage.value)
const currentTagName = computed(() => String(route.query.tag || ''))
const currentQuestion = computed(() => questions.value.find(item => item.id === route.params.questionId))
const currentTagQuestions = computed(() => questions.value.filter(item => item.tag === currentTagName.value))
const tagMentionList = computed(() => [...currentTagQuestions.value].sort((a, b) => b.mentionRate - a.mentionRate))
const tagRankList = computed(() => [...currentTagQuestions.value].sort((a, b) => a.avgRank - b.avgRank))
const mentionTopQuestions = computed(() => [...questions.value].sort((a, b) => b.mentionRate - a.mentionRate).slice(0, 10))
const rankTopQuestions = computed(() => [...questions.value].sort((a, b) => a.avgRank - b.avgRank).slice(0, 10))

const filteredQuestions = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  if (!kw) return questions.value
  return questions.value.filter(item => [item.question, item.tag, ...item.competitorMentions].join(' ').toLowerCase().includes(kw))
})
const pagedQuestions = computed(() => filteredQuestions.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value))

const createMetricCards = (list) => {
  const totalAsk = list.reduce((sum, item) => sum + item.askCount, 0)
  const avgMention = list.length ? Math.round(list.reduce((sum, item) => sum + item.mentionRate, 0) / list.length) : 0
  const avgRank = list.length ? (list.reduce((sum, item) => sum + item.avgRank, 0) / list.length).toFixed(1) : '-'
  return [
    { label: '监控问题', value: list.length, desc: '当前范围内的问题数', tip: '当前范围已配置并纳入监控的问题总量。' },
    { label: '累计提问', value: totalAsk, desc: '历史提问次数', tip: '按问题和模型汇总后的历史执行次数。' },
    { label: '平均提及率', value: `${avgMention}%`, desc: '按问题汇总后的均值', tip: '本品被 AI 回答提及的次数占有效测试次数的比例。' },
    { label: '平均顺位', value: avgRank, desc: '越接近 1 表现越好', tip: '本品在多次回答中的推荐排名均值，可出现小数。' }
  ]
}
const summaryCards = computed(() => createMetricCards(filteredQuestions.value))
const tagDetailCards = computed(() => createMetricCards(currentTagQuestions.value))
const detailCards = computed(() => currentQuestion.value ? [
  { label: '提问次数', value: currentQuestion.value.askCount, desc: '该问题历史执行次数', tip: '该监控问题在所有模型和轮次中的累计执行次数。' },
  { label: '本品提及率', value: `${currentQuestion.value.mentionRate}%`, desc: '本品被 AI 提及的比例', tip: '该问题回答中提及本品的比例。' },
  { label: '平均推荐顺位', value: currentQuestion.value.avgRank, desc: '多轮回答中的平均排名', tip: '该问题下本品推荐顺位的平均值，越接近 1 越好。' },
  { label: '回答准确率', value: `${currentQuestion.value.accuracyRate}%`, desc: '品牌信息描述准确比例', tip: '回答中本品信息描述准确的比例。' }
] : [])

const tagMetrics = computed(() => tagPool.map(tag => {
  const list = questions.value.filter(item => item.tag === tag)
  const askCount = list.reduce((sum, item) => sum + item.askCount, 0)
  const mentionRate = list.length ? Math.round(list.reduce((sum, item) => sum + item.mentionRate, 0) / list.length) : 0
  const avgRank = list.length ? (list.reduce((sum, item) => sum + item.avgRank, 0) / list.length).toFixed(1) : '-'
  const topQuestion = [...list].sort((a, b) => b.mentionRate - a.mentionRate)[0]?.question || '-'
  return { tag, count: list.length, askCount, mentionRate, avgRank, topQuestion }
}))

const headerCellStyle = { background: '#f8fafc', color: '#64748b', fontWeight: 700, height: '40px' }
const cellStyle = { borderColor: '#eef2f7' }

const handlePageSizeChange = () => { page.value = 1 }
const goToQuestion = row => router.push(`/project/${route.params.id}/monitor/${row.id}`)
const backToList = () => router.push(`/project/${route.params.id}/monitor`)
const viewTagDetail = row => router.push({ path: `/project/${route.params.id}/monitor`, query: { tag: row.tag } })
const handleEditSave = () => { editing.value = !editing.value; ElMessage.success(editing.value ? '已进入编辑状态' : '已保存监控问题配置') }
const handleAddQuestion = () => { questions.value.unshift(createQuestion('新增监控问题', questions.value.length + 1)); ElMessage.success('已添加监控问题') }
const handleDeleteQuestion = async row => {
  try {
    await ElMessageBox.confirm('确认删除该监控问题？', '删除确认', { type: 'warning' })
    questions.value = questions.value.filter(item => item.id !== row.id)
    ElMessage.success('已删除')
  } catch (error) {}
}

const modelIconMeta = {
  豆包: { text: 'DB', className: 'model-doubao' },
  元宝: { text: 'YB', className: 'model-yuanbao' },
  DeepSeek: { text: 'DS', className: 'model-deepseek' },
  通义千问: { text: 'QW', className: 'model-qwen' },
  文心一言: { text: 'WX', className: 'model-ernie' },
  Kimi: { text: 'KM', className: 'model-kimi' }
}
const modelIconText = model => modelIconMeta[model]?.text || model.slice(0, 2).toUpperCase()
const modelIconClass = model => modelIconMeta[model]?.className || 'model-default'

const disposeCharts = () => chartInstances.splice(0).forEach(chart => chart.dispose())
const resizeCharts = () => chartInstances.forEach(chart => chart.resize())
const initChart = (el, option) => {
  if (!el) return
  const chart = echarts.init(el)
  chart.setOption(option)
  chartInstances.push(chart)
  requestAnimationFrame(() => chart.resize())
}
const renderDetailCharts = async () => {
  if (!currentQuestion.value) return
  await nextTick()
  disposeCharts()
  const item = currentQuestion.value
  initChart(mentionTrendRef.value, {
    grid: { left: 44, right: 20, top: 24, bottom: 32 },
    tooltip: { trigger: 'axis', valueFormatter: value => `${value}%` },
    xAxis: { type: 'category', data: item.trend.map(row => row.date), axisTick: { show: false }, axisLabel: { color: '#94a3b8' } },
    yAxis: { type: 'value', min: 0, max: 100, axisLabel: { formatter: '{value}%', color: '#94a3b8' }, splitLine: { lineStyle: { type: 'dashed', color: '#e5e7eb' } } },
    series: [{ type: 'line', smooth: true, symbolSize: 7, data: item.trend.map(row => row.mentionRate), lineStyle: { width: 3, color: '#2563eb' }, itemStyle: { color: '#2563eb' }, areaStyle: { color: 'rgba(37,99,235,.10)' } }]
  })
  initChart(rankTrendRef.value, {
    grid: { left: 44, right: 20, top: 24, bottom: 32 },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: item.trend.map(row => row.date), axisTick: { show: false }, axisLabel: { color: '#94a3b8' } },
    yAxis: { type: 'value', inverse: true, min: 1, max: 8, axisLabel: { color: '#94a3b8' }, splitLine: { lineStyle: { type: 'dashed', color: '#e5e7eb' } } },
    series: [{ type: 'line', smooth: true, symbolSize: 7, data: item.trend.map(row => row.avgRank), lineStyle: { width: 3, color: '#10b981' }, itemStyle: { color: '#10b981' } }]
  })
  initChart(modelRateRef.value, {
    grid: { left: 44, right: 20, top: 24, bottom: 32 },
    tooltip: { trigger: 'axis', valueFormatter: value => `${value}%` },
    xAxis: { type: 'category', data: item.modelRates.map(row => row.model), axisLabel: { interval: 0, color: '#94a3b8' }, axisTick: { show: false } },
    yAxis: { type: 'value', max: 100, axisLabel: { formatter: '{value}%', color: '#94a3b8' }, splitLine: { lineStyle: { type: 'dashed', color: '#e5e7eb' } } },
    series: [{ type: 'bar', barWidth: 26, data: item.modelRates.map(row => row.value), itemStyle: { color: '#3b82f6' }, label: { show: true, position: 'top', formatter: '{c}%', color: '#64748b' } }]
  })
  initChart(competitorRef.value, {
    grid: { left: 80, right: 22, top: 20, bottom: 24 },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'value', axisLabel: { color: '#94a3b8' }, splitLine: { lineStyle: { type: 'dashed', color: '#e5e7eb' } } },
    yAxis: { type: 'category', data: item.brandMentions.map(row => row.brand).reverse(), axisTick: { show: false }, axisLabel: { color: '#8a95a6' } },
    series: [{ type: 'bar', barWidth: 18, data: item.brandMentions.map(row => row.value).reverse(), itemStyle: { color: '#60a5fa' }, label: { show: true, position: 'right', color: '#64748b' } }]
  })
}
const scheduleRenderCharts = async () => {
  await nextTick()
  requestAnimationFrame(() => {
    if (isDetailPage.value) renderDetailCharts()
    else disposeCharts()
  })
}
watch(() => route.params.questionId, scheduleRenderCharts)
watch(() => route.query.tag, scheduleRenderCharts)
watch(questions, scheduleRenderCharts, { deep: true })
watch(filteredQuestions, () => { page.value = 1 })
onMounted(() => {
  scheduleRenderCharts()
  window.addEventListener('resize', resizeCharts)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeCharts)
  disposeCharts()
})
</script>

<style scoped>
.problem-monitor-page { min-height: 100%; color: #111827; }
.page-toolbar, .detail-header, .table-title-row, .toolbar-actions, .pagination-row { display: flex; align-items: center; justify-content: space-between; gap: 14px; }
.page-toolbar { margin-bottom: 12px; }
.page-toolbar h2, .detail-header h2 { margin: 0; font-size: 22px; font-weight: 800; }
.page-toolbar p, .detail-header p, .table-title-row p { margin: 5px 0 0; color: #8a95a6; font-size: 13px; }
.search-input { width: 260px; }
.summary-row, .top-list-row, .chart-row, .tag-metric-card { margin-bottom: 14px; }
.summary-card { height: 96px; padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px; background: #fff; box-sizing: border-box; }
.metric-title { display: inline-flex; align-items: center; gap: 5px; color: #8a95a6; font-size: 13px; }
.help-dot { width: 15px; height: 15px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; border: 1px solid #cbd5e1; color: #94a3b8; font-size: 11px; font-style: normal; cursor: help; }
.summary-card strong { display: block; margin-top: 8px; color: #111827; font-size: 26px; line-height: 1; }
.summary-card p { margin: 8px 0 0; color: #94a3b8; font-size: 12px; }
.table-card, .chart-card, .top-list-card, .tag-metric-card { border-radius: 8px; border: 1px solid #e5e7eb; }
.tag-list-card { min-height: 340px; }
.tag-rank-list { display: flex; flex-direction: column; gap: 8px; }
.tag-rank-item { display: grid; grid-template-columns: 32px minmax(0, 1fr) auto; align-items: center; gap: 10px; width: 100%; padding: 10px; border: 1px solid #eef2f7; border-radius: 8px; background: #fff; text-align: left; cursor: pointer; transition: border-color .18s ease, background-color .18s ease, box-shadow .18s ease; }
.tag-rank-item:hover { border-color: #bfdbfe; background: #f8fbff; box-shadow: 0 8px 20px rgba(15, 23, 42, .05); }
.tag-rank-main { min-width: 0; display: flex; flex-direction: column; gap: 4px; }
.tag-rank-main strong { overflow: hidden; color: #334155; font-size: 13px; font-weight: 700; line-height: 1.35; text-overflow: ellipsis; white-space: nowrap; }
.tag-rank-main em { color: #94a3b8; font-size: 12px; font-style: normal; }
.metric-pill { min-width: 72px; padding: 5px 8px; border-radius: 999px; background: #f8fafc; color: #475569; font-size: 12px; font-weight: 800; text-align: center; }
.metric-pill.is-good { background: #ecfdf5; color: #047857; }
.metric-pill.is-risk { background: #fff7ed; color: #c2410c; }
.top-list-card { height: 418px; }
.top-list-item { display: grid; grid-template-columns: 32px 1fr 64px; align-items: center; gap: 10px; min-height: 34px; padding: 7px 0; border-bottom: 1px solid #f1f5f9; }
.top-list-item:last-child { border-bottom: 0; }
.rank-no { width: 22px; height: 22px; display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; background: #eff6ff; color: #2563eb; font-size: 12px; font-weight: 800; }
.top-question { min-width: 0; padding: 0; border: 0; background: transparent; color: #334155; font-size: 13px; font-weight: 700; text-align: left; cursor: pointer; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.top-question:hover { color: #2563eb; }
.top-value { text-align: right; color: #111827; font-size: 14px; }
.table-title-row { margin-bottom: 12px; }
.table-title-row h3 { margin: 0; color: #111827; font-size: 16px; font-weight: 800; }
.monitor-table { border: 1px solid #eef2f7; border-bottom: 0; }
.question-link { max-width: 100%; padding: 0; border: 0; background: transparent; color: #2563eb; font-weight: 700; cursor: pointer; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.question-link:hover { text-decoration: underline; }
.question-meta { margin-top: 4px; color: #94a3b8; font-size: 12px; }
.tag-wrap, .model-icons { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.model-icon { width: 26px; height: 26px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; color: #fff; font-size: 10px; font-weight: 800; letter-spacing: 0; background: #64748b; box-shadow: inset 0 0 0 1px rgba(255,255,255,.2); }
.model-doubao { background: #2563eb; }
.model-yuanbao { background: #0ea5e9; }
.model-deepseek { background: #111827; }
.model-qwen { background: #7c3aed; }
.model-ernie { background: #dc2626; }
.model-kimi { background: #059669; }
.model-default { background: #64748b; }
.pass-text { color: #059669; font-weight: 700; }
.fail-text { color: #dc2626; font-weight: 700; }
.pagination-row { padding-top: 12px; color: #8a95a6; font-size: 12px; }
.detail-header { margin-bottom: 14px; padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px; background: #fff; }
.chart-row { row-gap: 14px; }
.chart-box { height: 300px; min-height: 300px; width: 100%; }
:deep(.chart-card .el-card__header), :deep(.tag-metric-card .el-card__header), :deep(.top-list-card .el-card__header) { padding: 12px 16px; }
:deep(.chart-card .el-card__body), :deep(.top-list-card .el-card__body) { padding: 10px 16px 12px; }
@media (max-width: 1200px) {
  .search-input { width: 210px; }
  .chart-box { height: 260px; min-height: 260px; }
  .tag-rank-item { grid-template-columns: 28px minmax(0, 1fr); }
  .metric-pill { grid-column: 2; justify-self: start; }
}
</style>
