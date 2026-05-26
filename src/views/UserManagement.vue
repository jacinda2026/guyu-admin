<template>
  <div class="page-container">
    <div class="page-header">
      <div class="header-info">
        <h2>用户与角色管理</h2>
        <p class="subtitle">管理各入驻租户下的账号分配、角色权限及账号状态</p>
      </div>
      <div class="header-ops">
        <el-button type="primary" size="default" @click="handleEdit(null)">+ 新增租户账号</el-button>
      </div>
    </div>

    <el-card shadow="never" class="filter-card">
      <div class="filter-wrapper">
        <div class="filter-left">
          <span class="filter-label">按归属租户过滤：</span>
          <el-select v-model="filter.tenantId" placeholder="请选择归属租户" style="width: 240px" clearable>
            <el-option v-for="t in tenantList" :key="t.id" :label="t.name" :value="t.id">
              <span style="float: left">{{ t.name }}</span>
              <span style="float: right; color: #8492a6; font-size: 13px">{{ t.code }}</span>
            </el-option>
          </el-select>
          <el-divider direction="vertical" style="margin: 0 20px;" />
          <el-input v-model="filter.keyword" placeholder="搜索用户名 / 手机号" style="width: 200px" clearable prefix-icon="Search" />
        </div>
        <div class="filter-right">
          <el-select v-model="filter.status" placeholder="账号状态" style="width: 120px" clearable>
            <el-option label="正常可用" value="active" />
            <el-option label="已封禁" value="disabled" />
          </el-select>
        </div>
      </div>
    </el-card>

    <el-card shadow="never" class="table-card">
      <el-table :data="filteredUsers" style="width: 100%" stripe>
        <el-table-column label="账号信息" min-width="200">
          <template #default="{ row }">
            <div class="user-info">
              <el-avatar :size="36" :src="row.avatar" style="background: #2b65f0">{{ row.username.charAt(0) }}</el-avatar>
              <div class="user-meta">
                <span class="username">{{ row.username }}</span>
                <span class="phone">{{ row.phone }}</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="所属租户" min-width="180">
          <template #default="{ row }">
            <div class="tenant-info">
              <span class="tenant-name">{{ getTenantName(row.tenantId) }}</span>
              <el-tag size="small" type="info" effect="plain" style="margin-top: 4px">{{ getTenantCode(row.tenantId) }}</el-tag>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="分配角色" width="180">
          <template #default="{ row }">
            <el-tag 
              v-for="role in row.roles" 
              :key="role"
              :type="getRoleTagType(role)"
              size="small" 
              effect="light"
              style="margin-right: 4px; margin-bottom: 2px"
            >
              {{ role }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="账号状态" align="center" width="100">
          <template #default="{ row }">
            <el-switch 
              v-model="row.isActive" 
              inline-prompt 
              active-text="启" 
              inactive-text="禁"
              @change="handleStatusChange(row)"
            />
          </template>
        </el-table-column>

        <el-table-column prop="lastLogin" label="最后活跃时间" width="160" />

        <el-table-column label="操作" width="160" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">配置角色</el-button>
            <el-divider direction="vertical" />
            <el-button type="primary" link>重置密码</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog 
      v-model="dialogVisible" 
      :title="isEdit ? '账号与角色配置' : '新增租户账号'" 
      width="550px"
      destroy-on-close
    >
      <el-form :model="form" label-width="100px" label-position="left">
        <el-divider content-position="left">账号归属</el-divider>
        <el-form-item label="所属租户" required>
          <el-select v-model="form.tenantId" placeholder="请选择归属企业/租户" style="width: 100%" :disabled="isEdit">
            <el-option v-for="t in tenantList" :key="t.id" :label="t.name" :value="t.id" />
          </el-select>
          <div class="form-tip">账号必须挂载于具体租户之下，一经创建不可跨租户迁移。</div>
        </el-form-item>

        <el-divider content-position="left">基本信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="用户姓名" required>
              <el-input v-model="form.username" placeholder="如：张三" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="手机号码" required>
              <el-input v-model="form.phone" placeholder="用于登录" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="登录密码" v-if="!isEdit" required>
          <el-input v-model="form.password" type="password" show-password placeholder="设置初始登录密码" />
        </el-form-item>

        <el-divider content-position="left">租户权限配置</el-divider>
        <el-form-item label="分配角色" required>
          <el-select v-model="form.roles" multiple placeholder="请选择该用户在租户内的角色" style="width: 100%">
            <el-option label="租户管理员 (拥有所有权限)" value="租户管理员" />
            <el-option label="GEO 分析师 (可配置任务/修改提示词)" value="GEO 分析师" />
            <el-option label="数据观察员 (仅可查看大盘数据)" value="数据观察员" />
            <el-option label="财务审批人 (仅可查看账单及充值)" value="财务审批人" />
          </el-select>
        </el-form-item>

        <el-form-item label="账号状态">
          <el-switch v-model="form.isActive" active-text="允许登录" inactive-text="禁止登录" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确认保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

// --- 基础数据字典 ---
const tenantList = [
  { id: 'T001', name: '谷雨GEO科技有限公司', code: 'GUYU-TECH' },
  { id: 'T002', name: '汉庭南京店-营销部', code: 'HANTING-NJ' },
  { id: 'T003', name: '创新科技实验组', code: 'INNO-LAB' }
]

// --- 用户数据列表 ---
const userList = ref([
  { id: 1, username: '林总监', phone: '138****0001', tenantId: 'T001', roles: ['租户管理员', '财务审批人'], isActive: true, lastLogin: '2026-05-15 08:30:12' },
  { id: 2, username: '陈分析师', phone: '139****1122', tenantId: 'T001', roles: ['GEO 分析师'], isActive: true, lastLogin: '2026-05-14 16:20:00' },
  { id: 3, username: '王店长', phone: '135****3344', tenantId: 'T002', roles: ['租户管理员'], isActive: true, lastLogin: '2026-05-15 09:15:22' },
  { id: 4, username: '测试人员A', phone: '130****9999', tenantId: 'T003', roles: ['数据观察员'], isActive: false, lastLogin: '2026-04-10 11:11:11' }
])

// --- 筛选逻辑 ---
const filter = reactive({
  tenantId: '',
  keyword: '',
  status: ''
})

const filteredUsers = computed(() => {
  return userList.value.filter(user => {
    const matchTenant = filter.tenantId ? user.tenantId === filter.tenantId : true
    const matchStatus = filter.status === 'active' ? user.isActive : (filter.status === 'disabled' ? !user.isActive : true)
    const matchKeyword = filter.keyword ? (user.username.includes(filter.keyword) || user.phone.includes(filter.keyword)) : true
    return matchTenant && matchStatus && matchKeyword
  })
})

// --- 辅助工具函数 ---
const getTenantName = (id) => tenantList.find(t => t.id === id)?.name || '未知租户'
const getTenantCode = (id) => tenantList.find(t => t.id === id)?.code || 'UNKNOWN'

const getRoleTagType = (role) => {
  if (role.includes('管理员')) return 'danger'
  if (role.includes('分析师')) return 'primary'
  if (role.includes('财务')) return 'warning'
  return 'info'
}

const handleStatusChange = (row) => {
  ElMessage({
    message: `账号 [${row.username}] 已${row.isActive ? '恢复使用' : '被封禁'}`,
    type: row.isActive ? 'success' : 'warning'
  })
}

// --- 表单与弹窗逻辑 ---
const dialogVisible = ref(false)
const isEdit = ref(false)
const form = reactive({
  id: null,
  tenantId: '',
  username: '',
  phone: '',
  password: '',
  roles: [],
  isActive: true
})

const handleEdit = (row) => {
  if (row) {
    isEdit.value = true
    Object.assign(form, row)
  } else {
    isEdit.value = false
    Object.assign(form, { id: null, tenantId: '', username: '', phone: '', password: '', roles: [], isActive: true })
  }
  dialogVisible.value = true
}

const submitForm = () => {
  if (!form.tenantId || !form.username || !form.roles.length) {
    ElMessage.error('请填写完整必填信息 (所属租户、姓名及角色)')
    return
  }
  
  if (isEdit.value) {
    const idx = userList.value.findIndex(u => u.id === form.id)
    userList.value[idx] = { ...form }
    ElMessage.success('账号及角色配置已更新')
  } else {
    userList.value.push({
      ...form,
      id: Date.now(),
      lastLogin: '从未登录'
    })
    ElMessage.success('新账号已成功开通并分配至目标租户')
  }
  dialogVisible.value = false
}
</script>

<style scoped>
.page-container { padding: 24px; background-color: #f8f9fb; min-height: 100vh; }
.page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; }
.header-info h2 { margin: 0; font-size: 22px; color: #303133; }
.subtitle { margin: 6px 0 0; color: #909399; font-size: 14px; }

/* 筛选区样式 */
.filter-card { margin-bottom: 20px; border: none; border-radius: 8px; }
:deep(.filter-card .el-card__body) { padding: 16px 20px; }
.filter-wrapper { display: flex; justify-content: space-between; align-items: center; }
.filter-left { display: flex; align-items: center; }
.filter-label { font-size: 14px; color: #606266; margin-right: 12px; font-weight: bold; }
.filter-right { display: flex; align-items: center; }

/* 表格内部组合样式 */
.table-card { border: none; border-radius: 8px; }
.user-info { display: flex; align-items: center; gap: 12px; }
.user-meta { display: flex; flex-direction: column; }
.username { font-weight: bold; color: #303133; font-size: 14px; }
.phone { font-size: 12px; color: #909399; margin-top: 2px; }

.tenant-info { display: flex; flex-direction: column; align-items: flex-start; }
.tenant-name { font-size: 14px; color: #303133; }

.form-tip { font-size: 12px; color: #e6a23c; margin-top: 6px; line-height: 1.4; }
</style>