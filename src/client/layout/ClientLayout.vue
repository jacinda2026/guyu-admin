<template>
  <el-container class="client-layout">
    <el-aside :width="asideWidth" class="client-aside" :class="{ 'is-collapsed': isMenuCollapsed }">
      <div class="logo-zone">
        <el-icon class="logo-icon"><DataLine /></el-icon>
        <template v-if="!isMenuCollapsed">
          <span class="logo-text">GEO 品牌监测</span>
          <el-tag size="small" type="primary" effect="dark" class="version-tag">企业版</el-tag>
        </template>
      </div>

      <el-menu
        mode="vertical"
        router
        :default-active="route.path"
        :default-openeds="isMenuCollapsed ? [] : ['/projects', '/reports', '/billing']"
        :collapse="isMenuCollapsed"
        :collapse-transition="false"
        class="client-menu"
        background-color="#ffffff"
        text-color="#303133"
        active-text-color="#2b65f0"
      >
        <el-sub-menu index="/projects">
          <template #title>
            <el-icon><FolderOpened /></el-icon>
            <span>项目中心</span>
          </template>
          <el-menu-item index="/projects">
            <el-icon><FolderOpened /></el-icon>
            <template #title>
              <span>品牌监控</span>
            </template>
          </el-menu-item>
          <el-menu-item index="/projects/sentiment">
            <el-icon><Warning /></el-icon>
            <template #title>
              <span>舆情监控</span>
            </template>
          </el-menu-item>
          <el-menu-item index="/projects/opinion-deepdive">
            <el-icon><DataAnalysis /></el-icon>
            <template #title>
              <span>AI 全域舆情深钻系统</span>
            </template>
          </el-menu-item>
        </el-sub-menu>

        <el-menu-item index="/intelligence">
          <el-icon><Cpu /></el-icon>
          <template #title>
            <span>智能中心</span>
          </template>
        </el-menu-item>

        <el-sub-menu index="/reports">
          <template #title>
            <el-icon><DocumentCopy /></el-icon>
            <span>报告管理中心</span>
          </template>
          <el-menu-item index="/reports/hotel">
            <el-icon><Menu /></el-icon>
            <template #title>
              <span>酒店单店诊断项目</span>
            </template>
          </el-menu-item>
          <el-menu-item index="/reports/brand">
            <el-icon><DataAnalysis /></el-icon>
            <template #title>
              <span>品牌全域健康度检测</span>
            </template>
          </el-menu-item>
          <el-menu-item index="/reports/sentiment">
            <el-icon><Warning /></el-icon>
            <template #title>
              <span>全域舆情监测系统</span>
            </template>
          </el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="/billing">
          <template #title>
            <el-icon><Wallet /></el-icon>
            <span>账户中心</span>
          </template>
          <el-menu-item index="/billing/recharge">
            <el-icon><CreditCard /></el-icon>
            <template #title>
              <span>账户充值</span>
            </template>
          </el-menu-item>
          <el-menu-item index="/billing/details">
            <el-icon><Tickets /></el-icon>
            <template #title>
              <span>费用详情</span>
            </template>
          </el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-aside>

    <el-container class="main-container">
      <el-header class="client-header">
        <div class="header-left">
          <el-tooltip :content="isMenuCollapsed ? '展开菜单' : '收起菜单'" placement="bottom">
            <el-button class="collapse-toggle" text circle @click="toggleMenu">
              <el-icon>
                <Expand v-if="isMenuCollapsed" />
                <Fold v-else />
              </el-icon>
            </el-button>
          </el-tooltip>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item>{{ currentPrimaryMenu }}</el-breadcrumb-item>
            <el-breadcrumb-item>{{ currentPageTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-badge is-dot class="badge-item">
            <el-icon class="bell-icon"><Bell /></el-icon>
          </el-badge>
          <el-divider direction="vertical" />
          <div class="user-profile">
            <el-avatar :size="30" src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" />
            <span class="user-name">租户老板</span>
          </div>
        </div>
      </el-header>

      <el-main class="client-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import {
  Bell,
  CreditCard,
  Cpu,
  DataAnalysis,
  DataLine,
  DocumentCopy,
  Expand,
  FolderOpened,
  Fold,
  Menu,
  Tickets,
  Wallet,
  Warning
} from '@element-plus/icons-vue'

const route = useRoute()
const isMenuCollapsed = ref(false)

const asideWidth = computed(() => (isMenuCollapsed.value ? '64px' : '240px'))

const toggleMenu = () => {
  isMenuCollapsed.value = !isMenuCollapsed.value
}

const currentPrimaryMenu = computed(() => {
  if (route.path.startsWith('/intelligence')) return '智能中心'
  if (route.path.startsWith('/reports')) return '报告管理中心'
  if (route.path.startsWith('/billing')) return '账户中心'
  if (route.path.startsWith('/projects')) return '项目中心'
  if (route.path.startsWith('/report')) return 'AI 诊断'
  return '首页'
})

const currentPageTitle = computed(() => {
  if (route.path === '/projects') return '品牌监控'
  if (route.path === '/projects/sentiment') return '舆情监控'
  if (route.path === '/projects/opinion-deepdive') return 'AI 全域舆情深钻系统'
  if (route.path === '/intelligence') return '技能广场'
  if (route.path === '/report') return '发起 AI 诊断'
  if (route.path === '/reports/hotel') return '酒店单店诊断项目'
  if (route.path === '/reports/brand') return '品牌全域健康度检测'
  if (route.path === '/reports/sentiment') return '全域舆情监测系统'
  if (route.path === '/billing/recharge') return '账户充值'
  if (route.path === '/billing/details') return '费用详情'
  return route.meta.title || '当前页面'
})
</script>

<style scoped>
.client-layout { height: 100vh; background-color: #f5f7fa; }
.client-aside { background-color: #ffffff; box-shadow: 2px 0 8px rgba(0, 0, 0, 0.04); display: flex; flex-direction: column; z-index: 10; transition: width 0.2s ease; overflow-x: hidden; }
.logo-zone { height: 60px; display: flex; align-items: center; padding: 0 20px; border-bottom: 1px solid #f0f2f5; gap: 8px; box-sizing: border-box; white-space: nowrap; }
.is-collapsed .logo-zone { justify-content: center; padding: 0; }
.logo-icon { flex: 0 0 auto; font-size: 22px; color: #2b65f0; }
.logo-text { font-size: 18px; font-weight: bold; color: #2b65f0; }
.version-tag { transform: scale(0.85); transform-origin: left center; }
.client-menu { flex: 1; border-right: none; padding-top: 10px; }
.client-menu:not(.el-menu--collapse) { width: 240px; }
.client-menu.el-menu--collapse { width: 64px; }

.client-menu :deep(.el-menu-item.is-active) {
  background-color: #2b65f0 !important;
  color: #fff !important;
  border-radius: 8px;
  margin: 4px 12px;
  width: calc(100% - 24px);
}
.client-menu:not(.el-menu--collapse) :deep(.el-sub-menu .el-menu-item) { padding-left: 48px !important; }
.client-menu.el-menu--collapse :deep(.el-menu-item),
.client-menu.el-menu--collapse :deep(.el-sub-menu__title) {
  justify-content: center;
}
.client-menu.el-menu--collapse :deep(.el-menu-item.is-active) {
  margin: 4px 8px;
  width: calc(100% - 16px);
}
.client-header { height: 60px; background-color: #ffffff; border-bottom: 1px solid #e4e7ed; display: flex; align-items: center; justify-content: space-between; padding: 0 24px; }
.header-left { display: flex; align-items: center; gap: 12px; min-width: 0; }
.collapse-toggle { color: #606266; font-size: 18px; }
.collapse-toggle:hover { color: #2b65f0; background: #eef4ff; }
:deep(.el-breadcrumb__inner) { font-size: 14px; color: #606266; font-weight: 500; }
:deep(.el-breadcrumb__item:last-child .el-breadcrumb__inner) { color: #111827; font-weight: 700; }
.header-right { display: flex; align-items: center; gap: 16px; }
.bell-icon { font-size: 18px; color: #606266; cursor: pointer; }
.user-profile { display: flex; align-items: center; gap: 8px; }
.user-name { font-size: 14px; color: #303133; }
.client-main { flex: 1; padding: 24px; overflow-y: auto; background-color: #f5f7fa; }
</style>
