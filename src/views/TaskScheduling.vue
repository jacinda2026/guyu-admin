<template>
  <section class="task-dashboard">
    <div v-if="viewMode === 'list'" class="dashboard-titlebar">
      <div>
        <h2 class="page-title">任务调度</h2>
        <p class="page-desc">管控系统任务调度执行状态</p>
      </div>
      <el-button type="primary" class="create-btn">+ 新建调度</el-button>
    </div>

    <template v-if="viewMode === 'list'">
    <el-row :gutter="20" class="stat-row">
      <el-col :span="6">
        <el-card shadow="never" class="stat-card">
          <div class="stat-icon-box bg-blue">
            <el-icon><Tickets /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-num">{{ stats.total }}</div>
            <div class="stat-label">总调度数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never" class="stat-card">
          <div class="stat-icon-box bg-green">
            <el-icon><VideoPlay /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-num">{{ stats.running }}</div>
            <div class="stat-label">运行中</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never" class="stat-card">
          <div class="stat-icon-box bg-purple">
            <el-icon><CircleCheck /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-num">{{ stats.paused }}</div>
            <div class="stat-label">已暂停</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never" class="stat-card">
          <div class="stat-icon-box bg-red">
            <el-icon><Warning /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-num">{{ stats.error }}</div>
            <div class="stat-label">异常</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never" class="table-panel">
      <div class="table-toolbar">
        <div class="toolbar-left">
          <span class="table-title">调度列表</span>
        </div>
        <div class="toolbar-right">
          <el-select v-model="filters.status" placeholder="全部状态" size="default" style="width: 120px" clearable>
            <el-option label="运行中" value="running" />
            <el-option label="已暂停" value="paused" />
            <el-option label="异常" value="error" />
          </el-select>
          <el-input 
            v-model="filters.keyword" 
            placeholder="搜索调度名称" 
            size="default" 
            clearable 
            style="width: 200px"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>
      </div>

      <el-table :data="filteredTasks" style="width: 100%" class="custom-table" header-row-class-name="table-header">
        <el-table-column label="调度名称" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="name-cell">
              <span class="status-dot" :class="row.status"></span>
              <button type="button" class="name-link" @click="openScheduleDetail(row)">{{ row.name }}</button>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="监控模型" min-width="180">
          <template #default="{ row }">
            <div class="model-badges">
              <el-tooltip v-for="model in getScheduleModels(row)" :key="model.key" :content="model.name" placement="top">
                <span class="model-badge" :class="model.key">{{ model.short }}</span>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="用户" min-width="120">
          <template #default="{ row }">
            <div class="ownership-cell">
              <div class="user-name"><el-icon><User /></el-icon> {{ row.userName }}</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="调度配置/Cron" min-width="150" align="center">
          <template #default="{ row }">
            <div v-if="row.cron" class="cron-cell">
              <div class="cron-code">{{ row.cron }}</div>
            </div>
            <div v-else class="cron-empty">- - -</div>
          </template>
        </el-table-column>

        <el-table-column prop="description" label="调度描述" min-width="150" show-overflow-tooltip />

        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag v-if="row.status === 'running'" type="success" size="small" effect="plain" class="status-tag">运行中</el-tag>
            <el-tag v-else-if="row.status === 'paused'" type="info" size="small" effect="plain" class="status-tag">已暂停</el-tag>
            <el-tag v-else-if="row.status === 'error'" type="danger" size="small" effect="plain" class="status-tag">异常</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="下次执行时间" min-width="160">
          <template #default="{ row }">
            <div class="time-cell">
              <div v-if="row.nextRunAt">{{ row.nextRunAt }}</div>
              <div v-else>-</div>
              <div class="timezone" v-if="row.nextRunAt">Asia/Shanghai</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="maxConcurrency" label="最大并发数" width="100" align="center" />
        
        <el-table-column prop="createdAt" label="创建时间" min-width="160" />

        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button size="small" type="warning" class="action-btn">编辑</el-button>
              
              <el-button v-if="row.status === 'running'" size="small" type="danger" class="action-btn" @click="toggleStatus(row)">停止</el-button>
              <el-button v-else size="small" type="success" class="action-btn" @click="toggleStatus(row)">启动</el-button>
              
              <el-button size="small" type="primary" class="action-btn" @click="openScheduleDetail(row)">详情</el-button>
              <el-button size="small" type="success" class="action-btn" @click="handleExecute(row)">执行</el-button>
              <el-button size="small" type="info" class="action-btn">计算</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :background="true"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
        />
      </div>
    </el-card>
    </template>

    <template v-else-if="viewMode === 'detail'">
      <el-card shadow="never" class="drawer-panel detail-panel">
        <div class="table-toolbar">
          <div class="toolbar-left">
            <span class="table-title">执行记录列表</span>
            <el-tag size="small" effect="plain">共 {{ executionRecords.length }} 条记录</el-tag>
          </div>
          <div class="toolbar-right">
            <el-select v-model="executionFilters.status" placeholder="选择状态" clearable style="width: 150px">
              <el-option label="执行中" value="running" />
              <el-option label="已完成" value="completed" />
              <el-option label="失败" value="failed" />
            </el-select>
            <el-input v-model="executionFilters.keyword" placeholder="搜索执行记录" clearable style="width: 220px">
              <template #prefix><el-icon><Search /></el-icon></template>
            </el-input>
          </div>
        </div>

        <el-table :data="filteredExecutionRecords" class="custom-table" header-row-class-name="table-header">
          <el-table-column prop="no" label="No." width="80" align="center" />
          <el-table-column label="执行时间" min-width="220" align="center">
            <template #default="{ row }">
              <button type="button" class="table-link" @click="openExecutionDetail(row)">{{ row.executionTime }}</button>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="110" align="center">
            <template #default="{ row }">
              <el-tag :type="row.status === 'completed' ? 'success' : row.status === 'running' ? 'primary' : 'danger'" effect="plain">
                {{ getExecutionStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="total" label="总任务数" width="110" align="center" />
          <el-table-column prop="completed" label="已完成" width="110" align="center" />
          <el-table-column prop="failed" label="失败数" width="110" align="center" />
          <el-table-column label="开始时间" min-width="220" align="center">
            <template #default="{ row }">
              <div>{{ row.startedAt }}</div>
            </template>
          </el-table-column>
          <el-table-column label="结束时间" min-width="220" align="center">
            <template #default="{ row }">{{ row.finishedAt || '-' }}</template>
          </el-table-column>
          <el-table-column label="实际用时" width="120" align="center">
            <template #default="{ row }">{{ getExecutionDuration(row) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="120" align="center" fixed="right">
            <template #default="{ row }">
              <el-button size="small" type="primary" class="action-btn" @click="openExecutionDetail(row)">详情</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </template>

    <template v-else>
      <el-card shadow="never" class="drawer-panel detail-panel">
        <div class="table-toolbar">
          <div class="toolbar-left">
            <span class="table-title">任务列表</span>
            <el-tag size="small" effect="plain">共 {{ questionRecords.length }} 条记录</el-tag>
          </div>
          <div class="toolbar-right">
            <el-select v-model="questionFilters.status" placeholder="选择状态" clearable style="width: 150px">
              <el-option label="已完成" value="completed" />
              <el-option label="执行中" value="running" />
              <el-option label="失败" value="failed" />
            </el-select>
            <el-select v-model="questionFilters.provider" placeholder="选择模型供应商" clearable style="width: 170px">
              <el-option label="deepseek" value="deepseek" />
              <el-option label="wenxin" value="wenxin" />
              <el-option label="hunyuan" value="hunyuan" />
              <el-option label="doubao" value="doubao" />
            </el-select>
            <el-input v-model="questionFilters.keyword" placeholder="搜索问题内容或模型" clearable style="width: 230px">
              <template #prefix><el-icon><Search /></el-icon></template>
            </el-input>
          </div>
        </div>

        <el-table :data="filteredQuestionRecords" class="custom-table" header-row-class-name="table-header">
          <el-table-column prop="no" label="No." width="64" align="center" />
          <el-table-column prop="question" label="问题内容" min-width="220" />
          <el-table-column prop="channelType" label="通道类型" width="104" align="center" />
          <el-table-column prop="modelCode" label="模型代码" width="118" align="center">
            <template #default="{ row }"><el-tag type="success" effect="plain">{{ row.modelCode }}</el-tag></template>
          </el-table-column>
          <el-table-column label="深度思索" width="88" align="center">
            <template #default="{ row }"><span :class="row.deepThinking ? 'cap-yes' : 'cap-no'">{{ row.deepThinking ? '√' : 'x' }}</span></template>
          </el-table-column>
          <el-table-column label="全部截图" width="88" align="center">
            <template #default="{ row }"><span :class="row.allScreenshot ? 'cap-yes' : 'cap-no'">{{ row.allScreenshot ? '√' : 'x' }}</span></template>
          </el-table-column>
          <el-table-column label="截图" width="72" align="center">
            <template #default="{ row }"><span :class="row.screenshot ? 'cap-yes' : 'cap-no'">{{ row.screenshot ? '√' : 'x' }}</span></template>
          </el-table-column>
          <el-table-column label="分享链接" width="88" align="center">
            <template #default="{ row }"><span :class="row.shareLink ? 'cap-yes' : 'cap-no'">{{ row.shareLink ? '√' : 'x' }}</span></template>
          </el-table-column>
          <el-table-column label="状态" width="96" align="center">
            <template #default="{ row }">
              <el-tag :type="row.status === 'completed' ? 'success' : row.status === 'running' ? 'primary' : 'danger'" effect="plain">
                {{ getExecutionStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="优先级" width="80" align="center">
            <template #default="{ row }">
              <el-tag :type="row.priority >= 0 ? 'success' : 'warning'" effect="plain">{{ row.priority }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="retry" label="重试次数" width="94" align="center" />
          <el-table-column label="创建时间" width="170" align="center">
            <template #default="{ row }">
              <div>{{ row.createdAt }}</div>
            </template>
          </el-table-column>
          <el-table-column label="完成时间" width="170" align="center">
            <template #default="{ row }">
              <div>{{ row.finishedAt || '-' }}</div>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="92" align="center" fixed="right">
            <template #default>
              <el-button size="small" type="primary" class="action-btn">详情</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </template>
  </section>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
// 引入 OfficeBuilding 和 User 图标
import { Tickets, VideoPlay, CircleCheck, Warning, Search, User } from '@element-plus/icons-vue'
import { useTaskStore } from '../store/task'

const taskStore = useTaskStore()

// 顶部统计数据
const stats = reactive({
  total: 10,
  running: 7,
  paused: 0,
  error: 0
})

// 过滤表单
const filters = reactive({
  status: '',
  keyword: ''
})

// 分页数据
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 17
})

const viewMode = ref('list')
const selectedSchedule = ref(null)
const selectedExecution = ref(null)

const executionFilters = reactive({
  status: '',
  keyword: ''
})

const questionFilters = reactive({
  status: '',
  provider: '',
  keyword: ''
})

// 列表数据 (已追加 tenantName 和 userName 字段)
const modelCatalog = {
  deepseek: { key: 'deepseek', name: 'DeepSeek', short: 'D' },
  moonshot: { key: 'moonshot', name: 'Kimi', short: 'K' },
  doubao: { key: 'doubao', name: '豆包', short: '豆' },
  qwen: { key: 'qwen', name: '通义千问', short: 'Q' },
  hunyuan: { key: 'hunyuan', name: '腾讯元宝', short: '元' },
  ernie: { key: 'ernie', name: '文心一言', short: '文' }
}

const scheduleModelKeys = {
  1: ['qwen', 'doubao', 'deepseek', 'moonshot', 'ernie', 'hunyuan'],
  2: ['qwen', 'doubao', 'deepseek', 'moonshot'],
  3: ['deepseek', 'moonshot', 'doubao', 'qwen', 'hunyuan', 'ernie'],
  4: ['doubao', 'deepseek', 'moonshot', 'qwen', 'ernie', 'hunyuan'],
  5: ['qwen', 'doubao', 'deepseek', 'moonshot', 'ernie', 'hunyuan'],
  6: ['qwen', 'doubao', 'deepseek', 'moonshot', 'ernie', 'hunyuan'],
  7: ['deepseek', 'doubao', 'qwen', 'hunyuan', 'ernie', 'moonshot']
}

const getScheduleModels = row => {
  const keys = scheduleModelKeys[row.id] || ['deepseek', 'doubao']
  return keys.map(key => modelCatalog[key])
}

const scheduleTasks = ref([
  {
    id: 1,
    name: "谷雨AI",
    tenantName: "谷雨GEO科技有限公司",
    userName: "System Admin",
    cron: "0 0 */12 * * ?",
    description: "每隔12小时执行一次",
    status: "running",
    nextRunAt: "2026-05-26 12:00:00",
    maxConcurrency: 1,
    createdAt: "2026-05-20 18:19:51"
  },
  {
    id: 2,
    name: "贵州茅台",
    tenantName: "贵州茅台集团",
    userName: "品牌运营",
    cron: "0 0 */12 * * ?",
    description: "每隔12小时执行一次",
    status: "running",
    nextRunAt: "2026-05-26 12:00:00",
    maxConcurrency: 1,
    createdAt: "2026-05-20 13:44:30"
  },
  {
    id: 3,
    name: "名爵MG",
    tenantName: "上汽名爵",
    userName: "数据分析",
    cron: "0 0 */12 * * ?",
    description: "每隔12小时执行一次",
    status: "running",
    nextRunAt: "2026-05-26 12:00:00",
    maxConcurrency: 1,
    createdAt: "2026-05-19 12:40:53"
  },
  {
    id: 4,
    name: "小米汽车SU7",
    tenantName: "小米汽车",
    userName: "增长运营",
    cron: "0 0 */12 * * ?",
    description: "每隔12小时执行一次",
    status: "running",
    nextRunAt: "2026-05-26 12:00:00",
    maxConcurrency: 1,
    createdAt: "2026-05-19 08:41:42"
  },
  {
    id: 5,
    name: "觅乐Millet（法国百年户外品牌）",
    tenantName: "Millet",
    userName: "市场部",
    cron: "0 0 */12 * * ?",
    description: "每隔12小时执行一次",
    status: "running",
    nextRunAt: "2026-05-26 12:00:00",
    maxConcurrency: 1,
    createdAt: "2026-05-14 17:35:19"
  },
  {
    id: 6,
    name: "卓牧羊奶粉GEO优化",
    tenantName: "卓牧乳业",
    userName: "GEO运营",
    cron: "0 0 0 * * 2,4",
    description: "每隔12小时执行一次",
    status: "running",
    nextRunAt: "2026-05-28 00:00:00",
    maxConcurrency: 1,
    createdAt: "2026-05-13 11:59:21"
  },
  {
    id: 7,
    name: "初敏保湿霜",
    tenantName: "初敏品牌",
    userName: "品牌运营",
    cron: "0 0 0 * * *",
    description: "每隔12小时执行一次",
    status: "running",
    nextRunAt: "2026-05-27 00:00:00",
    maxConcurrency: 1,
    createdAt: "2026-05-09 11:29:21"
  }
])

const executionRecords = ref([
  { no: 1, executionTime: '2026-05-26 00:00:29.914', status: 'running', total: 186, completed: 155, failed: 0, startedAt: '2026-05-26 00:00:31.086', finishedAt: '' },
  { no: 2, executionTime: '2026-05-25 00:00:05.834', status: 'completed', total: 186, completed: 186, failed: 0, startedAt: '2026-05-25 00:00:07.674', finishedAt: '2026-05-25 00:43:59.522' },
  { no: 3, executionTime: '2026-05-24 00:00:59.206', status: 'completed', total: 186, completed: 186, failed: 0, startedAt: '2026-05-24 00:01:01.298', finishedAt: '2026-05-24 00:59:09.687' },
  { no: 4, executionTime: '2026-05-23 21:50:11.535', status: 'completed', total: 186, completed: 186, failed: 0, startedAt: '2026-05-23 21:50:12.533', finishedAt: '2026-05-23 22:19:47.263' },
  { no: 5, executionTime: '2026-05-23 14:28:54.023', status: 'running', total: 186, completed: 111, failed: 0, startedAt: '2026-05-23 14:28:54.981', finishedAt: '' },
  { no: 6, executionTime: '2026-05-23 00:06:46.320', status: 'running', total: 186, completed: 101, failed: 0, startedAt: '2026-05-23 00:06:47.437', finishedAt: '' },
  { no: 7, executionTime: '2026-05-23 00:00:12.816', status: 'running', total: 186, completed: 99, failed: 0, startedAt: '2026-05-23 00:00:16.087', finishedAt: '' },
  { no: 8, executionTime: '2026-05-22 22:23:38.835', status: 'running', total: 186, completed: 108, failed: 0, startedAt: '2026-05-22 22:23:40.791', finishedAt: '' },
  { no: 9, executionTime: '2026-05-22 00:00:44.999', status: 'running', total: 186, completed: 124, failed: 0, startedAt: '2026-05-22 00:00:46.962', finishedAt: '' },
  { no: 10, executionTime: '2026-05-21 00:00:44.629', status: 'completed', total: 186, completed: 186, failed: 0, startedAt: '2026-05-21 00:00:44.709', finishedAt: '2026-05-21 00:34:35.527' }
])

const questionRecords = ref([
  { no: 1, question: '湿疹宝宝保湿霜哪个牌子效果好', provider: 'deepseek', modelCode: 'deepseek', channelType: '增强通道', deepThinking: true, allScreenshot: true, screenshot: true, shareLink: true, status: 'completed', priority: -9, retry: '0 / 3', createdAt: '2026-05-26 00:00:29', finishedAt: '2026-05-26 00:01:12' },
  { no: 2, question: '湿疹宝宝反复瘙痒用哪个面霜好', provider: 'wenxin', modelCode: 'wenxin', channelType: '增强通道II', deepThinking: true, allScreenshot: true, screenshot: true, shareLink: false, status: 'completed', priority: 6, retry: '0 / 3', createdAt: '2026-05-26 00:00:30', finishedAt: '2026-05-26 00:01:18' },
  { no: 3, question: '湿疹宝宝保湿霜哪个牌子效果好', provider: 'hunyuan', modelCode: 'hunyuan', channelType: '标准通道', deepThinking: false, allScreenshot: false, screenshot: false, shareLink: false, status: 'completed', priority: -5, retry: '0 / 3', createdAt: '2026-05-26 00:00:29', finishedAt: '2026-05-26 00:01:06' },
  { no: 4, question: '宝宝湿疹护理膏哪个牌子好用', provider: 'wenxin', modelCode: 'wenxin', channelType: '增强通道', deepThinking: true, allScreenshot: true, screenshot: true, shareLink: true, status: 'completed', priority: 6, retry: '0 / 3', createdAt: '2026-05-26 00:00:29', finishedAt: '2026-05-26 00:01:20' },
  { no: 5, question: '宝宝湿疹无激素面霜哪个牌子好', provider: 'wenxin', modelCode: 'wenxin', channelType: '增强通道II', deepThinking: true, allScreenshot: true, screenshot: true, shareLink: false, status: 'completed', priority: -9, retry: '0 / 3', createdAt: '2026-05-26 00:00:29', finishedAt: '2026-05-26 00:01:15' },
  { no: 6, question: '儿童湿疹舒缓霜什么牌子有效', provider: 'doubao', modelCode: 'doubao', channelType: '标准通道', deepThinking: false, allScreenshot: false, screenshot: false, shareLink: false, status: 'completed', priority: -4, retry: '0 / 3', createdAt: '2026-05-26 00:00:29', finishedAt: '2026-05-26 00:01:04' },
  { no: 7, question: '宝宝湿疹护理膏哪个牌子好用', provider: 'doubao', modelCode: 'doubao', channelType: '增强通道', deepThinking: true, allScreenshot: true, screenshot: true, shareLink: true, status: 'completed', priority: 2, retry: '0 / 3', createdAt: '2026-05-26 00:00:29', finishedAt: '2026-05-26 00:01:10' },
  { no: 8, question: '儿童湿疹止痒润肤霜排行榜', provider: 'hunyuan', modelCode: 'hunyuan', channelType: '增强通道II', deepThinking: true, allScreenshot: true, screenshot: true, shareLink: false, status: 'completed', priority: 10, retry: '0 / 3', createdAt: '2026-05-26 00:00:30', finishedAt: '2026-05-26 00:01:17' },
  { no: 9, question: '湿疹宝宝反复瘙痒用哪个面霜好', provider: 'doubao', modelCode: 'doubao', channelType: '标准通道', deepThinking: false, allScreenshot: false, screenshot: false, shareLink: false, status: 'completed', priority: 2, retry: '0 / 3', createdAt: '2026-05-26 00:00:30', finishedAt: '2026-05-26 00:01:03' },
  { no: 10, question: '儿童湿疹修护霜推荐', provider: 'deepseek', modelCode: 'deepseek', channelType: '增强通道', deepThinking: true, allScreenshot: true, screenshot: true, shareLink: true, status: 'completed', priority: 9, retry: '0 / 3', createdAt: '2026-05-26 00:00:29', finishedAt: '2026-05-26 00:01:14' }
])

// 过滤计算属性
const filteredTasks = computed(() => {
  return scheduleTasks.value.filter(task => {
    const matchStatus = !filters.status || task.status === filters.status
    const matchKeyword = !filters.keyword || task.name.includes(filters.keyword)
    return matchStatus && matchKeyword
  })
})

const filteredExecutionRecords = computed(() => {
  return executionRecords.value.filter(record => {
    const matchStatus = !executionFilters.status || record.status === executionFilters.status
    const matchKeyword = !executionFilters.keyword || record.executionTime.includes(executionFilters.keyword)
    return matchStatus && matchKeyword
  })
})

const filteredQuestionRecords = computed(() => {
  return questionRecords.value.filter(record => {
    const matchStatus = !questionFilters.status || record.status === questionFilters.status
    const matchProvider = !questionFilters.provider || record.provider === questionFilters.provider
    const matchKeyword = !questionFilters.keyword || record.question.includes(questionFilters.keyword) || record.modelCode.includes(questionFilters.keyword)
    return matchStatus && matchProvider && matchKeyword
  })
})

const getExecutionStatusText = (status) => {
  const statusMap = {
    running: '执行中',
    completed: '已完成',
    failed: '失败'
  }
  return statusMap[status] || '未知'
}

const parseDateTime = (value) => {
  if (!value) return null
  const normalized = value.replace(' ', 'T')
  const date = new Date(normalized)
  return Number.isNaN(date.getTime()) ? null : date
}

const getExecutionDuration = (row) => {
  if (!row.finishedAt) return '进行中'
  const start = parseDateTime(row.startedAt)
  const end = parseDateTime(row.finishedAt)
  if (!start || !end) return '-'
  const diffSeconds = Math.max(0, Math.floor((end.getTime() - start.getTime()) / 1000))
  const minutes = Math.floor(diffSeconds / 60)
  const seconds = diffSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

const updateHeaderBreadcrumbs = () => {
  if (viewMode.value === 'list') {
    taskStore.setHeaderBreadcrumbs([
      { key: 'list', label: '任务调度' }
    ], handleHeaderBreadcrumbClick)
    return
  }

  if (viewMode.value === 'detail') {
    taskStore.setHeaderBreadcrumbs([
      { key: 'list', label: '任务调度', clickable: true },
      { key: 'detail', label: selectedSchedule.value?.name || '调度详情' }
    ], handleHeaderBreadcrumbClick)
    return
  }

  taskStore.setHeaderBreadcrumbs([
    { key: 'list', label: '任务调度', clickable: true },
    { key: 'detail', label: selectedSchedule.value?.name || '调度详情', clickable: true },
    { key: 'executionDetail', label: '问题执行情况' }
  ], handleHeaderBreadcrumbClick)
}

const handleHeaderBreadcrumbClick = (key) => {
  if (key === 'list') {
    backToScheduleList()
  } else if (key === 'detail') {
    backToExecutionList()
  }
}

const openScheduleDetail = (row) => {
  selectedSchedule.value = row
  executionFilters.status = ''
  executionFilters.keyword = ''
  viewMode.value = 'detail'
  updateHeaderBreadcrumbs()
}

const backToScheduleList = () => {
  viewMode.value = 'list'
  selectedSchedule.value = null
  selectedExecution.value = null
  updateHeaderBreadcrumbs()
}

const openExecutionDetail = (row) => {
  selectedExecution.value = row
  questionFilters.status = ''
  questionFilters.provider = ''
  questionFilters.keyword = ''
  viewMode.value = 'executionDetail'
  updateHeaderBreadcrumbs()
}

const backToExecutionList = () => {
  selectedExecution.value = null
  viewMode.value = 'detail'
  updateHeaderBreadcrumbs()
}

onMounted(() => {
  updateHeaderBreadcrumbs()
})

onUnmounted(() => {
  taskStore.clearHeaderBreadcrumbs()
})

// 操作逻辑：启停任务
const toggleStatus = (row) => {
  if (row.status === 'running') {
    row.status = 'paused'
    stats.running--
    stats.paused++
    ElMessage.warning(`任务 [${row.name}] 已停止调度`)
  } else {
    row.status = 'running'
    stats.running++
    stats.paused--
    ElMessage.success(`任务 [${row.name}] 已启动调度`)
  }
}

// 操作逻辑：手动执行（触发全局红点数字变化）
const handleExecute = (row) => {
  ElMessage.success(`指令已发送！[${row.name}] 正在排队执行...`)
  // 获取当前 store 中的数字并 +1 模拟并发上升
  const currentCount = taskStore.globalProcessingCount || 0
  taskStore.updateCount(currentCount + 1)
}
</script>

<style scoped>
.task-dashboard {
  padding: 24px;
}

/* 头部样式 */
.dashboard-titlebar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}
.page-title {
  margin: 0;
  font-size: 20px;
  color: #303133;
  font-weight: 600;
}
.page-desc {
  margin: 6px 0 0;
  font-size: 13px;
  color: #909399;
}
.create-btn {
  border-radius: 4px;
}

/* 统计卡片样式 */
.stat-row {
  margin-bottom: 24px;
}
.stat-card {
  border-radius: 6px;
  border: 1px solid #ebeef5;
}
:deep(.stat-card .el-card__body) {
  display: flex;
  align-items: center;
  padding: 20px;
}
.stat-icon-box {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin-right: 16px;
}
.bg-blue { background: #e6f1fc; color: #409eff; }
.bg-green { background: #f0f9eb; color: #67c23a; }
.bg-purple { background: #f4f4f5; color: #909399; }
.bg-red { background: #fef0f0; color: #f56c6c; }

.stat-info {
  display: flex;
  flex-direction: column;
}
.stat-num {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  line-height: 1.2;
}
.stat-label {
  font-size: 13px;
  color: #909399;
  margin-top: 4px;
}

/* 列表面板样式 */
.table-panel {
  border-radius: 6px;
}
.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.table-title {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
}
.toolbar-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.toolbar-right {
  display: flex;
  gap: 12px;
}
.drawer-panel {
  border-radius: 6px;
}
.detail-panel {
  min-height: calc(100vh - 128px);
}
:deep(.drawer-panel .el-card__body) {
  padding: 18px 24px 24px;
}

/* 表格自定义样式 */
.custom-table {
  font-size: 13px;
}
:deep(.table-header th) {
  background-color: #fafafa !important;
  color: #606266;
  font-weight: 500;
}
.name-cell {
  display: flex;
  align-items: center;
  font-weight: 500;
}
.name-link {
  padding: 0;
  border: 0;
  background: transparent;
  color: #1f2937;
  font: inherit;
  cursor: pointer;
}
.name-link:hover {
  color: #2b65f0;
  text-decoration: underline;
}
.table-link {
  padding: 0;
  border: 0;
  background: transparent;
  color: #2b65f0;
  font: inherit;
  cursor: pointer;
}
.table-link:hover {
  text-decoration: underline;
}
.model-badges {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.model-badge {
  width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  border-radius: 50%;
  font-size: 11px;
  font-weight: 800;
  line-height: 1;
}
.model-badge.deepseek { background: #4f6bed; }
.model-badge.moonshot { background: #111827; }
.model-badge.doubao { background: linear-gradient(135deg, #7c3aed, #22d3ee); }
.model-badge.qwen { background: #7c3aed; }
.model-badge.hunyuan { background: #0ea5e9; }
.model-badge.ernie { background: #2563eb; }
.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 8px;
  flex-shrink: 0;
}
.status-dot.running { background-color: #409eff; }
.status-dot.paused { background-color: #909399; }
.status-dot.error { background-color: #f56c6c; }

/* 🌟 归属租户/用户 样式 */
.ownership-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.tenant-name {
  font-size: 13px;
  color: #2b65f0;
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
}
.user-name {
  font-size: 12px;
  color: #909399;
  display: flex;
  align-items: center;
  gap: 6px;
}

.cron-code {
  color: #606266;
  letter-spacing: 1px;
}
.cron-empty {
  color: #c0c4cc;
}
.cap-yes {
  color: #22c55e;
  font-size: 18px;
  font-weight: 800;
}
.cap-no {
  color: #ef4444;
  font-size: 16px;
  font-weight: 800;
}

.status-tag {
  border-radius: 12px;
}

.time-cell {
  line-height: 1.4;
}
.timezone {
  color: #c0c4cc;
  font-size: 12px;
  transform: scale(0.9);
  transform-origin: left;
}

/* 操作按钮组样式还原 */
.action-buttons {
  display: flex;
  gap: 6px;
}
.action-btn {
  padding: 5px 12px;
  border-radius: 4px;
  font-size: 12px;
  margin-left: 0 !important;
}

/* 分页器样式 */
.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style>
