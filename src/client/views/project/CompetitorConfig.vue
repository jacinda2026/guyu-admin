<template>
  <div class="config-page competitor-config-page">
    <section class="brand-card">
      <el-button
        type="primary"
        class="page-edit-btn"
        @click="handleEditButton"
      >
        {{ editing ? '保存' : '编辑' }}
      </el-button>

      <div class="section-block">
        <div class="section-title-row simple-title-row">
          <div class="title-left">
            <div class="section-title">本品品牌</div>
            <span class="title-count">共1个品牌</span>
          </div>
        </div>
        <div v-if="ownBrand.name" class="brand-compact-list own-brand-compact-list">
          <div class="brand-compact-item own-brand-compact-item">
            <span class="brand-index compact-index">1</span>
            <div class="brand-summary one-line-summary" :title="formatBrandName(ownBrand)">
              <span class="brand-main-name">{{ ownBrand.name }}</span>
              <span v-for="alias in ownBrand.aliases" :key="alias" class="brand-alias-inline">/ {{ alias }}</span>
            </div>
            <div v-if="editing" class="item-icon-actions">
              <el-tooltip content="编辑" placement="top">
                <el-button type="primary" link :icon="Edit" class="icon-action-btn" @click="openEditOwn" />
              </el-tooltip>
              <el-tooltip content="删除" placement="top">
                <el-button type="danger" link :icon="Delete" class="icon-action-btn" @click="removeOwnBrand" />
              </el-tooltip>
            </div>
          </div>
        </div>
        <div v-else class="compact-empty-row own-brand-empty-row">
          <span>暂无本品品牌</span>
          <el-button v-if="editing" type="primary" link @click="openEditOwn">立即添加</el-button>
        </div>
      </div>

      <div class="section-block competitor-block">
        <div class="section-title-row">
          <div class="title-left">
            <div class="section-title">竞品品牌</div>
            <span class="title-count">共{{ competitors.length }}个手动配置品牌</span>
          </div>
          <div v-if="editing" class="section-actions">
            <el-button type="primary" @click="openAddCompetitor">+ 添加竞品</el-button>
          </div>
        </div>

        <div class="manual-brand-panel">
          <div class="brand-compact-list competitor-compact-list">
            <div v-for="(item, index) in competitors" :key="item.id" class="brand-compact-item">
              <span class="brand-index compact-index">{{ index + 1 }}</span>
              <div class="brand-summary one-line-summary" :title="formatBrandName(item)">
                <span class="brand-main-name">{{ item.name }}</span>
                <span v-for="alias in getBrandAliases(item)" :key="alias" class="brand-alias-inline">/ {{ alias }}</span>
              </div>
              <div v-if="editing" class="item-icon-actions">
                <el-tooltip content="编辑" placement="top">
                  <el-button type="primary" link :icon="Edit" class="icon-action-btn" @click="openEditCompetitor(item)" />
                </el-tooltip>
                <el-tooltip content="删除" placement="top">
                  <el-button type="danger" link :icon="Delete" class="icon-action-btn" @click="removeCompetitor(item)" />
                </el-tooltip>
              </div>
            </div>
          </div>
        </div>

      </div>

      <div class="section-block auto-extract-block">
        <div class="section-title-row">
          <div class="title-left">
            <div class="title-with-tip">
              <div class="section-title">AI提取竞品</div>
              <el-tooltip
                content="系统从问题监控的 AI 答案中自动抽取品牌；已在“手动配置”中的品牌不会在这里重复展示。"
                placement="top"
              >
                <el-icon class="tip-icon"><InfoFilled /></el-icon>
              </el-tooltip>
            </div>
            <span class="title-count">自动提取{{ autoCompetitors.length }}个品牌</span>
          </div>
          <div v-if="editing" class="section-actions">
            <el-button size="small" class="ai-btn" @click="syncExtractedBrands">重新提取</el-button>
          </div>
        </div>

        <div class="source-box auto-box">
          <el-empty v-if="autoCompetitors.length === 0" description="暂无新的自动提取品牌" :image-size="72" />

          <div v-for="(item, index) in autoCompetitors" :key="item.id" class="auto-row">
            <span class="brand-index auto-index">{{ index + 1 }}</span>
            <div class="brand-summary auto-brand-summary" :title="formatBrandName(item)">
              <span class="brand-main-name">{{ item.name }}</span>
              <span v-for="alias in getBrandAliases(item)" :key="alias" class="brand-alias-inline auto-alias-inline">/ {{ alias }}</span>
            </div>
            <div class="source-meta">
              <span class="meta-label">来源问题</span>
              <span class="meta-text">{{ item.sourceQuestion }}</span>
            </div>
            <div class="source-meta compact">
              <span class="meta-label">出现</span>
              <span class="meta-text strong">{{ item.mentions }} 次</span>
            </div>
            <div v-if="editing" class="item-icon-actions auto-actions">
              <el-tooltip content="编辑" placement="top">
                <el-button type="primary" link :icon="Edit" class="icon-action-btn" @click="openEditAutoCompetitor(item)" />
              </el-tooltip>
              <el-tooltip content="删除" placement="top">
                <el-button type="danger" link :icon="Delete" class="icon-action-btn" @click="removeAutoCompetitor(item)" />
              </el-tooltip>
            </div>
          </div>
        </div>
      </div>
    </section>

    <el-dialog v-model="brandDialogVisible" :title="dialogTitle" width="520px" append-to-body class="brand-edit-dialog">
      <el-form label-position="left" label-width="96px" class="brand-dialog-form own-brand-dialog-form">
        <el-form-item :label="brandNameLabel">
          <el-input v-model="brandForm.name" :placeholder="brandNamePlaceholder" maxlength="100" />
        </el-form-item>
        <el-form-item :label="brandAliasLabel">
          <el-input v-model="brandForm.aliasText" type="textarea" :rows="5" :placeholder="brandAliasPlaceholder" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="brandDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveBrand">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="batchDialogVisible" title="添加竞品" width="520px" append-to-body>
      <el-input
        v-model="batchText"
        type="textarea"
        :rows="10"
        placeholder="支持批量添加，每行一个竞品品牌
示例：
宝马/BMW
奔驰/梅赛德斯/Benz/Mercedes"
      />
      <template #footer>
        <el-button @click="batchDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveBatchCompetitors">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, Edit, InfoFilled } from '@element-plus/icons-vue'

const editing = ref(false)
const ownBrand = reactive({ name: '初敏', aliases: ['Chunmin'] })
const competitors = ref([
  { id: 1, name: '艾维诺', alias: 'Aveeno / 艾惟诺' },
  { id: 2, name: '爱舒屋', alias: 'Akasugu' },
  { id: 3, name: '保贝一千', alias: '' },
  { id: 4, name: '贝德美', alias: '' },
  { id: 5, name: '贝亲', alias: 'Pigeon' }
])

const extractedBrands = ref([
  { id: 'a1', name: '戴可思', alias: 'Dexter', website: '', sourceQuestion: '婴儿湿疹用什么护肤品好', mentions: 18, ignored: false },
  { id: 'a2', name: '朵望', alias: '', website: '', sourceQuestion: '宝宝湿疹护肤哪个牌子好', mentions: 15, ignored: false },
  { id: 'a3', name: '凡士林', alias: '', website: '', sourceQuestion: '宝宝泛红干痒护肤品推荐', mentions: 14, ignored: false },
  { id: 'a4', name: '霏丝佳', alias: 'Physiogel', website: '', sourceQuestion: '敏感肌宝宝护肤品', mentions: 13, ignored: false },
  { id: 'a5', name: '馥蕾诗', alias: 'Fresh', website: '', sourceQuestion: '宝宝敏感肌护肤推荐品牌', mentions: 13, ignored: false },
  { id: 'a6', name: '宫中秘策', alias: '', website: '', sourceQuestion: '新生儿护肤品精选推荐', mentions: 12, ignored: false },
  { id: 'a7', name: '红色小象', alias: '', website: '', sourceQuestion: '婴儿护肤品好物推荐清单', mentions: 12, ignored: false },
  { id: 'a8', name: '华西珐玛', alias: '', website: '', sourceQuestion: '婴幼儿屏障修护护肤品推荐', mentions: 11, ignored: false },
  { id: 'a9', name: '己出', alias: '', website: '', sourceQuestion: '宝宝舒缓修护护肤品推荐', mentions: 11, ignored: false },
  { id: 'a10', name: '加州宝宝', alias: 'California Baby', website: '', sourceQuestion: '温和安全的宝宝湿疹霜', mentions: 10, ignored: false },
  { id: 'a11', name: '科赫', alias: 'DR.Koch / Dr.Koch', website: '', sourceQuestion: '无激素婴儿湿疹霜', mentions: 10, ignored: false },
  { id: 'a12', name: '理肤泉', alias: 'La Roche-Posay', website: '', sourceQuestion: '儿童过敏护肤推荐品牌', mentions: 10, ignored: false },
  { id: 'a13', name: '妙抚', alias: '', website: '', sourceQuestion: '宝宝湿疹红疹修护霜', mentions: 9, ignored: false },
  { id: 'a14', name: '妙思乐', alias: 'Mustela', website: '', sourceQuestion: '婴幼儿护肤全套产品推荐', mentions: 9, ignored: false },
  { id: 'a15', name: '纽强', alias: '', website: '', sourceQuestion: '新生儿皮肤屏障修复霜', mentions: 9, ignored: false },
  { id: 'a16', name: '启初', alias: 'Giving', website: '', sourceQuestion: '婴幼儿清爽保湿护肤品推荐', mentions: 8, ignored: false },
  { id: 'a17', name: '青蛙王子', alias: 'Frog Prince', website: '', sourceQuestion: '幼童护肤品测评推荐', mentions: 8, ignored: false },
  { id: 'a18', name: '芮洣舒', alias: '', website: '', sourceQuestion: '适合敏感肌宝宝的湿疹霜', mentions: 8, ignored: false },
  { id: 'a19', name: '润本', alias: 'Runben', website: '', sourceQuestion: '秋冬宝宝皮肤干痒护理', mentions: 7, ignored: false },
  { id: 'a20', name: '施巴', alias: 'Sebamed', website: '', sourceQuestion: '婴幼儿护肤品选购攻略', mentions: 7, ignored: false },
  { id: 'a21', name: '适乐肤', alias: 'CeraVe', website: '', sourceQuestion: '婴儿皮肤干痒红裂护理霜', mentions: 7, ignored: false },
  { id: 'a22', name: '首都儿研所', alias: '儿研所', website: '', sourceQuestion: '儿童湿疹特护霜', mentions: 6, ignored: false },
  { id: 'a23', name: '顺峰宝宝', alias: '', website: '', sourceQuestion: '新生儿湿疹膏推荐', mentions: 6, ignored: false },
  { id: 'a24', name: '丝塔芙', alias: 'Cetaphil', website: '', sourceQuestion: '婴幼儿防皴防干裂护肤品推荐', mentions: 6, ignored: false },
  { id: 'a25', name: '松达', alias: 'Sorda', website: '', sourceQuestion: '新生儿补水护肤品推荐', mentions: 6, ignored: false },
  { id: 'a26', name: '兔头妈妈', alias: 'BabyAnge', website: '', sourceQuestion: '宝宝护肤品怎么选', mentions: 5, ignored: false },
  { id: 'a27', name: '薇诺娜', alias: '', website: '', sourceQuestion: '宝宝敏感肌专用护肤品推荐', mentions: 5, ignored: false },
  { id: 'a28', name: '维蕾德', alias: 'Weleda', website: '', sourceQuestion: '新生儿湿疹怎么护理', mentions: 5, ignored: false },
  { id: 'a29', name: '雅漾', alias: 'Avène / Avene', website: '', sourceQuestion: '换季敏感宝宝护肤品推荐', mentions: 5, ignored: false },
  { id: 'a30', name: '一页', alias: 'newpage', website: '', sourceQuestion: '儿童湿疹霜排行榜', mentions: 4, ignored: false },
  { id: 'a31', name: '咿儿润', alias: '', website: '', sourceQuestion: '宝宝湿疹润肤霜', mentions: 4, ignored: false },
  { id: 'a32', name: '优色林', alias: 'Eucerin', website: '', sourceQuestion: '敏感肌面霜前10品牌', mentions: 4, ignored: false },
  { id: 'a33', name: '优泽', alias: '', website: '', sourceQuestion: '婴儿湿疹如何保湿', mentions: 4, ignored: false },
  { id: 'a34', name: '玉泽', alias: '', website: '', sourceQuestion: '宝宝湿疹反复怎么办', mentions: 3, ignored: false },
  { id: 'a35', name: '郁美净', alias: '', website: '', sourceQuestion: '湿疹宝宝怎么好得快', mentions: 3, ignored: false },
  { id: 'a36', name: 'EVEREDEN', alias: '', website: '', sourceQuestion: '宝宝湿疹护肤哪个牌子好', mentions: 3, ignored: false },
  { id: 'a37', name: 'Mama&Kids', alias: '', website: '', sourceQuestion: '湿疹宝宝护肤品牌推荐', mentions: 3, ignored: false },
  { id: 'a38', name: 'QV', alias: '', website: '', sourceQuestion: '湿疹宝宝皮肤干痒红用什么保湿霜', mentions: 3, ignored: false }
])

const brandDialogVisible = ref(false)
const batchDialogVisible = ref(false)
const dialogMode = ref('own')
const editingId = ref(null)
const batchText = ref('')
const brandForm = reactive({ name: '', aliasText: '' })

const dialogTitle = computed(() => {
  if (dialogMode.value === 'own') return '修改本品'
  if (dialogMode.value === 'add') return '添加竞品'
  if (dialogMode.value === 'auto') return '修改竞品'
  return '修改竞品'
})
const brandNameLabel = computed(() => {
  if (dialogMode.value === 'own') return '本品名称'
  if (dialogMode.value === 'auto') return '竞品名称'
  return '竞品名称'
})
const brandAliasLabel = computed(() => {
  if (dialogMode.value === 'own') return '别名信息'
  if (dialogMode.value === 'auto') return '别名信息'
  return '别名信息'
})
const brandNamePlaceholder = computed(() => {
  if (dialogMode.value === 'own') return '请输入本品主名称，例如：卓牧'
  return '请输入竞品主名称，例如：宝马'
})
const brandAliasPlaceholder = computed(() => {
  if (dialogMode.value === 'own') return `多个别名可用 / 分隔或换行填写
示例：
zhuomu / Jomilk / 卓牧羊奶粉`
  return `多个别名可用 / 分隔或换行填写
示例：
BMW / 宝马汽车`
})

const normalizeBrand = value => String(value || '').trim().toLowerCase().replace(/[\s·•.。\-_]/g, '')
const splitAliasText = value => String(value || '')
  .split(/[\/／；;，,、\n\r]/)
  .map(v => v.trim())
  .filter(Boolean)

const getBrandAliases = item => {
  if (Array.isArray(item.aliases)) return item.aliases.filter(Boolean)
  return splitAliasText(item.alias)
}

const formatBrandName = item => [item.name, ...getBrandAliases(item)].filter(Boolean).join(' / ')


const manualBrandKeys = computed(() => {
  const keys = new Set([normalizeBrand(ownBrand.name), ...ownBrand.aliases.map(normalizeBrand)])
  competitors.value.forEach(item => {
    keys.add(normalizeBrand(item.name))
    String(item.alias || '').split(/[\/／；;，,、\n]/).forEach(alias => keys.add(normalizeBrand(alias)))
  })
  keys.delete('')
  return keys
})

const autoCompetitors = computed(() => {
  const seen = new Set()
  return extractedBrands.value.filter(item => {
    if (item.ignored) return false
    const keys = [normalizeBrand(item.name), ...String(item.alias || '').split(/[\/／；;，,、\n]/).map(normalizeBrand)].filter(Boolean)
    if (keys.some(key => manualBrandKeys.value.has(key))) return false
    if (keys.some(key => seen.has(key))) return false
    keys.forEach(key => seen.add(key))
    return true
  })
})

async function handleEditButton() {
  if (!editing.value) {
    editing.value = true
    return
  }
  try {
    await ElMessageBox.confirm('保存后会立即生效，是否确认保存当前本品和竞品配置？', '确认保存', {
      confirmButtonText: '确认保存',
      cancelButtonText: '取消',
      type: 'warning'
    })
    editing.value = false
    ElMessage.success('配置已保存')
  } catch (error) {
    // 取消后继续编辑
  }
}

function removeOwnBrand() {
  ownBrand.name = ''
  ownBrand.aliases = []
}

function openEditOwn() {
  dialogMode.value = 'own'
  editingId.value = null
  brandForm.name = ownBrand.name
  brandForm.aliasText = ownBrand.aliases.join(' / ')
  brandDialogVisible.value = true
}
function openAddCompetitor() {
  batchText.value = ''
  batchDialogVisible.value = true
}
function openEditCompetitor(item) {
  dialogMode.value = 'edit'
  editingId.value = item.id
  brandForm.name = item.name
  brandForm.aliasText = splitAliasText(item.alias).join(' / ')
  brandDialogVisible.value = true
}
function openEditAutoCompetitor(item) {
  dialogMode.value = 'auto'
  editingId.value = item.id
  brandForm.name = item.name
  brandForm.aliasText = splitAliasText(item.alias).join(' / ')
  brandDialogVisible.value = true
}
function saveBrand() {
  const name = brandForm.name.trim()
  if (dialogMode.value === 'own') {
    ownBrand.name = name
    ownBrand.aliases = splitAliasText(brandForm.aliasText).filter(alias => alias !== name)
  } else if (dialogMode.value === 'add') {
    competitors.value.push({ id: Date.now(), name: name || '新竞品', alias: brandForm.aliasText.trim() })
  } else if (dialogMode.value === 'auto') {
    const item = extractedBrands.value.find(v => v.id === editingId.value)
    if (item) Object.assign(item, { name: name || item.name, alias: brandForm.aliasText.trim() })
  } else {
    const item = competitors.value.find(v => v.id === editingId.value)
    if (item) Object.assign(item, { name: name || item.name, alias: brandForm.aliasText.trim() })
  }
  brandDialogVisible.value = false
}
function removeCompetitor(item) {
  competitors.value = competitors.value.filter(v => v.id !== item.id)
}
function removeAutoCompetitor(item) {
  extractedBrands.value = extractedBrands.value.filter(v => v.id !== item.id)
}
function syncExtractedBrands() {
  extractedBrands.value = extractedBrands.value.map(v => ({ ...v, ignored: false }))
}
function saveBatchCompetitors() {
  const rows = batchText.value.split('\n').map(v => v.trim()).filter(Boolean)
  rows.forEach((row, index) => {
    const parts = splitAliasText(row)
    const name = parts[0]
    const alias = parts.slice(1).join(' / ')
    if (name) competitors.value.push({ id: Date.now() + index, name, alias })
  })
  batchDialogVisible.value = false
  batchText.value = ''
}
</script>

<style scoped>
.config-page {
  min-height: 100vh;
  background: #eef1f5;
  padding: 28px 0 80px 34px;
  color: #111827;
  position: relative;
  box-sizing: border-box;
}

.brand-card {
  width: calc(100vw - 310px);
  max-width: 1180px;
  min-height: 940px;
  background: #fff;
  border-radius: 8px;
  padding: 44px 62px;
  box-sizing: border-box;
  position: relative;
}

.page-edit-btn {
  position: absolute;
  top: 28px;
  right: 42px;
  min-width: 72px;
}

.section-block {
  margin-bottom: 54px;
}


.title-with-tip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.title-with-tip .section-title {
  margin-bottom: 0;
}

.tip-icon {
  color: #64748b;
  font-size: 15px;
  cursor: help;
}

.section-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 22px;
  gap: 16px;
}

.section-title {
  border-left: 4px solid #1f2937;
  padding-left: 10px;
  font-size: 20px;
  font-weight: 700;
  line-height: 1;
  margin-bottom: 22px;
}

.section-title-row .section-title {
  margin-bottom: 0;
}

.section-actions,
.source-actions {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.ai-btn {
  color: #7c3aed;
  border-color: #f4c872;
  background: #fff6dd;
}

.brand-row {
  display: grid;
  grid-template-columns: 36px minmax(360px, 1fr) auto auto;
  align-items: center;
  gap: 14px;
  min-height: 44px;
}

.own-row {
  grid-template-columns: minmax(360px, 560px) auto;
  margin-left: 34px;
}

.brand-info {
  min-height: 32px;
  border: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 10px;
  min-width: 0;
  background: #fff;
}

.brand-name {
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.alias-chip {
  min-width: 48px;
  max-width: 86px;
  background: #f7f7f7;
  color: #6b7280;
  border-radius: 2px;
  padding: 3px 8px;
  font-size: 12px;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.row-index {
  color: #6b7280;
  text-align: center;
}

.icon-btn {
  color: #374151;
  font-size: 22px;
}

.delete-btn {
  color: #1687ff;
  font-size: 24px;
}

.source-box {
  border: 1px solid #edf0f5;
  border-radius: 8px;
  padding: 18px 20px 14px;
  margin-bottom: 20px;
  background: #fff;
}

.manual-box {
  padding-top: 16px;
}

.auto-box {
  background: #fbfcff;
  padding: 10px 14px 8px;
}

.source-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 18px;
  margin-bottom: 16px;
}

.source-title {
  font-size: 16px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 6px;
}

.source-desc {
  font-size: 12px;
  color: #6b7280;
  line-height: 1.5;
}

.competitor-row {
  border-top: 1px solid #f1f3f7;
  padding: 10px 0;
}

.competitor-row:first-of-type {
  border-top: 0;
}

.auto-row {
  display: grid;
  grid-template-columns: 28px minmax(230px, 300px) minmax(240px, 1fr) 86px 64px;
  align-items: center;
  gap: 10px;
  min-height: 32px;
  border-top: 1px solid #f1f3f7;
  padding: 5px 0;
}

.auto-row:first-of-type {
  border-top: 0;
}

.auto-index {
  width: 22px;
  height: 22px;
  flex-basis: 22px;
  font-size: 12px;
  background: #fff3d6;
  color: #d97706;
}

.auto-brand-summary {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  color: #111827;
  font-size: 13px;
  line-height: 18px;
  overflow: hidden;
  white-space: nowrap;
}

.auto-alias-inline {
  color: #8a6b3a;
}

.source-meta {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  color: #4b5563;
}

.source-meta.compact {
  justify-content: center;
}

.auto-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 2px;
}

.meta-label {
  color: #9ca3af;
  font-size: 11px;
  white-space: nowrap;
}

.meta-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
}

.meta-text.strong {
  color: #111827;
  font-weight: 600;
}

.batch-help {
  margin: 8px 0 0;
  color: #6b7280;
  font-size: 12px;
}

.ai-small {
  margin-left: 8px;
}

.title-left {
  display: flex;
  align-items: baseline;
  gap: 10px;
  min-width: 0;
}

.title-count {
  color: #8b98aa;
  font-size: 13px;
  font-weight: 500;
}

.tip-icon {
  color: #9ca3af;
  font-size: 15px;
  cursor: pointer;
  transform: translateY(2px);
}

.tip-icon:hover {
  color: #2563eb;
}

.simple-title-row {
  justify-content: flex-start;
}


.manual-brand-panel {
  border: 0;
  border-radius: 0;
  padding: 0;
  background: transparent;
}

.brand-compact-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 10px;
}

.own-brand-compact-list,
.competitor-compact-list {
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
}

.brand-compact-item {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 40px;
  padding: 7px 6px 7px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #f8fafc;
  box-sizing: border-box;
}

.own-brand-compact-item {
  background: #f8fafc;
}

.brand-index {
  flex: 0 0 26px;
  width: 26px;
  height: 26px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #e0ecff;
  color: #2563eb;
  font-size: 13px;
  font-weight: 800;
}

.compact-index {
  align-self: flex-start;
  margin-top: 1px;
}

.brand-summary {
  flex: 1;
  min-width: 0;
}

.one-line-summary {
  color: #111827;
  font-size: 14px;
  line-height: 22px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 4px;
}

.brand-main-name {
  flex: 0 0 auto;
  font-weight: 800;
}

.brand-alias-inline {
  flex: 0 1 auto;
  min-width: 0;
  color: #64748b;
  font-size: 12px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-icon-actions {
  flex: 0 0 auto;
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0;
}

.icon-action-btn {
  width: 22px;
  height: 22px;
  padding: 0;
}

.compact-empty-row {
  min-height: 40px;
  padding: 7px 12px;
  border: 1px dashed #dbe3ee;
  border-radius: 10px;
  background: #f8fafc;
  color: #8b98aa;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  box-sizing: border-box;
}

.own-brand-empty-row {
  width: 100%;
}

.own-brand-dialog-form :deep(.el-textarea__inner) {
  line-height: 22px;
}

.brand-edit-dialog :deep(.el-dialog__body) {
  padding: 8px 28px 16px;
}

.brand-dialog-form :deep(.el-form-item) {
  margin-bottom: 18px;
}

.brand-dialog-form :deep(.el-form-item__label) {
  color: #374151;
  font-size: 15px;
}

.brand-dialog-form :deep(.el-input__wrapper),
.brand-dialog-form :deep(.el-textarea__inner) {
  border-radius: 4px;
}

@media (max-width: 1200px) {
  .brand-card {
    width: calc(100vw - 80px);
    padding: 34px 32px;
  }

  .competitor-grid {
    grid-template-columns: repeat(2, minmax(220px, 1fr));
  }

  .auto-row {
    grid-template-columns: 32px minmax(220px, 1fr);
  }

  .auto-row > .source-meta,
  .auto-row > .auto-actions {
    grid-column: 2;
  }
}
</style>
