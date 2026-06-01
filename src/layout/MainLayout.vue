<template>
  <el-container class="layout-container">
    <el-aside :width="asideWidth" class="layout-aside" :class="{ 'is-collapsed': isMenuCollapsed }">
      <div class="logo-wrapper">
        <el-icon class="logo-icon" color="#409eff"><Box /></el-icon>
        <div v-if="!isMenuCollapsed" class="logo-text">
          <span class="system-name">GEO百宝箱</span>
          <span class="sub-name">管理后台</span>
        </div>
      </div>
      
      <el-menu
        :default-active="activeMenu"
        class="el-menu-vertical"
        router
        background-color="#ffffff"
        text-color="#303133"
        active-text-color="#ffffff"
        :collapse="isMenuCollapsed"
        :collapse-transition="false"
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataLine /></el-icon>
          <span>数据总览</span>
        </el-menu-item>

        <el-menu-item index="/tenants">
          <el-icon><OfficeBuilding /></el-icon>
          <span>租户管理</span>
        </el-menu-item>

        <el-menu-item index="/users">
          <el-icon><User /></el-icon>
          <span>用户管理</span>
        </el-menu-item>

        <el-menu-item index="/roles">
          <el-icon><UserFilled /></el-icon>
          <span>角色管理</span>
        </el-menu-item>

        <el-sub-menu index="/billing">
          <template #title>
            <el-icon><Wallet /></el-icon>
            <span>费用中心</span>
          </template>
          <el-menu-item index="/billing/users">用户费用</el-menu-item>
          <el-menu-item index="/billing/pricing">费用定价</el-menu-item>
          <el-menu-item index="/billing">费用与消费管理中心</el-menu-item>
        </el-sub-menu>

        <el-menu-item index="/prompts">
          <el-icon><Document /></el-icon>
          <span>提示词管理</span>
        </el-menu-item>

        <el-sub-menu index="/tasks">
          <template #title>
            <el-icon><Clock /></el-icon>
            <span>任务调度</span>
          </template>
          <el-menu-item index="/tasks/monitor">实时任务监控</el-menu-item>
          <el-menu-item index="/tasks/models">大模型管理</el-menu-item>
          <el-menu-item index="/tasks/scheduling">任务调度</el-menu-item>
        </el-sub-menu>

        <el-menu-item index="/admin/templates">
          <el-icon><Collection /></el-icon>
          <span>研报模板中心</span>
        </el-menu-item>

        <el-menu-item index="/database">
          <el-icon><Folder /></el-icon>
          <span>数据库管理</span>
        </el-menu-item>

        <el-menu-item index="/system-monitor">
          <el-icon><Monitor /></el-icon>
          <span>系统监控</span>
        </el-menu-item>

        <el-menu-item index="/analysis">
          <el-icon><DataAnalysis /></el-icon>
          <span>数据分析</span>
        </el-menu-item>

        <el-menu-item index="/settings">
          <el-icon><Setting /></el-icon>
          <span>系统设置</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="layout-header">
        <div class="header-left">
          <el-tooltip :content="isMenuCollapsed ? '展开菜单' : '收起菜单'" placement="bottom">
            <el-button class="collapse-toggle" text circle @click="toggleMenu">
              <el-icon>
                <Expand v-if="isMenuCollapsed" />
                <Fold v-else />
              </el-icon>
            </el-button>
          </el-tooltip>
          <el-breadcrumb v-if="headerBreadcrumbs.length" separator="/" class="header-breadcrumb">
            <el-breadcrumb-item v-for="item in headerBreadcrumbs" :key="item.key || item.label">
              <button
                v-if="item.clickable"
                type="button"
                class="header-crumb-btn"
                @click="taskStore.handleHeaderBreadcrumb(item)"
              >
                {{ item.label }}
              </button>
              <span v-else>{{ item.label }}</span>
            </el-breadcrumb-item>
          </el-breadcrumb>
          <span v-else class="breadcrumb-current">{{ currentRouteName }}</span>
        </div>
        
        <div class="header-right">
          <el-badge :value="processingCount" :hidden="processingCount === 0" class="task-badge">
            <el-icon class="icon-btn" :class="{'is-loading': processingCount > 0}"><Loading /></el-icon>
          </el-badge>
          <el-divider direction="vertical" />
          <div class="user-profile">
            <el-avatar :size="28" src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" />
            <span class="user-name">System Admin</span>
          </div>
        </div>
      </el-header>

      <el-main class="layout-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { 
  Box, DataLine, User, UserFilled, OfficeBuilding, Wallet, Document, 
  Clock, Collection, Folder, Monitor, DataAnalysis, Setting, Loading, Expand, Fold
} from '@element-plus/icons-vue' // 🌟 补齐了之前菜单里用到但没有引入的 Wallet 与 Collection 图标
import { useTaskStore } from '../store/task'
import { storeToRefs } from 'pinia'

const route = useRoute()
const taskStore = useTaskStore()
const isMenuCollapsed = ref(false)
const { globalProcessingCount: processingCount, headerBreadcrumbs } = storeToRefs(taskStore)

const asideWidth = computed(() => (isMenuCollapsed.value ? '64px' : '240px'))
const activeMenu = computed(() => route.path)
const currentRouteName = computed(() => route.meta.title || '管理后台')
const toggleMenu = () => {
  isMenuCollapsed.value = !isMenuCollapsed.value
}
</script>

<style scoped>
.layout-container { height: 100vh; background-color: #f5f7fa; }

/* 侧边栏基础布局结构 */
.layout-aside { background: #fff; border-right: 1px solid #e6e6e6; transition: width 0.2s ease; overflow-x: hidden; }
.logo-wrapper { height: 80px; display: flex; align-items: center; padding: 0 24px; gap: 12px; border-bottom: 1px solid #f0f2f5; }
.is-collapsed .logo-wrapper { justify-content: center; padding: 0; }
.logo-icon { font-size: 28px; }
.logo-text { display: flex; flex-direction: column; }
.system-name { font-weight: bold; font-size: 20px; color: #00818a; letter-spacing: 0.5px; }
.sub-name { font-size: 14px; color: #909399; margin-top: 2px; }

/* 菜单定制：完美对齐蓝色激活块样式 */
.el-menu { border-right: none; }
.el-menu-vertical:not(.el-menu--collapse) { width: 240px; }
.el-menu-vertical.el-menu--collapse { width: 64px; }
:deep(.el-menu-item) { height: 50px; line-height: 50px; margin: 4px 0; }
:deep(.el-menu-item.is-active) { 
  background-color: #2b65f0 !important; 
  color: #fff !important;
  border-radius: 8px;
  margin: 4px 12px;
  width: calc(100% - 24px);
}
:deep(.el-sub-menu__title) { height: 50px; line-height: 50px; }
.el-menu-vertical.el-menu--collapse :deep(.el-menu-item),
.el-menu-vertical.el-menu--collapse :deep(.el-sub-menu__title) {
  justify-content: center;
}
.el-menu-vertical.el-menu--collapse :deep(.el-menu-item.is-active) {
  margin: 4px 8px;
  width: calc(100% - 16px);
}

/* 右侧顶栏交互基础样式 */
.layout-header { background: #fff; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e6e6e6; height: 60px; padding: 0 24px; }
.header-left { display: flex; align-items: center; gap: 12px; min-width: 0; }
.collapse-toggle { color: #606266; font-size: 18px; }
.collapse-toggle:hover { color: #2b65f0; background: #eef4ff; }
.breadcrumb-current { font-size: 16px; font-weight: 500; color: #303133; }
.header-breadcrumb { font-size: 16px; font-weight: 500; }
.header-crumb-btn { padding: 0; border: 0; background: transparent; color: #2b65f0; font: inherit; cursor: pointer; }
.header-crumb-btn:hover { text-decoration: underline; }
.header-right { display: flex; align-items: center; gap: 15px; }
.icon-btn { font-size: 20px; color: #606266; }
.user-profile { display: flex; align-items: center; gap: 8px; cursor: pointer; }
.user-name { font-size: 14px; color: #606266; }
.layout-main { padding: 0; background-color: #f5f7fa; }
</style>
