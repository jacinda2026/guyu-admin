<template>
  <div class="monitor-task-page">
    <template v-if="!isDetailPage">
    <div class="page-toolbar">
      <div class="toolbar-title">
        <h2>监控任务</h2>
        <p>当前项目的执行记录、达标结果、未来排期、复测任务和监控报告</p>
      </div>
      <div class="toolbar-actions">
        <el-input v-model="keyword" clearable placeholder="搜索任务名称 / 任务ID" :prefix-icon="Search" class="search-input" />
        <el-button plain><el-icon><Refresh /></el-icon>刷新</el-button>
      </div>
    </div>

    <el-card shadow="never" class="plan-card">
      <template #header>
        <div class="section-header">
          <div>
            <span class="section-title">计划执行</span>
            <span class="section-subtitle">展示未来几条定时监控计划，便于确认后续任务是否已排期</span>
          </div>
          <el-tag type="info" effect="plain">未来 {{ futurePlans.length }} 条</el-tag>
        </div>
      </template>
      <div class="plan-list">
        <div v-for="plan in futurePlans" :key="plan.id" class="plan-item">
          <div class="plan-content">
            <div class="plan-title">{{ plan.name }}</div>
            <div class="plan-meta">
              <span>{{ plan.nextTime }}</span>
              <span>{{ plan.questionCount }} 个问题</span>
              <span>{{ plan.models.join('、') }}</span>
            </div>
          </div>
          <el-tag type="primary" effect="plain">{{ plan.cycle }}</el-tag>
        </div>
      </div>
    </el-card>

    <el-card shadow="never" class="task-card">
      <div class="task-card-header">
        <el-radio-group v-model="activeStatus" size="small">
          <el-radio-button label="all">全部</el-radio-button>
          <el-radio-button label="running">执行中</el-radio-button>
          <el-radio-button label="done">已完成</el-radio-button>
          <el-radio-button label="failed">失败</el-radio-button>
        </el-radio-group>
        <div class="table-extra">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            size="small"
            value-format="YYYY-MM-DD"
            style="width: 240px"
          />
          <el-select v-model="triggerType" size="small" style="width: 128px">
            <el-option label="全部触发方式" value="all" />
            <el-option label="手动执行" value="manual" />
            <el-option label="定时任务" value="schedule" />
            <el-option label="复测任务" value="retest" />
          </el-select>
          <el-button type="primary" size="small" @click="openManualReportDialog">
            <el-icon><Timer /></el-icon>
            生成报告
          </el-button>
        </div>
      </div>

      <el-table :data="filteredTasks" class="task-table" style="width: 100%" :header-cell-style="headerCellStyle" :cell-style="{ height: '58px' }">
        <el-table-column prop="id" label="任务ID" width="118" show-overflow-tooltip />
        <el-table-column prop="questionCount" label="问题数" width="76" align="center" />
        <el-table-column label="覆盖模型" min-width="170" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="model-tags"><el-tag v-for="model in row.models" :key="model" size="small" effect="plain">{{ model }}</el-tag></div>
          </template>
        </el-table-column>
        <el-table-column label="提及率" width="88" align="center">
          <template #default="{ row }"><span :class="row.metrics.mentionPassed ? 'pass-text' : 'fail-text'">{{ row.metrics.mentionRate }}%</span></template>
        </el-table-column>
        <el-table-column label="平均顺位" width="92" align="center">
          <template #default="{ row }"><span :class="row.metrics.rankPassed ? 'pass-text' : 'fail-text'">{{ row.metrics.avgRank }}</span></template>
        </el-table-column>
        <el-table-column label="达标结果" width="96" align="center">
          <template #default="{ row }">
            <el-tag :type="hasConfiguredMetrics ? (row.metrics.passed ? 'success' : 'warning') : 'info'" effect="plain" size="small">{{ hasConfiguredMetrics ? (row.metrics.passed ? '已达标' : '未达标') : '未配置' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="triggerText" label="触发方式" width="90" />
        <el-table-column label="状态" width="88">
          <template #default="{ row }"><el-tag :type="statusMeta[row.status].type" effect="plain" size="small">{{ statusMeta[row.status].text }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="startTime" label="开始时间" width="150" />
        <el-table-column label="操作" width="168" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row)">详情</el-button>
            <el-button link type="primary" @click="handleExportTask(row, 'data')">导出数据</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-card shadow="never" class="report-card">
      <template #header>
        <div class="section-header">
          <div>
            <span class="section-title">监控报告</span>
            <span class="section-subtitle">报告保存 30 天，生成后请尽快下载</span>
          </div>
          <el-select v-model="reportTypeFilter" size="small" style="width: 140px">
            <el-option label="全部报告类型" value="all" />
            <el-option label="日报" value="daily" />
            <el-option label="周报" value="weekly" />
            <el-option label="月报" value="monthly" />
            <el-option label="自定义时间段" value="custom" />
          </el-select>
        </div>
      </template>
      <el-table :data="filteredReports" class="report-table" style="width: 100%" :header-cell-style="headerCellStyle">
        <el-table-column label="报告类型" width="112" align="center">
          <template #default="{ row }">
            <el-tag effect="plain" size="small">{{ reportTypeText[row.type] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="period" label="周期" min-width="160" />
        <el-table-column label="提及率" width="88" align="center">
          <template #default="{ row }"><span :class="row.mentionPassed ? 'pass-text' : 'fail-text'">{{ row.mentionRate }}%</span></template>
        </el-table-column>
        <el-table-column label="平均顺位" width="92" align="center">
          <template #default="{ row }"><span :class="row.rankPassed ? 'pass-text' : 'fail-text'">{{ row.avgRank }}</span></template>
        </el-table-column>
        <el-table-column prop="runCount" label="任务数" width="80" align="center" />
        <el-table-column v-if="isMonthlyDaysEnabled" label="达标天数" width="110" align="center">
          <template #default="{ row }">{{ row.qualifiedDays ?? '-' }}</template>
        </el-table-column>
        <el-table-column label="报告结论" min-width="180">
          <template #default="{ row }">
            <el-tag :type="row.passed ? 'success' : 'warning'" effect="plain" size="small">{{ row.passed ? '达标' : '未达标' }}</el-tag>
            <span class="report-summary">{{ row.summary }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="92" align="center">
          <template #default="{ row }">
            <el-tag :type="reportStatusMeta[row.status].type" effect="plain" size="small">{{ reportStatusMeta[row.status].text }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="150" />
        <el-table-column prop="completedAt" label="完成时间" width="150" />
        <el-table-column label="操作" width="108" align="center">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleViewReport(row)">查看</el-button>
            <el-button link type="primary" :disabled="row.status !== 'done'" @click="handleExportReport(row.type, row)">下载</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="manualReportVisible" width="640px" class="manual-report-dialog">
      <template #header>
        <div class="manual-report-title-row">
          <span>生成报告</span>
          <em>报告保存 30 天，生成后请尽快下载</em>
        </div>
      </template>
      <el-form label-position="top" class="manual-report-form">
        <el-form-item class="manual-report-section no-label">
          <div class="report-type-grid">
            <button
              v-for="item in manualReportTypeOptions"
              :key="item.value"
              type="button"
              class="report-type-card"
              :class="{ active: manualReportForm.type === item.value }"
              @click="manualReportForm.type = item.value"
            >
              <strong>{{ item.label }}</strong>
              <span>{{ item.desc }}</span>
            </button>
          </div>
        </el-form-item>
        <el-form-item label="统计时间" class="manual-report-section">
          <div class="manual-time-box">
            <el-date-picker
              v-if="manualReportForm.type === 'daily'"
              v-model="manualReportForm.day"
              type="date"
              value-format="YYYY-MM-DD"
              :disabled-date="disableFutureDate"
              placeholder="选择哪一天"
              style="width: 240px"
            />
            <div v-else-if="manualReportForm.type === 'weekly'" class="time-picker-row">
              <el-date-picker
                v-model="manualReportForm.weekDate"
                type="week"
                format="YYYY 第 ww 周"
                value-format="YYYY-MM-DD"
                :disabled-date="disableFutureDate"
                placeholder="选择哪一周"
                style="width: 240px"
              />
              <span class="week-range-preview">{{ manualReportWeekRangeText }}</span>
            </div>
            <div v-else-if="manualReportForm.type === 'monthly'" class="time-picker-row">
              <el-date-picker
                v-model="manualReportForm.month"
                type="month"
                value-format="YYYY-MM"
                :disabled-date="disableFutureDate"
                placeholder="选择哪一月"
                style="width: 240px"
              />
              <span class="week-range-preview">{{ manualReportMonthRangeText }}</span>
            </div>
            <el-date-picker
              v-else
              v-model="manualReportForm.customRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
              :disabled-date="disableFutureDate"
              style="width: 320px"
            />
          </div>
        </el-form-item>
        <div class="manual-report-tip">
          将按 {{ manualReportPeriodText }} 汇总任务结果并创建报告生成任务，完成后可在监控报告或导出中心查看。
        </div>
      </el-form>
      <template #footer>
        <div class="manual-report-footer">
          <span class="report-cost-tip">生成一份报告将消耗: ¥5.00</span>
          <div class="manual-report-actions">
            <el-button @click="manualReportVisible = false">取消</el-button>
            <el-button type="primary" @click="handleCreateManualReport">确认生成</el-button>
          </div>
        </div>
      </template>
    </el-dialog>

    </template>

    <section v-if="isDetailPage && currentTask" class="task-detail-page">
      <div v-if="currentTask" class="detail-panel">
        <div class="detail-title-row compact">
          <div></div>
          <div class="detail-actions detail-actions-hidden">
            <el-tag :type="hasConfiguredMetrics ? (currentTask.metrics.passed ? 'success' : 'warning') : 'info'" effect="plain">{{ hasConfiguredMetrics ? (currentTask.metrics.passed ? '本轮已达标' : '本轮未达标') : '未配置达标指标' }}</el-tag>
            <el-button size="small" plain @click="handleExportTask(currentTask, 'data')"><el-icon><Download /></el-icon>导出数据</el-button>
            <el-button size="small" plain @click="handleExportTask(currentTask, 'screenshot')"><el-icon><Picture /></el-icon>导出截图</el-button>
            <el-button type="primary" size="small" :disabled="selectedQuestions.length === 0" @click="openRetestDialog">发起复测</el-button>
          </div>
        </div>

        <div class="detail-overview compact">
          <div class="overview-item">
            <span>达标结果</span>
            <strong :class="hasConfiguredMetrics ? (currentTask.metrics.passed ? 'pass-text' : 'fail-text') : ''">
              {{ hasConfiguredMetrics ? (currentTask.metrics.passed ? '本轮已达标' : '本轮未达标') : '未配置' }}
            </strong>
          </div>
          <div class="overview-item"><span>提及率</span><strong>{{ currentTask.metrics.mentionRate }}%</strong><p v-if="isMentionRateEnabled" :class="currentTask.metrics.mentionPassed ? 'pass-text' : 'fail-text'">目标 ≥ {{ targetConfig.mentionRate }}%</p></div>
          <div class="overview-item"><span>平均顺位</span><strong>{{ currentTask.metrics.avgRank }}</strong><p v-if="isAvgRankEnabled" :class="currentTask.metrics.rankPassed ? 'pass-text' : 'fail-text'">目标 ≤ {{ targetConfig.avgRank }}</p></div>
          <div class="overview-item"><span>执行耗时</span><strong>{{ currentTask.duration }}</strong><p>{{ currentTask.endTime || '执行中' }}</p></div>
        </div>

        <div class="run-config-panel">
          <div class="run-config-title">本次任务执行的监控配置</div>
          <div class="run-config-grid">
            <div class="run-config-item">
              <span>采集通道</span>
              <strong>{{ runCollectConfig.channelText }}</strong>
            </div>
            <div class="run-config-item">
              <span>深度思考</span>
              <strong>{{ runCollectConfig.deepThinkingText }}</strong>
            </div>
            <div class="run-config-item">
              <span>截图选择</span>
              <strong>{{ runCollectConfig.screenshotText }}</strong>
            </div>
          </div>
        </div>

        <el-tabs v-model="activeTaskDetailTab" class="task-detail-tabs">
          <el-tab-pane label="执行问题明细" name="questions">
        <div class="detail-section">
          <div class="detail-section-header">
            <div class="detail-section-count">共 {{ currentTask.questionCount }} 个问题 × {{ currentTask.models.length }} 个模型 = {{ currentTask.questionResults.length }} 条明细；已选 {{ selectedQuestions.length }} 条</div>
            <div class="question-tools">
              <el-select v-model="questionFilters.model" size="small" style="width: 116px" @change="resetQuestionPage">
                <el-option label="全部模型" value="all" />
                <el-option v-for="model in currentTask.models" :key="model" :label="model" :value="model" />
              </el-select>
              <el-select v-model="questionFilters.mention" size="small" style="width: 116px" @change="resetQuestionPage">
                <el-option label="全部提及" value="all" />
                <el-option label="已提及本品" value="mentioned" />
                <el-option label="未提及本品" value="unmentioned" />
              </el-select>
              <el-select v-model="questionFilters.rankOp" size="small" style="width: 92px" @change="resetQuestionPage">
                <el-option label="顺位不限" value="all" />
                <el-option label="大于" value="gt" />
                <el-option label="小于" value="lt" />
              </el-select>
              <el-input-number v-model="questionFilters.rankValue" :min="1" :max="20" size="small" controls-position="right" style="width: 92px" @change="resetQuestionPage" />
              <el-button size="small" plain @click="handleExportTask(currentTask, 'data')"><el-icon><Download /></el-icon>导出数据</el-button>
              <el-button size="small" plain @click="handleExportTask(currentTask, 'screenshot')"><el-icon><Picture /></el-icon>导出截图</el-button>
              <el-button type="primary" size="small" :disabled="selectedQuestions.length === 0" @click="openRetestDialog">发起复测</el-button>
            </div>
          </div>

          <el-table
            ref="questionTableRef"
            :data="pagedQuestionResults"
            class="question-result-table compact-table"
            style="width: 100%"
            row-key="id"
            :header-cell-style="headerCellStyle"
            @selection-change="handleQuestionSelectionChange"
          >
            <el-table-column type="selection" width="32" />
            <el-table-column label="序号" width="46" align="center">
              <template #default="{ $index }">{{ (questionPage - 1) * questionPageSize + $index + 1 }}</template>
            </el-table-column>
            <el-table-column label="问题" min-width="320" show-overflow-tooltip>
              <template #default="{ row }">
                <div class="prompt-text-cell">
                  <button type="button" class="prompt-link" @click="openConversationDetail(row)">{{ row.question }}</button>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="model" label="模型" width="96" show-overflow-tooltip />
            <el-table-column label="本品提及" width="84" align="center">
              <template #default="{ row }">
                <el-tag :type="row.mentioned ? 'success' : 'danger'" effect="plain" size="small">{{ row.mentioned ? '已提及' : '未提及' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="本品顺位" width="84" align="center">
              <template #default="{ row }"><span :class="row.rank && row.rank <= targetConfig.avgRank ? 'pass-text' : 'fail-text'">{{ row.rank || '-' }}</span></template>
            </el-table-column>
            <el-table-column label="提及竞品品牌" min-width="180">
              <template #default="{ row }">
                <div class="mention-tags">
                  <el-tag v-for="brand in row.competitorMentions.slice(0, 2)" :key="brand" size="small" effect="plain">{{ brand }}</el-tag>
                  <el-tooltip v-if="row.competitorMentions.length > 2" placement="top" :content="row.competitorMentions.slice(2).join('、')">
                    <el-tag size="small" effect="plain">+{{ row.competitorMentions.length - 2 }}</el-tag>
                  </el-tooltip>
                </div>
              </template>
            </el-table-column>
            <el-table-column v-if="isScreenshotColumnVisible" label="截图" width="72" align="center">
              <template #default="{ row }">
                <el-button v-if="row.mentioned && row.screenshotUrl" link type="primary" @click="openScreenshotPreview(row)">查看</el-button>
                <span v-else class="muted-text">-</span>
              </template>
            </el-table-column>
            <el-table-column v-if="isShareLinkColumnVisible" label="分享链接" width="86" align="center">
              <template #default="{ row }">
                <a
                  v-if="row.shareUrl"
                  class="table-link"
                  :href="row.shareUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  @click.stop
                >
                  查看
                </a>
                <span v-else class="muted-text">-</span>
              </template>
            </el-table-column>
            <el-table-column prop="queryTime" label="查询时间" width="138" />
            <el-table-column label="操作" width="72" align="center">
              <template #default="{ row }">
                <el-button link type="primary" @click="openConversationDetail(row)">详情</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="question-pagination">
            <span>共 {{ filteredQuestionResults.length }} 条明细</span>
            <el-pagination
              v-model:current-page="questionPage"
              v-model:page-size="questionPageSize"
              background
              layout="sizes, prev, pager, next, jumper"
              :page-sizes="[20, 50, 100, 200]"
              :total="filteredQuestionResults.length"
              @size-change="handleQuestionPageSizeChange"
              @current-change="handleQuestionPageChange"
            />
          </div>
        </div>
          </el-tab-pane>
          <el-tab-pane :label="`复测任务 (${currentTask.retests?.length || 0})`" name="retests">
        <div v-if="currentTask.retests?.length" class="retest-section">
          <div class="detail-section-title">复测任务</div>
          <div class="retest-list">
            <div
              v-for="(retest, index) in currentTask.retests"
              :key="retest.id"
              class="retest-item"
              :class="{ active: currentRetest?.id === retest.id }"
            >
              <div class="retest-info">
                <span class="retest-index">{{ index + 1 }}</span>
                <div>
                <strong>{{ retest.id }}</strong>
                <span>{{ retest.metricText }} · {{ retest.rounds }} 轮 · {{ retest.questionCount }} 个问题</span>
                </div>
              </div>
              <div class="retest-actions">
                <el-tag :type="retest.passed ? 'success' : 'warning'" effect="plain" size="small">{{ retest.passed ? '已达标' : '未达标' }}</el-tag>
                <el-button link type="primary" @click="handleExportRetest(retest, 'data')">导出数据</el-button>
                <el-button link type="primary" @click="handleExportRetest(retest, 'screenshot')">导出截图</el-button>
              </div>
            </div>
          </div>
          <div v-if="allRetestResults.length" class="inline-retest-detail">
            <div class="retest-detail-head">
              <div>
                <h3>复测明细</h3>
                <p>共 {{ allRetestResults.length }} 条复测结果，默认按任务和轮次排序展示</p>
              </div>
              <div class="detail-actions">
                <el-button size="small" plain @click="handleExportTask(currentTask, 'data')"><el-icon><Download /></el-icon>导出数据</el-button>
                <el-button size="small" plain @click="handleExportTask(currentTask, 'screenshot')"><el-icon><Picture /></el-icon>导出截图</el-button>
              </div>
            </div>

            <el-table
              :data="pagedRetestResults"
              class="retest-result-table compact-table"
              style="width: 100%"
              :header-cell-style="headerCellStyle"
            >
              <el-table-column label="序号" width="64" align="center">
                <template #default="{ $index }">{{ (retestPage - 1) * retestPageSize + $index + 1 }}</template>
              </el-table-column>
              <el-table-column prop="question" label="问题" min-width="260" show-overflow-tooltip />
              <el-table-column prop="round" label="轮次" width="76" align="center">
                <template #default="{ row }">第 {{ row.round }} 轮</template>
              </el-table-column>
              <el-table-column prop="retestId" label="复测任务" width="138" show-overflow-tooltip />
              <el-table-column prop="model" label="模型" width="96" />
              <el-table-column label="本品提及" width="96" align="center">
                <template #default="{ row }">
                  <el-tag :type="row.mentioned ? 'success' : 'danger'" effect="plain" size="small">{{ row.mentioned ? '已提及' : '未提及' }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="本品顺位" width="90" align="center">
                <template #default="{ row }">
                  <span :class="row.rank && row.rank <= targetConfig.avgRank ? 'pass-text' : 'fail-text'">{{ row.rank || '-' }}</span>
                </template>
              </el-table-column>
              <el-table-column label="本轮达标" width="96" align="center">
                <template #default="{ row }">
                  <el-tag :type="row.passed ? 'success' : 'warning'" effect="plain" size="small">{{ row.passed ? '达标' : '未达标' }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="queryTime" label="复测时间" width="138" />
            </el-table>
            <div class="question-pagination">
              <span>共 {{ allRetestResults.length }} 条复测明细</span>
              <el-pagination
                v-model:current-page="retestPage"
                v-model:page-size="retestPageSize"
                background
                layout="sizes, prev, pager, next, jumper"
                :page-sizes="[20, 50, 100, 200]"
                :total="allRetestResults.length"
                @size-change="handleRetestPageSizeChange"
                @current-change="handleRetestPageChange"
              />
            </div>
          </div>
        </div>
          </el-tab-pane>
        </el-tabs>

        </div>
    </section>

    <el-dialog v-model="conversationVisible" width="1180px" class="conversation-dialog" top="3vh">
      <template #header>
        <div v-if="currentConversation" class="conversation-meta">
          <div>
            <span>当前项目</span>
            <strong>{{ currentTask?.projectName || '卓牧羊奶粉项目' }}</strong>
          </div>
          <p>{{ currentConversation.queryTime }}</p>
        </div>
      </template>
      <div v-if="currentConversation" class="conversation-detail">
        <div class="conversation-layout">
          <div class="answer-panel">
            <div class="model-avatar">{{ currentConversation.model.slice(0, 1).toUpperCase() }}</div>
            <div class="answer-stack">
              <div class="conversation-head">
                <div class="query-bubble">{{ currentConversation.question }}</div>
                <div class="query-user">问</div>
              </div>
              <div class="answer-card">
                <div class="answer-title-row">
                  <strong>{{ currentConversation.model }}</strong>
                  <el-tag type="success" effect="plain" size="small">成功</el-tag>
                </div>
                <div class="answer-time">执行时间：{{ currentConversation.duration }}</div>
                <div v-if="currentConversation.thinkingProcess?.length" class="thinking-process">
                  <div class="thinking-title">思考过程</div>
                  <div v-for="(step, index) in currentConversation.thinkingProcess" :key="index" class="thinking-step">
                    <div class="thinking-dot"></div>
                    <div class="thinking-content">
                      <p>{{ step.text }}</p>
                      <div v-if="step.links?.length" class="thinking-links">
                        <a v-for="link in step.links" :key="link" href="#" @click.prevent>{{ link }}</a>
                        <el-button v-if="step.showMore" size="small" plain>查看全部</el-button>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="answer-content">
                  <p>以下是一些常见且受欢迎的婴幼儿护肤推荐：</p>
                  <ul>
                    <li v-for="brand in currentConversation.answerBrands" :key="brand.name">
                      <strong>{{ brand.name }}：</strong>{{ brand.desc }}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <aside class="conversation-side">
            <section>
              <h4>提及品牌（{{ currentConversation.ranking.length }}个）</h4>
              <div v-for="brand in currentConversation.ranking" :key="brand.name" class="side-rank-item">
                <span>{{ brand.name }}</span>
                <b>{{ brand.rank }}</b>
              </div>
            </section>
            <section>
              <h4>引用来源（{{ currentConversation.sources.length }}条）</h4>
              <a
                v-for="source in currentConversation.sources"
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

    <el-dialog v-model="screenshotVisible" title="采集截图" width="860px" class="screenshot-dialog" top="5vh">
      <div v-if="currentScreenshot" class="screenshot-preview">
        <div class="screenshot-meta">
          <strong>{{ currentScreenshot.question }}</strong>
          <span>{{ currentScreenshot.model }} · {{ currentScreenshot.queryTime }}</span>
        </div>
        <img :src="currentScreenshot.screenshotUrl" alt="采集截图预览" />
      </div>
    </el-dialog>

    <el-dialog v-model="retestVisible" title="创建复测任务" width="520px">
      <el-form label-width="112px" class="retest-form">
        <el-form-item label="复测问题"><span class="form-static">{{ selectedQuestions.length }} 条</span></el-form-item>
        <el-form-item label="复测轮数">
          <el-input-number v-model="retestForm.rounds" :min="1" :max="10" />
          <span class="form-tip">最大 10 轮</span>
        </el-form-item>
        <el-form-item label="复测指标">
          <el-radio-group v-if="retestMetricOptions.length" v-model="retestForm.metric">
            <el-radio-button v-for="item in retestMetricOptions" :key="item.value" :label="item.value">{{ item.label }}</el-radio-button>
          </el-radio-group>
          <span v-else class="form-static muted">暂无配置指标</span>
        </el-form-item>
        <el-form-item label="达标条件">
          <div class="target-preview">
            <span v-if="isMentionRateEnabled && retestForm.metric !== 'rank'">提及率 ≥ {{ targetConfig.mentionRate }}%</span>
            <span v-if="isAvgRankEnabled && retestForm.metric !== 'mention'">平均顺位 ≤ 第 {{ targetConfig.avgRank }} 名</span>
            <span v-if="!retestMetricOptions.length">暂无配置指标</span>
          </div>
        </el-form-item>
        <el-form-item label="停止策略">
          <el-switch v-model="retestForm.stopOnFirstPass" />
          <span class="form-tip">任意一轮达标后，不再执行后续轮次</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="retestVisible = false">取消</el-button>
        <el-button type="primary" :disabled="!retestMetricOptions.length" @click="handleCreateRetest">创建复测</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { CircleCheck, Download, Picture, Refresh, Search, Timer, TrendCharts, WarningFilled } from '@element-plus/icons-vue'

const MONITOR_METRIC_CONFIG_KEY = 'guyu-monitor-metric-config'
const MONITOR_COLLECT_CONFIG_KEY = 'guyu-monitor-collect-config'
const monitorMetricConfig = reactive({
  mentionRate: { enabled: false, target: 70 },
  avgRank: { enabled: false, target: 'top3' },
  monthlyDays: { enabled: false, target: 22 }
})
const monitorCollectConfig = reactive({
  collectChannel: 'standard',
  models: []
})
const loadMonitorMetricConfig = () => {
  try {
    const raw = localStorage.getItem(MONITOR_METRIC_CONFIG_KEY)
    if (!raw) return
    const saved = JSON.parse(raw)
    Object.assign(monitorMetricConfig.mentionRate, {
      enabled: Boolean(saved.mentionRate?.enabled),
      target: saved.mentionRate?.target ?? monitorMetricConfig.mentionRate.target
    })
    Object.assign(monitorMetricConfig.avgRank, {
      enabled: Boolean(saved.avgRank?.enabled),
      target: saved.avgRank?.target ?? monitorMetricConfig.avgRank.target
    })
    Object.assign(monitorMetricConfig.monthlyDays, {
      enabled: Boolean(saved.monthlyDays?.enabled),
      target: saved.monthlyDays?.target ?? monitorMetricConfig.monthlyDays.target
    })
  } catch (error) {
    localStorage.removeItem(MONITOR_METRIC_CONFIG_KEY)
  }
}
loadMonitorMetricConfig()
const loadMonitorCollectConfig = () => {
  try {
    const raw = localStorage.getItem(MONITOR_COLLECT_CONFIG_KEY)
    if (!raw) return
    const saved = JSON.parse(raw)
    monitorCollectConfig.collectChannel = saved.collectChannel || monitorCollectConfig.collectChannel
    monitorCollectConfig.models = Array.isArray(saved.models) ? saved.models : []
  } catch (error) {
    localStorage.removeItem(MONITOR_COLLECT_CONFIG_KEY)
  }
}
loadMonitorCollectConfig()

const rankTargetMap = { top3: 3, top5: 5, top10: 10 }
const targetConfig = computed(() => ({
  mentionRate: monitorMetricConfig.mentionRate.target,
  avgRank: rankTargetMap[monitorMetricConfig.avgRank.target] || 3,
  monthlyDays: monitorMetricConfig.monthlyDays.target
}))
const isMentionRateEnabled = computed(() => monitorMetricConfig.mentionRate.enabled)
const isAvgRankEnabled = computed(() => monitorMetricConfig.avgRank.enabled)
const isMonthlyDaysEnabled = computed(() => monitorMetricConfig.monthlyDays.enabled)
const configuredMetrics = computed(() => {
  const metrics = []
  if (isMentionRateEnabled.value) {
    metrics.push({ key: 'mentionRate', label: '本品提及率', targetText: `≥ ${targetConfig.value.mentionRate}%` })
  }
  if (isAvgRankEnabled.value) {
    metrics.push({ key: 'avgRank', label: '平均推荐顺位', targetText: `≤ 第 ${targetConfig.value.avgRank} 名` })
  }
  if (isMonthlyDaysEnabled.value) {
    metrics.push({ key: 'monthlyDays', label: '月度达标天数', targetText: `≥ ${targetConfig.value.monthlyDays} 天` })
  }
  return metrics
})
const hasConfiguredMetrics = computed(() => configuredMetrics.value.length > 0)
const retestMetricOptions = computed(() => {
  const options = []
  if (isMentionRateEnabled.value) options.push({ label: '提及率', value: 'mention' })
  if (isAvgRankEnabled.value) options.push({ label: '排名顺位', value: 'rank' })
  if (isMentionRateEnabled.value && isAvgRankEnabled.value) options.push({ label: '两者同时', value: 'both' })
  return options
})
const enabledCollectModels = computed(() => monitorCollectConfig.models.filter(model => model.enabled))
const isShareLinkColumnVisible = computed(() => monitorCollectConfig.collectChannel === 'enhanced')
const isScreenshotColumnVisible = computed(() => {
  if (monitorCollectConfig.collectChannel !== 'enhanced') return false
  return enabledCollectModels.value.some(model => model.mentionScreenshot)
})
const runCollectConfig = computed(() => {
  const isEnhanced = monitorCollectConfig.collectChannel === 'enhanced'
  const hasDeepThinking = isEnhanced && enabledCollectModels.value.some(model => model.deepThinking)
  const hasMentionScreenshot = isEnhanced && enabledCollectModels.value.some(model => model.mentionScreenshot)
  const screenshotTypes = []
  if (hasMentionScreenshot) screenshotTypes.push('提及截图')
  return {
    channelText: isEnhanced ? '增强通道' : '标准通道',
    deepThinkingText: hasDeepThinking ? '开启' : '未开启',
    screenshotText: screenshotTypes.length ? screenshotTypes.join('、') : '未开启'
  }
})

const route = useRoute()
const router = useRouter()
const currentProjectName = '卓牧羊奶粉项目'
const keyword = ref('')
const activeStatus = ref('all')
const triggerType = ref('all')
const dateRange = ref([])
const reportTypeFilter = ref('all')
const detailVisible = ref(false)
const retestVisible = ref(false)
const conversationVisible = ref(false)
const screenshotVisible = ref(false)
const manualReportVisible = ref(false)
const activeTaskDetailTab = ref('questions')
const currentTask = ref(null)
const currentRetest = ref(null)
const currentConversation = ref(null)
const currentScreenshot = ref(null)
const selectedQuestions = ref([])
const questionTableRef = ref(null)
const questionFilters = ref({ model: 'all', mention: 'all', rankOp: 'all', rankValue: 3 })
const questionPage = ref(1)
const questionPageSize = ref(20)
const retestPage = ref(1)
const retestPageSize = ref(20)
const retestForm = ref({ rounds: 3, metric: 'mention', stopOnFirstPass: true })
const formatDateText = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
const getDateText = (offset = 0) => {
  const date = new Date()
  date.setDate(date.getDate() + offset)
  return formatDateText(date)
}
const parseDateText = (value) => {
  if (!value) return null
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day)
}
const todayStart = () => {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  return date
}
const minDate = (left, right) => left.getTime() <= right.getTime() ? left : right
const disableFutureDate = (date) => date.getTime() > todayStart().getTime()
const getWeekRange = (value) => {
  const date = parseDateText(value)
  if (!date) return []
  const day = date.getDay()
  const mondayOffset = day === 0 ? -6 : 1 - day
  const start = new Date(date)
  start.setDate(date.getDate() + mondayOffset)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  return [formatDateText(start), formatDateText(minDate(end, todayStart()))]
}
const getMonthRange = (value) => {
  if (!value) return []
  const [year, month] = value.split('-').map(Number)
  if (!year || !month) return []
  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 0)
  return [formatDateText(start), formatDateText(minDate(end, todayStart()))]
}
const getMonthText = () => getDateText().slice(0, 7)
const getDateTimeText = () => {
  const date = new Date()
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${formatDateText(date)} ${hours}:${minutes}`
}
const manualReportForm = ref({
  type: 'daily',
  day: getDateText(),
  weekDate: getDateText(),
  month: getMonthText(),
  customRange: [getDateText(-6), getDateText()]
})

const statusMeta = {
  running: { text: '执行中', type: 'warning' },
  done: { text: '已完成', type: 'success' },
  failed: { text: '失败', type: 'danger' }
}
const reportStatusMeta = {
  generating: { text: '生成中', type: 'warning' },
  done: { text: '已完成', type: 'success' },
  failed: { text: '失败', type: 'danger' }
}

const reportTypeText = { daily: '日报', weekly: '周报', monthly: '月报', custom: '自定义时间段' }
const manualReportTypeOptions = [
  { value: 'daily', label: '日报', desc: '按单日生成' },
  { value: 'weekly', label: '周报', desc: '周一到周日' },
  { value: 'monthly', label: '月报', desc: '按自然月生成' },
  { value: 'custom', label: '指定时间段', desc: '自定义起止日期' }
]
const manualReportWeekRange = computed(() => getWeekRange(manualReportForm.value.weekDate))
const manualReportWeekRangeText = computed(() => {
  const range = manualReportWeekRange.value
  return range.length === 2 ? `日期范围：${range[0]} 至 ${range[1]}` : '请选择周'
})
const manualReportMonthRange = computed(() => getMonthRange(manualReportForm.value.month))
const manualReportMonthRangeText = computed(() => {
  const range = manualReportMonthRange.value
  return range.length === 2 ? `日期范围：${range[0]} 至 ${range[1]}` : '请选择月份'
})
const manualReportPeriodText = computed(() => {
  const form = manualReportForm.value
  if (form.type === 'daily') return form.day || '未选择日期'
  if (form.type === 'weekly') return manualReportWeekRangeText.value.replace('日期范围：', '')
  if (form.type === 'monthly') return manualReportMonthRangeText.value.replace('日期范围：', '')
  const range = form.customRange
  return range?.length === 2 ? `${range[0]} 至 ${range[1]}` : '未选择时间段'
})
const getReportPeriodRange = (type, period) => {
  if (!period) return ['', '']
  if (period.includes(' 至 ')) return period.split(' 至 ')
  if (type === 'daily') return [period, period]
  if (type === 'monthly') return getMonthRange(period)
  return [period, period]
}
const getReportFileName = (type, row) => {
  const [startDate, endDate] = getReportPeriodRange(type, row?.period)
  const safeProjectName = currentProjectName.replace(/[\\/:*?"<>|]/g, '')
  return `${safeProjectName}_${reportTypeText[type]}_${startDate}_${endDate}`
}
const monitorQuestions = [
  '湿疹宝宝护肤品牌推荐',
  '婴儿湿疹用什么护肤品好',
  '儿童湿疹霜排行榜',
  '湿疹宝宝面霜什么牌子好用',
  '宝宝湿疹护肤哪个牌子好',
  '婴儿湿疹特护护肤霜',
  '儿童湿疹特护霜',
  '新生儿湿疹膏推荐',
  '湿疹宝宝皮肤干痒红用什么保湿霜',
  '宝宝湿疹红疹修护霜',
  '婴儿皮肤干痒红裂护理霜',
  '宝宝湿疹润肤霜',
  '新生儿湿疹怎么护理',
  '宝宝湿疹反复怎么办',
  '婴儿湿疹如何保湿',
  '湿疹宝宝怎么好得快',
  '敏感肌宝宝护肤品',
  '秋冬宝宝皮肤干痒护理',
  '新生儿皮肤屏障修复霜',
  '换季敏感宝宝护肤品推荐',
  '宝宝护肤品怎么选',
  '婴幼儿护肤品选购攻略',
  '婴儿护肤品好物推荐清单',
  '宝宝敏感肌护肤推荐品牌',
  '敏感肌面霜前10品牌',
  '儿童过敏护肤推荐品牌',
  '婴幼儿护肤全套产品推荐',
  '新生儿护肤品精选推荐',
  '幼童护肤品测评推荐',
  '宝宝舒缓修护护肤品推荐',
  '新生儿补水护肤品推荐',
  '婴幼儿防皴防干裂护肤品推荐',
  '宝宝敏感肌专用护肤品推荐',
  '婴幼儿屏障修护护肤品推荐',
  '宝宝泛红干痒护肤品推荐',
  '婴幼儿清爽保湿护肤品推荐',
  '无激素婴儿湿疹霜',
  '温和安全的宝宝湿疹霜',
  '适合敏感肌宝宝的湿疹霜'
]

const enabledMonitorModels = ['豆包', '元宝', 'DeepSeek', '通义千问', '文心一言', 'Kimi']

const baseModelConfig = [
  { name: '豆包', temperature: 'T=0.7', timeout: '60s' },
  { name: '元宝', temperature: 'T=0.7', timeout: '60s' },
  { name: 'DeepSeek', temperature: 'T=0.6', timeout: '60s' },
  { name: '文心一言', temperature: 'T=0.7', timeout: '60s' },
  { name: '通义千问', temperature: 'T=0.6', timeout: '60s' },
  { name: 'Kimi', temperature: 'T=0.6', timeout: '60s' }
]

const buildMetrics = (mentionRate, avgRank) => {
  const mentionPassed = mentionRate >= targetConfig.value.mentionRate
  const rankPassed = avgRank <= targetConfig.value.avgRank
  const enabledResults = []
  if (isMentionRateEnabled.value) enabledResults.push(mentionPassed)
  if (isAvgRankEnabled.value) enabledResults.push(rankPassed)
  return { mentionRate, avgRank, mentionPassed, rankPassed, passed: enabledResults.length ? enabledResults.every(Boolean) : false }
}

const competitorBrandSets = [
  ['纽强', '丝塔芙'],
  ['艾维诺', '贝亲', '妙思乐', '启初'],
  ['纽强', '艾维诺', '贝德美'],
  ['丝塔芙', '适乐肤', '玉泽', '薇诺娜'],
  ['咿儿润', '理肤泉'],
  ['贝亲', '启初', '松达']
]

const buildScreenshotUrl = (question, model, sequence) => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="920" height="560" viewBox="0 0 920 560">
      <rect width="920" height="560" fill="#f8fafc"/>
      <rect x="36" y="32" width="848" height="496" rx="18" fill="#ffffff" stroke="#dbe4ef"/>
      <text x="70" y="82" font-size="24" font-family="Arial, sans-serif" font-weight="700" fill="#111827">采集截图预览</text>
      <text x="70" y="126" font-size="16" font-family="Arial, sans-serif" fill="#64748b">${model} · 第 ${sequence + 1} 条结果</text>
      <rect x="70" y="158" width="780" height="76" rx="10" fill="#eff6ff" stroke="#bfdbfe"/>
      <text x="96" y="204" font-size="18" font-family="Arial, sans-serif" fill="#1f2937">${question}</text>
      <rect x="70" y="270" width="780" height="38" rx="8" fill="#f1f5f9"/>
      <rect x="70" y="326" width="720" height="38" rx="8" fill="#f1f5f9"/>
      <rect x="70" y="382" width="760" height="38" rx="8" fill="#f1f5f9"/>
      <text x="96" y="295" font-size="15" font-family="Arial, sans-serif" fill="#475569">搜索结果、模型回答与来源截图已完成采集</text>
      <text x="96" y="351" font-size="15" font-family="Arial, sans-serif" fill="#475569">包含品牌提及、顺位、竞品和引用来源</text>
      <text x="96" y="407" font-size="15" font-family="Arial, sans-serif" fill="#475569">截图用于复核单条问题执行结果</text>
    </svg>
  `
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

const buildQuestionResults = (offset = 0, models = enabledMonitorModels, questions = monitorQuestions) => {
  return questions.flatMap((question, questionIndex) => {
    return models.map((model, modelIndex) => {
      const sequence = questionIndex * models.length + modelIndex
      const mentioned = (questionIndex + modelIndex + offset) % 5 !== 1
      const rank = mentioned ? ((questionIndex + modelIndex + offset) % 6) + 1 : null
      const competitorMentions = competitorBrandSets[sequence % competitorBrandSets.length]
      return {
    id: `Q-${offset}-${questionIndex + 1}-${modelIndex + 1}`,
    question,
    mentioned,
    rank,
    competitorMentions,
    model,
    duration: `${(32 + (sequence % 12) * 1.6).toFixed(1)} s`,
    thinkingProcess: [
      {
        text: '用户想了解婴幼儿湿疹护理和护肤品牌推荐。我需要提供权威、可核验的信息，并覆盖平台优惠、口碑、成分安全和使用场景。'
      },
      {
        text: '搜索到 46 个网页。搜索结果显示了一些相关页面，为了全面获取信息，需要同时打开这些页面进行比对。'
      },
      {
        text: '浏览 12 个页面，实测攻略、品牌榜单、母婴社区和电商评价均提供了可参考的信息。',
        links: [
          '宝宝面霜排名前十，科学选品守护宝宝娇嫩肌肤',
          '儿童面霜热门品牌排名权威榜',
          '婴幼儿湿疹护理与屏障修护指南',
          '宝宝敏感肌护肤品推荐清单'
        ],
        showMore: true
      },
      {
        text: '这些资料提供了很多关于湿疹宝宝护肤的信息。回答会综合官方说明、第三方测评、母婴平台评价和引用来源，并提供安全提醒。'
      }
    ],
    answerBrands: [
      { name: 'Evereden安唯伊', desc: '配方温和，适合敏感肌宝宝日常保湿。' },
      { name: '艾维诺', desc: '以燕麦舒缓护理为核心，适合干痒泛红护理。' },
      { name: '初敏', desc: '强调屏障修护和温和保湿，适合湿疹宝宝日常护理。' },
      { name: '贝亲', desc: '大众母婴品牌，基础保湿产品覆盖较广。' }
    ],
    ranking: [
      { name: '艾维诺', rank: 1 },
      { name: mentioned ? '初敏' : '贝亲', rank: 2 },
      { name: competitorMentions[0], rank: 3 },
      { name: '纽强', rank: 4 },
      { name: '妙思乐', rank: 5 },
      { name: '松达', rank: 6 },
      { name: '贝亲', rank: 7 },
      { name: '丝塔芙', rank: 8 },
      { name: '戴可思', rank: 9 },
      { name: 'Evereden安唯伊', rank: 10 },
      { name: '红色小象', rank: 11 },
      { name: '青蛙王子', rank: 12 }
    ],
    sources: [
      { title: '2026宝宝面霜，告别宝宝脸蛋干痒红的换季维护之选', url: 'https://m.binews.com.cn/detail/1775194854129669.html' },
      { title: '2026宝宝面霜排名前十，科学选品守护宝宝娇嫩肌肤', url: 'https://post.smzdm.com/p/a35pzvg/' },
      { title: '儿童面霜热门品牌排名权威榜', url: 'https://post.smzdm.com/p/awwrgr84g/' },
      { title: '豆瓣用户湿疹护理产品实测分享', url: 'https://www.douban.com/note/725870858/' },
      { title: '搜狐母婴：湿疹宝宝护理套装深度测评', url: 'https://www.sohu.com/a/992356918_122579131' },
      { title: '宝宝敏感肌护肤品推荐清单', url: 'https://post.smzdm.com/p/axxxbabycare/' },
      { title: '婴幼儿湿疹护理与屏障修护指南', url: 'https://www.mama.cn/ask/skin-care-guide.html' },
      { title: '母婴社区宝宝面霜使用反馈汇总', url: 'https://www.babytree.com/community/skin-care/' },
      { title: '京东婴童面霜热销榜与用户评价', url: 'https://m.jd.com/phb/key_1320897a611300ed14e.html' },
      { title: '小红书宝宝护肤真实口碑笔记', url: 'https://www.xiaohongshu.com/search_result?keyword=宝宝面霜' },
      { title: '知乎湿疹宝宝面霜选购讨论', url: 'https://www.zhihu.com/search?q=湿疹宝宝面霜' },
      { title: '儿童皮肤屏障修护成分科普', url: 'https://www.yaozui.com/pediatric-skin-barrier' }
    ],
    shareUrl: `https://chat.deepseek.com/share/6b4uu7bamnc9by6ex${(sequence % 10) + 1}`,
    screenshotUrl: buildScreenshotUrl(question, model, sequence),
    queryTime: `2026-05-${22 - offset} 10:${String(12 + sequence).padStart(2, '0')}`
      }
    })
  })
}

const isRetestQuestionPassed = (row, metric) => {
  const mentionPassed = row.mentioned
  const rankPassed = row.rank && row.rank <= targetConfig.value.avgRank
  if (metric === 'mention') return mentionPassed
  if (metric === 'rank') return rankPassed
  return mentionPassed && rankPassed
}

const buildRetestResults = (questions, rounds, metric, stopOnFirstPass) => {
  const passedQuestionIds = new Set()
  const results = []
  for (let round = 1; round <= rounds; round += 1) {
    questions.forEach((question, index) => {
      if (stopOnFirstPass && passedQuestionIds.has(question.id)) return
      const mentioned = round > 1 || question.mentioned || index % 2 === 0
      const rank = mentioned ? Math.max(1, (question.rank || 5) - round + 1) : null
      const row = {
        id: `${question.id}-R${round}`,
        sourceQuestionId: question.id,
        round,
        question: question.question,
        model: question.model,
        mentioned,
        rank,
        queryTime: `2026-05-22 11:${String(10 + round * 7 + index).padStart(2, '0')}`
      }
      row.passed = isRetestQuestionPassed(row, metric)
      row.nextAction = row.passed && stopOnFirstPass ? '已达标，停止后续轮次' : round === rounds ? '复测结束' : '进入下一轮复测'
      if (row.passed && stopOnFirstPass) passedQuestionIds.add(question.id)
      results.push(row)
    })
  }
  return results
}

const tasks = ref([
  {
    id: 'MT-052201',
    name: '日常监控',
    projectName: '卓牧羊奶粉项目',
    trigger: 'manual',
    triggerText: '手动执行',
    status: 'running',
    questionCount: monitorQuestions.length,
    models: enabledMonitorModels,
    modelConfig: baseModelConfig,
    metrics: buildMetrics(72.4, 2.8),
    channel: '网页采集通道 A / API 通道 B',
    batchNo: 'BATCH-20260522-001',
    startTime: '2026-05-22 10:20',
    endTime: '',
    duration: '12分钟',
    progress: 68,
    retests: [],
    questionResults: buildQuestionResults(0, enabledMonitorModels)
  },
  {
    id: 'MT-052101',
    name: '竞品提及率全量扫描',
    projectName: '卓牧羊奶粉项目',
    trigger: 'schedule',
    triggerText: '定时任务',
    status: 'done',
    questionCount: monitorQuestions.length,
    models: enabledMonitorModels,
    modelConfig: baseModelConfig,
    metrics: buildMetrics(76.2, 2.6),
    channel: '网页采集通道 A',
    batchNo: 'BATCH-20260521-001',
    startTime: '2026-05-21 09:00',
    endTime: '2026-05-21 09:38',
    duration: '38分钟',
    progress: 100,
    retests: [],
    questionResults: buildQuestionResults(1, enabledMonitorModels)
  },
  {
    id: 'MT-052002',
    name: '平均推荐顺位复核',
    projectName: '卓牧羊奶粉项目',
    trigger: 'manual',
    triggerText: '手动执行',
    status: 'done',
    questionCount: monitorQuestions.length,
    models: ['豆包', 'DeepSeek', '通义千问'],
    modelConfig: [baseModelConfig[0], baseModelConfig[2], baseModelConfig[4]],
    metrics: buildMetrics(68.6, 2.9),
    channel: 'API 通道 B',
    batchNo: 'BATCH-20260520-002',
    startTime: '2026-05-20 16:45',
    endTime: '2026-05-20 17:11',
    duration: '26分钟',
    progress: 100,
    retests: [],
    questionResults: buildQuestionResults(2, ['豆包', 'DeepSeek', '通义千问'])
  }
])

const futurePlans = ref([
  { id: 'PLAN-0523', name: '每日全量监控', nextTime: '2026-05-23 09:00', questionCount: monitorQuestions.length, models: enabledMonitorModels, cycle: '每天' }
])

const reports = reactive({
  daily: [
    { type: 'daily', period: '2026-05-22', status: 'done', createdAt: '2026-05-22 10:18', completedAt: '2026-05-22 10:21', mentionRate: 72.4, avgRank: 2.8, runCount: 1, qualifiedDays: 1, summary: '提及率和平均顺位均达标' },
    { type: 'daily', period: '2026-05-21', status: 'done', createdAt: '2026-05-21 10:16', completedAt: '2026-05-21 10:19', mentionRate: 76.2, avgRank: 2.6, runCount: 1, qualifiedDays: 1, summary: '提及率和平均顺位均达标' },
    { type: 'daily', period: '2026-05-20', status: 'done', createdAt: '2026-05-20 17:20', completedAt: '2026-05-20 17:23', mentionRate: 68.6, avgRank: 2.9, runCount: 1, qualifiedDays: 0, summary: '提及率未达到 70%' }
  ],
  weekly: [
    { type: 'weekly', period: '2026-05-18 至 2026-05-24', status: 'done', createdAt: '2026-05-24 18:00', completedAt: '2026-05-24 18:06', mentionRate: 71.8, avgRank: 2.9, runCount: 6, qualifiedDays: 4, summary: '本周已有 4 天达标' }
  ],
  monthly: [
    { type: 'monthly', period: '2026-05', status: 'generating', createdAt: '2026-05-22 18:30', completedAt: '-', mentionRate: 72.1, avgRank: 2.9, runCount: 22, qualifiedDays: 18, summary: '距离月度 22 天目标还差 4 天' },
    { type: 'monthly', period: '2026-04', status: 'done', createdAt: '2026-04-30 18:00', completedAt: '2026-04-30 18:08', mentionRate: 73.6, avgRank: 2.7, runCount: 30, qualifiedDays: 23, summary: '月度达标天数满足要求' }
  ],
  custom: [
    { type: 'custom', period: '2026-05-10 至 2026-05-22', status: 'failed', createdAt: '2026-05-22 19:10', completedAt: '2026-05-22 19:11', mentionRate: 70.9, avgRank: 3.1, runCount: 13, qualifiedDays: 8, summary: '指定时间段内提及率达标，平均顺位略低于目标' }
  ]
})

Object.values(reports).flat().forEach(report => {
  report.mentionPassed = report.mentionRate >= targetConfig.value.mentionRate
  report.rankPassed = report.avgRank <= targetConfig.value.avgRank
  const enabledResults = []
  if (isMentionRateEnabled.value) enabledResults.push(report.mentionPassed)
  if (isAvgRankEnabled.value) enabledResults.push(report.rankPassed)
  report.passed = enabledResults.length ? enabledResults.every(Boolean) : false
})
Object.values(reports).flat().forEach(report => {
  if (report.type === 'monthly' && isMonthlyDaysEnabled.value) {
    report.passed = report.passed && report.qualifiedDays >= targetConfig.value.monthlyDays
  }
})

const allReports = computed(() => Object.values(reports).flat())
const filteredReports = computed(() => reportTypeFilter.value === 'all' ? allReports.value : allReports.value.filter(report => report.type === reportTypeFilter.value))
const monthlySummary = computed(() => ({ days: reports.monthly[0].qualifiedDays, passed: reports.monthly[0].qualifiedDays >= targetConfig.value.monthlyDays }))
const routeTaskId = computed(() => route.params.taskId)
const isDetailPage = computed(() => Boolean(routeTaskId.value))

const filteredTasks = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  return tasks.value.filter(task => {
    const matchStatus = activeStatus.value === 'all' || task.status === activeStatus.value
    const matchTrigger = triggerType.value === 'all' || task.trigger === triggerType.value
    const matchKeyword = !kw || `${task.id}${task.name}`.toLowerCase().includes(kw)
    const matchDate = isInDateRange(task.startTime)
    return matchStatus && matchTrigger && matchKeyword && matchDate
  })
})

const filteredQuestionResults = computed(() => {
  if (!currentTask.value) return []
  return (currentTask.value.questionResults || []).filter(row => {
    const matchModel = questionFilters.value.model === 'all' || row.model === questionFilters.value.model
    const matchMention = questionFilters.value.mention === 'all' ||
      (questionFilters.value.mention === 'mentioned' && row.mentioned) ||
      (questionFilters.value.mention === 'unmentioned' && !row.mentioned)
    const matchRank = questionFilters.value.rankOp === 'all' ||
      (questionFilters.value.rankOp === 'gt' && row.rank && row.rank > questionFilters.value.rankValue) ||
      (questionFilters.value.rankOp === 'lt' && row.rank && row.rank < questionFilters.value.rankValue)
    return matchModel && matchMention && matchRank
  })
})

const pagedQuestionResults = computed(() => {
  const start = (questionPage.value - 1) * questionPageSize.value
  return filteredQuestionResults.value.slice(start, start + questionPageSize.value)
})

const allRetestResults = computed(() => {
  if (!currentTask.value?.retests?.length) return []
  return currentTask.value.retests.flatMap(retest =>
    retest.results.map(row => ({
      ...row,
      retestId: retest.id,
      metricText: retest.metricText
    }))
  )
})

const pagedRetestResults = computed(() => {
  const start = (retestPage.value - 1) * retestPageSize.value
  return allRetestResults.value.slice(start, start + retestPageSize.value)
})

const summaryCards = computed(() => {
  const running = tasks.value.filter(task => task.status === 'running').length
  const passed = tasks.value.filter(task => task.metrics.passed).length
  const retestCount = tasks.value.reduce((sum, task) => sum + (task.retests?.length || 0), 0)
  const cards = [
    { label: '执行中', value: running, icon: Timer, theme: 'warning' },
    { label: '本轮达标', value: passed, icon: CircleCheck, theme: 'success', desc: configuredMetrics.value.length ? `目标：${configuredMetrics.value.map(item => item.targetText).join(' / ')}` : '暂无配置指标' },
    { label: '复测任务', value: retestCount, icon: WarningFilled, theme: 'primary', desc: '挂载在原监控任务中' }
  ]
  if (isMonthlyDaysEnabled.value) {
    cards.push({ label: '月度达标天数', value: monthlySummary.value.days, icon: TrendCharts, theme: monthlySummary.value.passed ? 'success' : 'primary', desc: `目标 ${targetConfig.value.monthlyDays} 天` })
  }
  return cards
})

const headerCellStyle = { background: '#f8fafc', color: '#64748b', fontWeight: 700, height: '40px' }

const isInDateRange = (startTime) => {
  if (!dateRange.value || dateRange.value.length !== 2) return true
  const day = startTime.slice(0, 10)
  return day >= dateRange.value[0] && day <= dateRange.value[1]
}

const loadTaskDetail = async (taskId) => {
  if (!taskId) return
  const task = tasks.value.find(item => item.id === taskId) || tasks.value[0]
  currentTask.value = task
  selectedQuestions.value = []
  currentRetest.value = null
  activeTaskDetailTab.value = 'questions'
  questionFilters.value = { model: 'all', mention: 'all', rankOp: 'all', rankValue: 3 }
  questionPage.value = 1
  retestPage.value = 1
  await nextTick()
  questionTableRef.value?.clearSelection?.()
}

watch(
  routeTaskId,
  taskId => {
    if (taskId) loadTaskDetail(taskId)
  },
  { immediate: true }
)

const resetQuestionPage = async () => {
  questionPage.value = 1
  selectedQuestions.value = []
  await nextTick()
  questionTableRef.value?.clearSelection?.()
}

const openDetail = async (row) => {
  router.push(`/project/${route.params.id}/tasks/${row.id}`)
}

const backToTaskList = () => {
  router.push(`/project/${route.params.id}/tasks`)
}

const handleQuestionSelectionChange = (rows) => {
  selectedQuestions.value = rows
}

const handleQuestionPageChange = async () => {
  selectedQuestions.value = []
  await nextTick()
  questionTableRef.value?.clearSelection?.()
}

const handleQuestionPageSizeChange = async () => {
  questionPage.value = 1
  selectedQuestions.value = []
  await nextTick()
  questionTableRef.value?.clearSelection?.()
}

const handleRetestPageChange = () => {}

const handleRetestPageSizeChange = () => {
  retestPage.value = 1
}

const openRetestDialog = () => {
  if (!selectedQuestions.value.length) {
    ElMessage.warning('请选择需要复测的问题')
    return
  }
  if (!retestMetricOptions.value.length) {
    ElMessage.warning('暂无配置指标，无法创建复测任务')
    return
  }
  if (!retestMetricOptions.value.some(item => item.value === retestForm.value.metric)) {
    retestForm.value.metric = retestMetricOptions.value[0].value
  }
  retestVisible.value = true
}

const handleCreateRetest = () => {
  if (!retestMetricOptions.value.length) {
    ElMessage.warning('暂无配置指标，无法创建复测任务')
    return
  }
  const metricText = { mention: '提及率', rank: '排名顺位', both: '提及率和排名顺位' }[retestForm.value.metric]
  const results = buildRetestResults(selectedQuestions.value, retestForm.value.rounds, retestForm.value.metric, retestForm.value.stopOnFirstPass)
  const retest = {
    id: `RT-${currentTask.value.id}-${String((currentTask.value.retests?.length || 0) + 1).padStart(2, '0')}`,
    metricText,
    metric: retestForm.value.metric,
    rounds: retestForm.value.rounds,
    questionCount: selectedQuestions.value.length,
    stopOnFirstPass: retestForm.value.stopOnFirstPass,
    passed: results.some(row => row.passed),
    results
  }
  currentTask.value.retests = [...(currentTask.value.retests || []), retest]
  currentRetest.value = retest
  activeTaskDetailTab.value = 'retests'
  retestPage.value = 1
  ElMessage.success(`已创建 ${selectedQuestions.value.length} 个问题的复测任务，可在当前详情内查看并导出复测数据/截图`)
  retestVisible.value = false
}

const openRetestDetail = (retest) => {
  currentRetest.value = retest
}

const openConversationDetail = (row) => {
  currentConversation.value = row
  conversationVisible.value = true
}

const openScreenshotPreview = (row) => {
  currentScreenshot.value = row
  screenshotVisible.value = true
}

const handleExportTask = (row, type = 'data') => {
  const label = type === 'screenshot' ? '截图' : '数据'
  const retestNote = row.retests?.length ? `，包含 ${row.retests.length} 个复测任务的${label}` : ''
  ElMessage.success(`已创建任务 ${row.id} 的${label}导出任务${retestNote}，可在导出中心查看进度`)
}

const handleExportRetest = (retest, type = 'data') => {
  ElMessage.success(`已创建复测任务 ${retest.id} 的${type === 'screenshot' ? '截图' : '数据'}导出任务，可在导出中心查看进度`)
}

const openManualReportDialog = () => {
  manualReportVisible.value = true
}

const handleCreateManualReport = () => {
  const form = manualReportForm.value
  if ((form.type === 'daily' && !form.day) || (form.type === 'monthly' && !form.month)) {
    ElMessage.warning('请选择统计时间')
    return
  }
  if (form.type === 'weekly' && manualReportWeekRange.value.length !== 2) {
    ElMessage.warning('请选择统计周')
    return
  }
  if (form.type === 'custom' && form.customRange.length !== 2) {
    ElMessage.warning('请选择统计时间段')
    return
  }
  const existingReport = reports[form.type].find(report => report.period === manualReportPeriodText.value)
  if (existingReport) {
    ElMessage.warning('报告已存在')
    return
  }
  reports[form.type].unshift({
    type: form.type,
    period: manualReportPeriodText.value,
    status: 'generating',
    createdAt: getDateTimeText(),
    completedAt: '-',
    mentionRate: 0,
    avgRank: '-',
    runCount: 0,
    qualifiedDays: '-',
    mentionPassed: false,
    rankPassed: false,
    passed: false,
    summary: '报告生成中，完成后可查看结论并下载'
  })
  reportTypeFilter.value = form.type
  ElMessage.success(`已创建${reportTypeText[form.type]}生成任务：${manualReportPeriodText.value}`)
  manualReportVisible.value = false
}

const handleViewReport = (row) => {
  if (row.status === 'generating') {
    ElMessage.info('报告正在生成，完成后可查看详情')
    return
  }
  if (row.status === 'failed') {
    ElMessage.warning('报告生成失败，请重新创建报告')
    return
  }
  ElMessage.success(`打开${row.period}${reportTypeText[row.type]}详情`)
}

const handleExportReport = (type, row) => {
  const reportName = row ? getReportFileName(type, row) : `${currentProjectName}_${reportTypeText[type]}`
  ElMessage.success(`${reportName} 下载成功`)
}
</script>

<style scoped>
.monitor-task-page { min-height: 100%; }
.task-detail-page { min-height: 100%; }
.page-toolbar { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 16px; }
.toolbar-title h2 { margin: 0; color: #111827; font-size: 22px; font-weight: 800; letter-spacing: 0; }
.toolbar-title p { margin: 6px 0 0; color: #8a95a6; font-size: 13px; }
.toolbar-actions, .table-extra, .question-tools, .detail-actions, .retest-actions { display: flex; align-items: center; gap: 10px; }
.search-input { width: 240px; }
.summary-row { margin-bottom: 16px; }
.summary-card { height: 98px; padding: 18px; border: 1px solid #e5e7eb; border-radius: 8px; background: #fff; display: flex; align-items: center; gap: 14px; box-sizing: border-box; }
.summary-icon { width: 42px; height: 42px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 22px; flex: none; }
.summary-icon.primary { background: #eff6ff; color: #2563eb; }
.summary-icon.warning { background: #fff7ed; color: #f59e0b; }
.summary-icon.success { background: #ecfdf5; color: #10b981; }
.summary-icon.danger { background: #fef2f2; color: #ef4444; }
.summary-label, .summary-desc { color: #8a95a6; font-size: 13px; }
.summary-value { margin-top: 5px; color: #111827; font-size: 26px; font-weight: 800; line-height: 1; }
.summary-desc { margin-top: 5px; font-size: 12px; }
.plan-card, .task-card, .report-card { margin-bottom: 16px; border-radius: 8px; border: 1px solid #e5e7eb; }
.section-header, .task-card-header, .detail-title-row, .detail-section-header { display: flex; justify-content: space-between; align-items: center; }
.task-card-header { margin-bottom: 14px; }
.section-title { color: #111827; font-size: 16px; font-weight: 800; }
.section-subtitle { margin-left: 10px; color: #9ca3af; font-size: 12px; }
.metric-grid, .detail-overview { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
.metric-grid { grid-template-columns: repeat(3, 1fr); }
.overview-item { padding: 12px 14px; border: 1px solid #eef2f7; border-radius: 8px; background: #fbfdff; }
.overview-item span { display: block; color: #8a95a6; font-size: 12px; }
.overview-item strong { display: block; margin-top: 6px; color: #111827; font-size: 17px; }
.overview-item p { margin: 6px 0 0; color: #64748b; font-size: 12px; }
.run-config-panel { margin: 12px 0 4px; padding: 12px 14px; border: 1px solid #e5e7eb; border-radius: 8px; background: #fbfdff; }
.run-config-title { color: #111827; font-size: 14px; font-weight: 800; margin-bottom: 10px; }
.run-config-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.run-config-item { padding: 10px 12px; border-radius: 6px; background: #fff; border: 1px solid #eef2f7; }
.run-config-item span { display: block; color: #8a95a6; font-size: 12px; }
.run-config-item strong { display: block; margin-top: 5px; color: #111827; font-size: 14px; }
.plan-list { display: grid; gap: 10px; }
.plan-item { display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; border: 1px solid #eef2f7; border-radius: 8px; background: #fbfdff; }
.plan-content { display: flex; align-items: center; gap: 18px; min-width: 0; }
.plan-title { color: #1f2937; font-size: 14px; font-weight: 700; }
.plan-meta { display: flex; align-items: center; gap: 14px; color: #8a95a6; font-size: 12px; }
.task-table, .report-table, .question-result-table { border: 1px solid #eef2f7; border-bottom: none; }
.task-name-cell { display: flex; align-items: center; gap: 8px; color: #1f2937; font-weight: 600; }
.task-dot { width: 7px; height: 7px; border-radius: 50%; flex: none; }
.task-dot.running { background: #f59e0b; }
.task-dot.done { background: #10b981; }
.task-dot.failed { background: #ef4444; }
.model-tags, .mention-tags { display: flex; flex-wrap: wrap; gap: 5px; }
.pass-text { color: #059669; font-weight: 700; }
.fail-text { color: #dc2626; font-weight: 700; }
.report-summary { margin-left: 8px; color: #64748b; font-size: 13px; }
.manual-report-form { padding-top: 2px; }
.manual-report-form :deep(.el-form-item) { margin-bottom: 18px; }
.manual-report-form :deep(.el-form-item__label) { padding-bottom: 8px; color: #111827; font-weight: 800; }
.manual-report-form :deep(.no-label .el-form-item__label) { display: none; }
.manual-report-section { padding: 14px; border: 1px solid #eef2f7; border-radius: 8px; background: #fbfdff; }
.report-type-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; width: 100%; }
.report-type-card { min-height: 74px; padding: 12px 10px; border: 1px solid #e5e7eb; border-radius: 8px; background: #fff; text-align: left; cursor: pointer; transition: border-color .16s ease, box-shadow .16s ease, background .16s ease; }
.report-type-card strong { display: block; color: #111827; font-size: 14px; font-weight: 800; }
.report-type-card span { display: block; margin-top: 6px; color: #8a95a6; font-size: 12px; line-height: 1.35; }
.report-type-card.active { border-color: #2563eb; background: #eff6ff; box-shadow: 0 8px 18px rgba(37, 99, 235, .12); }
.report-type-card.active strong { color: #2563eb; }
.manual-time-box { display: flex; align-items: center; min-height: 34px; }
.time-picker-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.week-range-preview { color: #475569; font-size: 13px; }
.manual-report-tip { padding: 12px 14px; border-radius: 8px; background: #eff6ff; color: #2563eb; font-size: 13px; line-height: 1.6; }
.manual-report-footer { display: flex; align-items: center; justify-content: space-between; gap: 16px; width: 100%; }
.report-cost-tip { color: #dc2626; font-size: 13px; font-weight: 700; }
.manual-report-actions { display: flex; align-items: center; gap: 10px; }
.manual-report-title-row { display: flex; align-items: baseline; gap: 12px; min-width: 0; }
.manual-report-title-row span { color: #111827; font-size: 18px; font-weight: 800; }
.manual-report-title-row em { color: #94a3b8; font-size: 12px; font-style: normal; font-weight: 500; }
:deep(.manual-report-dialog .el-dialog__header) { padding: 18px 22px 8px; }
:deep(.manual-report-dialog .el-dialog__title) { color: #111827; font-size: 18px; font-weight: 800; }
:deep(.manual-report-dialog .el-dialog__body) { padding: 12px 22px 8px; }
:deep(.manual-report-dialog .el-dialog__footer) { padding: 10px 22px 18px; border-top: 1px solid #eef2f7; }
.detail-title-row.compact { padding-bottom: 12px; border-bottom: 1px solid #eef2f7; margin-bottom: 12px; }
.detail-panel { max-width: none; margin: 0 auto; }
.detail-actions-hidden { display: none; }
.detail-title-row p { margin: 4px 0 0; color: #9ca3af; font-size: 12px; }
.detail-section { margin-top: 10px; }
.legacy-question-section { display: none; }
.task-detail-tabs { margin-top: 10px; }
.task-detail-tabs :deep(.el-tabs__header) { margin-bottom: 10px; }
.detail-section-title { color: #111827; font-size: 15px; font-weight: 800; }
.detail-section-desc { margin-top: 4px; color: #94a3b8; font-size: 12px; }
.detail-section-count { color: #94a3b8; font-size: 12px; white-space: nowrap; }
.prompt-text-cell { display: flex; align-items: center; gap: 6px; min-width: 0; }
.prompt-text { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #1f2937; font-weight: 600; }
.prompt-link { display: block; max-width: 100%; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; border: 0; padding: 0; background: transparent; color: #2563eb; font-weight: 700; cursor: pointer; }
.prompt-link:hover { color: #2563eb; text-decoration: underline; }
.question-pagination { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 0 0; color: #8a95a6; font-size: 12px; }
.status-text { font-weight: 700; font-size: 13px; }
.status-text.success { color: #059669; }
.status-text.warning { color: #d97706; }
.retest-section { margin: 12px 0; padding: 12px; border-radius: 8px; background: #f8fafc; }
.retest-list { display: grid; gap: 8px; margin-top: 10px; }
.retest-item { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; border-radius: 6px; background: #fff; border: 1px solid #e5e7eb; }
.retest-item.active { border-color: #93c5fd; background: #eff6ff; }
.retest-info { display: flex; align-items: center; gap: 10px; min-width: 0; }
.retest-index { width: 24px; height: 24px; border-radius: 6px; background: #e0f2fe; color: #2563eb; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; flex: none; }
.retest-item strong { display: block; color: #111827; font-size: 13px; }
.retest-item span { color: #64748b; font-size: 12px; }
.retest-item .retest-index { color: #2563eb; }
.retest-form { padding-top: 6px; }
.inline-retest-detail { margin-top: 12px; padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; background: #fff; }
.retest-detail-head { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #eef2f7; }
.retest-detail-head h3 { margin: 0; color: #111827; font-size: 18px; font-weight: 800; }
.retest-detail-head p { margin: 4px 0 0; color: #64748b; font-size: 13px; }
.retest-result-table { border: 1px solid #eef2f7; border-bottom: none; }
.conversation-meta { display: flex; flex-direction: column; align-items: flex-start; gap: 4px; margin: 0; color: #8a95a6; }
.conversation-meta div { display: flex; align-items: center; gap: 12px; }
.conversation-meta span { font-size: 16px; font-weight: 800; color: #8a95a6; }
.conversation-meta strong { color: #111827; font-size: 16px; }
.conversation-meta p { margin: 0; color: #94a3b8; font-size: 13px; }
.conversation-head { display: flex; justify-content: flex-end; align-items: center; gap: 14px; margin: 0 28px 6px 0; }
.query-bubble { max-width: 420px; padding: 18px 24px; border-radius: 12px; background: #2997f3; color: #fff; font-weight: 800; line-height: 1.45; box-shadow: 0 10px 22px rgba(41, 151, 243, .24); }
.query-user { width: 46px; height: 46px; border-radius: 50%; background: #2997f3; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 800; flex: none; }
.conversation-layout { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 28px; align-items: start; }
.answer-panel { display: grid; grid-template-columns: 58px minmax(0, 1fr); gap: 18px; align-items: start; }
.answer-stack { min-width: 0; display: flex; flex-direction: column; }
.model-avatar { width: 46px; height: 46px; margin-top: 82px; border-radius: 50%; background: #020617; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 900; text-transform: uppercase; }
.answer-card { border: 1px solid #e5e7eb; border-radius: 10px; padding: 18px 22px; background: #fff; box-shadow: 0 2px 8px rgba(15, 23, 42, .04); }
.answer-title-row { display: flex; align-items: center; justify-content: space-between; padding-bottom: 12px; border-bottom: 1px solid #eef2f7; color: #111827; }
.answer-time { margin-top: 14px; color: #64748b; font-size: 13px; }
.thinking-process { margin-top: 16px; padding: 14px 16px; border: 1px solid #e5e7eb; border-radius: 8px; background: #fbfdff; }
.thinking-title { margin-bottom: 10px; color: #111827; font-size: 14px; font-weight: 800; }
.thinking-step { display: grid; grid-template-columns: 16px 1fr; gap: 8px; padding: 5px 0; }
.thinking-dot { width: 6px; height: 6px; margin-top: 9px; border-radius: 50%; background: #94a3b8; }
.thinking-content { padding-left: 10px; border-left: 1px solid #dbe4ef; }
.thinking-content p { margin: 0; color: #4b5563; font-size: 13px; line-height: 1.7; }
.thinking-links { display: flex; flex-wrap: wrap; gap: 8px 12px; margin-top: 8px; }
.thinking-links a { color: #4b5563; font-size: 13px; text-decoration: underline; text-underline-offset: 2px; }
.answer-content { margin-top: 16px; color: #334155; line-height: 1.75; font-size: 14px; }
.answer-content li { margin-bottom: 10px; }
.conversation-side { display: grid; gap: 12px; max-height: 74vh; overflow: auto; padding-right: 4px; }
.conversation-side h4 { margin: 0 0 8px; color: #111827; font-size: 15px; }
.side-rank-item { display: flex; justify-content: space-between; align-items: center; padding: 7px 10px; border: 1px solid #e5e7eb; border-radius: 7px; margin-bottom: 6px; background: #fff; }
.side-rank-item span { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #4b5563; font-size: 13px; }
.side-rank-item b { min-width: 22px; height: 22px; border-radius: 6px; background: #dbeafe; color: #2563eb; display: flex; align-items: center; justify-content: center; font-size: 13px; }
.source-item { display: block; padding: 8px 10px; border: 1px solid #e5e7eb; border-radius: 7px; margin-bottom: 6px; background: #f8fafc; color: inherit; text-decoration: none; cursor: pointer; transition: border-color .16s ease, box-shadow .16s ease, background .16s ease, transform .16s ease; }
.source-item:hover { border-color: #93c5fd; background: #eff6ff; box-shadow: 0 6px 14px rgba(37, 99, 235, .12); transform: translateY(-1px); }
.source-item:hover strong { color: #2563eb; text-decoration: underline; text-underline-offset: 3px; }
.source-item:hover span { color: #2563eb; }
.source-item strong { display: block; color: #111827; font-size: 12px; line-height: 1.35; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.source-item span { display: block; margin-top: 3px; color: #64748b; font-size: 12px; line-height: 1.35; word-break: break-all; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.muted-text { color: #94a3b8; }
.screenshot-preview { display: grid; gap: 14px; }
.screenshot-meta { display: flex; flex-direction: column; gap: 6px; padding-bottom: 12px; border-bottom: 1px solid #eef2f7; }
.screenshot-meta strong { color: #111827; font-size: 15px; }
.screenshot-meta span { color: #64748b; font-size: 13px; }
.screenshot-preview img { width: 100%; max-height: 68vh; object-fit: contain; border: 1px solid #e5e7eb; border-radius: 8px; background: #f8fafc; }
:deep(.question-result-table .el-table__cell) { white-space: nowrap; }
.form-static { color: #111827; font-weight: 700; }
.form-static.muted { color: #94a3b8; font-weight: 500; }
.form-tip { margin-left: 10px; color: #94a3b8; font-size: 12px; }
.target-preview { display: flex; flex-direction: column; gap: 4px; color: #334155; font-size: 13px; }
:deep(.el-card__body) { padding: 18px; }
:deep(.el-card__header) { padding: 16px 18px; }
:deep(.el-table__cell) { color: #4b5563; }
:deep(.compact-table .el-table__cell) { padding: 7px 0; }
:deep(.task-detail-dialog) { max-width: calc(100vw - 96px); }
:deep(.task-detail-dialog .el-dialog__header) { padding: 14px 18px 8px; }
:deep(.task-detail-dialog .el-dialog__body) { padding: 8px 18px 16px; max-height: 78vh; overflow: auto; }
:deep(.retest-detail-dialog .el-dialog__body) { padding-top: 8px; }
:deep(.conversation-dialog .el-dialog__body) { max-height: 86vh; overflow: auto; padding: 0 18px 18px; }
:deep(.conversation-dialog .el-dialog__header) { padding: 10px 54px 6px 18px; margin-right: 0; min-height: 54px; display: flex; align-items: flex-start; }
:deep(.conversation-dialog .el-dialog__headerbtn) { top: 8px; }
:deep(.conversation-dialog .el-dialog__title) { display: none; }
</style>



