<template>
  <div class="task-model-management-container">
    <el-card class="model-management-card" shadow="never">
      <template #header>
        <div class="model-management-header">
          <div>
            <div class="section-title-row">
              <div class="section-title">大模型通道与能力管理</div>
              <el-tag type="success" effect="light">已启用 {{ enabledModelCount }} / 18</el-tag>
            </div>
          </div>
          <div class="model-actions">
            <template v-if="activeTab === 'config' && editing">
              <el-button @click="cancelEdit">取消</el-button>
              <el-button type="primary" @click="saveModelConfig">保存</el-button>
            </template>
            <el-button v-else-if="activeTab === 'config'" type="primary" @click="startEdit">编辑配置</el-button>
            <el-button v-else-if="activeTab === 'capacity'" type="primary" @click="openCapacityDialog()">
              新增官方API
            </el-button>
            <el-button v-else-if="activeTab === 'enhancedCapacity'" type="primary" @click="openEnhancedCapacityDialog()">
              接入三方接口
            </el-button>
          </div>
        </div>
      </template>

      <el-tabs v-model="activeTab" class="model-tabs" @tab-change="handleTabChange">
        <el-tab-pane label="大模型执行现状" name="tasks">
          <div class="channel-list">
            <section
              v-for="channel in modelChannels"
              :key="channel.key"
              class="channel-section"
              :class="{ disabled: !channel.enabled }"
            >
              <div class="channel-header">
                <div class="channel-main">
                  <div class="channel-title-row">
                    <strong>{{ channel.name }}</strong>
                    <el-tag size="small" :type="channel.key === 'standard' ? 'info' : 'primary'">{{ channel.tag }}</el-tag>
                    <el-tag :type="channel.enabled ? 'success' : 'info'" effect="light">
                      {{ channel.enabled ? '通道启用' : '通道停用' }}
                    </el-tag>
                  </div>
                </div>
                <div class="channel-controls">
                  <div class="enabled-count">{{ getChannelQueuedCount(channel) }} 个问题排队</div>
                </div>
              </div>

              <el-table :data="channel.models" border class="model-table">
                <el-table-column label="模型名称" width="160">
                  <template #default="{ row: model }">
                    <div class="model-name-cell">
                      <span class="model-logo" :class="model.logoClass">{{ model.short }}</span>
                      <span class="model-name">{{ model.name }}</span>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column label="排队问题" width="110" align="center">
                  <template #default="{ row: model }">
                    <span class="queue-count" :class="{ warning: model.taskStats.queued >= 200 }">{{ model.taskStats.queued }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="今日计划问题" width="130" align="center" prop="taskStats.todayTotal" />
                <el-table-column label="实际完成问题" width="130" align="center">
                  <template #default="{ row: model }">
                    <span class="completed-count">{{ model.taskStats.completed }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="失败问题" width="110" align="center">
                  <template #default="{ row: model }">
                    <span class="failed-count" :class="{ danger: model.taskStats.failed > 0 }">
                      {{ model.taskStats.failed }}
                    </span>
                  </template>
                </el-table-column>
                <el-table-column label="今日负载" min-width="180">
                  <template #default="{ row: model }">
                    <div class="load-meter">
                      <div class="load-bar">
                        <span
                          class="load-bar-fill"
                          :class="{ danger: model.taskStats.load >= 100 }"
                          :style="{ width: `${getLoadBarWidth(model.taskStats.load)}%` }"
                        />
                      </div>
                      <span class="load-text" :class="{ danger: model.taskStats.load >= 100 }">{{ model.taskStats.load }}%</span>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column label="执行状态" width="120" align="center">
                  <template #default="{ row: model }">
                    <el-tag :type="getExecutionStatusType(model.executionStatus)" effect="dark">
                      {{ getExecutionStatusText(model.executionStatus) }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="备注" min-width="220" show-overflow-tooltip>
                  <template #default="{ row: model }">
                    <span class="status-remark" :class="{ danger: model.executionStatus === 'abnormal' }">
                      {{ model.taskStats.remark || '-' }}
                    </span>
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="100" align="center" fixed="right">
                  <template #default="{ row: model }">
                    <el-button
                      link
                      :type="model.executionStatus === 'abnormal' ? 'danger' : 'primary'"
                      @click="openModelLogs(channel, model)"
                    >
                      查看日志
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
            </section>
          </div>
        </el-tab-pane>



        <el-tab-pane label="模型启用配置" name="config">
          <div class="channel-list">
            <section
              v-for="channel in modelChannels"
              :key="channel.key"
              class="channel-section"
              :class="{ disabled: !channel.enabled }"
            >
              <div class="channel-header">
                <div class="channel-main">
                  <div class="channel-title-row">
                    <strong>{{ channel.name }}</strong>
                    <el-tag size="small" :type="channel.key === 'standard' ? 'info' : 'primary'">{{ channel.tag }}</el-tag>
                    <el-tag :type="channel.enabled ? 'success' : 'info'" effect="light">
                      {{ channel.enabled ? '通道启用' : '通道停用' }}
                    </el-tag>
                  </div>
                  <div class="channel-description">{{ channel.description }}</div>
                </div>
                <div class="channel-controls">
                  <div class="enabled-count">{{ getChannelEnabledCount(channel) }} / 6 模型启用</div>
                  <el-switch
                    v-model="channel.enabled"
                    :disabled="!editing"
                    active-text="启用"
                    inactive-text="停用"
                    inline-prompt
                  />
                </div>
              </div>

              <el-table :data="channel.models" border class="model-table">
                <el-table-column label="模型名称" width="160">
                  <template #default="{ row: model }">
                    <div class="model-name-cell">
                      <span class="model-logo" :class="model.logoClass">{{ model.short }}</span>
                      <span class="model-name">{{ model.name }}</span>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column label="联网搜索" width="120" align="center">
                  <template #default="{ row: model }">
                    <el-tag :type="model.webSearch ? 'success' : 'info'" effect="light">
                      {{ model.webSearch ? '支持' : '不支持' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="深度思考" width="120" align="center">
                  <template #default="{ row: model }">
                    <el-tag :type="model.deepThinking ? 'success' : 'info'" effect="light">
                      {{ model.deepThinking ? '支持' : '不支持' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="全部截图" width="120" align="center">
                  <template #default="{ row: model }">
                    <el-tag :type="model.allScreenshot ? 'success' : 'info'" effect="light">
                      {{ model.allScreenshot ? '支持' : '不支持' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="提及截图" width="120" align="center">
                  <template #default="{ row: model }">
                    <el-tag :type="model.mentionScreenshot ? 'success' : 'info'" effect="light">
                      {{ model.mentionScreenshot ? '支持' : '不支持' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="分享链接" width="120" align="center">
                  <template #default="{ row: model }">
                    <el-tag :type="model.shareLink ? 'success' : 'info'" effect="light">
                      {{ model.shareLink ? '支持' : '不支持' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="每日负载上限" width="170" align="center">
                  <template #default="{ row: model }">
                    <div class="load-limit-cell">
                      <el-input-number
                        v-if="editingLoadLimitKey === modelRuntimeKey(channel, model)"
                        v-model="model.dailyLoadLimit"
                        :min="1000"
                        :max="999999"
                        :step="100"
                        controls-position="right"
                      />
                      <el-tooltip v-else content="点击编辑" placement="top">
                        <button type="button" class="editable-value" @click="startLoadLimitEdit(channel, model)">
                          {{ model.dailyLoadLimit.toLocaleString() }}
                        </button>
                      </el-tooltip>
                      <template v-if="editingLoadLimitKey === modelRuntimeKey(channel, model)">
                        <el-button type="primary" link @click="saveLoadLimit(channel, model)">保存</el-button>
                        <el-button link @click="cancelLoadLimitEdit">取消</el-button>
                      </template>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column label="执行状态" width="120" align="center">
                  <template #default="{ row: model }">
                    <el-tag :type="getExecutionStatusType(model.executionStatus)" effect="dark">
                      {{ getExecutionStatusText(model.executionStatus) }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="启用" width="130" align="center">
                  <template #default="{ row: model }">
                    <el-switch
                      v-model="model.enabled"
                      :disabled="!editing || !channel.enabled"
                      active-text="启用"
                      inactive-text="停用"
                      inline-prompt
                    />
                  </template>
                </el-table-column>
              </el-table>
            </section>
          </div>
        </el-tab-pane>
        <el-tab-pane label="大模型官方API接入" name="capacity">
          <el-table :data="capacityRows" border class="capacity-table api-capacity-table">
            <el-table-column label="大模型" width="130" class-name="capacity-normal-cell">
              <template #default="{ row }">
                <div class="provider-cell">
                  <span class="provider-name">{{ row.provider }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="实际调用模型/API" min-width="190">
              <template #default="{ row }">
                <div class="metric-column metric-column-model">
                  <div
                    v-for="item in getApiCapabilityItems(row)"
                    :key="item.model"
                    class="metric-column-row"
                  >
                    <strong>{{ item.model }}</strong>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column min-width="115" align="center">
              <template #header>
                <div class="capability-header-multi">
                  <div>RPM</div>
                  <div>（每分钟请求数）</div>
                </div>
              </template>
              <template #default="{ row }">
                <div class="metric-column">
                  <div
                    v-for="item in getApiCapabilityItems(row)"
                    :key="item.model"
                    class="metric-column-row"
                  >
                    {{ item.rpm || '-' }}
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column min-width="210">
              <template #header>
                <div class="capability-header-multi">
                  <div>QPS</div>
                  <div>（每秒请求数）</div>
                </div>
              </template>
              <template #default="{ row }">
                <div class="metric-column">
                  <div
                    v-for="item in getApiCapabilityItems(row)"
                    :key="item.model"
                    class="metric-column-row"
                  >
                    {{ item.qps || '-' }}
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column min-width="130" align="center">
              <template #header>
                <div class="capability-header-multi">
                  <div>TPM</div>
                  <div>（每分钟 Token 数）</div>
                </div>
              </template>
              <template #default="{ row }">
                <div class="metric-column">
                  <div
                    v-for="item in getApiCapabilityItems(row)"
                    :key="item.model"
                    class="metric-column-row"
                  >
                    {{ item.tpm || '-' }}
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column min-width="170" align="center">
              <template #header>
                <div class="capability-header-multi">
                  <div>TPD</div>
                  <div>（每日 Token 数）</div>
                </div>
              </template>
              <template #default="{ row }">
                <div class="metric-column">
                  <div
                    v-for="item in getApiCapabilityItems(row)"
                    :key="item.model"
                    class="metric-column-row"
                  >
                    {{ item.tpd || row.tpd || '-' }}
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="apiType" label="API 类型" width="105" align="center" class-name="capacity-normal-cell" />
            <el-table-column prop="accessChannel" label="接入渠道" width="125" show-overflow-tooltip class-name="capacity-normal-cell" />
            <el-table-column label="备注" min-width="220" class-name="capacity-normal-cell capacity-remark-cell">
              <template #default="{ row }">
                <div class="capacity-remark-text">{{ row.concurrency || '-' }}</div>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="88" align="center" class-name="capacity-normal-cell">
              <template #default="{ row }">
                <el-button link type="primary" @click="openCapacityDialog(row)">编辑</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="三方接入" name="enhancedCapacity">
          <el-table :data="enhancedCapabilityRows" border class="capacity-table enhanced-capacity-table">
            <el-table-column label="三方" width="160" fixed>
              <template #default="{ row }">
                <div class="provider-cell">
                  <span class="provider-name">{{ row.channelName }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="支持模型" min-width="180">
              <template #default="{ row }">
                <div class="metric-column metric-column-model">
                  <div v-for="item in getEnhancedCapabilityItems(row)" :key="item.model" class="metric-column-row">
                    <strong>{{ item.model }}</strong>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column min-width="120" align="center">
              <template #header>
                <div class="capability-header-multi">
                  <div>RPS</div>
                  <div>（每秒问题数）</div>
                </div>
              </template>
              <template #default="{ row }">
                <div class="metric-column">
                  <div v-for="item in getEnhancedCapabilityItems(row)" :key="item.model" class="metric-column-row metric-column-row-center">
                    {{ item.rps || '-' }}
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column min-width="130" align="center">
              <template #header>
                <div class="capability-header-multi">
                  <div>RPM</div>
                  <div>（每分钟问题数）</div>
                </div>
              </template>
              <template #default="{ row }">
                <div class="metric-column">
                  <div v-for="item in getEnhancedCapabilityItems(row)" :key="item.model" class="metric-column-row metric-column-row-center">
                    {{ item.rpm || '-' }}
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column min-width="130" align="center">
              <template #header>
                <div class="capability-header-multi">
                  <div>RPD</div>
                  <div>（每天问题数）</div>
                </div>
              </template>
              <template #default="{ row }">
                <div class="metric-column">
                  <div v-for="item in getEnhancedCapabilityItems(row)" :key="item.model" class="metric-column-row metric-column-row-center">
                    {{ item.rpd || '-' }}
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="今日已用" min-width="110" align="center">
              <template #default="{ row }">
                <div class="metric-column">
                  <div v-for="item in getEnhancedCapabilityItems(row)" :key="item.model" class="metric-column-row metric-column-row-center">
                    {{ item.used || '0' }}
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="今日剩余" min-width="110" align="center">
              <template #default="{ row }">
                <div class="metric-column">
                  <div v-for="item in getEnhancedCapabilityItems(row)" :key="item.model" class="metric-column-row metric-column-row-center">
                    {{ getEnhancedRemaining(item) }}
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="110" align="center" class-name="capacity-normal-cell">
              <template #default="{ row }">
                <el-tag :type="row.status === '启用' ? 'success' : 'info'" effect="light">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="备注" min-width="260" class-name="capacity-normal-cell capacity-remark-cell">
              <template #default="{ row }">
                <div class="capacity-remark-text">{{ row.remark || '-' }}</div>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120" align="center" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" @click="openEnhancedCapacityDialog(row)">编辑</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <el-dialog
      v-model="capacityDialogVisible"
      :title="capacityDialogTitle"
      width="1080px"
      class="capacity-dialog"
      append-to-body
    >
      <el-form :model="capacityForm" label-position="top" class="capacity-form-clean">
        <section class="capacity-form-section">

          <div class="capacity-basic-grid">
            <el-form-item label="接入模型" required>
              <el-input v-model="capacityForm.provider" placeholder="例如：豆包 / DeepSeek / 通义千问" clearable />
            </el-form-item>
            <el-form-item label="API 类型" required>
              <el-select v-model="capacityForm.apiType" placeholder="请选择 API 类型" class="full-width">
                <el-option label="托管 API" value="托管API" />
                <el-option label="原生 API" value="原生API" />
                <el-option label="网页采集" value="网页采集" />
                <el-option label="混合接入" value="混合接入" />
              </el-select>
            </el-form-item>
            <el-form-item label="接入渠道" required>
              <el-input v-model="capacityForm.accessChannel" placeholder="例如：火山方舟 / 阿里云百炼 / 百度千帆" clearable />
            </el-form-item>
          </div>
        </section>

        <section class="capacity-form-section">
          <div class="capacity-section-header capability-section-header">
            <div>
              <div class="capacity-section-title">模型能力明细</div>
            </div>
            <el-button type="primary" plain @click="addCapabilityItem">新增一行</el-button>
          </div>

          <el-table
            :data="capacityForm.capabilityItems"
            border
            class="capability-edit-table-clean"
          >
            <el-table-column label="实际调用模型/API" min-width="260">
              <template #default="{ row }">
                <el-input v-model="row.model" placeholder="qwen-plus" clearable />
              </template>
            </el-table-column>
            <el-table-column width="125" align="center">
              <template #header>
                <div class="capability-header-multi">
                  <div>RPM</div>
                  <div>（每分钟请求数）</div>
                </div>
              </template>
              <template #default="{ row }">
                <el-input v-model="row.rpm" placeholder="500" clearable />
              </template>
            </el-table-column>
            <el-table-column width="190" align="center">
              <template #header>
                <div class="capability-header-multi">
                  <div>QPS</div>
                  <div>（每秒请求数）</div>
                </div>
              </template>
              <template #default="{ row }">
                <el-input v-model="row.qps" placeholder="3000" clearable />
              </template>
            </el-table-column>
            <el-table-column width="160" align="center">
              <template #header>
                <div class="capability-header-multi">
                  <div>TPM</div>
                  <div>（每分钟 Token 数）</div>
                </div>
              </template>
              <template #default="{ row }">
                <el-input v-model="row.tpm" placeholder="5,000,000" clearable />
              </template>
            </el-table-column>
            <el-table-column width="160" align="center">
              <template #header>
                <div class="capability-header-multi">
                  <div>TPD</div>
                  <div>（每日 Token 数）</div>
                </div>
              </template>
              <template #default="{ row }">
                <el-input v-model="row.tpd" placeholder="5,000,000" clearable />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80" align="center">
              <template #default="{ $index }">
                <el-button
                  link
                  type="danger"
                  :disabled="capacityForm.capabilityItems.length <= 1"
                  @click="removeCapabilityItem($index)"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </section>

        <section class="capacity-form-section">
          <div class="capacity-section-header">
            <div>
              <div class="capacity-section-title">备注</div>
            </div>
          </div>
          <el-form-item class="capacity-remark-form-item">
            <el-input
              v-model="capacityForm.concurrency"
              type="textarea"
              :rows="5"
              resize="none"
              placeholder="选填"
            />
          </el-form-item>
        </section>
      </el-form>
      <template #footer>
        <div class="capacity-dialog-footer">
          <el-button @click="capacityDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveCapacityRecord">保存</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog
      v-model="enhancedCapacityDialogVisible"
      :title="enhancedCapacityDialogTitle"
      width="980px"
      class="capacity-dialog"
      append-to-body
    >
      <el-form :model="enhancedCapacityForm" label-position="top" class="capacity-form-clean">
        <section class="capacity-form-section">
          <div class="capacity-basic-grid enhanced-basic-grid">
            <el-form-item label="增强通道" required>
              <el-select v-model="enhancedCapacityForm.channelName" placeholder="请选择增强通道" class="full-width">
                <el-option label="增强通道" value="增强通道" />
                <el-option label="增强通道 II" value="增强通道 II" />
              </el-select>
            </el-form-item>
            <el-form-item label="状态" required>
              <el-select v-model="enhancedCapacityForm.status" placeholder="请选择状态" class="full-width">
                <el-option label="启用" value="启用" />
                <el-option label="停用" value="停用" />
              </el-select>
            </el-form-item>
          </div>
        </section>

        <section class="capacity-form-section">
          <div class="capacity-section-header capability-section-header">
            <div>
              <div class="capacity-section-title">能力明细</div>
            </div>
            <el-button type="primary" plain @click="addEnhancedCapabilityItem">新增一行</el-button>
          </div>

          <el-table :data="enhancedCapacityForm.modelItems" border class="capability-edit-table-clean enhanced-edit-table-clean">
            <el-table-column label="支持模型" min-width="180">
              <template #default="{ row }">
                <el-input v-model="row.model" placeholder="DeepSeek" clearable />
              </template>
            </el-table-column>
            <el-table-column width="120" align="center">
              <template #header><div class="capability-header-multi"><div>RPS</div><div>（每秒问题数）</div></div></template>
              <template #default="{ row }"><el-input v-model="row.rps" placeholder="2" clearable /></template>
            </el-table-column>
            <el-table-column width="130" align="center">
              <template #header><div class="capability-header-multi"><div>RPM</div><div>（每分钟问题数）</div></div></template>
              <template #default="{ row }"><el-input v-model="row.rpm" placeholder="120" clearable /></template>
            </el-table-column>
            <el-table-column width="130" align="center">
              <template #header><div class="capability-header-multi"><div>RPD</div><div>（每天问题数）</div></div></template>
              <template #default="{ row }"><el-input v-model="row.rpd" placeholder="5000" clearable /></template>
            </el-table-column>
            <el-table-column label="今日已用" width="115" align="center">
              <template #default="{ row }"><el-input v-model="row.used" placeholder="0" clearable /></template>
            </el-table-column>
            <el-table-column label="今日剩余" width="115" align="center">
              <template #default="{ row }"><el-input :model-value="getEnhancedRemaining(row)" disabled /></template>
            </el-table-column>
            <el-table-column label="操作" width="80" align="center">
              <template #default="{ $index }">
                <el-button link type="danger" :disabled="enhancedCapacityForm.modelItems.length <= 1" @click="removeEnhancedCapabilityItem($index)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </section>

        <section class="capacity-form-section">
          <div class="capacity-section-header">
            <div>
              <div class="capacity-section-title">备注</div>
            </div>
          </div>
          <el-form-item class="capacity-remark-form-item">
            <el-input v-model="enhancedCapacityForm.remark" type="textarea" :rows="4" resize="none" placeholder="选填" />
          </el-form-item>
        </section>
      </el-form>
      <template #footer>
        <div class="capacity-dialog-footer">
          <el-button @click="enhancedCapacityDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveEnhancedCapacityRecord">保存</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="logVisible" :title="logDialogTitle" width="920px">
      <el-table :data="selectedModelLogs" border class="log-table">
        <el-table-column prop="time" label="时间" width="160" />
        <el-table-column prop="type" label="类型" width="110" />
        <el-table-column prop="code" label="错误码" width="170" show-overflow-tooltip />
        <el-table-column prop="message" label="异常信息" min-width="260" show-overflow-tooltip />
        <el-table-column prop="affected" label="影响问题数" width="110" align="center" />
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getLogStatusType(row.status)" effect="plain" size="small">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const taskStatsMap = {
  standard: {
    deepseek: { queued: 86, todayTotal: 1280, completed: 1048, failed: 0, load: 48, remark: '-' },
    moonshot: { queued: 64, todayTotal: 1168, completed: 986, failed: 0, load: 42, remark: '-' },
    doubao: { queued: 128, todayTotal: 1540, completed: 1236, failed: 1, load: 61, remark: '-' },
    qwen: { queued: 72, todayTotal: 1326, completed: 1114, failed: 0, load: 46, remark: '-' },
    hunyuan: { queued: 48, todayTotal: 1094, completed: 972, failed: 0, load: 35, remark: '-' },
    ernie: { queued: 58, todayTotal: 1182, completed: 1026, failed: 0, load: 39, remark: '-' }
  },
  enhanced: {
    deepseek: { queued: 186, todayTotal: 1846, completed: 1384, failed: 2, load: 72, remark: '-' },
    moonshot: { queued: 142, todayTotal: 1732, completed: 1296, failed: 0, load: 66, remark: '-' },
    doubao: { queued: 214, todayTotal: 2108, completed: 1562, failed: 3, load: 84, remark: '-' },
    qwen: { queued: 168, todayTotal: 1905, completed: 1420, failed: 0, load: 70, remark: '-' },
    hunyuan: { queued: 104, todayTotal: 1456, completed: 1188, failed: 0, load: 58, remark: '-' },
    ernie: { queued: 136, todayTotal: 1608, completed: 1264, failed: 1, load: 63, remark: '-' }
  },
  'enhanced-ii': {
    deepseek: { queued: 252, todayTotal: 2360, completed: 1688, failed: 31, load: 128, remark: '队列阻塞，排队问题持续增长' },
    moonshot: { queued: 340, todayTotal: 2184, completed: 928, failed: 10, load: 316, remark: '连续 10 个问题重试失败' },
    doubao: { queued: 208, todayTotal: 2298, completed: 1716, failed: 0, load: 80, remark: '-' },
    qwen: { queued: 196, todayTotal: 2076, completed: 1584, failed: 7, load: 76, remark: '接口限流，部分问题重试中' },
    hunyuan: { queued: 154, todayTotal: 1824, completed: 1370, failed: 0, load: 68, remark: '-' },
    ernie: { queued: 178, todayTotal: 1940, completed: 1486, failed: 0, load: 71, remark: '-' }
  }
}

const buildModelList = (channelKey, enabled = true, capabilities = {}) => ([
  { key: 'deepseek', name: 'DeepSeek', short: 'DS', logoClass: 'deepseek', executionStatus: 'running', dailyLoadLimit: 3000, enabled, taskStats: taskStatsMap[channelKey].deepseek, ...capabilities },
  { key: 'moonshot', name: 'Kimi', short: 'K', logoClass: 'moonshot', executionStatus: 'running', dailyLoadLimit: 2800, enabled, taskStats: taskStatsMap[channelKey].moonshot, ...capabilities },
  { key: 'doubao', name: '豆包', short: '豆', logoClass: 'doubao', executionStatus: 'running', dailyLoadLimit: 3500, enabled, taskStats: taskStatsMap[channelKey].doubao, ...capabilities },
  { key: 'qwen', name: '通义千问', short: 'Q', logoClass: 'qwen', executionStatus: 'running', dailyLoadLimit: 3200, enabled, taskStats: taskStatsMap[channelKey].qwen, ...capabilities },
  { key: 'hunyuan', name: '腾讯元宝', short: '元', logoClass: 'hunyuan', executionStatus: 'idle', dailyLoadLimit: 2600, enabled, taskStats: taskStatsMap[channelKey].hunyuan, ...capabilities },
  { key: 'ernie', name: '文心一言', short: '文', logoClass: 'ernie', executionStatus: 'idle', dailyLoadLimit: 2600, enabled, taskStats: taskStatsMap[channelKey].ernie, ...capabilities }
])

const standardCapabilities = { webSearch: true, deepThinking: false, allScreenshot: false, mentionScreenshot: false, shareLink: false }
const enhancedCapabilities = { webSearch: true, deepThinking: true, allScreenshot: true, mentionScreenshot: true, shareLink: true }
const fullCapabilities = { webSearch: true, deepThinking: true, allScreenshot: true, mentionScreenshot: true, shareLink: false }

const createModelChannels = () => ([
  {
    key: 'standard',
    name: '标准通道',
    tag: '日常监控',
    description: '包含标准能力：联网搜索、答案采集、信源采集。',
    enabled: true,
    models: buildModelList('standard', true, standardCapabilities)
  },
  {
    key: 'enhanced',
    name: '增强通道',
    tag: '能力完整',
    description: '包含完整能力：联网搜索、答案采集、信源采集、深度思考、全部截图、提及截图、分享链接。',
    enabled: true,
    models: buildModelList('enhanced', true, enhancedCapabilities)
  },
  {
    key: 'enhanced-ii',
    name: '增强通道 II',
    tag: '能力完整',
    description: '包含完整能力：联网搜索、答案采集、信源采集、深度思考、全部截图、提及截图。',
    enabled: true,
    models: buildModelList('enhanced-ii', true, fullCapabilities).map(model => (
      model.key === 'moonshot' ? { ...model, executionStatus: 'abnormal' } : model
    ))
  }
])

const capacityRows = ref([
  {
    id: 1,
    provider: '通义千问',
    accessChannel: '阿里云百炼',
    nativeModel: 'qwen-turbo / qwen-plus / qwen-max / qwen-longcontext',
    nativeModelItems: ['qwen-turbo', 'qwen-plus', 'qwen-max', 'qwen-longcontext'],
    capabilityItems: [
      { model: 'qwen-turbo', rpm: '500', qps: '基础层约 5-10 / 企业扩展 50+', tpm: '500k', tpd: '未公开' },
      { model: 'qwen-plus', rpm: '200', qps: '基础层约 5-10 / 企业扩展 50+', tpm: '200k', tpd: '未公开' },
      { model: 'qwen-max', rpm: '60', qps: '基础层约 5-10 / 企业扩展 50+', tpm: '100k', tpd: '未公开' },
      { model: 'qwen-longcontext', rpm: '5', qps: '基础层约 5-10 / 企业扩展 50+', tpm: '150万', tpd: '未公开' }
    ],
    capabilityNote: '通义千问 QPS 为账号/业务层口径，RPM/TPM 为模型层口径。',
    apiType: '托管API',
    concurrency: '以 QPM 作为实际限制指标。\n通义千问 QPS 为账号/业务层口径，RPM/TPM 为模型层口径。',
    rpm: 'qwen-turbo 500 / qwen-plus 200 / qwen-max 60 / qwen-longcontext 5',
    rpmItems: [
      { name: 'qwen-turbo', value: '500' },
      { name: 'qwen-plus', value: '200' },
      { name: 'qwen-max', value: '60' },
      { name: 'qwen-longcontext', value: '5' }
    ],
    rpmNote: '各模型差异大',
    tpm: 'turbo 500k / plus 200k / max 100k / longcontext 150万',
    tpmItems: [
      { name: 'turbo', value: '500k' },
      { name: 'plus', value: '200k' },
      { name: 'max', value: '100k' },
      { name: 'longcontext', value: '150万' }
    ],
    tpmNote: '按模型区分',
    tpd: '未公开',
    qps: '基础层约 5-10；企业客户可申请扩展至 50+',
    qpsItems: [
      { name: '基础层', value: '约 5-10' },
      { name: '企业扩展', value: '50+' }
    ],
    qpsNote: '即 3000+ QPM',
    source: '供应商口径',
    risk: 'limited'
  },
  {
    id: 2,
    provider: 'DeepSeek',
    accessChannel: '火山方舟',
    nativeModel: 'deepseek-v3 / deepseek-r1',
    nativeModelItems: ['deepseek-v3', 'deepseek-r1'],
    capabilityItems: [
      { model: 'deepseek-v3', rpm: '30,000', qps: '约 3000+', tpm: '500万', tpd: '50亿（离线批量推理配额保障）' },
      { model: 'deepseek-r1', rpm: '30,000', qps: '约 3000+', tpm: '500万', tpd: '50亿（离线批量推理配额保障）' }
    ],
    apiType: '托管API',
    concurrency: '通过火山方舟调用 DeepSeek 模型，非 DeepSeek 官方原生 API。',
    rpm: '30,000',
    rpmNote: '',
    tpm: '500万',
    tpmNote: '',
    tpd: '50亿（离线批量推理配额保障）',
    qps: '约 3000+',
    qpsNote: '',
    source: '火山方舟',
    risk: 'stable'
  },
  {
    id: 3,
    provider: '豆包',
    accessChannel: '火山方舟',
    nativeModel: 'doubao-pro / doubao-lite / doubao-seed',
    nativeModelItems: ['doubao-pro', 'doubao-lite', 'doubao-seed'],
    capabilityItems: [
      { model: 'doubao-pro', rpm: '10,000', qps: '默认约 5-20；企业认证用户可申请提升', tpm: '800,000', tpd: '未公开' },
      { model: 'doubao-lite', rpm: '10,000', qps: '默认约 5-20；企业认证用户可申请提升', tpm: '800,000', tpd: '未公开' },
      { model: 'doubao-seed', rpm: '10,000', qps: '默认约 5-20；企业认证用户可申请提升', tpm: '800,000', tpd: '未公开' }
    ],
    apiType: '托管API',
    concurrency: '通过火山方舟调用豆包模型。\nRPM/TPM 为默认配额，具体以账号开通能力为准。',
    rpm: '10,000',
    rpmNote: '默认配额',
    tpm: '800,000',
    tpmNote: '默认配额',
    tpd: '未公开',
    qps: '默认约 5-20；企业认证用户可申请提升',
    qpsNote: '',
    source: '火山方舟',
    risk: 'limited'
  },
  {
    id: 4,
    provider: '文心一言',
    accessChannel: '百度智能云千帆',
    nativeModel: 'ERNIE-3.5-8K / ERNIE-4.0-8K / ERNIE-Lite-8K',
    nativeModelItems: ['ERNIE-3.5-8K', 'ERNIE-4.0-8K', 'ERNIE-Lite-8K', 'ERNIE-Speed-8K'],
    capabilityItems: [
      { model: 'ERNIE-3.5-8K', rpm: '300', qps: '默认 100 / 可扩容至 3000', tpm: '300k', tpd: '未公开' },
      { model: 'ERNIE-4.0-8K', rpm: '-', qps: '默认 100 / 可扩容至 3000', tpm: '120k', tpd: '未公开' },
      { model: 'ERNIE-Lite-8K', rpm: '600', qps: '默认 100 / 可扩容至 3000', tpm: '600k', tpd: '未公开' },
      { model: 'ERNIE-Speed-8K', rpm: '600', qps: '默认 100 / 可扩容至 3000', tpm: '-', tpd: '未公开' }
    ],
    capabilityNote: '文心一言 QPS 为平台令牌桶口径，RPM/TPM 为不同模型默认限额。',
    apiType: '托管API',
    concurrency: '默认 100 QPS（基于令牌桶：桶容量 200，每 100ms 补充 1 个令牌）。\n文心一言 QPS 为平台令牌桶口径，RPM/TPM 为不同模型默认限额。',
    rpm: 'ERNIE-3.5-8K 默认 300 / ERNIE-Lite-8K 默认 600 / ERNIE-Speed-8K 默认 600',
    rpmItems: [
      { name: 'ERNIE-3.5-8K', value: '300' },
      { name: 'ERNIE-Lite-8K', value: '600' },
      { name: 'ERNIE-Speed-8K', value: '600' }
    ],
    rpmNote: '不同模型差异大',
    tpm: 'ERNIE-3.5-8K 300k / ERNIE-4.0-8K 120k / ERNIE-Lite-8K 600k',
    tpmItems: [
      { name: 'ERNIE-3.5-8K', value: '300k' },
      { name: 'ERNIE-4.0-8K', value: '120k' },
      { name: 'ERNIE-Lite-8K', value: '600k' }
    ],
    tpmNote: '不同模型差异大',
    tpd: '未公开',
    qps: '默认 100；可申请扩容至 3000',
    qpsItems: [
      { name: '默认', value: '100' },
      { name: '申请扩容', value: '3000' }
    ],
    qpsNote: '',
    source: '平台口径',
    risk: 'stable'
  },
  {
    id: 5,
    provider: 'Kimi',
    accessChannel: 'Moonshot 原生 API',
    nativeModel: 'moonshot-v1-8k / 32k / 128k',
    capabilityItems: [
      { model: 'moonshot-v1-8k / 32k / 128k', rpm: '~5000', qps: '约 80-100', tpm: '~400万', tpd: '默认不设独立日限' }
    ],
    apiType: '原生API',
    concurrency: '~400',
    rpm: '~5000',
    rpmNote: '',
    tpm: '~400万',
    tpmNote: '',
    tpd: '默认不设独立日限',
    qps: '约 80-100',
    qpsNote: 'RPM / 60 换算',
    source: 'Tier 4',
    risk: 'stable'
  }
])


const enhancedCapabilityRows = ref([
  {
    id: 1,
    channelName: '增强通道',
    status: '启用',
    modelItems: [
      { model: 'DeepSeek', rps: '2', rpm: '120', rpd: '5000', used: '1384' },
      { model: 'Kimi', rps: '2', rpm: '120', rpd: '5000', used: '1296' },
      { model: '豆包', rps: '3', rpm: '180', rpd: '6000', used: '1562' },
      { model: '通义千问', rps: '2', rpm: '120', rpd: '5000', used: '1420' },
      { model: '腾讯元宝', rps: '1', rpm: '90', rpd: '4000', used: '1188' },
      { model: '文心一言', rps: '1', rpm: '90', rpd: '4000', used: '1264' }
    ],
    remark: '调用第三方增强系统 A。\n按问题请求数计量，深度思考、截图采集、分享链接共用额度。'
  },
  {
    id: 2,
    channelName: '增强通道 II',
    status: '启用',
    modelItems: [
      { model: 'DeepSeek', rps: '1', rpm: '60', rpd: '3000', used: '1688' },
      { model: 'Kimi', rps: '1', rpm: '60', rpd: '3000', used: '928' },
      { model: '豆包', rps: '2', rpm: '120', rpd: '4500', used: '1716' },
      { model: '通义千问', rps: '1', rpm: '60', rpd: '3000', used: '1584' },
      { model: '腾讯元宝', rps: '1', rpm: '60', rpd: '3000', used: '1370' },
      { model: '文心一言', rps: '1', rpm: '60', rpd: '3000', used: '1486' }
    ],
    remark: '调用第三方增强系统 B。\n不单独展示三方系统接口列，接口说明统一放备注。'
  }
])

const activeTab = ref('enhancedCapacity')
const editing = ref(false)
const editingSnapshot = ref('')
const editingLoadLimitKey = ref('')
const loadLimitSnapshot = ref(null)
const logVisible = ref(false)
const selectedLogChannel = ref(null)
const selectedLogModel = ref(null)
const capacityDialogVisible = ref(false)
const editingCapacityId = ref(null)
const capacityForm = ref(createEmptyCapacityForm())
const enhancedCapacityDialogVisible = ref(false)
const editingEnhancedCapacityId = ref(null)
const enhancedCapacityForm = ref(createEmptyEnhancedCapacityForm())

const modelChannels = ref(createModelChannels())

const modelLogMap = {
  'standard:deepseek': [
    { time: '2026-05-27 10:20', type: '运行记录', code: 'OK', message: '问题派发正常，接口响应稳定', affected: 0, status: '正常' }
  ],
  'enhanced:deepseek': [
    { time: '2026-05-27 10:12', type: '队列积压', code: 'QUEUE_DELAY', message: '截图问题较多，平均等待时间升高', affected: 42, status: '观察中' }
  ],
  'enhanced-ii:deepseek': [
    { time: '2026-05-27 10:21', type: '队列阻塞', code: 'QUEUE_BLOCKED', message: '排队问题持续增长，实际完成问题增长缓慢', affected: 96, status: '未处理' }
  ],
  'enhanced-ii:moonshot': [
    { time: '2026-05-27 10:18', type: '欠费', code: 'PAYMENT_REQUIRED', message: '供应商账户余额不足，模型调用持续失败', affected: 64, status: '未处理' },
    { time: '2026-05-27 10:23', type: '问题失败', code: 'MODEL_CALL_FAILED', message: '连续调用失败，问题进入重试队列', affected: 18, status: '重试中' }
  ],
  'enhanced-ii:qwen': [
    { time: '2026-05-27 10:14', type: '接口限流', code: 'RATE_LIMITED', message: '供应商接口触发限流，部分问题延迟重试', affected: 37, status: '重试中' }
  ]
}

const enabledModelCount = computed(() => modelChannels.value.reduce((total, channel) => {
  return total + channel.models.filter(model => channel.enabled && model.enabled).length
}, 0))

const capacityDialogTitle = computed(() => editingCapacityId.value ? '编辑模型能力记录' : '新增三方接口')
const enhancedCapacityDialogTitle = computed(() => editingEnhancedCapacityId.value ? '编辑模型能力' : '新增三方接口')

const getChannelEnabledCount = (channel) => channel.enabled ? channel.models.filter(model => model.enabled).length : 0
const getChannelQueuedCount = (channel) => channel.models.reduce((total, model) => total + model.taskStats.queued, 0)
const modelRuntimeKey = (channel, model) => `${channel.key}:${model.key}`
const getLoadBarWidth = (load) => Math.min(100, Math.round(load / 3))
const getExecutionStatusText = (status) => {
  const statusMap = {
    running: '执行中',
    idle: '空闲中',
    abnormal: '异常'
  }
  return statusMap[status] || '空闲中'
}
const getExecutionStatusType = (status) => {
  const typeMap = {
    running: 'primary',
    idle: 'success',
    abnormal: 'danger'
  }
  return typeMap[status] || 'info'
}
const selectedModelLogs = computed(() => {
  if (!selectedLogChannel.value || !selectedLogModel.value) return []
  const key = modelRuntimeKey(selectedLogChannel.value, selectedLogModel.value)
  return modelLogMap[key] || [
    { time: '2026-05-27 10:20', type: '运行记录', code: 'OK', message: '问题执行正常，暂无异常', affected: 0, status: '正常' }
  ]
})
const logDialogTitle = computed(() => {
  if (!selectedLogChannel.value || !selectedLogModel.value) return '模型日志'
  return `${selectedLogChannel.value.name} / ${selectedLogModel.value.name} - 模型日志`
})
const getLogStatusType = (status) => {
  const statusMap = {
    正常: 'success',
    观察中: 'warning',
    重试中: 'warning',
    未处理: 'danger'
  }
  return statusMap[status] || 'info'
}

function createEmptyCapacityForm() {
  return {
    provider: '',
    accessChannel: '',
    nativeModel: '',
    nativeModelItems: [],
    capabilityItems: [createEmptyCapabilityItem()],
    apiType: '托管API',
    concurrency: '',
    rpm: '',
    rpmNote: '',
    tpm: '',
    tpmNote: '',
    tpd: '',
    qps: '',
    qpsNote: '',
    risk: 'stable'
  }
}

function createEmptyCapabilityItem() {
  return {
    model: '',
    rpm: '',
    qps: '',
    tpm: '',
    tpd: ''
  }
}

function createEmptyEnhancedCapacityForm() {
  return {
    channelName: '增强通道',
    status: '启用',
    modelItems: [createEmptyEnhancedCapabilityItem()],
    remark: ''
  }
}

function createEmptyEnhancedCapabilityItem() {
  return {
    model: '',
    rps: '',
    rpm: '',
    rpd: '',
    used: '0'
  }
}

const openModelLogs = (channel, model) => {
  selectedLogChannel.value = channel
  selectedLogModel.value = model
  logVisible.value = true
}

const getApiCapabilityItems = (row) => {
  if (row.capabilityItems?.length) return row.capabilityItems
  return [
    {
      model: row.nativeModel || row.provider,
      rpm: row.rpm,
      tpm: row.tpm,
      qps: row.qps,
      tpd: row.tpd
    }
  ]
}

const normalizeCapabilityItems = (row) => {
  const items = row?.capabilityItems?.length ? row.capabilityItems : getApiCapabilityItems(row)
  return items.map(item => ({
    model: item.model || '',
    rpm: item.rpm || '',
    qps: item.qps || '',
    tpm: item.tpm || '',
    tpd: item.tpd || row.tpd || ''
  }))
}

const openCapacityDialog = (row) => {
  editingCapacityId.value = row?.id || null
  capacityForm.value = row
    ? { ...row, capabilityItems: normalizeCapabilityItems(row) }
    : createEmptyCapacityForm()
  capacityDialogVisible.value = true
}

const addCapabilityItem = () => {
  capacityForm.value.capabilityItems.push(createEmptyCapabilityItem())
}

const removeCapabilityItem = (index) => {
  if (capacityForm.value.capabilityItems.length <= 1) return
  capacityForm.value.capabilityItems.splice(index, 1)
}

const saveCapacityRecord = () => {
  const capabilityItems = capacityForm.value.capabilityItems
    .map(item => ({
      model: item.model?.trim(),
      rpm: item.rpm?.trim(),
      qps: item.qps?.trim(),
      tpm: item.tpm?.trim(),
      tpd: item.tpd?.trim()
    }))
    .filter(item => item.model || item.rpm || item.qps || item.tpm || item.tpd)

  if (!capacityForm.value.provider || !capacityForm.value.accessChannel || !capacityForm.value.apiType) {
    ElMessage.warning('请补充展示模型、API 类型和接入渠道')
    return
  }

  if (!capabilityItems.length || capabilityItems.some(item => !item.model || !item.rpm || !item.qps || !item.tpm || !item.tpd)) {
    ElMessage.warning('请完整填写模型能力明细里的实际调用模型/API、RPM、QPS、TPM 和 TPD')
    return
  }

  const record = {
    ...capacityForm.value,
    capabilityItems,
    nativeModelItems: capabilityItems.map(item => item.model),
    nativeModel: capabilityItems.map(item => item.model).join(' / '),
    rpm: capabilityItems.map(item => `${item.model} ${item.rpm}`).join(' / '),
    qps: capabilityItems.map(item => `${item.model} ${item.qps}`).join(' / '),
    tpm: capabilityItems.map(item => `${item.model} ${item.tpm}`).join(' / '),
    tpd: capabilityItems.map(item => `${item.model} ${item.tpd}`).join(' / ')
  }

  if (editingCapacityId.value) {
    const index = capacityRows.value.findIndex(row => row.id === editingCapacityId.value)
    if (index > -1) {
      capacityRows.value[index] = { ...record, id: editingCapacityId.value }
    }
  } else {
    capacityRows.value.push({ ...record, id: Date.now() })
  }

  capacityDialogVisible.value = false
  ElMessage.success('模型能力记录已保存')
}


const getEnhancedCapabilityItems = (row) => {
  if (row.modelItems?.length) return row.modelItems
  return []
}

const parseLimitNumber = (value) => {
  if (value === undefined || value === null || value === '') return 0
  const normalized = String(value).replace(/,/g, '').trim()
  const number = Number(normalized)
  return Number.isFinite(number) ? number : 0
}

const getEnhancedRemaining = (item) => {
  const remaining = parseLimitNumber(item.rpd) - parseLimitNumber(item.used)
  return Math.max(0, remaining).toLocaleString()
}

const normalizeEnhancedCapabilityItems = (row) => {
  const items = row?.modelItems?.length ? row.modelItems : []
  return items.map(item => ({
    model: item.model || '',
    rps: item.rps || '',
    rpm: item.rpm || '',
    rpd: item.rpd || '',
    used: item.used || '0'
  }))
}

const openEnhancedCapacityDialog = (row) => {
  editingEnhancedCapacityId.value = row?.id || null
  enhancedCapacityForm.value = row
    ? { ...row, modelItems: normalizeEnhancedCapabilityItems(row) }
    : createEmptyEnhancedCapacityForm()
  enhancedCapacityDialogVisible.value = true
}

const addEnhancedCapabilityItem = () => {
  enhancedCapacityForm.value.modelItems.push(createEmptyEnhancedCapabilityItem())
}

const removeEnhancedCapabilityItem = (index) => {
  if (enhancedCapacityForm.value.modelItems.length <= 1) return
  enhancedCapacityForm.value.modelItems.splice(index, 1)
}

const saveEnhancedCapacityRecord = () => {
  const modelItems = enhancedCapacityForm.value.modelItems
    .map(item => ({
      model: item.model?.trim(),
      rps: item.rps?.trim(),
      rpm: item.rpm?.trim(),
      rpd: item.rpd?.trim(),
      used: item.used?.trim() || '0'
    }))
    .filter(item => item.model || item.rps || item.rpm || item.rpd || item.used)

  if (!enhancedCapacityForm.value.channelName || !enhancedCapacityForm.value.status) {
    ElMessage.warning('请补充增强通道和状态')
    return
  }

  if (!modelItems.length || modelItems.some(item => !item.model || !item.rps || !item.rpm || !item.rpd)) {
    ElMessage.warning('请完整填写支持模型、RPS、RPM 和 RPD')
    return
  }

  const record = {
    ...enhancedCapacityForm.value,
    modelItems
  }

  if (editingEnhancedCapacityId.value) {
    const index = enhancedCapabilityRows.value.findIndex(row => row.id === editingEnhancedCapacityId.value)
    if (index > -1) {
      enhancedCapabilityRows.value[index] = { ...record, id: editingEnhancedCapacityId.value }
    }
  } else {
    enhancedCapabilityRows.value.push({ ...record, id: Date.now() })
  }

  enhancedCapacityDialogVisible.value = false
  ElMessage.success('增强能力记录已保存')
}

const handleTabChange = () => {
  if (editing.value) cancelEdit()
  cancelLoadLimitEdit()
}

const startEdit = () => {
  cancelLoadLimitEdit()
  editingSnapshot.value = JSON.stringify(modelChannels.value)
  editing.value = true
}

const cancelEdit = () => {
  if (editingSnapshot.value) {
    modelChannels.value = JSON.parse(editingSnapshot.value)
  }
  editing.value = false
  editingSnapshot.value = ''
}

const startLoadLimitEdit = (channel, model) => {
  if (editing.value) return
  editingLoadLimitKey.value = modelRuntimeKey(channel, model)
  loadLimitSnapshot.value = model.dailyLoadLimit
}

const cancelLoadLimitEdit = () => {
  if (!editingLoadLimitKey.value) return
  const [channelKey, modelKey] = editingLoadLimitKey.value.split(':')
  const channel = modelChannels.value.find(item => item.key === channelKey)
  const model = channel?.models.find(item => item.key === modelKey)
  if (model && loadLimitSnapshot.value !== null) {
    model.dailyLoadLimit = loadLimitSnapshot.value
  }
  editingLoadLimitKey.value = ''
  loadLimitSnapshot.value = null
}

const saveLoadLimit = (channel, model) => {
  editingLoadLimitKey.value = ''
  loadLimitSnapshot.value = null
  ElMessage.success(`${channel.name} / ${model.name} 每日负载上限已保存`)
}

const saveModelConfig = () => {
  ElMessageBox.confirm(
    '模型变更会影响客户的监控任务，可能导致采集结果、执行能力和任务稳定性发生变化。是否确认保存？',
    '重要提醒',
    {
      confirmButtonText: '确认保存',
      cancelButtonText: '取消',
      type: 'warning',
      dangerouslyUseHTMLString: false
    }
  ).then(() => {
    editing.value = false
    editingSnapshot.value = ''
    ElMessage.success('模型通道配置已保存')
  }).catch(() => {})
}
</script>

<style scoped>
.task-model-management-container { padding: 20px; }
.model-management-card { border-radius: 8px; }
.model-management-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.section-title-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.section-title { font-size: 18px; font-weight: 700; color: #1f2937; line-height: 1.3; }
.section-subtitle { margin-top: 4px; font-size: 13px; color: #64748b; }
.model-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; justify-content: flex-end; }
.model-tabs { margin-top: -4px; }
:deep(.model-tabs .el-tabs__header) { margin: 0 0 10px; }
.channel-list { display: flex; flex-direction: column; gap: 12px; }
.channel-section { border: 1px solid #dbe3ee; border-radius: 8px; background: #ffffff; overflow: hidden; }
.channel-section.disabled { background: #f8fafc; }
.channel-header { display: flex; align-items: center; justify-content: space-between; gap: 18px; padding: 10px 14px; border-bottom: 1px solid #e5edf7; background: #f8fbff; }
.channel-main { min-width: 0; }
.channel-title-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.channel-title-row strong { color: #1f2937; font-size: 16px; }
.channel-description { margin-top: 4px; color: #64748b; font-size: 12px; line-height: 1.4; }
.channel-controls { display: flex; align-items: center; gap: 12px; flex: 0 0 auto; }
.enabled-count { color: #334155; font-size: 13px; font-weight: 700; white-space: nowrap; }
.model-table { margin: 8px 14px 12px; width: calc(100% - 28px); }
.model-name-cell { display: flex; align-items: center; gap: 12px; min-width: 0; }
.model-logo { width: 30px; height: 30px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; flex: 0 0 auto; color: #fff; font-size: 13px; font-weight: 800; }
.model-logo.deepseek { background: #4f6bed; }
.model-logo.moonshot { background: #111827; }
.model-logo.doubao { background: #2563eb; }
.model-logo.qwen { background: #7c3aed; }
.model-logo.hunyuan { background: #0ea5e9; }
.model-logo.ernie { background: #2563eb; }
.model-name { min-width: 0; color: #1f2937; font-size: 15px; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.load-meter { display: flex; align-items: center; gap: 8px; }
.load-bar { width: 72px; height: 8px; border-radius: 999px; background: #e5e7eb; overflow: hidden; flex: 0 0 auto; }
.load-bar-fill { display: block; height: 100%; border-radius: inherit; background: #2563eb; }
.load-bar-fill.danger { background: #dc2626; }
.load-text { min-width: 42px; color: #334155; font-size: 12px; font-weight: 700; }
.load-text.danger { color: #dc2626; }
.load-limit-cell { display: flex; align-items: center; justify-content: center; gap: 6px; flex-wrap: wrap; }
.load-limit-cell :deep(.el-input-number) { width: 112px; }
.editable-value { padding: 0; border: 0; background: transparent; color: #2563eb; font: inherit; font-weight: 700; cursor: pointer; }
.editable-value:hover { color: #1d4ed8; text-decoration: underline; }
.queue-count { color: #1f2937; font-weight: 700; }
.queue-count.warning { color: #dc2626; }
.completed-count { color: #059669; font-weight: 700; }
.failed-count { color: #94a3b8; font-weight: 700; }
.failed-count.danger { color: #dc2626; }
.status-remark { color: #64748b; font-size: 13px; }
.status-remark.danger { color: #dc2626; font-weight: 700; }
.metric-column {
  overflow: hidden;
  background: transparent;
}

.metric-column-row {
  display: flex;
  align-items: center;
  min-height: 40px;
  height: 40px;
  padding: 0 12px;
  color: #344054;
  font-size: 13px;
  line-height: 1.35;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.metric-column-row + .metric-column-row {
  border-top: 1px solid #edf0f5;
}

.metric-column-row-center {
  justify-content: center;
  text-align: center;
}

.metric-column-row strong {
  min-width: 0;
  color: #1f2937;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.metric-column-note {
  min-height: 32px;
  border-top: 1px solid #edf0f5;
  padding: 7px 12px;
  color: #8a94a6;
  font-size: 12px;
  line-height: 1.35;
  background: #fcfcfd;
}

.metric-column-model .metric-column-note {
  text-align: left;
}

.capacity-remark-text {
  width: 100%;
  color: #475569;
  font-size: 13px;
  line-height: 1.55;
  white-space: pre-line;
  word-break: break-word;
}
.capacity-table { width: 100%; }
.provider-cell { display: flex; align-items: center; gap: 8px; min-width: 0; padding: 0 10px; }
.provider-name { color: #1f2937; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.metric-cell { display: flex; flex-direction: column; gap: 4px; line-height: 1.45; }
.metric-cell strong { color: #1f2937; font-weight: 800; }
.metric-cell span { color: #64748b; font-size: 12px; }
.model-api-list,
.metric-list { display: flex; flex-direction: column; gap: 6px; line-height: 1.35; }
.model-api-item { color: #1f2937; font-size: 13px; font-weight: 600; }
.metric-list-row { display: grid; grid-template-columns: minmax(110px, 1fr) auto; align-items: center; gap: 10px; padding: 4px 8px; border-radius: 6px; background: #f8fafc; }
.metric-list-row span { color: #475569; font-size: 12px; }
.metric-list-row strong { color: #1f2937; font-size: 13px; font-weight: 800; white-space: nowrap; }
.metric-list em { color: #64748b; font-size: 12px; font-style: normal; }
.capacity-form-clean {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.capacity-form-section {
  border: 1px solid #e5edf7;
  border-radius: 10px;
  background: #ffffff;
  padding: 14px 16px 16px;
}
.capacity-section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
}
.capacity-section-title {
  color: #1f2937;
  font-size: 15px;
  font-weight: 800;
  line-height: 1.35;
}
.capacity-section-desc {
  margin-top: 3px;
  color: #64748b;
  font-size: 12px;
  line-height: 1.45;
}
.capacity-basic-grid {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr 1.2fr;
  gap: 16px;
  align-items: start;
}
.enhanced-basic-grid {
  grid-template-columns: 1fr 1fr;
}
.full-width { width: 100%; }
.capacity-form-clean :deep(.el-form-item) {
  margin-bottom: 0;
}
.capacity-form-clean :deep(.el-form-item__label) {
  margin-bottom: 6px;
  color: #344054;
  font-weight: 700;
  line-height: 1.35;
}
.capability-section-header {
  align-items: center;
}
.capability-edit-table-clean {
  width: 100%;
}
.capability-edit-table-clean :deep(.el-table__header .el-table__cell) {
  padding: 8px 0;
  background: #f8fafc;
}
.capability-edit-table-clean :deep(.el-table__body .el-table__cell) {
  padding: 7px 0;
  vertical-align: middle;
}
.capability-edit-table-clean :deep(.cell) {
  padding: 0 8px;
}
.capability-edit-table-clean :deep(.el-table__header .cell) {
  padding: 0 6px;
}
.capability-header-multi {
  line-height: 18px;
  text-align: center;
  white-space: normal;
}
.capability-header-multi div:first-child {
  color: #303133;
  font-size: 13px;
  font-weight: 700;
}
.capability-header-multi div:last-child {
  color: #64748b;
  font-size: 12px;
  font-weight: 500;
}
.capability-edit-table-clean :deep(.el-input__wrapper) {
  min-height: 34px;
}
.capability-edit-table-clean :deep(.el-input__inner) {
  text-align: center;
}
.capability-edit-table-clean :deep(.el-table__body-wrapper) {
  overflow-x: hidden;
}
.capacity-remark-form-item {
  margin-bottom: 0;
}
.capacity-dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
.log-table { width: 100%; }
:deep(.model-table .el-table__cell) { padding: 7px 0; }
:deep(.capacity-table .el-table__cell) { padding: 0; }
:deep(.model-table .el-table__header .el-table__cell),
:deep(.capacity-table .el-table__header .el-table__cell) { padding: 8px 0; }
:deep(.capacity-table .cell) { padding: 0; }
:deep(.capacity-table .el-table__header .cell) { padding: 0 12px; }
:deep(.capacity-table .capacity-normal-cell .cell) {
  min-height: 40px;
  padding: 0 12px;
  display: flex;
  align-items: center;
}
:deep(.capacity-table .capacity-normal-cell.is-center .cell) {
  justify-content: center;
}
:deep(.capacity-table .el-table__body .el-table__row:hover > td.el-table__cell) { background: #f8fbff; }

.api-capacity-table :deep(.metric-column-row) {
  padding-left: 10px;
  padding-right: 10px;
}
.api-capacity-table :deep(.el-table__header .cell) {
  padding-left: 8px;
  padding-right: 8px;
}
.api-capacity-table :deep(.capacity-normal-cell .cell) {
  padding-left: 10px;
  padding-right: 10px;
}
.api-capacity-table .capacity-remark-text {
  font-size: 12px;
  line-height: 1.5;
}

@media (max-width: 980px) {
}

@media (max-width: 768px) {
  .capacity-basic-grid { grid-template-columns: 1fr; }
  .model-management-header { flex-direction: column; align-items: stretch; }
  .model-actions { justify-content: flex-start; }
  .channel-header { flex-direction: column; align-items: stretch; }
  .channel-controls { flex-wrap: wrap; }
  .model-table { margin: 12px; width: calc(100% - 24px); }
}
</style>
