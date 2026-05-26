<template>
  <section class="admin-page">
    <div class="page-heading">
      <h1>角色管理</h1>
      <div class="heading-actions">
        <el-button plain @click="ElMessage.success('角色列表已刷新')">刷新</el-button>
        <el-button type="primary" @click="openRoleDialog()">+ 新增角色</el-button>
      </div>
    </div>

    <el-card shadow="never" class="table-card">
      <el-table :data="roles" class="admin-table" style="width: 100%" :header-cell-style="headerCellStyle">
        <el-table-column prop="name" label="角色名称" min-width="180" />
        <el-table-column prop="code" label="角色编码" min-width="180" />
        <el-table-column prop="permissionCount" label="API 权限数" width="120" />
        <el-table-column prop="permissions" label="权限码" min-width="520" show-overflow-tooltip />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="configurePermissions(row)">配置权限</el-button>
            <el-button link type="primary" @click="openRoleDialog(row)">编辑</el-button>
            <el-button link type="danger" @click="removeRole(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-row">
        <span>共 {{ roles.length }} 条</span>
        <el-pagination background layout="prev, pager, next" :total="roles.length" :page-size="10" />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="editingRole ? '编辑角色' : '新增角色'" width="560px">
      <el-form :model="form" label-width="96px">
        <el-form-item label="角色名称">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="角色编码">
          <el-input v-model="form.code" />
        </el-form-item>
        <el-form-item label="权限码">
          <el-input v-model="form.permissions" type="textarea" :rows="5" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveRole">保存</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const dialogVisible = ref(false)
const editingRole = ref(null)

const roles = ref([
  {
    id: 1,
    name: 'ADMIN',
    code: 'ADMIN',
    permissionCount: 50,
    permissions: 'campaign:project:write, configuration-center:tags:write, system:user:list, data-center:overview:engine-view, system:tenant:list, account-center:transaction:list, smart-center:skill-square:view'
  },
  {
    id: 2,
    name: 'TENANT',
    code: 'TENANT',
    permissionCount: 40,
    permissions: 'smart-center:skill-square:view, configuration-center:monitoring:channel-standard, smart-center:keyword-expansion:recommend, configuration-center:monitoring:channel-enhanced, data-center:prompts:view'
  },
  {
    id: 3,
    name: '项目经理',
    code: 'PROJECT_MANAGER',
    permissionCount: 42,
    permissions: 'account-center:payment-order:create, configuration-center:monitoring:channel-enhanced-ii, configuration-center:tags:view, account-center:balance:view, data-center:question:list'
  },
  {
    id: 4,
    name: '访客',
    code: 'VISIT',
    permissionCount: 30,
    permissions: 'smart-center:question-expansion:recommend, query_response:list, data-center:prompts:view, smart-center:keyword-expansion:recommend, configuration-center:monitoring:view'
  }
])

const form = reactive({
  name: '',
  code: '',
  permissions: ''
})

const headerCellStyle = {
  background: '#fff',
  color: '#6b7280',
  fontWeight: 700,
  height: '44px'
}

const openRoleDialog = (row = null) => {
  editingRole.value = row
  Object.assign(form, row ? {
    name: row.name,
    code: row.code,
    permissions: row.permissions
  } : {
    name: '',
    code: '',
    permissions: ''
  })
  dialogVisible.value = true
}

const configurePermissions = (row) => {
  openRoleDialog(row)
}

const saveRole = () => {
  if (!form.name || !form.code) {
    ElMessage.warning('请填写角色名称和角色编码')
    return
  }

  const payload = {
    ...form,
    permissionCount: form.permissions.split(',').filter(Boolean).length
  }

  if (editingRole.value) {
    Object.assign(editingRole.value, payload)
    ElMessage.success('角色已更新')
  } else {
    roles.value.push({ id: Date.now(), ...payload })
    ElMessage.success('角色已新增')
  }
  dialogVisible.value = false
}

const removeRole = async (row) => {
  try {
    await ElMessageBox.confirm(`确认删除角色「${row.name}」？`, '删除确认', { type: 'warning' })
    roles.value = roles.value.filter(item => item.id !== row.id)
    ElMessage.success('角色已删除')
  } catch {
    // user canceled
  }
}
</script>

<style scoped>
.admin-page { min-height: 100%; padding: 32px 40px; background: #f5f7fb; }
.page-heading { display: flex; align-items: center; justify-content: space-between; margin-bottom: 32px; }
.page-heading h1 { margin: 0; color: #0f172a; font-size: 26px; font-weight: 800; }
.heading-actions { display: flex; align-items: center; gap: 10px; }
.table-card { border: 0; border-radius: 8px; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08); }
:deep(.table-card .el-card__body) { padding: 20px 24px 16px; }
:deep(.admin-table .el-table__cell) { padding: 12px 0; color: #374151; }
.pagination-row { display: flex; align-items: center; justify-content: center; gap: 18px; padding: 18px 0 0; border-top: 1px solid #e5e7eb; color: #64748b; }
</style>
