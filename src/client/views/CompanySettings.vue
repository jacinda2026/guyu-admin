<template>
  <div class="settings-container">
    <div class="page-header">
      <h2>企业与系统设置</h2>
      <p class="subtitle">管理企业全局主体认证、配置 GEO 品牌诊断基准线模型及团队协作权限</p>
    </div>

    <el-card shadow="never" class="settings-card">
      <el-tabs tab-position="left" v-model="activeTab" class="settings-tabs">
        
        <el-tab-pane label="主体信息" name="profile">
          <div class="tab-content-panel">
            <h3 class="panel-title">企业主体资料</h3>
            <el-form :model="companyForm" label-position="top" class="max-width-form">
              <el-row :gutter="20">
                <el-col :span="16">
                  <el-form-item label="企业官方全称">
                    <el-input v-model="companyForm.fullName" disabled placeholder="认证后不可自主修改" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="企业认证状态">
                    <div class="status-verify">
                      <el-tag type="success" effect="dark"><el-icon><Check /></el-icon> 已认证尊享版</el-tag>
                    </div>
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="主要行业赛道">
                    <el-select v-model="companyForm.industry" style="width: 100%">
                      <el-option label="酒店旅游 / 连锁酒旅" value="hotel" />
                      <el-option label="餐饮食品 / 线下外卖" value="fnb" />
                      <el-option label="母婴营养 / 零售消费" value="retail" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="统一社会信用代码">
                    <el-input v-model="companyForm.taxId" disabled />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-form-item label="联系人电子邮箱 (接收突发舆情告警)">
                <el-input v-model="companyForm.email" placeholder="owner@company.com" />
              </el-form-item>

              <el-form-item>
                <el-button type="primary" @click="saveSettings('主体资料')">保存主体修改</el-button>
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>

        <el-tab-pane label="GEO 基准模型" name="geo-model">
          <div class="tab-content-panel">
            <h3 class="panel-title">GEO 品牌诊断默认基准线 (6维空间模型)</h3>
            <p class="panel-desc">在此处配置企业固定的核心营销指标体系。每次下达全新 AI 诊断任务时，大后台调度系统将自动继承此处设置的权重，对大模型检索出来的品牌健康度、可见度表现进行雷达图量化扣分或加分。</p>
            
            <el-form :model="geoModelForm" label-position="top" class="max-width-form">
              <div class="geo-dimension-grid">
                <div class="dim-box">
                  <span class="dim-label">1. 城市/核心区域 (City)</span>
                  <el-input v-model="geoModelForm.dimCity" placeholder="如：南京、上海" size="small" />
                </div>
                <div class="dim-box">
                  <span class="dim-label">2. 商圈/核心地标 (Landmark)</span>
                  <el-input v-model="geoModelForm.dimLandmark" placeholder="如：新街口、外滩" size="small" />
                </div>
                <div class="dim-box">
                  <span class="dim-label">3. 用户精准场景 (Scene)</span>
                  <el-input v-model="geoModelForm.dimScene" placeholder="如：商务出差、亲子度假" size="small" />
                </div>
                <div class="dim-box">
                  <span class="dim-label">4. 价格定位区间 (Price)</span>
                  <el-input v-model="geoModelForm.dimPrice" placeholder="如：300-500元" size="small" />
                </div>
                <div class="dim-box">
                  <span class="dim-label">5. 核心产品卖点 (Selling Point)</span>
                  <el-input v-model="geoModelForm.dimPoint" placeholder="如：乳铁蛋白高含量、独立卫浴" size="small" />
                </div>
                <div class="dim-box">
                  <span class="dim-label">6. 竞争等级优先权</span>
                  <el-select v-model="geoModelForm.priority" size="small" style="width: 100%">
                    <el-option label="高 (High)" value="High" />
                    <el-option label="中 (Medium)" value="Medium" />
                    <el-option label="低 (Low)" value="Low" />
                  </el-select>
                </div>
              </div>

              <el-form-item class="mt-20">
                <el-button type="primary" @click="saveSettings('GEO 基准权重')">保存默认基准配置</el-button>
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>

        <el-tab-pane label="团队权限管理" name="members">
          <div class="tab-content-panel">
            <div class="panel-header-inline">
              <h3 class="panel-title">内部团队子账号</h3>
              <el-button type="primary" size="small" @click="addMember">+ 邀请团队成员</el-button>
            </div>
            
            <el-table :data="teamMembers" style="width: 100%" stripe class="mt-16">
              <el-table-column prop="name" label="姓名/昵称" width="130" />
              <el-table-column prop="email" label="登录账号 (邮箱)" min-width="180" />
              <el-table-column label="系统角色" width="130">
                <template #default="{ row }">
                  <el-tag size="small" :type="row.role === '主管理员' ? 'danger' : 'info'">
                    {{ row.role }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作权限" width="160">
                <template #default="{ row }">
                  <el-checkbox-group v-model="row.permissions" disabled size="small">
                    <el-checkbox label="read">查阅</el-checkbox>
                    <el-checkbox label="write">下发</el-checkbox>
                  </el-checkbox-group>
                </template>
              </el-table-column>
              <el-table-column label="状态" width="100" align="center">
                <template #default="{ row }">
                  <el-switch v-model="row.status" :disabled="row.role === '主管理员'" @change="toggleMember" />
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>

      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { Check } from '@element-plus/icons-vue'

const activeTab = ref('profile')

// 企业主体表单数据
const companyForm = reactive({
  fullName: '固宇华美（南京）酒店管理集团有限公司',
  industry: 'hotel',
  taxId: '91320102MA1XXXXXX8',
  email: 'operations@guyu-hotel.com'
})

// GEO模型的6维默认指标数据
const geoModelForm = reactive({
  dimCity: '南京',
  dimLandmark: '新街口地铁站 / 夫子庙景区',
  dimScene: '商务出差连锁硬需求',
  dimPrice: '350元 - 550元',
  dimPoint: '含双早、24小时零噪音安睡房、高速智能投屏',
  priority: 'High'
})

// 团队子账号数据
const teamMembers = ref([
  { name: '集团Owner', email: 'owner@guyu-hotel.com', role: '主管理员', permissions: ['read', 'write'], status: true },
  { name: '市场部总监', email: 'mkt-dir@guyu-hotel.com', role: '运营负责人', permissions: ['read', 'write'], status: true },
  { name: '南京分店店长', email: 'nj-store@guyu-hotel.com', role: '分析专员', permissions: ['read'], status: true },
  { name: '外包投放策略员', email: 'vendor-out@gmail.com', role: '外部协同', permissions: ['read'], status: false }
])

const saveSettings = (type) => {
  ElMessage.success(`企业端配置更新成功：[${type}] 数据已实时同步至中央策略器。`)
}

const toggleMember = (val) => {
  ElMessage.info(`成员账号状态已变更，安全访问控制权已即时生效。`)
}

const addMember = () => {
  ElMessage.warning('尊享版当前子账号配额已满，如需增加席位请联系运营专家。')
}
</script>

<style scoped>
.settings-container { padding-bottom: 30px; }
.page-header { margin-bottom: 24px; }
.page-header h2 { margin: 0; font-size: 24px; color: #303133; font-weight: 600; }
.subtitle { margin: 6px 0 0; color: #909399; font-size: 14px; }

.settings-card { border: none; border-radius: 8px; background: #fff; min-height: 550px; }

/* 调整侧边 Tab 样式使其具备 B2B 工业质感 */
:deep(.el-tabs__header.is-left) { margin-right: 32px; width: 180px; }
:deep(.el-tabs__item.is-left) { font-size: 14px; height: 48px; line-height: 48px; text-align: left; padding-left: 16px; }
:deep(.el-tabs__active-bar.is-left) { width: 3px; background-color: #2b65f0; }
:deep(.el-tabs__item.is-active) { color: #2b65f0; font-weight: bold; }

.tab-content-panel { padding: 4px 12px 20px 12px; }
.panel-title { margin: 0 0 16px 0; font-size: 16px; color: #303133; font-weight: 600; }
.panel-desc { font-size: 13px; color: #909399; line-height: 1.6; margin-bottom: 24px; background: #f8f9fa; padding: 12px; border-radius: 6px; }

.max-width-form { max-width: 680px; }
.status-verify { height: 40px; display: flex; align-items: center; }

/* GEO 6维模型配置专属网格布局 */
.geo-dimension-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
.dim-box { background: #fff; border: 1px solid #e4e7ed; border-radius: 6px; padding: 14px; }
.dim-box:hover { border-color: #2b65f0; }
.dim-label { display: block; font-size: 12px; color: #909399; font-weight: bold; margin-bottom: 8px; }

.panel-header-inline { display: flex; justify-content: space-between; align-items: center; }
.mt-16 { margin-top: 16px; }
.mt-20 { margin-top: 20px; }
</style>