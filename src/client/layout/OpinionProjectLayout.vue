<template>
  <el-container class="opinion-project-layout">
    <el-aside :width="asideWidth" class="project-aside" :class="{ 'is-collapsed': isMenuCollapsed }">
      <el-dropdown trigger="click" class="project-switcher" @command="switchProject">
        <div class="project-brand">
          <template v-if="!isMenuCollapsed">
            <span class="project-name">{{ currentProjectName }}</span>
            <el-icon class="dropdown-icon"><CaretBottom /></el-icon>
          </template>
          <el-icon v-else class="project-collapsed-icon"><DataAnalysis /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item
              v-for="project in projectOptions"
              :key="project.id"
              :command="project.id"
              :disabled="project.id === projectId"
            >
              {{ project.name }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <el-menu
        :default-active="route.path"
        class="project-menu"
        router
        background-color="#f5f7fa"
        text-color="#303133"
        active-text-color="#2b65f0"
        :collapse="isMenuCollapsed"
        :collapse-transition="false"
      >
        <el-menu-item-group>
          <template #title>
            <div class="group-title"><el-icon><DataBoard /></el-icon> 深钻项目</div>
          </template>
          <el-menu-item :index="`/opinion-project/${projectId}/overview`">品牌监控首页</el-menu-item>
          <el-menu-item :index="`/opinion-project/${projectId}/questions`">智能问题中心</el-menu-item>
          <el-menu-item :index="`/opinion-project/${projectId}/clues`">舆情线索池</el-menu-item>
          <el-menu-item :index="`/opinion-project/${projectId}/deep-dive`">深钻分析</el-menu-item>
          <el-menu-item :index="`/opinion-project/${projectId}/evidence`">证据链</el-menu-item>
          <el-menu-item :index="`/opinion-project/${projectId}/alerts`">风险预警</el-menu-item>
          <el-menu-item :index="`/opinion-project/${projectId}/reports`">报告中心</el-menu-item>
        </el-menu-item-group>
      </el-menu>
    </el-aside>

    <el-container class="project-main-container">
      <el-header class="project-header">
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
            <el-breadcrumb-item>
              <button type="button" class="breadcrumb-link" @click="goProjectList">AI 全域舆情深钻系统</button>
            </el-breadcrumb-item>
            <el-breadcrumb-item>{{ currentPageTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-tag type="primary" effect="plain">AI 深钻</el-tag>
          <el-tooltip content="返回项目列表" placement="bottom">
            <el-icon class="home-btn" @click="goProjectList"><House /></el-icon>
          </el-tooltip>
          <div class="user-info">
            <el-avatar :size="28" src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" />
            <span class="username">momo.zxy</span>
          </div>
        </div>
      </el-header>

      <el-main class="project-main-bg">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { CaretBottom, DataAnalysis, DataBoard, Expand, Fold, House } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const isMenuCollapsed = ref(false)
const asideWidth = computed(() => (isMenuCollapsed.value ? '64px' : '210px'))

const projectOptions = [
  { id: 'OP-AUDI-E7X', name: '奥迪E7X换壳争议深钻' },
  { id: 'OP-MILK-001', name: '卓牧羊奶粉口碑深钻' },
  { id: 'OP-HOTEL-HT', name: '汉庭门店差评深钻' }
]

const pageTitleMap = {
  overview: '品牌监控首页',
  questions: '智能问题中心',
  clues: '舆情线索池',
  'deep-dive': '深钻分析',
  evidence: '证据链',
  alerts: '风险预警',
  reports: '报告中心'
}

const projectId = computed(() => route.params.id || 'OP-AUDI-E7X')
const currentProjectName = computed(() => projectOptions.find(project => project.id === projectId.value)?.name || 'AI 舆情深钻项目')
const currentPageTitle = computed(() => route.meta.title || pageTitleMap[route.path.split('/').pop()] || '品牌监控首页')

const toggleMenu = () => {
  isMenuCollapsed.value = !isMenuCollapsed.value
}

const switchProject = (targetProjectId) => {
  if (!targetProjectId || targetProjectId === projectId.value) return
  const section = route.path.split('/').pop() || 'overview'
  router.push(`/opinion-project/${targetProjectId}/${section}`)
}

const goProjectList = () => {
  router.push('/projects/opinion-deepdive')
}
</script>

<style scoped>
.opinion-project-layout { height: 100vh; width: 100vw; overflow: hidden; background: #f0f2f5; }
.project-aside { background-color: #f5f7fa; border-right: 1px solid #e4e7ed; display: flex; flex-direction: column; transition: width 0.2s ease; overflow-x: hidden; }
.project-switcher { width: 100%; border-bottom: 1px solid #e4e7ed; }
.project-brand { height: 50px; display: flex; align-items: center; padding: 0 18px; font-weight: 800; font-size: 15px; color: #1f2937; cursor: pointer; box-sizing: border-box; }
.is-collapsed .project-brand { justify-content: center; padding: 0; }
.project-collapsed-icon { font-size: 20px; color: #2563eb; }
.project-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dropdown-icon { margin-left: 4px; font-size: 12px; color: #909399; }
.project-menu { border-right: none; background: transparent; }
.project-menu:not(.el-menu--collapse) { width: 210px; }
.project-menu.el-menu--collapse { width: 64px; }
.group-title { font-weight: bold; color: #111827; display: flex; align-items: center; gap: 8px; font-size: 14px; margin-top: 10px; }
:deep(.el-menu-item-group__title) { padding-bottom: 4px; }
:deep(.el-menu-item) { height: 40px; line-height: 40px; margin: 4px 12px; border-radius: 6px; color: #4b5563; font-size: 13px; }
:deep(.el-menu-item.is-active) { background-color: #e0e7ff !important; color: #2563eb !important; font-weight: bold; }
.project-menu.el-menu--collapse :deep(.el-menu-item) { justify-content: center; margin: 4px 8px; width: calc(100% - 16px); }
.project-menu.el-menu--collapse :deep(.el-menu-item-group__title) { display: none; }
.project-main-container { display: flex; flex-direction: column; min-width: 0; }
.project-header { height: 50px; background: #fff; display: flex; justify-content: space-between; align-items: center; padding: 0 24px; border-bottom: 1px solid #e4e7ed; }
.header-left { display: flex; align-items: center; gap: 16px; min-width: 0; }
.collapse-toggle { color: #606266; font-size: 18px; }
.collapse-toggle:hover { color: #2b65f0; background: #eef4ff; }
:deep(.el-breadcrumb__inner) { font-size: 13px; color: #606266; }
.breadcrumb-link { padding: 0; border: 0; background: transparent; color: #475569; font: inherit; cursor: pointer; }
.breadcrumb-link:hover { color: #2563eb; text-decoration: underline; }
.header-right { display: flex; align-items: center; gap: 20px; }
.home-btn { font-size: 20px; color: #3b82f6; cursor: pointer; transition: transform 0.2s; }
.home-btn:hover { transform: scale(1.1); }
.user-info { display: flex; align-items: center; gap: 8px; cursor: pointer; }
.username { font-size: 13px; color: #303133; }
.project-main-bg { flex: 1; min-width: 0; background-color: #f0f2f5; padding: 20px; overflow-y: auto; }
</style>
