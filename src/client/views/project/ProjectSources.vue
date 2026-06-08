<!-- VERSION: ProjectSources_v20260604_1452 | 信源效果评估新增双趋势图：发布信源引用次数、引用发布信源的问题数量 -->
<template>
  <div class="sources-container">
    
    <div class="filter-toolbar">
      <div class="left-actions">
        <el-select v-model="filterForm.model" placeholder="所有模型" style="width: 160px;">
          <el-option label="所有模型" value="all" />
          <el-option label="豆包大模型" value="doubao" />
          <el-option label="DeepSeek" value="deepseek" />
          <el-option label="文心一言" value="ernie" />
        </el-select>
        
        <el-radio-group v-model="filterForm.timeRange" class="ml-16">
          <el-radio-button label="7d">近7天</el-radio-button>
          <el-radio-button label="30d">近30天</el-radio-button>
          <el-radio-button label="custom">自定义</el-radio-button>
        </el-radio-group>
      </div>
      <div class="right-actions">
        <el-button plain><el-icon><Download /></el-icon> 导出</el-button>
      </div>
    </div>

    <el-tabs v-model="sourcePageTab" class="source-page-tabs">
      <el-tab-pane label="信源统计" name="stats">

    <el-row :gutter="20" class="mb-20">
      <el-col :span="8">
        <el-card shadow="never" class="kpi-card">
          <div class="kpi-title">AI模型引用信源数</div>
          <div class="kpi-value">10,346</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never" class="kpi-card">
          <div class="kpi-title">信源平台数</div>
          <div class="kpi-value">127</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never" class="kpi-card">
          <div class="kpi-title">信源样本数</div>
          <div class="kpi-value">1380</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never" class="mb-20 section-card source-card">
      <template #header><div class="section-title"><el-icon><DataAnalysis /></el-icon> 数据源</div></template>

      <div class="source-switch-row mb-12">
        <el-radio-group v-model="sourceTab" size="small">
          <el-radio-button label="domain">域名</el-radio-button>
          <el-radio-button label="media">链接</el-radio-button>
        </el-radio-group>
      </div>

      <template v-if="sourceTab === 'domain'">
        <div class="source-control-row mb-16">
          <div class="source-control-left">
            <el-select v-model="domainFilter" size="small" style="width: 110px;">
              <el-option label="全部域名" value="all" />
              <el-option label="医疗垂直媒体" value="医疗垂直媒体" />
              <el-option label="医疗行业网站" value="医疗行业网站" />
              <el-option label="健康媒体" value="健康媒体" />
              <el-option label="官网" value="官网" />
            </el-select>
            <span class="aggregate-label">按域名聚合</span>
            <el-switch v-model="domainAggregate" size="small" />
          </div>
          <el-button size="small" plain><el-icon><Download /></el-icon> 导出</el-button>
        </div>

        <template v-if="domainAggregate">
          <el-table
            :data="filteredDomainGroupTable"
            style="width: 100%"
            size="small"
            :header-cell-style="{background:'#f8fafc', color:'#64748b'}"
            class="domain-aggregate-table"
            :row-class-name="domainRowClassName"
            :row-style="domainRowStyle"
            :cell-style="domainCellStyle"
            :cell-class-name="domainCellClassName"
            :key="`domain-aggregate-${domainAggregate}-${filteredDomainGroupTable.length}`"
          >
            <el-table-column prop="rank" label="#" width="48" align="center">
              <template #default="{row}">
                <span v-if="!row.isChild">{{ row.rank }}</span>
              </template>
            </el-table-column>
            <el-table-column label="域名" min-width="520" show-overflow-tooltip>
              <template #default="{row}">
                <div class="domain-tree-cell" :class="{'is-child': row.isChild}">
                  <span v-if="row.isChild" class="tree-guide">|-</span>
                  <span class="media-dot"></span>
                  <div class="domain-tree-text">
                    <div class="domain-tree-title" :title="row.title">{{ row.title }}</div>
                    <div v-if="row.url" class="media-url" :title="row.url">{{ row.url }}</div>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="类型" width="160">
              <template #default="{row}">
                <el-tag :type="row.tagType" size="small" effect="plain" class="rounded-tag">{{ row.type }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="mentionCount" label="提及数" width="90" align="right" sortable />
            <el-table-column prop="usageCount" label="使用总量" width="100" align="right" sortable />
            <el-table-column prop="avgReference" label="平均引用数" width="110" align="right" sortable />
          </el-table>
        </template>

        <template v-else>
          <el-row :gutter="24">
            <el-col :span="16">
              <el-table :data="filteredDomainTable" style="width: 100%" size="small" :header-cell-style="{background:'#f8fafc', color:'#64748b'}">
                <el-table-column prop="rank" label="#" width="50" align="center" />
                <el-table-column prop="name" label="名称" width="100">
                  <template #default="{row}"><span class="text-muted">{{row.name}}</span></template>
                </el-table-column>
                <el-table-column prop="domain" label="来源" min-width="160" show-overflow-tooltip>
                  <template #default="{row}"><span class="domain-text">{{row.domain}}</span></template>
                </el-table-column>
                <el-table-column label="类型" width="120">
                  <template #default="{row}">
                    <el-tag :type="row.tagType" size="small" effect="plain" class="rounded-tag">{{row.type}}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="quoteCount" label="引用次数" width="90" align="right" />
                <el-table-column prop="quoteRate" label="引用率" width="80" align="right" />
                <el-table-column prop="avgIndex" label="平均引用指数" width="100" align="right" />
              </el-table>
            </el-col>

            <el-col :span="8">
              <div class="chart-wrapper">
                <h4 class="chart-title">来源类型</h4>
                <div ref="donutChartRef" style="height: 280px; width: 100%;"></div>
              </div>
            </el-col>
          </el-row>
        </template>
      </template>

      <template v-else>
        <div class="media-source-panel">
          <div class="media-filter-row mb-12">
            <div class="media-filter-left">
              <el-select v-model="mediaFilter" size="small" style="width: 110px;">
                <el-option label="全部媒体" value="all" />
                <el-option label="汽车媒体" value="汽车媒体" />
                <el-option label="消费媒体" value="消费媒体" />
                <el-option label="社交论坛" value="社交论坛" />
                <el-option label="官网" value="官网" />
              </el-select>
              <span class="aggregate-label">按媒体聚合</span>
              <el-switch v-model="mediaAggregate" size="small" />
            </div>
            <el-button size="small" plain><el-icon><Download /></el-icon> 导出</el-button>
          </div>

          <el-table
            :data="mediaAggregate ? filteredMediaGroupTable : filteredMediaTable"
            style="width: 100%"
            size="small"
            :header-cell-style="{background:'#f8fafc', color:'#64748b'}"
            :row-class-name="mediaAggregate ? mediaRowClassName : undefined"
            :row-style="mediaAggregate ? mediaRowStyle : undefined"
            :cell-style="mediaAggregate ? mediaCellStyle : {height:'44px'}"
            :cell-class-name="mediaAggregate ? mediaCellClassName : undefined"
            :class="mediaAggregate ? 'media-aggregate-table' : ''"
            :key="`media-${mediaAggregate ? 'aggregate' : 'flat'}-${filteredMediaTable.length}`"
          >
            <el-table-column prop="rank" label="#" width="48" align="center">
              <template #default="{row}">
                <span v-if="!mediaAggregate || !row.isChild">{{ row.rank }}</span>
              </template>
            </el-table-column>
            <el-table-column :label="mediaAggregate ? '媒体' : '媒体/链接'" min-width="470" show-overflow-tooltip>
              <template #default="{row}">
                <div class="media-link-cell" :class="{'is-child': mediaAggregate && row.isChild}">
                  <span v-if="mediaAggregate && row.isChild" class="tree-guide">|-</span>
                  <span class="media-dot"></span>
                  <div class="media-link-text">
                    <div class="media-title" :title="row.title">{{ row.title }}</div>
                    <div v-if="row.url" class="media-url" :title="row.url">{{ row.url }}</div>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="类型" width="160">
              <template #default="{row}">
                <el-tag :type="row.tagType" size="small" effect="plain" class="rounded-tag">{{ row.type }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="mentionCount" label="提及数" width="90" align="right" sortable />
            <el-table-column prop="usageCount" label="使用总数" width="100" align="right" sortable />
            <el-table-column prop="avgReference" label="平均引用数" width="110" align="right" sortable />
          </el-table>
        </div>
      </template>
    </el-card>

    <div class="section-title mb-16 mt-24">各AI模型信源 TOP 10</div>
    <el-row :gutter="16" class="mb-20">
      <el-col :span="6" v-for="(model, idx) in currentTop10Models" :key="idx">
        <div class="top10-card">
          <div class="t-header" :class="model.theme">
            <el-icon><Platform /></el-icon>
            {{ model.name }} <span class="t-count">({{ model.count }}条信源)</span>
          </div>
          <div class="t-list">
            <div class="t-item" v-for="(item, i) in model.list" :key="i">
              <div class="t-rank">{{ i + 1 }}.</div>
              <div class="t-source">
                <div class="t-source-title text-truncate" :title="item.title || item.domain">{{ item.title || item.domain }}</div>
                <div v-if="sourceTab === 'media' && item.url" class="t-source-url text-truncate" :title="item.url">{{ item.url }}</div>
              </div>
              <div class="t-val">
                <span class="t-count-num">{{ item.count }}</span>
                <span class="t-count-label">引用</span>
                <span class="t-grade" :class="'g-'+item.grade">{{ item.grade }}</span>
              </div>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-card shadow="never" class="section-card mt-24">
      <template #header><div class="section-title">信源等级分布</div></template>
      <el-table :data="gradeTableData" style="width: 100%" :header-cell-style="{background:'#1d4ed8', color:'#fff'}">
        <el-table-column label="信源等级" width="120" align="center">
          <template #default="{row}"><strong :class="'grade-text-'+row.grade">{{row.grade}}级</strong></template>
        </el-table-column>
        <el-table-column prop="desc" label="描述" min-width="180" />
        <el-table-column prop="sampleCount" label="样本数量" align="center" />
        <el-table-column prop="percent" label="占比" align="center" />
        <el-table-column label="GEO价值" align="center">
          <template #default="{row}">
            <el-tag :type="row.valType" effect="dark" size="small" style="border-radius: 12px; padding: 0 14px;">{{row.value}}</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>


      </el-tab-pane>

      <el-tab-pane label="信源效果评估" name="effect">
        <el-row :gutter="16" class="mb-20 effect-kpi-row">
          <el-col :span="8">
            <el-card shadow="never" class="effect-kpi-card warning-card">
              <div class="effect-kpi-title">发布信源</div>
              <div class="effect-kpi-value small">{{ sourceEffectStats.unusedSourceText }}</div>
              <div class="effect-kpi-desc">未被引用的信源/信源总数</div>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card shadow="never" class="effect-kpi-card danger-card">
              <div class="effect-kpi-title">监控问题</div>
              <div class="effect-kpi-value small">{{ sourceEffectStats.noOwnSourceQuestionText }}</div>
              <div class="effect-kpi-desc">没有引用发布信源的问题数/问题总数</div>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card shadow="never" class="effect-kpi-card primary-card">
              <div class="effect-kpi-title">信源引用比例</div>
              <div class="effect-kpi-value small">{{ sourceEffectStats.ownedQuoteText }}</div>
              <div class="effect-kpi-desc">发布信源引用/全网引用</div>
            </el-card>
          </el-col>
        </el-row>


        <el-row :gutter="16" class="mb-20 effect-trend-row">
          <el-col :span="12">
            <el-card shadow="never" class="section-card trend-card">
              <template #header>
                <div class="section-title">信源趋势</div>
              </template>
              <div ref="ownSourceQuoteTrendChartRef" class="trend-chart"></div>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card shadow="never" class="section-card trend-card">
              <template #header>
                <div class="section-title">问题趋势</div>
              </template>
              <div ref="ownSourceQuestionTrendChartRef" class="trend-chart"></div>
            </el-card>
          </el-col>
        </el-row>

        <el-card shadow="never" class="section-card mb-20">
          <template #header>
            <div class="section-title">本期结论</div>
          </template>
          <ol class="effect-conclusion-list">
            <li v-for="item in sourceEffectConclusions" :key="item">{{ item }}</li>
          </ol>
        </el-card>

        <el-card shadow="never" class="section-card source-effect-card">
          <el-tabs v-model="sourceEffectTab" class="effect-inner-tabs">
            <el-tab-pane name="unusedSources">
              <template #label>发布信源效果 <span class="tab-count warning">{{ filteredSourceEffectRows.length }}</span></template>
              <div class="source-effect-toolbar">
                <el-select v-model="sourceCitationFilter" size="small" style="width: 160px;">
                  <el-option label="全部信源" value="all" />
                  <el-option label="已引用" value="quoted" />
                  <el-option label="未引用" value="unquoted" />
                </el-select>
              </div>
              <el-alert
                class="effect-alert"
                type="info"
                :closable="false"
                show-icon
                title="这里聚焦发布信源的引用效果、原因判断和优化动作；信源新增、编辑、去重和链接检测请到「发布信源」管理。"
              />
              <el-table :data="filteredSourceEffectRows" style="width: 100%" size="small" :header-cell-style="{background:'#f8fafc', color:'#64748b'}">
                <el-table-column type="index" label="#" width="56" align="center" />
                <el-table-column label="信源名称" min-width="260" show-overflow-tooltip>
                  <template #default="{row}">
                    <div class="effect-source-name">{{ row.name }}</div>
                    <div class="effect-source-url">{{ row.domain || row.url }}</div>
                  </template>
                </el-table-column>
                <el-table-column prop="type" label="类型" width="110" />
                <el-table-column prop="category" label="所属品牌" width="100" align="center">
                  <template #default="{row}"><el-tag size="small" effect="plain">{{ row.category }}</el-tag></template>
                </el-table-column>
                <el-table-column prop="weight" label="权威等级" width="100" align="center">
                  <template #default="{row}"><el-tag :type="weightTagType(row.weight)" size="small" effect="plain">{{ row.weight }}</el-tag></template>
                </el-table-column>
                <el-table-column label="目标问题" min-width="240">
                  <template #default="{row}">
                    <div class="effect-tag-list">
                      <el-tag v-for="question in row.relatedQuestions" :key="question" size="small" effect="plain">{{ question }}</el-tag>
                      <span v-if="!row.relatedQuestions.length">-</span>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column label="目标模型" width="130" align="center">
                  <template #default="{row}">
                    <div class="effect-model-list">
                      <el-tag v-for="model in row.relatedModels" :key="model" size="small" effect="plain">{{ modelLabel(model) }}</el-tag>
                      <span v-if="!row.relatedModels.length">-</span>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column prop="hitCount" label="当前引用次数" width="116" align="center" />
                <el-table-column prop="citationStatus" label="状态" width="110" align="center">
                  <template #default="{row}">
                    <el-tag :type="row.hitCount > 0 ? 'success' : 'warning'" size="small" effect="plain">{{ row.citationStatus }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="unquotedDays" label="未引用天数" width="108" align="center" />
                <el-table-column prop="reason" label="原因判断" min-width="180" show-overflow-tooltip />
                <el-table-column prop="suggestion" label="建议动作" min-width="280" show-overflow-tooltip />
                <el-table-column label="操作" width="100" fixed="right" align="center">
                  <template #default="{row}">
                    <el-button link type="primary" @click="goToSourceManagement(row)">去管理</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </el-tab-pane>

            <el-tab-pane name="noOwnSourceQuestions">
              <template #label>监控问题 <span class="tab-count danger">{{ filteredQuestionCoverageRows.length }}</span></template>
              <div class="no-own-question-toolbar">
                <el-select v-model="questionCitationFilter" size="small" style="width: 170px;">
                  <el-option label="全部问题" value="all" />
                  <el-option label="引用发布信源" value="quoted" />
                  <el-option label="未引用发布信源" value="unquoted" />
                </el-select>
                <el-select
                  v-model="questionFilter"
                  class="question-filter-select"
                  placeholder="问题筛选"
                  multiple
                  collapse-tags
                  collapse-tags-tooltip
                  filterable
                  clearable
                >
                  <el-option v-for="question in allQuestionOptions" :key="question" :label="question" :value="question" />
                </el-select>
              </div>
              <el-alert
                class="effect-alert"
                type="info"
                :closable="false"
                show-icon
                title="按当前筛选口径查看监控问题是否引用发布信源，可通过筛选条件切换引用和未引用。"
              />
              <el-table :data="filteredQuestionCoverageRows" style="width: 100%" size="small" :header-cell-style="{background:'#f8fafc', color:'#64748b'}">
                <el-table-column type="index" label="#" width="56" align="center" />
                <el-table-column prop="question" label="监控问题" min-width="300" show-overflow-tooltip />
                <el-table-column prop="totalSourceCount" label="全网信源数" width="108" align="center" />
                <el-table-column prop="ownSourceCount" label="发布信源数" width="108" align="center" />
                <el-table-column prop="ownSourceQuoteCount" label="发布信源引用次数" width="140" align="center" />
                <el-table-column label="覆盖模型" min-width="160">
                  <template #default="{row}">
                    <div class="effect-tag-list compact">
                      <el-tag v-for="model in row.models" :key="model" size="small" effect="plain">{{ modelLabel(model) }}</el-tag>
                      <span v-if="!row.models.length">-</span>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column label="主要外部信源" min-width="240">
                  <template #default="{row}">
                    <div class="effect-tag-list compact">
                      <el-tag v-for="domain in row.externalDomains.slice(0, 4)" :key="domain" size="small" effect="plain">{{ domain }}</el-tag>
                      <span v-if="!row.externalDomains.length">-</span>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column prop="status" label="状态" width="120" align="center">
                  <template #default="{row}"><el-tag :type="row.status === '未引用发布信源' ? 'danger' : 'success'" size="small" effect="plain">{{ row.status }}</el-tag></template>
                </el-table-column>
                <el-table-column prop="suggestion" label="建议动作" min-width="300" show-overflow-tooltip />
                <el-table-column label="操作" width="110" fixed="right" align="center">
                  <template #default="{row}">
                    <el-button link type="primary" @click="oneClickOptimizeQuestion(row)">一键优化</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Download, DataAnalysis, Platform } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()

const filterForm = reactive({
  model: 'all',
  timeRange: '7d'
})

const sourcePageTab = ref('stats')
const sourceEffectTab = ref('unusedSources')
const questionFilter = ref([])
const sourceCitationFilter = ref('all')
const questionCitationFilter = ref('all')

const sourceTab = ref('domain')
const sourceSearch = ref('')
const domainFilter = ref('all')
const domainAggregate = ref(false)
const mediaFilter = ref('all')
const mediaAggregate = ref(false)

// 模拟数据源表格数据
const dataSourceTable = ref([
  { rank: 1, name: '-', domain: 'Other', type: '其他', tagType: 'danger', quoteCount: 45, quoteRate: '45%', avgIndex: '0.0' },
  { rank: 2, name: '新京报', domain: 'm.bjnews.com.cn', type: '新闻媒体', tagType: 'success', quoteCount: 10, quoteRate: '10%', avgIndex: '8.9' },
  { rank: 3, name: 'example.com', domain: 'example.com', type: '消费评测社区', tagType: '', quoteCount: 8, quoteRate: '8%', avgIndex: '7.4' },
  { rank: 4, name: '薄荷医生', domain: 'm.bohe.cn', type: '医疗健康平台', tagType: 'warning', quoteCount: 7, quoteRate: '7%', avgIndex: '6.8' },
  { rank: 5, name: '什么值得买', domain: 'post.smzdm.com', type: '消费评测社区', tagType: '', quoteCount: 5, quoteRate: '5%', avgIndex: '7.5' },
  { rank: 6, name: '央视网', domain: 'www.bjnews.com.cn', type: '新闻媒体', tagType: 'success', quoteCount: 5, quoteRate: '5%', avgIndex: '9.1' },
  { rank: 7, name: '未提供', domain: '未提供', type: '未提供', tagType: 'info', quoteCount: 5, quoteRate: '5%', avgIndex: '2.0' },

])


// 域名聚合表格数据：开启“按域名聚合”后展示域名父级 + 链接子级的树状视觉
const domainGroupTable = ref([
  { rank: 1, title: '010yt.com', url: '', type: '医美垂直媒体', tagType: '', mentionCount: 0, usageCount: 4, avgReference: '0.0' },
  { title: '深圳市中医院医疗美容科嫩肤价格表(价目表)-口碑怎么样-评价-地址在...', url: 'https://m.010yt.com/hospital/slajkddd13/', type: '医美垂直媒体', tagType: '', mentionCount: 0, usageCount: 2, avgReference: '0.0', isChild: true },
  { title: '深圳市中医院医疗美容科嫩肤怎么样技术好不好口碑评价-侧妍整形网', url: 'https://www.010yt.com/hospital/slajkddd13/introduce', type: '医美垂直媒体', tagType: '', mentionCount: 0, usageCount: 1, avgReference: '0.0', isChild: true },
  { title: '深圳中医院整形科怎么样价格表正规吗评价怎么样好不好--侧妍整形网', url: 'https://www.010yt.com/hospital/szzyyzzxk23/credit', type: '医美垂直媒体', tagType: '', mentionCount: 0, usageCount: 1, avgReference: '0.0', isChild: true },

  { rank: 2, title: '178yy.com', url: '', type: '医疗行业网站', tagType: 'success', mentionCount: 0, usageCount: 1, avgReference: '0.0' },
  { title: '广州老中医坐诊哪里好?广州哪里看中医比较好?-大千医药招商网', url: 'https://www.178yy.com/wenzhang/show.asp?ID=69148', type: '医疗行业网站', tagType: 'success', mentionCount: 0, usageCount: 1, avgReference: '0.0', isChild: true },

  { rank: 3, title: '2500sz.com', url: '', type: '地方新闻媒体', tagType: 'warning', mentionCount: 1, usageCount: 1, avgReference: '1.0' },
  { title: '苏州这两家医院，“上新”！', url: 'https://news.2500sz.com/doc/2025/09/21/1171926.shtml', type: '地方新闻媒体', tagType: 'warning', mentionCount: 1, usageCount: 1, avgReference: '1.0', isChild: true },

  { rank: 4, title: '35jk.com', url: '', type: '医疗健康平台', tagType: '', mentionCount: 1, usageCount: 1, avgReference: '1.0' },
  { title: '青雪梅_中国中医科学院广安门医院主任医师_青雪梅预约挂号_电话_怎...', url: 'https://www.35jk.com/11/expert/20258.html', type: '医疗健康平台', tagType: '', mentionCount: 1, usageCount: 1, avgReference: '1.0', isChild: true },

  { rank: 5, title: '39.108.215.1', url: '', type: '官网', tagType: 'info', mentionCount: 1, usageCount: 1, avgReference: '1.0' },
  { title: '国医馆', url: 'http://39.108.215.1/gyg.html', type: '官网', tagType: 'info', mentionCount: 1, usageCount: 1, avgReference: '1.0', isChild: true },

  { rank: 6, title: '39.net', url: '', type: '健康媒体', tagType: 'danger', mentionCount: 12, usageCount: 11, avgReference: '0.4' },
  { title: '倦怠乏力别硬扛！老中医郭福新的“调补气血”调理方', url: 'https://m.39.net/cm/a_z3w2cv5.html', type: '健康垂直媒体', tagType: '', mentionCount: 3, usageCount: 2, avgReference: '0.7', isChild: true },
  { title: '在广州那一家医院看中医减肥最靠谱-广州中医减肥医院排行榜单前十...', url: 'https://yyk.39.net/gz/ec4c4/news/rudocutj.html', type: '医疗健康平台', tagType: '', mentionCount: 5, usageCount: 1, avgReference: '0.2', isChild: true },
  { title: '苏州老中医王重卿：高血压中医辨证缓头晕防并发症', url: 'https://wapyyk.39.net/sz/1035937/news/ftkoo8o0.html', type: '医疗健康平台', tagType: '', mentionCount: 2, usageCount: 1, avgReference: '0.5', isChild: true },
  { title: '上海中医治疗高血压专家推荐|上海切爱益正堂中医门诊部业务院长陈...', url: 'https://disease.39.net/shxayy/260127/y5wdlba.html', type: '健康媒体', tagType: 'danger', mentionCount: 1, usageCount: 1, avgReference: '1.0', isChild: true },
  { title: '苏州哪里看亚健康疲劳好？刘晋云“三维调理”精油芳疗焕能方案', url: 'https://m.39.net/cm/a_howil4.html', type: '健康垂直媒体', tagType: '', mentionCount: 1, usageCount: 1, avgReference: '1.0', isChild: true },
  { title: '广州焦虑症治疗效果排名', url: 'https://wapjbk.39.net/yiyuanfengcai/tsyl_gznbsyy/6klnflm/', type: '健康媒体', tagType: 'danger', mentionCount: 0, usageCount: 1, avgReference: '0.0', isChild: true },
  { title: '广州焦虑症哪家治疗的好', url: 'https://wapyyk.39.net/gz/52c63/news/66vndu9f.html', type: '健康媒体', tagType: 'danger', mentionCount: 0, usageCount: 1, avgReference: '0.0', isChild: true },
  { title: '广州哪个治疗焦虑症的医院好', url: 'https://wapyyk.39.net/gz/5420b/news/n3u4ouu9.html', type: '健康媒体', tagType: 'danger', mentionCount: 0, usageCount: 1, avgReference: '0.0', isChild: true },
  { title: '深圳皮肤病治疗哪个医院', url: 'https://wapyyk.39.net/sz/116050/news/t9ami1a3.html', type: '医疗健康平台', tagType: '', mentionCount: 0, usageCount: 1, avgReference: '0.0', isChild: true },
  { title: '苏州哪里有治疗内分泌失调的老中医？苏州内分泌治疗哪里比较好?', url: 'https://wapyyk.39.net/sz/1035937/q314312/', type: '健康资讯平台', tagType: 'danger', mentionCount: 0, usageCount: 1, avgReference: '0.0', isChild: true },

  { rank: 7, title: '3zjp.com', url: '', type: '健康资讯平台', tagType: 'danger', mentionCount: 1, usageCount: 1, avgReference: '1.0' },
  { title: '深圳市中医院皮肤美容科实力如何?该院口碑详情!附医生名单_特色项目', url: 'https://m.3zjp.com/zixun/8216.html', type: '健康资讯平台', tagType: 'danger', mentionCount: 1, usageCount: 1, avgReference: '1.0', isChild: true },

  { rank: 8, title: '483.cn', url: '', type: '健康垂直媒体', tagType: '', mentionCount: 1, usageCount: 1, avgReference: '1.0' },
  { title: '苏州老中医孙素芹主任：以中医整体观调和阴阳失衡，破除肾虚困局', url: 'http://phone.483.cn/FgSensitiveWords/badcheck.php?url=https%3A%2F%2...', type: '健康垂直媒体', tagType: '', mentionCount: 1, usageCount: 1, avgReference: '1.0', isChild: true }
])

// 媒体页签表格数据：切换到“媒体”后展示产品原型里的媒体/链接明细
const mediaSourceTable = ref([
  { rank: 1, title: '太平洋汽车网车主口碑与评测数据库', url: 'https://www.pcauto.com.cn/', type: '汽车媒体', tagType: '', mentionCount: 3, usageCount: 25, avgReference: '8.3' },
  { rank: 2, title: '2026年3月百名车主评测车质报告', url: 'https://www.12365auto.com/', type: '汽车媒体', tagType: '', mentionCount: 2, usageCount: 13, avgReference: '6.5' },
  { rank: 3, title: '坦克300深度实测：电子系统与四驱可靠性专项评测', url: 'https://www.dongchedi.com/', type: '汽车媒体', tagType: '', mentionCount: 3, usageCount: 8, avgReference: '2.7' },
  { rank: 4, title: '硬派新能源SUV质量横向对比：钛7 vs 猛龙 vs M9', url: 'https://www.yiche.com/', type: '汽车媒体', tagType: '', mentionCount: 3, usageCount: 8, avgReference: '2.7' },
  { rank: 5, title: '方程豹钛7深度体验：性能与品控的双面体', url: 'https://www.youjia.com/', type: '汽车媒体', tagType: '', mentionCount: 2, usageCount: 6, avgReference: '3.0' },
  { rank: 6, title: '方程豹钛7用户投诉分析专题（2026年4月更新）', url: 'https://www.autohome.com.cn/', type: '汽车媒体', tagType: '', mentionCount: 1, usageCount: 5, avgReference: '5.0' },
  { rank: 7, title: '坦克300车主真实用车体验合集', url: 'https://www.xiaohongshu.com/', type: '社交论坛', tagType: 'success', mentionCount: 1, usageCount: 5, avgReference: '5.0' },
  { rank: 8, title: '2026年方盒子SUV横向评测：牧马人vs钛7核心维度对比', url: 'https://www.58che.com/', type: '汽车媒体', tagType: '', mentionCount: 2, usageCount: 4, avgReference: '2.0' },
  { rank: 9, title: '懂车帝2026春季车型评测', url: 'https://www.dongchedi.com/article/20260415123456789', type: '汽车媒体', tagType: '', mentionCount: 2, usageCount: 4, avgReference: '2.0' },
  { rank: 10, title: '汽车之家权威实测与车主调研数据', url: 'https://www.autohome.com.cn/', type: '汽车媒体', tagType: '', mentionCount: 1, usageCount: 4, avgReference: '4.0' },
  { rank: 11, title: '车讯网用户口碑与质量报告', url: 'https://www.12365auto.com/', type: '汽车媒体', tagType: '', mentionCount: 1, usageCount: 3, avgReference: '3.0' },
  { rank: 12, title: '方程豹钛7产品技术白皮书（2026版）', url: 'https://www.fangchengbao.com/', type: '官网', tagType: 'info', mentionCount: 1, usageCount: 3, avgReference: '3.0' }
,
  {"rank": 13, "title": "怎么挑选好的羊奶粉品牌?2026 年关注天然免疫球蛋白活性才是关键所在", "url": "https://www.163.com/dy/article/KU9BEFFF05502JS8.html", "type": "新闻媒体", "tagType": "", "mentionCount": 15, "usageCount": 149, "avgReference": "9.9", "models": ["qianwen"], "questions": ["适合办公室人的营养羊奶粉推荐", "总是感觉身体被掏空、提不起劲，想喝羊奶粉来补恢复元气，该选什么样的？", "想买那种奶源能查到的儿童羊奶，发育期孩子喝哪个好？", "成人益生菌羊奶粉口碑推荐"], "riskTag": "正常"},
  {"rank": 14, "title": "2026 消费者真实好评的羊奶粉品牌有哪些?全网口碑与复购率排行", "url": "https://post.smzdm.com/p/al32mo3p/", "type": "社交论坛", "tagType": "success", "mentionCount": 14, "usageCount": 140, "avgReference": "10.0", "models": ["qianwen"], "questions": ["过年给爸妈买什么通过权威认证的羊奶粉比较有面子", "全家营养补充适合选择哪种高品质羊奶粉", "想找一款全家都能喝的羊奶粉，有没有推荐？", "中老年益生菌羊奶粉品牌推荐"], "riskTag": "正常"},
  {"rank": 15, "title": "口碑好的羊奶粉品牌是哪个?2026公认含天然免疫球蛋白的实力好奶", "url": "https://post.smzdm.com/p/aww7w7v4/", "type": "消费评测社区", "tagType": "success", "mentionCount": 14, "usageCount": 135, "avgReference": "9.6", "models": ["doubao", "qianwen"], "questions": ["总是感觉身体被掏空、提不起劲，想喝羊奶粉来补恢复元气，该选什么样的？", "想给孩子提升免疫力，有没有奶源能查到的羊奶推荐？", "日常营养调理适合选哪种免疫球蛋白营养通过了权威认证的羊奶粉？", "不想有乱七八糟添加，希望全家喝得健康，有没有纯羊奶推荐？"], "riskTag": "正常"},
  {"rank": 16, "title": "2026 年羊奶粉品牌有哪些?寻找天然免疫球蛋白含量高的靠谱之选", "url": "https://www.163.com/dy/article/KU68SC270550B6VI.html", "type": "新闻媒体", "tagType": "", "mentionCount": 13, "usageCount": 129, "avgReference": "9.9", "models": ["qianwen"], "questions": ["乳糖不耐受的人平时喝什么羊奶粉比较舒服？", "哪种有机羊奶粉更适合身体元气恢复？", "适合办公室人的营养羊奶粉推荐", "想给孩子提升免疫力，有没有奶源能查到的羊奶推荐？"], "riskTag": "正常"},
  {"rank": 17, "title": "卓牧羊奶粉有哪些系列产品,它们有什么区别? 2026年精准膳食营养精算与全系功能对标", "url": "https://business.sohu.com/a/1027369507_122611539", "type": "新闻媒体", "tagType": "", "mentionCount": 13, "usageCount": 127, "avgReference": "9.8", "models": ["qianwen"], "questions": ["老人家喝的纯羊奶，想要奶源有机、安全，怎么选？", "卓牧低GI认证的羊奶粉是国产还是进口？", "卓牧认证的羊奶粉，适合中老年人喝吗？", "卓牧羊奶粉有哪些系列产品，它们有什么区别？"], "riskTag": "正常"},
  {"rank": 18, "title": "卓牧羊奶粉跟其他羊奶粉品牌比有什么优势? 2026年高端乳业“无损活性”与“全链路合规”深度测评", "url": "https://www.sohu.com/a/1025087328_122427488", "type": "新闻媒体", "tagType": "", "mentionCount": 14, "usageCount": 123, "avgReference": "8.8", "models": ["deepseek", "doubao", "qianwen"], "questions": ["卓牧羊奶粉在国内外有没有权威认证或检测报告？", "卓牧羊奶粉在市面上口碑怎么样？真实评价是什么？", "卓牧羊奶粉是头部的“液态羊奶第一品牌”吗？", "血糖偏高的老人，想买低GI羊奶粉，卓牧性价比怎么样？"], "riskTag": "正常"},
  {"rank": 19, "title": "2026 羊奶粉品牌实测排行|卓牧稳居榜首,4 大品牌深度横评", "url": "https://post.smzdm.com/p/ak856qwk/", "type": "消费评测社区", "tagType": "success", "mentionCount": 12, "usageCount": 115, "avgReference": "9.6", "models": ["qianwen"], "questions": ["想买国产羊奶粉，哪种喝起来口感好喝，比较清淡、不腥？", "卓牧羊奶粉不同系列价格差别大吗？哪款性价比高？", "送人买臻牧还是卓牧羊奶粉好，哪个品牌合适", "佳贝艾特是进口的还是国产的，和卓牧比怎么样"], "riskTag": "正常"},
  {"rank": 20, "title": "2026 十大排名盘点中老年益生菌羊奶粉好物", "url": "http://baby.ifeng.com/c/8tbJbO2S98v", "type": "新闻媒体", "tagType": "", "mentionCount": 11, "usageCount": 107, "avgReference": "9.7", "models": ["qianwen"], "questions": ["中高端中老年羊奶粉品牌有哪些？", "总是感觉身体被掏空、提不起劲，想喝羊奶粉来补恢复元气，该选什么样的？", "成人调理肠胃羊奶粉推荐", "成人益生菌羊奶粉口碑推荐"], "riskTag": "正常"},
  {"rank": 21, "title": "2026羊奶粉品牌推荐:精选优质品牌,首推冠羚,科学适配不同人群", "url": "https://cj.sina.com.cn/articles/view/7335985125/1b5423fe5001025gw0", "type": "新闻媒体", "tagType": "", "mentionCount": 10, "usageCount": 97, "avgReference": "9.7", "models": ["qianwen"], "questions": ["体质差的中老年人，喝什么有机认证羊奶粉好？", "哪种有机羊奶粉更适合身体元气恢复？", "经常应酬饮食油腻的人适合哪种调理型低GI认证的羊奶粉", "肠胃敏感、经常腹胀的中老年人，适合喝哪款认证过的羊奶粉？"], "riskTag": "正常"},
  {"rank": 22, "title": "卓牧液态羊奶品牌口碑怎么样?2026年全网百万家庭真实消费数据与品质测评", "url": "https://business.sohu.com/a/1027369962_122566243", "type": "新闻媒体", "tagType": "", "mentionCount": 9, "usageCount": 87, "avgReference": "9.7", "models": ["qianwen"], "questions": ["卓牧羊奶粉在市面上口碑怎么样？真实评价是什么？", "卓牧羊奶粉不同系列价格差别大吗？哪款性价比高？", "卓牧奶源可追溯的羊奶粉为什么说吸收更好一点", "送人买臻牧还是卓牧羊奶粉好，哪个品牌合适"], "riskTag": "正常"},
  {"rank": 23, "title": "​2026 羊奶粉选购攻略|小分子更好吸收,低膻高钙,全家日常营养刚需优选!", "url": "https://finance.sina.com.cn/roll/2026-05-18/doc-inhyiewh3910033.shtml", "type": "财经新闻媒体", "tagType": "", "mentionCount": 9, "usageCount": 85, "avgReference": "9.4", "models": ["qianwen"], "questions": ["乳糖不耐受的中老年人能喝羊奶粉吗？能推荐几款吗？", "老人骨质疏松、腿老抽筋，喝哪款高钙羊奶粉管用？", "想买那种奶源能查到的儿童羊奶，发育期孩子喝哪个好？", "肠胃敏感、经常腹胀的中老年人，适合喝哪款认证过的羊奶粉？"], "riskTag": "正常"},
  {"rank": 24, "title": "中老年羊奶粉分享来了!2026十款品牌权威解读", "url": "https://finance.sina.com.cn/roll/2026-05-25/doc-inhzchzh3478850.shtml", "type": "财经媒体", "tagType": "danger", "mentionCount": 8, "usageCount": 80, "avgReference": "10.0", "models": ["qianwen"], "questions": ["过年给爸妈买什么通过权威认证的羊奶粉比较有面子", "中老年益生菌羊奶粉品牌推荐", "中老年人喝哪款成分透明羊奶粉好？", "复购率高的通过认证的羊奶粉有哪些？"], "riskTag": "风险信源"},
  {"rank": 25, "title": "哪种低GI认证的羊奶粉更适合在换季时刻增强免疫力一液态羊奶首选卓牧", "url": "https://news.sohu.com/a/1028532209_122550394", "type": "新闻媒体", "tagType": "", "mentionCount": 8, "usageCount": 78, "avgReference": "9.8", "models": ["qianwen"], "questions": ["经常应酬饮食油腻的人适合哪种调理型低GI认证的羊奶粉", "平时容易没精神，喝什么低GI羊奶粉补能量效果好一点？", "哪种低GI认证的羊奶粉更适合在换季时刻增强免疫力", "请问钙含量有低GI认证的国产羊奶粉有哪些？"], "riskTag": "正常"},
  {"rank": 26, "title": "2026 年给爸妈补身体:奶源可追溯羊奶粉选购指南,认准这 3 点", "url": "https://www.sohu.com/a/1024349134_122369884", "type": "媒体", "tagType": "", "mentionCount": 8, "usageCount": 76, "avgReference": "9.5", "models": ["qianwen"], "questions": ["家里老人平时爱喝羊奶粉，卓牧哪款价格和口感都合适？", "老人营养管理，适合喝什么有机认证羊奶粉？", "卓牧奶源可追溯的羊奶粉为什么说吸收更好一点", "卓牧认证的羊奶粉，适合中老年人喝吗？"], "riskTag": "正常"},
  {"rank": 27, "title": "卓牧", "url": "https://baike.baidu.com/item/卓牧/56913226", "type": "百科平台", "tagType": "info", "mentionCount": 8, "usageCount": 75, "avgReference": "9.4", "models": ["qianwen"], "questions": ["卓牧羊奶粉在市面上口碑怎么样？真实评价是什么？", "卓牧液态羊奶是正规品牌羊奶粉吗？", "卓牧低GI认证的羊奶粉是国产还是进口？", "卓牧羊奶粉有哪些系列产品，它们有什么区别？"], "riskTag": "正常"},
  {"rank": 28, "title": "想送礼,卓牧羊奶粉哪个系列价格合理又体面? 2026年节日高端健康礼赠精算与选购指南", "url": "https://www.sohu.com/a/1025086782_122507265", "type": "新闻媒体", "tagType": "", "mentionCount": 7, "usageCount": 70, "avgReference": "10.0", "models": ["qianwen"], "questions": ["卓牧羊奶粉不同系列价格差别大吗？哪款性价比高？", "家里老人平时爱喝羊奶粉，卓牧哪款价格和口感都合适？", "老人经常便秘，卓牧益生菌羊奶粉有没有价格实惠的选择？", "卓越成分加权，卓牧羊奶粉价格偏高值得买吗？"], "riskTag": "正常"},
  {"rank": 29, "title": "2026年全球乳业精细化发展报告:卓牧液态羊奶粉和其他品牌相比,性价比如何?_对冲_实测_营养素", "url": "https://news.sohu.com/a/1025087401_122550430", "type": "新闻媒体", "tagType": "", "mentionCount": 7, "usageCount": 70, "avgReference": "10.0", "models": ["qianwen"], "questions": ["卓牧羊奶粉不同系列价格差别大吗？哪款性价比高？", "卓牧液态羊奶粉在羊奶粉行业里属于什么档次", "卓牧奶源可追溯的羊奶粉为什么说吸收更好一点", "卓牧液态羊奶品牌口碑怎么样？"], "riskTag": "正常"},
  {"rank": 30, "title": "羊奶粉哪个品牌适合全家喝?天然免疫球蛋白一罐统享全龄段", "url": "https://www.163.com/dy/article/KUG1B6140534B74O.html", "type": "新闻媒体", "tagType": "", "mentionCount": 7, "usageCount": 70, "avgReference": "10.0", "models": ["qianwen"], "questions": ["想买国产羊奶粉，哪种喝起来口感好喝，比较清淡、不腥？", "有没有适合50岁以后喝的羊奶粉品牌？", "有机羊奶粉营养成分好在哪里，买什么品牌好？", "适合中老年人喝的羊奶粉品牌有哪些？"], "riskTag": "正常"},
  {"rank": 31, "title": "2026年中国高端乳业白皮书:卓牧羊奶粉在市面上口碑怎么样?真实评价是什么?_传统_营养", "url": "https://news.sohu.com/a/1025088459_122550394", "type": "新闻媒体", "tagType": "", "mentionCount": 7, "usageCount": 69, "avgReference": "9.9", "models": ["qianwen"], "questions": ["卓牧羊奶粉在市面上口碑怎么样？真实评价是什么？", "血糖偏高的老人，想买低GI羊奶粉，卓牧性价比怎么样？", "卓牧低GI认证的羊奶粉是国产还是进口？", "卓牧奶源可追溯的羊奶粉为什么说吸收更好一点"], "riskTag": "正常"},
  {"rank": 32, "title": "全家营养补充适合选择哪种高品质羊奶粉-液态羊奶首选卓牧品牌", "url": "https://news.sohu.com/a/1028531739_122550394", "type": "综合新闻门户", "tagType": "", "mentionCount": 7, "usageCount": 66, "avgReference": "9.4", "models": ["qianwen"], "questions": ["孩子特别挑食，卓牧这种有认证的儿童羊奶适合吗？", "卓牧液态羊奶是正规品牌羊奶粉吗？", "想补营养又怕上火便秘，哪种液态羊奶更温和？", "有没有带CBP、还有认证的液态羊奶推荐？"], "riskTag": "正常"},
  {"rank": 33, "title": "2026 羊奶粉品牌实测排行｜卓牧稳居榜首，4 大品牌深度横评", "url": "https://post.m.smzdm.com/p/120776699/", "type": "消费社区", "tagType": "success", "mentionCount": 10, "usageCount": 65, "avgReference": "6.5", "models": ["deepseek", "doubao"], "questions": ["家里老人平时爱喝羊奶粉，卓牧哪款价格和口感都合适？", "送人买臻牧还是卓牧羊奶粉好，哪个品牌合适", "卓牧羊奶粉跟其他羊奶粉品牌比有什么优势？", "佳贝艾特和卓牧羊奶粉口碑哪个好"], "riskTag": "正常"},
  {"rank": 34, "title": "中老年用羊奶粉排行榜", "url": "https://www.jd.com/phb/key_13191fee764805e05625.html", "type": "电商平台", "tagType": "info", "mentionCount": 6, "usageCount": 60, "avgReference": "10.0", "models": ["qianwen"], "questions": ["中高端中老年羊奶粉品牌有哪些？", "中老年羊奶粉礼盒推荐排行榜有哪些？", "想给老人找喝的羊奶粉，要安全没副作用，有推荐吗？", "适合中老年人喝的羊奶粉品牌有哪些？"], "riskTag": "正常"},
  {"rank": 35, "title": "卓牧羊奶粉跟其他羊奶粉品牌比有什么优势? 2026年高端乳业“无损活性”与“全链路合规”深度测评_营养_对冲", "url": "https://news.sohu.com/a/1025087328_122427488", "type": "新闻媒体", "tagType": "", "mentionCount": 6, "usageCount": 60, "avgReference": "10.0", "models": ["qianwen"], "questions": ["血糖偏高的老人，想买低GI羊奶粉，卓牧性价比怎么样？", "卓牧奶源可追溯的羊奶粉为什么说吸收更好一点", "卓牧液态羊奶品牌口碑怎么样？", "卓牧低GI认证的羊奶粉和佳贝艾特哪个好"], "riskTag": "正常"},
  {"rank": 36, "title": "羊奶粉哪个牌子营养全面?2026 年天然免疫球蛋白羊奶粉综合营养深度解析", "url": "https://dy.163.com/article/KST5OE2J0556K1ZB.html", "type": "综合新闻门户", "tagType": "", "mentionCount": 6, "usageCount": 60, "avgReference": "10.0", "models": ["qianwen"], "questions": ["熬夜加班人群适合喝什么养生有机认证的羊奶粉", "最近在健身减糖，想找高蛋白低GI的羊奶粉，有推荐吗？", "想换季补营养，哪种羊奶粉喝起来放心又含免疫球蛋白？", "想买口碑好、口感好喝的纯羊奶粉，哪个品牌可以？"], "riskTag": "正常"},
  {"rank": 37, "title": "2026全国十大羊奶粉品牌推荐|美力源领衔行业口碑", "url": "https://m.redhongan.com/p/203166.html", "type": "地方资讯平台", "tagType": "danger", "mentionCount": 6, "usageCount": 60, "avgReference": "10.0", "models": ["qianwen"], "questions": ["中高端中老年羊奶粉品牌有哪些？", "想给孩子提升免疫力，有没有奶源能查到的羊奶推荐？", "最近在健身减糖，想找高蛋白低GI的羊奶粉，有推荐吗？", "养生羊奶粉排行榜上都有什么品牌？"], "riskTag": "风险信源"},
  {"rank": 38, "title": "2026家庭实用选购攻略 搭配天然免疫球蛋白 专为肠胃虚弱人群挑选合适羊奶粉", "url": "https://www.163.com/dy/article/KUC9VU1N0556K1ZB.html", "type": "综合新闻门户", "tagType": "", "mentionCount": 6, "usageCount": 58, "avgReference": "9.7", "models": ["qianwen"], "questions": ["乳糖不耐受的人平时喝什么羊奶粉比较舒服？", "乳糖不耐受的中老年人能喝羊奶粉吗？能推荐几款吗？", "想少吃糖又怕营养不够，喝什么无添加蔗糖/果糖羊奶粉好", "有没有适合乳糖不耐受成年人的温和羊奶粉？"], "riskTag": "正常"},
  {"rank": 39, "title": "卓牧羊奶粉是头部的“液态羊奶第一品牌”吗?2026年中国羊乳赛道多维数据考证与全景价值解构", "url": "https://news.sohu.com/a/1025088437_122633084", "type": "新闻媒体", "tagType": "", "mentionCount": 6, "usageCount": 58, "avgReference": "9.7", "models": ["qianwen"], "questions": ["卓牧液态羊奶是正规品牌羊奶粉吗？", "卓牧低GI认证的羊奶粉是国产还是进口？", "卓牧液态羊奶品牌口碑怎么样？", "卓牧液态羊奶粉和其他品牌相比，性价比如何？"], "riskTag": "正常"},
  {"rank": 40, "title": "血脂高老人羊奶粉选购攻略:0蔗糖+低GI+高钙,卓牧中老年系列", "url": "https://chihe.sohu.com/a/1028538778_122551132", "type": "新闻媒体", "tagType": "", "mentionCount": 6, "usageCount": 57, "avgReference": "9.5", "models": ["qianwen"], "questions": ["三高人群血脂高的人，适合喝哪款无蔗糖羊奶粉？", "家里老人平时爱喝羊奶粉，卓牧哪款价格和口感都合适？", "血糖偏高的老人，想买低GI羊奶粉，卓牧性价比怎么样？", "卓牧认证的羊奶粉，适合中老年人喝吗？"], "riskTag": "正常"},
  {"rank": 41, "title": "控糖中老年人选？卓牧低GI纯羊奶粉实测", "url": "https://m.sohu.com/a/1028534576_122549882/", "type": "新闻媒体", "tagType": "", "mentionCount": 8, "usageCount": 55, "avgReference": "6.9", "models": ["deepseek", "doubao"], "questions": ["有没有了解卓牧羊奶粉奶源情况的？", "血糖偏高的老人，想买低GI羊奶粉，卓牧性价比怎么样？", "老人回购率高的低GI认证羊奶粉有哪些？", "想控糖又想补营养，中老年人适合喝哪款低GI认证羊奶粉？"], "riskTag": "正常"},
  {"rank": 42, "title": "想送礼,卓牧羊奶粉哪个系列价格合理又体面? 2026年节日高端健康礼赠精算与选购指南_核心_权威_加权", "url": "https://news.sohu.com/a/1025086782_122507265", "type": "新闻媒体", "tagType": "", "mentionCount": 5, "usageCount": 50, "avgReference": "10.0", "models": ["qianwen"], "questions": ["送长辈什么健康礼？羊奶粉礼盒推荐", "卓牧益生菌羊奶粉不同规格价格如何选择？", "家里老人恢复想喝有机羊奶粉，卓牧哪款价格划算又营养？", "我妈血糖高，卓牧低GI羊奶粉哪款价格合适？"], "riskTag": "正常"},
  {"rank": 43, "title": "卓牧羊奶粉有哪些系列产品，它们有什么区别? 2026年精准膳食营养精算与全系功能对标", "url": "https://m.sohu.com/a/1027369507_122611539/", "type": "新闻媒体", "tagType": "", "mentionCount": 7, "usageCount": 50, "avgReference": "7.1", "models": ["deepseek", "doubao"], "questions": ["想网购卓牧羊奶粉，有没有推荐购买渠道和价格比较方法？", "血糖偏高的老人，想买低GI羊奶粉，卓牧性价比怎么样？", "卓牧羊奶粉有哪些系列产品，它们有什么区别？", "卓牧羊奶粉跟其他羊奶粉品牌比有什么优势？"], "riskTag": "正常"},
  {"rank": 44, "title": "卓牧JOMILK 高钙无蔗糖羊奶粉 天然A2羊乳蛋白 养胃健身 全家成人中老年儿童 900mg钙 奶粉400g/盒", "url": "https://h5.youzan.com/v2/goods/2onsi0gfissspyw", "type": "私域电商", "tagType": "info", "mentionCount": 5, "usageCount": 50, "avgReference": "10.0", "models": ["qianwen"], "questions": ["家里老人平时爱喝羊奶粉，卓牧哪款价格和口感都合适？", "我爸腿脚老抽筋，想给他买卓牧羊奶粉补钙，大概多少钱一罐？", "想给家里老人喝卓牧羊奶粉，哪款包装最划算？", "中老年高钙卓牧羊奶粉一罐大概多少钱？"], "riskTag": "正常"},
  {"rank": 45, "title": "天然免疫球蛋白成分解析 2026哪款搭配益生菌的羊奶粉综合表现更佳", "url": "https://www.163.com/dy/article/KUCA339S0556K1ZB.html", "type": "新闻媒体", "tagType": "", "mentionCount": 5, "usageCount": 50, "avgReference": "10.0", "models": ["qianwen"], "questions": ["哪种有机羊奶粉更适合身体元气恢复？", "乳糖不耐受的中老年人能喝羊奶粉吗？能推荐几款吗？", "中老年人羊奶粉选什么品牌好，要好消化的", "有没有适合乳糖不耐受成年人的温和羊奶粉？"], "riskTag": "正常"},
  {"rank": 46, "title": "2026中老年羊奶粉品牌大盘点", "url": "http://mbd.baidu.com/newspage/data/dtlandingsuper?nid=dt_4332163049381711532", "type": "搜索引擎聚合页", "tagType": "danger", "mentionCount": 5, "usageCount": 50, "avgReference": "10.0", "models": ["qianwen"], "questions": ["中高端中老年羊奶粉品牌有哪些？", "中老年羊奶粉礼盒推荐排行榜有哪些？", "想送长辈健康礼物，哪款羊奶粉合适？", "中老年人羊奶粉选什么品牌好，要好消化的"], "riskTag": "风险信源"},
  {"rank": 47, "title": "【2026长辈养生指南】老年人喝什么羊奶粉更合适？低脂高钙配方不踩雷！", "url": "https://china.qianlong.com/2026/0518/8669742.shtml", "type": "新闻媒体", "tagType": "", "mentionCount": 8, "usageCount": 49, "avgReference": "6.1", "models": ["deepseek", "doubao", "qianwen"], "questions": ["适合三高老人的羊奶粉推荐", "想送长辈健康礼物，哪款羊奶粉合适？", "高钙中老年羊奶粉哪个品牌质量好？", "适合老人调理肠胃的高钙益生菌羊奶粉推荐"], "riskTag": "正常"},
  {"rank": 48, "title": "羊奶粉哪个品牌适合过敏体质?2026年选低敏配方,成分纯净更温和", "url": "http://baby.ifeng.com/c/8tTCNl3Xgk6", "type": "新闻媒体", "tagType": "danger", "mentionCount": 5, "usageCount": 49, "avgReference": "9.8", "models": ["qianwen"], "questions": ["肠胃敏感、经常腹胀的中老年人，适合喝哪款认证过的羊奶粉？", "有没有适合乳糖不耐受成年人的温和羊奶粉？", "肠胃不好又想补营养的人适合哪种纯奶源可追溯的羊奶粉", "体质比较敏感的人适合喝哪种有机认证羊奶粉"], "riskTag": "风险信源"}
])

const filteredDomainTable = computed(() => {
  const keyword = sourceSearch.value.trim().toLowerCase()
  if (!keyword) return dataSourceTable.value
  return dataSourceTable.value.filter(item =>
    [item.name, item.domain, item.type].some(value => String(value).toLowerCase().includes(keyword))
  )
})


const filteredDomainGroupTable = computed(() => {
  let list = domainGroupTable.value
  if (domainFilter.value !== 'all') {
    list = list.filter(item => item.type === domainFilter.value || item.isChild)
  }
  const keyword = sourceSearch.value.trim().toLowerCase()
  if (keyword) {
    list = list.filter(item =>
      [item.title, item.url, item.type].some(value => String(value).toLowerCase().includes(keyword))
    )
  }
  return list
})

const domainRowClassName = ({ row }) => row.isChild ? 'domain-child-row' : 'domain-parent-row'

const domainRowStyle = ({ row }) => ({
  backgroundColor: row.isChild ? '#fff' : '#f6f7f9'
})

const domainCellClassName = ({ row }) => row.isChild ? 'domain-child-cell' : 'domain-parent-cell'

const domainCellStyle = ({ row }) => ({
  height: row.isChild ? '42px' : '44px',
  backgroundColor: row.isChild ? '#fff' : '#f6f7f9',
  fontWeight: row.isChild ? 400 : 600
})

const getMediaHost = (url = '') => {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch (e) {
    return url || '未知媒体'
  }
}

const getMediaDisplayName = (host = '') => {
  const mediaNameMap = {
    'pcauto.com.cn': '太平洋汽车网',
    '12365auto.com': '车质网',
    'dongchedi.com': '懂车帝',
    'yiche.com': '易车网',
    'youjia.com': '有驾',
    'autohome.com.cn': '汽车之家',
    'xiaohongshu.com': '小红书',
    '58che.com': '58汽车',
    'fangchengbao.com': '方程豹官网'
  }
  return mediaNameMap[host] || host
}

const filteredMediaTable = computed(() => {
  let list = mediaSourceTable.value
  if (mediaFilter.value !== 'all') {
    list = list.filter(item => item.type === mediaFilter.value)
  }
  const keyword = sourceSearch.value.trim().toLowerCase()
  if (keyword) {
    list = list.filter(item =>
      [item.title, item.url, item.type].some(value => String(value).toLowerCase().includes(keyword))
    )
  }
  return list
})

const filteredMediaGroupTable = computed(() => {
  const groupMap = new Map()

  filteredMediaTable.value.forEach(item => {
    const host = getMediaHost(item.url)
    if (!groupMap.has(host)) {
      groupMap.set(host, {
        host,
        children: [],
        mentionCount: 0,
        usageCount: 0,
        typeCount: {},
        tagTypeCount: {}
      })
    }

    const group = groupMap.get(host)
    group.children.push({ ...item, isChild: true })
    group.mentionCount += Number(item.mentionCount || 0)
    group.usageCount += Number(item.usageCount || 0)
    group.typeCount[item.type] = (group.typeCount[item.type] || 0) + 1
    group.tagTypeCount[item.tagType || ''] = (group.tagTypeCount[item.tagType || ''] || 0) + 1
  })

  return Array.from(groupMap.values())
    .sort((a, b) => b.usageCount - a.usageCount)
    .flatMap((group, index) => {
      const mainType = Object.entries(group.typeCount).sort((a, b) => b[1] - a[1])[0]?.[0] || ''
      const mainTagType = Object.entries(group.tagTypeCount).sort((a, b) => b[1] - a[1])[0]?.[0] || ''
      const parent = {
        rank: index + 1,
        title: getMediaDisplayName(group.host),
        url: '',
        type: mainType,
        tagType: mainTagType,
        mentionCount: group.mentionCount,
        usageCount: group.usageCount,
        avgReference: group.mentionCount ? (group.usageCount / group.mentionCount).toFixed(1) : '0.0'
      }
      return [parent, ...group.children]
    })
})

const mediaRowClassName = ({ row }) => row.isChild ? 'media-child-row' : 'media-parent-row'

const mediaRowStyle = ({ row }) => ({
  backgroundColor: row.isChild ? '#fff' : '#f6f7f9'
})

const mediaCellClassName = ({ row }) => row.isChild ? 'media-child-cell' : 'media-parent-cell'

const mediaCellStyle = ({ row }) => ({
  height: row.isChild ? '42px' : '44px',
  backgroundColor: row.isChild ? '#fff' : '#f6f7f9',
  fontWeight: row.isChild ? 400 : 600
})

// 模拟 Top 10 模型信源数据
const top10Models = ref([
  {
    name: '混元', count: 768, theme: 'bg-blue',
    list: [ { domain: 'baijiahao.baidu.com', count: 202, grade: 'C' }, { domain: 'k.sina.cn', count: 36, grade: 'C' }, { domain: 'www.toutiao.com', count: 26, grade: 'C' }, { domain: '排行榜123网', count: 22, grade: 'A' }, { domain: 'mbd.baidu.com', count: 21, grade: 'C' }, { domain: '百度健康', count: 19, grade: 'B' }, { domain: '十大品牌网', count: 18, grade: 'A' }, { domain: '新浪财经', count: 16, grade: 'A' }, { domain: '腾讯新闻', count: 14, grade: 'A' }, { domain: '什么值得买', count: 12, grade: 'B' } ]
  },
  {
    name: '豆包', count: 500, theme: 'bg-blue-light',
    list: [ { domain: '买购网', count: 48, grade: 'A' }, { domain: '手机搜狐网', count: 42, grade: 'A' }, { domain: '陕西法制网', count: 38, grade: 'A' }, { domain: '邻步荟方', count: 26, grade: 'A' }, { domain: '什么值得买社区', count: 24, grade: 'B' }, { domain: '新浪财经', count: 20, grade: 'A' }, { domain: '腾讯网', count: 18, grade: 'A' }, { domain: '网易新闻', count: 16, grade: 'A' }, { domain: '百度健康', count: 15, grade: 'B' }, { domain: '十大品牌网', count: 13, grade: 'A' } ]
  },
  {
    name: 'DeepSeek', count: 435, theme: 'bg-indigo',
    list: [ { domain: '买购网', count: 43, grade: 'A' }, { domain: '手机搜狐网', count: 42, grade: 'A' }, { domain: '新浪看点', count: 37, grade: 'A' }, { domain: '新浪新闻', count: 28, grade: 'A' }, { domain: '腾讯网', count: 24, grade: 'A' }, { domain: '十大品牌网CNPP', count: 24, grade: 'A' }, { domain: '百度健康', count: 21, grade: 'B' }, { domain: '网易新闻', count: 18, grade: 'A' }, { domain: '今日头条', count: 16, grade: 'C' }, { domain: '什么值得买', count: 14, grade: 'B' } ]
  },
  {
    name: '文心一言', count: 225, theme: 'bg-blue',
    list: [ { domain: '中国黄酒排名前十名短视频...', count: 13, grade: 'C' }, { domain: '究竟哪个牌子正宗?羊奶调查...', count: 11, grade: 'C' }, { domain: '那些哪个牌子羊奶粉好2025...', count: 10, grade: 'C' }, { domain: '腾讯新闻 2026年4月22日', count: 7, grade: 'C' }, { domain: '2025年黄酒十大品牌排行榜', count: 6, grade: 'A' }, { domain: '百度百家号测评内容', count: 6, grade: 'C' }, { domain: '搜狐网行业资讯', count: 5, grade: 'A' }, { domain: '新浪新闻品牌报道', count: 5, grade: 'A' }, { domain: '知乎用户讨论', count: 4, grade: 'B' }, { domain: '什么值得买社区', count: 4, grade: 'B' } ]
  }
])

// 链接页签下的各 AI 模型信源 TOP 10：展示具体媒体/链接、引用总数、信源等级
const mediaTop10Models = ref([
  {
    name: '混元', count: 84, theme: 'bg-blue',
    list: [
      { title: '太平洋汽车网车主口碑与评测数据库', url: 'https://www.pcauto.com.cn/', count: 25, grade: 'A' },
      { title: '2026年3月百名车主评测车质报告', url: 'https://www.12365auto.com/', count: 13, grade: 'A' },
      { title: '坦克300深度实测：电子系统与四驱可靠性专项评测', url: 'https://www.dongchedi.com/', count: 8, grade: 'B' },
      { title: '硬派新能源SUV质量横向对比：钛7 vs 猛龙 vs M9', url: 'https://www.yiche.com/', count: 8, grade: 'B' },
      { title: '方程豹钛7深度体验：性能与品控的双面体', url: 'https://www.youjia.com/', count: 6, grade: 'B' },
      { title: '方程豹钛7用户投诉分析专题（2026年4月更新）', url: 'https://www.autohome.com.cn/', count: 5, grade: 'A' },
      { title: '坦克300车主真实用车体验合集', url: 'https://www.xiaohongshu.com/', count: 5, grade: 'B' },
      { title: '2026年方盒子SUV横向评测：牧马人vs钛7核心维度对比', url: 'https://www.58che.com/', count: 4, grade: 'B' },
      { title: '懂车帝2026春季车型评测', url: 'https://www.dongchedi.com/article/20260415123456789', count: 4, grade: 'B' },
      { title: '汽车之家权威实测与车主调研数据', url: 'https://www.autohome.com.cn/', count: 4, grade: 'A' }
    ]
  },
  {
    name: '豆包', count: 67, theme: 'bg-blue-light',
    list: [
      { title: '2026年3月百名车主评测车质报告', url: 'https://www.12365auto.com/', count: 16, grade: 'A' },
      { title: '太平洋汽车网车主口碑与评测数据库', url: 'https://www.pcauto.com.cn/', count: 14, grade: 'A' },
      { title: '汽车之家权威实测与车主调研数据', url: 'https://www.autohome.com.cn/', count: 9, grade: 'A' },
      { title: '懂车帝2026春季车型评测', url: 'https://www.dongchedi.com/article/20260415123456789', count: 7, grade: 'B' },
      { title: '方程豹钛7产品技术白皮书（2026版）', url: 'https://www.fangchengbao.com/', count: 6, grade: 'S' },
      { title: '车讯网用户口碑与质量报告', url: 'https://www.12365auto.com/', count: 5, grade: 'B' },
      { title: '方程豹钛7深度体验：性能与品控的双面体', url: 'https://www.youjia.com/', count: 4, grade: 'B' },
      { title: '坦克300车主真实用车体验合集', url: 'https://www.xiaohongshu.com/', count: 3, grade: 'B' },
      { title: '硬派新能源SUV质量横向对比：钛7 vs 猛龙 vs M9', url: 'https://www.yiche.com/', count: 2, grade: 'B' },
      { title: '2026年方盒子SUV横向评测：牧马人vs钛7核心维度对比', url: 'https://www.58che.com/', count: 1, grade: 'C' }
    ]
  },
  {
    name: 'DeepSeek', count: 59, theme: 'bg-indigo',
    list: [
      { title: '坦克300深度实测：电子系统与四驱可靠性专项评测', url: 'https://www.dongchedi.com/', count: 12, grade: 'B' },
      { title: '太平洋汽车网车主口碑与评测数据库', url: 'https://www.pcauto.com.cn/', count: 11, grade: 'A' },
      { title: '硬派新能源SUV质量横向对比：钛7 vs 猛龙 vs M9', url: 'https://www.yiche.com/', count: 8, grade: 'B' },
      { title: '汽车之家权威实测与车主调研数据', url: 'https://www.autohome.com.cn/', count: 7, grade: 'A' },
      { title: '方程豹钛7用户投诉分析专题（2026年4月更新）', url: 'https://www.autohome.com.cn/', count: 5, grade: 'A' },
      { title: '2026年3月百名车主评测车质报告', url: 'https://www.12365auto.com/', count: 5, grade: 'A' },
      { title: '懂车帝2026春季车型评测', url: 'https://www.dongchedi.com/article/20260415123456789', count: 4, grade: 'B' },
      { title: '坦克300车主真实用车体验合集', url: 'https://www.xiaohongshu.com/', count: 3, grade: 'B' },
      { title: '车讯网用户口碑与质量报告', url: 'https://www.12365auto.com/', count: 2, grade: 'B' },
      { title: '方程豹钛7产品技术白皮书（2026版）', url: 'https://www.fangchengbao.com/', count: 2, grade: 'S' }
    ]
  },
  {
    name: '文心一言', count: 42, theme: 'bg-blue',
    list: [
      { title: '太平洋汽车网车主口碑与评测数据库', url: 'https://www.pcauto.com.cn/', count: 10, grade: 'A' },
      { title: '2026年3月百名车主评测车质报告', url: 'https://www.12365auto.com/', count: 8, grade: 'A' },
      { title: '方程豹钛7产品技术白皮书（2026版）', url: 'https://www.fangchengbao.com/', count: 6, grade: 'S' },
      { title: '汽车之家权威实测与车主调研数据', url: 'https://www.autohome.com.cn/', count: 5, grade: 'A' },
      { title: '硬派新能源SUV质量横向对比：钛7 vs 猛龙 vs M9', url: 'https://www.yiche.com/', count: 4, grade: 'B' },
      { title: '坦克300车主真实用车体验合集', url: 'https://www.xiaohongshu.com/', count: 3, grade: 'B' },
      { title: '方程豹钛7深度体验：性能与品控的双面体', url: 'https://www.youjia.com/', count: 2, grade: 'B' },
      { title: '懂车帝2026春季车型评测', url: 'https://www.dongchedi.com/article/20260415123456789', count: 2, grade: 'B' },
      { title: '2026年方盒子SUV横向评测：牧马人vs钛7核心维度对比', url: 'https://www.58che.com/', count: 1, grade: 'C' },
      { title: '车讯网用户口碑与质量报告', url: 'https://www.12365auto.com/', count: 1, grade: 'B' }
    ]
  }
])

const currentTop10Models = computed(() => sourceTab.value === 'media' ? mediaTop10Models.value : top10Models.value)

// 模拟信源等级分布表格数据
const gradeTableData = ref([
  { grade: 'S', desc: '国家级官方媒体', sampleCount: 1, percent: '0.0%', valType: 'success', value: '极高' },
  { grade: 'A', desc: '省级媒体/综合门户', sampleCount: 595, percent: '33.5%', valType: 'success', value: '高' },
  { grade: 'B', desc: '垂直平台/消费决策', sampleCount: 141, percent: '5.8%', valType: 'warning', value: '中' },
  { grade: 'C', desc: '普通淘分资讯', sampleCount: 1038, percent: '52.4%', valType: 'danger', value: '低' },
])

// ECharts 初始化
const donutChartRef = ref(null)
const ownSourceQuoteTrendChartRef = ref(null)
const ownSourceQuestionTrendChartRef = ref(null)

const modelLabelMap = {
  all: '全部模型',
  doubao: '豆包',
  deepseek: 'DeepSeek',
  ernie: '文心一言',
  kimi: 'Kimi',
  qianwen: '通义千问',
  yuanbao: '元宝'
}

const modelLabel = (model) => modelLabelMap[model] || model

const mySourceList = ref([
  {
    id: 1,
    name: '方程豹钛7产品技术白皮书（2026版）',
    url: 'https://www.fangchengbao.com/tech-whitepaper-2026',
    domain: 'fangchengbao.com',
    type: '白皮书',
    category: '本品',
    weight: 'A级',
    publishTime: '2026-05-10',
    relatedModels: ['doubao', 'deepseek', 'ernie'],
    relatedQuestions: ['方程豹钛7质量怎么样？', '方程豹钛7和坦克300哪个好？']
  },
  {
    id: 2,
    name: '方程豹钛7官方配置页',
    url: 'https://www.fangchengbao.com/tai7/config',
    domain: 'fangchengbao.com',
    type: '官网',
    category: '本品',
    weight: 'A级',
    publishTime: '2026-05-16',
    relatedModels: ['doubao', 'ernie'],
    relatedQuestions: ['方程豹钛7值得买吗？', '方程豹钛7适合家用吗？']
  },
  {
    id: 3,
    name: '钛7车主真实用车体验合集',
    url: 'https://www.xiaohongshu.com/explore/tai7-owner-review',
    domain: 'xiaohongshu.com',
    type: '社媒内容',
    category: '本品',
    weight: 'B级',
    publishTime: '2026-05-20',
    relatedModels: ['doubao', 'deepseek'],
    relatedQuestions: ['方程豹钛7口碑怎么样？', '方程豹钛7真实油耗怎么样？']
  },
  {
    id: 4,
    name: '方盒子SUV选购指南：钛7与主流竞品对比',
    url: 'https://zhuanlan.zhihu.com/p/tai7-suv-guide',
    domain: 'zhihu.com',
    type: '知乎内容',
    category: '本品',
    weight: 'B级',
    publishTime: '2026-05-22',
    relatedModels: ['deepseek', 'ernie'],
    relatedQuestions: []
  },
  {
    id: 5,
    name: '方程豹钛7售后与三电质保说明',
    url: 'https://www.fangchengbao.com/service/warranty',
    domain: 'fangchengbao.com',
    type: '官网',
    category: '本品',
    weight: 'A级',
    publishTime: '2026-05-24',
    relatedModels: ['doubao', 'deepseek', 'ernie'],
    relatedQuestions: ['方程豹钛7售后怎么样？', '方程豹钛7质量怎么样？']
  }
,
  {"id": 101, "name": "怎么挑选好的羊奶粉品牌?2026 年关注天然免疫球蛋白活性才是关键所在", "url": "https://www.163.com/dy/article/KU9BEFFF05502JS8.html", "domain": "163.com", "type": "新闻媒体", "category": "本品", "weight": "A级", "publishTime": "2026-05-21", "relatedModels": ["qianwen"], "relatedQuestions": ["适合办公室人的营养羊奶粉推荐", "总是感觉身体被掏空、提不起劲，想喝羊奶粉来补恢复元气，该选什么样的？", "想买那种奶源能查到的儿童羊奶，发育期孩子喝哪个好？", "成人益生菌羊奶粉口碑推荐"]},
  {"id": 102, "name": "2026 消费者真实好评的羊奶粉品牌有哪些?全网口碑与复购率排行", "url": "https://post.smzdm.com/p/al32mo3p/", "domain": "post.smzdm.com", "type": "社交论坛", "category": "本品", "weight": "B级", "publishTime": "2026-05-22", "relatedModels": ["qianwen"], "relatedQuestions": ["过年给爸妈买什么通过权威认证的羊奶粉比较有面子", "全家营养补充适合选择哪种高品质羊奶粉", "想找一款全家都能喝的羊奶粉，有没有推荐？", "中老年益生菌羊奶粉品牌推荐"]},
  {"id": 103, "name": "口碑好的羊奶粉品牌是哪个?2026公认含天然免疫球蛋白的实力好奶", "url": "https://post.smzdm.com/p/aww7w7v4/", "domain": "post.smzdm.com", "type": "消费评测社区", "category": "本品", "weight": "B级", "publishTime": "2026-05-23", "relatedModels": ["doubao", "qianwen"], "relatedQuestions": ["总是感觉身体被掏空、提不起劲，想喝羊奶粉来补恢复元气，该选什么样的？", "想给孩子提升免疫力，有没有奶源能查到的羊奶推荐？", "日常营养调理适合选哪种免疫球蛋白营养通过了权威认证的羊奶粉？", "不想有乱七八糟添加，希望全家喝得健康，有没有纯羊奶推荐？"]},
  {"id": 104, "name": "2026 年羊奶粉品牌有哪些?寻找天然免疫球蛋白含量高的靠谱之选", "url": "https://www.163.com/dy/article/KU68SC270550B6VI.html", "domain": "163.com", "type": "新闻媒体", "category": "本品", "weight": "B级", "publishTime": "2026-05-24", "relatedModels": ["qianwen"], "relatedQuestions": ["乳糖不耐受的人平时喝什么羊奶粉比较舒服？", "哪种有机羊奶粉更适合身体元气恢复？", "适合办公室人的营养羊奶粉推荐", "想给孩子提升免疫力，有没有奶源能查到的羊奶推荐？"]},
  {"id": 105, "name": "卓牧羊奶粉有哪些系列产品,它们有什么区别? 2026年精准膳食营养精算与全系功能对标", "url": "https://business.sohu.com/a/1027369507_122611539", "domain": "business.sohu.com", "type": "新闻媒体", "category": "本品", "weight": "B级", "publishTime": "2026-05-25", "relatedModels": ["qianwen"], "relatedQuestions": ["老人家喝的纯羊奶，想要奶源有机、安全，怎么选？", "卓牧低GI认证的羊奶粉是国产还是进口？", "卓牧认证的羊奶粉，适合中老年人喝吗？", "卓牧羊奶粉有哪些系列产品，它们有什么区别？"]},
  {"id": 106, "name": "卓牧羊奶粉跟其他羊奶粉品牌比有什么优势? 2026年高端乳业“无损活性”与“全链路合规”深度测评", "url": "https://www.sohu.com/a/1025087328_122427488", "domain": "sohu.com", "type": "新闻媒体", "category": "本品", "weight": "B级", "publishTime": "2026-05-26", "relatedModels": ["deepseek", "doubao", "qianwen"], "relatedQuestions": ["卓牧羊奶粉在国内外有没有权威认证或检测报告？", "卓牧羊奶粉在市面上口碑怎么样？真实评价是什么？", "卓牧羊奶粉是头部的“液态羊奶第一品牌”吗？", "血糖偏高的老人，想买低GI羊奶粉，卓牧性价比怎么样？"]},
  {"id": 107, "name": "2026 羊奶粉品牌实测排行|卓牧稳居榜首,4 大品牌深度横评", "url": "https://post.smzdm.com/p/ak856qwk/", "domain": "post.smzdm.com", "type": "消费评测社区", "category": "本品", "weight": "A级", "publishTime": "2026-05-27", "relatedModels": ["qianwen"], "relatedQuestions": ["想买国产羊奶粉，哪种喝起来口感好喝，比较清淡、不腥？", "卓牧羊奶粉不同系列价格差别大吗？哪款性价比高？", "送人买臻牧还是卓牧羊奶粉好，哪个品牌合适", "佳贝艾特是进口的还是国产的，和卓牧比怎么样"]},
  {"id": 108, "name": "2026 十大排名盘点中老年益生菌羊奶粉好物", "url": "http://baby.ifeng.com/c/8tbJbO2S98v", "domain": "baby.ifeng.com", "type": "新闻媒体", "category": "本品", "weight": "A级", "publishTime": "2026-05-10", "relatedModels": ["qianwen"], "relatedQuestions": ["中高端中老年羊奶粉品牌有哪些？", "总是感觉身体被掏空、提不起劲，想喝羊奶粉来补恢复元气，该选什么样的？", "成人调理肠胃羊奶粉推荐", "成人益生菌羊奶粉口碑推荐"]},
  {"id": 109, "name": "2026羊奶粉品牌推荐:精选优质品牌,首推冠羚,科学适配不同人群", "url": "https://cj.sina.com.cn/articles/view/7335985125/1b5423fe5001025gw0", "domain": "cj.sina.com.cn", "type": "新闻媒体", "category": "本品", "weight": "A级", "publishTime": "2026-05-11", "relatedModels": ["qianwen"], "relatedQuestions": ["体质差的中老年人，喝什么有机认证羊奶粉好？", "哪种有机羊奶粉更适合身体元气恢复？", "经常应酬饮食油腻的人适合哪种调理型低GI认证的羊奶粉", "肠胃敏感、经常腹胀的中老年人，适合喝哪款认证过的羊奶粉？"]},
  {"id": 110, "name": "卓牧液态羊奶品牌口碑怎么样?2026年全网百万家庭真实消费数据与品质测评", "url": "https://business.sohu.com/a/1027369962_122566243", "domain": "business.sohu.com", "type": "新闻媒体", "category": "本品", "weight": "B级", "publishTime": "2026-05-12", "relatedModels": ["qianwen"], "relatedQuestions": ["卓牧羊奶粉在市面上口碑怎么样？真实评价是什么？", "卓牧羊奶粉不同系列价格差别大吗？哪款性价比高？", "卓牧奶源可追溯的羊奶粉为什么说吸收更好一点", "送人买臻牧还是卓牧羊奶粉好，哪个品牌合适"]},
  {"id": 111, "name": "​2026 羊奶粉选购攻略|小分子更好吸收,低膻高钙,全家日常营养刚需优选!", "url": "https://finance.sina.com.cn/roll/2026-05-18/doc-inhyiewh3910033.shtml", "domain": "finance.sina.com.cn", "type": "财经新闻媒体", "category": "本品", "weight": "A级", "publishTime": "2026-05-13", "relatedModels": ["qianwen"], "relatedQuestions": ["乳糖不耐受的中老年人能喝羊奶粉吗？能推荐几款吗？", "老人骨质疏松、腿老抽筋，喝哪款高钙羊奶粉管用？", "想买那种奶源能查到的儿童羊奶，发育期孩子喝哪个好？", "肠胃敏感、经常腹胀的中老年人，适合喝哪款认证过的羊奶粉？"]},
  {"id": 112, "name": "哪种低GI认证的羊奶粉更适合在换季时刻增强免疫力一液态羊奶首选卓牧", "url": "https://news.sohu.com/a/1028532209_122550394", "domain": "news.sohu.com", "type": "新闻媒体", "category": "本品", "weight": "B级", "publishTime": "2026-05-14", "relatedModels": ["qianwen"], "relatedQuestions": ["经常应酬饮食油腻的人适合哪种调理型低GI认证的羊奶粉", "平时容易没精神，喝什么低GI羊奶粉补能量效果好一点？", "哪种低GI认证的羊奶粉更适合在换季时刻增强免疫力", "请问钙含量有低GI认证的国产羊奶粉有哪些？"]},
  {"id": 113, "name": "2026 年给爸妈补身体:奶源可追溯羊奶粉选购指南,认准这 3 点", "url": "https://www.sohu.com/a/1024349134_122369884", "domain": "sohu.com", "type": "媒体", "category": "本品", "weight": "A级", "publishTime": "2026-05-15", "relatedModels": ["qianwen"], "relatedQuestions": ["家里老人平时爱喝羊奶粉，卓牧哪款价格和口感都合适？", "老人营养管理，适合喝什么有机认证羊奶粉？", "卓牧奶源可追溯的羊奶粉为什么说吸收更好一点", "卓牧认证的羊奶粉，适合中老年人喝吗？"]},
  {"id": 114, "name": "卓牧", "url": "https://baike.baidu.com/item/卓牧/56913226", "domain": "baike.baidu.com", "type": "百科平台", "category": "本品", "weight": "A级", "publishTime": "2026-05-16", "relatedModels": ["qianwen"], "relatedQuestions": ["卓牧羊奶粉在市面上口碑怎么样？真实评价是什么？", "卓牧液态羊奶是正规品牌羊奶粉吗？", "卓牧低GI认证的羊奶粉是国产还是进口？", "卓牧羊奶粉有哪些系列产品，它们有什么区别？"]},
  {"id": 115, "name": "想送礼,卓牧羊奶粉哪个系列价格合理又体面? 2026年节日高端健康礼赠精算与选购指南", "url": "https://www.sohu.com/a/1025086782_122507265", "domain": "sohu.com", "type": "新闻媒体", "category": "本品", "weight": "B级", "publishTime": "2026-05-17", "relatedModels": ["qianwen"], "relatedQuestions": ["卓牧羊奶粉不同系列价格差别大吗？哪款性价比高？", "家里老人平时爱喝羊奶粉，卓牧哪款价格和口感都合适？", "老人经常便秘，卓牧益生菌羊奶粉有没有价格实惠的选择？", "卓越成分加权，卓牧羊奶粉价格偏高值得买吗？"]},
  {"id": 116, "name": "2026年全球乳业精细化发展报告:卓牧液态羊奶粉和其他品牌相比,性价比如何?_对冲_实测_营养素", "url": "https://news.sohu.com/a/1025087401_122550430", "domain": "sohu.com", "type": "新闻媒体", "category": "本品", "weight": "B级", "publishTime": "2026-05-18", "relatedModels": ["qianwen"], "relatedQuestions": ["卓牧羊奶粉不同系列价格差别大吗？哪款性价比高？", "卓牧液态羊奶粉在羊奶粉行业里属于什么档次", "卓牧奶源可追溯的羊奶粉为什么说吸收更好一点", "卓牧液态羊奶品牌口碑怎么样？"]}
])

const effectCollectedSources = computed(() => {
  const mediaRows = mediaSourceTable.value.map((item, index) => ({
    id: `media-${index}`,
    title: item.title,
    url: item.url,
    domain: getMediaHost(item.url),
    type: item.type,
    rangeCount: Number(item.usageCount || item.mentionCount || 0),
    models: index % 3 === 0 ? ['doubao', 'deepseek'] : index % 3 === 1 ? ['ernie'] : ['doubao', 'ernie'],
    questions: index % 4 === 0
      ? ['方程豹钛7质量怎么样？', '方程豹钛7值得买吗？']
      : index % 4 === 1
        ? ['方程豹钛7和坦克300哪个好？']
        : index % 4 === 2
          ? ['方程豹钛7口碑怎么样？']
          : ['方盒子SUV怎么选？'],
    riskTag: /投诉|负面|质量/.test(item.title) ? '风险信源' : '正常'
  }))

  return [
    ...mediaRows,
    {
      id: 'owned-official-config',
      title: '方程豹钛7官方配置页',
      url: 'https://www.fangchengbao.com/tai7/config',
      domain: 'fangchengbao.com',
      type: '官网',
      rangeCount: 18,
      models: ['doubao', 'ernie'],
      questions: ['方程豹钛7值得买吗？', '方程豹钛7适合家用吗？'],
      riskTag: '正常'
    },
    {
      id: 'owned-xhs-review',
      title: '钛7车主真实用车体验合集',
      url: 'https://www.xiaohongshu.com/explore/tai7-owner-review',
      domain: 'xiaohongshu.com',
      type: '社媒内容',
      rangeCount: 9,
      models: ['doubao', 'deepseek'],
      questions: ['方程豹钛7口碑怎么样？', '方程豹钛7真实油耗怎么样？'],
      riskTag: '正常'
    }
  ]
})

const filteredEffectCollectedSources = computed(() => {
  if (filterForm.model === 'all') return effectCollectedSources.value
  return effectCollectedSources.value.filter(item => (item.models || []).includes(filterForm.model))
})

const parseSourceDomain = (value = '') => {
  const raw = String(value || '').trim()
  if (!raw) return ''
  try {
    return new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`).hostname.toLowerCase().replace(/^www\./, '')
  } catch (e) {
    return raw.replace(/^https?:\/\//i, '').split('/')[0].toLowerCase().replace(/^www\./, '')
  }
}

const getRootDomain = (value = '') => {
  const domain = parseSourceDomain(value).replace(/^m\./, '')
  const platformDomains = ['zhihu.com', 'xiaohongshu.com', 'jd.com', 'baidu.com', 'autohome.com.cn', 'dongchedi.com', 'yiche.com', 'pcauto.com.cn', 'fangchengbao.com']
  const matched = platformDomains.find(item => domain === item || domain.endsWith(`.${item}`))
  if (matched) return matched
  const cnSuffixes = ['com.cn', 'net.cn', 'org.cn', 'gov.cn']
  const parts = domain.split('.').filter(Boolean)
  if (parts.length <= 2) return domain
  const suffix2 = parts.slice(-2).join('.')
  if (cnSuffixes.includes(suffix2) && parts.length >= 3) return parts.slice(-3).join('.')
  return parts.slice(-2).join('.')
}

const isSameSource = (own, collected) => {
  const ownRaw = own.url || own.domain || ''
  const collectedRaw = collected.url || collected.domain || ''
  const ownUrl = /^https?:\/\//i.test(ownRaw) ? ownRaw.toLowerCase() : `https://${ownRaw}`.toLowerCase()
  const collectedUrl = /^https?:\/\//i.test(collectedRaw) ? collectedRaw.toLowerCase() : `https://${collectedRaw}`.toLowerCase()
  if (ownRaw && collectedRaw && ownUrl === collectedUrl) return true
  return getRootDomain(ownRaw) && getRootDomain(ownRaw) === getRootDomain(collectedRaw)
}

const daysBetween = (date) => {
  const start = new Date(date)
  const end = new Date('2026-06-04')
  if (Number.isNaN(start.getTime())) return '-'
  return Math.max(0, Math.ceil((end - start) / (24 * 60 * 60 * 1000)))
}

const sourceEffectSuggestion = (source) => {
  const type = source.type || ''
  if (type.includes('官网')) return '补充 FAQ、产品参数、适用场景、品牌背书和竞品对比内容，并提升页面可抓取性。'
  if (type.includes('白皮书')) return '将白皮书拆成多篇可搜索文章，并分发到第三方媒体、知乎和行业平台。'
  if (type.includes('知乎')) return '改成问题型标题，补充真实场景、对比信息和品牌差异化答案。'
  if (type.includes('小红书') || type.includes('社媒')) return '增加体验、测评、避坑、对比类内容，并围绕监控问题设置标题和正文关键词。'
  return '围绕目标问题补充结构化内容、外部分发和引用链路建设。'
}

const questionEffectSuggestion = (question) => {
  if (/评价|口碑|真实/i.test(question)) return '建议发布口碑、真实评价、用户反馈、测评体验类内容，并优先布局知乎、小红书和电商问答。'
  if (/哪个|推荐|排行|排名|品牌|怎么选/i.test(question)) return '建议发布榜单、选购指南、横向对比和第三方测评内容，争取进入推荐类答案信源。'
  if (/安全|质量|功效|效果|配置|适合/i.test(question)) return '建议发布质量说明、检测报告、技术白皮书、专家背书和适用场景内容。'
  if (/售后|质保|渠道/i.test(question)) return '建议补充售后政策、质保条款、官方渠道和服务保障说明。'
  return '建议围绕该问题新增专题文章、FAQ 页面、第三方媒体稿和社媒内容投放。'
}

const allQuestionOptions = computed(() => {
  const set = new Set()
  mySourceList.value.forEach(item => (item.relatedQuestions || []).forEach(question => set.add(question)))
  filteredEffectCollectedSources.value.forEach(item => (item.questions || []).forEach(question => set.add(question)))
  return Array.from(set).filter(Boolean)
})

const activeQuestionOptions = computed(() => questionFilter.value.length ? questionFilter.value : allQuestionOptions.value)

const ownSourceEffectRows = computed(() => {
  return mySourceList.value.map(source => {
    const hits = filteredEffectCollectedSources.value.filter(collected => isSameSource(source, collected))
    const hitCount = hits.reduce((sum, item) => sum + Number(item.rangeCount || 0), 0)
    return {
      ...source,
      hitCount,
      citationStatus: hitCount > 0 ? '已引用' : '未引用',
      unquotedDays: hitCount > 0 ? 0 : daysBetween(source.publishTime),
      reason: hitCount > 0 ? '已进入 AI 答案引用链路' : (source.weight === 'A级' ? '重点信源未被引用，疑似收录或分发不足' : '内容未进入当前监测问题的引用链路'),
      suggestion: hitCount > 0 ? '持续观察引用次数、模型覆盖和情感变化。' : sourceEffectSuggestion(source)
    }
  })
})

const usedOwnSources = computed(() => ownSourceEffectRows.value.filter(item => item.hitCount > 0))
const unusedOwnSources = computed(() => ownSourceEffectRows.value.filter(item => item.hitCount === 0))
const filteredSourceEffectRows = computed(() => {
  if (sourceCitationFilter.value === 'quoted') return usedOwnSources.value
  if (sourceCitationFilter.value === 'unquoted') return unusedOwnSources.value
  return ownSourceEffectRows.value
})

const questionSourceCoverage = computed(() => {
  return activeQuestionOptions.value.map(question => {
    const questionSources = filteredEffectCollectedSources.value.filter(source => (source.questions || []).includes(question))
    const ownHits = questionSources.filter(collected => mySourceList.value.some(own => isSameSource(own, collected)))
    const models = Array.from(new Set(questionSources.flatMap(item => item.models || [])))
    const externalDomains = Array.from(new Set(questionSources.map(item => item.domain || parseSourceDomain(item.url)).filter(Boolean)))
    const ownSourceQuoteCount = ownHits.reduce((sum, item) => sum + Number(item.rangeCount || 0), 0)
    return {
      question,
      totalSourceCount: questionSources.length,
      ownSourceCount: ownHits.length,
      ownSourceQuoteCount,
      models,
      externalDomains,
      status: ownHits.length > 0 ? '已引用发布信源' : '未引用发布信源',
      suggestion: ownHits.length > 0 ? '该问题已有发布信源参与，可继续提升引用次数和模型覆盖。' : questionEffectSuggestion(question)
    }
  })
})

const noOwnSourceQuestions = computed(() => questionSourceCoverage.value.filter(item => item.ownSourceCount === 0))
const filteredQuestionCoverageRows = computed(() => {
  if (questionCitationFilter.value === 'quoted') return questionSourceCoverage.value.filter(item => item.ownSourceCount > 0)
  if (questionCitationFilter.value === 'unquoted') return noOwnSourceQuestions.value
  return questionSourceCoverage.value
})

const sourceEffectStats = computed(() => {
  const allQuoteCount = filteredEffectCollectedSources.value.reduce((sum, item) => sum + Number(item.rangeCount || 0), 0)
  const ownQuoteCount = usedOwnSources.value.reduce((sum, item) => sum + Number(item.hitCount || 0), 0)
  return {
    ownSourceTotal: mySourceList.value.length,
    unusedSourceCount: unusedOwnSources.value.length,
    unusedSourceText: `${unusedOwnSources.value.length}/${mySourceList.value.length}`,
    noOwnSourceQuestionCount: noOwnSourceQuestions.value.length,
    noOwnSourceQuestionTotal: questionSourceCoverage.value.length,
    noOwnSourceQuestionText: `${noOwnSourceQuestions.value.length}/${questionSourceCoverage.value.length}`,
    ownedQuoteText: `${ownQuoteCount}/${allQuoteCount}`
  }
})

const sourceEffectConclusions = computed(() => {
  const result = []
  result.push(`当前发布信源共 ${mySourceList.value.length} 条，未被引用 ${unusedOwnSources.value.length} 条，发布信源引用/全网引用为 ${sourceEffectStats.value.ownedQuoteText}。`)
  if (unusedOwnSources.value.length > 0) result.push(`当前有 ${unusedOwnSources.value.length} 条发布信源未被任何大模型回答引用，建议优先优化 A级信源和重点问题相关内容。`)
  if (noOwnSourceQuestions.value.length > 0) result.push(`当前有 ${noOwnSourceQuestions.value.length} 个监控问题没有引用任何发布信源，建议围绕这些问题加强文章投放和外部平台分发。`)
  if (!unusedOwnSources.value.length && !noOwnSourceQuestions.value.length) result.push('当前发布信源引用效果较健康，可继续观察模型覆盖和引用次数变化。')
  return result
})


const getEffectDateList = () => {
  const days = filterForm.timeRange === '30d' ? 30 : 7
  const end = new Date('2026-06-04')
  return Array.from({ length: days }).map((_, index) => {
    const date = new Date(end)
    date.setDate(end.getDate() - (days - 1 - index))
    const yyyy = date.getFullYear()
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const dd = String(date.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  })
}

const formatTrendDateLabel = (date) => {
  const [, month, day] = String(date).split('-')
  return `${Number(month)}/${Number(day)}`
}

const getWaveTrendCount = (total, current, dateIndex, totalDays, salt = 0) => {
  if (total <= 1 || totalDays <= 1) return Math.max(0, Math.min(total, current))
  if (dateIndex === totalDays - 1) return Math.max(0, Math.min(total, current))
  const amplitude = Math.max(1, Math.ceil(total * 0.18))
  const wave = Math.round(Math.sin((dateIndex + 1 + salt) * 1.35) * amplitude)
  const stagger = ((dateIndex + salt) % 3) - 1
  return Math.max(0, Math.min(total, current + wave + stagger))
}

const ownSourceQuoteTrendData = computed(() => {
  const dates = getEffectDateList()
  const sourceTotal = mySourceList.value.length
  const currentQuotedSourceCount = usedOwnSources.value.length
  return dates.map((date, dateIndex) => {
    const quotedSourceCount = getWaveTrendCount(sourceTotal, currentQuotedSourceCount, dateIndex, dates.length, 1)
    return {
      date,
      label: formatTrendDateLabel(date),
      quotedSourceCount,
      unquotedSourceCount: Math.max(0, sourceTotal - quotedSourceCount)
    }
  })
})

const ownSourceQuestionTrendData = computed(() => {
  const dates = getEffectDateList()
  const questionTotal = questionSourceCoverage.value.length
  const currentQuotedQuestionCount = questionTotal - noOwnSourceQuestions.value.length
  return dates.map((date, dateIndex) => {
    const quotedQuestionCount = getWaveTrendCount(questionTotal, currentQuotedQuestionCount, dateIndex, dates.length, 3)
    return {
      date,
      label: formatTrendDateLabel(date),
      unquotedQuestionCount: Math.max(0, questionTotal - quotedQuestionCount),
      quotedQuestionCount
    }
  })
})

const weightTagType = (weight) => {
  if (weight === 'A级') return 'warning'
  if (weight === 'B级') return 'primary'
  return 'info'
}

const oneClickOptimizeQuestion = (row) => {
  ElMessage.success(`已生成「${row.question}」的信源优化任务草稿`)
}

const goToSourceManagement = (row) => {
  router.push({
    name: 'ConfigSource',
    params: { id: route.params.id },
    query: {
      sourceTitle: row.name,
      sourceUrl: row.url || row.domain || ''
    }
  })
}

let donutChartInst = null
let ownSourceQuoteTrendChartInst = null
let ownSourceQuestionTrendChartInst = null

const handleResize = () => {
  donutChartInst?.resize()
  ownSourceQuoteTrendChartInst?.resize()
  ownSourceQuestionTrendChartInst?.resize()
}

const buildLineChartOption = ({ data, series, yAxisName }) => ({
  tooltip: { trigger: 'axis' },
  legend: {
    top: 6,
    right: 16,
    icon: 'circle',
    itemWidth: 8,
    itemHeight: 8,
    textStyle: { fontSize: 12, color: '#64748b' }
  },
  grid: { left: 42, right: 20, top: 48, bottom: 32 },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: data.map(item => item.label),
    axisLine: { lineStyle: { color: '#e5e7eb' } },
    axisTick: { show: false },
    axisLabel: { color: '#64748b', fontSize: 11 }
  },
  yAxis: {
    type: 'value',
    name: yAxisName,
    minInterval: 1,
    nameTextStyle: { color: '#64748b', fontSize: 11, padding: [0, 0, 0, 6] },
    splitLine: { lineStyle: { color: '#eef2f7' } },
    axisLabel: { color: '#64748b', fontSize: 11 }
  },
  series: series.map((item) => ({
    name: item.name,
    type: 'line',
    smooth: true,
    symbol: 'circle',
    symbolSize: 7,
    data: data.map(row => row[item.valueKey]),
    label: { show: true, position: 'top', color: '#1f2937', fontSize: 11 },
    lineStyle: { width: 3, color: item.color },
    itemStyle: { color: item.color },
    emphasis: { focus: 'series' }
  }))
})

const initTrendCharts = () => {
  if (ownSourceQuoteTrendChartRef.value) {
    ownSourceQuoteTrendChartInst?.dispose()
    ownSourceQuoteTrendChartInst = echarts.init(ownSourceQuoteTrendChartRef.value)
    ownSourceQuoteTrendChartInst.setOption(buildLineChartOption({
      data: ownSourceQuoteTrendData.value,
      yAxisName: '信源数',
      series: [
        { name: '引用的信源趋势', valueKey: 'quotedSourceCount', color: '#2563eb' },
        { name: '未引用的信源趋势', valueKey: 'unquotedSourceCount', color: '#f59e0b' }
      ]
    }))
  }

  if (ownSourceQuestionTrendChartRef.value) {
    ownSourceQuestionTrendChartInst?.dispose()
    ownSourceQuestionTrendChartInst = echarts.init(ownSourceQuestionTrendChartRef.value)
    ownSourceQuestionTrendChartInst.setOption(buildLineChartOption({
      data: ownSourceQuestionTrendData.value,
      yAxisName: '问题数',
      series: [
        { name: '没有引用发布信源的问题数', valueKey: 'unquotedQuestionCount', color: '#ef4444' },
        { name: '引用发布的信源的问题数', valueKey: 'quotedQuestionCount', color: '#10b981' }
      ]
    }))
  }
}

const initCharts = () => {
  if (donutChartRef.value) {
    donutChartInst?.dispose()
    donutChartInst = echarts.init(donutChartRef.value)
    donutChartInst.setOption({
      tooltip: { trigger: 'item' },
      legend: { bottom: '0%', left: 'center', icon: 'circle', itemWidth: 8, itemHeight: 8, textStyle: { fontSize: 11, color: '#64748b' } },
      color: ['#3b82f6', '#10b981', '#06b6d4', '#8b5cf6', '#94a3b8', '#f59e0b', '#f43f5e'],
      series: [
        {
          name: '来源类型',
          type: 'pie',
          radius: ['55%', '70%'],
          center: ['50%', '42%'],
          avoidLabelOverlap: false,
          label: {
            show: true,
            position: 'center',
            formatter: () => '{v|473}\n{t|引用数}',
            rich: { v: { fontSize: 28, fontWeight: 'bold', color: '#111827', padding: [0,0,4,0] }, t: { fontSize: 12, color: '#64748b' } }
          },
          labelLine: { show: false },
          data: [
            { value: 140, name: '新闻媒体' }, { value: 100, name: '消费评测社区' },
            { value: 80, name: '垂直资讯网站' }, { value: 60, name: '医疗健康平台' },
            { value: 45, name: '未提供' }, { value: 30, name: '地方新闻门户' }, { value: 18, name: '其他' }
          ]
        }
      ]
    })
  }
  if (sourcePageTab.value === 'effect') {
    nextTick(() => initTrendCharts())
  }
}

onMounted(() => {
  initCharts()
  window.addEventListener('resize', handleResize)
})

watch(sourceTab, async (tab) => {
  if (tab === 'domain' && !domainAggregate.value) {
    await nextTick()
    initCharts()
  } else {
    donutChartInst?.dispose()
    donutChartInst = null
  }
})

watch(domainAggregate, async (isAggregate) => {
  if (sourceTab.value === 'domain' && !isAggregate) {
    await nextTick()
    initCharts()
  } else {
    donutChartInst?.dispose()
    donutChartInst = null
  }
})

watch(sourcePageTab, async (tab) => {
  if (tab === 'effect') {
    await nextTick()
    initTrendCharts()
  }
})

watch([ownSourceQuoteTrendData, ownSourceQuestionTrendData], async () => {
  if (sourcePageTab.value === 'effect') {
    await nextTick()
    initTrendCharts()
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  donutChartInst?.dispose()
  ownSourceQuoteTrendChartInst?.dispose()
  ownSourceQuestionTrendChartInst?.dispose()
})
</script>

<style scoped>
.sources-container { padding: 16px 24px 40px; background-color: #f4f6f9; min-height: 100vh; }

/* 顶部筛选条 */
.filter-toolbar { display: flex; justify-content: space-between; align-items: center; background: #fff; padding: 16px 20px; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 20px; }
.left-actions { display: flex; align-items: center; }
.ml-16 { margin-left: 16px; }

/* KPI 卡片 */
.kpi-card { text-align: center; padding: 12px 0; border-radius: 8px; border: 1px solid #e5e7eb; }
.kpi-title { font-size: 13px; color: #64748b; margin-bottom: 8px; }
.kpi-value { font-size: 28px; font-weight: 800; color: #111827; font-family: -apple-system, BlinkMacSystemFont, sans-serif; }

/* 通用区段 */
.section-card { border-radius: 8px; border: 1px solid #e5e7eb; }
.section-title { font-size: 16px; font-weight: bold; color: #1e293b; display: flex; align-items: center; gap: 8px; }
.mb-20 { margin-bottom: 20px; }
.mb-16 { margin-bottom: 16px; }
.mt-24 { margin-top: 24px; }

.mb-12 { margin-bottom: 12px; }
.source-card :deep(.el-card__header) { padding: 12px 16px; border-bottom: 1px solid #e5e7eb; }
.source-card :deep(.el-card__body) { padding: 12px 16px 16px; }
.source-switch-row { display: flex; align-items: center; }
.source-control-row,
.media-filter-row { display: flex; align-items: center; justify-content: space-between; }
.source-control-left,
.media-filter-left { display: flex; align-items: center; gap: 10px; }
.media-source-panel { width: 100%; }
.aggregate-label { font-size: 12px; color: #64748b; }
.media-link-cell,
.domain-tree-cell { display: flex; align-items: center; min-width: 0; }
.domain-tree-cell.is-child,
.media-link-cell.is-child { padding-left: 10px; }
.tree-guide { color: #64748b; font-size: 13px; margin-right: 8px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
.media-dot { width: 14px; height: 14px; border-radius: 50%; background: #e2e8f0; margin-right: 10px; flex: 0 0 auto; }
.media-link-text,
.domain-tree-text { min-width: 0; line-height: 1.25; }
.media-title,
.domain-tree-title { color: #1e293b; font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.media-url { color: #64748b; font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px; }
.source-card :deep(.domain-parent-row) { background: #f7f7f8; }
.source-card :deep(.domain-child-row) { background: #fff; }
.source-card :deep(.domain-parent-row > td.el-table__cell) { background: #f7f7f8 !important; }
.source-card :deep(.domain-child-row > td.el-table__cell) { background: #fff !important; }
.source-card :deep(.domain-parent-row .domain-tree-title) { font-weight: 600; }
.source-card :deep(.domain-child-row .domain-tree-title) { font-weight: 400; }
.source-card :deep(.domain-parent-row .media-url) { display: none; }
.source-card :deep(.el-table--small .el-table__cell) { padding: 7px 0; }


/* 域名聚合表：强制覆盖 Element Plus 单元格背景，确保开关打开后视觉有变化 */
.source-card :deep(.domain-aggregate-table .domain-parent-row),
.source-card :deep(.domain-aggregate-table .domain-parent-row > td),
.source-card :deep(.domain-aggregate-table .domain-parent-cell),
.source-card :deep(.domain-aggregate-table .domain-parent-cell.el-table__cell),
.source-card :deep(.domain-aggregate-table .domain-parent-cell .cell) { background-color: #f6f7f9 !important; }
.source-card :deep(.domain-aggregate-table .domain-child-row),
.source-card :deep(.domain-aggregate-table .domain-child-row > td),
.source-card :deep(.domain-aggregate-table .domain-child-cell),
.source-card :deep(.domain-aggregate-table .domain-child-cell.el-table__cell),
.source-card :deep(.domain-aggregate-table .domain-child-cell .cell) { background-color: #fff !important; }
.source-card :deep(.domain-aggregate-table .domain-parent-row .domain-tree-title) { font-weight: 700; color: #111827; }
.source-card :deep(.domain-aggregate-table .domain-child-row .domain-tree-title) { font-weight: 400; color: #334155; }
.source-card :deep(.domain-aggregate-table .domain-child-row .cell) { color: #334155; }
.source-card :deep(.domain-aggregate-table .domain-parent-row .media-url) { display: none; }
.source-card :deep(.domain-aggregate-table .domain-child-row .tree-guide) { display: inline-block; width: 16px; text-align: right; }

/* 媒体聚合表：开启“按媒体聚合”后，展示媒体父级 + 链接子级 */
.source-card :deep(.media-aggregate-table .media-parent-row),
.source-card :deep(.media-aggregate-table .media-parent-row > td),
.source-card :deep(.media-aggregate-table .media-parent-cell),
.source-card :deep(.media-aggregate-table .media-parent-cell.el-table__cell),
.source-card :deep(.media-aggregate-table .media-parent-cell .cell) { background-color: #f6f7f9 !important; }
.source-card :deep(.media-aggregate-table .media-child-row),
.source-card :deep(.media-aggregate-table .media-child-row > td),
.source-card :deep(.media-aggregate-table .media-child-cell),
.source-card :deep(.media-aggregate-table .media-child-cell.el-table__cell),
.source-card :deep(.media-aggregate-table .media-child-cell .cell) { background-color: #fff !important; }
.source-card :deep(.media-aggregate-table .media-parent-row .media-title) { font-weight: 700; color: #111827; }
.source-card :deep(.media-aggregate-table .media-child-row .media-title) { font-weight: 400; color: #334155; }
.source-card :deep(.media-aggregate-table .media-child-row .cell) { color: #334155; }
.source-card :deep(.media-aggregate-table .media-parent-row .media-url) { display: none; }
.source-card :deep(.media-aggregate-table .media-child-row .tree-guide) { display: inline-block; width: 16px; text-align: right; }

/* 表格与图表 */
.table-toolbar { display: flex; justify-content: space-between; align-items: center; }
.tb-actions { display: flex; align-items: center; }
.text-muted { color: #94a3b8; }
.domain-text { color: #1e293b; font-family: monospace; }
.rounded-tag { border-radius: 12px; }
.chart-wrapper { background: #f8fafc; border-radius: 8px; padding: 16px; height: 100%; border: 1px solid #f1f5f9; }
.chart-title { margin: 0 0 16px 0; font-size: 14px; color: #334155; text-align: center; }

/* TOP 10 卡片 */
.top10-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
.t-header { padding: 12px 14px; color: #fff; font-size: 14px; font-weight: bold; display: flex; align-items: center; gap: 6px; }
.t-count { font-weight: normal; font-size: 12px; opacity: 0.9; margin-left: auto; }
.bg-blue { background: linear-gradient(135deg, #3b82f6, #2563eb); }
.bg-blue-light { background: linear-gradient(135deg, #60a5fa, #3b82f6); }
.bg-indigo { background: linear-gradient(135deg, #6366f1, #4f46e5); }
.t-list { padding: 8px 14px 10px; height: auto; min-height: 0; overflow: visible; }
.t-item { display: flex; align-items: center; padding: 7px 0; border-bottom: 1px dashed #f1f5f9; font-size: 12px; }
.t-item:last-child { border-bottom: none; }
.t-rank { width: 24px; color: #94a3b8; font-weight: bold; }
.t-source { flex: 1; min-width: 0; padding-right: 8px; }
.t-source-title { color: #334155; line-height: 1.25; }
.t-source-url { color: #94a3b8; font-size: 11px; margin-top: 2px; line-height: 1.2; }
.text-truncate { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.t-val { font-weight: bold; color: #1e293b; display: flex; align-items: center; gap: 4px; flex: 0 0 auto; }
.t-count-num { min-width: 18px; text-align: right; }
.t-count-label { color: #94a3b8; font-weight: 400; font-size: 11px; }
.t-grade { font-size: 11px; min-width: 18px; height: 18px; line-height: 18px; border-radius: 9px; text-align: center; background: #f1f5f9; display: inline-block; }
.g-S, .g-A { color: #f59e0b; }
.g-B { color: #10b981; }
.g-C { color: #94a3b8; }

/* 等级分布颜色 */
.grade-text-S { color: #ef4444; }
.grade-text-A { color: #f59e0b; }
.grade-text-B { color: #10b981; }
.grade-text-C { color: #64748b; }

.source-page-tabs { background: transparent; }
.source-page-tabs :deep(.el-tabs__header) { margin: 0 0 16px; background: #fff; border-radius: 8px; padding: 0 16px; border: 1px solid #e5e7eb; }
.source-page-tabs :deep(.el-tabs__nav-wrap::after) { display: none; }
.effect-kpi-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 4px 0; }
.effect-kpi-title { font-size: 13px; color: #64748b; margin-bottom: 8px; }
.effect-kpi-value { font-size: 28px; font-weight: 800; color: #111827; line-height: 1.1; }
.effect-kpi-value.small { font-size: 24px; }
.effect-kpi-desc { margin-top: 6px; font-size: 12px; color: #94a3b8; }
.effect-kpi-card.warning-card .effect-kpi-value { color: #f59e0b; }
.effect-kpi-card.danger-card .effect-kpi-value { color: #ef4444; }
.effect-kpi-card.primary-card .effect-kpi-value { color: #2563eb; }
.effect-desc { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 16px; color: #64748b; font-size: 13px; }
.effect-conclusion-list { margin: 0; padding-left: 20px; color: #334155; font-size: 13px; line-height: 1.9; }
.effect-trend-row { align-items: stretch; }
.trend-card { height: 100%; }
.trend-card :deep(.el-card__header) { padding: 12px 16px; border-bottom: 1px solid #e5e7eb; }
.trend-card :deep(.el-card__body) { padding: 8px 12px 12px; }
.trend-chart { width: 100%; height: 260px; }
.source-effect-card { border-radius: 8px; border: 1px solid #e5e7eb; }
.source-effect-card :deep(.el-card__body) { padding: 12px 16px 16px; }
.effect-inner-tabs :deep(.el-tabs__header) { margin-bottom: 14px; }
.tab-count { display: inline-flex; align-items: center; justify-content: center; min-width: 18px; height: 18px; padding: 0 6px; margin-left: 4px; border-radius: 9px; font-size: 12px; font-weight: 700; background: #f1f5f9; color: #64748b; }
.tab-count.warning { background: #fff7ed; color: #f59e0b; }
.tab-count.danger { background: #fef2f2; color: #ef4444; }
.effect-alert { margin-bottom: 12px; }
.effect-source-name { font-weight: 600; color: #1e293b; }
.effect-source-url { margin-top: 3px; font-size: 12px; color: #94a3b8; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
.effect-tag-list { display: flex; flex-wrap: wrap; gap: 4px; }
.effect-tag-list.compact { gap: 4px; max-height: 52px; overflow: hidden; }
.effect-model-list { display: flex; flex-wrap: wrap; justify-content: center; gap: 4px; }
.source-effect-toolbar,
.no-own-question-toolbar { display: flex; justify-content: flex-start; align-items: center; gap: 12px; margin-bottom: 12px; }
.no-own-question-title { font-size: 14px; font-weight: 700; color: #1e293b; }
.question-filter-select { width: 360px; }

</style>
