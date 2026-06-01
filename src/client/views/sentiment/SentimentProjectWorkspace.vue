<template>
  <div class="sentiment-workspace">
    <div class="project-info-header">
      <div class="info-group">
        <div class="info-item"><span>监控主体：</span><strong>{{ currentProject.name }}</strong></div>
        <div class="info-item"><span>舆情问题：</span><strong>36</strong></div>
        <div class="info-item"><span>数据更新：</span><strong>09:30:00</strong></div>
      </div>
      <div class="info-group">
        <div class="info-item"><span>监控周期：</span><strong>每日/2次</strong></div>
        <div class="info-item"><span>下次执行：</span><strong>18:30:00</strong></div>
        <div class="info-item"><span>创建时间：</span><strong>2026/05/16</strong></div>
      </div>
      <div class="info-group">
        <div class="info-item"><span>监控模型：</span><strong>6个</strong></div>
        <div class="info-item"><span>风险等级：</span><strong class="danger-text">{{ currentProject.riskLevel }}</strong></div>
        <div class="info-item"><span>今日任务进度：</span><strong>36/72</strong></div>
      </div>
      <div class="info-group actions">
        <el-tag type="danger" effect="dark" size="large">持续监测</el-tag>
        <el-button plain>导出数据</el-button>
        <el-button plain>立即执行</el-button>
      </div>
    </div>

    <div class="filter-card">
      <div class="filter-row">
        <el-select v-model="filterState.model" style="width: 160px;">
          <el-option label="所有模型" value="all" />
          <el-option label="DeepSeek" value="deepseek" />
          <el-option label="豆包" value="doubao" />
          <el-option label="通义千问" value="qwen" />
        </el-select>
        <el-radio-group v-model="filterState.range">
          <el-radio-button label="7d">最近7天</el-radio-button>
          <el-radio-button label="30d">最近30天</el-radio-button>
          <el-radio-button label="custom">自定义时间段</el-radio-button>
        </el-radio-group>
        <el-select v-model="filterState.risk" style="width: 150px;">
          <el-option label="全部风险" value="all" />
          <el-option label="高风险" value="high" />
          <el-option label="中风险" value="medium" />
          <el-option label="低风险" value="low" />
        </el-select>
        <div class="selected-info">最近7天：2026-05-23 ~ 2026-05-29</div>
      </div>
    </div>

    <template v-if="section === 'overview'">
      <el-row :gutter="16" class="mb-16">
        <el-col :span="6" v-for="item in overviewCards" :key="item.label">
          <el-card shadow="never" class="metric-card">
            <div class="metric-label">{{ item.label }}</div>
            <div class="metric-value" :class="item.type">{{ item.value }}</div>
            <div class="metric-desc">{{ item.desc }}</div>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="16" class="mb-16">
        <el-col :span="16">
          <el-card shadow="never" class="chart-card">
            <template #header><div class="card-head"><span>负面提及率趋势</span></div></template>
            <div class="trend-chart">
              <div class="trend-plot">
                <svg viewBox="0 0 720 220" preserveAspectRatio="none" aria-hidden="true">
                  <line v-for="y in [30, 70, 110, 150, 190]" :key="y" x1="30" :y1="y" x2="700" :y2="y" class="grid-line" />
                  <polyline :points="trendPolyline" class="trend-line" />
                  <g v-for="point in trendSvgPoints" :key="point.day">
                    <circle :cx="point.x" :cy="point.y" r="4" class="trend-dot" />
                    <text :x="point.x" :y="point.y - 10" text-anchor="middle" class="trend-label">{{ point.value }}%</text>
                  </g>
                </svg>
              </div>
              <div class="axis-row"><span v-for="point in trendItems" :key="point.day">{{ point.day }}</span></div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card shadow="never" class="chart-card">
            <template #header><div class="card-head"><span>风险问题 TOP10</span><button class="view-link">查看全部 →</button></div></template>
            <div class="rank-bars">
              <div v-for="item in riskQuestionTop" :key="item.name" class="rank-bar-item">
                <span>{{ item.name }}</span>
                <div><i :style="{ width: item.value + '%' }"></i><b>{{ item.value }}%</b></div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="16">
          <el-card shadow="never" class="content-card">
            <template #header><div class="card-head"><span>风险维度分布</span></div></template>
            <el-table :data="riskDimensionTable" size="small" :header-cell-style="headerCellStyle">
              <el-table-column prop="dimension" label="风险维度" min-width="140" />
              <el-table-column prop="questions" label="问题数" width="90" align="center" />
              <el-table-column prop="negativeRate" label="负面率" width="100" align="center" />
              <el-table-column prop="sourceCount" label="风险信源" width="100" align="center" />
              <el-table-column prop="topQuestion" label="最高风险问题" min-width="220" show-overflow-tooltip />
            </el-table>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card shadow="never" class="content-card">
            <template #header><div class="card-head"><span>本期智能结论</span></div></template>
            <ul class="insight-list">
              <li>换壳争议仍是当前最高风险主题，负面提及率达到 82%。</li>
              <li>论坛和短视频评论正在影响 AI 对事件的归因判断。</li>
              <li>建议优先处理高权重信源，并补充官方澄清和技术差异说明。</li>
            </ul>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="16" class="word-cloud-row">
        <el-col :span="12">
          <el-card shadow="never" class="content-card">
            <template #header><div class="card-head"><span>正面词云</span></div></template>
            <div class="word-cloud positive-cloud">
              <span
                v-for="word in positiveWords"
                :key="word.text"
                :class="`size-${word.size}`"
                :style="{ left: word.left + '%', top: word.top + '%' }"
              >{{ word.text }}</span>
            </div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card shadow="never" class="content-card">
            <template #header><div class="card-head"><span>负面词云</span></div></template>
            <div class="word-cloud negative-cloud">
              <span
                v-for="word in negativeWords"
                :key="word.text"
                :class="`size-${word.size}`"
                :style="{ left: word.left + '%', top: word.top + '%' }"
              >{{ word.text }}</span>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </template>

    <template v-else-if="section === 'risk-sources'">
      <el-row :gutter="16" class="mb-16">
        <el-col :span="8" v-for="item in sourceCards" :key="item.label">
          <el-card shadow="never" class="metric-card">
            <div class="metric-label">{{ item.label }}</div>
            <div class="metric-value" :class="item.type">{{ item.value }}</div>
            <div class="metric-desc">{{ item.desc }}</div>
          </el-card>
        </el-col>
      </el-row>
      <el-card shadow="never" class="content-card">
        <template #header>
          <div class="card-head">
            <span>风险信源</span>
            <el-radio-group v-model="sourceTab" size="small">
              <el-radio-button label="domain">域名聚合</el-radio-button>
              <el-radio-button label="link">链接明细</el-radio-button>
            </el-radio-group>
          </div>
        </template>
        <el-table :data="riskSources" stripe size="small" :header-cell-style="headerCellStyle">
          <el-table-column prop="source" :label="sourceTab === 'domain' ? '域名/媒体' : '链接标题'" min-width="240" show-overflow-tooltip>
            <template #default="{ row }">
              <div class="source-cell">
                <strong>{{ row.source }}</strong>
                <span>{{ row.url }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="platform" label="平台" width="110" />
          <el-table-column prop="risk" label="风险点" min-width="220" />
          <el-table-column prop="mentions" label="引用次数" width="100" align="center" sortable />
          <el-table-column prop="models" label="引用模型" width="130" align="center" />
          <el-table-column label="处置优先级" width="130" align="center">
            <template #default="{ row }">
              <el-tag :type="row.level === '高' ? 'danger' : 'warning'" effect="plain">{{ row.level }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="action" label="建议动作" min-width="140" />
        </el-table>
      </el-card>
    </template>

    <template v-else-if="section === 'questions'">
      <div class="page-toolbar">
        <div>
          <h2>舆情问题</h2>
          <p>按舆情问题维度汇总负面率、风险等级、信源引用和模型覆盖。</p>
        </div>
        <div class="toolbar-actions">
          <el-input v-model="keyword" clearable placeholder="搜索问题 / 标签 / 风险词" style="width: 260px;" />
          <el-button plain>导出</el-button>
          <el-button type="primary">编辑</el-button>
        </div>
      </div>
      <el-row :gutter="14" class="mb-16">
        <el-col :span="6" v-for="item in questionCards" :key="item.label">
          <div class="summary-card">
            <span>{{ item.label }}</span>
            <strong :class="item.type">{{ item.value }}</strong>
            <p>{{ item.desc }}</p>
          </div>
        </el-col>
      </el-row>
      <el-row :gutter="16" class="mb-16">
        <el-col :span="12">
          <el-card shadow="never" class="content-card">
            <template #header>负面率高的问题 TOP10</template>
            <div v-for="(item, index) in negativeTopQuestions" :key="item.question" class="top-list-item">
              <span class="rank-no">{{ index + 1 }}</span>
              <button type="button">{{ item.question }}</button>
              <strong>{{ item.rate }}%</strong>
            </div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card shadow="never" class="content-card">
            <template #header>风险信源最多的问题 TOP10</template>
            <div v-for="(item, index) in sourceTopQuestions" :key="item.question" class="top-list-item">
              <span class="rank-no">{{ index + 1 }}</span>
              <button type="button">{{ item.question }}</button>
              <strong>{{ item.count }}</strong>
            </div>
          </el-card>
        </el-col>
      </el-row>
      <el-card shadow="never" class="content-card">
        <template #header>舆情问题明细</template>
        <el-table :data="sentimentQuestions" stripe :header-cell-style="headerCellStyle">
          <el-table-column prop="question" label="问题" min-width="260" show-overflow-tooltip />
          <el-table-column prop="tag" label="标签" width="120"><template #default="{ row }"><el-tag size="small">{{ row.tag }}</el-tag></template></el-table-column>
          <el-table-column prop="askCount" label="提问次数" width="100" align="center" />
          <el-table-column prop="negativeRate" label="负面率" width="100" align="center" />
          <el-table-column prop="sourceCount" label="风险信源" width="100" align="center" />
          <el-table-column prop="models" label="覆盖模型" width="120" align="center" />
          <el-table-column prop="riskLevel" label="风险等级" width="110" align="center" />
          <el-table-column prop="status" label="状态" width="100" align="center" />
        </el-table>
      </el-card>
    </template>

    <template v-else-if="section === 'tasks'">
      <div class="page-toolbar">
        <div>
          <h2>监控任务</h2>
          <p>持续展示舆情采集计划、执行记录、异常模型和报告生成情况。</p>
        </div>
        <div class="toolbar-actions">
          <el-button plain>刷新</el-button>
          <el-button type="primary">立即执行</el-button>
        </div>
      </div>
      <el-card shadow="never" class="content-card mb-16">
        <template #header>计划执行</template>
        <div class="plan-list">
          <div v-for="plan in futurePlans" :key="plan.id" class="plan-item">
            <div>
              <strong>{{ plan.name }}</strong>
              <p>{{ plan.nextTime }} · {{ plan.questionCount }} 个问题 · {{ plan.models }}</p>
            </div>
            <el-tag type="primary" effect="plain">{{ plan.cycle }}</el-tag>
          </div>
        </div>
      </el-card>
      <el-card shadow="never" class="content-card">
        <template #header>任务记录</template>
        <el-table :data="monitorTasks" stripe :header-cell-style="headerCellStyle">
          <el-table-column prop="id" label="任务ID" width="120" />
          <el-table-column prop="questionCount" label="问题数" width="90" align="center" />
          <el-table-column prop="models" label="模型覆盖" width="120" align="center" />
          <el-table-column prop="negativeRate" label="负面率" width="100" align="center" />
          <el-table-column prop="riskSources" label="风险信源" width="100" align="center" />
          <el-table-column prop="status" label="状态" width="100" align="center" />
          <el-table-column prop="startTime" label="开始时间" width="160" />
          <el-table-column prop="result" label="结果" min-width="220" />
        </el-table>
      </el-card>
    </template>

    <template v-else-if="section === 'reports'">
      <el-card shadow="never" class="content-card">
        <template #header>
          <div class="card-head">
            <span>舆情报告</span>
            <el-tabs v-model="reportType" class="mini-tabs">
              <el-tab-pane label="日报" name="daily" />
              <el-tab-pane label="周报" name="weekly" />
              <el-tab-pane label="专项报告" name="special" />
            </el-tabs>
          </div>
        </template>
        <el-table :data="reports" stripe :header-cell-style="headerCellStyle">
          <el-table-column prop="name" label="报告名称" min-width="240" />
          <el-table-column prop="period" label="周期" width="180" />
          <el-table-column prop="risk" label="风险等级" width="120" align="center" />
          <el-table-column prop="negativeRate" label="负面率" width="100" align="center" />
          <el-table-column prop="summary" label="报告结论" min-width="220" />
          <el-table-column label="操作" width="160" align="center">
            <template #default>
              <el-button type="primary" size="small" plain @click="openReport">查看报告</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </template>

    <template v-else>
      <el-row :gutter="16">
        <el-col :span="12" v-for="item in configItems" :key="item.title">
          <el-card shadow="never" class="config-card">
            <template #header>{{ item.title }}</template>
            <p>{{ item.desc }}</p>
            <el-button size="small" type="primary" plain>配置</el-button>
          </el-card>
        </el-col>
      </el-row>
    </template>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const section = computed(() => route.params.section || 'overview')
const sourceTab = ref('domain')
const reportType = ref('daily')
const keyword = ref('')

const filterState = reactive({
  model: 'all',
  range: '7d',
  risk: 'all'
})

const currentProject = {
  name: '奥迪E7X与智己LS7「换壳」舆情审计项目',
  riskLevel: '极度高危'
}

const headerCellStyle = { background: '#f8fafc', color: '#64748b', fontWeight: 700 }

const overviewCards = [
  { label: '风险等级', value: '极度高危', desc: '高传播风险，需要优先处置', type: 'danger' },
  { label: '负面提及率', value: '68%', desc: '较上期上升 12%', type: 'danger' },
  { label: '风险信源', value: '18', desc: '6 个高权重来源', type: 'warning' },
  { label: '舆情问题', value: '36', desc: '覆盖 6 类风险场景', type: 'primary' }
]

const trendItems = [
  { day: '05-23', value: 48 },
  { day: '05-24', value: 52 },
  { day: '05-25', value: 61 },
  { day: '05-26', value: 58 },
  { day: '05-27', value: 67 },
  { day: '05-28', value: 72 },
  { day: '05-29', value: 68 }
]

const trendSvgPoints = computed(() => trendItems.map((item, index) => {
  const x = 40 + index * 108
  const y = 202 - item.value * 2.2
  return { ...item, x, y }
}))

const trendPolyline = computed(() => trendSvgPoints.value.map(item => `${item.x},${item.y}`).join(' '))

const riskQuestionTop = [
  { name: '换壳争议是否属实', value: 82 },
  { name: '最近有什么负面新闻', value: 76 },
  { name: '是否影响购买', value: 64 },
  { name: '有没有质量问题', value: 59 },
  { name: '用户投诉多不多', value: 52 }
]

const riskDimensionTable = [
  { dimension: '事件核查', questions: 8, negativeRate: '82%', sourceCount: 9, topQuestion: '奥迪E7X与智己LS7换壳争议是否属实？' },
  { dimension: '负面舆情', questions: 9, negativeRate: '76%', sourceCount: 7, topQuestion: '奥迪E7X最近有什么负面新闻？' },
  { dimension: '购买影响', questions: 6, negativeRate: '64%', sourceCount: 5, topQuestion: '这个争议会不会影响用户购买？' },
  { dimension: '处置建议', questions: 5, negativeRate: '41%', sourceCount: 3, topQuestion: '品牌应该如何回应换壳争议？' }
]

const positiveWords = [
  { text: '豪华感', size: 5, left: 42, top: 38 },
  { text: '品牌力', size: 4, left: 18, top: 28 },
  { text: '智能座舱', size: 4, left: 62, top: 24 },
  { text: '舒适', size: 3, left: 28, top: 58 },
  { text: '设计感', size: 3, left: 70, top: 55 },
  { text: '操控稳定', size: 2, left: 50, top: 68 },
  { text: '服务体系', size: 2, left: 12, top: 72 },
  { text: '科技配置', size: 3, left: 78, top: 74 }
]

const negativeWords = [
  { text: '换壳争议', size: 5, left: 38, top: 36 },
  { text: '虚假宣传', size: 4, left: 18, top: 28 },
  { text: '投诉维权', size: 4, left: 64, top: 26 },
  { text: '质量质疑', size: 3, left: 28, top: 58 },
  { text: '价格争议', size: 3, left: 70, top: 56 },
  { text: '信任下降', size: 2, left: 50, top: 70 },
  { text: '配置缩水', size: 2, left: 12, top: 72 },
  { text: '口碑波动', size: 3, left: 78, top: 74 }
]

const sourceCards = [
  { label: '风险信源总数', value: '18', desc: '本期被 AI 引用的风险来源', type: 'danger' },
  { label: '高权重信源', value: '6', desc: '新闻、论坛、百科类高影响来源', type: 'warning' },
  { label: '待处理信源', value: '9', desc: '建议优先核查或补充澄清', type: 'primary' }
]

const riskSources = [
  { source: '汽车论坛争议帖合集', url: 'auto-forum.example.com/audi-e7x', platform: '论坛', risk: '换壳争议被多模型引用', mentions: 9, models: '5个', level: '高', action: '优先核查' },
  { source: '短视频负面评论聚合', url: 'douyin.com/topic/e7x', platform: '抖音', risk: '质量质疑表达集中', mentions: 6, models: '4个', level: '高', action: '优先处理' },
  { source: '问答平台投诉回答', url: 'zhihu.com/question/mock', platform: '知乎', risk: '投诉案例被反复引用', mentions: 4, models: '3个', level: '中', action: '补充澄清' }
]

const questionCards = [
  { label: '问题总数', value: '36', desc: '持续采集 AI 舆情回答', type: 'primary' },
  { label: '高风险问题', value: '11', desc: '负面率超过 70%', type: 'danger' },
  { label: '平均负面率', value: '68%', desc: '较上期上升 12%', type: 'danger' },
  { label: '覆盖模型', value: '6', desc: 'DeepSeek、豆包、通义等', type: 'primary' }
]

const negativeTopQuestions = [
  { question: '奥迪E7X与智己LS7换壳争议是否属实？', rate: 82 },
  { question: '奥迪E7X最近有什么负面新闻？', rate: 76 },
  { question: '这个争议会不会影响用户购买？', rate: 64 }
]

const sourceTopQuestions = [
  { question: '奥迪E7X与智己LS7换壳争议是否属实？', count: 9 },
  { question: '奥迪E7X最近有什么负面新闻？', count: 7 },
  { question: '用户怎么看奥迪E7X？', count: 6 }
]

const sentimentQuestions = [
  { question: '奥迪E7X与智己LS7换壳争议是否属实？', tag: '事件核查', askCount: 126, negativeRate: '82%', sourceCount: 9, models: '6/6', riskLevel: '高', status: '运行中' },
  { question: '奥迪E7X最近有什么负面新闻？', tag: '负面舆情', askCount: 98, negativeRate: '76%', sourceCount: 7, models: '6/6', riskLevel: '高', status: '运行中' },
  { question: '这个争议会不会影响用户购买？', tag: '购买影响', askCount: 63, negativeRate: '64%', sourceCount: 5, models: '5/6', riskLevel: '中', status: '运行中' }
]

const futurePlans = [
  { id: 'P001', name: '每日舆情采集任务', nextTime: '2026-05-29 18:30', questionCount: 36, models: '6个模型', cycle: '每日/2次' },
  { id: 'P002', name: '高风险问题复测任务', nextTime: '2026-05-30 10:00', questionCount: 11, models: '6个模型', cycle: '手动复测' }
]

const monitorTasks = [
  { id: 'SEN-T2401', questionCount: 36, models: '6/6', negativeRate: '68%', riskSources: 18, status: '已完成', startTime: '2026-05-29 02:00', result: '新增 3 条高风险信源' },
  { id: 'SEN-T2400', questionCount: 36, models: '6/6', negativeRate: '64%', riskSources: 15, status: '已完成', startTime: '2026-05-28 18:30', result: '负面率上升 4%' },
  { id: 'SEN-T2399', questionCount: 36, models: '5/6', negativeRate: '61%', riskSources: 14, status: '异常', startTime: '2026-05-28 02:00', result: 'Kimi 采集失败 2 次' }
]

const reports = [
  { name: '奥迪E7X换壳舆情日报', period: '2026-05-29', risk: '极度高危', negativeRate: '68%', summary: '风险热度仍在高位，建议优先处理论坛与短视频信源。' },
  { name: '奥迪E7X换壳事件周度复盘', period: '2026-05-23 至 05-29', risk: '高危', negativeRate: '64%', summary: '争议集中在事件核查和购买影响两个方向。' }
]

const configItems = [
  { title: '监控主体', desc: '配置品牌、产品、人物、机构或事件专项，以及别名和关联实体。' },
  { title: '风险词库', desc: '维护负面词、争议词、投诉词、安全词和重点关注表达。' },
  { title: '问题方向', desc: '维护负面舆情、事件核查、用户口碑、风险归因、购买影响等问题。' },
  { title: '模型与报告', desc: '配置大模型覆盖、监控周期、执行时间和报告生成频率。' }
]

const openReport = () => {
  window.open('/ai_sentiment_insight_report.html?id=SEN-MOCK-AUDI&risk=%E6%9E%81%E5%BA%A6%E9%AB%98%E5%8D%B1&task=preview', '_blank')
}
</script>

<style scoped>
.sentiment-workspace { padding-bottom: 40px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", sans-serif; }
.project-info-header {
  display: grid;
  grid-template-columns: minmax(320px, 1.3fr) minmax(190px, .8fr) minmax(190px, .8fr) auto;
  align-items: center;
  gap: 28px;
  padding: 20px;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 20px;
  border-radius: 8px;
}
.info-group { display: grid; gap: 8px; }
.info-item { font-size: 13px; color: #4b5563; }
.info-item strong { color: #111827; margin-left: 4px; }
.danger-text { color: #f56c6c !important; }
.actions {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
}
.filter-card { padding: 16px; margin-bottom: 20px; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; }
.filter-row { display: flex; align-items: center; flex-wrap: wrap; gap: 12px; }
.selected-info { margin-left: auto; color: #245bff; background: #f0f5ff; border: 1px solid #dbeafe; padding: 8px 14px; border-radius: 8px; font-size: 13px; font-weight: 700; }
.mb-16 { margin-bottom: 16px; }
.metric-card, .chart-card, .content-card, .config-card { border: 1px solid #e5e7eb; border-radius: 8px; }
.metric-card { min-height: 112px; }
.metric-label { color: #909399; font-size: 13px; margin-bottom: 10px; }
.metric-value { color: #2b65f0; font-size: 26px; font-weight: 800; line-height: 1; }
.metric-value.danger, .summary-card .danger { color: #f56c6c; }
.metric-value.warning { color: #e6a23c; }
.metric-desc { margin-top: 10px; color: #64748b; font-size: 12px; }
.card-head { display: flex; justify-content: space-between; align-items: center; font-weight: 700; color: #111827; }
.view-link { border: 0; background: transparent; color: #409eff; cursor: pointer; }
.trend-chart { height: 280px; display: flex; flex-direction: column; }
.trend-plot { flex: 1; min-height: 0; padding: 8px 12px 0; }
.trend-plot svg { width: 100%; height: 100%; display: block; }
.grid-line { stroke: #e5e7eb; stroke-width: 1; }
.trend-line { fill: none; stroke: #f56c6c; stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
.trend-dot { fill: #f56c6c; stroke: #fff; stroke-width: 2; }
.trend-label { fill: #f56c6c; font-size: 12px; font-weight: 700; }
.axis-row { flex: 0 0 28px; display: flex; justify-content: space-between; padding: 2px 20px 0; color: #6b7280; font-size: 12px; }
.rank-bars { display: flex; flex-direction: column; gap: 12px; padding: 8px 0; }
.rank-bar-item { display: grid; grid-template-columns: 112px 1fr; gap: 10px; align-items: center; font-size: 13px; color: #374151; }
.rank-bar-item div { position: relative; height: 24px; background: #f1f5f9; border-radius: 4px; overflow: hidden; }
.rank-bar-item i { display: block; height: 100%; background: linear-gradient(90deg, #f59e0b, #ef4444); }
.rank-bar-item b { position: absolute; right: 8px; top: 4px; color: #fff; font-size: 12px; }
.insight-list { margin: 0; padding-left: 18px; color: #334155; line-height: 1.9; font-size: 14px; }
.source-cell { display: flex; flex-direction: column; gap: 4px; }
.source-cell span { color: #94a3b8; font-size: 12px; }
.page-toolbar { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 16px; }
.page-toolbar h2 { margin: 0 0 6px; font-size: 20px; color: #111827; }
.page-toolbar p { margin: 0; color: #64748b; font-size: 13px; }
.toolbar-actions { display: flex; align-items: center; gap: 10px; }
.summary-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; min-height: 98px; }
.summary-card span { color: #64748b; font-size: 13px; }
.summary-card strong { display: block; margin-top: 8px; color: #111827; font-size: 24px; }
.summary-card p { margin: 8px 0 0; color: #94a3b8; font-size: 12px; }
.top-list-item { display: grid; grid-template-columns: 28px 1fr 56px; align-items: center; gap: 10px; padding: 10px 0; border-bottom: 1px solid #f1f5f9; }
.top-list-item button { border: 0; background: transparent; color: #334155; text-align: left; cursor: pointer; }
.rank-no { display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 999px; background: #eef4ff; color: #2563eb; font-weight: 800; font-size: 12px; }
.plan-list { display: flex; flex-direction: column; gap: 12px; }
.plan-item { display: flex; justify-content: space-between; align-items: center; padding: 14px; border: 1px solid #e5e7eb; border-radius: 8px; background: #f8fafc; }
.plan-item p { margin: 6px 0 0; color: #64748b; font-size: 13px; }
.mini-tabs :deep(.el-tabs__header) { margin: 0; }
.config-card { margin-bottom: 16px; }
.config-card p { min-height: 44px; color: #64748b; line-height: 1.6; }
.word-cloud-row { margin-top: 16px; }
.word-cloud {
  position: relative;
  height: 260px;
  overflow: hidden;
  border-radius: 8px;
  background: #f8fafc;
}
.word-cloud span {
  position: absolute;
  transform: translate(-50%, -50%);
  white-space: nowrap;
  font-weight: 800;
  line-height: 1;
}
.positive-cloud span { color: #16a34a; }
.negative-cloud span { color: #ef4444; }
.word-cloud .size-5 { font-size: 36px; }
.word-cloud .size-4 { font-size: 28px; }
.word-cloud .size-3 { font-size: 22px; }
.word-cloud .size-2 { font-size: 17px; }

@media (max-width: 1200px) {
  .project-info-header { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .actions { justify-content: flex-start; }
}
</style>
