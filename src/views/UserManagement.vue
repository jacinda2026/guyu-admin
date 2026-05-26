<template>
  <section class="admin-page">
    <div class="page-heading">
      <h1>用户管理</h1>
      <el-button type="primary" @click="openUserDialog()">+ 添加用户</el-button>
    </div>

    <el-card shadow="never" class="table-card">
      <el-table :data="pagedUsers" class="admin-table" style="width: 100%" :header-cell-style="headerCellStyle">
        <el-table-column label="用户信息" min-width="220">
          <template #default="{ row }">
            <div class="user-cell">
              <strong>{{ row.name }}</strong>
              <span>{{ row.email }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="角色" width="130">
          <template #default="{ row }">
            <el-tag size="small" effect="plain" type="info">{{ row.role }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="已绑定角色" min-width="160">
          <template #default="{ row }">
            <el-tag size="small" effect="light" type="primary">{{ row.boundRole }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="订阅计划" width="130">
          <template #default="{ row }">
            <el-tag size="small" effect="plain" type="info">{{ row.plan }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag size="small" effect="light" type="success">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="registeredAt" label="注册时间" width="150" />
        <el-table-column label="操作" width="190" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="bindRole(row)">绑定角色</el-button>
            <el-button link type="primary" @click="openUserDialog(row)">编辑</el-button>
            <el-button link type="danger" @click="removeUser(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-row">
        <span>共 {{ users.length }} 条</span>
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          background
          layout="sizes, prev, pager, next, jumper"
          :page-sizes="[10, 20, 50]"
          :total="users.length"
        />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="editingUser ? '编辑用户' : '添加用户'" width="520px">
      <el-form :model="form" label-width="96px">
        <el-form-item label="用户名称">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="form.email" />
        </el-form-item>
        <el-form-item label="绑定角色">
          <el-select v-model="form.boundRole" style="width: 100%">
            <el-option v-for="role in roleOptions" :key="role" :label="role" :value="role" />
          </el-select>
        </el-form-item>
        <el-form-item label="订阅计划">
          <el-select v-model="form.plan" style="width: 100%">
            <el-option label="免费版" value="免费版" />
            <el-option label="专业版" value="专业版" />
            <el-option label="企业版" value="企业版" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveUser">保存</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const page = ref(3)
const pageSize = ref(10)
const dialogVisible = ref(false)
const editingUser = ref(null)

const roleOptions = ['ADMIN', 'TENANT', '项目经理', 'VISIT']

const users = ref([
  { id: 1, name: 'Regular User', email: 'user@guyugeo.com', role: '用户', boundRole: 'ADMIN', plan: '免费版', status: '启用', registeredAt: '2026/5/9' },
  { id: 2, name: 'Manager User', email: 'manager@guyugeo.com', role: '用户', boundRole: 'ADMIN', plan: '免费版', status: '启用', registeredAt: '2026/5/9' },
  { id: 3, name: 'System Admin', email: 'admin@guyugeo.com', role: '用户', boundRole: 'ADMIN', plan: '免费版', status: '启用', registeredAt: '2026/5/9' },
  { id: 4, name: '李佳英', email: 'liquiying@guyuai.com', role: '用户', boundRole: '项目经理', plan: '免费版', status: '启用', registeredAt: '2026/4/27' },
  { id: 5, name: '蒲文静', email: 'puwenjing@guyuai.com', role: '用户', boundRole: 'TENANT', plan: '免费版', status: '启用', registeredAt: '2026/4/27' },
  { id: 6, name: '张鹏', email: '657025171@qq.com', role: '用户', boundRole: 'TENANT', plan: '免费版', status: '启用', registeredAt: '2026/4/22' },
  { id: 7, name: '美沃斯', email: '759070925@qq.com', role: '用户', boundRole: 'TENANT', plan: '免费版', status: '启用', registeredAt: '2026/4/22' },
  { id: 8, name: '王文治', email: 'wenzhi.wang@topline-consulting.com.cn', role: '用户', boundRole: 'TENANT', plan: '免费版', status: '启用', registeredAt: '2026/4/15' },
  { id: 9, name: '郭丽', email: 'guoli@guyuai.com', role: '用户', boundRole: 'TENANT', plan: '免费版', status: '启用', registeredAt: '2026/4/8' },
  { id: 10, name: '汽车之家B', email: 'wangxin14582@autohome.com.cn', role: '用户', boundRole: 'TENANT', plan: '免费版', status: '启用', registeredAt: '2026/3/31' },
  { id: 11, name: '谷雨运营', email: 'ops@guyugeo.com', role: '用户', boundRole: 'ADMIN', plan: '免费版', status: '启用', registeredAt: '2026/3/20' },
  { id: 12, name: '品牌顾问', email: 'consultant@guyuai.com', role: '用户', boundRole: '项目经理', plan: '免费版', status: '启用', registeredAt: '2026/3/12' },
  { id: 13, name: '数据观察员', email: 'viewer@guyuai.com', role: '用户', boundRole: 'VISIT', plan: '免费版', status: '启用', registeredAt: '2026/3/1' },
  { id: 14, name: '内容运营', email: 'content@guyuai.com', role: '用户', boundRole: 'TENANT', plan: '免费版', status: '启用', registeredAt: '2026/2/24' },
  { id: 15, name: '项目助理', email: 'assistant@guyuai.com', role: '用户', boundRole: 'TENANT', plan: '免费版', status: '启用', registeredAt: '2026/2/18' },
  { id: 16, name: '销售运营', email: 'sales@guyuai.com', role: '用户', boundRole: 'TENANT', plan: '免费版', status: '启用', registeredAt: '2026/2/11' },
  { id: 17, name: '客户成功', email: 'success@guyuai.com', role: '用户', boundRole: 'TENANT', plan: '免费版', status: '启用', registeredAt: '2026/2/1' },
  { id: 18, name: '产品经理', email: 'pm@guyuai.com', role: '用户', boundRole: '项目经理', plan: '免费版', status: '启用', registeredAt: '2026/1/20' },
  { id: 19, name: '财务账号', email: 'finance@guyuai.com', role: '用户', boundRole: 'TENANT', plan: '免费版', status: '启用', registeredAt: '2026/1/12' },
  { id: 20, name: '测试账号A', email: 'test-a@guyuai.com', role: '用户', boundRole: 'VISIT', plan: '免费版', status: '启用', registeredAt: '2026/1/3' },
  { id: 21, name: '测试账号B', email: 'test-b@guyuai.com', role: '用户', boundRole: 'VISIT', plan: '免费版', status: '启用', registeredAt: '2025/12/28' },
  { id: 22, name: '投放运营', email: 'media@guyuai.com', role: '用户', boundRole: 'TENANT', plan: '免费版', status: '启用', registeredAt: '2025/12/19' },
  { id: 23, name: '品牌经理', email: 'brand@guyuai.com', role: '用户', boundRole: '项目经理', plan: '免费版', status: '启用', registeredAt: '2025/12/8' },
  { id: 24, name: '渠道账号', email: 'channel@guyuai.com', role: '用户', boundRole: 'TENANT', plan: '免费版', status: '启用', registeredAt: '2025/11/21' },
  { id: 25, name: '普通访客', email: 'visit@guyuai.com', role: '用户', boundRole: 'VISIT', plan: '免费版', status: '启用', registeredAt: '2025/11/9' },
  { id: 26, name: '运维账号', email: 'devops@guyugeo.com', role: '用户', boundRole: 'ADMIN', plan: '免费版', status: '启用', registeredAt: '2025/10/30' }
])

const form = reactive({
  name: '',
  email: '',
  boundRole: 'TENANT',
  plan: '免费版'
})

const pagedUsers = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return users.value.slice(start, start + pageSize.value)
})

const headerCellStyle = {
  background: '#fff',
  color: '#6b7280',
  fontWeight: 700,
  height: '44px'
}

const openUserDialog = (row = null) => {
  editingUser.value = row
  Object.assign(form, row ? {
    name: row.name,
    email: row.email,
    boundRole: row.boundRole,
    plan: row.plan
  } : {
    name: '',
    email: '',
    boundRole: 'TENANT',
    plan: '免费版'
  })
  dialogVisible.value = true
}

const bindRole = (row) => {
  openUserDialog(row)
}

const saveUser = () => {
  if (!form.name || !form.email) {
    ElMessage.warning('请填写用户名称和邮箱')
    return
  }

  if (editingUser.value) {
    Object.assign(editingUser.value, form)
    ElMessage.success('用户信息已更新')
  } else {
    users.value.unshift({
      id: Date.now(),
      role: '用户',
      status: '启用',
      registeredAt: '2026/5/26',
      ...form
    })
    page.value = 1
    ElMessage.success('用户已添加')
  }
  dialogVisible.value = false
}

const removeUser = async (row) => {
  try {
    await ElMessageBox.confirm(`确认删除用户「${row.name}」？`, '删除确认', { type: 'warning' })
    users.value = users.value.filter(item => item.id !== row.id)
    ElMessage.success('用户已删除')
  } catch {
    // user canceled
  }
}
</script>

<style scoped>
.admin-page { min-height: 100%; padding: 32px 40px; background: #f5f7fb; }
.page-heading { display: flex; align-items: center; justify-content: space-between; margin-bottom: 32px; }
.page-heading h1 { margin: 0; color: #0f172a; font-size: 26px; font-weight: 800; }
.table-card { border: 0; border-radius: 8px; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08); }
:deep(.table-card .el-card__body) { padding: 20px 24px 16px; }
:deep(.admin-table .el-table__cell) { padding: 9px 0; color: #374151; }
.user-cell { display: flex; flex-direction: column; gap: 5px; }
.user-cell strong { color: #111827; font-size: 14px; }
.user-cell span { color: #64748b; font-size: 12px; }
.pagination-row { display: flex; align-items: center; justify-content: center; gap: 18px; padding: 18px 0 0; border-top: 1px solid #e5e7eb; color: #64748b; }
</style>
