<template>
  <div class="page-container">
    <div class="page-header">
      <div class="header-info">
        <h2>租户管理 (SaaS控制台)</h2>
        <p class="subtitle">管理平台企业客户，统一调配 SaaS 模式、菜单权限及租户角色</p>
      </div>
      <div class="header-ops">
        <el-select v-model="status" placeholder="全部状态" style="width: 120px; margin-right: 12px">
          <el-option label="正常" value="1" />
          <el-option label="已停用" value="0" />
        </el-select>
        <el-button type="primary">+ 新增租户</el-button>
      </div>
    </div>

    <el-row :gutter="20" class="stat-row">
      <el-col :span="6" v-for="s in stats" :key="s.label">
        <el-card shadow="never" class="stat-card">
          <div class="stat-val">{{ s.val }}</div>
          <div class="stat-lab">{{ s.label }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never" class="table-card">
      <el-table :data="tenants" style="width: 100%">
        <el-table-column prop="name" label="租户名称" min-width="180">
          <template #default="{ row }">
            <span class="tenant-name">{{ row.name }}</span>
          </template>
        </el-table-column>
        
        <el-table-column label="部署模式" width="130">
          <template #default="{ row }">
            <el-tag size="small" :type="row.saasMode === '公共SaaS' ? 'primary' : 'warning'" effect="light">
              <el-icon style="margin-right: 4px"><Cloudy v-if="row.saasMode === '公共SaaS'" /><Lock v-else /></el-icon>
              {{ row.saasMode }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="订阅计划" width="110">
          <template #default="{ row }">
            <el-tag size="small" type="info" effect="plain">{{ row.plan }}</el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="contact" label="联系人" width="100" />
        
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="row.status === '正常' ? 'success' : 'danger'">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="createdAt" label="创建时间" width="120" />
        
        <el-table-column label="SaaS 管理操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="openMenuDrawer(row)">菜单分配</el-button>
            <el-divider direction="vertical" />
            <el-button type="primary" link @click="openRoleDrawer(row)">角色管理</el-button>
            <el-divider direction="vertical" />
            <el-button type="primary" link>编辑</el-button>
            <el-button :type="row.status === '正常' ? 'warning' : 'success'" link>
              {{ row.status === '正常' ? '停用' : '恢复' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-drawer v-model="menuDrawerVisible" :title="`分配菜单 - ${currentTenant?.name}`" size="400px" destroy-on-close>
      <div class="drawer-content">
        <el-alert title="勾选该租户允许访问的系统模块" type="info" :closable="false" style="margin-bottom: 20px" />
        <el-tree
          :data="sysMenus"
          show-checkbox
          node-key="id"
          :default-expanded-keys="[1, 2]"
          :default-checked-keys="currentTenant?.checkedMenus"
          :props="{ label: 'label', children: 'children' }"
        />
      </div>
      <template #footer>
        <div style="flex: auto">
          <el-button @click="menuDrawerVisible = false">取消</el-button>
          <el-button type="primary" @click="saveMenuAllocation">保存菜单配置</el-button>
        </div>
      </template>
    </el-drawer>

    <el-drawer v-model="roleDrawerVisible" :title="`角色管理 - ${currentTenant?.name}`" size="600px" destroy-on-close>
      <div class="drawer-content">
        <div class="role-toolbar">
          <span>该租户内部的自定义角色列表：</span>
          <el-button type="primary" size="small" plain>+ 新增角色</el-button>
        </div>
        <el-table :data="tenantRoles" style="width: 100%" border>
          <el-table-column prop="roleName" label="角色名称" width="140" />
          <el-table-column prop="desc" label="权限描述" />
          <el-table-column label="操作" width="120" align="center">
            <template #default>
              <el-button type="primary" link>权限</el-button>
              <el-button type="danger" link>删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Cloudy, Lock } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const status = ref('')

const stats = [
  { label: '总租户数', val: 8 }, { label: '正常状态', val: 6 }, { label: '独立部署(SaaS)', val: 2 }, { label: '本月新增', val: 3 }
]

// 核心修改：将 expireAt 改为 createdAt 模拟数据
const tenants = ref([
  { id: 1, name: '谷雨GEO科技有限公司', saasMode: '私有化部署', plan: '企业版', contact: '张经理', status: '正常', createdAt: '2025/11/12', checkedMenus: [1, 11, 12, 2, 21, 22, 3] },
  { id: 2, name: '汉庭南京店-营销部', saasMode: '公共SaaS', plan: '标准版', contact: '李总监', status: '正常', createdAt: '2026/02/15', checkedMenus: [1, 11, 2, 21] },
  { id: 3, name: '创新科技实验组', saasMode: '公共SaaS', plan: '体验版', contact: '王主管', status: '已停用', createdAt: '2026/04/01', checkedMenus: [1, 11] }
])

const menuDrawerVisible = ref(false)
const currentTenant = ref(null)

const sysMenus = [
  { id: 1, label: '数据总览', children: [{ id: 11, label: 'GEO效果分析' }, { id: 12, label: '资源消耗看板' }] },
  { id: 2, label: '任务调度', children: [{ id: 21, label: '实时监控' }, { id: 22, label: '自动化调度' }, { id: 23, label: '审计记录' }] },
  { id: 3, label: '大模型管理 (高级功能)' },
  { id: 4, label: '提示词专家库' }
]

const openMenuDrawer = (row) => {
  currentTenant.value = row
  menuDrawerVisible.value = true
}

const saveMenuAllocation = () => {
  ElMessage.success(`已成功更新 [${currentTenant.value.name}] 的菜单权限！`)
  menuDrawerVisible.value = false
}

const roleDrawerVisible = ref(false)
const tenantRoles = ref([])

const openRoleDrawer = (row) => {
  currentTenant.value = row
  if (row.plan === '企业版') {
    tenantRoles.value = [
      { roleName: '租户超级管理员', desc: '拥有该租户下所有模块的访问及分配权限' },
      { roleName: 'GEO分析师', desc: '仅可查看数据、编辑提示词和配置自动化任务' },
      { roleName: '业务观察员', desc: '只读权限，仅可查看数据大盘' }
    ]
  } else {
    tenantRoles.value = [
      { roleName: '租户管理员', desc: '系统默认管理角色' },
      { roleName: '普通操作员', desc: '普通执行角色' }
    ]
  }
  roleDrawerVisible.value = true
}
</script>

<style scoped>
.page-container { padding: 24px; background-color: #f5f7fa; min-height: 100vh; }
.page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; }
.header-info h2 { margin: 0; font-size: 22px; color: #303133; }
.subtitle { margin: 6px 0 0; color: #909399; font-size: 14px; }
.header-ops { display: flex; align-items: center; }

.stat-row { margin-bottom: 24px; }
.stat-card { text-align: center; border-radius: 8px; border: none; }
.stat-val { font-size: 28px; font-weight: bold; color: #2b65f0; }
.stat-lab { color: #909399; margin-top: 8px; font-size: 13px; }

.table-card { border-radius: 8px; border: none; }
.tenant-name { font-weight: bold; color: #303133; }

.drawer-content { padding: 0 20px; }
.role-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; font-size: 14px; color: #606266; }
</style>