<template>
  <div class="config-page question-config-page">
    <section class="page-card">
      <div class="page-header">
        <div class="page-title">问题管理</div>
        <el-button type="primary" class="edit-btn" @click="handleEditSave">
          {{ editing ? '保存' : '编辑' }}
        </el-button>
      </div>

      <div class="question-layout">
        <aside class="category-panel">
          <div class="category-top">
            <el-input v-model="categoryKeyword" placeholder="搜索主题" :prefix-icon="Search" clearable />
            <el-button v-if="editing" type="primary" size="small" @click="tagDialogVisible = true">+ 添加标签</el-button>
          </div>

          <div class="category-list">
            <div class="category-item all" :class="{ selected: activeCategory === '所有' }" @click="activeCategory = '所有'">
              <span>所有</span>
              <strong>{{ totalPrompts }}</strong>
              <el-icon v-if="editing" class="more-icon"><MoreFilled /></el-icon>
            </div>
            <div
              v-for="item in filteredCategories"
              :key="item.name"
              class="category-item"
              @click="activeCategory = item.name"
              :class="{ selected: activeCategory === item.name }"
            >
              <span class="color-dot" :style="{ background: item.color }"></span>
              <span class="category-name">{{ item.name }}</span>
              <strong>{{ item.count }}</strong>
              <el-dropdown v-if="editing" trigger="click" @command="handleCategoryCommand">
                <el-icon class="more-icon"><MoreFilled /></el-icon>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="edit">编辑</el-dropdown-item>
                    <el-dropdown-item command="delete">删除</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
        </aside>

        <main class="prompt-panel">
          <div class="table-toolbar">
            <el-input v-model="promptKeyword" class="prompt-search" placeholder="搜索提示词" :prefix-icon="Search" clearable />
            <div v-if="editing" class="toolbar-actions">
              <el-button size="small" @click="deleteSelected">删除</el-button>
              <el-button size="small" type="danger" plain @click="uploadDialogVisible = true">上传提示词</el-button>
              <el-button size="small" class="ai-btn">AI拆词</el-button>
              <el-button size="small" type="primary" @click="promptDialogVisible = true">+ 添加提示词</el-button>
            </div>
          </div>

          <el-table
            :data="filteredPrompts"
            class="prompt-table"
            :header-cell-style="headerCellStyle"
            :cell-style="cellStyle"
            @selection-change="selection = $event"
          >
            <el-table-column v-if="editing" type="selection" width="34" />
            <el-table-column type="index" label="#" width="44" />
            <el-table-column prop="text" label="监控问题" min-width="220" />
            <el-table-column prop="category" label="分类标签" width="140" />
            <el-table-column label="状态" width="90" align="center">
              <template #default="{ row }">
                <span class="status" :class="row.status">{{ row.status === 'enabled' ? '启用' : '停用' }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="创建时间" width="170" />
            <el-table-column v-if="editing" label="操作" width="160" align="center">
              <template #default="{ row }">
                <el-button link type="primary" @click="editPrompt(row)">编辑</el-button>
                <el-button link type="primary" @click="togglePrompt(row)">{{ row.status === 'enabled' ? '停用' : '启用' }}</el-button>
                <el-button link type="primary" @click="removePrompt(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination-bar">
            <span>共 400 条记录 第 1 / 80 页</span>
            <el-pagination background layout="prev, pager, next, sizes, jumper" :total="400" :page-size="10" />
          </div>
        </main>
      </div>
    </section>


    <el-dialog v-model="deleteDialogVisible" width="280px" :show-close="false" class="confirm-dialog">
      <template #header><strong>确定要删除此分类吗？</strong></template>
      <p>当前分类下有5条问题会一并删除，此删除无法撤销</p>
      <template #footer>
        <el-button @click="deleteDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="deleteDialogVisible = false">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="tagDialogVisible" title="添加标签" width="450px" class="simple-dialog">
      <p class="dialog-desc">标签可帮助你筛选、搜索并分组相关的提示词，便于管理。</p>
      <el-form label-position="top">
        <el-form-item label="标签名称">
          <el-input v-model="tagForm.name" placeholder="标签、分类或名称" />
        </el-form-item>
        <el-form-item label="颜色">
          <el-select v-model="tagForm.color" style="width: 100%">
            <el-option label="Red" value="red"><span class="select-dot red"></span>Red</el-option>
            <el-option label="Blue" value="blue"><span class="select-dot blue"></span>Blue</el-option>
            <el-option label="Green" value="green"><span class="select-dot green"></span>Green</el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="tagDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="addTag">创建标签</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="promptDialogVisible" title="添加提示词" width="520px">
      <el-form label-position="top">
        <el-form-item label="提示词">
          <el-input v-model="newPrompt" type="textarea" :rows="4" placeholder="请输入需要监控的问题，一行一个" />
        </el-form-item>
        <el-form-item label="分类标签">
          <el-select v-model="newPromptCategory" placeholder="选择分类标签" clearable style="width: 100%">
            <el-option v-for="item in countedCategories" :key="item.name" :label="item.name" :value="item.name" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="promptDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmPrompt">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="uploadDialogVisible" title="上传提示词" width="520px">
      <el-upload drag action="#" :auto-upload="false">
        <el-icon class="upload-icon"><UploadFilled /></el-icon>
        <div>将 Excel / CSV 文件拖到此处，或点击上传</div>
      </el-upload>
      <template #footer>
        <el-button @click="uploadDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="uploadDialogVisible = false">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { MoreFilled, Search, UploadFilled } from '@element-plus/icons-vue'

const editing = ref(false)
const categoryKeyword = ref('')
const promptKeyword = ref('')
const activeCategory = ref('所有')
const selection = ref([])
const tagDialogVisible = ref(false)
const deleteDialogVisible = ref(false)
const promptDialogVisible = ref(false)
const uploadDialogVisible = ref(false)
const newPrompt = ref('')
const newPromptCategory = ref('')
const editingPromptId = ref(null)
const tagForm = ref({ name: '', color: 'red' })
const UNCATEGORIZED_CATEGORY = '未分类'

const categories = ref([
  { name: '湿疹护理', color: '#ff4d4f' },
  { name: '敏感肌与屏障修护', color: '#7c3aed' },
  { name: '保湿防干裂', color: '#10a7dc' },
  { name: '选购测评与榜单', color: '#2333c7' },
  { name: '安全温和', color: '#2fb7a4' },
  { name: UNCATEGORIZED_CATEGORY, color: '#8b98aa' }
])

const defaultQuestionTexts = [
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

const classifyQuestion = (text) => {
  if (/无激素|温和|安全/.test(text)) return '安全温和'
  if (/湿疹/.test(text)) return '湿疹护理'
  if (/敏感肌|屏障|修护|舒缓|过敏|泛红/.test(text)) return '敏感肌与屏障修护'
  if (/保湿|补水|防皴|干裂|干痒|秋冬|换季|清爽/.test(text)) return '保湿防干裂'
  if (/推荐|排行榜|前10|测评|选购|攻略|清单|精选|全套|怎么选|好物/.test(text)) return '选购测评与榜单'
  return UNCATEGORIZED_CATEGORY
}

const createPrompt = (text, index, category = '') => ({
  id: Date.now() + index,
  text,
  category: category || classifyQuestion(text) || UNCATEGORIZED_CATEGORY,
  status: 'enabled',
  createdAt: '2026.05.20 12:22:10'
})

const prompts = ref(defaultQuestionTexts.map((text, index) => createPrompt(text, index)))

const totalPrompts = computed(() => prompts.value.length)

const MODEL_UNIT_PRICE = 0.1
const DEFAULT_MODEL_COUNT = 6
const DEFAULT_DAILY_TIMES = 2
const estimatedDailyCost = computed(() => (totalPrompts.value * DEFAULT_MODEL_COUNT * DEFAULT_DAILY_TIMES * MODEL_UNIT_PRICE).toFixed(2))

const countedCategories = computed(() => {
  return categories.value.map((category) => ({
    ...category,
    count: prompts.value.filter(item => (item.category || UNCATEGORIZED_CATEGORY) === category.name).length
  }))
})

const filteredCategories = computed(() => {
  if (!categoryKeyword.value) return countedCategories.value
  return countedCategories.value.filter(item => item.name.includes(categoryKeyword.value))
})

const filteredPrompts = computed(() => {
  let list = prompts.value
  if (activeCategory.value !== '所有') list = list.filter(item => (item.category || UNCATEGORIZED_CATEGORY) === activeCategory.value)
  if (promptKeyword.value) list = list.filter(item => item.text.includes(promptKeyword.value))
  return list
})

const headerCellStyle = () => ({ background: '#f6f7f9', color: '#1f2937', height: '48px', fontWeight: 600 })
const cellStyle = () => ({ height: '52px', color: '#253143' })

async function handleEditSave() {
  if (!editing.value) {
    editing.value = true
    return
  }
  try {
    setBillingConfirmTip(estimatedDailyCost.value)
    await ElMessageBox.confirm('保存后会立即生效，是否确认保存当前问题配置？', '保存确认', {
      confirmButtonText: '确认保存',
      cancelButtonText: '取消',
      type: 'warning',
      customClass: 'billing-confirm-box'
    })
    editing.value = false
    ElMessage.success('问题配置已保存')
  } catch (error) {
    // 取消保存时继续停留在编辑状态
  } finally {
    clearBillingConfirmTip()
  }
}

const setBillingConfirmTip = (amount) => {
  document.documentElement.style.setProperty('--billing-confirm-tip', `"预计单天消耗：¥${amount}"`)
}

const clearBillingConfirmTip = () => {
  document.documentElement.style.removeProperty('--billing-confirm-tip')
}

function handleCategoryCommand(command) {
  if (!editing.value) return
  if (command === 'delete') deleteDialogVisible.value = true
}
function addTag() {
  if (!editing.value) return
  const name = tagForm.value.name.trim()
  if (name && !categories.value.some(item => item.name === name)) {
    categories.value.push({ name, color: '#ff4d4f' })
  }
  tagForm.value.name = ''
  tagDialogVisible.value = false
}
function editPrompt(row) {
  if (!editing.value) return
  editingPromptId.value = row.id
  newPrompt.value = row.text
  newPromptCategory.value = row.category
  promptDialogVisible.value = true
}
function confirmPrompt() {
  if (!editing.value) return
  const rows = newPrompt.value.split('\n').map(item => item.trim()).filter(Boolean)
  if (!rows.length) {
    ElMessage.warning('请输入需要监控的问题')
    return
  }
  const category = newPromptCategory.value || UNCATEGORIZED_CATEGORY
  if (editingPromptId.value) {
    const target = prompts.value.find(item => item.id === editingPromptId.value)
    if (target) {
      target.text = rows[0]
      target.category = category
    }
  } else {
    rows.forEach((text, index) => {
      prompts.value.unshift(createPrompt(text, index, category))
    })
  }
  newPrompt.value = ''
  newPromptCategory.value = ''
  editingPromptId.value = null
  promptDialogVisible.value = false
}
function togglePrompt(row) {
  if (!editing.value) return
  row.status = row.status === 'enabled' ? 'disabled' : 'enabled'
}
function removePrompt(row) {
  if (!editing.value) return
  prompts.value = prompts.value.filter(item => item.id !== row.id)
}
function deleteSelected() {
  if (!editing.value) return
  const ids = selection.value.map(item => item.id)
  prompts.value = prompts.value.filter(item => !ids.includes(item.id))
}
</script>

<style scoped>
.config-page { min-height: 100vh; padding: 16px 18px 80px; background: #eef1f5; color: #111827; position: relative; box-sizing: border-box; }
.page-card { width: 100%; max-width: none; min-height: 610px; background: #fff; border-radius: 4px; padding: 18px 22px 24px; box-sizing: border-box; overflow: hidden; }
.page-header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 8px; margin-bottom: 14px; border-bottom: 1px solid #1f2937; }
.page-title { font-size: 20px; font-weight: 700; }
.edit-btn { min-width: 72px; }
:global(.billing-confirm-box .el-message-box__btns) { display: flex; align-items: center; gap: 10px; }
:global(.billing-confirm-box .el-message-box__btns::before) { content: var(--billing-confirm-tip); margin-right: auto; color: #dc2626; font-size: 15px; font-weight: 900; }
.question-layout { display: grid; grid-template-columns: 280px minmax(0, 1fr); gap: 18px; align-items: stretch; }
.category-panel, .prompt-panel { border: 1px solid #e5e7eb; border-radius: 4px; background: #fff; min-height: 500px; min-width: 0; box-sizing: border-box; }
.category-panel { padding: 18px; }
.category-top { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 10px; }
.category-list { margin-top: 22px; }
.category-item { height: 42px; display: grid; grid-template-columns: auto 1fr auto auto; align-items: center; gap: 8px; padding: 0 8px; font-size: 17px; cursor: pointer; }
.category-item.all { grid-template-columns: 1fr auto auto; background: #f2f2f2; font-weight: 700; font-size: 18px; }
.category-item.selected { background: #f8fafc; }
.color-dot { width: 10px; height: 10px; border-radius: 50%; box-shadow: 0 0 0 2px #fff, 0 0 0 3px #d7dce3; }
.category-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.more-icon { color: #9ca3af; cursor: pointer; transform: rotate(90deg); }
.prompt-panel { padding: 18px; }
.table-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
.prompt-search { width: 230px; }
.toolbar-actions { display: flex; gap: 8px; align-items: center; flex-shrink: 0; }
.ai-btn { color: #7c3aed; border-color: #c4b5fd; background: #fbf7ff; }
.prompt-table { width: 100%; border: 1px solid #e5e7eb; border-bottom: none; }
.status { font-weight: 600; }
.status.enabled { color: #16a34a; }
.status.disabled { color: #52525b; }
.pagination-bar { display: flex; align-items: center; justify-content: space-between; padding: 62px 8px 0; color: #8b94a3; }
.confirm-dialog p, .dialog-desc { color: #6b7280; line-height: 1.7; }
.select-dot { display: inline-block; width: 12px; height: 12px; border-radius: 50%; margin-right: 8px; vertical-align: middle; }
.select-dot.red { background: #ff4d4f; }
.select-dot.blue { background: #1677ff; }
.select-dot.green { background: #22c55e; }
.upload-icon { font-size: 28px; color: #409eff; }
:deep(.el-dialog__body) { padding-top: 10px; }

@media (max-width: 1200px) {
  .question-layout { grid-template-columns: 240px minmax(0, 1fr); }
  .category-panel, .prompt-panel { padding: 14px; }
  .prompt-search { width: 210px; }
}
</style>
