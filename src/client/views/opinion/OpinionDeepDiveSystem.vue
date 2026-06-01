<template>
  <div class="opinion-page">
    <div class="page-head">
      <div>
        <h2>AI 全域舆情深钻系统</h2>
        <p>从检测主题出发，自动生成问题、发现线索、沉淀证据链，并输出风险预警与分析报告。</p>
      </div>
      <el-button type="primary" @click="generateDemo">
        <el-icon><MagicStick /></el-icon>
        生成演示分析
      </el-button>
    </div>

    <el-card shadow="never" class="topic-card">
      <el-row :gutter="16">
        <el-col :span="8">
          <el-form-item label="检测主题">
            <el-input v-model="topicForm.brand" placeholder="例如：奥迪E7X换壳争议" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="主题描述">
            <el-input v-model="topicForm.desc" placeholder="例如：判断负面是否扩散、是否影响购买" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="竞品/关联对象">
            <el-input v-model="topicForm.competitors" placeholder="例如：智己LS7、问界M7" />
          </el-form-item>
        </el-col>
      </el-row>
      <div class="agent-flow">
        <span v-for="agent in agents" :key="agent">{{ agent }}</span>
      </div>
    </el-card>

    <section v-if="activeView === 'overview'" class="view-section">
      <el-row :gutter="16" class="metric-row">
        <el-col :span="6" v-for="metric in overviewMetrics" :key="metric.label">
          <el-card shadow="never" class="metric-card">
            <div class="metric-label">{{ metric.label }}</div>
            <div class="metric-value" :class="metric.type">{{ metric.value }}</div>
            <div class="metric-desc">{{ metric.desc }}</div>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="14">
          <el-card shadow="never" class="panel">
            <template #header>风险趋势</template>
            <div class="trend-chart">
              <svg viewBox="0 0 640 220" preserveAspectRatio="none">
                <polyline :points="trendPoints" fill="none" stroke="#f56c6c" stroke-width="4" />
                <g v-for="point in trendData" :key="point.day">
                  <circle :cx="point.x" :cy="point.y" r="5" fill="#f56c6c" />
                  <text :x="point.x" :y="point.y - 12" text-anchor="middle">{{ point.value }}</text>
                </g>
              </svg>
            </div>
          </el-card>
        </el-col>
        <el-col :span="10">
          <el-card shadow="never" class="panel">
            <template #header>平台分布</template>
            <div class="platform-list">
              <div v-for="item in platformDistribution" :key="item.name" class="platform-item">
                <span>{{ item.name }}</span>
                <el-progress :percentage="item.value" :stroke-width="10" />
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </section>

    <section v-if="activeView === 'questions'" class="view-section">
      <el-card shadow="never" class="panel question-generator">
        <template #header>智能舆情问题生成</template>
        <el-row :gutter="16">
          <el-col :span="7">
            <el-form-item label="品牌名称">
              <el-input v-model="questionSeed.brand" placeholder="例如：奥迪E7X" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="行业">
              <el-select v-model="questionSeed.industry" class="full-width" placeholder="选择行业">
                <el-option label="汽车" value="汽车" />
                <el-option label="母婴/食品" value="母婴/食品" />
                <el-option label="酒店/门店" value="酒店/门店" />
                <el-option label="美妆个护" value="美妆个护" />
                <el-option label="医疗健康" value="医疗健康" />
                <el-option label="教育培训" value="教育培训" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="7">
            <el-form-item label="竞品">
              <el-input v-model="questionSeed.competitors" placeholder="例如：智己LS7、问界M7" />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="操作">
              <el-button type="primary" class="full-width" @click="generateQuestions">
                <el-icon><MagicStick /></el-icon>
                一键生成
              </el-button>
            </el-form-item>
          </el-col>
        </el-row>
        <div class="profile-strip">
          <div>
            <span>品牌档案</span>
            <strong>{{ brandProfile }}</strong>
          </div>
          <div>
            <span>生成逻辑</span>
            <strong>品牌认知、负面风险、竞品对比、购买决策、AI引用信源</strong>
          </div>
        </div>
      </el-card>

      <el-card shadow="never" class="panel">
        <template #header>
          <div class="panel-head">
            <span>系统自动生成的问题列表</span>
            <el-button size="small" type="primary" plain @click="addQuestion">新增问题</el-button>
          </div>
        </template>
        <el-table :data="questions" stripe>
          <el-table-column prop="question" label="问题" min-width="280" />
          <el-table-column prop="type" label="类型" width="120" />
          <el-table-column prop="priority" label="优先级" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="row.priority === '高' ? 'danger' : row.priority === '中' ? 'warning' : 'info'" size="small">{{ row.priority }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="platform" label="推荐平台" width="140" />
          <el-table-column prop="keywords" label="搜索关键词" min-width="180" />
          <el-table-column prop="reason" label="触发原因" min-width="180" />
          <el-table-column label="状态" width="110" align="center">
            <template #default="{ row }">
              <el-switch v-model="row.enabled" active-text="启用" inactive-text="停用" inline-prompt />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="140" align="center" fixed="right">
            <template #default="{ row, $index }">
              <el-button size="small" text type="primary" @click="editQuestion(row, $index)">
                <el-icon><Edit /></el-icon>
                编辑
              </el-button>
              <el-button size="small" text type="danger" @click="deleteQuestion($index)">
                <el-icon><Delete /></el-icon>
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </section>

    <section v-if="activeView === 'clues'" class="view-section">
      <el-card shadow="never" class="panel">
        <template #header>
          <div class="panel-head">
            <span>舆情线索池</span>
            <el-button size="small" type="primary" plain @click="analyzeClues">
              <el-icon><MagicStick /></el-icon>
              AI 聚类线索
            </el-button>
          </div>
        </template>
        <div class="pipeline-steps">
          <div v-for="step in cluePipeline" :key="step.title" class="pipeline-step">
            <span>{{ step.index }}</span>
            <strong>{{ step.title }}</strong>
            <em>{{ step.desc }}</em>
          </div>
        </div>
      </el-card>

      <div class="clue-grid">
        <el-card v-for="clue in clues" :key="clue.name" shadow="never" class="clue-card" @click="openClueDetail(clue)">
          <div class="clue-head">
            <div>
              <h3>{{ clue.name }}</h3>
              <p>{{ clue.summary }}</p>
            </div>
            <el-tag :type="getClueRiskType(clue.risk)" effect="dark">{{ clue.risk }}风险</el-tag>
          </div>
          <div class="clue-score-row">
            <div>
              <span>风险分</span>
              <strong>{{ clue.score }}</strong>
            </div>
            <div>
              <span>证据数量</span>
              <strong>{{ clue.evidence }}</strong>
            </div>
            <div>
              <span>情绪倾向</span>
              <strong>{{ clue.sentiment }}</strong>
            </div>
          </div>
          <div class="mini-trend">
            <svg viewBox="0 0 260 54" preserveAspectRatio="none">
              <polyline :points="getClueTrendPoints(clue.trend)" fill="none" stroke="#2563eb" stroke-width="3" />
            </svg>
          </div>
          <div class="clue-platforms">
            <el-tag v-for="platform in clue.platforms" :key="platform" size="small" effect="plain">{{ platform }}</el-tag>
          </div>
          <div class="clue-actions">
            <el-tag :type="clue.needDeepDive ? 'danger' : 'info'" size="small" effect="plain">
              {{ clue.needDeepDive ? '需要深钻' : '暂不深钻' }}
            </el-tag>
            <el-button size="small" type="primary" plain @click.stop="openClueDetail(clue)">查看详情</el-button>
          </div>
        </el-card>
      </div>
    </section>

    <section v-if="activeView === 'deepDive'" class="view-section">
      <div class="deep-dive-layout">
        <el-card shadow="never" class="panel deep-left">
          <template #header>舆情线索</template>
          <div
            v-for="(clue, index) in clues"
            :key="clue.name"
            class="deep-clue-item"
            :class="{ active: selectedDeepClueIndex === index }"
            @click="selectedDeepClueIndex = index"
          >
            <div class="deep-clue-title">
              <strong>{{ clue.name }}</strong>
              <el-tag :type="getClueRiskType(clue.risk)" size="small">{{ clue.risk }}</el-tag>
            </div>
            <p>{{ clue.summary }}</p>
            <div class="deep-clue-meta">
              <span>证据 {{ clue.evidence }}</span>
              <span>{{ clue.sentiment }}</span>
              <span>{{ clue.needDeepDive ? '需要深钻' : '暂不深钻' }}</span>
            </div>
          </div>
        </el-card>

        <el-card shadow="never" class="panel deep-middle">
          <template #header>
            <div class="panel-head">
              <span>自动生成的深钻问题</span>
              <el-button size="small" type="primary" plain @click="generateDeepDive">重新生成</el-button>
            </div>
          </template>
          <div class="deep-question-list">
            <div v-for="item in currentDeepDiveQuestions" :key="item.question" class="deep-question-card">
              <div class="deep-question-head">
                <strong>{{ item.question }}</strong>
                <el-tag :type="item.level === '高' ? 'danger' : 'warning'" size="small">{{ item.level }}优先级</el-tag>
              </div>
              <p>{{ item.conclusion }}</p>
              <div class="analysis-result">
                <span>分析结论</span>
                <strong>{{ item.result }}</strong>
              </div>
              <div class="related-evidence">关联证据：{{ item.evidence }}</div>
            </div>
          </div>
        </el-card>

        <el-card shadow="never" class="panel deep-right">
          <template #header>证据链与风险判断</template>
          <div class="risk-verdict">
            <span>综合风险判断</span>
            <strong>{{ currentRiskVerdict.level }}</strong>
            <p>{{ currentRiskVerdict.summary }}</p>
          </div>
          <div class="evidence-stack">
            <div v-for="item in currentEvidenceChain" :key="item.source" class="evidence-card">
              <div class="evidence-head">
                <strong>{{ item.source }}</strong>
                <el-tag :type="item.strength === '强' ? 'danger' : 'warning'" size="small">{{ item.strength }}</el-tag>
              </div>
              <p>{{ item.summary }}</p>
              <div class="evidence-meta">
                <span>可信度 {{ item.credibility }}</span>
                <span>{{ item.canQuote ? '可引用' : '不建议引用' }}</span>
              </div>
            </div>
          </div>
          <div class="next-actions">
            <span>下一步建议</span>
            <ul>
              <li v-for="action in currentRiskVerdict.actions" :key="action">{{ action }}</li>
            </ul>
          </div>
        </el-card>
      </div>
    </section>

    <section v-if="activeView === 'evidence'" class="view-section">
      <el-card shadow="never" class="panel">
        <template #header>证据链</template>
        <el-table :data="evidenceList" stripe>
          <el-table-column prop="source" label="证据来源" width="160" />
          <el-table-column prop="summary" label="内容摘要" min-width="280" />
          <el-table-column prop="credibility" label="可信度" width="110" align="center" />
          <el-table-column prop="strength" label="证据强度" width="110" align="center" />
          <el-table-column prop="canQuote" label="可引用" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="row.canQuote ? 'success' : 'info'" size="small">{{ row.canQuote ? '是' : '否' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="link" label="链接" width="120">
            <template #default="{ row }">
              <el-link type="primary" :underline="false">{{ row.link }}</el-link>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </section>

    <section v-if="activeView === 'alerts'" class="view-section">
      <el-card shadow="never" class="panel">
        <template #header>风险预警</template>
        <el-table :data="alerts" stripe>
          <el-table-column prop="type" label="预警类型" width="160" />
          <el-table-column prop="condition" label="触发条件" min-width="240" />
          <el-table-column prop="level" label="风险等级" width="110" align="center">
            <template #default="{ row }">
              <el-tag :type="row.level === '高' ? 'danger' : 'warning'" size="small">{{ row.level }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="suggestion" label="处理建议" min-width="260" />
          <el-table-column prop="status" label="状态" width="120" align="center" />
        </el-table>
      </el-card>
    </section>

    <section v-if="activeView === 'reports'" class="view-section">
      <el-row :gutter="16">
        <el-col :span="8" v-for="report in reports" :key="report.name">
          <el-card shadow="never" class="report-card">
            <h3>{{ report.name }}</h3>
            <p>{{ report.desc }}</p>
            <div class="report-meta">{{ report.period }} · {{ report.status }}</div>
            <el-button size="small" type="primary" plain>HTML 预览</el-button>
          </el-card>
        </el-col>
      </el-row>
    </section>

    <el-dialog v-model="questionDialogVisible" title="编辑监控问题" width="640px" destroy-on-close>
      <el-form :model="questionForm" label-position="top">
        <el-form-item label="问题内容">
          <el-input v-model="questionForm.question" type="textarea" :rows="3" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="类型">
              <el-select v-model="questionForm.type" class="full-width">
                <el-option label="品牌认知" value="品牌认知" />
                <el-option label="负面风险" value="负面风险" />
                <el-option label="竞品对比" value="竞品对比" />
                <el-option label="购买影响" value="购买影响" />
                <el-option label="AI认知" value="AI认知" />
                <el-option label="风险归因" value="风险归因" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="优先级">
              <el-select v-model="questionForm.priority" class="full-width">
                <el-option label="高" value="高" />
                <el-option label="中" value="中" />
                <el-option label="低" value="低" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="推荐平台">
              <el-input v-model="questionForm.platform" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="搜索关键词">
          <el-input v-model="questionForm.keywords" />
        </el-form-item>
        <el-form-item label="触发原因">
          <el-input v-model="questionForm.reason" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="questionDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveQuestion">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="clueDetailVisible" title="舆情线索详情" width="760px">
      <div v-if="selectedClue" class="clue-detail">
        <div class="clue-detail-head">
          <div>
            <h3>{{ selectedClue.name }}</h3>
            <p>{{ selectedClue.summary }}</p>
          </div>
          <el-tag :type="getClueRiskType(selectedClue.risk)" effect="dark">{{ selectedClue.risk }}风险</el-tag>
        </div>
        <el-row :gutter="12" class="detail-metrics">
          <el-col :span="6">
            <div class="detail-metric"><span>风险分</span><strong>{{ selectedClue.score }}</strong></div>
          </el-col>
          <el-col :span="6">
            <div class="detail-metric"><span>证据数量</span><strong>{{ selectedClue.evidence }}</strong></div>
          </el-col>
          <el-col :span="6">
            <div class="detail-metric"><span>情绪倾向</span><strong>{{ selectedClue.sentiment }}</strong></div>
          </el-col>
          <el-col :span="6">
            <div class="detail-metric"><span>深钻判断</span><strong>{{ selectedClue.needDeepDive ? '需要' : '暂不需要' }}</strong></div>
          </el-col>
        </el-row>
        <div class="detail-block">
          <span>涉及平台</span>
          <div class="clue-platforms">
            <el-tag v-for="platform in selectedClue.platforms" :key="platform" size="small" effect="plain">{{ platform }}</el-tag>
          </div>
        </div>
        <div class="detail-block">
          <span>AI 聚类结论</span>
          <p>{{ selectedClue.aiConclusion }}</p>
        </div>
        <div class="detail-block">
          <span>声量趋势</span>
          <div class="detail-trend">
            <svg viewBox="0 0 640 120" preserveAspectRatio="none">
              <polyline :points="getDetailTrendPoints(selectedClue.trend)" fill="none" stroke="#f56c6c" stroke-width="4" />
            </svg>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="clueDetailVisible = false">关闭</el-button>
        <el-button type="primary" @click="goSection('deepDive')">进入深钻分析</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Delete, Edit, MagicStick } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const activeView = computed(() => {
  const section = route.path.split('/').pop()
  const sectionMap = {
    overview: 'overview',
    questions: 'questions',
    clues: 'clues',
    'deep-dive': 'deepDive',
    deepDive: 'deepDive',
    evidence: 'evidence',
    alerts: 'alerts',
    reports: 'reports'
  }
  return sectionMap[section] || 'overview'
})

const topicForm = reactive({
  brand: '奥迪E7X换壳争议',
  desc: '判断负面是否扩散、是否影响购买决策',
  competitors: '智己LS7、问界M7'
})

const questionSeed = reactive({
  brand: '奥迪E7X',
  industry: '汽车',
  competitors: '智己LS7、问界M7'
})

const questionDialogVisible = ref(false)
const clueDetailVisible = ref(false)
const selectedClue = ref(null)
const selectedDeepClueIndex = ref(0)
const editingQuestionIndex = ref(-1)
const questionForm = reactive({
  question: '',
  type: '品牌认知',
  priority: '中',
  platform: '',
  keywords: '',
  reason: '',
  enabled: true
})

const agents = ['品牌识别', '问题生成', '搜索词扩展', '线索发现', '证据评估', '风险研判', '报告生成']

const overviewMetrics = computed(() => [
  { label: '舆情风险等级', value: '高', desc: '换壳争议仍处于高关注区间', type: 'danger' },
  { label: '总声量', value: '12,840', desc: '较上周上升 23%', type: 'primary' },
  { label: '负面率', value: '68%', desc: '短视频与论坛贡献最高', type: 'danger' },
  { label: 'AI认知风险', value: '中高', desc: '部分模型引用争议信源', type: 'warning' }
])

const trendData = [
  { day: '05-23', value: 42, x: 40, y: 142 },
  { day: '05-24', value: 48, x: 130, y: 128 },
  { day: '05-25', value: 61, x: 220, y: 98 },
  { day: '05-26', value: 58, x: 310, y: 104 },
  { day: '05-27', value: 67, x: 400, y: 82 },
  { day: '05-28', value: 72, x: 490, y: 70 },
  { day: '05-29', value: 68, x: 580, y: 78 }
]
const trendPoints = computed(() => trendData.map(item => `${item.x},${item.y}`).join(' '))

const platformDistribution = [
  { name: '短视频', value: 32 },
  { name: '论坛/社区', value: 26 },
  { name: '新闻媒体', value: 18 },
  { name: 'AI问答', value: 14 },
  { name: '搜索引擎', value: 10 }
]

const cluePipeline = [
  { index: '01', title: '采集内容进入系统', desc: '从AI问答、搜索、社媒、论坛和投诉平台汇入内容' },
  { index: '02', title: 'AI 分析内容', desc: '识别情绪、主题、风险词、证据强度和传播平台' },
  { index: '03', title: '聚类成线索', desc: '将相似内容合并为可处置的舆情线索' },
  { index: '04', title: '展示风险等级', desc: '输出风险分、证据数、趋势和深钻判断' }
]

const brandProfile = computed(() => {
  const competitors = questionSeed.competitors || '暂无竞品'
  return `${questionSeed.brand || '未填写品牌'} · ${questionSeed.industry || '未选择行业'} · 对比对象：${competitors}`
})

const questions = ref([
  { question: '奥迪E7X与智己LS7换壳争议是否属实？', type: '事件核查', priority: '高', platform: 'AI问答/新闻', keywords: '奥迪E7X 换壳 智己LS7', status: '启用', reason: '争议热度持续上升', enabled: true },
  { question: '这个争议是否影响用户购买判断？', type: '购买影响', priority: '高', platform: '小红书/懂车论坛', keywords: '奥迪E7X 值不值得买 换壳', status: '启用', reason: '购买决策相关', enabled: true },
  { question: '哪些平台正在放大负面叙事？', type: '风险归因', priority: '中', platform: '抖音/论坛', keywords: '奥迪E7X 争议 评论', status: '启用', reason: '定位处置优先级', enabled: true },
  { question: 'AI回答是否引用了过时或单边信源？', type: 'AI认知', priority: '中', platform: 'AI问答', keywords: '奥迪E7X AI评价', status: '停用', reason: '防止模型误读', enabled: false }
])

const clues = ref([
  { name: '换壳叙事持续扩散', summary: '论坛与短视频持续将车型设计争议归因为平台共享，引发身份认知风险。', risk: '高', score: 86, evidence: 18, sentiment: '负面', platforms: ['论坛', '短视频', 'AI问答'], trend: [18, 24, 32, 44, 61, 74, 68], needDeepDive: true, aiConclusion: '该线索由多平台相似叙事聚类形成，核心风险是“换壳”标签被持续复述并进入AI回答摘要。' },
  { name: '购买信心被争议影响', summary: '用户在价格、品牌价值和技术差异上出现犹豫，影响推荐转化。', risk: '高', score: 78, evidence: 12, sentiment: '负面', platforms: ['小红书', '知乎', '搜索'], trend: [12, 15, 21, 28, 35, 46, 52], needDeepDive: true, aiConclusion: '该线索集中在“值不值得买”和“品牌溢价是否成立”，已经直接影响购买判断。' },
  { name: '官方解释信源覆盖不足', summary: '正向解释内容未被 AI 模型充分引用，导致回答倾向争议叙事。', risk: '中', score: 64, evidence: 9, sentiment: '中性偏负', platforms: ['AI问答', '新闻'], trend: [8, 11, 13, 16, 17, 19, 20], needDeepDive: false, aiConclusion: '该线索说明官方解释内容存在覆盖缺口，短期风险低于负面扩散，但会影响AI长期认知。' }
])

const deepDiveQuestionMap = [
  [
    { question: '争议的核心证据来自哪些平台？', conclusion: '高传播内容集中在论坛长帖与短视频二创，新闻媒体多为转述。', result: '风险源头明确，但权威解释覆盖不足。', evidence: '论坛帖 6 条、短视频 8 条', level: '高' },
    { question: 'AI模型是否放大了单边叙事？', conclusion: '部分回答引用高热争议内容，但缺少官方技术解释和平台差异证据。', result: 'AI回答存在引用偏差，需要补充可信信源。', evidence: 'AI回答截图 12 张', level: '高' },
    { question: '当前最应补充哪类内容资产？', conclusion: '建议补充技术差异说明、官方FAQ、第三方测评和购车场景解释。', result: '优先建设可被搜索和AI引用的解释资产。', evidence: '竞品对比内容 5 条', level: '中' }
  ],
  [
    { question: '购买犹豫主要来自价格还是品牌信任？', conclusion: '用户更多质疑品牌溢价是否匹配产品差异。', result: '购买阻力来自价值感解释不足。', evidence: '小红书笔记 7 条、知乎回答 3 条', level: '高' },
    { question: '哪些决策场景最容易流失？', conclusion: '首次购车和竞品横评场景中，换壳标签更容易影响选择。', result: '需在横评内容中强化差异点。', evidence: '搜索问答 6 条', level: '高' }
  ],
  [
    { question: '官方解释为什么没有进入AI回答？', conclusion: '官方内容结构偏发布稿，缺少问答式解释和可索引关键词。', result: '内容资产不适配AI检索和引用。', evidence: '官网内容 4 条、AI回答 6 条', level: '中' },
    { question: '哪些权威信源最值得补充？', conclusion: '行业媒体评测、技术白皮书和第三方对比更容易提升可信度。', result: '优先补充可被引用的第三方材料。', evidence: '媒体文章 5 条', level: '中' }
  ]
]

const riskVerdicts = [
  { level: '高风险', summary: '该线索已形成跨平台负面叙事，并被部分AI回答吸收，短期需要优先处置。', actions: ['补充官方技术差异FAQ', '推动第三方测评内容进入搜索结果', '对高传播短视频和论坛帖做专项回应'] },
  { level: '高风险', summary: '该线索直接影响用户购买判断，需围绕价值感、差异点和竞品对比补充解释。', actions: ['输出购车决策FAQ', '制作竞品横评内容', '监控高转化问题的AI回答变化'] },
  { level: '中风险', summary: '该线索暂未快速扩散，但会影响AI长期认知和信源结构。', actions: ['优化官网内容索引结构', '补充权威媒体信源', '持续监控AI引用信源变化'] }
]

const currentDeepDiveQuestions = computed(() => deepDiveQuestionMap[selectedDeepClueIndex.value] || deepDiveQuestionMap[0])
const currentRiskVerdict = computed(() => riskVerdicts[selectedDeepClueIndex.value] || riskVerdicts[0])
const currentEvidenceChain = computed(() => evidenceList.slice(0, selectedDeepClueIndex.value === 2 ? 3 : 4))

const evidenceList = [
  { source: '汽车论坛', summary: '高互动帖子集中讨论平台共享与换壳争议，评论区负面情绪较强。', credibility: 78, strength: '强', canQuote: true, link: '查看' },
  { source: '短视频平台', summary: '二创视频用对比图强化相似认知，传播速度较快但论证不完整。', credibility: 62, strength: '中', canQuote: false, link: '查看' },
  { source: '新闻媒体', summary: '行业媒体引用官方口径说明平台差异，但覆盖量不足。', credibility: 86, strength: '强', canQuote: true, link: '查看' },
  { source: 'AI问答', summary: '模型回答中出现“争议较大”描述，部分未给出清晰证据来源。', credibility: 70, strength: '中', canQuote: true, link: '查看' }
]

const alerts = [
  { type: '负面声量预警', condition: '负面率连续 3 天超过 60%', level: '高', suggestion: '优先处理短视频和论坛高传播内容', status: '待处理' },
  { type: 'AI认知预警', condition: '3 个以上模型引用争议信源', level: '高', suggestion: '补充官方FAQ与权威测评信源', status: '处理中' },
  { type: '证据缺口预警', condition: '正向解释内容覆盖不足', level: '中', suggestion: '发布技术差异说明并强化搜索可见性', status: '待处理' }
]

const reports = [
  { name: '舆情日报', desc: '汇总当天风险变化、平台分布和处置建议。', period: '每日', status: '可生成' },
  { name: '舆情周报', desc: '复盘一周趋势、线索演化和竞品对照。', period: '每周', status: '可生成' },
  { name: '专项深钻报告', desc: '围绕单一争议输出证据链、风险判断和修复建议。', period: '按需', status: '可生成' }
]

const generateDemo = () => {
  ElMessage.success(`已基于「${topicForm.brand}」生成舆情深钻演示数据`)
  goSection('questions')
}

const generatedQuestionTemplates = computed(() => {
  const brand = questionSeed.brand || topicForm.brand || '本品牌'
  const competitors = questionSeed.competitors || '主要竞品'
  return [
    { question: `${brand}在AI回答中的整体口碑如何？`, type: '品牌认知', priority: '高', platform: 'AI问答', keywords: `${brand} 口碑 评价 AI`, reason: '建立品牌基础认知档案', enabled: true },
    { question: `${brand}最近有哪些负面新闻或用户投诉？`, type: '负面风险', priority: '高', platform: '新闻/投诉平台', keywords: `${brand} 负面 投诉 新闻`, reason: '识别高风险舆情入口', enabled: true },
    { question: `${brand}和${competitors}相比，用户更关注哪些差异？`, type: '竞品对比', priority: '高', platform: '小红书/知乎/论坛', keywords: `${brand} ${competitors} 对比`, reason: '定位竞品舆情优势与差距', enabled: true },
    { question: `${brand}是否存在影响购买决策的争议？`, type: '购买影响', priority: '中', platform: '搜索/AI问答', keywords: `${brand} 值不值得买 争议`, reason: '判断舆情对转化的影响', enabled: true },
    { question: `AI模型引用${brand}相关信息时，主要来自哪些信源？`, type: 'AI认知', priority: '中', platform: 'AI问答/搜索', keywords: `${brand} 信源 引用 AI回答`, reason: '排查低质或过时信源', enabled: true }
  ]
})

const generateQuestions = () => {
  questions.value = generatedQuestionTemplates.value.map(item => ({ ...item }))
  ElMessage.success(`已为「${questionSeed.brand}」生成品牌档案、监控问题和搜索关键词`)
}

const analyzeClues = () => {
  ElMessage.success('已完成内容分析与线索聚类，风险等级已更新')
}

const generateDeepDive = () => {
  ElMessage.success('已基于当前线索重新生成深钻问题、证据链和风险判断')
}

const getClueRiskType = (risk) => {
  if (risk === '高') return 'danger'
  if (risk === '中') return 'warning'
  return 'success'
}

const getClueTrendPoints = (trend = []) => {
  if (!trend.length) return ''
  const max = Math.max(...trend)
  const min = Math.min(...trend)
  return trend.map((value, index) => {
    const x = 12 + index * (236 / Math.max(trend.length - 1, 1))
    const y = 44 - ((value - min) / Math.max(max - min, 1)) * 32
    return `${x},${y}`
  }).join(' ')
}

const getDetailTrendPoints = (trend = []) => {
  if (!trend.length) return ''
  const max = Math.max(...trend)
  const min = Math.min(...trend)
  return trend.map((value, index) => {
    const x = 24 + index * (592 / Math.max(trend.length - 1, 1))
    const y = 100 - ((value - min) / Math.max(max - min, 1)) * 78
    return `${x},${y}`
  }).join(' ')
}

const openClueDetail = (clue) => {
  selectedClue.value = clue
  clueDetailVisible.value = true
}

const goSection = (section) => {
  const sectionPathMap = {
    overview: 'overview',
    questions: 'questions',
    clues: 'clues',
    deepDive: 'deep-dive',
    evidence: 'evidence',
    alerts: 'alerts',
    reports: 'reports'
  }
  router.push(`/opinion-project/${route.params.id || 'OP-AUDI-E7X'}/${sectionPathMap[section] || section}`)
}

const addQuestion = () => {
  const newQuestion = {
    question: `${topicForm.brand} 当前最影响用户判断的风险是什么？`,
    type: '风险归因',
    priority: '高',
    platform: 'AI问答/搜索',
    keywords: `${topicForm.brand} 风险 评价`,
    status: '启用',
    reason: '根据检测主题自动补充',
    enabled: true
  }
  editQuestion(newQuestion, -1)
}

const editQuestion = (row, index) => {
  editingQuestionIndex.value = index
  Object.assign(questionForm, row)
  questionDialogVisible.value = true
}

const saveQuestion = () => {
  const nextQuestion = { ...questionForm, status: questionForm.enabled ? '启用' : '停用' }
  if (editingQuestionIndex.value >= 0) {
    questions.value.splice(editingQuestionIndex.value, 1, nextQuestion)
  } else {
    questions.value.unshift(nextQuestion)
  }
  questionDialogVisible.value = false
  ElMessage.success('监控问题已保存')
}

const deleteQuestion = (index) => {
  questions.value.splice(index, 1)
  ElMessage.success('监控问题已删除')
}
</script>

<style scoped>
.opinion-page { display: flex; flex-direction: column; gap: 16px; }
.page-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.page-head h2 { margin: 0 0 8px; color: #111827; font-size: 22px; font-weight: 800; }
.page-head p { margin: 0; color: #64748b; font-size: 14px; }
.topic-card, .panel, .metric-card, .clue-card, .report-card { border: none; border-radius: 8px; }
.topic-card :deep(.el-card__body) { padding-bottom: 14px; }
.topic-card :deep(.el-form-item) { margin-bottom: 12px; }
.full-width { width: 100%; }
.agent-flow { display: flex; flex-wrap: wrap; gap: 8px; padding-top: 4px; }
.agent-flow span { border: 1px solid #dbeafe; border-radius: 999px; padding: 5px 10px; background: #eff6ff; color: #2563eb; font-size: 12px; font-weight: 700; }
.view-section { display: flex; flex-direction: column; gap: 16px; }
.metric-row { margin-bottom: 16px; }
.metric-label { color: #64748b; font-size: 13px; }
.metric-value { margin-top: 8px; color: #2563eb; font-size: 28px; font-weight: 800; line-height: 1; }
.metric-value.danger { color: #f56c6c; }
.metric-value.warning { color: #e6a23c; }
.metric-desc { margin-top: 10px; color: #94a3b8; font-size: 12px; }
.panel :deep(.el-card__header) { color: #111827; font-size: 15px; font-weight: 800; }
.panel-head { display: flex; align-items: center; justify-content: space-between; }
.question-generator :deep(.el-form-item) { margin-bottom: 12px; }
.profile-strip { display: grid; grid-template-columns: 1fr 1.5fr; gap: 12px; border: 1px solid #e5eaf2; border-radius: 8px; padding: 12px; background: #f8fafc; }
.profile-strip div { display: flex; flex-direction: column; gap: 5px; min-width: 0; }
.profile-strip span { color: #94a3b8; font-size: 12px; }
.profile-strip strong { color: #334155; font-size: 13px; line-height: 1.5; }
.trend-chart { height: 260px; }
.trend-chart svg { width: 100%; height: 100%; }
.trend-chart text { fill: #64748b; font-size: 12px; }
.platform-list { display: flex; flex-direction: column; gap: 14px; }
.platform-item { display: grid; grid-template-columns: 72px 1fr; align-items: center; gap: 12px; color: #334155; font-size: 13px; }
.pipeline-steps { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
.pipeline-step { border: 1px solid #e5eaf2; border-radius: 8px; padding: 12px; background: #f8fafc; }
.pipeline-step span { display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; border-radius: 50%; background: #2563eb; color: #fff; font-size: 12px; font-weight: 800; }
.pipeline-step strong { display: block; margin-top: 10px; color: #111827; font-size: 14px; }
.pipeline-step em { display: block; margin-top: 6px; color: #64748b; font-style: normal; font-size: 12px; line-height: 1.5; }
.clue-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
.clue-card { cursor: pointer; transition: transform 0.16s ease, box-shadow 0.16s ease; }
.clue-card:hover { transform: translateY(-2px); box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08); }
.clue-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.clue-head h3, .report-card h3, .selected-clue h3 { margin: 0 0 8px; color: #111827; font-size: 16px; font-weight: 800; }
.clue-head p, .report-card p, .selected-clue p { margin: 0; color: #64748b; font-size: 13px; line-height: 1.6; }
.clue-score-row { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; margin: 16px 0 12px; }
.clue-score-row div, .detail-metric { border: 1px solid #e5eaf2; border-radius: 8px; padding: 10px; background: #f8fafc; }
.clue-score-row span, .detail-metric span, .detail-block > span { display: block; color: #94a3b8; font-size: 12px; }
.clue-score-row strong, .detail-metric strong { display: block; margin-top: 6px; color: #111827; font-size: 16px; }
.mini-trend { height: 54px; margin-bottom: 12px; border-radius: 8px; background: #f8fafc; }
.mini-trend svg, .detail-trend svg { width: 100%; height: 100%; }
.clue-platforms { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 14px; }
.clue-actions { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.clue-detail-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.clue-detail-head h3 { margin: 0 0 8px; color: #111827; font-size: 18px; font-weight: 800; }
.clue-detail-head p { margin: 0; color: #64748b; line-height: 1.6; }
.detail-metrics { margin: 16px 0; }
.detail-block { margin-top: 16px; }
.detail-block p { margin: 8px 0 0; color: #475569; line-height: 1.7; }
.detail-trend { height: 120px; margin-top: 10px; border: 1px solid #e5eaf2; border-radius: 8px; background: #f8fafc; }
.deep-dive-layout { display: grid; grid-template-columns: 280px minmax(0, 1fr) 360px; gap: 16px; align-items: start; }
.deep-left, .deep-middle, .deep-right { min-height: 620px; }
.deep-clue-item { border: 1px solid #e5eaf2; border-radius: 8px; padding: 12px; background: #fff; cursor: pointer; }
.deep-clue-item + .deep-clue-item { margin-top: 10px; }
.deep-clue-item.active { border-color: #2563eb; background: #eff6ff; }
.deep-clue-title, .deep-question-head, .evidence-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
.deep-clue-title strong, .deep-question-head strong, .evidence-head strong { color: #111827; font-size: 14px; line-height: 1.5; }
.deep-clue-item p, .deep-question-card p, .evidence-card p { margin: 8px 0; color: #64748b; font-size: 13px; line-height: 1.6; }
.deep-clue-meta { display: flex; flex-wrap: wrap; gap: 8px; color: #64748b; font-size: 12px; }
.deep-question-list, .evidence-stack { display: flex; flex-direction: column; gap: 12px; }
.deep-question-card, .evidence-card, .risk-verdict, .next-actions { border: 1px solid #e5eaf2; border-radius: 8px; padding: 12px; background: #fff; }
.analysis-result { border-radius: 8px; padding: 10px; background: #f8fafc; }
.analysis-result span, .risk-verdict span, .next-actions span { display: block; color: #94a3b8; font-size: 12px; }
.analysis-result strong { display: block; margin-top: 6px; color: #111827; font-size: 13px; line-height: 1.5; }
.related-evidence, .evidence-meta { margin-top: 10px; color: #64748b; font-size: 12px; }
.risk-verdict { margin-bottom: 12px; border-color: #fecaca; background: #fff7f7; }
.risk-verdict strong { display: block; margin-top: 8px; color: #f56c6c; font-size: 24px; }
.risk-verdict p { margin: 8px 0 0; color: #475569; line-height: 1.6; }
.evidence-meta { display: flex; justify-content: space-between; gap: 10px; }
.next-actions { margin-top: 12px; background: #f8fafc; }
.next-actions ul { margin: 8px 0 0; padding-left: 18px; color: #475569; line-height: 1.8; }
.deep-item strong { color: #111827; font-size: 14px; }
.deep-item p { margin: 8px 0; color: #475569; line-height: 1.6; }
.deep-item span { color: #94a3b8; font-size: 12px; }
.report-card { min-height: 170px; }
.report-meta { margin: 18px 0 14px; color: #64748b; font-size: 13px; font-weight: 700; }

@media (max-width: 1100px) {
  .clue-grid { grid-template-columns: 1fr; }
  .pipeline-steps { grid-template-columns: 1fr; }
  .deep-dive-layout { grid-template-columns: 1fr; }
  .profile-strip { grid-template-columns: 1fr; }
  .page-head { flex-direction: column; }
}
</style>
