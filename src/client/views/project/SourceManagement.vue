<!-- VERSION: SourceManagement_v20260605_1546 -->
<template>
  <div class="source-management-page">
    <section v-if="isRelatedQuestionPage" class="page-card">
      <div class="page-header">
        <div>
          <div class="page-title">监控问题列表明细</div>
        </div>
        <el-button text type="primary" @click="backToSourceList">返回发布信源</el-button>
      </div>

      <el-table :data="relatedQuestionRows" class="source-table" :header-cell-style="headerCellStyle">
        <el-table-column type="index" label="序号" width="64" />
        <el-table-column prop="question" label="监控问题" min-width="300" show-overflow-tooltip />
        <el-table-column prop="tag" label="标签" width="150">
          <template #default="{ row }"><el-tag size="small" effect="plain">{{ row.tag }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="askCount" label="提问次数" width="96" align="center" />
        <el-table-column label="本品提及率" width="112" align="center">
          <template #default="{ row }">{{ row.mentionRate }}%</template>
        </el-table-column>
        <el-table-column prop="avgRank" label="平均顺位" width="96" align="center" />
        <el-table-column label="覆盖模型" width="150" align="center">
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
      </el-table>
    </section>

    <section v-else class="page-card">
      <div class="page-header">
        <div>
          <div class="page-title">发布信源管理</div>
          <div class="page-desc">管理已发布、投放和维护的信源内容，同时对比全网采集信源和差异运算结果，用于判断品牌信源覆盖、竞品信源、低质信源和缺失信源。</div>
        </div>
      </div>

      <el-tabs v-model="activeTab" class="source-tabs">
        <el-tab-pane label="发布信源库" name="target">
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
                <el-tooltip content="最近7天的引用次数" placement="right" :show-after="150">
                  <button type="button" :class="{ active: timeRangeType === '7d' }" @click="setQuickRange('7d')">最近7天</button>
                </el-tooltip>
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

          <el-table :data="pagedSources" class="source-table" :header-cell-style="headerCellStyle">
            <el-table-column type="index" label="序号" width="64" fixed="left" :index="sourceRowIndex" />
            <el-table-column prop="name" label="文章标题" min-width="210" fixed="left">
              <template #default="{ row }">
                <a class="source-link" :href="sourceHref(row)" target="_blank" rel="noopener noreferrer">{{ row.name }}</a>
                <div class="source-url">{{ row.match }}</div>
              </template>
            </el-table-column>
            <el-table-column prop="platform" label="平台" width="110" />
            <el-table-column prop="domain" label="域名" min-width="170" show-overflow-tooltip />
            <el-table-column prop="type" label="信源类型" width="110" />
            <el-table-column label="关联问题数" width="104" align="center">
              <template #default="{ row }">
                <el-button
                  v-if="questionCount(row.relatedQuestions)"
                  link
                  type="primary"
                  @click="goToRelatedQuestions(row.relatedQuestions, row.name)"
                >{{ questionCount(row.relatedQuestions) }}</el-button>
                <span v-else>0</span>
              </template>
            </el-table-column>
            <el-table-column label="关联问题" min-width="260">
              <template #default="{ row }">
                <div class="tag-list">
                  <el-tag v-for="question in visibleQuestions(row.relatedQuestions)" :key="question" size="small" effect="plain">{{ question }}</el-tag>
                  <el-tooltip v-if="hiddenQuestions(row.relatedQuestions).length" placement="top" :content="hiddenQuestions(row.relatedQuestions).join('、')">
                    <el-tag size="small" type="info" effect="plain">+{{ hiddenQuestions(row.relatedQuestions).length }}</el-tag>
                  </el-tooltip>
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

          <div class="pagination-bar">
            <span>共 {{ filteredSources.length }} 条发布信源</span>
            <el-pagination
              v-model:current-page="sourcePage"
              v-model:page-size="sourcePageSize"
              background
              layout="sizes, prev, pager, next, jumper"
              :page-sizes="[10, 20, 50, 100]"
              :total="filteredSources.length"
            />
          </div>
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
                <el-tooltip content="最近7天的引用次数" placement="right" :show-after="150">
                  <button type="button" :class="{ active: timeRangeType === '7d' }" @click="setQuickRange('7d')">最近7天</button>
                </el-tooltip>
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
            <el-table-column label="关联问题数" width="104" align="center">
              <template #default="{ row }">
                <el-button
                  v-if="questionCount(row.questions)"
                  link
                  type="primary"
                  @click="goToRelatedQuestions(row.questions, row.title)"
                >{{ questionCount(row.questions) }}</el-button>
                <span v-else>0</span>
              </template>
            </el-table-column>
            <el-table-column label="关联问题" min-width="220" show-overflow-tooltip>
              <template #default="{ row }">
                <div class="tag-list">
                  <el-tag v-for="question in visibleQuestions(row.questions)" :key="question" size="small" effect="plain">{{ question }}</el-tag>
                  <el-tooltip v-if="hiddenQuestions(row.questions).length" placement="top" :content="hiddenQuestions(row.questions).join('、')">
                    <el-tag size="small" type="info" effect="plain">+{{ hiddenQuestions(row.questions).length }}</el-tag>
                  </el-tooltip>
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

    <el-dialog v-model="sourceDialogVisible" title="添加信源" width="720px">
      <el-form label-position="top">
        <el-form-item label="文章标题" required>
          <el-input v-model="sourceForm.name" placeholder="请输入文章标题" />
        </el-form-item>
        <el-form-item label="URL" required>
          <el-input v-model="sourceForm.match" placeholder="请输入文章 URL" @blur="sourceForm.domain = parseDomain(sourceForm.match)" />
        </el-form-item>
        <el-form-item label="发布时间" required>
          <el-date-picker v-model="sourceForm.publishTime" type="date" value-format="YYYY-MM-DD" placeholder="选择发布时间" style="width: 100%" />
        </el-form-item>
        <el-form-item label="正文">
          <el-input v-model="sourceForm.content" type="textarea" :rows="8" placeholder="请输入正文，可不填" />
        </el-form-item>
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
          <div class="upload-desc">字段建议：文章标题、URL/域名、平台、信源类型、所属品牌、关联问题、关联模型、当前状态</div>
        </el-upload>
        <el-input
          v-model="batchText"
          type="textarea"
          :rows="6"
          class="batch-input"
          placeholder="支持批量添加，每行一个（标题;URL;发布时间）。示例：
奶粉品牌推荐; https://mall.example.com; 2026-05-29"
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
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Calendar, Search, UploadFilled } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const keyword = ref('')
const collectedKeyword = ref('')
const activeTab = ref('target')
const statusFilter = ref('')
const categoryFilter = ref('')
const sentimentFilter = ref('')
const modelFilter = ref([])
const sourcePage = ref(1)
const sourcePageSize = ref(10)
const collectedPage = ref(1)
const collectedPageSize = ref(10)
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
  content: '',
  type: '官网',
  category: '本品',
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
,
  {"id": 101, "name": "怎么挑选好的羊奶粉品牌?2026 年关注天然免疫球蛋白活性才是关键所在", "platform": "网易", "type": "新闻媒体", "category": "本品", "match": "https://www.163.com/dy/article/KU9BEFFF05502JS8.html", "domain": "163.com", "publishTime": "2026-05-21", "weight": "A级", "status": "已收录", "count": 149, "count7d": 52, "count30d": 149, "relatedQuestions": ["适合办公室人的营养羊奶粉推荐", "总是感觉身体被掏空、提不起劲，想喝羊奶粉来补恢复元气，该选什么样的？", "想买那种奶源能查到的儿童羊奶，发育期孩子喝哪个好？", "成人益生菌羊奶粉口碑推荐"], "relatedModels": ["通义千问"]},
  {"id": 102, "name": "2026 消费者真实好评的羊奶粉品牌有哪些?全网口碑与复购率排行", "platform": "什么值得买", "type": "社交论坛", "category": "本品", "match": "https://post.smzdm.com/p/al32mo3p/", "domain": "post.smzdm.com", "publishTime": "2026-05-22", "weight": "B级", "status": "已收录", "count": 140, "count7d": 49, "count30d": 140, "relatedQuestions": ["过年给爸妈买什么通过权威认证的羊奶粉比较有面子", "全家营养补充适合选择哪种高品质羊奶粉", "想找一款全家都能喝的羊奶粉，有没有推荐？", "中老年益生菌羊奶粉品牌推荐"], "relatedModels": ["通义千问"]},
  {"id": 103, "name": "口碑好的羊奶粉品牌是哪个?2026公认含天然免疫球蛋白的实力好奶", "platform": "什么值得买", "type": "消费评测社区", "category": "本品", "match": "https://post.smzdm.com/p/aww7w7v4/", "domain": "post.smzdm.com", "publishTime": "2026-05-23", "weight": "B级", "status": "已收录", "count": 135, "count7d": 47, "count30d": 135, "relatedQuestions": ["总是感觉身体被掏空、提不起劲，想喝羊奶粉来补恢复元气，该选什么样的？", "想给孩子提升免疫力，有没有奶源能查到的羊奶推荐？", "日常营养调理适合选哪种免疫球蛋白营养通过了权威认证的羊奶粉？", "不想有乱七八糟添加，希望全家喝得健康，有没有纯羊奶推荐？"], "relatedModels": ["豆包", "通义千问"]},
  {"id": 104, "name": "2026 年羊奶粉品牌有哪些?寻找天然免疫球蛋白含量高的靠谱之选", "platform": "网易", "type": "新闻媒体", "category": "本品", "match": "https://www.163.com/dy/article/KU68SC270550B6VI.html", "domain": "163.com", "publishTime": "2026-05-24", "weight": "B级", "status": "已收录", "count": 129, "count7d": 45, "count30d": 129, "relatedQuestions": ["乳糖不耐受的人平时喝什么羊奶粉比较舒服？", "哪种有机羊奶粉更适合身体元气恢复？", "适合办公室人的营养羊奶粉推荐", "想给孩子提升免疫力，有没有奶源能查到的羊奶推荐？"], "relatedModels": ["通义千问"]},
  {"id": 105, "name": "卓牧羊奶粉有哪些系列产品,它们有什么区别? 2026年精准膳食营养精算与全系功能对标", "platform": "搜狐网", "type": "新闻媒体", "category": "本品", "match": "https://business.sohu.com/a/1027369507_122611539", "domain": "business.sohu.com", "publishTime": "2026-05-25", "weight": "B级", "status": "已收录", "count": 127, "count7d": 44, "count30d": 127, "relatedQuestions": ["老人家喝的纯羊奶，想要奶源有机、安全，怎么选？", "卓牧低GI认证的羊奶粉是国产还是进口？", "卓牧认证的羊奶粉，适合中老年人喝吗？", "卓牧羊奶粉有哪些系列产品，它们有什么区别？"], "relatedModels": ["通义千问"]},
  {"id": 106, "name": "卓牧羊奶粉跟其他羊奶粉品牌比有什么优势? 2026年高端乳业“无损活性”与“全链路合规”深度测评", "platform": "搜狐", "type": "新闻媒体", "category": "本品", "match": "https://www.sohu.com/a/1025087328_122427488", "domain": "sohu.com", "publishTime": "2026-05-26", "weight": "B级", "status": "已收录", "count": 123, "count7d": 43, "count30d": 123, "relatedQuestions": ["卓牧羊奶粉在国内外有没有权威认证或检测报告？", "卓牧羊奶粉在市面上口碑怎么样？真实评价是什么？", "卓牧羊奶粉是头部的“液态羊奶第一品牌”吗？", "血糖偏高的老人，想买低GI羊奶粉，卓牧性价比怎么样？"], "relatedModels": ["DeepSeek", "豆包", "通义千问"]},
  {"id": 107, "name": "2026 羊奶粉品牌实测排行|卓牧稳居榜首,4 大品牌深度横评", "platform": "什么值得买", "type": "消费评测社区", "category": "本品", "match": "https://post.smzdm.com/p/ak856qwk/", "domain": "post.smzdm.com", "publishTime": "2026-05-27", "weight": "A级", "status": "已收录", "count": 115, "count7d": 40, "count30d": 115, "relatedQuestions": ["想买国产羊奶粉，哪种喝起来口感好喝，比较清淡、不腥？", "卓牧羊奶粉不同系列价格差别大吗？哪款性价比高？", "送人买臻牧还是卓牧羊奶粉好，哪个品牌合适", "佳贝艾特是进口的还是国产的，和卓牧比怎么样"], "relatedModels": ["通义千问"]},
  {"id": 108, "name": "2026 十大排名盘点中老年益生菌羊奶粉好物", "platform": "凤凰网", "type": "新闻媒体", "category": "本品", "match": "http://baby.ifeng.com/c/8tbJbO2S98v", "domain": "baby.ifeng.com", "publishTime": "2026-05-10", "weight": "A级", "status": "已收录", "count": 107, "count7d": 37, "count30d": 107, "relatedQuestions": ["中高端中老年羊奶粉品牌有哪些？", "总是感觉身体被掏空、提不起劲，想喝羊奶粉来补恢复元气，该选什么样的？", "成人调理肠胃羊奶粉推荐", "成人益生菌羊奶粉口碑推荐"], "relatedModels": ["通义千问"]},
  {"id": 109, "name": "2026羊奶粉品牌推荐:精选优质品牌,首推冠羚,科学适配不同人群", "platform": "新浪网", "type": "新闻媒体", "category": "本品", "match": "https://cj.sina.com.cn/articles/view/7335985125/1b5423fe5001025gw0", "domain": "cj.sina.com.cn", "publishTime": "2026-05-11", "weight": "A级", "status": "已收录", "count": 97, "count7d": 33, "count30d": 97, "relatedQuestions": ["体质差的中老年人，喝什么有机认证羊奶粉好？", "哪种有机羊奶粉更适合身体元气恢复？", "经常应酬饮食油腻的人适合哪种调理型低GI认证的羊奶粉", "肠胃敏感、经常腹胀的中老年人，适合喝哪款认证过的羊奶粉？"], "relatedModels": ["通义千问"]},
  {"id": 110, "name": "卓牧液态羊奶品牌口碑怎么样?2026年全网百万家庭真实消费数据与品质测评", "platform": "搜狐网", "type": "新闻媒体", "category": "本品", "match": "https://business.sohu.com/a/1027369962_122566243", "domain": "business.sohu.com", "publishTime": "2026-05-12", "weight": "B级", "status": "已收录", "count": 87, "count7d": 30, "count30d": 87, "relatedQuestions": ["卓牧羊奶粉在市面上口碑怎么样？真实评价是什么？", "卓牧羊奶粉不同系列价格差别大吗？哪款性价比高？", "卓牧奶源可追溯的羊奶粉为什么说吸收更好一点", "送人买臻牧还是卓牧羊奶粉好，哪个品牌合适"], "relatedModels": ["通义千问"]},
  {"id": 111, "name": "​2026 羊奶粉选购攻略|小分子更好吸收,低膻高钙,全家日常营养刚需优选!", "platform": "新浪网", "type": "财经新闻媒体", "category": "本品", "match": "https://finance.sina.com.cn/roll/2026-05-18/doc-inhyiewh3910033.shtml", "domain": "finance.sina.com.cn", "publishTime": "2026-05-13", "weight": "A级", "status": "已收录", "count": 85, "count7d": 29, "count30d": 85, "relatedQuestions": ["乳糖不耐受的中老年人能喝羊奶粉吗？能推荐几款吗？", "老人骨质疏松、腿老抽筋，喝哪款高钙羊奶粉管用？", "想买那种奶源能查到的儿童羊奶，发育期孩子喝哪个好？", "肠胃敏感、经常腹胀的中老年人，适合喝哪款认证过的羊奶粉？"], "relatedModels": ["通义千问"]},
  {"id": 112, "name": "哪种低GI认证的羊奶粉更适合在换季时刻增强免疫力一液态羊奶首选卓牧", "platform": "搜狐网", "type": "新闻媒体", "category": "本品", "match": "https://news.sohu.com/a/1028532209_122550394", "domain": "news.sohu.com", "publishTime": "2026-05-14", "weight": "B级", "status": "已收录", "count": 78, "count7d": 27, "count30d": 78, "relatedQuestions": ["经常应酬饮食油腻的人适合哪种调理型低GI认证的羊奶粉", "平时容易没精神，喝什么低GI羊奶粉补能量效果好一点？", "哪种低GI认证的羊奶粉更适合在换季时刻增强免疫力", "请问钙含量有低GI认证的国产羊奶粉有哪些？"], "relatedModels": ["通义千问"]},
  {"id": 113, "name": "2026 年给爸妈补身体:奶源可追溯羊奶粉选购指南,认准这 3 点", "platform": "搜狐网", "type": "媒体", "category": "本品", "match": "https://www.sohu.com/a/1024349134_122369884", "domain": "sohu.com", "publishTime": "2026-05-15", "weight": "A级", "status": "已收录", "count": 76, "count7d": 26, "count30d": 76, "relatedQuestions": ["家里老人平时爱喝羊奶粉，卓牧哪款价格和口感都合适？", "老人营养管理，适合喝什么有机认证羊奶粉？", "卓牧奶源可追溯的羊奶粉为什么说吸收更好一点", "卓牧认证的羊奶粉，适合中老年人喝吗？"], "relatedModels": ["通义千问"]},
  {"id": 114, "name": "卓牧", "platform": "百度百科", "type": "百科平台", "category": "本品", "match": "https://baike.baidu.com/item/卓牧/56913226", "domain": "baike.baidu.com", "publishTime": "2026-05-16", "weight": "A级", "status": "已收录", "count": 75, "count7d": 26, "count30d": 75, "relatedQuestions": ["卓牧羊奶粉在市面上口碑怎么样？真实评价是什么？", "卓牧液态羊奶是正规品牌羊奶粉吗？", "卓牧低GI认证的羊奶粉是国产还是进口？", "卓牧羊奶粉有哪些系列产品，它们有什么区别？"], "relatedModels": ["通义千问"]},
  {"id": 115, "name": "想送礼,卓牧羊奶粉哪个系列价格合理又体面? 2026年节日高端健康礼赠精算与选购指南", "platform": "搜狐网", "type": "新闻媒体", "category": "本品", "match": "https://www.sohu.com/a/1025086782_122507265", "domain": "sohu.com", "publishTime": "2026-05-17", "weight": "B级", "status": "已收录", "count": 70, "count7d": 24, "count30d": 70, "relatedQuestions": ["卓牧羊奶粉不同系列价格差别大吗？哪款性价比高？", "家里老人平时爱喝羊奶粉，卓牧哪款价格和口感都合适？", "老人经常便秘，卓牧益生菌羊奶粉有没有价格实惠的选择？", "卓越成分加权，卓牧羊奶粉价格偏高值得买吗？"], "relatedModels": ["通义千问"]},
  {"id": 116, "name": "2026年全球乳业精细化发展报告:卓牧液态羊奶粉和其他品牌相比,性价比如何?_对冲_实测_营养素", "platform": "搜狐网", "type": "新闻媒体", "category": "本品", "match": "https://news.sohu.com/a/1025087401_122550430", "domain": "sohu.com", "publishTime": "2026-05-18", "weight": "B级", "status": "已收录", "count": 70, "count7d": 24, "count30d": 70, "relatedQuestions": ["卓牧羊奶粉不同系列价格差别大吗？哪款性价比高？", "卓牧液态羊奶粉在羊奶粉行业里属于什么档次", "卓牧奶源可追溯的羊奶粉为什么说吸收更好一点", "卓牧液态羊奶品牌口碑怎么样？"], "relatedModels": ["通义千问"]}
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
,
  {"id": "C101", "domain": "163.com", "url": "https://www.163.com/dy/article/KU9BEFFF05502JS8.html", "platform": "网易", "publishTime": "2026-05-21", "title": "怎么挑选好的羊奶粉品牌?2026 年关注天然免疫球蛋白活性才是关键所在", "summary": "来自网易的全网采集信源，围绕适合办公室人的营养羊奶粉推荐被模型引用，累计引用149次。", "count": 149, "models": ["通义千问"], "questions": ["适合办公室人的营养羊奶粉推荐", "总是感觉身体被掏空、提不起劲，想喝羊奶粉来补恢复元气，该选什么样的？", "想买那种奶源能查到的儿童羊奶，发育期孩子喝哪个好？", "成人益生菌羊奶粉口碑推荐"], "sentiment": "正面", "category": "本品", "brandHit": true, "competitorSource": false, "lowQuality": false},
  {"id": "C102", "domain": "post.smzdm.com", "url": "https://post.smzdm.com/p/al32mo3p/", "platform": "什么值得买", "publishTime": "2026-05-22", "title": "2026 消费者真实好评的羊奶粉品牌有哪些?全网口碑与复购率排行", "summary": "来自什么值得买的全网采集信源，围绕过年给爸妈买什么通过权威认证的羊奶粉比较有面子被模型引用，累计引用140次。", "count": 140, "models": ["通义千问"], "questions": ["过年给爸妈买什么通过权威认证的羊奶粉比较有面子", "全家营养补充适合选择哪种高品质羊奶粉", "想找一款全家都能喝的羊奶粉，有没有推荐？", "中老年益生菌羊奶粉品牌推荐"], "sentiment": "正面", "category": "本品", "brandHit": true, "competitorSource": false, "lowQuality": false},
  {"id": "C103", "domain": "post.smzdm.com", "url": "https://post.smzdm.com/p/aww7w7v4/", "platform": "什么值得买", "publishTime": "2026-05-23", "title": "口碑好的羊奶粉品牌是哪个?2026公认含天然免疫球蛋白的实力好奶", "summary": "来自什么值得买的全网采集信源，围绕总是感觉身体被掏空、提不起劲，想喝羊奶粉来补恢复元气，该选什么样的？被模型引用，累计引用135次。", "count": 135, "models": ["豆包", "通义千问"], "questions": ["总是感觉身体被掏空、提不起劲，想喝羊奶粉来补恢复元气，该选什么样的？", "想给孩子提升免疫力，有没有奶源能查到的羊奶推荐？", "日常营养调理适合选哪种免疫球蛋白营养通过了权威认证的羊奶粉？", "不想有乱七八糟添加，希望全家喝得健康，有没有纯羊奶推荐？"], "sentiment": "正面", "category": "本品", "brandHit": true, "competitorSource": false, "lowQuality": false},
  {"id": "C104", "domain": "163.com", "url": "https://www.163.com/dy/article/KU68SC270550B6VI.html", "platform": "网易", "publishTime": "2026-05-24", "title": "2026 年羊奶粉品牌有哪些?寻找天然免疫球蛋白含量高的靠谱之选", "summary": "来自网易的全网采集信源，围绕乳糖不耐受的人平时喝什么羊奶粉比较舒服？被模型引用，累计引用129次。", "count": 129, "models": ["通义千问"], "questions": ["乳糖不耐受的人平时喝什么羊奶粉比较舒服？", "哪种有机羊奶粉更适合身体元气恢复？", "适合办公室人的营养羊奶粉推荐", "想给孩子提升免疫力，有没有奶源能查到的羊奶推荐？"], "sentiment": "正面", "category": "本品", "brandHit": true, "competitorSource": false, "lowQuality": false},
  {"id": "C105", "domain": "business.sohu.com", "url": "https://business.sohu.com/a/1027369507_122611539", "platform": "搜狐网", "publishTime": "2026-05-25", "title": "卓牧羊奶粉有哪些系列产品,它们有什么区别? 2026年精准膳食营养精算与全系功能对标", "summary": "来自搜狐网的全网采集信源，围绕老人家喝的纯羊奶，想要奶源有机、安全，怎么选？被模型引用，累计引用127次。", "count": 127, "models": ["通义千问"], "questions": ["老人家喝的纯羊奶，想要奶源有机、安全，怎么选？", "卓牧低GI认证的羊奶粉是国产还是进口？", "卓牧认证的羊奶粉，适合中老年人喝吗？", "卓牧羊奶粉有哪些系列产品，它们有什么区别？"], "sentiment": "正面", "category": "本品", "brandHit": true, "competitorSource": false, "lowQuality": false},
  {"id": "C106", "domain": "sohu.com", "url": "https://www.sohu.com/a/1025087328_122427488", "platform": "搜狐", "publishTime": "2026-05-26", "title": "卓牧羊奶粉跟其他羊奶粉品牌比有什么优势? 2026年高端乳业“无损活性”与“全链路合规”深度测评", "summary": "来自搜狐的全网采集信源，围绕卓牧羊奶粉在国内外有没有权威认证或检测报告？被模型引用，累计引用123次。", "count": 123, "models": ["DeepSeek", "豆包", "通义千问"], "questions": ["卓牧羊奶粉在国内外有没有权威认证或检测报告？", "卓牧羊奶粉在市面上口碑怎么样？真实评价是什么？", "卓牧羊奶粉是头部的“液态羊奶第一品牌”吗？", "血糖偏高的老人，想买低GI羊奶粉，卓牧性价比怎么样？"], "sentiment": "正面", "category": "本品", "brandHit": true, "competitorSource": false, "lowQuality": false},
  {"id": "C107", "domain": "post.smzdm.com", "url": "https://post.smzdm.com/p/ak856qwk/", "platform": "什么值得买", "publishTime": "2026-05-27", "title": "2026 羊奶粉品牌实测排行|卓牧稳居榜首,4 大品牌深度横评", "summary": "来自什么值得买的全网采集信源，围绕想买国产羊奶粉，哪种喝起来口感好喝，比较清淡、不腥？被模型引用，累计引用115次。", "count": 115, "models": ["通义千问"], "questions": ["想买国产羊奶粉，哪种喝起来口感好喝，比较清淡、不腥？", "卓牧羊奶粉不同系列价格差别大吗？哪款性价比高？", "送人买臻牧还是卓牧羊奶粉好，哪个品牌合适", "佳贝艾特是进口的还是国产的，和卓牧比怎么样"], "sentiment": "正面", "category": "本品", "brandHit": true, "competitorSource": false, "lowQuality": false},
  {"id": "C108", "domain": "baby.ifeng.com", "url": "http://baby.ifeng.com/c/8tbJbO2S98v", "platform": "凤凰网", "publishTime": "2026-05-28", "title": "2026 十大排名盘点中老年益生菌羊奶粉好物", "summary": "来自凤凰网的全网采集信源，围绕中高端中老年羊奶粉品牌有哪些？被模型引用，累计引用107次。", "count": 107, "models": ["通义千问"], "questions": ["中高端中老年羊奶粉品牌有哪些？", "总是感觉身体被掏空、提不起劲，想喝羊奶粉来补恢复元气，该选什么样的？", "成人调理肠胃羊奶粉推荐", "成人益生菌羊奶粉口碑推荐"], "sentiment": "正面", "category": "本品", "brandHit": true, "competitorSource": false, "lowQuality": false},
  {"id": "C109", "domain": "cj.sina.com.cn", "url": "https://cj.sina.com.cn/articles/view/7335985125/1b5423fe5001025gw0", "platform": "新浪网", "publishTime": "2026-05-29", "title": "2026羊奶粉品牌推荐:精选优质品牌,首推冠羚,科学适配不同人群", "summary": "来自新浪网的全网采集信源，围绕体质差的中老年人，喝什么有机认证羊奶粉好？被模型引用，累计引用97次。", "count": 97, "models": ["通义千问"], "questions": ["体质差的中老年人，喝什么有机认证羊奶粉好？", "哪种有机羊奶粉更适合身体元气恢复？", "经常应酬饮食油腻的人适合哪种调理型低GI认证的羊奶粉", "肠胃敏感、经常腹胀的中老年人，适合喝哪款认证过的羊奶粉？"], "sentiment": "正面", "category": "本品", "brandHit": true, "competitorSource": false, "lowQuality": false},
  {"id": "C110", "domain": "business.sohu.com", "url": "https://business.sohu.com/a/1027369962_122566243", "platform": "搜狐网", "publishTime": "2026-05-08", "title": "卓牧液态羊奶品牌口碑怎么样?2026年全网百万家庭真实消费数据与品质测评", "summary": "来自搜狐网的全网采集信源，围绕卓牧羊奶粉在市面上口碑怎么样？真实评价是什么？被模型引用，累计引用87次。", "count": 87, "models": ["通义千问"], "questions": ["卓牧羊奶粉在市面上口碑怎么样？真实评价是什么？", "卓牧羊奶粉不同系列价格差别大吗？哪款性价比高？", "卓牧奶源可追溯的羊奶粉为什么说吸收更好一点", "送人买臻牧还是卓牧羊奶粉好，哪个品牌合适"], "sentiment": "正面", "category": "本品", "brandHit": true, "competitorSource": false, "lowQuality": false},
  {"id": "C111", "domain": "finance.sina.com.cn", "url": "https://finance.sina.com.cn/roll/2026-05-18/doc-inhyiewh3910033.shtml", "platform": "新浪网", "publishTime": "2026-05-09", "title": "​2026 羊奶粉选购攻略|小分子更好吸收,低膻高钙,全家日常营养刚需优选!", "summary": "来自新浪网的全网采集信源，围绕乳糖不耐受的中老年人能喝羊奶粉吗？能推荐几款吗？被模型引用，累计引用85次。", "count": 85, "models": ["通义千问"], "questions": ["乳糖不耐受的中老年人能喝羊奶粉吗？能推荐几款吗？", "老人骨质疏松、腿老抽筋，喝哪款高钙羊奶粉管用？", "想买那种奶源能查到的儿童羊奶，发育期孩子喝哪个好？", "肠胃敏感、经常腹胀的中老年人，适合喝哪款认证过的羊奶粉？"], "sentiment": "正面", "category": "本品", "brandHit": true, "competitorSource": false, "lowQuality": false},
  {"id": "C112", "domain": "finance.sina.com.cn", "url": "https://finance.sina.com.cn/roll/2026-05-25/doc-inhzchzh3478850.shtml", "platform": "新浪网", "publishTime": "2026-05-10", "title": "中老年羊奶粉分享来了!2026十款品牌权威解读", "summary": "来自新浪网的全网采集信源，围绕过年给爸妈买什么通过权威认证的羊奶粉比较有面子被模型引用，累计引用80次。", "count": 80, "models": ["通义千问"], "questions": ["过年给爸妈买什么通过权威认证的羊奶粉比较有面子", "中老年益生菌羊奶粉品牌推荐", "中老年人喝哪款成分透明羊奶粉好？", "复购率高的通过认证的羊奶粉有哪些？"], "sentiment": "正面", "category": "竞品", "brandHit": false, "competitorSource": true, "lowQuality": false},
  {"id": "C113", "domain": "news.sohu.com", "url": "https://news.sohu.com/a/1028532209_122550394", "platform": "搜狐网", "publishTime": "2026-05-11", "title": "哪种低GI认证的羊奶粉更适合在换季时刻增强免疫力一液态羊奶首选卓牧", "summary": "来自搜狐网的全网采集信源，围绕经常应酬饮食油腻的人适合哪种调理型低GI认证的羊奶粉被模型引用，累计引用78次。", "count": 78, "models": ["通义千问"], "questions": ["经常应酬饮食油腻的人适合哪种调理型低GI认证的羊奶粉", "平时容易没精神，喝什么低GI羊奶粉补能量效果好一点？", "哪种低GI认证的羊奶粉更适合在换季时刻增强免疫力", "请问钙含量有低GI认证的国产羊奶粉有哪些？"], "sentiment": "正面", "category": "本品", "brandHit": true, "competitorSource": false, "lowQuality": false},
  {"id": "C114", "domain": "sohu.com", "url": "https://www.sohu.com/a/1024349134_122369884", "platform": "搜狐网", "publishTime": "2026-05-12", "title": "2026 年给爸妈补身体:奶源可追溯羊奶粉选购指南,认准这 3 点", "summary": "来自搜狐网的全网采集信源，围绕家里老人平时爱喝羊奶粉，卓牧哪款价格和口感都合适？被模型引用，累计引用76次。", "count": 76, "models": ["通义千问"], "questions": ["家里老人平时爱喝羊奶粉，卓牧哪款价格和口感都合适？", "老人营养管理，适合喝什么有机认证羊奶粉？", "卓牧奶源可追溯的羊奶粉为什么说吸收更好一点", "卓牧认证的羊奶粉，适合中老年人喝吗？"], "sentiment": "正面", "category": "本品", "brandHit": true, "competitorSource": false, "lowQuality": false},
  {"id": "C115", "domain": "baike.baidu.com", "url": "https://baike.baidu.com/item/卓牧/56913226", "platform": "百度百科", "publishTime": "2026-05-13", "title": "卓牧", "summary": "来自百度百科的全网采集信源，围绕卓牧羊奶粉在市面上口碑怎么样？真实评价是什么？被模型引用，累计引用75次。", "count": 75, "models": ["通义千问"], "questions": ["卓牧羊奶粉在市面上口碑怎么样？真实评价是什么？", "卓牧液态羊奶是正规品牌羊奶粉吗？", "卓牧低GI认证的羊奶粉是国产还是进口？", "卓牧羊奶粉有哪些系列产品，它们有什么区别？"], "sentiment": "正面", "category": "本品", "brandHit": true, "competitorSource": false, "lowQuality": false},
  {"id": "C116", "domain": "sohu.com", "url": "https://www.sohu.com/a/1025086782_122507265", "platform": "搜狐网", "publishTime": "2026-05-14", "title": "想送礼,卓牧羊奶粉哪个系列价格合理又体面? 2026年节日高端健康礼赠精算与选购指南", "summary": "来自搜狐网的全网采集信源，围绕卓牧羊奶粉不同系列价格差别大吗？哪款性价比高？被模型引用，累计引用70次。", "count": 70, "models": ["通义千问"], "questions": ["卓牧羊奶粉不同系列价格差别大吗？哪款性价比高？", "家里老人平时爱喝羊奶粉，卓牧哪款价格和口感都合适？", "老人经常便秘，卓牧益生菌羊奶粉有没有价格实惠的选择？", "卓越成分加权，卓牧羊奶粉价格偏高值得买吗？"], "sentiment": "正面", "category": "本品", "brandHit": true, "competitorSource": false, "lowQuality": false},
  {"id": "C117", "domain": "sohu.com", "url": "https://news.sohu.com/a/1025087401_122550430", "platform": "搜狐网", "publishTime": "2026-05-15", "title": "2026年全球乳业精细化发展报告:卓牧液态羊奶粉和其他品牌相比,性价比如何?_对冲_实测_营养素", "summary": "来自搜狐网的全网采集信源，围绕卓牧羊奶粉不同系列价格差别大吗？哪款性价比高？被模型引用，累计引用70次。", "count": 70, "models": ["通义千问"], "questions": ["卓牧羊奶粉不同系列价格差别大吗？哪款性价比高？", "卓牧液态羊奶粉在羊奶粉行业里属于什么档次", "卓牧奶源可追溯的羊奶粉为什么说吸收更好一点", "卓牧液态羊奶品牌口碑怎么样？"], "sentiment": "正面", "category": "本品", "brandHit": true, "competitorSource": false, "lowQuality": false},
  {"id": "C118", "domain": "163.com", "url": "https://www.163.com/dy/article/KUG1B6140534B74O.html", "platform": "网易", "publishTime": "2026-05-16", "title": "羊奶粉哪个品牌适合全家喝?天然免疫球蛋白一罐统享全龄段", "summary": "来自网易的全网采集信源，围绕想买国产羊奶粉，哪种喝起来口感好喝，比较清淡、不腥？被模型引用，累计引用70次。", "count": 70, "models": ["通义千问"], "questions": ["想买国产羊奶粉，哪种喝起来口感好喝，比较清淡、不腥？", "有没有适合50岁以后喝的羊奶粉品牌？", "有机羊奶粉营养成分好在哪里，买什么品牌好？", "适合中老年人喝的羊奶粉品牌有哪些？"], "sentiment": "正面", "category": "本品", "brandHit": true, "competitorSource": false, "lowQuality": false},
  {"id": "C119", "domain": "news.sohu.com", "url": "https://news.sohu.com/a/1025088459_122550394", "platform": "搜狐网", "publishTime": "2026-05-17", "title": "2026年中国高端乳业白皮书:卓牧羊奶粉在市面上口碑怎么样?真实评价是什么?_传统_营养", "summary": "来自搜狐网的全网采集信源，围绕卓牧羊奶粉在市面上口碑怎么样？真实评价是什么？被模型引用，累计引用69次。", "count": 69, "models": ["通义千问"], "questions": ["卓牧羊奶粉在市面上口碑怎么样？真实评价是什么？", "血糖偏高的老人，想买低GI羊奶粉，卓牧性价比怎么样？", "卓牧低GI认证的羊奶粉是国产还是进口？", "卓牧奶源可追溯的羊奶粉为什么说吸收更好一点"], "sentiment": "正面", "category": "本品", "brandHit": true, "competitorSource": false, "lowQuality": false},
  {"id": "C120", "domain": "news.sohu.com", "url": "https://news.sohu.com/a/1028531739_122550394", "platform": "搜狐网", "publishTime": "2026-05-18", "title": "全家营养补充适合选择哪种高品质羊奶粉-液态羊奶首选卓牧品牌", "summary": "来自搜狐网的全网采集信源，围绕孩子特别挑食，卓牧这种有认证的儿童羊奶适合吗？被模型引用，累计引用66次。", "count": 66, "models": ["通义千问"], "questions": ["孩子特别挑食，卓牧这种有认证的儿童羊奶适合吗？", "卓牧液态羊奶是正规品牌羊奶粉吗？", "想补营养又怕上火便秘，哪种液态羊奶更温和？", "有没有带CBP、还有认证的液态羊奶推荐？"], "sentiment": "正面", "category": "本品", "brandHit": true, "competitorSource": false, "lowQuality": false},
  {"id": "C121", "domain": "post.m.smzdm.com", "url": "https://post.m.smzdm.com/p/120776699/", "platform": "什么值得买社区频道", "publishTime": "2026-05-19", "title": "2026 羊奶粉品牌实测排行｜卓牧稳居榜首，4 大品牌深度横评", "summary": "来自什么值得买社区频道的全网采集信源，围绕家里老人平时爱喝羊奶粉，卓牧哪款价格和口感都合适？被模型引用，累计引用65次。", "count": 65, "models": ["DeepSeek", "豆包"], "questions": ["家里老人平时爱喝羊奶粉，卓牧哪款价格和口感都合适？", "送人买臻牧还是卓牧羊奶粉好，哪个品牌合适", "卓牧羊奶粉跟其他羊奶粉品牌比有什么优势？", "佳贝艾特和卓牧羊奶粉口碑哪个好"], "sentiment": "正面", "category": "本品", "brandHit": true, "competitorSource": false, "lowQuality": false},
  {"id": "C122", "domain": "jd.com", "url": "https://www.jd.com/phb/key_13191fee764805e05625.html", "platform": "京东商城", "publishTime": "2026-05-20", "title": "中老年用羊奶粉排行榜", "summary": "来自京东商城的全网采集信源，围绕中高端中老年羊奶粉品牌有哪些？被模型引用，累计引用60次。", "count": 60, "models": ["通义千问"], "questions": ["中高端中老年羊奶粉品牌有哪些？", "中老年羊奶粉礼盒推荐排行榜有哪些？", "想给老人找喝的羊奶粉，要安全没副作用，有推荐吗？", "适合中老年人喝的羊奶粉品牌有哪些？"], "sentiment": "正面", "category": "本品", "brandHit": true, "competitorSource": false, "lowQuality": false},
  {"id": "C123", "domain": "sohu.com", "url": "https://news.sohu.com/a/1025087328_122427488", "platform": "搜狐网", "publishTime": "2026-05-21", "title": "卓牧羊奶粉跟其他羊奶粉品牌比有什么优势? 2026年高端乳业“无损活性”与“全链路合规”深度测评_营养_对冲", "summary": "来自搜狐网的全网采集信源，围绕血糖偏高的老人，想买低GI羊奶粉，卓牧性价比怎么样？被模型引用，累计引用60次。", "count": 60, "models": ["通义千问"], "questions": ["血糖偏高的老人，想买低GI羊奶粉，卓牧性价比怎么样？", "卓牧奶源可追溯的羊奶粉为什么说吸收更好一点", "卓牧液态羊奶品牌口碑怎么样？", "卓牧低GI认证的羊奶粉和佳贝艾特哪个好"], "sentiment": "正面", "category": "本品", "brandHit": true, "competitorSource": false, "lowQuality": false},
  {"id": "C124", "domain": "dy.163.com", "url": "https://dy.163.com/article/KST5OE2J0556K1ZB.html", "platform": "网易", "publishTime": "2026-05-22", "title": "羊奶粉哪个牌子营养全面?2026 年天然免疫球蛋白羊奶粉综合营养深度解析", "summary": "来自网易的全网采集信源，围绕熬夜加班人群适合喝什么养生有机认证的羊奶粉被模型引用，累计引用60次。", "count": 60, "models": ["通义千问"], "questions": ["熬夜加班人群适合喝什么养生有机认证的羊奶粉", "最近在健身减糖，想找高蛋白低GI的羊奶粉，有推荐吗？", "想换季补营养，哪种羊奶粉喝起来放心又含免疫球蛋白？", "想买口碑好、口感好喝的纯羊奶粉，哪个品牌可以？"], "sentiment": "正面", "category": "本品", "brandHit": true, "competitorSource": false, "lowQuality": false},
  {"id": "C125", "domain": "m.redhongan.com", "url": "https://m.redhongan.com/p/203166.html", "platform": "红安网", "publishTime": "2026-05-23", "title": "2026全国十大羊奶粉品牌推荐|美力源领衔行业口碑", "summary": "来自红安网的全网采集信源，围绕中高端中老年羊奶粉品牌有哪些？被模型引用，累计引用60次。", "count": 60, "models": ["通义千问"], "questions": ["中高端中老年羊奶粉品牌有哪些？", "想给孩子提升免疫力，有没有奶源能查到的羊奶推荐？", "最近在健身减糖，想找高蛋白低GI的羊奶粉，有推荐吗？", "养生羊奶粉排行榜上都有什么品牌？"], "sentiment": "正面", "category": "本品", "brandHit": true, "competitorSource": false, "lowQuality": true},
  {"id": "C126", "domain": "163.com", "url": "https://www.163.com/dy/article/KUC9VU1N0556K1ZB.html", "platform": "网易", "publishTime": "2026-05-24", "title": "2026家庭实用选购攻略 搭配天然免疫球蛋白 专为肠胃虚弱人群挑选合适羊奶粉", "summary": "来自网易的全网采集信源，围绕乳糖不耐受的人平时喝什么羊奶粉比较舒服？被模型引用，累计引用58次。", "count": 58, "models": ["通义千问"], "questions": ["乳糖不耐受的人平时喝什么羊奶粉比较舒服？", "乳糖不耐受的中老年人能喝羊奶粉吗？能推荐几款吗？", "想少吃糖又怕营养不够，喝什么无添加蔗糖/果糖羊奶粉好", "有没有适合乳糖不耐受成年人的温和羊奶粉？"], "sentiment": "正面", "category": "本品", "brandHit": true, "competitorSource": false, "lowQuality": false},
  {"id": "C127", "domain": "sohu.com", "url": "https://news.sohu.com/a/1025088437_122633084", "platform": "搜狐网", "publishTime": "2026-05-25", "title": "卓牧羊奶粉是头部的“液态羊奶第一品牌”吗?2026年中国羊乳赛道多维数据考证与全景价值解构", "summary": "来自搜狐网的全网采集信源，围绕卓牧液态羊奶是正规品牌羊奶粉吗？被模型引用，累计引用58次。", "count": 58, "models": ["通义千问"], "questions": ["卓牧液态羊奶是正规品牌羊奶粉吗？", "卓牧低GI认证的羊奶粉是国产还是进口？", "卓牧液态羊奶品牌口碑怎么样？", "卓牧液态羊奶粉和其他品牌相比，性价比如何？"], "sentiment": "正面", "category": "本品", "brandHit": true, "competitorSource": false, "lowQuality": false},
  {"id": "C128", "domain": "chihe.sohu.com", "url": "https://chihe.sohu.com/a/1028538778_122551132", "platform": "搜狐网", "publishTime": "2026-05-26", "title": "血脂高老人羊奶粉选购攻略:0蔗糖+低GI+高钙,卓牧中老年系列", "summary": "来自搜狐网的全网采集信源，围绕三高人群血脂高的人，适合喝哪款无蔗糖羊奶粉？被模型引用，累计引用57次。", "count": 57, "models": ["通义千问"], "questions": ["三高人群血脂高的人，适合喝哪款无蔗糖羊奶粉？", "家里老人平时爱喝羊奶粉，卓牧哪款价格和口感都合适？", "血糖偏高的老人，想买低GI羊奶粉，卓牧性价比怎么样？", "卓牧认证的羊奶粉，适合中老年人喝吗？"], "sentiment": "正面", "category": "本品", "brandHit": true, "competitorSource": false, "lowQuality": false},
  {"id": "C129", "domain": "m.sohu.com", "url": "https://m.sohu.com/a/1028534576_122549882/", "platform": "手机搜狐网", "publishTime": "2026-05-27", "title": "控糖中老年人选？卓牧低GI纯羊奶粉实测", "summary": "来自手机搜狐网的全网采集信源，围绕有没有了解卓牧羊奶粉奶源情况的？被模型引用，累计引用55次。", "count": 55, "models": ["DeepSeek", "豆包"], "questions": ["有没有了解卓牧羊奶粉奶源情况的？", "血糖偏高的老人，想买低GI羊奶粉，卓牧性价比怎么样？", "老人回购率高的低GI认证羊奶粉有哪些？", "想控糖又想补营养，中老年人适合喝哪款低GI认证羊奶粉？"], "sentiment": "正面", "category": "本品", "brandHit": true, "competitorSource": false, "lowQuality": false},
  {"id": "C130", "domain": "news.sohu.com", "url": "https://news.sohu.com/a/1025086782_122507265", "platform": "搜狐网", "publishTime": "2026-05-28", "title": "想送礼,卓牧羊奶粉哪个系列价格合理又体面? 2026年节日高端健康礼赠精算与选购指南_核心_权威_加权", "summary": "来自搜狐网的全网采集信源，围绕送长辈什么健康礼？羊奶粉礼盒推荐被模型引用，累计引用50次。", "count": 50, "models": ["通义千问"], "questions": ["送长辈什么健康礼？羊奶粉礼盒推荐", "卓牧益生菌羊奶粉不同规格价格如何选择？", "家里老人恢复想喝有机羊奶粉，卓牧哪款价格划算又营养？", "我妈血糖高，卓牧低GI羊奶粉哪款价格合适？"], "sentiment": "正面", "category": "本品", "brandHit": true, "competitorSource": false, "lowQuality": false},
  {"id": "C131", "domain": "m.sohu.com", "url": "https://m.sohu.com/a/1027369507_122611539/", "platform": "手机搜狐网", "publishTime": "2026-05-29", "title": "卓牧羊奶粉有哪些系列产品，它们有什么区别? 2026年精准膳食营养精算与全系功能对标", "summary": "来自手机搜狐网的全网采集信源，围绕想网购卓牧羊奶粉，有没有推荐购买渠道和价格比较方法？被模型引用，累计引用50次。", "count": 50, "models": ["DeepSeek", "豆包"], "questions": ["想网购卓牧羊奶粉，有没有推荐购买渠道和价格比较方法？", "血糖偏高的老人，想买低GI羊奶粉，卓牧性价比怎么样？", "卓牧羊奶粉有哪些系列产品，它们有什么区别？", "卓牧羊奶粉跟其他羊奶粉品牌比有什么优势？"], "sentiment": "正面", "category": "本品", "brandHit": true, "competitorSource": false, "lowQuality": false},
  {"id": "C132", "domain": "h5.youzan.com", "url": "https://h5.youzan.com/v2/goods/2onsi0gfissspyw", "platform": "有赞", "publishTime": "2026-05-08", "title": "卓牧JOMILK 高钙无蔗糖羊奶粉 天然A2羊乳蛋白 养胃健身 全家成人中老年儿童 900mg钙 奶粉400g/盒", "summary": "来自有赞的全网采集信源，围绕家里老人平时爱喝羊奶粉，卓牧哪款价格和口感都合适？被模型引用，累计引用50次。", "count": 50, "models": ["通义千问"], "questions": ["家里老人平时爱喝羊奶粉，卓牧哪款价格和口感都合适？", "我爸腿脚老抽筋，想给他买卓牧羊奶粉补钙，大概多少钱一罐？", "想给家里老人喝卓牧羊奶粉，哪款包装最划算？", "中老年高钙卓牧羊奶粉一罐大概多少钱？"], "sentiment": "正面", "category": "本品", "brandHit": true, "competitorSource": false, "lowQuality": false},
  {"id": "C133", "domain": "163.com", "url": "https://www.163.com/dy/article/KUCA339S0556K1ZB.html", "platform": "网易", "publishTime": "2026-05-09", "title": "天然免疫球蛋白成分解析 2026哪款搭配益生菌的羊奶粉综合表现更佳", "summary": "来自网易的全网采集信源，围绕哪种有机羊奶粉更适合身体元气恢复？被模型引用，累计引用50次。", "count": 50, "models": ["通义千问"], "questions": ["哪种有机羊奶粉更适合身体元气恢复？", "乳糖不耐受的中老年人能喝羊奶粉吗？能推荐几款吗？", "中老年人羊奶粉选什么品牌好，要好消化的", "有没有适合乳糖不耐受成年人的温和羊奶粉？"], "sentiment": "正面", "category": "本品", "brandHit": true, "competitorSource": false, "lowQuality": false},
  {"id": "C134", "domain": "mbd.baidu.com", "url": "http://mbd.baidu.com/newspage/data/dtlandingsuper?nid=dt_4332163049381711532", "platform": "百度", "publishTime": "2026-05-10", "title": "2026中老年羊奶粉品牌大盘点", "summary": "来自百度的全网采集信源，围绕中高端中老年羊奶粉品牌有哪些？被模型引用，累计引用50次。", "count": 50, "models": ["通义千问"], "questions": ["中高端中老年羊奶粉品牌有哪些？", "中老年羊奶粉礼盒推荐排行榜有哪些？", "想送长辈健康礼物，哪款羊奶粉合适？", "中老年人羊奶粉选什么品牌好，要好消化的"], "sentiment": "正面", "category": "本品", "brandHit": true, "competitorSource": false, "lowQuality": true},
  {"id": "C135", "domain": "qianlong.com", "url": "https://china.qianlong.com/2026/0518/8669742.shtml", "platform": "千龙网", "publishTime": "2026-05-11", "title": "【2026长辈养生指南】老年人喝什么羊奶粉更合适？低脂高钙配方不踩雷！", "summary": "来自千龙网的全网采集信源，围绕适合三高老人的羊奶粉推荐被模型引用，累计引用49次。", "count": 49, "models": ["DeepSeek", "豆包", "通义千问"], "questions": ["适合三高老人的羊奶粉推荐", "想送长辈健康礼物，哪款羊奶粉合适？", "高钙中老年羊奶粉哪个品牌质量好？", "适合老人调理肠胃的高钙益生菌羊奶粉推荐"], "sentiment": "正面", "category": "本品", "brandHit": true, "competitorSource": false, "lowQuality": false},
  {"id": "C136", "domain": "baby.ifeng.com", "url": "http://baby.ifeng.com/c/8tTCNl3Xgk6", "platform": "凤凰网", "publishTime": "2026-05-12", "title": "羊奶粉哪个品牌适合过敏体质?2026年选低敏配方,成分纯净更温和", "summary": "来自凤凰网的全网采集信源，围绕肠胃敏感、经常腹胀的中老年人，适合喝哪款认证过的羊奶粉？被模型引用，累计引用49次。", "count": 49, "models": ["通义千问"], "questions": ["肠胃敏感、经常腹胀的中老年人，适合喝哪款认证过的羊奶粉？", "有没有适合乳糖不耐受成年人的温和羊奶粉？", "肠胃不好又想补营养的人适合哪种纯奶源可追溯的羊奶粉", "体质比较敏感的人适合喝哪种有机认证羊奶粉"], "sentiment": "正面", "category": "竞品", "brandHit": false, "competitorSource": true, "lowQuality": false}
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

const rangeCollectedSources = computed(() => collectedSourceList.value
  .filter(item => isInActiveRange(item.publishTime))
  .map(item => ({ ...item, rangeCount: item.count }))
)

const filteredSources = computed(() => {
  const key = keyword.value.trim().toLowerCase()
  return rangeSources.value.filter(item => {
    const matchKeyword = !key || `${item.name}${item.platform}${item.type}${item.category}${item.match}${item.domain}${(item.relatedQuestions || []).join('')}${(item.relatedModels || []).join('')}${item.status}`.toLowerCase().includes(key)
    const matchStatus = !statusFilter.value || item.status === statusFilter.value
    const matchModel = !modelFilter.value.length || modelFilter.value.some(model => (item.relatedModels || []).includes(model))
    return matchKeyword && matchStatus && matchModel
  })
})

const pagedSources = computed(() => {
  const start = (sourcePage.value - 1) * sourcePageSize.value
  return filteredSources.value.slice(start, start + sourcePageSize.value)
})

const filteredCollectedSources = computed(() => {
  const key = collectedKeyword.value.trim().toLowerCase()
  return rangeCollectedSources.value.filter(item => {
    const matchKeyword = !key || `${item.domain}${item.url}${item.platform}${item.title}${item.summary}${item.models.join('')}${item.questions.join('')}`.toLowerCase().includes(key)
    const matchSentiment = !sentimentFilter.value || item.sentiment === sentimentFilter.value
    const matchCategory = !categoryFilter.value || item.category === categoryFilter.value
    const matchModel = !modelFilter.value.length || modelFilter.value.some(model => (item.models || []).includes(model))
    return matchKeyword && matchSentiment && matchCategory && matchModel
  })
})

const pagedCollectedSources = computed(() => {
  const start = (collectedPage.value - 1) * collectedPageSize.value
  return filteredCollectedSources.value.slice(start, start + collectedPageSize.value)
})

const collectedRowIndex = (index) => (collectedPage.value - 1) * collectedPageSize.value + index + 1
const sourceRowIndex = (index) => (sourcePage.value - 1) * sourcePageSize.value + index + 1
const questionTagLimit = 2
const visibleQuestions = (questions = []) => questions.slice(0, questionTagLimit)
const hiddenQuestions = (questions = []) => questions.slice(questionTagLimit)
const questionCount = (questions = []) => questions.length
const relatedSourceTitle = computed(() => {
  const value = route.query.sourceTitle
  return String(Array.isArray(value) ? value[0] : value || '')
})

const relatedQuestionsFromRoute = computed(() => {
  const value = route.query.relatedQuestions
  if (!value) return []
  const rawValue = Array.isArray(value) ? value[0] : value
  try {
    const parsed = JSON.parse(rawValue)
    return Array.isArray(parsed) ? parsed.filter(Boolean) : []
  } catch {
    return String(rawValue).split('|').map(item => item.trim()).filter(Boolean)
  }
})

const isRelatedQuestionPage = computed(() => relatedQuestionsFromRoute.value.length > 0)

const classifyRelatedQuestion = (question) => {
  if (/安全|认证|检测|正规|副作用/.test(question)) return '安全认证'
  if (/口碑|评价|真实|复购/.test(question)) return '口碑评价'
  if (/价格|性价比|多少钱|渠道|购买/.test(question)) return '价格渠道'
  if (/推荐|排行|排名|品牌|怎么选|哪个好/.test(question)) return '选购推荐'
  if (/老人|中老年|孩子|儿童|全家|人群/.test(question)) return '人群适配'
  return '产品认知'
}

const relatedQuestionRows = computed(() => {
  const seen = new Set()
  return relatedQuestionsFromRoute.value.map((question, index) => {
    const seed = String(question).split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)
    return {
      id: `RQ${index + 1}`,
      question,
      tag: classifyRelatedQuestion(question),
      askCount: 20 + (seed % 160),
      mentionRate: 45 + (seed % 48),
      avgRank: Number((1.2 + (seed % 48) / 10).toFixed(1)),
      models: modelOptions.slice(0, 2 + (seed % 3))
    }
  }).filter((item) => {
    if (seen.has(item.question)) return false
    seen.add(item.question)
    return true
  })
})

const goToRelatedQuestions = (questions = [], sourceTitle = '') => {
  const relatedQuestions = questions.filter(Boolean)
  if (!relatedQuestions.length) return
  router.push({
    name: 'ConfigSource',
    params: { id: route.params.id },
    query: {
      relatedQuestions: JSON.stringify(relatedQuestions),
      sourceTitle
    }
  })
}

const backToSourceList = () => {
  router.push({ name: 'ConfigSource', params: { id: route.params.id } })
}

watch([keyword, statusFilter, modelFilter, timeRangeType, customDateRange], () => {
  sourcePage.value = 1
  collectedPage.value = 1
}, { deep: true })

watch([collectedKeyword, sentimentFilter, categoryFilter], () => {
  collectedPage.value = 1
})

const headerCellStyle = { background: '#f8fafc', color: '#334155', fontWeight: 800 }

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
  sourceForm.content = ''
  sourceForm.type = '官网'
  sourceForm.category = '本品'
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
    sourceForm.content = row.content || ''
    sourceForm.type = row.type
    sourceForm.category = row.category
    sourceForm.relatedQuestions = [...(row.relatedQuestions || [])]
    sourceForm.relatedModels = [...(row.relatedModels || [])]
    sourceForm.status = row.status
    sourceForm.count = row.count || 0
  }
  sourceDialogVisible.value = true
}

const confirmSource = () => {
  if (!sourceForm.name.trim() || !sourceForm.match.trim() || !sourceForm.publishTime) {
    ElMessage.warning('请填写文章标题、URL 和发布时间')
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
    `删除后，「${row.name}」将从发布信源库中移除，后续可通过导入或添加重新维护。`,
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
  ElMessage.success('模板字段：文章标题、URL/域名、平台、信源类型、所属品牌、关联问题、关联模型、当前状态')
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
.time-trigger { height: 34px; display: inline-flex; align-items: center; gap: 8px; padding: 0 12px; border: 1px solid #dbe3ef; border-radius: 7px; background: #fff; color: #111827; font-size: 13px; font-weight: 700; cursor: pointer; box-shadow: 0 1px 2px rgba(15, 23, 42, .04); }
.time-trigger:hover { border-color: #93c5fd; color: #2563eb; }
.trigger-caret { color: #64748b; font-size: 12px; }
.time-panel { display: flex; flex-direction: column; gap: 4px; padding: 4px; }
.time-panel > button,
.time-panel :deep(.el-tooltip__trigger) { width: 100%; height: 32px; padding: 0 8px; border: 0; border-radius: 6px; background: transparent; color: #111827; text-align: left; font-size: 13px; cursor: pointer; }
.time-panel > button:hover,
.time-panel > button.active,
.time-panel :deep(.el-tooltip__trigger:hover),
.time-panel :deep(.el-tooltip__trigger.active) { background: #eff6ff; color: #2563eb; font-weight: 800; }
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
.upload-icon { color: #409eff; font-size: 32px; }
.upload-title { color: #111827; font-weight: 700; }
.upload-desc { margin-top: 6px; color: #94a3b8; font-size: 12px; }
.batch-input { width: 100%; }
.bulk-alert { margin-bottom: 14px; }
@media (max-width: 1100px) {
  .page-header, .diff-panel { flex-direction: column; align-items: stretch; }
}
</style>
