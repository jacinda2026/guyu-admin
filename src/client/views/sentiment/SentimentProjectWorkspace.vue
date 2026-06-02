<template>
  <div class="sentiment-workspace">
    <div v-if="section === 'overview'" class="project-info-header">
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
        <el-button plain>立即执行</el-button>
      </div>
    </div>

    <div v-if="showGlobalFilter" class="filter-card">
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

      <div class="overview-section-title">
        <strong>风险语义概览</strong>
        <span>先看正负面表达的关键词分布，快速判断当前舆情语义方向。</span>
      </div>
      <el-row :gutter="16" class="word-cloud-row mb-16">
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

      <div class="overview-section-title">
        <strong>线索聚合</strong>
        <span>把新发布内容和长期被 AI 引用的历史信源分开看，便于判断是否预警或深钻。</span>
      </div>
      <el-card shadow="never" class="content-card clue-pool-card mb-16">
        <template #header>
          <div class="card-head">
            <div>
              <span>舆情线索池</span>
              <small>区分新发信源线索和长期影响 AI 认知的线索</small>
            </div>
            <button class="view-link">查看全部 →</button>
          </div>
        </template>
        <div class="clue-summary">
          <div v-for="item in currentCluePoolCards" :key="item.label" class="clue-summary-item">
            <span>{{ item.label }}</span>
            <strong :class="item.type">{{ item.value }}</strong>
            <p>{{ item.desc }}</p>
          </div>
        </div>
        <el-tabs v-model="cluePoolActiveTab" class="clue-tabs">
          <el-tab-pane label="新发信源线索" name="new">
            <el-table :data="opinionClueRows" stripe size="small" :header-cell-style="headerCellStyle">
              <el-table-column prop="clue" label="舆情线索" min-width="150" show-overflow-tooltip>
                <template #default="{ row }">
                  <strong class="clue-title">{{ row.clue }}</strong>
                </template>
              </el-table-column>
              <el-table-column prop="relatedContent" label="关联内容" min-width="260" show-overflow-tooltip />
              <el-table-column prop="platforms" label="关联平台" min-width="180">
                <template #default="{ row }">
                  <div class="keyword-tags">
                    <el-tag v-for="platform in row.platforms" :key="platform" size="small" effect="plain">{{ platform }}</el-tag>
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="sourceCount" label="信源数量" width="90" align="center" sortable>
                <template #default="{ row }">
                  <el-button link type="primary" size="small" @click="goClueSources(row)">{{ row.sourceCount }}</el-button>
                </template>
              </el-table-column>
              <el-table-column prop="negativeVolume" label="负面声量" width="100" align="center" sortable />
              <el-table-column prop="riskLevel" label="风险等级" width="100" align="center">
                <template #default="{ row }">
                  <el-tag :type="row.riskLevel === '高' ? 'danger' : row.riskLevel === '中' ? 'warning' : 'info'" effect="plain">
                    {{ row.riskLevel }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="deepDive" label="是否深钻" width="110" align="center">
                <template #default="{ row }">
                  <el-button v-if="row.deepDive" link type="primary" size="small">建议深钻</el-button>
                  <span v-else class="muted-text">暂不深钻</span>
                </template>
              </el-table-column>
              <el-table-column prop="alert" label="预警建议" width="100" align="center">
                <template #default="{ row }">
                  <el-tag :type="row.alert ? 'danger' : 'info'" size="small" effect="plain">{{ row.alert ? '建议预警' : '观察' }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="90" align="center" fixed="right">
                <template #default="{ row }">
                  <el-button link type="primary" size="small" @click="openClueDetail(row, 'new')">详情</el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>
          <el-tab-pane label="AI舆情线索" name="ai">
            <el-table :data="aiOpinionClueRows" stripe size="small" :header-cell-style="headerCellStyle">
              <el-table-column prop="clue" label="AI线索名称" min-width="160" show-overflow-tooltip>
                <template #default="{ row }">
                  <strong class="clue-title">{{ row.clue }}</strong>
                </template>
              </el-table-column>
              <el-table-column prop="relatedQuestion" label="关联问题" min-width="230" show-overflow-tooltip />
              <el-table-column prop="quoteCount" label="被引用次数" width="100" align="center" sortable>
                <template #default="{ row }">
                  <el-button link type="primary" size="small" @click="goClueSources(row)">{{ row.quoteCount }}</el-button>
                </template>
              </el-table-column>
              <el-table-column prop="modelCount" label="影响模型数" width="100" align="center" sortable />
              <el-table-column prop="historySourceCount" label="信源数量" width="100" align="center" sortable>
                <template #default="{ row }">
                  <el-button link type="primary" size="small" @click="goClueSources(row)">{{ row.historySourceCount }}</el-button>
                </template>
              </el-table-column>
              <el-table-column prop="lastQuotedAt" label="最近引用时间" width="150" />
              <el-table-column prop="negativeTags" label="负面认知标签" min-width="190">
                <template #default="{ row }">
                  <div class="keyword-tags">
                    <el-tag v-for="tag in row.negativeTags" :key="tag" size="small" type="danger" effect="plain">{{ tag }}</el-tag>
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="governanceAdvice" label="治理建议" min-width="240" show-overflow-tooltip />
              <el-table-column label="操作" width="90" align="center" fixed="right">
                <template #default="{ row }">
                  <el-button link type="primary" size="small" @click="openClueDetail(row, 'ai')">详情</el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>
        </el-tabs>
      </el-card>

      <div class="overview-section-title">
        <strong>风险信源监测</strong>
        <span>查看每天新增风险信源数量，以及当前最活跃的风险来源平台。</span>
      </div>
      <el-row :gutter="16" class="mb-16">
        <el-col :span="16">
          <el-card shadow="never" class="chart-card">
            <template #header>
              <div class="card-head">
                <span>风险信源趋势</span>
                <small>按天汇总检测到的风险信源数量</small>
              </div>
            </template>
            <div class="source-trend-chart">
              <div class="trend-plot">
                <svg viewBox="0 0 720 220" preserveAspectRatio="none" aria-hidden="true">
                  <line v-for="y in [30, 70, 110, 150, 190]" :key="y" x1="30" :y1="y" x2="700" :y2="y" class="grid-line" />
                  <polyline :points="sourceTrendPolyline" class="source-trend-line" />
                  <g v-for="point in sourceTrendSvgPoints" :key="point.day">
                    <rect :x="point.x - 14" :y="point.y" width="28" :height="190 - point.y" rx="4" class="source-trend-bar" />
                    <circle :cx="point.x" :cy="point.y" r="4" class="source-trend-dot" />
                    <text :x="point.x" :y="point.y - 10" text-anchor="middle" class="source-trend-label">{{ point.value }}</text>
                  </g>
                </svg>
              </div>
              <div class="axis-row"><span v-for="point in sourceTrendItems" :key="point.day">{{ point.day }}</span></div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card shadow="never" class="chart-card">
            <template #header>
              <div class="card-head">
                <span>当日风险信源 TOP10</span>
                <button class="view-link" @click="goSourceStats()">查看全部 →</button>
              </div>
            </template>
            <div class="source-top-list">
              <button v-for="(item, index) in currentDayRiskSourceTop" :key="item.name" type="button" class="source-top-item" @click="goSourceStats(item.name)">
                <span class="rank-no">{{ index + 1 }}</span>
                <span class="source-top-name">{{ item.name }}</span>
                <strong>{{ item.count }}</strong>
              </button>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <div class="overview-section-title">
        <strong>维度分析</strong>
        <span>按风险维度汇总问题分布，并给出本期处置重点。</span>
      </div>
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

    </template>

    <template v-else-if="section === 'clues'">
      <div class="real-time-header">
        <div>
          <h2>舆情线索</h2>
          <p>系统自动聚合新发信源线索与长期影响 AI 认知的舆情线索，辅助判断深钻和预警优先级</p>
        </div>
        <el-button plain @click="cluePoolActiveTab = 'new'">查看新发线索</el-button>
      </div>

      <div class="clue-filter-card">
        <el-select v-model="clueFilterModel" size="small" style="width: 160px">
          <el-option label="全部模型" value="all" />
          <el-option label="DeepSeek" value="DeepSeek" />
          <el-option label="豆包" value="豆包" />
          <el-option label="Kimi" value="Kimi" />
          <el-option label="通义千问" value="通义千问" />
          <el-option label="文心一言" value="文心一言" />
        </el-select>
        <el-radio-group v-model="clueFilterRange" size="small">
          <el-radio-button label="24h">最近24小时</el-radio-button>
          <el-radio-button label="7d">最近7天</el-radio-button>
          <el-radio-button label="30d">最近30天</el-radio-button>
          <el-radio-button label="custom">自定义时间段</el-radio-button>
        </el-radio-group>
        <el-select v-model="clueFilterRisk" size="small" placeholder="全部风险" clearable style="width: 130px">
          <el-option label="高风险" value="高" />
          <el-option label="中风险" value="中" />
          <el-option label="低风险" value="低" />
        </el-select>
        <span class="clue-filter-note">模型筛选主要影响 AI 舆情线索，时间和风险筛选影响全部线索。</span>
      </div>

      <el-card shadow="never" class="content-card clue-pool-card mb-16">
        <template #header>
          <div class="card-head">
            <div class="card-title-stack">
              <span>线索总览</span>
              <small>{{ cluePoolActiveTab === 'ai' ? '长期影响模型回答的历史认知线索' : '最近新增内容聚合出的风险线索' }}</small>
            </div>
          </div>
        </template>
        <div class="clue-summary">
          <div v-for="item in currentCluePoolCards" :key="item.label" class="clue-summary-item">
            <span>{{ item.label }}</span>
            <strong :class="item.type">{{ item.value }}</strong>
            <p>{{ item.desc }}</p>
          </div>
        </div>
        <el-tabs v-model="cluePoolActiveTab" class="clue-tabs">
          <el-tab-pane label="新发信源线索" name="new">
            <el-table :data="filteredOpinionClueRows" stripe size="small" :header-cell-style="headerCellStyle">
              <el-table-column prop="clue" label="舆情线索" min-width="150" show-overflow-tooltip>
                <template #default="{ row }">
                  <strong class="clue-title">{{ row.clue }}</strong>
                </template>
              </el-table-column>
              <el-table-column prop="relatedContent" label="关联内容" min-width="280" show-overflow-tooltip />
              <el-table-column prop="platforms" label="关联平台" min-width="180">
                <template #default="{ row }">
                  <div class="keyword-tags">
                    <el-tag v-for="platform in row.platforms" :key="platform" size="small" effect="plain">{{ platform }}</el-tag>
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="sourceCount" label="信源数量" width="90" align="center" sortable>
                <template #default="{ row }">
                  <el-button link type="primary" size="small" @click="goClueSources(row)">{{ row.sourceCount }}</el-button>
                </template>
              </el-table-column>
              <el-table-column prop="negativeVolume" label="负面声量" width="100" align="center" sortable />
              <el-table-column prop="riskLevel" label="风险等级" width="100" align="center">
                <template #default="{ row }">
                  <el-tag :type="row.riskLevel === '高' ? 'danger' : row.riskLevel === '中' ? 'warning' : 'info'" effect="plain">
                    {{ row.riskLevel }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="recentActiveAt" label="最近活跃时间" width="150" />
              <el-table-column label="操作" width="120" align="center" fixed="right">
                <template #default="{ row }">
                  <el-button link type="primary" size="small" @click="openClueDetail(row, 'new')">详情</el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>
          <el-tab-pane label="AI舆情线索" name="ai">
            <el-table :data="filteredAiOpinionClueRows" stripe size="small" :header-cell-style="headerCellStyle">
              <el-table-column prop="clue" label="AI线索名称" min-width="160" show-overflow-tooltip>
                <template #default="{ row }">
                  <strong class="clue-title">{{ row.clue }}</strong>
                </template>
              </el-table-column>
              <el-table-column prop="relatedQuestion" label="关联问题" min-width="230" show-overflow-tooltip />
              <el-table-column prop="quoteCount" label="被引用次数" width="100" align="center" sortable>
                <template #default="{ row }">
                  <el-button link type="primary" size="small" @click="goClueSources(row)">{{ row.quoteCount }}</el-button>
                </template>
              </el-table-column>
              <el-table-column prop="modelCount" label="影响模型数" width="100" align="center" sortable />
              <el-table-column prop="historySourceCount" label="信源数量" width="100" align="center" sortable>
                <template #default="{ row }">
                  <el-button link type="primary" size="small" @click="goClueSources(row)">{{ row.historySourceCount }}</el-button>
                </template>
              </el-table-column>
              <el-table-column prop="lastQuotedAt" label="最近引用时间" width="150" />
              <el-table-column prop="negativeTags" label="负面认知标签" min-width="190">
                <template #default="{ row }">
                  <div class="keyword-tags">
                    <el-tag v-for="tag in row.negativeTags" :key="tag" size="small" type="danger" effect="plain">{{ tag }}</el-tag>
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="governanceAdvice" label="治理建议" min-width="240" show-overflow-tooltip />
              <el-table-column label="操作" width="120" align="center" fixed="right">
                <template #default="{ row }">
                  <el-button link type="primary" size="small" @click="openClueDetail(row, 'ai')">详情</el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>
        </el-tabs>
      </el-card>
    </template>

    <template v-else-if="section === 'real-time'">
      <div class="real-time-header">
        <div>
          <h2>实时舆情追踪</h2>
          <p>实时监控大模型输出与全网信源的最新动态，分析扩散趋势</p>
        </div>
        <el-button plain @click="refreshRealTimeFeeds">刷新数据</el-button>
      </div>

      <el-row :gutter="16" class="real-time-layout">
        <el-col :span="16">
          <el-card shadow="never" class="content-card real-time-feed-card">
            <template #header>
              <div class="card-head">
                <span>舆情动态流</span>
                <el-radio-group v-model="realTimeRiskFilter" size="small">
                  <el-radio-button label="all">全部</el-radio-button>
                  <el-radio-button label="high">仅看高风险</el-radio-button>
                </el-radio-group>
              </div>
            </template>
            <div class="real-time-feed-list">
              <div
                v-for="item in filteredRealTimeFeeds"
                :key="item.id"
                class="real-time-feed-item"
                :class="`risk-${item.riskType}`"
              >
                <div class="feed-meta-row">
                  <div class="feed-meta-left">
                    <el-tag :type="item.riskType === 'high' ? 'danger' : item.riskType === 'medium' ? 'warning' : 'success'" effect="light">
                      {{ item.riskLabel }}
                    </el-tag>
                    <el-tag type="info" effect="plain">{{ item.sourceType }}</el-tag>
                    <span>{{ item.time }}</span>
                  </div>
                  <div class="feed-source">
                    <span>{{ item.source }}</span>
                    <b :class="item.trend === 'up' ? 'danger-text' : 'success-text'">{{ item.trend === 'up' ? '上升' : '下降' }}</b>
                  </div>
                </div>
                <h3>{{ item.title }}</h3>
                <p>{{ item.summary }}</p>
                <div class="feed-linked-row">
                  <span>关联线索</span>
                  <button type="button" @click="openRealtimeClue(item)">{{ item.clue }}</button>
                  <span>数据来源：{{ item.dataSource }}</span>
                </div>
                <div class="feed-actions">
                  <button type="button" @click="openRealtimeDetail(item)">查看详情</button>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :span="8">
          <el-card shadow="never" class="content-card real-time-side-card">
            <template #header>
              <div class="card-head">
                <span class="title-with-help">
                  今日舆情发酵趋势
                  <el-tooltip
                    content="按当天新增信源和模型巡检结果聚合。高风险包括高权重信源、风险关键词命中、被多模型引用或归属高风险线索的内容；中低风险包括中低风险信源、模型回答和正向澄清内容。"
                    placement="top"
                  >
                    <el-icon><QuestionFilled /></el-icon>
                  </el-tooltip>
                </span>
              </div>
            </template>
            <div class="real-time-trend-chart">
              <svg viewBox="0 0 360 220" preserveAspectRatio="none" aria-hidden="true">
                <line v-for="y in [34, 72, 110, 148, 186]" :key="y" x1="32" :y1="y" x2="342" :y2="y" class="grid-line" />
                <polyline :points="realTimeHighTrendPolyline" class="real-time-high-line" />
                <polyline :points="realTimeMediumTrendPolyline" class="real-time-medium-line" />
                <g v-for="point in realTimeHighTrendPoints" :key="`h-${point.time}`">
                  <circle :cx="point.x" :cy="point.y" r="4" class="real-time-high-dot" />
                </g>
                <g v-for="point in realTimeMediumTrendPoints" :key="`m-${point.time}`">
                  <circle :cx="point.x" :cy="point.y" r="4" class="real-time-medium-dot" />
                </g>
              </svg>
              <div class="real-time-legend">
                <span><i class="high"></i>高风险舆情新增量</span>
                <span><i class="medium"></i>中低风险舆情新增量</span>
              </div>
              <div class="axis-row"><span v-for="point in realTimeTrendItems" :key="point.time">{{ point.time }}</span></div>
            </div>
          </el-card>

          <el-card shadow="never" class="content-card real-time-side-card">
            <template #header>
              <div class="card-head">
                <div class="card-title-stack">
                  <span>典型高危舆情扩散路径</span>
                  <small>基于动态流中最高风险线索：{{ spreadPathClueName }}</small>
                </div>
              </div>
            </template>
            <div class="spread-path">
              <div v-for="item in spreadPathItems" :key="item.stage" class="spread-path-item" :class="item.type">
                <span class="path-dot"></span>
                <div>
                  <strong>{{ item.stage }}</strong>
                  <small>{{ item.time }}</small>
                  <p>{{ item.content }}</p>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </template>

    <template v-else-if="section === 'clue-detail'">
      <el-card shadow="never" class="content-card clue-detail-card mb-16">
        <template #header>
          <div class="card-head">
            <div class="card-title-stack">
              <span>{{ currentClueDetail.clue }}</span>
              <small>{{ currentClueDetail.type === 'ai' ? 'AI 舆情线索' : '新发信源线索' }}</small>
            </div>
            <el-tag :type="currentClueDetail.riskLevel === '高' ? 'danger' : currentClueDetail.riskLevel === '中' ? 'warning' : 'info'" effect="plain">
              {{ currentClueDetail.riskLevel }}
            </el-tag>
          </div>
        </template>
        <p class="clue-detail-desc">{{ currentClueDetail.relatedContent || currentClueDetail.governanceAdvice }}</p>
        <div class="severity-grid">
          <div v-for="item in clueSeverityCards" :key="item.label" class="severity-item">
            <span>{{ item.label }}</span>
            <strong :class="item.type">{{ item.value }}</strong>
            <p>{{ item.desc }}</p>
          </div>
        </div>
      </el-card>

      <el-row :gutter="16" class="mb-16">
        <el-col :span="12">
          <el-card shadow="never" class="content-card">
            <template #header><div class="card-head"><span>严重度排序依据</span></div></template>
            <el-table :data="clueSeverityRows" size="small" :show-header="false">
              <el-table-column prop="label" width="150">
                <template #default="{ row }"><strong class="severity-label">{{ row.label }}</strong></template>
              </el-table-column>
              <el-table-column prop="value" width="120" />
              <el-table-column prop="desc" />
            </el-table>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card shadow="never" class="content-card">
            <template #header><div class="card-head"><span>关联信息</span></div></template>
            <div class="clue-detail-section">
              <span>关联平台</span>
              <div class="keyword-tags">
                <el-tag v-for="platform in currentCluePlatforms" :key="platform" size="small" effect="plain">{{ platform }}</el-tag>
              </div>
            </div>
            <div class="clue-detail-section" v-if="currentClueDetail.negativeTags?.length">
              <span>负面认知标签</span>
              <div class="keyword-tags">
                <el-tag v-for="tag in currentClueDetail.negativeTags" :key="tag" size="small" type="danger" effect="plain">{{ tag }}</el-tag>
              </div>
            </div>
            <div class="clue-detail-section">
              <span>建议动作</span>
              <p>{{ currentClueDetail.governanceAdvice || (currentClueDetail.deepDive ? '建议进入专项深钻，并结合高权重信源证据判断是否预警。' : '持续观察信源变化，暂不进入专项深钻。') }}</p>
            </div>
            <el-button type="primary" plain size="small" @click="goClueSources(currentClueDetail)">查看对应信源</el-button>
          </el-card>
        </el-col>
      </el-row>
    </template>

    <template v-else-if="section === 'sources'">
      <el-row :gutter="16" class="mb-16">
        <el-col :span="6" v-for="item in sourceListCards" :key="item.label">
          <el-card shadow="never" class="metric-card">
            <div class="metric-label">{{ item.label }}</div>
            <div class="metric-value" :class="item.type">{{ item.value }}</div>
            <div class="metric-desc">{{ item.desc }}</div>
          </el-card>
        </el-col>
      </el-row>

      <el-card shadow="never" class="content-card source-list-card">
        <template #header>
          <div class="card-head">
            <div class="card-title-stack">
              <span>信源列表</span>
              <small v-if="sourceListClue">当前线索：{{ sourceListClue }}</small>
            </div>
            <div class="toolbar-actions">
              <el-input v-model="sourceListKeyword" size="small" placeholder="搜索平台、账号、内容" clearable style="width: 220px" />
              <el-select v-model="sourceListPlatform" size="small" placeholder="发布平台" clearable style="width: 140px">
                <el-option v-for="platform in sourceListPlatforms" :key="platform" :label="platform" :value="platform" />
              </el-select>
              <el-button v-if="sourceListClue || sourceListPlatform || sourceListKeyword" size="small" plain @click="clearSourceFilters">清除筛选</el-button>
            </div>
          </div>
        </template>
        <el-table :data="filteredSourceList" stripe size="small" :header-cell-style="headerCellStyle">
          <el-table-column prop="publishTime" label="发布时间" width="150" />
          <el-table-column prop="platform" label="发布平台" width="100" />
          <el-table-column prop="account" label="发布账号" width="130" show-overflow-tooltip />
          <el-table-column prop="quoteCount" label="引用次数" width="90" align="center" sortable />
          <el-table-column prop="articleTitle" label="文章名称" min-width="220" show-overflow-tooltip>
            <template #default="{ row }">
              <a class="source-link" :href="row.articleUrl" target="_blank" rel="noopener noreferrer">{{ row.articleTitle }}</a>
            </template>
          </el-table-column>
          <el-table-column prop="articleUrl" label="文章链接" min-width="220" show-overflow-tooltip>
            <template #default="{ row }">
              <a class="source-link source-url" :href="row.articleUrl" target="_blank" rel="noopener noreferrer">{{ row.articleUrl }}</a>
            </template>
          </el-table-column>
          <el-table-column prop="sentiment" label="情绪分析" width="100" align="center">
            <template #default="{ row }">
              <el-tag size="small" :type="row.sentiment === '负面' ? 'danger' : row.sentiment === '中性' ? 'info' : 'success'" effect="plain">{{ row.sentiment }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="topic" label="主题分类" width="120" />
          <el-table-column prop="negativeSummary" label="负面摘要" min-width="220" show-overflow-tooltip />
          <el-table-column label="风险关键词" min-width="180">
            <template #default="{ row }">
              <div class="keyword-tags">
                <el-tag v-for="word in row.keywords" :key="word" size="small" type="warning" effect="plain">{{ word }}</el-tag>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="relevance" label="相关性判断" width="110" align="center">
            <template #default="{ row }">
              <el-tag size="small" :type="row.relevance === '高度相关' ? 'danger' : row.relevance === '相关' ? 'warning' : 'info'" effect="plain">{{ row.relevance }}</el-tag>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </template>

    <template v-else-if="section === 'question-list'">
      <el-row :gutter="16" class="mb-16">
        <el-col :span="6" v-for="item in questionListCards" :key="item.label">
          <el-card shadow="never" class="metric-card">
            <div class="metric-label">{{ item.label }}</div>
            <div class="metric-value" :class="item.type">{{ item.value }}</div>
            <div class="metric-desc">{{ item.desc }}</div>
          </el-card>
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
            <template #header>引用信源最多的问题 TOP10</template>
            <div v-for="(item, index) in sourceTopQuestions" :key="item.question" class="top-list-item">
              <span class="rank-no">{{ index + 1 }}</span>
              <button type="button">{{ item.question }}</button>
              <strong>{{ item.count }}</strong>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <el-card shadow="never" class="content-card source-list-card">
        <template #header>
          <div class="card-head">
            <span>问题列表</span>
            <div class="toolbar-actions">
              <el-input v-model="questionListKeyword" size="small" placeholder="搜索问题、方向、模型" clearable style="width: 240px" />
              <el-select v-model="questionListCategory" size="small" placeholder="问题方向" clearable style="width: 140px">
                <el-option v-for="category in questionListCategories" :key="category" :label="category" :value="category" />
              </el-select>
              <el-select v-model="questionListRiskLevel" size="small" placeholder="风险等级" clearable style="width: 120px">
                <el-option label="高" value="高" />
                <el-option label="中" value="中" />
                <el-option label="低" value="低" />
              </el-select>
            </div>
          </div>
        </template>
        <el-table :data="filteredQuestionList" stripe size="small" :header-cell-style="headerCellStyle">
          <el-table-column prop="question" label="监控问题" min-width="260" show-overflow-tooltip />
          <el-table-column prop="category" label="问题方向" width="120" />
          <el-table-column prop="riskLevel" label="风险等级" width="90" align="center">
            <template #default="{ row }">
              <el-tag size="small" :type="row.riskLevel === '高' ? 'danger' : row.riskLevel === '中' ? 'warning' : 'info'" effect="plain">{{ row.riskLevel }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="models" label="监控模型" width="130" align="center" />
          <el-table-column prop="askCount" label="触发次数" width="100" align="right" sortable />
          <el-table-column prop="negativeRate" label="负面率" width="100" align="right" sortable>
            <template #default="{ row }">
              <span :class="row.negativeRate >= 70 ? 'danger-text' : row.negativeRate >= 50 ? 'warning-text' : ''">{{ row.negativeRate }}%</span>
            </template>
          </el-table-column>
          <el-table-column prop="sourceCount" label="引用信源" width="100" align="right" sortable />
          <el-table-column prop="lastRunAt" label="最近执行" width="150" />
          <el-table-column label="操作" width="90" align="center" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="openQuestionDetail(row)">详情</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </template>

    <template v-else-if="section === 'question-detail'">
      <el-row :gutter="14" class="mb-16">
        <el-col :span="6" v-for="item in currentQuestionDetailCards" :key="item.label">
          <div class="summary-card">
            <span>{{ item.label }}</span>
            <strong :class="item.type">{{ item.value }}</strong>
            <p>{{ item.desc }}</p>
          </div>
        </el-col>
      </el-row>
      <el-card shadow="never" class="content-card">
        <template #header>具体执行列表</template>
        <el-table :data="currentQuestionExecutions" stripe size="small" :header-cell-style="headerCellStyle">
          <el-table-column prop="question" label="问题" min-width="260" show-overflow-tooltip />
          <el-table-column prop="model" label="模型" width="130" />
          <el-table-column prop="createdAt" label="创建时间" width="160" />
          <el-table-column prop="negativeSummary" label="负面摘要" min-width="300" show-overflow-tooltip />
          <el-table-column label="详情" width="90" align="center" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="openQuestionExecutionDetail(row)">详情</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
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

    <template v-else-if="section === 'conversations'">
      <el-card shadow="never" class="content-card conversation-manage-card">
        <el-tabs v-model="conversationViewMode" class="conversation-tabs">
          <el-tab-pane label="最新对话" name="cards">
            <div class="conversation-card-filter">
              <el-input v-model="conversationKeyword" placeholder="搜索对话、模型、答案" clearable />
            </div>
            <div class="conversation-card-grid">
              <button
                v-for="item in filteredConversationRecords"
                :key="item.id"
                type="button"
                class="conversation-preview-card"
                @click="openConversationDetail(item)"
              >
                <div class="conversation-preview-title">
                  <span class="model-badge">{{ item.modelIcon }}</span>
                  <strong>{{ item.question }}</strong>
                </div>
                <p>{{ item.answerSummary }}</p>
                <div class="conversation-preview-meta">
                  <span>{{ item.model }}</span>
                  <span>{{ item.queryTimeText }}</span>
                </div>
              </button>
            </div>
          </el-tab-pane>
          <el-tab-pane label="表格浏览" name="table">
            <div class="conversation-table-filters">
              <el-select v-model="conversationQuestionFilter" placeholder="问题" clearable>
                <el-option v-for="question in conversationQuestions" :key="question" :label="question" :value="question" />
              </el-select>
              <el-select v-model="conversationModelFilter" placeholder="监控平台" clearable>
                <el-option v-for="model in conversationModels" :key="model" :label="model" :value="model" />
              </el-select>
              <el-button type="primary">筛选</el-button>
            </div>
            <el-table
              :data="filteredConversationRecords"
              size="small"
              class="conversation-result-table"
              :header-cell-style="headerCellStyle"
              @row-click="openConversationDetail"
            >
              <el-table-column prop="question" label="问题" min-width="230" />
              <el-table-column prop="model" label="监控平台" width="130" />
              <el-table-column label="答案 1" min-width="520">
                <template #default="{ row }">
                  <div class="table-answer-cell">{{ conversationAnswerText(row) }}</div>
                </template>
              </el-table-column>
              <el-table-column label="排名" width="300">
                <template #default="{ row }">
                  <div class="table-rank-cell">
                    <el-tag
                      size="small"
                      :type="row.monitorRank ? 'success' : 'danger'"
                      effect="light"
                      class="table-rank-status"
                    >
                      {{ row.monitorRank ? `监控词第${row.monitorRank}名` : '监控词未出现' }}
                    </el-tag>
                    <div class="rank-track">
                      <span class="rank-line"></span>
                      <span
                        v-for="brand in row.ranking.slice(0, 10)"
                        :key="`${row.id}-${brand.rank}`"
                        class="rank-dot"
                        :class="{ active: brand.rank === row.monitorRank }"
                      ></span>
                    </div>
                    <div class="rank-brand-list">
                      <span v-for="brand in row.ranking.slice(0, 6)" :key="brand.name">{{ brand.name }} #{{ brand.rank }}</span>
                    </div>
                  </div>
                </template>
              </el-table-column>
            <el-table-column label="日期" width="110">
                <template #default="{ row }">{{ row.queryTime.slice(0, 10) }}</template>
              </el-table-column>
            </el-table>
          </el-tab-pane>
        </el-tabs>
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
          <el-table-column label="操作" width="90" align="center" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="openQuestionDetail(row)">详情</el-button>
            </template>
          </el-table-column>
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

    <template v-else-if="section === 'config' && configPage === 'subject'">
      <div class="page-toolbar">
        <div>
          <h2>监控主体</h2>
          <p>配置舆情项目的品牌、产品、事件主体，以及别名、关联实体和风险维度。</p>
        </div>
        <el-button type="primary" @click="handleSubjectEditSave">{{ subjectEditing ? '保存' : '编辑' }}</el-button>
      </div>

      <el-card shadow="never" class="content-card">
        <el-form :model="subjectForm" label-width="104px" class="subject-form">
          <el-row :gutter="14">
            <el-col :span="12">
              <el-form-item label="主体名称" required>
                <el-input v-model="subjectForm.name" :disabled="!subjectEditing" placeholder="请输入品牌、产品或事件名称" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="主体类型" required>
                <el-select v-model="subjectForm.type" :disabled="!subjectEditing" style="width: 100%">
                  <el-option label="品牌舆情" value="brand" />
                  <el-option label="产品舆情" value="product" />
                  <el-option label="人物舆情" value="person" />
                  <el-option label="机构舆情" value="organization" />
                  <el-option label="事件专项" value="event" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="监控别名">
            <el-select
              v-model="subjectForm.aliases"
              :disabled="!subjectEditing"
              multiple
              filterable
              allow-create
              default-first-option
              style="width: 100%"
              placeholder="输入别名后回车，例如 奥迪E7X、Audi E7X"
            />
          </el-form-item>

          <el-form-item label="关联实体">
            <el-select
              v-model="subjectForm.entities"
              :disabled="!subjectEditing"
              multiple
              filterable
              allow-create
              default-first-option
              style="width: 100%"
              placeholder="输入关联品牌、车型、竞品或人物"
            />
          </el-form-item>

          <el-form-item label="监控范围">
            <el-checkbox-group v-model="subjectForm.scopes" :disabled="!subjectEditing" class="scope-grid">
              <el-checkbox label="AI回答">AI回答</el-checkbox>
              <el-checkbox label="新闻媒体">新闻媒体</el-checkbox>
              <el-checkbox label="问答平台">问答平台</el-checkbox>
              <el-checkbox label="论坛社区">论坛社区</el-checkbox>
              <el-checkbox label="短视频评论">短视频评论</el-checkbox>
              <el-checkbox label="电商评价">电商评价</el-checkbox>
            </el-checkbox-group>
          </el-form-item>

          <el-form-item label="风险维度">
            <el-checkbox-group v-model="subjectForm.riskDimensions" :disabled="!subjectEditing" class="scope-grid">
              <el-checkbox label="事件核查">事件核查</el-checkbox>
              <el-checkbox label="负面舆情">负面舆情</el-checkbox>
              <el-checkbox label="用户投诉">用户投诉</el-checkbox>
              <el-checkbox label="质量质疑">质量质疑</el-checkbox>
              <el-checkbox label="购买影响">购买影响</el-checkbox>
              <el-checkbox label="处置建议">处置建议</el-checkbox>
            </el-checkbox-group>
          </el-form-item>

          <el-form-item label="背景说明">
            <el-input
              v-model="subjectForm.background"
              :disabled="!subjectEditing"
              type="textarea"
              :rows="4"
              placeholder="补充主体背景、争议来源、关注重点和监控口径"
            />
          </el-form-item>
        </el-form>
      </el-card>
    </template>

    <template v-else-if="section === 'config' && configPage === 'issue'">
      <section class="issue-config-panel">
        <div class="issue-config-header">
          <div>
            <h2>舆情问题配置</h2>
            <p>配置需要持续监控的舆情问题方向，按风险标签分组管理。</p>
          </div>
          <el-button type="primary" @click="handleIssueEditSave">{{ issueEditing ? '保存' : '编辑' }}</el-button>
        </div>

        <div class="issue-config-layout">
          <aside class="issue-category-panel">
            <div class="issue-category-top">
              <el-input v-model="issueCategoryKeyword" placeholder="搜索标签" :prefix-icon="Search" clearable />
              <el-button v-if="issueEditing" type="primary" size="small" @click="issueTagDialogVisible = true">+ 标签</el-button>
            </div>
            <div class="issue-category-list">
              <button type="button" class="issue-category all" :class="{ selected: activeIssueCategory === '所有' }" @click="activeIssueCategory = '所有'">
                <span>所有</span>
                <strong>{{ issuePrompts.length }}</strong>
              </button>
              <button
                v-for="category in filteredIssueCategories"
                :key="category.name"
                type="button"
                class="issue-category"
                :class="{ selected: activeIssueCategory === category.name }"
                @click="activeIssueCategory = category.name"
              >
                <i :style="{ background: category.color }"></i>
                <span>{{ category.name }}</span>
                <strong>{{ category.count }}</strong>
              </button>
            </div>
          </aside>

          <main class="issue-table-panel">
            <div class="issue-toolbar">
              <el-input v-model="issueKeyword" class="issue-search" placeholder="搜索舆情问题" :prefix-icon="Search" clearable />
              <div class="issue-actions">
                <el-button size="small" class="ai-btn" @click="openIssueExpandTool">AI拓词</el-button>
                <template v-if="issueEditing">
                  <el-button size="small" @click="deleteSelectedIssues">删除</el-button>
                  <el-button size="small" type="danger" plain @click="issueUploadDialogVisible = true">上传问题</el-button>
                  <el-button size="small" type="primary" @click="openIssueDialog()">+ 添加问题</el-button>
                </template>
              </div>
            </div>

            <el-table
              :data="filteredIssuePrompts"
              class="issue-table"
              :header-cell-style="headerCellStyle"
              @selection-change="issueSelection = $event"
            >
              <el-table-column v-if="issueEditing" type="selection" width="34" />
              <el-table-column type="index" label="#" width="44" />
              <el-table-column prop="text" label="监控问题" min-width="280" show-overflow-tooltip />
              <el-table-column prop="category" label="风险标签" width="120">
                <template #default="{ row }">
                  <el-tag size="small" effect="plain">{{ row.category }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="riskLevel" label="风险等级" width="100" align="center">
                <template #default="{ row }">
                  <el-tag size="small" :type="row.riskLevel === '高' ? 'danger' : row.riskLevel === '中' ? 'warning' : 'info'" effect="plain">{{ row.riskLevel }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="状态" width="90" align="center">
                <template #default="{ row }">
                  <span class="issue-status" :class="row.status">{{ row.status === 'enabled' ? '启用' : '停用' }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="createdAt" label="创建时间" width="150" />
              <el-table-column v-if="issueEditing" label="操作" width="160" align="center">
                <template #default="{ row }">
                  <el-button link type="primary" @click="openIssueDialog(row)">编辑</el-button>
                  <el-button link type="primary" @click="toggleIssue(row)">{{ row.status === 'enabled' ? '停用' : '启用' }}</el-button>
                  <el-button link type="primary" @click="removeIssue(row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>

            <div class="issue-pagination">
              <span>共 {{ issuePrompts.length }} 条问题</span>
              <el-pagination background layout="prev, pager, next, sizes" :total="issuePrompts.length" :page-size="10" />
            </div>
          </main>
        </div>
      </section>
    </template>

    <template v-else-if="section === 'config' && configPage === 'risk'">
      <section class="risk-keyword-panel">
        <div class="issue-config-header">
          <div>
            <h2>风险词库配置</h2>
            <p>维护用于匹配和预警的风险关键词，不是检测结果。命中词库后用于标记重点风险和触发预警。</p>
          </div>
          <el-button type="primary" @click="handleRiskEditSave">{{ riskEditing ? '保存' : '编辑' }}</el-button>
        </div>

        <div class="risk-layout">
          <aside class="issue-category-panel">
            <div class="issue-category-top">
              <el-input v-model="riskCategoryKeyword" placeholder="搜索分类" :prefix-icon="Search" clearable />
              <el-button v-if="riskEditing" type="primary" size="small" @click="riskCategoryDialogVisible = true">+ 分类</el-button>
            </div>
            <div class="issue-category-list">
              <button type="button" class="issue-category all" :class="{ selected: activeRiskCategory === '全部' }" @click="activeRiskCategory = '全部'">
                <span>全部</span>
                <strong>{{ riskKeywords.length }}</strong>
              </button>
              <button
                v-for="category in filteredRiskCategories"
                :key="category.name"
                type="button"
                class="issue-category"
                :class="{ selected: activeRiskCategory === category.name }"
                @click="activeRiskCategory = category.name"
              >
                <i :style="{ background: category.color }"></i>
                <span>{{ category.name }}</span>
                <strong>{{ category.count }}</strong>
              </button>
            </div>
          </aside>

          <main class="risk-table-panel">
            <div class="issue-toolbar">
              <el-input v-model="riskKeyword" class="issue-search" placeholder="搜索风险词" :prefix-icon="Search" clearable />
              <div v-if="riskEditing" class="issue-actions">
                <el-button size="small" type="primary" @click="openRiskKeywordDialog()">+ 添加词条</el-button>
              </div>
            </div>

            <el-table :data="filteredRiskKeywords" class="issue-table" :header-cell-style="headerCellStyle">
              <el-table-column type="index" label="#" width="44" />
              <el-table-column prop="word" label="风险词" min-width="160" />
              <el-table-column prop="category" label="分类" width="120">
                <template #default="{ row }">
                  <el-tag size="small" effect="plain">{{ row.category }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="level" label="预警级别" width="110" align="center">
                <template #default="{ row }">
                  <el-tag size="small" :type="row.level === '高' ? 'danger' : row.level === '中' ? 'warning' : 'info'" effect="plain">{{ row.level }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="matchType" label="匹配方式" width="110" align="center" />
              <el-table-column prop="remark" label="说明" min-width="220" show-overflow-tooltip />
              <el-table-column label="状态" width="90" align="center">
                <template #default="{ row }">
                  <span class="issue-status" :class="row.status">{{ row.status === 'enabled' ? '启用' : '停用' }}</span>
                </template>
              </el-table-column>
              <el-table-column v-if="riskEditing" label="操作" width="160" align="center">
                <template #default="{ row }">
                  <el-button link type="primary" @click="openRiskKeywordDialog(row)">编辑</el-button>
                  <el-button link type="primary" @click="toggleRiskKeyword(row)">{{ row.status === 'enabled' ? '停用' : '启用' }}</el-button>
                  <el-button link type="primary" @click="removeRiskKeyword(row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>

            <div class="issue-pagination">
              <span>共 {{ riskKeywords.length }} 个风险词</span>
              <el-pagination background layout="prev, pager, next, sizes" :total="riskKeywords.length" :page-size="10" />
            </div>
          </main>
        </div>
      </section>
    </template>

    <template v-else-if="section === 'config' && configPage === 'monitor'">
      <section class="sentiment-monitor-config">
        <el-button type="primary" class="monitor-edit-btn" @click="handleMonitorEditSave">
          {{ monitorEditing ? '保存' : '编辑' }}
        </el-button>

        <div class="monitor-config-section monitor-basic-section">
          <div class="monitor-section-title-row">
            <div class="monitor-section-title">监控配置</div>
            <el-switch v-model="monitorEnabled" :disabled="!monitorEditing" active-text="开" inactive-text="关" inline-prompt />
          </div>

          <div class="monitor-form-row monitor-row-main">
            <div class="inline-form-item">
              <span class="inline-label">监控周期</span>
              <el-select v-model="monitorBasic.period" :disabled="!monitorEditing" class="period-select">
                <el-option label="每日" value="daily" />
                <el-option label="每周" value="weekly" />
                <el-option label="间隔" value="interval" />
              </el-select>
            </div>

            <el-checkbox-group v-if="monitorBasic.period === 'weekly'" v-model="monitorBasic.weekdays" class="weekday-list">
              <el-checkbox v-for="day in weekdayOptions" :key="day.value" :label="day.value" :disabled="!monitorEditing">{{ day.label }}</el-checkbox>
            </el-checkbox-group>

            <template v-if="monitorBasic.period === 'interval'">
              <div class="inline-form-item">
                <span class="inline-label">开始日期</span>
                <el-date-picker v-model="monitorBasic.startDate" :disabled="!monitorEditing" type="date" format="YYYY/MM/DD" value-format="YYYY/MM/DD" class="date-picker compact-date-picker" />
              </div>
              <div class="inline-form-item">
                <span class="inline-label">间隔天数</span>
                <el-input-number v-model="monitorBasic.intervalDays" :disabled="!monitorEditing" :min="1" :max="365" controls-position="right" class="small-number" />
              </div>
            </template>

            <div class="inline-form-item daily-count-item">
              <span class="inline-label">单日次数</span>
              <el-input-number v-model="monitorBasic.askTimes" :disabled="!monitorEditing" :min="1" :max="24" controls-position="right" class="small-number" />
            </div>

            <div v-if="monitorBasic.askTimes === 1" class="inline-form-item execute-time-inline single-time-inline">
              <span class="inline-label">执行时间</span>
              <div class="time-list">
                <el-time-picker v-model="monitorBasic.splitTimes[0]" :disabled="!monitorEditing" format="HH:mm" value-format="HH:mm" :clearable="false" class="time-picker compact-time" />
              </div>
            </div>
          </div>

          <div v-if="monitorBasic.askTimes > 1" class="monitor-form-row execute-row-inline">
            <div class="inline-form-item">
              <span class="inline-label">执行方式</span>
              <el-segmented v-model="monitorBasic.executionMode" :disabled="!monitorEditing" :options="executeModeOptions" />
            </div>
            <div class="inline-form-item execute-time-inline">
              <span class="inline-label">执行时间</span>
              <div v-show="monitorBasic.executionMode === 'continuous'" class="time-list">
                <el-time-picker v-model="monitorBasic.executionTime" :disabled="!monitorEditing" format="HH:mm" value-format="HH:mm" :clearable="false" class="time-picker compact-time" />
              </div>
              <div v-show="monitorBasic.executionMode === 'split'" class="time-list">
                <el-time-picker
                  v-for="(_, index) in monitorBasic.splitTimes"
                  :key="index"
                  v-model="monitorBasic.splitTimes[index]"
                  :disabled="!monitorEditing"
                  format="HH:mm"
                  value-format="HH:mm"
                  :clearable="false"
                  class="time-picker compact-time"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="monitor-config-section">
          <div class="monitor-section-title">模型配置</div>
          <div class="channel-panel">
            <div class="channel-title">采集通道</div>
            <div class="channel-options">
              <button type="button" class="channel-option" :class="{ active: collectChannel === 'standard' }" :disabled="!monitorEditing" @click="collectChannel = 'standard'">
                <span class="channel-check">✓</span>
                <span class="channel-title-row">
                  <span class="channel-name">标准通道</span>
                  <span class="channel-tag">日常监控</span>
                </span>
                <span class="channel-features">联网搜索、答案采集、信源采集，适合稳定低成本监控。</span>
              </button>
              <button type="button" class="channel-option" :class="{ active: collectChannel === 'enhanced' }" :disabled="!monitorEditing" @click="collectChannel = 'enhanced'">
                <span class="channel-check">✓</span>
                <span class="channel-title-row">
                  <span class="channel-name">增强通道</span>
                  <span class="channel-tag">能力完整</span>
                </span>
                <span class="channel-features">包含深度思考、全部截图、提及截图，适合高风险舆情专项。</span>
              </button>
            </div>
          </div>

          <div class="model-subtitle">监控模型</div>
          <div class="model-grid model-grid-simple">
            <div
              v-for="model in monitorModels"
              :key="model.name"
              class="model-card simple-model-card"
              :class="{ 'enhanced-model-card': collectChannel === 'enhanced', 'model-enabled': model.enabled }"
            >
              <el-checkbox v-model="model.enabled" :disabled="!monitorEditing" class="model-main-check">{{ model.name }}</el-checkbox>
              <div v-if="collectChannel === 'enhanced'" class="model-enhanced-config">
                <el-checkbox v-model="model.deepThinking" :disabled="!monitorEditing || !model.enabled" class="child-check">深度思考</el-checkbox>
                <div class="screenshot-checks">
                  <el-checkbox v-model="model.allScreenshot" :disabled="!monitorEditing || !model.enabled" class="child-check" @change="value => handleScreenshotChange(model, 'all', value)">全部截图</el-checkbox>
                  <el-checkbox v-model="model.mentionScreenshot" :disabled="!monitorEditing || !model.enabled" class="child-check" @change="value => handleScreenshotChange(model, 'mention', value)">提及截图</el-checkbox>
                </div>
              </div>
            </div>
          </div>
        </div>

      </section>
    </template>

    <template v-else-if="section === 'config' && configPage === 'alert'">
      <section class="sentiment-monitor-config">
        <el-button type="primary" class="monitor-edit-btn" @click="handleAlertEditSave">
          {{ alertEditing ? '保存' : '编辑' }}
        </el-button>

        <div class="monitor-config-section">
          <div class="monitor-section-title">预警短信触发条件</div>
          <div class="alert-rule-layout">
            <div class="alert-rule-card">
              <div class="alert-rule-title">基础数量触发</div>
              <div class="alert-rule-row">
                <el-checkbox v-model="monitorAlertRules.riskSourceCount" :disabled="!alertEditing">风险信源数达到</el-checkbox>
                <el-input-number v-model="monitorAlertRules.riskSourceCountTarget" :disabled="!alertEditing || !monitorAlertRules.riskSourceCount" :min="1" :max="999" controls-position="right" class="metric-number" />
                <span class="unit">条</span>
              </div>
              <div class="alert-rule-row">
                <el-checkbox v-model="monitorAlertRules.mentionCount" :disabled="!alertEditing">单日提及次数达到</el-checkbox>
                <el-input-number v-model="monitorAlertRules.mentionCountTarget" :disabled="!alertEditing || !monitorAlertRules.mentionCount" :min="1" :max="9999" controls-position="right" class="metric-number" />
                <span class="unit">次</span>
              </div>
            </div>

            <div class="alert-rule-card">
              <div class="alert-rule-title">核心风险触发</div>
              <div class="alert-rule-row">
                <el-checkbox v-model="monitorAlertRules.coreRiskWord" :disabled="!alertEditing">命中核心风险词即预警</el-checkbox>
              </div>
              <div class="alert-rule-row">
                <el-checkbox v-model="monitorAlertRules.highWeightSource" :disabled="!alertEditing">命中高权重信源即预警</el-checkbox>
                <span class="source-prefix">命中</span>
                <el-input-number v-model="highWeightSourceConfig.triggerCount" :disabled="!alertEditing || !monitorAlertRules.highWeightSource" :min="1" :max="99" controls-position="right" class="small-number" />
                <span class="unit">条以上</span>
              </div>
            </div>
          </div>
        </div>

        <div class="monitor-config-section">
          <div class="monitor-section-title source-section-title">
            <span>关注信源</span>
            <el-button v-if="alertEditing" size="small" type="primary" @click="openHighWeightSourceDialog()">+ 添加信源</el-button>
          </div>
          <div class="source-table-panel">
            <el-table :data="highWeightSourceConfig.sources" class="issue-table" :header-cell-style="headerCellStyle">
              <el-table-column type="index" label="#" width="44" />
              <el-table-column prop="name" label="信源名称" min-width="170" />
              <el-table-column prop="level" label="等级" width="100" align="center">
                <template #default="{ row }">
                  <el-tag size="small" :type="row.level === '高' ? 'danger' : row.level === '中' ? 'warning' : 'info'" effect="plain">{{ row.level }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="match" label="匹配内容" min-width="220" show-overflow-tooltip />
              <el-table-column prop="matchType" label="匹配方式" width="110" align="center" />
              <el-table-column prop="remark" label="说明" min-width="200" show-overflow-tooltip />
              <el-table-column v-if="alertEditing" label="操作" width="120" align="center">
                <template #default="{ row }">
                  <el-button link type="primary" @click="openHighWeightSourceDialog(row)">编辑</el-button>
                  <el-button link type="primary" @click="removeHighWeightSource(row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>

        <div class="monitor-config-section">
          <div class="monitor-section-title">监控报告</div>
          <div class="report-options">
            <el-checkbox v-model="monitorReportOptions.daily" :disabled="!alertEditing">日报</el-checkbox>
            <el-checkbox v-model="monitorReportOptions.weekly" :disabled="!alertEditing">周报</el-checkbox>
            <el-checkbox v-model="monitorReportOptions.monthly" :disabled="!alertEditing">月报</el-checkbox>
          </div>
        </div>

        <div class="monitor-config-section high-source-explain">
          <div class="monitor-section-title">信源分类</div>
          <div class="high-source-explain-card">
            <div class="source-grade-heading">媒体权重平台分级</div>
            <div class="source-grade-table">
              <div class="source-grade-head">平台权重等级</div>
              <div class="source-grade-head">平台名称</div>
              <div class="source-grade-cell grade-s">S级（权威核心）</div>
              <div class="source-grade-cell grade-s">上汽奥迪官网、智己汽车官网、工信部机动车公告、央视/人民网等官方媒体</div>
              <div class="source-grade-cell grade-a">A级（高权重抓取）</div>
              <div class="source-grade-cell grade-a">汽车之家、懂车帝、易车、新浪汽车、搜狐汽车、腾讯汽车</div>
              <div class="source-grade-cell grade-b">B级（中权重抓取）</div>
              <div class="source-grade-cell grade-b">新浪看点、手机搜狐网、百家号、今日头条、知乎</div>
              <div class="source-grade-cell grade-c">C级（低权重抓取）</div>
              <div class="source-grade-cell grade-c">各类汽车社区、小众论坛、UGC内容平台</div>
            </div>
            <p>系统按信源来源自动归类并参与短信预警判断；客户在“关注信源”中添加的来源，关注等级为“高”时优先参与预警。</p>
          </div>
        </div>
      </section>
    </template>

    <template v-else>
      <el-row :gutter="16">
        <el-col :span="12" v-for="item in configItems" :key="item.title">
          <el-card shadow="never" class="config-card">
            <template #header>{{ item.title }}</template>
            <p>{{ item.desc }}</p>
            <div v-if="item.page === 'subject'" class="subject-summary">
              <div><span>主体名称</span><strong>{{ subjectConfig.name }}</strong></div>
              <div><span>主体类型</span><strong>{{ subjectTypeLabel }}</strong></div>
              <div class="summary-wide">
                <span>监控别名</span>
                <div class="tag-list">
                  <el-tag v-for="alias in subjectConfig.aliases" :key="alias" size="small" effect="plain">{{ alias }}</el-tag>
                </div>
              </div>
              <div class="summary-wide">
                <span>风险维度</span>
                <div class="tag-list">
                  <el-tag v-for="dimension in subjectConfig.riskDimensions" :key="dimension" size="small" type="warning" effect="plain">{{ dimension }}</el-tag>
                </div>
              </div>
            </div>
            <el-button size="small" type="primary" plain @click="openConfigDialog(item)">配置</el-button>
          </el-card>
        </el-col>
      </el-row>
    </template>

    <el-dialog v-model="conversationDetailVisible" width="1180px" class="sentiment-conversation-dialog" top="3vh">
      <template #header>
        <div v-if="currentConversationRecord" class="conversation-dialog-meta">
          <div>
            <span>当前项目</span>
            <strong>{{ currentProject.name }}</strong>
          </div>
          <p>{{ currentConversationRecord.queryTime }}</p>
        </div>
      </template>
      <div v-if="currentConversationRecord" class="conversation-dialog-body">
        <div class="conversation-dialog-layout">
          <main class="conversation-answer-area">
            <div class="conversation-question-row">
              <div class="conversation-question-bubble">{{ currentConversationRecord.question }}</div>
              <div class="conversation-question-icon">问</div>
            </div>
            <div class="conversation-answer-wrap">
              <div class="conversation-model-avatar">{{ currentConversationRecord.modelIcon }}</div>
              <div class="conversation-answer-card">
                <div class="answer-title-row">
                  <strong>{{ currentConversationRecord.model }}</strong>
                  <el-tag type="success" effect="plain" size="small">成功</el-tag>
                </div>
                <div class="answer-time">执行时间：{{ currentConversationRecord.duration }}</div>
                <div v-if="currentConversationRecord.thinkingProcess?.length" class="thinking-process">
                  <div class="thinking-title">思考过程</div>
                  <div v-for="(step, index) in currentConversationRecord.thinkingProcess" :key="index" class="thinking-step">
                    <div class="thinking-dot"></div>
                    <p>{{ step }}</p>
                  </div>
                </div>
                <div class="conversation-answer-content">
                  <p v-for="paragraph in currentConversationRecord.answerParagraphs" :key="paragraph">{{ paragraph }}</p>
                </div>
              </div>
            </div>
          </main>
          <aside class="conversation-detail-side">
            <section>
              <h4>提及品牌（{{ currentConversationRecord.ranking.length }}个）</h4>
              <div v-for="brand in currentConversationRecord.ranking" :key="brand.name" class="side-rank-item">
                <span>{{ brand.name }}</span>
                <b>{{ brand.rank }}</b>
              </div>
            </section>
            <section>
              <h4>引用来源（{{ currentConversationRecord.sources.length }}条）</h4>
              <a
                v-for="source in currentConversationRecord.sources"
                :key="source.url"
                class="source-item"
                :href="source.url"
                target="_blank"
                rel="noopener noreferrer"
              >
                <strong>{{ source.title }}</strong>
                <span>{{ source.url }}</span>
              </a>
            </section>
          </aside>
        </div>
      </div>
    </el-dialog>

    <el-dialog v-model="subjectDialogVisible" title="监控主体配置" width="720px" destroy-on-close>
      <el-form :model="subjectForm" label-width="104px" class="subject-form">
        <el-row :gutter="14">
          <el-col :span="12">
            <el-form-item label="主体名称" required>
              <el-input v-model="subjectForm.name" placeholder="请输入品牌、产品或事件名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="主体类型" required>
              <el-select v-model="subjectForm.type" style="width: 100%">
                <el-option label="品牌舆情" value="brand" />
                <el-option label="产品舆情" value="product" />
                <el-option label="人物舆情" value="person" />
                <el-option label="机构舆情" value="organization" />
                <el-option label="事件专项" value="event" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="监控别名">
          <el-select
            v-model="subjectForm.aliases"
            multiple
            filterable
            allow-create
            default-first-option
            style="width: 100%"
            placeholder="输入别名后回车，例如 奥迪E7X、Audi E7X"
          />
        </el-form-item>

        <el-form-item label="关联实体">
          <el-select
            v-model="subjectForm.entities"
            multiple
            filterable
            allow-create
            default-first-option
            style="width: 100%"
            placeholder="输入关联品牌、车型、竞品或人物"
          />
        </el-form-item>

        <el-form-item label="监控范围">
          <el-checkbox-group v-model="subjectForm.scopes" class="scope-grid">
            <el-checkbox label="AI回答">AI回答</el-checkbox>
            <el-checkbox label="新闻媒体">新闻媒体</el-checkbox>
            <el-checkbox label="问答平台">问答平台</el-checkbox>
            <el-checkbox label="论坛社区">论坛社区</el-checkbox>
            <el-checkbox label="短视频评论">短视频评论</el-checkbox>
            <el-checkbox label="电商评价">电商评价</el-checkbox>
          </el-checkbox-group>
        </el-form-item>

        <el-form-item label="风险维度">
          <el-checkbox-group v-model="subjectForm.riskDimensions" class="scope-grid">
            <el-checkbox label="事件核查">事件核查</el-checkbox>
            <el-checkbox label="负面舆情">负面舆情</el-checkbox>
            <el-checkbox label="用户投诉">用户投诉</el-checkbox>
            <el-checkbox label="质量质疑">质量质疑</el-checkbox>
            <el-checkbox label="购买影响">购买影响</el-checkbox>
            <el-checkbox label="处置建议">处置建议</el-checkbox>
          </el-checkbox-group>
        </el-form-item>

        <el-form-item label="背景说明">
          <el-input
            v-model="subjectForm.background"
            type="textarea"
            :rows="4"
            placeholder="补充主体背景、争议来源、关注重点和监控口径"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="subjectDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveSubjectConfig">保存配置</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="issueDialogVisible" :title="editingIssueId ? '编辑舆情问题' : '添加舆情问题'" width="560px">
      <el-form label-position="top">
        <el-form-item label="舆情问题">
          <el-input v-model="issueForm.text" type="textarea" :rows="4" placeholder="请输入需要监控的舆情问题，一行一个" />
        </el-form-item>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="风险标签">
              <el-select v-model="issueForm.category" placeholder="选择风险标签" style="width: 100%">
                <el-option v-for="item in issueCategoryCounts" :key="item.name" :label="item.name" :value="item.name" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="风险等级">
              <el-select v-model="issueForm.riskLevel" style="width: 100%">
                <el-option label="高" value="高" />
                <el-option label="中" value="中" />
                <el-option label="低" value="低" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="issueDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmIssue">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="issueTagDialogVisible" title="添加风险标签" width="420px">
      <el-form label-position="top">
        <el-form-item label="标签名称">
          <el-input v-model="issueTagForm.name" placeholder="例如：食品安全、宝宝健康" />
        </el-form-item>
        <el-form-item label="标签颜色">
          <el-select v-model="issueTagForm.color" style="width: 100%">
            <el-option label="红色" value="#ef4444" />
            <el-option label="橙色" value="#f59e0b" />
            <el-option label="蓝色" value="#2563eb" />
            <el-option label="绿色" value="#16a34a" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="issueTagDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="addIssueTag">创建标签</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="issueUploadDialogVisible" title="上传舆情问题" width="520px">
      <el-upload drag action="#" :auto-upload="false">
        <el-icon class="upload-icon"><UploadFilled /></el-icon>
        <div>将 Excel / CSV 文件拖到此处，或点击上传</div>
      </el-upload>
      <template #footer>
        <el-button @click="issueUploadDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="issueUploadDialogVisible = false">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="riskKeywordDialogVisible" :title="editingRiskKeywordId ? '编辑风险词' : '添加风险词'" width="560px">
      <el-form label-position="top">
        <el-form-item label="风险词">
          <el-input v-model="riskKeywordForm.word" placeholder="请输入风险词，例如 腹泻、假货、虚假宣传" />
        </el-form-item>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="分类">
              <el-select v-model="riskKeywordForm.category" style="width: 100%">
                <el-option v-for="item in riskCategoryCounts" :key="item.name" :label="item.name" :value="item.name" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="预警级别">
              <el-select v-model="riskKeywordForm.level" style="width: 100%">
                <el-option label="高" value="高" />
                <el-option label="中" value="中" />
                <el-option label="低" value="低" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="匹配方式">
          <el-segmented v-model="riskKeywordForm.matchType" :options="['精确', '包含', '同义扩展']" />
        </el-form-item>
        <el-form-item label="说明">
          <el-input v-model="riskKeywordForm.remark" type="textarea" :rows="3" placeholder="说明该词用于识别哪类风险场景" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="riskKeywordDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmRiskKeyword">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="riskCategoryDialogVisible" title="添加风险分类" width="420px">
      <el-form label-position="top">
        <el-form-item label="分类名称">
          <el-input v-model="riskCategoryForm.name" placeholder="例如：食品安全、质量争议" />
        </el-form-item>
        <el-form-item label="分类颜色">
          <el-select v-model="riskCategoryForm.color" style="width: 100%">
            <el-option label="红色" value="#ef4444" />
            <el-option label="橙色" value="#f59e0b" />
            <el-option label="蓝色" value="#2563eb" />
            <el-option label="绿色" value="#16a34a" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="riskCategoryDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="addRiskCategory">创建分类</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="highWeightSourceDialogVisible" :title="editingHighWeightSourceId ? '编辑关注信源' : '添加关注信源'" width="560px">
      <el-form label-position="top">
        <el-form-item label="信源名称">
          <el-input v-model="highWeightSourceForm.name" placeholder="例如：小红书、汽车之家、抖音" />
        </el-form-item>
        <el-form-item label="关注等级">
          <el-segmented v-model="highWeightSourceForm.level" :options="['高', '中', '低']" />
        </el-form-item>
        <el-form-item label="匹配内容">
          <el-input v-model="highWeightSourceForm.match" placeholder="域名、账号、媒体名或 URL 关键词，如 xiaohongshu.com / autohome.com.cn / douyin.com" />
        </el-form-item>
        <el-form-item label="匹配方式">
          <el-segmented v-model="highWeightSourceForm.matchType" :options="['精确', '包含', '域名']" />
        </el-form-item>
        <el-form-item label="说明">
          <el-input v-model="highWeightSourceForm.remark" type="textarea" :rows="3" placeholder="说明该信源为什么需要重点关注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="highWeightSourceDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmHighWeightSource">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { QuestionFilled, Search, UploadFilled } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const configPage = computed(() => route.meta.configPage || '')
const section = computed(() => route.meta.section || route.params.section || (configPage.value ? 'config' : 'overview'))
const isConfigSection = computed(() => section.value === 'config')
const showGlobalFilter = computed(() => !isConfigSection.value && !['real-time', 'clues', 'clue-detail', 'question-detail'].includes(section.value))
const sourceTab = ref('domain')
const sourceListKeyword = ref('')
const sourceListPlatform = ref('')
const sourceListClue = ref('')
const cluePoolActiveTab = ref('new')
const clueFilterModel = ref('all')
const clueFilterRange = ref('7d')
const clueFilterRisk = ref('')
const realTimeRiskFilter = ref('all')
const questionListKeyword = ref('')
const questionListCategory = ref('')
const questionListRiskLevel = ref('')
const conversationViewMode = ref('cards')
const conversationKeyword = ref('')
const conversationModelFilter = ref('')
const conversationQuestionFilter = ref('')
const conversationDetailVisible = ref(false)
const currentConversationRecord = ref(null)
const reportType = ref('daily')
const keyword = ref('')
const subjectEditing = ref(false)
const subjectDialogVisible = ref(false)
const issueEditing = ref(false)
const issueCategoryKeyword = ref('')
const issueKeyword = ref('')
const activeIssueCategory = ref('所有')
const issueSelection = ref([])
const issueDialogVisible = ref(false)
const issueTagDialogVisible = ref(false)
const issueUploadDialogVisible = ref(false)
const editingIssueId = ref(null)
const issueForm = reactive({ text: '', category: '事件核查', riskLevel: '高' })
const issueTagForm = reactive({ name: '', color: '#ef4444' })
const riskEditing = ref(false)
const riskCategoryKeyword = ref('')
const riskKeyword = ref('')
const activeRiskCategory = ref('全部')
const riskKeywordDialogVisible = ref(false)
const riskCategoryDialogVisible = ref(false)
const editingRiskKeywordId = ref(null)
const riskKeywordForm = reactive({ word: '', category: '安全风险', level: '高', matchType: '包含', remark: '' })
const riskCategoryForm = reactive({ name: '', color: '#ef4444' })
const highWeightSourceDialogVisible = ref(false)
const editingHighWeightSourceId = ref(null)
const highWeightSourceForm = reactive({ name: '', level: '高', match: '', matchType: '包含', remark: '' })

const filterState = reactive({
  model: 'all',
  range: '7d',
  risk: 'all'
})

const currentProject = reactive({
  name: '奥迪E7X与智己LS7「换壳」舆情审计项目',
  riskLevel: '极度高危'
})

const subjectConfig = reactive({
  name: '奥迪E7X与智己LS7「换壳」舆情审计项目',
  type: 'event',
  aliases: ['奥迪E7X', 'Audi E7X', '智己LS7', '换壳争议'],
  entities: ['奥迪', '智己汽车', '上汽集团', '新能源SUV'],
  scopes: ['AI回答', '新闻媒体', '问答平台', '论坛社区', '短视频评论'],
  riskDimensions: ['事件核查', '负面舆情', '用户投诉', '质量质疑', '购买影响'],
  background: '围绕奥迪E7X与智己LS7外观、平台、配置相似度引发的换壳争议，持续监测AI回答、媒体报道、社区讨论和用户购买影响。'
})

const subjectForm = reactive({
  name: '',
  type: 'event',
  aliases: [],
  entities: [],
  scopes: [],
  riskDimensions: [],
  background: ''
})

const subjectTypeOptions = [
  { label: '品牌舆情', value: 'brand' },
  { label: '产品舆情', value: 'product' },
  { label: '人物舆情', value: 'person' },
  { label: '机构舆情', value: 'organization' },
  { label: '事件专项', value: 'event' }
]

const subjectTypeLabel = computed(() => subjectTypeOptions.find(item => item.value === subjectConfig.type)?.label || '事件专项')

const syncSubjectForm = () => {
  subjectForm.name = subjectConfig.name
  subjectForm.type = subjectConfig.type
  subjectForm.aliases = [...subjectConfig.aliases]
  subjectForm.entities = [...subjectConfig.entities]
  subjectForm.scopes = [...subjectConfig.scopes]
  subjectForm.riskDimensions = [...subjectConfig.riskDimensions]
  subjectForm.background = subjectConfig.background
}

watch(configPage, (page) => {
  if (page === 'subject') syncSubjectForm()
}, { immediate: true })

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

const sourceTrendItems = [
  { day: '05-23', value: 8 },
  { day: '05-24', value: 10 },
  { day: '05-25', value: 13 },
  { day: '05-26', value: 12 },
  { day: '05-27', value: 16 },
  { day: '05-28', value: 21 },
  { day: '05-29', value: 18 }
]

const sourceTrendMax = computed(() => Math.max(...sourceTrendItems.map(item => item.value), 1))

const sourceTrendSvgPoints = computed(() => sourceTrendItems.map((item, index) => {
  const x = 40 + index * 108
  const y = 190 - (item.value / sourceTrendMax.value) * 150
  return { ...item, x, y }
}))

const sourceTrendPolyline = computed(() => sourceTrendSvgPoints.value.map(item => `${item.x},${item.y}`).join(' '))

const currentDayRiskSourceTop = [
  { name: '汽车之家', count: 5 },
  { name: '懂车帝', count: 4 },
  { name: '小红书', count: 4 },
  { name: '知乎', count: 3 },
  { name: '搜狐汽车', count: 3 },
  { name: '微博热搜', count: 2 },
  { name: '黑猫投诉', count: 2 },
  { name: '易车', count: 2 },
  { name: '今日头条', count: 1 },
  { name: '腾讯汽车', count: 1 }
]

const realTimeFeedItems = [
  {
    id: 'RT001',
    riskType: 'high',
    riskLabel: '高风险',
    time: '刚刚',
    sourceType: '模型巡检',
    dataSource: '对话管理 / 监控任务执行结果',
    clue: '换壳认知固化',
    clueType: 'ai',
    detailTarget: 'clue',
    source: '大模型巡检（DeepSeek）',
    platform: 'DeepSeek',
    trend: 'up',
    title: 'DeepSeek最新问答将两车底盘认定为完全一致',
    summary: '在常规提问“智己LS7底盘和奥迪一样吗”中，模型未提及星云平台差异，直接给出“同集团换壳”结论。'
  },
  {
    id: 'RT002',
    riskType: 'high',
    riskLabel: '高风险',
    time: '30分钟前',
    sourceType: '全网信源',
    dataSource: '信源列表 / 风险关键词命中',
    clue: '竞品负面对比',
    clueType: 'new',
    detailTarget: 'source',
    source: '新浪看点',
    platform: '新浪看点',
    trend: 'up',
    title: '某自媒体发布《E7X其实就是智己的壳？》',
    summary: '文章引用了多处不实言论，阅读量正在快速攀升，极易被各大模型抓取更新语料。'
  },
  {
    id: 'RT003',
    riskType: 'low',
    riskLabel: '低风险（正向/澄清）',
    time: '2小时前',
    sourceType: '全网信源',
    dataSource: '信源列表 / 正向澄清内容',
    clue: '大模型负面认知',
    clueType: 'new',
    detailTarget: 'source',
    source: '有驾',
    platform: '有驾',
    trend: 'down',
    title: '有驾平台发布技术澄清分析',
    summary: '专业作者详细解析了 ADP 平台与星云平台的核心差异，属于正向高权重内容，需加强曝光。'
  },
  {
    id: 'RT004',
    riskType: 'medium',
    riskLabel: '中风险',
    time: '5小时前',
    sourceType: '社区信源',
    dataSource: '信源列表 / 主题分类',
    clue: '换壳认知固化',
    clueType: 'ai',
    detailTarget: 'source',
    source: '易车社区',
    platform: '易车',
    trend: 'up',
    title: '易车社区出现换壳疑问帖',
    summary: '用户发帖提问两车是否为换壳车，底下跟帖存在信息模糊现象，暂无官方或认证号介入澄清。'
  }
]

const filteredRealTimeFeeds = computed(() => {
  if (realTimeRiskFilter.value === 'high') return realTimeFeedItems.filter(item => item.riskType === 'high')
  return realTimeFeedItems
})

const spreadPathClueName = computed(() => realTimeFeedItems.find(item => item.riskType === 'high')?.clue || '当前最高风险线索')

const realTimeTrendItems = [
  { time: '08:00', high: 2, medium: 8 },
  { time: '10:00', high: 5, medium: 10 },
  { time: '12:00', high: 12, medium: 15 },
  { time: '14:00', high: 18, medium: 22 },
  { time: '16:00', high: 15, medium: 28 },
  { time: '18:00', high: 8, medium: 20 },
  { time: '20:00', high: 4, medium: 12 }
]

const realTimeTrendMax = computed(() => Math.max(...realTimeTrendItems.flatMap(item => [item.high, item.medium]), 1))

const createRealTimeTrendPoints = (key) => realTimeTrendItems.map((item, index) => {
  const x = 34 + index * 51
  const y = 190 - (item[key] / realTimeTrendMax.value) * 152
  return { ...item, x, y, value: item[key] }
})

const realTimeHighTrendPoints = computed(() => createRealTimeTrendPoints('high'))
const realTimeMediumTrendPoints = computed(() => createRealTimeTrendPoints('medium'))
const realTimeHighTrendPolyline = computed(() => realTimeHighTrendPoints.value.map(item => `${item.x},${item.y}`).join(' '))
const realTimeMediumTrendPolyline = computed(() => realTimeMediumTrendPoints.value.map(item => `${item.x},${item.y}`).join(' '))

const spreadPathItems = [
  { stage: '源头发酵', time: '昨天 14:00', type: 'source', content: '易车社区 / 贴吧出现诱导性提问' },
  { stage: '媒体扩散', time: '昨天 18:00', type: 'media', content: '新浪看点等抓取形成多篇“换壳”文章' },
  { stage: '大模型收录反馈', time: '今天 08:00', type: 'model', content: 'DeepSeek / 通义千问语料更新，对用户明确输出“两车是换壳”的错误结论' }
]

const cluePoolCards = [
  { label: '聚合线索', value: '5', desc: '本期最需要关注的问题', type: 'primary' },
  { label: '高风险线索', value: '3', desc: '需要优先处置或预警', type: 'danger' },
  { label: '信源总数', value: '68', desc: '跨平台内容与引用信源', type: 'warning' },
  { label: '建议深钻', value: '3', desc: '建议进入专项深钻分析', type: 'primary' }
]

const aiCluePoolCards = [
  { label: 'AI线索', value: '5', desc: '长期影响模型回答的问题', type: 'primary' },
  { label: '累计引用', value: '186', desc: '历史信源被模型引用次数', type: 'danger' },
  { label: '影响模型', value: '6', desc: '覆盖 DeepSeek、豆包、Kimi 等', type: 'warning' },
  { label: '需治理', value: '4', desc: '需要补充正向证据或澄清', type: 'primary' }
]

const currentCluePoolCards = computed(() => cluePoolActiveTab.value === 'ai' ? aiCluePoolCards : cluePoolCards)

const opinionClueRows = [
  {
    clue: '售后退款难',
    relatedContent: '用户集中反馈退订、退款审核慢、客服响应不一致，投诉内容在黑猫投诉和短视频评论区扩散。',
    platforms: ['黑猫投诉', '抖音', '小红书', '微博'],
    newSourceCount: 18,
    highWeightSourceCount: 5,
    aiQuoteCount: 22,
    modelCount: 4,
    sourceCount: 18,
    negativeVolume: 126,
    recentActiveAt: '2026-05-29 18:20',
    riskLevel: '高',
    deepDive: true,
    alert: true
  },
  {
    clue: '产品质量争议',
    relatedContent: '围绕做工、配置稳定性、交付质量形成多轮讨论，部分内容被汽车垂直媒体二次引用。',
    platforms: ['汽车之家', '懂车帝', '知乎'],
    newSourceCount: 16,
    highWeightSourceCount: 6,
    aiQuoteCount: 18,
    modelCount: 5,
    sourceCount: 16,
    negativeVolume: 98,
    recentActiveAt: '2026-05-29 17:42',
    riskLevel: '高',
    deepDive: true,
    alert: true
  },
  {
    clue: '价格争议',
    relatedContent: '高价低配、溢价明显、与竞品配置对比不占优等表达集中出现，影响潜在购买信心。',
    platforms: ['易车', '小红书', '今日头条'],
    newSourceCount: 14,
    highWeightSourceCount: 3,
    aiQuoteCount: 14,
    modelCount: 4,
    sourceCount: 14,
    negativeVolume: 82,
    recentActiveAt: '2026-05-29 16:55',
    riskLevel: '中',
    deepDive: true,
    alert: false
  },
  {
    clue: '竞品负面对比',
    relatedContent: '内容多以智己、问界、理想等竞品作为对照，强化平台共用、配置差异和品牌溢价争议。',
    platforms: ['汽车之家', '懂车帝', '知乎', '搜狐汽车'],
    newSourceCount: 12,
    highWeightSourceCount: 4,
    aiQuoteCount: 16,
    modelCount: 5,
    sourceCount: 12,
    negativeVolume: 74,
    recentActiveAt: '2026-05-29 15:38',
    riskLevel: '中',
    deepDive: false,
    alert: false
  },
  {
    clue: '大模型负面认知',
    relatedContent: '多模型回答中反复出现换壳、性价比不足、购买谨慎等标签，容易固化为 AI 侧负面认知。',
    platforms: ['DeepSeek', '豆包', 'Kimi', '通义千问'],
    newSourceCount: 8,
    highWeightSourceCount: 4,
    aiQuoteCount: 38,
    modelCount: 6,
    sourceCount: 8,
    negativeVolume: 46,
    recentActiveAt: '2026-05-29 09:38',
    riskLevel: '高',
    deepDive: true,
    alert: true
  }
]

const aiOpinionClueRows = [
  {
    clue: '换壳认知固化',
    relatedQuestion: '奥迪E7X与智己LS7换壳争议是否属实？',
    relatedContent: '历史内容持续被多个模型引用，换壳、平台共用和官方解释不足成为稳定负面认知。',
    platforms: ['汽车之家', '懂车帝', '知乎', 'B站'],
    models: ['DeepSeek', '豆包', 'Kimi', '通义千问', '文心一言'],
    newSourceCount: 6,
    highWeightSourceCount: 7,
    quoteCount: 58,
    modelCount: 6,
    historySourceCount: 14,
    sourceCount: 14,
    negativeVolume: 118,
    recentActiveAt: '2026-05-29 09:38',
    riskLevel: '高',
    lastQuotedAt: '2026-05-29 09:38',
    negativeTags: ['换壳', '平台共用', '官方解释不足'],
    governanceAdvice: '补充官方技术差异说明、核心配置对照和第三方测评证据。'
  },
  {
    clue: '性价比不足',
    relatedQuestion: '奥迪E7X和智己LS7哪个更值得买？',
    relatedContent: 'AI 回答反复引用价格和配置对比内容，形成溢价明显、购买谨慎的判断。',
    platforms: ['易车', '小红书', '汽车论坛', '今日头条'],
    models: ['DeepSeek', '豆包', 'Kimi', '通义千问'],
    newSourceCount: 5,
    highWeightSourceCount: 4,
    quoteCount: 43,
    modelCount: 5,
    historySourceCount: 11,
    sourceCount: 11,
    negativeVolume: 92,
    recentActiveAt: '2026-05-29 09:36',
    riskLevel: '高',
    lastQuotedAt: '2026-05-29 09:36',
    negativeTags: ['溢价明显', '高价低配', '购买谨慎'],
    governanceAdvice: '强化品牌价值、权益配置、售后服务和用户场景收益证据。'
  },
  {
    clue: '售后服务负面记忆',
    relatedQuestion: '奥迪E7X车主投诉主要集中在哪些方面？',
    relatedContent: '售后退款和客服响应相关历史内容仍被模型用于解释用户投诉风险。',
    platforms: ['黑猫投诉', '车质网', '微博', '抖音'],
    models: ['DeepSeek', 'Kimi', '文心一言'],
    newSourceCount: 4,
    highWeightSourceCount: 3,
    quoteCount: 36,
    modelCount: 4,
    historySourceCount: 9,
    sourceCount: 9,
    negativeVolume: 76,
    recentActiveAt: '2026-05-28 18:30',
    riskLevel: '中',
    lastQuotedAt: '2026-05-28 18:30',
    negativeTags: ['退款难', '客服慢', '投诉积累'],
    governanceAdvice: '同步售后处理进展，补充已解决案例和标准化服务承诺。'
  },
  {
    clue: '竞品优势叙事',
    relatedQuestion: '用户怎么看奥迪E7X与智己LS7的关系？',
    relatedContent: '竞品对比内容被反复引用，容易强化配置接近、差异不清的叙事。',
    platforms: ['汽车之家', '懂车帝', '知乎', '搜狐汽车'],
    models: ['豆包', 'Kimi', '通义千问', '文心一言'],
    newSourceCount: 3,
    highWeightSourceCount: 4,
    quoteCount: 31,
    modelCount: 5,
    historySourceCount: 8,
    sourceCount: 8,
    negativeVolume: 68,
    recentActiveAt: '2026-05-29 09:32',
    riskLevel: '中',
    lastQuotedAt: '2026-05-29 09:32',
    negativeTags: ['竞品更值', '配置接近', '差异不清'],
    governanceAdvice: '整理竞品差异化卖点，补充品牌调校、渠道服务和质保优势。'
  },
  {
    clue: '品牌新能源信任不足',
    relatedQuestion: '奥迪E7X官方技术说明是否足够清晰？',
    relatedContent: '品牌新能源转型和技术来源说明不足被模型归纳为信任挑战。',
    platforms: ['腾讯汽车', '百家号', '网易汽车', '微博'],
    models: ['DeepSeek', '通义千问', '文心一言'],
    newSourceCount: 2,
    highWeightSourceCount: 3,
    quoteCount: 28,
    modelCount: 4,
    historySourceCount: 7,
    sourceCount: 7,
    negativeVolume: 61,
    recentActiveAt: '2026-05-29 09:35',
    riskLevel: '中',
    lastQuotedAt: '2026-05-29 09:35',
    negativeTags: ['转型压力', '信任挑战', '说明不足'],
    governanceAdvice: '持续发布技术路线、研发投入和真实用户体验内容。'
  }
]

const matchClueRisk = (item) => !clueFilterRisk.value || item.riskLevel === clueFilterRisk.value

const matchClueRange = (item) => {
  if (clueFilterRange.value === '30d' || clueFilterRange.value === 'custom') return true
  const activeTime = item.recentActiveAt || item.lastQuotedAt || ''
  if (clueFilterRange.value === '24h') return activeTime.includes('2026-05-29')
  return ['2026-05-23', '2026-05-24', '2026-05-25', '2026-05-26', '2026-05-27', '2026-05-28', '2026-05-29'].some(day => activeTime.includes(day))
}

const filteredOpinionClueRows = computed(() => opinionClueRows.filter(item => matchClueRisk(item) && matchClueRange(item)))

const filteredAiOpinionClueRows = computed(() => aiOpinionClueRows.filter(item => {
  const matchModel = clueFilterModel.value === 'all' || item.models?.includes(clueFilterModel.value)
  return matchModel && matchClueRisk(item) && matchClueRange(item)
}))

const clueSourceRules = {
  售后退款难: {
    platforms: ['黑猫投诉', '抖音', '小红书', '微博', '车质网', '汽车论坛'],
    keywords: ['投诉', '客服', '退款', '退订', '交付体验', '评论']
  },
  产品质量争议: {
    platforms: ['汽车之家', '懂车帝', '小红书', '车质网', '汽车论坛'],
    keywords: ['质量', '做工', '配置', '稳定', '宣传差异', '参数']
  },
  价格争议: {
    platforms: ['易车', '小红书', '今日头条', '汽车论坛'],
    keywords: ['价格', '溢价', '高价低配', '购买理由', '购买犹豫']
  },
  竞品负面对比: {
    platforms: ['汽车之家', '懂车帝', '知乎', '搜狐汽车', 'B站'],
    keywords: ['智己', '竞品', '对比', '平台共用', '换标', '换壳']
  },
  大模型负面认知: {
    platforms: ['汽车之家', '懂车帝', '知乎', '腾讯汽车', '百家号', '网易汽车'],
    keywords: ['换壳', '性价比', '购买谨慎', '品牌信任', '误解', '差异说明']
  },
  换壳认知固化: {
    platforms: ['汽车之家', '懂车帝', '知乎', 'B站'],
    keywords: ['换壳', '平台共用', '智己', '技术差异', '官方说明']
  },
  性价比不足: {
    platforms: ['易车', '小红书', '汽车论坛', '今日头条'],
    keywords: ['性价比', '溢价', '高价低配', '购买理由', '配置']
  },
  售后服务负面记忆: {
    platforms: ['黑猫投诉', '车质网', '微博', '抖音'],
    keywords: ['投诉', '退款', '客服', '售后', '交付体验']
  },
  竞品优势叙事: {
    platforms: ['汽车之家', '懂车帝', '知乎', '搜狐汽车'],
    keywords: ['竞品', '对比', '智己', '问界', '理想']
  },
  品牌新能源信任不足: {
    platforms: ['腾讯汽车', '百家号', '网易汽车', '微博'],
    keywords: ['品牌信任', '新能源转型', '技术来源', '差异披露']
  }
}

const refreshRealTimeFeeds = () => {
  ElMessage.success('实时舆情数据已刷新')
}

const openRealtimeClue = (item) => {
  router.push({
    path: `/sentiment-project/${route.params.id}/clue-detail`,
    query: { clue: item.clue, type: item.clueType || 'new' }
  })
}

const openRealtimeDetail = (item) => {
  if (item.detailTarget === 'clue') {
    openRealtimeClue(item)
    return
  }
  router.push({
    path: `/sentiment-project/${route.params.id}/sources`,
    query: { clue: item.clue, platform: item.platform }
  })
}

const goClueSources = (row) => {
  router.push({
    path: `/sentiment-project/${route.params.id}/sources`,
    query: { clue: row.clue }
  })
}

const openClueDetail = (row, type = 'new') => {
  router.push({
    path: `/sentiment-project/${route.params.id}/clue-detail`,
    query: { clue: row.clue, type }
  })
}

const currentClueDetail = computed(() => {
  const clueName = route.query.clue
  const type = route.query.type || 'new'
  const sourceRows = type === 'ai' ? aiOpinionClueRows : opinionClueRows
  const fallbackRows = [...opinionClueRows, ...aiOpinionClueRows]
  const row = sourceRows.find(item => item.clue === clueName) || fallbackRows.find(item => item.clue === clueName) || opinionClueRows[0]
  return { ...row, type }
})

const currentCluePlatforms = computed(() => {
  const detail = currentClueDetail.value
  if (detail.platforms?.length) return detail.platforms
  return clueSourceRules[detail.clue]?.platforms || []
})

const clueSeverityCards = computed(() => [
  { label: '新增信源数', value: currentClueDetail.value.newSourceCount || 0, desc: '最近周期新增内容数量', type: 'primary' },
  { label: '高权重信源数', value: currentClueDetail.value.highWeightSourceCount || 0, desc: 'S/A 级信源或重点平台数量', type: 'danger' },
  { label: '被 AI 引用次数', value: currentClueDetail.value.quoteCount || currentClueDetail.value.aiQuoteCount || 0, desc: '模型回答引用该线索相关信源次数', type: 'warning' },
  { label: '影响模型数', value: currentClueDetail.value.modelCount || 0, desc: '受该线索影响的大模型数量', type: 'primary' },
  { label: '负面声量', value: currentClueDetail.value.negativeVolume || 0, desc: '负面内容和负面表达聚合量', type: 'danger' },
  { label: '最近活跃时间', value: currentClueDetail.value.recentActiveAt || currentClueDetail.value.lastQuotedAt || '-', desc: '最近一次发布或引用时间', type: 'primary' }
])

const clueSeverityRows = computed(() => [
  { label: '新增信源数', value: currentClueDetail.value.newSourceCount || 0, desc: '用于判断线索是否正在发酵，新增越多优先级越高。' },
  { label: '高权重信源数', value: currentClueDetail.value.highWeightSourceCount || 0, desc: '用于判断传播影响力，汽车垂媒、投诉平台、新闻媒体权重更高。' },
  { label: '被 AI 引用次数', value: currentClueDetail.value.quoteCount || currentClueDetail.value.aiQuoteCount || 0, desc: '用于判断该线索是否已经影响大模型回答。' },
  { label: '影响模型数', value: currentClueDetail.value.modelCount || 0, desc: '用于判断风险是否跨模型扩散。' },
  { label: '负面声量', value: currentClueDetail.value.negativeVolume || 0, desc: '用于判断用户讨论和负面表达规模。' },
  { label: '最近活跃时间', value: currentClueDetail.value.recentActiveAt || currentClueDetail.value.lastQuotedAt || '-', desc: '用于判断该线索是否仍在活跃。' }
])

const goSourceStats = (platform = '') => {
  const targetPlatform = typeof platform === 'string' ? platform : ''
  router.push({
    path: `/sentiment-project/${route.params.id}/sources`,
    query: targetPlatform ? { platform: targetPlatform } : {}
  })
}

const clearSourceFilters = () => {
  sourceListKeyword.value = ''
  sourceListPlatform.value = ''
  sourceListClue.value = ''
  if (section.value === 'sources' && (route.query.clue || route.query.platform)) {
    router.replace(`/sentiment-project/${route.params.id}/sources`)
  }
}

watch(() => route.fullPath, () => {
  if (section.value === 'sources' && !route.query.clue && !route.query.platform) {
    sourceListClue.value = ''
    sourceListPlatform.value = ''
  }
}, { immediate: true })

watch(() => route.query.platform, (platform) => {
  if (section.value === 'sources') {
    sourceListPlatform.value = platform || ''
  }
}, { immediate: true })

watch(() => route.query.clue, (clue) => {
  if (section.value === 'sources') sourceListClue.value = clue || ''
}, { immediate: true })

const sourceListRows = [
  {
    publishTime: '2026-05-29 09:18',
    platform: '汽车之家',
    quoteCount: 5,
    account: '汽车之家评测',
    articleTitle: '奥迪E7X与智己LS7平台参数对比引发讨论',
    articleUrl: 'https://www.autohome.com.cn/news/202605/29-audi-e7x-ls7.html',
    sentiment: '负面',
    topic: '换壳争议',
    negativeSummary: '质疑产品原创性和官方说明透明度。',
    keywords: ['换壳', '平台相似', '配置争议'],
    relevance: '高度相关'
  },
  {
    publishTime: '2026-05-29 10:06',
    platform: '懂车帝',
    quoteCount: 4,
    account: '新能源车观察',
    articleTitle: '奥迪E7X是否只是智己LS7换标？评论区争议升温',
    articleUrl: 'https://www.dongchedi.com/article/7382910471201',
    sentiment: '负面',
    topic: '购买影响',
    negativeSummary: '价格溢价和换标认知影响潜在购买。',
    keywords: ['换标', '溢价', '购买犹豫'],
    relevance: '高度相关'
  },
  {
    publishTime: '2026-05-29 10:42',
    platform: '小红书',
    quoteCount: 4,
    account: '车主小记',
    articleTitle: '奥迪E7X配置表和智己LS7有哪些相似点',
    articleUrl: 'https://www.xiaohongshu.com/explore/20260529-audi-e7x',
    sentiment: '中性',
    topic: '配置对比',
    negativeSummary: '暗含配置差异不足的疑虑。',
    keywords: ['配置相似', '智驾差异'],
    relevance: '相关'
  },
  {
    publishTime: '2026-05-29 11:15',
    platform: '知乎',
    quoteCount: 3,
    account: '车圈研究员',
    articleTitle: '如何看待奥迪E7X与智己LS7的平台共用争议',
    articleUrl: 'https://www.zhihu.com/question/20260529001',
    sentiment: '中性',
    topic: '事件核查',
    negativeSummary: '争议仍可能被简化为换壳标签传播。',
    keywords: ['平台共用', '换壳标签'],
    relevance: '高度相关'
  },
  {
    publishTime: '2026-05-29 12:30',
    platform: '搜狐汽车',
    quoteCount: 3,
    account: '搜狐汽车快讯',
    articleTitle: '奥迪E7X上市传播遇网友质疑 官方回应仍待补充',
    articleUrl: 'https://auto.sohu.com/a/20260529-audi-e7x',
    sentiment: '负面',
    topic: '回应不足',
    negativeSummary: '官方解释不足被媒体放大。',
    keywords: ['网友质疑', '官方回应'],
    relevance: '高度相关'
  },
  {
    publishTime: '2026-05-29 13:22',
    platform: '微博热搜',
    quoteCount: 2,
    account: '汽车话题榜',
    articleTitle: '换壳车值不值得买相关话题热度上升',
    articleUrl: 'https://weibo.com/hot/audi-e7x-topic',
    sentiment: '负面',
    topic: '社媒扩散',
    negativeSummary: '负面标签在社媒传播速度较快。',
    keywords: ['换壳车', '值不值得买'],
    relevance: '高度相关'
  },
  {
    publishTime: '2026-05-29 14:05',
    platform: '黑猫投诉',
    quoteCount: 2,
    account: '用户投诉聚合',
    articleTitle: '用户投诉宣传材料未充分说明车型技术来源',
    articleUrl: 'https://tousu.sina.com.cn/complaint/view/202605290001',
    sentiment: '负面',
    topic: '合规风险',
    negativeSummary: '可能形成宣传误导相关投诉风险。',
    keywords: ['宣传误导', '技术来源'],
    relevance: '高度相关'
  },
  {
    publishTime: '2026-05-29 15:16',
    platform: '易车',
    quoteCount: 2,
    account: '易车原创',
    articleTitle: '奥迪E7X实测：评论区仍追问换壳问题',
    articleUrl: 'https://news.yiche.com/hao/wenzhang/2026052901/',
    sentiment: '中性',
    topic: '测评评论',
    negativeSummary: '换壳追问干扰正常测评传播。',
    keywords: ['实测', '评论追问'],
    relevance: '相关'
  },
  {
    publishTime: '2026-05-29 16:20',
    platform: '今日头条',
    quoteCount: 1,
    account: '汽车商业评论',
    articleTitle: '豪华品牌新能源转型面临信任挑战',
    articleUrl: 'https://www.toutiao.com/article/7382910471202/',
    sentiment: '负面',
    topic: '品牌信任',
    negativeSummary: '影响品牌新能源定位和信任感。',
    keywords: ['信任挑战', '新能源转型'],
    relevance: '相关'
  },
  {
    publishTime: '2026-05-29 17:08',
    platform: '腾讯汽车',
    quoteCount: 1,
    account: '腾讯汽车观察',
    articleTitle: '奥迪E7X争议下品牌方应补充技术差异说明',
    articleUrl: 'https://auto.qq.com/a/20260529/001.htm',
    sentiment: '中性',
    topic: '处置建议',
    negativeSummary: '若持续缺少解释，误解会继续累积。',
    keywords: ['技术差异', '澄清建议'],
    relevance: '相关'
  },
  {
    publishTime: '2026-05-29 18:12',
    platform: '抖音',
    quoteCount: 2,
    account: '新能源车探店',
    articleTitle: '奥迪E7X和智己LS7内饰细节对比',
    articleUrl: 'https://www.douyin.com/video/7382910471203',
    sentiment: '负面',
    topic: '短视频扩散',
    negativeSummary: '同平台不同标的表达容易形成简化负面标签。',
    keywords: ['同平台', '不同标', '内饰对比'],
    relevance: '高度相关'
  },
  {
    publishTime: '2026-05-29 18:46',
    platform: '百家号',
    quoteCount: 1,
    account: '车市观察室',
    articleTitle: '豪华新能源产品需解释清楚技术来源',
    articleUrl: 'https://baijiahao.baidu.com/s?id=202605290001',
    sentiment: '负面',
    topic: '品牌信任',
    negativeSummary: '技术来源解释不足可能损伤高端品牌信任。',
    keywords: ['技术来源', '包装升级', '品牌信任'],
    relevance: '相关'
  },
  {
    publishTime: '2026-05-29 19:10',
    platform: 'B站',
    quoteCount: 2,
    account: '车圈拆解局',
    articleTitle: '公开参数拆解奥迪E7X和智己LS7差异',
    articleUrl: 'https://www.bilibili.com/video/BV20260529001',
    sentiment: '中性',
    topic: '事件核查',
    negativeSummary: '平台共用事实仍可能被用户继续解读为换壳。',
    keywords: ['公开参数', '平台共用', '调校差异'],
    relevance: '高度相关'
  },
  {
    publishTime: '2026-05-29 19:38',
    platform: '车质网',
    quoteCount: 1,
    account: '车质网资讯',
    articleTitle: '奥迪E7X宣传与真实技术差异引关注',
    articleUrl: 'https://www.12365auto.com/news/20260529.shtml',
    sentiment: '中性',
    topic: '投诉监测',
    negativeSummary: '若后续交付体验不佳，可能转化为投诉风险。',
    keywords: ['质量投诉', '宣传差异', '关注上升'],
    relevance: '相关'
  },
  {
    publishTime: '2026-05-29 20:05',
    platform: '微博',
    quoteCount: 2,
    account: '汽车行业爆料',
    articleTitle: '奥迪E7X争议折射合资豪华新能源转型压力',
    articleUrl: 'https://weibo.com/auto-insight/20260529002',
    sentiment: '负面',
    topic: '品牌转型',
    negativeSummary: '品牌溢价和新能源转型能力被质疑。',
    keywords: ['品牌溢价', '转型压力', '合资豪华'],
    relevance: '相关'
  },
  {
    publishTime: '2026-05-29 20:44',
    platform: '网易汽车',
    quoteCount: 1,
    account: '网易汽车频道',
    articleTitle: '平台合作是常见模式 但差异点披露仍需加强',
    articleUrl: 'https://auto.163.com/26/0529/20/audi-e7x.html',
    sentiment: '中性',
    topic: '处置建议',
    negativeSummary: '差异点披露不足会持续放大误解。',
    keywords: ['平台合作', '差异披露', '用户关切'],
    relevance: '相关'
  },
  {
    publishTime: '2026-05-29 21:16',
    platform: '汽车论坛',
    quoteCount: 3,
    account: 'E7X准车主讨论帖',
    articleTitle: '奥迪E7X准车主汇总参数价格和配置表',
    articleUrl: 'https://club.autohome.com.cn/bbs/thread/20260529001',
    sentiment: '负面',
    topic: '购买影响',
    negativeSummary: '配置和价格对比削弱购买理由。',
    keywords: ['准车主', '价格对比', '购买理由'],
    relevance: '高度相关'
  },
  {
    publishTime: '2026-05-29 21:52',
    platform: '微信公众号',
    quoteCount: 2,
    account: '汽车商业评论',
    articleTitle: '平台共用争议背后是品牌叙事与消费者预期落差',
    articleUrl: 'https://mp.weixin.qq.com/s/audi-e7x-20260529',
    sentiment: '中性',
    topic: '风险归因',
    negativeSummary: '消费者预期落差可能持续影响口碑。',
    keywords: ['品牌叙事', '消费者预期', '口碑落差'],
    relevance: '高度相关'
  }
]

const sourceListPlatforms = computed(() => [...new Set(sourceListRows.map(item => item.platform))])

const sourceListCards = computed(() => {
  const total = sourceListRows.length
  const negative = sourceListRows.filter(item => item.sentiment === '负面').length
  const highRelevant = sourceListRows.filter(item => item.relevance === '高度相关').length
  const quoteTotal = sourceListRows.reduce((sum, item) => sum + item.quoteCount, 0)
  return [
    { label: '信源总数', value: total, desc: `覆盖 ${sourceListPlatforms.value.length} 个发布平台`, type: 'primary' },
    { label: '负面信源', value: negative, desc: '情绪分析为负面的信源', type: 'danger' },
    { label: '高相关信源', value: highRelevant, desc: '与当前舆情高度相关', type: 'warning' },
    { label: '总引用次数', value: quoteTotal, desc: '被模型回答引用的累计次数', type: 'primary' }
  ]
})

const filteredSourceList = computed(() => {
  const keyword = sourceListKeyword.value.trim().toLowerCase()
  const clueRule = clueSourceRules[sourceListClue.value]
  const selectedPlatform = sourceListPlatforms.value.includes(sourceListPlatform.value) ? sourceListPlatform.value : ''
  const filterRows = (useClueRule = true) => sourceListRows.filter(item => {
    const matchPlatform = !selectedPlatform || item.platform === selectedPlatform
    const searchableValues = [
      item.platform,
      item.account,
      item.articleTitle,
      item.articleUrl,
      item.topic,
      item.negativeSummary,
      item.relevance,
      ...item.keywords
    ]
    const matchClue = !useClueRule || !clueRule ||
      clueRule.platforms.includes(item.platform) ||
      clueRule.keywords.some(ruleKeyword => searchableValues.some(value => String(value).includes(ruleKeyword)))
    const matchKeyword = !keyword || [
      ...searchableValues
    ].some(value => String(value).toLowerCase().includes(keyword))
    return matchPlatform && matchClue && matchKeyword
  })
  const rows = filterRows(true)
  const fallbackRows = rows.length ? rows : filterRows(false)
  return fallbackRows.length ? fallbackRows : sourceListRows
})

const questionListRows = [
  { id: 'Q001', question: '奥迪E7X与智己LS7换壳争议是否属实？', category: '事件核查', riskLevel: '高', status: '运行中', models: '6/6', askCount: 126, negativeRate: 82, sourceCount: 9, lastRunAt: '2026-05-29 09:30', owner: 'momo' },
  { id: 'Q002', question: '奥迪E7X最近有什么负面新闻？', category: '负面舆情', riskLevel: '高', status: '运行中', models: '6/6', askCount: 98, negativeRate: 76, sourceCount: 7, lastRunAt: '2026-05-29 09:31', owner: 'momo' },
  { id: 'Q003', question: '用户怎么看奥迪E7X与智己LS7的关系？', category: '用户口碑', riskLevel: '中', status: '运行中', models: '5/6', askCount: 84, negativeRate: 58, sourceCount: 6, lastRunAt: '2026-05-29 09:32', owner: 'zxy' },
  { id: 'Q004', question: '奥迪E7X被质疑换壳的原因是什么？', category: '风险归因', riskLevel: '高', status: '运行中', models: '6/6', askCount: 72, negativeRate: 79, sourceCount: 8, lastRunAt: '2026-05-29 09:33', owner: 'zxy' },
  { id: 'Q005', question: '换壳争议会不会影响用户购买奥迪E7X？', category: '购买影响', riskLevel: '中', status: '运行中', models: '5/6', askCount: 63, negativeRate: 64, sourceCount: 5, lastRunAt: '2026-05-29 09:34', owner: 'momo' },
  { id: 'Q006', question: '品牌应该如何回应奥迪E7X换壳争议？', category: '处置建议', riskLevel: '中', status: '运行中', models: '4/6', askCount: 45, negativeRate: 42, sourceCount: 4, lastRunAt: '2026-05-29 09:35', owner: 'admin' },
  { id: 'Q007', question: '奥迪E7X有没有配置缩水或虚假宣传问题？', category: '负面舆情', riskLevel: '高', status: '运行中', models: '6/6', askCount: 88, negativeRate: 73, sourceCount: 6, lastRunAt: '2026-05-29 09:36', owner: 'momo' },
  { id: 'Q008', question: '奥迪E7X和智己LS7哪个更值得买？', category: '购买影响', riskLevel: '低', status: '暂停', models: '3/6', askCount: 36, negativeRate: 28, sourceCount: 3, lastRunAt: '2026-05-28 18:30', owner: 'admin' },
  { id: 'Q009', question: '奥迪E7X车主投诉主要集中在哪些方面？', category: '服务投诉', riskLevel: '高', status: '运行中', models: '6/6', askCount: 69, negativeRate: 81, sourceCount: 7, lastRunAt: '2026-05-29 09:37', owner: 'zxy' },
  { id: 'Q010', question: '奥迪E7X官方技术说明是否足够清晰？', category: '官方回应', riskLevel: '中', status: '运行中', models: '5/6', askCount: 52, negativeRate: 55, sourceCount: 5, lastRunAt: '2026-05-29 09:38', owner: 'momo' }
]

const questionListCategories = computed(() => [...new Set(questionListRows.map(item => item.category))])

const questionListCards = computed(() => {
  const total = questionListRows.length
  const running = questionListRows.filter(item => item.status === '运行中').length
  const highRisk = questionListRows.filter(item => item.riskLevel === '高').length
  const avgNegative = Math.round(questionListRows.reduce((sum, item) => sum + item.negativeRate, 0) / total)

  return [
    { label: '问题总数', value: total, desc: `覆盖 ${questionListCategories.value.length} 个问题方向`, type: 'primary' },
    { label: '运行中', value: running, desc: '持续参与舆情监测的问题', type: 'primary' },
    { label: '高风险问题', value: highRisk, desc: '建议优先复核与处置', type: 'danger' },
    { label: '平均负面率', value: `${avgNegative}%`, desc: '按当前问题样本统计', type: 'warning' }
  ]
})

const filteredQuestionList = computed(() => {
  const keyword = questionListKeyword.value.trim().toLowerCase()
  return questionListRows.filter(item => {
    const matchCategory = !questionListCategory.value || item.category === questionListCategory.value
    const matchRisk = !questionListRiskLevel.value || item.riskLevel === questionListRiskLevel.value
    const matchKeyword = !keyword || [
      item.question,
      item.category,
      item.riskLevel,
      item.status,
      item.models,
      item.owner
    ].some(value => String(value).toLowerCase().includes(keyword))
    return matchCategory && matchRisk && matchKeyword
  })
})

const currentQuestionDetail = computed(() => {
  const id = route.query.qid
  const byId = questionListRows.find(item => item.id === id)
  const byQuestion = questionListRows.find(item => item.question === route.query.question)
  return byId || byQuestion || questionListRows[0]
})

const currentQuestionDetailCards = computed(() => [
  { label: '问题方向', value: currentQuestionDetail.value.category, desc: '当前问题所属分类', type: 'primary' },
  { label: '风险等级', value: currentQuestionDetail.value.riskLevel, desc: '按负面率和信源权重判断', type: currentQuestionDetail.value.riskLevel === '高' ? 'danger' : 'warning' },
  { label: '触发次数', value: currentQuestionDetail.value.askCount, desc: '近周期模型执行次数', type: 'primary' },
  { label: '负面率', value: `${currentQuestionDetail.value.negativeRate}%`, desc: '当前问题回答负面占比', type: currentQuestionDetail.value.negativeRate >= 70 ? 'danger' : 'warning' }
])

const currentQuestionExecutions = computed(() => {
  const question = currentQuestionDetail.value.question
  const summaries = [
    '回答集中提到换壳、平台共用和官方技术说明不足，存在较强负面叙事。',
    '模型引用汽车媒体和论坛内容，倾向认为品牌需要补充差异化说明。',
    '负面摘要聚焦价格溢价、配置相似和用户购买信心下降。',
    '回答建议通过官方 FAQ、第三方测评和销售端统一口径降低争议。'
  ]
  return ['豆包', 'DeepSeek', '通义千问', 'Kimi', '文心一言', '元宝'].map((model, index) => ({
    id: `${currentQuestionDetail.value.id}-EXEC-${index + 1}`,
    question,
    model,
    createdAt: `2026-05-29 09:${String(30 + index * 3).padStart(2, '0')}`,
    negativeSummary: summaries[index % summaries.length],
    conversation: conversationRecords[index % conversationRecords.length]
  }))
})

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

const conversationRecords = [
  {
    id: 'C-052901',
    model: '豆包',
    modelIcon: '豆',
    queryTime: '2026-06-02 09:18',
    queryTimeText: '大约 10 小时前',
    duration: '32.0 s',
    question: '奥迪E7X与智己LS7换壳争议是否属实？',
    answerSummary: '从平台共用、外观配置、品牌定位和官方披露角度分析争议，认为需要补充技术差异说明。',
    sentiment: '负面',
    brandCount: 8,
    sourceCount: 6,
    monitorRank: null,
    thinkingProcess: [
      '识别用户关心的是“换壳”是否属实，需要同时核查官方信息和第三方测评。',
      '检索公开报道、汽车媒体测评和论坛讨论，提取平台、配置、价格和品牌定位差异。',
      '综合官方说明与用户评论，判断争议核心在于技术来源披露和消费者预期落差。'
    ],
    answerParagraphs: [
      '综合公开资料来看，奥迪E7X与智己LS7存在平台合作和部分技术共用背景，但仅用“换壳”概括会过于简单。',
      '当前风险在于消费者对豪华品牌新能源产品的差异化预期较高，如果官方没有解释清楚底盘调校、智驾策略、服务体系和品牌定位差异，争议容易被简化传播。',
      '建议优先补充技术差异说明、配置对照表和研发参与信息，并在高权重汽车媒体和社区中同步澄清。'
    ],
    ranking: [
      { name: '上汽奥迪', rank: 1 },
      { name: '智己汽车', rank: 2 },
      { name: '奥迪', rank: 3 },
      { name: '智己LS7', rank: 4 },
      { name: '奥迪E7X', rank: 5 },
      { name: '上汽集团', rank: 6 },
      { name: '汽车之家', rank: 7 },
      { name: '懂车帝', rank: 8 }
    ],
    sources: [
      { title: '奥迪E7X与智己LS7平台参数对比引发讨论', url: 'https://www.autohome.com.cn/news/202605/29-audi-e7x-ls7.html' },
      { title: '奥迪E7X是否只是智己LS7换标？评论区争议升温', url: 'https://www.dongchedi.com/article/7382910471201' },
      { title: '如何看待奥迪E7X与智己LS7的平台共用争议', url: 'https://www.zhihu.com/question/20260529001' },
      { title: '奥迪E7X上市传播遇网友质疑 官方回应仍待补充', url: 'https://auto.sohu.com/a/20260529-audi-e7x' },
      { title: '奥迪E7X准车主汇总参数价格和配置表', url: 'https://club.autohome.com.cn/bbs/thread/20260529001' },
      { title: '平台共用争议背后是品牌叙事与消费者预期落差', url: 'https://mp.weixin.qq.com/s/audi-e7x-20260529' }
    ]
  },
  {
    id: 'C-052902',
    model: 'DeepSeek',
    modelIcon: 'D',
    queryTime: '2026-06-02 10:06',
    queryTimeText: '大约 10 小时前',
    duration: '45.6 s',
    question: '奥迪E7X争议会不会影响用户购买？',
    answerSummary: '判断争议会影响部分理性购车用户，尤其是关注价格溢价、技术来源和品牌差异的人群。',
    sentiment: '负面',
    brandCount: 7,
    sourceCount: 5,
    monitorRank: 1,
    thinkingProcess: [
      '拆解购买影响因素：价格、信任、技术差异、品牌溢价、交付体验。',
      '检索社媒评论和汽车论坛讨论，识别高频风险表达。',
      '评估争议对潜在购车用户的决策影响。'
    ],
    answerParagraphs: [
      '该争议会对部分用户形成购买阻力，尤其是原本看重豪华品牌溢价和技术差异的用户。',
      '如果后续官方能够清晰说明平台合作边界、奥迪参与研发内容和服务体验差异，影响可以被控制。',
      '短期建议在购车咨询、媒体测评和社群问答中主动回应“为什么值得买”的核心问题。'
    ],
    ranking: [
      { name: '奥迪E7X', rank: 1 },
      { name: '智己LS7', rank: 2 },
      { name: '上汽奥迪', rank: 3 },
      { name: '智己汽车', rank: 4 },
      { name: '汽车之家', rank: 5 },
      { name: '小红书', rank: 6 },
      { name: '今日头条', rank: 7 }
    ],
    sources: [
      { title: '奥迪E7X是否只是智己LS7换标？评论区争议升温', url: 'https://www.dongchedi.com/article/7382910471201' },
      { title: '奥迪E7X配置表和智己LS7有哪些相似点', url: 'https://www.xiaohongshu.com/explore/20260529-audi-e7x' },
      { title: '豪华品牌新能源转型面临信任挑战', url: 'https://www.toutiao.com/article/7382910471202/' },
      { title: '奥迪E7X准车主汇总参数价格和配置表', url: 'https://club.autohome.com.cn/bbs/thread/20260529001' },
      { title: '奥迪E7X争议折射合资豪华新能源转型压力', url: 'https://weibo.com/auto-insight/20260529002' }
    ]
  },
  {
    id: 'C-052903',
    model: '通义千问',
    modelIcon: '通',
    queryTime: '2026-06-02 11:15',
    queryTimeText: '大约 9 小时前',
    duration: '38.8 s',
    question: '奥迪E7X与智己LS7有哪些关键差异？',
    answerSummary: '回答从品牌定位、服务体系、调校策略、智能化配置和目标用户差异进行归纳。',
    sentiment: '中性',
    brandCount: 6,
    sourceCount: 4,
    monitorRank: 2,
    thinkingProcess: [
      '提取车型对比维度：品牌、配置、价格、技术、服务。',
      '优先引用汽车媒体测评和公开参数资料。',
      '形成差异化解释，避免直接强化负面标签。'
    ],
    answerParagraphs: [
      '两款车型的差异不能只看平台和外观，还应比较品牌定位、售后服务、配置组合、智能驾驶策略和调校取向。',
      '从舆情处置角度，品牌需要把这些差异转化为用户能理解的购买理由。',
      '建议发布标准化 FAQ，回应“平台共用是否等于换壳”“价格差异来自哪里”等问题。'
    ],
    ranking: [
      { name: '奥迪E7X', rank: 1 },
      { name: '智己LS7', rank: 2 },
      { name: '上汽奥迪', rank: 3 },
      { name: '智己汽车', rank: 4 },
      { name: '易车', rank: 5 },
      { name: 'B站', rank: 6 }
    ],
    sources: [
      { title: '公开参数拆解奥迪E7X和智己LS7差异', url: 'https://www.bilibili.com/video/BV20260529001' },
      { title: '奥迪E7X实测：评论区仍追问换壳问题', url: 'https://news.yiche.com/hao/wenzhang/2026052901/' },
      { title: '平台合作是常见模式 但差异点披露仍需加强', url: 'https://auto.163.com/26/0529/20/audi-e7x.html' },
      { title: '奥迪E7X与智己LS7平台参数对比引发讨论', url: 'https://www.autohome.com.cn/news/202605/29-audi-e7x-ls7.html' }
    ]
  },
  {
    id: 'C-052904',
    model: 'Kimi',
    modelIcon: 'K',
    queryTime: '2026-06-02 13:22',
    queryTimeText: '大约 8 小时前',
    duration: '29.4 s',
    question: '奥迪E7X舆情现在最需要优先处理什么？',
    answerSummary: '建议优先处理高权重信源、统一官方话术、补充技术差异证据并跟踪投诉平台。',
    sentiment: '负面',
    brandCount: 9,
    sourceCount: 6,
    monitorRank: null,
    thinkingProcess: [
      '识别当前风险传播渠道：汽车媒体、微博、论坛、投诉平台。',
      '按权重区分高影响信源和普通讨论。',
      '输出可执行的处置优先级。'
    ],
    answerParagraphs: [
      '当前最需要处理的是高权重信源中的“换壳”叙事，因为它会被后续模型回答和媒体摘要反复引用。',
      '建议优先发布技术差异说明，配合第三方测评、FAQ 和销售端统一口径。',
      '同时应监测黑猫投诉、车质网、微博热搜和汽车论坛，防止争议从认知问题升级为投诉问题。'
    ],
    ranking: [
      { name: '上汽奥迪', rank: 1 },
      { name: '奥迪E7X', rank: 2 },
      { name: '智己LS7', rank: 3 },
      { name: '黑猫投诉', rank: 4 },
      { name: '车质网', rank: 5 },
      { name: '微博', rank: 6 },
      { name: '汽车论坛', rank: 7 },
      { name: '腾讯汽车', rank: 8 },
      { name: '网易汽车', rank: 9 }
    ],
    sources: [
      { title: '用户投诉宣传材料未充分说明车型技术来源', url: 'https://tousu.sina.com.cn/complaint/view/202605290001' },
      { title: '奥迪E7X宣传与真实技术差异引关注', url: 'https://www.12365auto.com/news/20260529.shtml' },
      { title: '换壳车值不值得买相关话题热度上升', url: 'https://weibo.com/hot/audi-e7x-topic' },
      { title: '奥迪E7X争议下品牌方应补充技术差异说明', url: 'https://auto.qq.com/a/20260529/001.htm' },
      { title: '平台合作是常见模式 但差异点披露仍需加强', url: 'https://auto.163.com/26/0529/20/audi-e7x.html' },
      { title: '奥迪E7X准车主汇总参数价格和配置表', url: 'https://club.autohome.com.cn/bbs/thread/20260529001' }
    ]
  }
]

const conversationModels = computed(() => [...new Set(conversationRecords.map(item => item.model))])
const conversationQuestions = computed(() => [...new Set(conversationRecords.map(item => item.question))])
const filteredConversationRecords = computed(() => {
  const keyword = conversationKeyword.value.trim().toLowerCase()
  return conversationRecords.filter(item => {
    const matchModel = !conversationModelFilter.value || item.model === conversationModelFilter.value
    const matchQuestion = !conversationQuestionFilter.value || item.question === conversationQuestionFilter.value
    const matchKeyword = !keyword || [
      item.model,
      item.question,
      item.answerSummary,
      item.sentiment,
      ...item.answerParagraphs,
      ...item.ranking.map(brand => brand.name),
      ...item.sources.map(source => source.title)
    ].some(value => String(value).toLowerCase().includes(keyword))
    return matchModel && matchQuestion && matchKeyword
  })
})

const conversationAnswerText = (row) => row.answerParagraphs.join('  ')

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
  { id: 'Q001', question: '奥迪E7X与智己LS7换壳争议是否属实？', tag: '事件核查', askCount: 126, negativeRate: '82%', sourceCount: 9, models: '6/6', riskLevel: '高' },
  { id: 'Q002', question: '奥迪E7X最近有什么负面新闻？', tag: '负面舆情', askCount: 98, negativeRate: '76%', sourceCount: 7, models: '6/6', riskLevel: '高' },
  { id: 'Q005', question: '这个争议会不会影响用户购买？', tag: '购买影响', askCount: 63, negativeRate: '64%', sourceCount: 5, models: '5/6', riskLevel: '中' }
]

const issueCategories = ref([
  { name: '事件核查', color: '#ef4444' },
  { name: '负面舆情', color: '#f97316' },
  { name: '用户口碑', color: '#2563eb' },
  { name: '风险归因', color: '#7c3aed' },
  { name: '购买影响', color: '#16a34a' },
  { name: '处置建议', color: '#64748b' }
])

const issuePrompts = ref([
  { id: 1, text: '奥迪E7X与智己LS7换壳争议是否属实？', category: '事件核查', riskLevel: '高', status: 'enabled', createdAt: '2026.05.20' },
  { id: 2, text: '奥迪E7X最近有什么负面新闻？', category: '负面舆情', riskLevel: '高', status: 'enabled', createdAt: '2026.05.20' },
  { id: 3, text: '用户怎么看奥迪E7X与智己LS7的关系？', category: '用户口碑', riskLevel: '中', status: 'enabled', createdAt: '2026.05.21' },
  { id: 4, text: '奥迪E7X被质疑换壳的原因是什么？', category: '风险归因', riskLevel: '高', status: 'enabled', createdAt: '2026.05.21' },
  { id: 5, text: '换壳争议会不会影响用户购买奥迪E7X？', category: '购买影响', riskLevel: '中', status: 'enabled', createdAt: '2026.05.22' },
  { id: 6, text: '品牌应该如何回应奥迪E7X换壳争议？', category: '处置建议', riskLevel: '中', status: 'enabled', createdAt: '2026.05.22' },
  { id: 7, text: '奥迪E7X有没有配置缩水或虚假宣传问题？', category: '负面舆情', riskLevel: '高', status: 'enabled', createdAt: '2026.05.23' },
  { id: 8, text: '奥迪E7X和智己LS7哪个更值得买？', category: '购买影响', riskLevel: '低', status: 'enabled', createdAt: '2026.05.23' }
])

const riskCategories = ref([
  { name: '安全风险', color: '#ef4444' },
  { name: '质量争议', color: '#f97316' },
  { name: '服务投诉', color: '#2563eb' },
  { name: '合规风险', color: '#7c3aed' },
  { name: '口碑负面', color: '#64748b' }
])

const riskKeywords = ref([
  { id: 1, word: '换壳', category: '质量争议', level: '高', matchType: '包含', remark: '涉及产品原创性、配置相似度争议', status: 'enabled' },
  { id: 2, word: '虚假宣传', category: '合规风险', level: '高', matchType: '包含', remark: '涉及宣传口径和事实不一致', status: 'enabled' },
  { id: 3, word: '质量问题', category: '质量争议', level: '高', matchType: '包含', remark: '泛质量类风险表达', status: 'enabled' },
  { id: 4, word: '投诉', category: '服务投诉', level: '中', matchType: '包含', remark: '用户投诉和维权相关表达', status: 'enabled' },
  { id: 5, word: '维权', category: '服务投诉', level: '高', matchType: '包含', remark: '可能出现集中维权风险', status: 'enabled' },
  { id: 6, word: '不推荐', category: '口碑负面', level: '中', matchType: '包含', remark: '购买决策负面表达', status: 'enabled' },
  { id: 7, word: '安全隐患', category: '安全风险', level: '高', matchType: '包含', remark: '安全类高风险表达', status: 'enabled' },
  { id: 8, word: '召回', category: '安全风险', level: '高', matchType: '精确', remark: '召回相关信号', status: 'enabled' }
])

const monitorEditing = ref(false)
const alertEditing = ref(false)
const monitorEnabled = ref(true)
const monitorStatus = ref('持续监测')
const monitorAlertLevel = ref('紧急预警')
const monitorBasic = reactive({
  period: 'daily',
  askTimes: 2,
  executionMode: 'split',
  executionTime: '02:00',
  weekdays: ['mon'],
  startDate: '2026/05/12',
  intervalDays: 2,
  splitTimes: ['02:00', '14:00']
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

watch(
  () => monitorBasic.askTimes,
  value => {
    monitorBasic.splitTimes = generateEvenTimes(value)
  }
)

const collectChannel = ref('standard')
const monitorModels = reactive([
  { name: '豆包', enabled: true, deepThinking: true, allScreenshot: true, mentionScreenshot: false },
  { name: '元宝', enabled: true, deepThinking: true, allScreenshot: false, mentionScreenshot: true },
  { name: 'DeepSeek', enabled: true, deepThinking: true, allScreenshot: false, mentionScreenshot: false },
  { name: '通义千问', enabled: true, deepThinking: true, allScreenshot: true, mentionScreenshot: false },
  { name: '文心一言', enabled: true, deepThinking: false, allScreenshot: false, mentionScreenshot: false },
  { name: 'Kimi', enabled: true, deepThinking: false, allScreenshot: false, mentionScreenshot: true }
])

const monitorAlertRules = reactive({
  riskSourceCount: true,
  riskSourceCountTarget: 10,
  mentionCount: true,
  mentionCountTarget: 50,
  highWeightSource: true,
  coreRiskWord: true
})

const highWeightSourceConfig = reactive({
  triggerCount: 1,
  sources: [
    { id: 1, name: '人民网', level: '高', match: 'people.com.cn', matchType: '域名', remark: '央媒信源' },
    { id: 2, name: '新华网', level: '高', match: 'xinhuanet.com', matchType: '域名', remark: '央媒信源' },
    { id: 3, name: '央视新闻', level: '高', match: '央视新闻', matchType: '包含', remark: '高影响媒体账号' },
    { id: 4, name: '黑猫投诉', level: '高', match: '黑猫投诉', matchType: '包含', remark: '用户投诉集中平台' },
    { id: 5, name: '知乎', level: '中', match: 'zhihu.com', matchType: '域名', remark: '问答社区高影响来源' },
    { id: 6, name: '微博热搜', level: '中', match: '微博热搜', matchType: '包含', remark: '传播热度高' }
  ]
})

const monitorReportOptions = reactive({ daily: true, weekly: true, monthly: false })

const issueCategoryCounts = computed(() => issueCategories.value.map(category => ({
  ...category,
  count: issuePrompts.value.filter(item => item.category === category.name).length
})))

const filteredIssueCategories = computed(() => {
  if (!issueCategoryKeyword.value) return issueCategoryCounts.value
  return issueCategoryCounts.value.filter(item => item.name.includes(issueCategoryKeyword.value))
})

const filteredIssuePrompts = computed(() => {
  let list = issuePrompts.value
  if (activeIssueCategory.value !== '所有') list = list.filter(item => item.category === activeIssueCategory.value)
  if (issueKeyword.value) list = list.filter(item => item.text.includes(issueKeyword.value) || item.category.includes(issueKeyword.value))
  return list
})

const riskCategoryCounts = computed(() => riskCategories.value.map(category => ({
  ...category,
  count: riskKeywords.value.filter(item => item.category === category.name).length
})))

const filteredRiskCategories = computed(() => {
  if (!riskCategoryKeyword.value) return riskCategoryCounts.value
  return riskCategoryCounts.value.filter(item => item.name.includes(riskCategoryKeyword.value))
})

const filteredRiskKeywords = computed(() => {
  let list = riskKeywords.value
  if (activeRiskCategory.value !== '全部') list = list.filter(item => item.category === activeRiskCategory.value)
  if (riskKeyword.value) list = list.filter(item => item.word.includes(riskKeyword.value) || item.category.includes(riskKeyword.value) || item.remark.includes(riskKeyword.value))
  return list
})

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
  { title: '监控主体', page: 'subject', desc: '配置品牌、产品、人物、机构或事件专项，以及别名和关联实体。' },
  { title: '风险词库', page: 'risk', desc: '维护负面词、争议词、投诉词、安全词和重点关注表达。' },
  { title: '问题方向', page: 'issue', desc: '维护负面舆情、事件核查、用户口碑、风险归因、购买影响等问题。' },
  { title: '监控配置', page: 'monitor', desc: '配置监控周期、执行时间、大模型覆盖和采集通道。' },
  { title: '预警配置', page: 'alert', desc: '配置主体状态、预警等级、触发条件和报告生成频率。' }
]

const openConfigDialog = (item) => {
  if (item.page === 'subject') {
    router.push(`/sentiment-project/${route.params.id}/config/subject`)
    return
  }
  if (item.page === 'risk') {
    router.push(`/sentiment-project/${route.params.id}/config/risk`)
    return
  }
  if (item.page === 'issue') {
    router.push(`/sentiment-project/${route.params.id}/config/issue`)
    return
  }
  if (item.page === 'monitor') {
    router.push(`/sentiment-project/${route.params.id}/config/monitor`)
    return
  }
  if (item.page === 'alert') {
    router.push(`/sentiment-project/${route.params.id}/config/alert`)
    return
  }
  ElMessage.info(`${item.title}配置弹窗待完善`)
}

const saveSubjectConfig = () => {
  subjectConfig.name = subjectForm.name
  subjectConfig.type = subjectForm.type
  subjectConfig.aliases = [...subjectForm.aliases]
  subjectConfig.entities = [...subjectForm.entities]
  subjectConfig.scopes = [...subjectForm.scopes]
  subjectConfig.riskDimensions = [...subjectForm.riskDimensions]
  subjectConfig.background = subjectForm.background
  currentProject.name = subjectConfig.name
  subjectDialogVisible.value = false
  ElMessage.success('监控主体配置已保存')
}

const handleSubjectEditSave = async () => {
  if (!subjectEditing.value) {
    subjectEditing.value = true
    return
  }

  try {
    await ElMessageBox.confirm('保存后会更新当前舆情项目的监控主体信息，是否确认保存？', '保存监控主体', {
      confirmButtonText: '确认保存',
      cancelButtonText: '取消',
      type: 'warning'
    })
    saveSubjectConfig()
    subjectEditing.value = false
  } catch {
    // 保持编辑态
  }
}

const handleIssueEditSave = async () => {
  if (!issueEditing.value) {
    issueEditing.value = true
    return
  }
  try {
    await ElMessageBox.confirm('保存后会立即影响舆情监控问题采集，是否确认保存？', '保存问题配置', {
      confirmButtonText: '确认保存',
      cancelButtonText: '取消',
      type: 'warning'
    })
    issueEditing.value = false
    ElMessage.success('舆情问题配置已保存')
  } catch {
    // 保持编辑态
  }
}

const openIssueExpandTool = () => {
  window.open('https://6zyknbc5d7.coze.site/', '_blank', 'noopener,noreferrer')
}

const openIssueDialog = (row) => {
  if (!issueEditing.value) return
  editingIssueId.value = row?.id || null
  issueForm.text = row?.text || ''
  issueForm.category = row?.category || issueCategories.value[0]?.name || '事件核查'
  issueForm.riskLevel = row?.riskLevel || '高'
  issueDialogVisible.value = true
}

const confirmIssue = () => {
  if (!issueEditing.value) return
  const rows = issueForm.text.split('\n').map(item => item.trim()).filter(Boolean)
  if (!rows.length) {
    ElMessage.warning('请输入需要监控的舆情问题')
    return
  }
  if (editingIssueId.value) {
    const target = issuePrompts.value.find(item => item.id === editingIssueId.value)
    if (target) {
      target.text = rows[0]
      target.category = issueForm.category
      target.riskLevel = issueForm.riskLevel
    }
  } else {
    rows.forEach((text, index) => {
      issuePrompts.value.unshift({
        id: Date.now() + index,
        text,
        category: issueForm.category,
        riskLevel: issueForm.riskLevel,
        status: 'enabled',
        createdAt: '2026.06.02'
      })
    })
  }
  editingIssueId.value = null
  issueForm.text = ''
  issueDialogVisible.value = false
}

const toggleIssue = (row) => {
  if (!issueEditing.value) return
  row.status = row.status === 'enabled' ? 'disabled' : 'enabled'
}

const removeIssue = (row) => {
  if (!issueEditing.value) return
  issuePrompts.value = issuePrompts.value.filter(item => item.id !== row.id)
}

const deleteSelectedIssues = () => {
  if (!issueEditing.value) return
  const ids = issueSelection.value.map(item => item.id)
  issuePrompts.value = issuePrompts.value.filter(item => !ids.includes(item.id))
}

const addIssueTag = () => {
  const name = issueTagForm.name.trim()
  if (name && !issueCategories.value.some(item => item.name === name)) {
    issueCategories.value.push({ name, color: issueTagForm.color })
  }
  issueTagForm.name = ''
  issueTagDialogVisible.value = false
}

const handleRiskEditSave = async () => {
  if (!riskEditing.value) {
    riskEditing.value = true
    return
  }
  try {
    await ElMessageBox.confirm('保存后会立即影响风险词命中和预警判断，是否确认保存？', '保存风险词库', {
      confirmButtonText: '确认保存',
      cancelButtonText: '取消',
      type: 'warning'
    })
    riskEditing.value = false
    ElMessage.success('风险词库已保存')
  } catch {
    // 保持编辑态
  }
}

const openRiskKeywordDialog = (row) => {
  if (!riskEditing.value) return
  editingRiskKeywordId.value = row?.id || null
  riskKeywordForm.word = row?.word || ''
  riskKeywordForm.category = row?.category || riskCategories.value[0]?.name || '安全风险'
  riskKeywordForm.level = row?.level || '高'
  riskKeywordForm.matchType = row?.matchType || '包含'
  riskKeywordForm.remark = row?.remark || ''
  riskKeywordDialogVisible.value = true
}

const confirmRiskKeyword = () => {
  if (!riskEditing.value) return
  const word = riskKeywordForm.word.trim()
  if (!word) {
    ElMessage.warning('请输入风险词')
    return
  }
  if (editingRiskKeywordId.value) {
    const target = riskKeywords.value.find(item => item.id === editingRiskKeywordId.value)
    if (target) Object.assign(target, { ...riskKeywordForm, word })
  } else {
    riskKeywords.value.unshift({
      id: Date.now(),
      word,
      category: riskKeywordForm.category,
      level: riskKeywordForm.level,
      matchType: riskKeywordForm.matchType,
      remark: riskKeywordForm.remark,
      status: 'enabled'
    })
  }
  editingRiskKeywordId.value = null
  riskKeywordForm.word = ''
  riskKeywordForm.remark = ''
  riskKeywordDialogVisible.value = false
}

const toggleRiskKeyword = (row) => {
  if (!riskEditing.value) return
  row.status = row.status === 'enabled' ? 'disabled' : 'enabled'
}

const removeRiskKeyword = (row) => {
  if (!riskEditing.value) return
  riskKeywords.value = riskKeywords.value.filter(item => item.id !== row.id)
}

const openQuestionDetail = (row) => {
  router.push({
    path: `/sentiment-project/${route.params.id}/question-detail`,
    query: { qid: row.id, question: row.question }
  })
}

const goQuestionList = () => {
  router.push(`/sentiment-project/${route.params.id}/question-list`)
}

const openQuestionExecutionDetail = (row) => {
  currentConversationRecord.value = {
    ...row.conversation,
    question: row.question,
    model: row.model,
    queryTime: row.createdAt,
    answerSummary: row.negativeSummary
  }
  conversationDetailVisible.value = true
}

const openConversationDetail = (row) => {
  currentConversationRecord.value = row
  conversationDetailVisible.value = true
}

const addRiskCategory = () => {
  const name = riskCategoryForm.name.trim()
  if (name && !riskCategories.value.some(item => item.name === name)) {
    riskCategories.value.push({ name, color: riskCategoryForm.color })
  }
  riskCategoryForm.name = ''
  riskCategoryDialogVisible.value = false
}

const handleScreenshotChange = (model, type, value) => {
  if (!value) return
  if (type === 'all') model.mentionScreenshot = false
  if (type === 'mention') model.allScreenshot = false
}

const handleMonitorEditSave = async () => {
  if (!monitorEditing.value) {
    monitorEditing.value = true
    return
  }

  try {
    await ElMessageBox.confirm('保存后会立即影响舆情监控任务的执行计划，是否确认保存当前监控配置？', '确认保存', {
      confirmButtonText: '确认保存',
      cancelButtonText: '取消',
      type: 'warning',
      closeOnClickModal: false,
      closeOnPressEscape: false
    })
    monitorEditing.value = false
    ElMessage.success('监控配置已保存')
  } catch {
    // 保持编辑态
  }
}

const handleAlertEditSave = async () => {
  if (!alertEditing.value) {
    alertEditing.value = true
    return
  }

  try {
    await ElMessageBox.confirm('保存后会立即影响舆情预警判断和报告生成，是否确认保存当前预警配置？', '确认保存', {
      confirmButtonText: '确认保存',
      cancelButtonText: '取消',
      type: 'warning',
      closeOnClickModal: false,
      closeOnPressEscape: false
    })
    alertEditing.value = false
    ElMessage.success('预警配置已保存')
  } catch {
    // 保持编辑态
  }
}

const openHighWeightSourceDialog = (row) => {
  if (!alertEditing.value) return
  editingHighWeightSourceId.value = row?.id || null
  highWeightSourceForm.name = row?.name || ''
  highWeightSourceForm.level = row?.level || '高'
  highWeightSourceForm.match = row?.match || ''
  highWeightSourceForm.matchType = row?.matchType || '包含'
  highWeightSourceForm.remark = row?.remark || ''
  highWeightSourceDialogVisible.value = true
}

const confirmHighWeightSource = () => {
  const name = highWeightSourceForm.name.trim()
  const match = highWeightSourceForm.match.trim()
  if (!name || !match) {
    ElMessage.warning('请输入信源名称和匹配内容')
    return
  }
  if (editingHighWeightSourceId.value) {
    const target = highWeightSourceConfig.sources.find(item => item.id === editingHighWeightSourceId.value)
    if (target) {
      Object.assign(target, {
        name,
        level: highWeightSourceForm.level,
        match,
        matchType: highWeightSourceForm.matchType,
        remark: highWeightSourceForm.remark
      })
    }
  } else {
    highWeightSourceConfig.sources.unshift({
      id: Date.now(),
      name,
      level: highWeightSourceForm.level,
      match,
      matchType: highWeightSourceForm.matchType,
      remark: highWeightSourceForm.remark
    })
  }
  editingHighWeightSourceId.value = null
  highWeightSourceForm.name = ''
  highWeightSourceForm.level = '高'
  highWeightSourceForm.match = ''
  highWeightSourceForm.remark = ''
  highWeightSourceDialogVisible.value = false
}

const removeHighWeightSource = (source) => {
  const index = highWeightSourceConfig.sources.findIndex(item => item.id === source.id)
  if (index >= 0) highWeightSourceConfig.sources.splice(index, 1)
}

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
.success-text { color: #22c55e !important; }
.warning-text { color: #f59e0b !important; font-weight: 700; }
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
.overview-section-title {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin: 4px 0 10px;
}
.overview-section-title strong {
  color: #111827;
  font-size: 16px;
}
.overview-section-title span {
  color: #8a95a6;
  font-size: 13px;
}
.metric-card, .chart-card, .content-card, .config-card { border: 1px solid #e5e7eb; border-radius: 8px; }
.metric-card { min-height: 112px; }
.metric-label { color: #909399; font-size: 13px; margin-bottom: 10px; }
.metric-value { color: #2b65f0; font-size: 26px; font-weight: 800; line-height: 1; }
.metric-value.danger, .summary-card .danger { color: #f56c6c; }
.metric-value.warning { color: #e6a23c; }
.metric-desc { margin-top: 10px; color: #64748b; font-size: 12px; }
.card-head { display: flex; justify-content: space-between; align-items: center; font-weight: 700; color: #111827; }
.title-with-help { display: inline-flex; align-items: center; gap: 6px; }
.title-with-help .el-icon { color: #94a3b8; cursor: help; }
.card-title-stack { display: flex; flex-direction: column; gap: 3px; }
.card-title-stack small { color: #64748b; font-size: 12px; font-weight: 500; }
.view-link { border: 0; background: transparent; color: #409eff; cursor: pointer; }
.trend-chart { height: 280px; display: flex; flex-direction: column; }
.source-trend-chart { height: 260px; display: flex; flex-direction: column; }
.trend-plot { flex: 1; min-height: 0; padding: 8px 12px 0; }
.trend-plot svg { width: 100%; height: 100%; display: block; }
.grid-line { stroke: #e5e7eb; stroke-width: 1; }
.trend-line { fill: none; stroke: #f56c6c; stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
.trend-dot { fill: #f56c6c; stroke: #fff; stroke-width: 2; }
.trend-label { fill: #f56c6c; font-size: 12px; font-weight: 700; }
.source-trend-line { fill: none; stroke: #2563eb; stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
.source-trend-bar { fill: rgba(37, 99, 235, 0.14); }
.source-trend-dot { fill: #2563eb; stroke: #fff; stroke-width: 2; }
.source-trend-label { fill: #2563eb; font-size: 12px; font-weight: 700; }
.axis-row { flex: 0 0 28px; display: flex; justify-content: space-between; padding: 2px 20px 0; color: #6b7280; font-size: 12px; }
.card-head small { color: #94a3b8; font-size: 12px; font-weight: 500; }
.rank-bars { display: flex; flex-direction: column; gap: 12px; padding: 8px 0; }
.rank-bar-item { display: grid; grid-template-columns: 112px 1fr; gap: 10px; align-items: center; font-size: 13px; color: #374151; }
.rank-bar-item div { position: relative; height: 24px; background: #f1f5f9; border-radius: 4px; overflow: hidden; }
.rank-bar-item i { display: block; height: 100%; background: linear-gradient(90deg, #f59e0b, #ef4444); }
.rank-bar-item b { position: absolute; right: 8px; top: 4px; color: #fff; font-size: 12px; }
.source-top-list { display: flex; flex-direction: column; gap: 7px; padding: 4px 0; }
.source-top-item {
  width: 100%;
  min-height: 28px;
  display: grid;
  grid-template-columns: 26px minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  border: 0;
  border-bottom: 1px solid #f1f5f9;
  background: transparent;
  color: #334155;
  text-align: left;
  cursor: pointer;
}
.source-top-item:hover .source-top-name { color: #2563eb; text-decoration: underline; text-underline-offset: 3px; }
.source-top-name { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13px; }
.source-top-item strong { color: #2563eb; font-size: 13px; }
.real-time-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}
.real-time-header h2 {
  margin: 0 0 8px;
  color: #111827;
  font-size: 24px;
}
.real-time-header p {
  margin: 0;
  color: #64748b;
  font-size: 14px;
}
.clue-filter-card {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 14px;
  padding: 12px 14px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
}
.clue-filter-note {
  color: #94a3b8;
  font-size: 12px;
}
.real-time-layout { align-items: stretch; }
.real-time-feed-card :deep(.el-card__body) {
  max-height: 690px;
  overflow-y: auto;
  padding-right: 20px;
}
.real-time-feed-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.real-time-feed-item {
  padding: 18px 20px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #fff;
}
.real-time-feed-item.risk-high {
  border-color: #fecaca;
  background: #fffafa;
}
.real-time-feed-item.risk-medium {
  border-color: #fed7aa;
  background: #fffaf2;
}
.real-time-feed-item.risk-low {
  border-color: #bbf7d0;
  background: #f8fffb;
}
.feed-meta-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}
.feed-meta-left,
.feed-source {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #64748b;
  font-size: 13px;
}
.feed-source span {
  padding: 4px 10px;
  border-radius: 6px;
  background: #f1f5f9;
}
.feed-source b { font-size: 12px; }
.real-time-feed-item h3 {
  margin: 0 0 8px;
  color: #111827;
  font-size: 17px;
  line-height: 1.5;
}
.real-time-feed-item p {
  margin: 0;
  color: #334155;
  font-size: 14px;
  line-height: 1.8;
}
.feed-linked-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
  color: #94a3b8;
  font-size: 12px;
}
.feed-linked-row button {
  border: 0;
  border-radius: 6px;
  padding: 3px 8px;
  background: #eff6ff;
  color: #2563eb;
  cursor: pointer;
  font-size: 12px;
}
.feed-linked-row button:hover { text-decoration: underline; text-underline-offset: 2px; }
.feed-actions {
  display: flex;
  justify-content: flex-end;
  gap: 14px;
  margin-top: 12px;
}
.feed-actions button {
  border: 0;
  background: transparent;
  color: #2563eb;
  cursor: pointer;
  font-size: 13px;
}
.real-time-side-card + .real-time-side-card { margin-top: 16px; }
.real-time-trend-chart {
  height: 300px;
  display: flex;
  flex-direction: column;
}
.real-time-trend-chart svg {
  width: 100%;
  flex: 1;
  min-height: 0;
}
.real-time-high-line,
.real-time-medium-line {
  fill: none;
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.real-time-high-line { stroke: #ef4444; }
.real-time-medium-line { stroke: #f59e0b; }
.real-time-high-dot { fill: #ef4444; stroke: #fff; stroke-width: 2; }
.real-time-medium-dot { fill: #f59e0b; stroke: #fff; stroke-width: 2; }
.real-time-legend {
  display: flex;
  justify-content: center;
  gap: 18px;
  color: #64748b;
  font-size: 12px;
}
.real-time-legend span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.real-time-legend i {
  width: 18px;
  height: 8px;
  display: inline-block;
  border: 2px solid;
}
.real-time-legend .high { border-color: #ef4444; }
.real-time-legend .medium { border-color: #f59e0b; }
.spread-path {
  position: relative;
  display: grid;
  gap: 18px;
  padding-left: 14px;
}
.spread-path::before {
  content: "";
  position: absolute;
  left: 8px;
  top: 12px;
  bottom: 12px;
  width: 2px;
  background: #e5e7eb;
}
.spread-path-item {
  position: relative;
  display: grid;
  grid-template-columns: 18px 1fr;
  gap: 12px;
}
.path-dot {
  position: relative;
  z-index: 1;
  width: 14px;
  height: 14px;
  margin-top: 4px;
  border-radius: 999px;
  background: #cbd5e1;
}
.spread-path-item.media .path-dot { background: #fb923c; }
.spread-path-item.model .path-dot { background: #f87171; }
.spread-path-item strong {
  color: #334155;
  font-size: 13px;
}
.spread-path-item small {
  margin-left: 6px;
  color: #94a3b8;
}
.spread-path-item p {
  margin: 8px 0 0;
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #f8fafc;
  color: #334155;
  line-height: 1.6;
}
.spread-path-item.media p {
  border-color: #fed7aa;
  background: #fff7ed;
}
.spread-path-item.model p {
  border-color: #fecaca;
  background: #fef2f2;
  color: #991b1b;
}
.clue-pool-card :deep(.el-card__body) { padding-top: 12px; }
.clue-tabs :deep(.el-tabs__header) { margin: 0 0 10px; }
.clue-tabs :deep(.el-tabs__nav-wrap::after) { height: 1px; background: #e5e7eb; }
.clue-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 12px;
}
.clue-summary-item {
  padding: 12px 14px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f8fafc;
}
.clue-summary-item span {
  display: block;
  margin-bottom: 6px;
  color: #64748b;
  font-size: 12px;
}
.clue-summary-item strong {
  color: #2563eb;
  font-size: 22px;
  line-height: 1;
}
.clue-summary-item strong.danger { color: #ef4444; }
.clue-summary-item strong.warning { color: #f59e0b; }
.clue-summary-item p {
  margin: 7px 0 0;
  color: #94a3b8;
  font-size: 12px;
}
.clue-title { color: #111827; }
.clue-detail-card :deep(.el-card__body) { padding-top: 14px; }
.clue-detail-desc {
  margin: 0 0 14px;
  color: #334155;
  font-size: 14px;
  line-height: 1.8;
}
.severity-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 10px;
}
.severity-item {
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f8fafc;
}
.severity-item span {
  display: block;
  color: #64748b;
  font-size: 12px;
  margin-bottom: 8px;
}
.severity-item strong {
  display: block;
  color: #2563eb;
  font-size: 20px;
  line-height: 1.2;
  word-break: break-word;
}
.severity-item strong.danger { color: #ef4444; }
.severity-item strong.warning { color: #f59e0b; }
.severity-item p {
  margin: 8px 0 0;
  color: #94a3b8;
  font-size: 12px;
  line-height: 1.5;
}
.severity-label { color: #475569; }
.clue-detail-section {
  display: grid;
  gap: 8px;
  margin-bottom: 16px;
}
.clue-detail-section > span {
  color: #64748b;
  font-size: 13px;
  font-weight: 700;
}
.clue-detail-section p {
  margin: 0;
  color: #334155;
  line-height: 1.8;
  font-size: 14px;
}
.muted-text { color: #94a3b8; font-size: 12px; }
.insight-list { margin: 0; padding-left: 18px; color: #334155; line-height: 1.9; font-size: 14px; }
.source-cell { display: flex; flex-direction: column; gap: 4px; }
.source-cell span { color: #94a3b8; font-size: 12px; }
.source-list-card { overflow: hidden; }
.keyword-tags { display: flex; flex-wrap: wrap; gap: 4px; }
.source-link { color: #2563eb; text-decoration: none; font-weight: 600; }
.source-link:hover { text-decoration: underline; text-underline-offset: 3px; }
.source-url { color: #64748b; font-weight: 500; }
.conversation-manage-card { padding: 0; }
.conversation-tabs :deep(.el-tabs__header) { margin-bottom: 16px; }
.conversation-card-filter { width: 320px; margin-bottom: 14px; }
.conversation-card-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; }
.conversation-preview-card {
  min-height: 148px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f8fafc;
  text-align: left;
  cursor: pointer;
  transition: border-color .16s ease, box-shadow .16s ease, transform .16s ease;
}
.conversation-preview-card:hover { border-color: #93c5fd; box-shadow: 0 8px 18px rgba(37, 99, 235, .12); transform: translateY(-1px); }
.conversation-preview-title { display: flex; align-items: center; gap: 8px; min-width: 0; }
.conversation-preview-title strong { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #111827; font-size: 14px; }
.model-badge {
  width: 20px;
  height: 20px;
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: #e0e7ff;
  color: #2563eb;
  font-size: 12px;
  font-weight: 800;
}
.conversation-preview-card p {
  flex: 1;
  margin: 0;
  color: #64748b;
  font-size: 13px;
  line-height: 1.7;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.conversation-preview-meta { display: flex; justify-content: space-between; gap: 12px; color: #94a3b8; font-size: 12px; }
.conversation-table-filters {
  display: grid;
  grid-template-columns: 260px 260px 72px;
  gap: 10px;
  align-items: center;
  margin-bottom: 12px;
}
.conversation-result-table {
  border: 1px solid #edf2f7;
  border-bottom: 0;
}
.conversation-result-table :deep(.el-table__row) { cursor: pointer; }
.conversation-result-table :deep(.el-table__cell) { vertical-align: middle; }
.table-answer-cell {
  max-height: 120px;
  overflow: hidden;
  color: #334155;
  font-size: 12px;
  line-height: 1.55;
}
.table-rank-cell {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}
.table-rank-status {
  width: fit-content;
  align-self: center;
  font-weight: 700;
}
.rank-track {
  position: relative;
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  align-items: center;
  gap: 0;
  padding: 0 4px;
}
.rank-line {
  position: absolute;
  left: 8px;
  right: 8px;
  top: 50%;
  height: 2px;
  background: #d1d5db;
  transform: translateY(-50%);
}
.rank-dot {
  position: relative;
  z-index: 1;
  width: 7px;
  height: 7px;
  justify-self: center;
  border-radius: 999px;
  background: #c5cad3;
}
.rank-dot.active {
  width: 12px;
  height: 12px;
  background: #10b981;
  box-shadow: 0 0 0 4px rgba(16, 185, 129, .12);
}
.rank-brand-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  max-height: 36px;
  overflow: hidden;
}
.rank-brand-list span {
  padding: 1px 5px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  background: #fff;
  color: #475569;
  font-size: 10px;
  line-height: 1.5;
}
.conversation-dialog-meta { display: flex; flex-direction: column; align-items: flex-start; gap: 4px; margin: 0; color: #8a95a6; }
.conversation-dialog-meta div { display: flex; align-items: center; gap: 12px; }
.conversation-dialog-meta span { font-size: 16px; font-weight: 800; color: #8a95a6; }
.conversation-dialog-meta strong { color: #111827; font-size: 16px; }
.conversation-dialog-meta p { margin: 0; color: #94a3b8; font-size: 13px; }
.conversation-dialog-layout { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 28px; align-items: start; }
.conversation-answer-area { min-width: 0; }
.conversation-question-row { display: flex; justify-content: flex-end; align-items: center; gap: 14px; margin: 0 28px 14px 0; }
.conversation-question-bubble { max-width: 440px; padding: 16px 24px; border-radius: 10px; background: #3b9af8; color: #fff; font-weight: 800; line-height: 1.5; box-shadow: 0 12px 26px rgba(59, 154, 248, .18); }
.conversation-question-icon { width: 54px; height: 54px; border-radius: 50%; background: #2994f6; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 16px; }
.conversation-answer-wrap { display: grid; grid-template-columns: 60px minmax(0, 1fr); gap: 16px; align-items: start; }
.conversation-model-avatar { width: 48px; height: 48px; border-radius: 50%; background: #020617; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 20px; margin-top: 20px; }
.conversation-answer-card { min-height: 430px; padding: 22px 26px; border: 1px solid #e5e7eb; border-radius: 10px; background: #f8fbff; box-shadow: 0 10px 24px rgba(15, 23, 42, .04); }
.answer-title-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding-bottom: 12px; border-bottom: 1px solid #e5e7eb; }
.answer-title-row strong { color: #111827; font-size: 17px; }
.answer-time { margin: 12px 0 14px; color: #8a95a6; font-size: 13px; }
.thinking-process { margin: 12px 0 18px; padding: 14px 16px; border: 1px solid #e5e7eb; border-radius: 8px; background: #fff; }
.thinking-title { margin-bottom: 12px; color: #111827; font-weight: 800; }
.thinking-step { display: grid; grid-template-columns: 14px minmax(0, 1fr); gap: 12px; padding: 8px 0; color: #475569; line-height: 1.7; }
.thinking-step p { margin: 0; }
.thinking-dot { width: 7px; height: 7px; margin-top: 10px; border-radius: 50%; background: #94a3b8; }
.conversation-answer-content { color: #334155; font-size: 14px; line-height: 1.9; }
.conversation-answer-content p { margin: 0 0 12px; }
.conversation-detail-side { display: grid; gap: 14px; max-height: 74vh; overflow: auto; padding-right: 4px; }
.conversation-detail-side h4 { margin: 0 0 8px; color: #111827; font-size: 15px; }
.side-rank-item { display: grid; grid-template-columns: minmax(0, 1fr) 34px; align-items: center; gap: 8px; padding: 9px 10px; border: 1px solid #e5e7eb; border-radius: 7px; background: #fff; color: #334155; }
.side-rank-item span { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.side-rank-item b { height: 28px; display: inline-flex; align-items: center; justify-content: center; border-radius: 8px; background: #dbeafe; color: #2563eb; }
.source-item { display: block; padding: 9px 10px; border: 1px solid #e5e7eb; border-radius: 7px; margin-bottom: 7px; background: #fff; color: inherit; text-decoration: none; cursor: pointer; transition: border-color .16s ease, box-shadow .16s ease, background .16s ease; }
.source-item:hover { border-color: #93c5fd; background: #eff6ff; box-shadow: 0 6px 14px rgba(37, 99, 235, .12); }
.source-item:hover strong { color: #2563eb; text-decoration: underline; text-underline-offset: 3px; }
.source-item strong { display: block; color: #111827; font-size: 12px; line-height: 1.35; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.source-item span { display: block; margin-top: 4px; color: #64748b; font-size: 12px; line-height: 1.35; word-break: break-all; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
:deep(.sentiment-conversation-dialog .el-dialog__body) { max-height: 86vh; overflow: auto; padding: 0 18px 18px; }
:deep(.sentiment-conversation-dialog .el-dialog__header) { padding: 10px 54px 6px 18px; margin-right: 0; min-height: 54px; display: flex; align-items: flex-start; }
:deep(.sentiment-conversation-dialog .el-dialog__headerbtn) { top: 8px; }
:deep(.sentiment-conversation-dialog .el-dialog__title) { display: none; }
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
.issue-config-panel {
  margin-top: 4px;
  padding: 18px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
}
.issue-config-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 14px;
  margin-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
}
.issue-config-header h2 { margin: 0 0 6px; color: #111827; font-size: 20px; }
.issue-config-header p { margin: 0; color: #64748b; font-size: 13px; }
.issue-config-layout {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  gap: 16px;
  align-items: stretch;
}
.issue-category-panel,
.issue-table-panel {
  min-width: 0;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
}
.issue-category-panel { padding: 14px; }
.issue-category-top { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 8px; }
.issue-category-list { margin-top: 14px; display: flex; flex-direction: column; gap: 6px; }
.issue-category {
  height: 38px;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 8px;
  padding: 0 10px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: #334155;
  text-align: left;
  cursor: pointer;
}
.issue-category.all { grid-template-columns: 1fr auto; background: #f8fafc; font-weight: 800; }
.issue-category.selected { background: #eef4ff; color: #2563eb; font-weight: 800; }
.issue-category i { width: 10px; height: 10px; border-radius: 999px; }
.issue-category span { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.issue-table-panel { padding: 14px; }
.issue-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
.issue-search { width: 240px; }
.issue-actions { display: flex; align-items: center; gap: 8px; }
.ai-btn { color: #7c3aed; border-color: #c4b5fd; background: #fbf7ff; }
.issue-table { width: 100%; border: 1px solid #e5e7eb; border-bottom: none; }
.issue-status { font-weight: 800; }
.issue-status.enabled { color: #16a34a; }
.issue-status.disabled { color: #64748b; }
.issue-pagination { display: flex; align-items: center; justify-content: space-between; padding: 14px 2px 0; color: #8b94a3; font-size: 13px; }
.subject-summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 14px;
  margin: 0 0 14px;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f8fafc;
}
.subject-summary > div { min-width: 0; }
.subject-summary span { display: block; margin-bottom: 4px; color: #94a3b8; font-size: 12px; }
.subject-summary strong { display: block; color: #111827; font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.subject-summary .summary-wide { grid-column: 1 / -1; }
.tag-list { display: flex; flex-wrap: wrap; gap: 6px; }
.subject-form :deep(.el-form-item__label) { font-weight: 700; color: #334155; }
.scope-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px 12px; width: 100%; }
.scope-grid :deep(.el-checkbox) { margin-right: 0; }
.upload-icon { font-size: 28px; color: #409eff; }
.risk-keyword-panel {
  padding: 18px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
}
.risk-layout {
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
  gap: 16px;
}
.risk-table-panel {
  min-width: 0;
  padding: 14px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
}
.sentiment-monitor-config {
  position: relative;
  min-height: calc(100vh - 150px);
  padding: 28px 48px 64px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  box-sizing: border-box;
}
.monitor-edit-btn {
  position: absolute;
  right: 48px;
  top: 28px;
  min-width: 72px;
  height: 40px;
  border-radius: 4px;
}
.monitor-config-section {
  margin-bottom: 44px;
}
.monitor-basic-section {
  padding-right: 90px;
}
.monitor-section-title,
.monitor-section-title-row {
  border-left: 4px solid #1f2937;
  padding-left: 10px;
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 22px;
  display: flex;
  align-items: center;
  gap: 14px;
  line-height: 1;
}
.monitor-section-title-row {
  border-left: 0;
  padding-left: 0;
}
.monitor-section-title-row .monitor-section-title {
  margin-bottom: 0;
}
.monitor-form-row {
  display: flex;
  align-items: center;
  gap: 16px 24px;
  flex-wrap: wrap;
  margin: 0 0 16px 34px;
  max-width: 1060px;
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
.status-select {
  width: 136px;
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
  background: #fff;
  color: #1f2937;
  text-align: left;
  cursor: pointer;
  box-sizing: border-box;
  transition: border-color 0.18s ease, background-color 0.18s ease, box-shadow 0.18s ease;
}
.channel-option:hover:not(:disabled) {
  border-color: #60a5fa;
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.14);
}
.channel-option.active {
  border-color: #2563eb;
  background: #eff6ff;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.14);
}
.channel-option:disabled {
  cursor: default;
  opacity: 1;
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
  color: #fff;
}
.channel-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.channel-name {
  font-size: 16px;
  font-weight: 800;
  line-height: 22px;
  color: #111827;
}
.channel-tag {
  display: inline-flex;
  padding: 2px 8px;
  border-radius: 999px;
  background: #f1f5f9;
  color: #475569;
  font-size: 12px;
  font-weight: 600;
  line-height: 18px;
}
.channel-option.active .channel-name {
  color: #1d4ed8;
}
.channel-option.active .channel-tag {
  background: #2563eb;
  color: #fff;
}
.channel-features {
  display: block;
  margin-top: 8px;
  color: #475569;
  font-size: 13px;
  line-height: 18px;
  font-weight: 500;
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
  grid-template-columns: repeat(3, minmax(160px, 1fr));
  gap: 16px;
  align-items: stretch;
  max-width: 980px;
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
  border-color: #2563eb;
  background: #eff6ff;
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
.child-check {
  margin-right: 0;
}
.screenshot-checks {
  display: flex;
  align-items: center;
  gap: 18px;
  flex-wrap: wrap;
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
.alert-rule-layout {
  margin: 18px 0 0 34px;
  max-width: 980px;
  display: grid;
  grid-template-columns: repeat(2, minmax(280px, 1fr));
  gap: 14px;
}
.alert-rule-card {
  padding: 16px 18px;
  border: 1px solid #dbe3ee;
  border-radius: 8px;
  background: #f8fafc;
}
.alert-rule-card.disabled {
  opacity: 0.72;
}
.alert-rule-title {
  margin-bottom: 12px;
  color: #111827;
  font-size: 15px;
  font-weight: 800;
}
.alert-rule-row {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 36px;
  margin-bottom: 10px;
}
.alert-rule-row:last-child {
  margin-bottom: 0;
}
.source-prefix {
  color: #475569;
  font-weight: 600;
}
.source-section-title {
  justify-content: space-between;
  max-width: 980px;
}
.source-table-panel {
  margin-left: 34px;
  max-width: 980px;
  padding: 14px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
}
.high-source-explain {
  margin-bottom: 0;
}
.high-source-explain-card {
  margin-left: 34px;
  max-width: 980px;
  padding: 16px;
  border: 1px solid #dbe3ee;
  border-radius: 8px;
  background: #fff;
  color: #475569;
  font-size: 14px;
  line-height: 1.7;
}
.high-source-explain-card p {
  margin: 12px 0 0;
}
.source-grade-heading {
  margin-bottom: 12px;
  color: #0f172a;
  font-size: 18px;
  font-weight: 800;
}
.source-grade-table {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  border: 1px solid #cbd5e1;
}
.source-grade-head,
.source-grade-cell {
  min-height: 44px;
  display: flex;
  align-items: center;
  padding: 10px 16px;
  border-right: 1px solid #cbd5e1;
  border-bottom: 1px solid #cbd5e1;
  font-size: 14px;
  line-height: 1.5;
}
.source-grade-head:nth-child(2n),
.source-grade-cell:nth-child(2n) {
  border-right: 0;
}
.source-grade-cell:nth-last-child(-n + 2) {
  border-bottom: 0;
}
.source-grade-head {
  background: #eff4f9;
  color: #17345f;
  font-size: 15px;
  font-weight: 800;
}
.source-grade-cell {
  color: #0f172a;
}
.source-grade-cell:nth-child(2n + 1) {
  font-weight: 800;
}
.grade-s {
  background: #fff1f2;
  color: #8b0000;
}
.grade-a {
  background: #fff7ed;
  color: #9a3412;
}
.grade-b {
  background: #fefce8;
  color: #854d0e;
}
.grade-c {
  background: #f8fafc;
  color: #0f172a;
}
.metric-number {
  width: 110px;
  flex: 0 0 auto;
}
.unit {
  font-weight: 600;
  color: #111827;
}
.report-options {
  display: grid;
  grid-template-columns: repeat(3, 120px);
  gap: 20px;
  padding-left: 34px;
}
.sentiment-monitor-config :deep(.el-checkbox.is-disabled),
.sentiment-monitor-config :deep(.el-checkbox.is-disabled .el-checkbox__label) {
  color: #334155;
  cursor: default;
  opacity: 1;
}
.sentiment-monitor-config :deep(.el-input.is-disabled .el-input__wrapper),
.sentiment-monitor-config :deep(.el-select .el-input.is-disabled .el-input__wrapper),
.sentiment-monitor-config :deep(.el-input-number.is-disabled .el-input__wrapper) {
  background-color: #f8fafc;
  border: 1px solid #d7dee8;
  box-shadow: none;
  opacity: 1;
}
.sentiment-monitor-config :deep(.el-input.is-disabled .el-input__inner),
.sentiment-monitor-config :deep(.el-select .el-input.is-disabled .el-input__inner),
.sentiment-monitor-config :deep(.el-input-number.is-disabled .el-input__inner) {
  color: #334155;
  -webkit-text-fill-color: #334155;
}
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


