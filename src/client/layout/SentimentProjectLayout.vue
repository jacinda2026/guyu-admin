<template>
  <el-container class="sentiment-project-layout">
    <el-aside :width="asideWidth" class="project-aside" :class="{ 'is-collapsed': isMenuCollapsed }">
      <el-dropdown trigger="click" class="project-switcher" @command="switchProject">
        <div class="project-brand">
          <template v-if="!isMenuCollapsed">
            <span class="project-name">{{ currentProjectName }}</span>
            <el-icon class="dropdown-icon"><CaretBottom /></el-icon>
          </template>
          <el-icon v-else class="project-collapsed-icon"><Warning /></el-icon>
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
            <div class="group-title"><el-icon><DataBoard /></el-icon> 舆情项目</div>
          </template>
          <el-menu-item :index="`/sentiment-project/${projectId}/overview`">舆情概览</el-menu-item>
          <el-menu-item :index="`/sentiment-project/${projectId}/sources`">信源列表</el-menu-item>
          <el-menu-item :index="`/sentiment-project/${projectId}/question-list`">问题列表</el-menu-item>
          <el-menu-item :index="`/sentiment-project/${projectId}/risk-sources`">风险信源</el-menu-item>
          <el-menu-item :index="`/sentiment-project/${projectId}/conversations`">对话管理</el-menu-item>
          <el-menu-item :index="`/sentiment-project/${projectId}/questions`">舆情问题</el-menu-item>
          <el-menu-item :index="`/sentiment-project/${projectId}/tasks`">监控任务</el-menu-item>
          <el-menu-item :index="`/sentiment-project/${projectId}/reports`">舆情报告</el-menu-item>
        </el-menu-item-group>

        <el-menu-item-group>
          <template #title>
            <div class="group-title"><el-icon><Setting /></el-icon> 配置中心</div>
          </template>
          <el-menu-item :index="`/sentiment-project/${projectId}/config/subject`">监控主体</el-menu-item>
          <el-menu-item :index="`/sentiment-project/${projectId}/config/risk`">风险词库</el-menu-item>
          <el-menu-item :index="`/sentiment-project/${projectId}/config/issue`">舆情问题配置</el-menu-item>
          <el-menu-item :index="`/sentiment-project/${projectId}/config/monitor`">监控配置</el-menu-item>
          <el-menu-item :index="`/sentiment-project/${projectId}/config/alert`">预警配置</el-menu-item>
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
              <button type="button" class="breadcrumb-link" @click="goSentimentList">舆情监控</button>
            </el-breadcrumb-item>
            <el-breadcrumb-item v-if="isQuestionDetailPage">
              <button type="button" class="breadcrumb-link" @click="goQuestionList">问题列表</button>
            </el-breadcrumb-item>
            <el-breadcrumb-item v-else-if="isClueDetailPage">
              <button type="button" class="breadcrumb-link" @click="goOverview">舆情线索池</button>
            </el-breadcrumb-item>
            <el-breadcrumb-item v-else>{{ currentPageTitle }}</el-breadcrumb-item>
            <el-breadcrumb-item v-if="isQuestionDetailPage">问题</el-breadcrumb-item>
            <el-breadcrumb-item v-if="isClueDetailPage">线索</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-tag type="danger" effect="plain">持续监测</el-tag>
          <el-tooltip content="返回舆情项目列表" placement="bottom">
            <el-icon class="home-btn" @click="goSentimentList"><House /></el-icon>
          </el-tooltip>
          <div class="user-info">
            <el-avatar :size="28" src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" />
            <span class="username">momo.zxy</span>
          </div>
        </div>
      </el-header>

      <el-main class="project-main-bg">
        <router-view :key="route.fullPath" />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { CaretBottom, DataBoard, Expand, Fold, House, Setting, Warning } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const isMenuCollapsed = ref(false)
const asideWidth = computed(() => (isMenuCollapsed.value ? '64px' : '200px'))

const projectOptions = [
  { id: 'SEN-MOCK-AUDI', name: '奥迪E7X换壳舆情' },
  { id: 'SEN-827311', name: 'AuraLuxe口碑监控' },
  { id: 'SEN-829104', name: '汉庭祥云小镇舆情' }
]

const pageTitleMap = {
  overview: '舆情概览',
  sources: '信源列表',
  'question-list': '问题列表',
  'question-detail': '问题详情',
  'clue-detail': '线索详情',
  'risk-sources': '风险信源',
  conversations: '对话管理',
  questions: '舆情问题',
  tasks: '监控任务',
  reports: '舆情报告',
  config: '配置中心'
}

const configPageTitleMap = {
  subject: '监控主体',
  risk: '风险词库',
  issue: '舆情问题配置',
  monitor: '监控配置',
  alert: '预警配置'
}

const projectId = computed(() => route.params.id || 'SEN-MOCK-AUDI')
const currentProjectName = computed(() => projectOptions.find(project => project.id === projectId.value)?.name || '舆情监控项目')
const isQuestionDetailPage = computed(() => route.params.section === 'question-detail')
const isClueDetailPage = computed(() => route.params.section === 'clue-detail')
const currentPageTitle = computed(() => {
  if (route.meta.configPage) return configPageTitleMap[route.meta.configPage] || '配置中心'
  return pageTitleMap[route.params.section] || route.meta.title || '舆情概览'
})

const toggleMenu = () => {
  isMenuCollapsed.value = !isMenuCollapsed.value
}

const switchProject = (targetProjectId) => {
  if (!targetProjectId || targetProjectId === projectId.value) return
  if (route.meta.configPage) {
    router.push(`/sentiment-project/${targetProjectId}/config/${route.meta.configPage}`)
    return
  }
  if (route.params.section === 'sources') {
    router.push(`/sentiment-project/${targetProjectId}/sources`)
    return
  }
  const section = route.params.section || 'overview'
  router.push(`/sentiment-project/${targetProjectId}/${section}`)
}

const goSentimentList = () => {
  router.push('/projects/sentiment')
}

const goQuestionList = () => {
  router.push(`/sentiment-project/${projectId.value}/question-list`)
}

const goOverview = () => {
  router.push(`/sentiment-project/${projectId.value}/overview`)
}
</script>

<style scoped>
.sentiment-project-layout { height: 100vh; width: 100vw; overflow: hidden; background: #f0f2f5; }
.project-aside { background-color: #f5f7fa; border-right: 1px solid #e4e7ed; display: flex; flex-direction: column; transition: width 0.2s ease; overflow-x: hidden; }
.project-switcher { width: 100%; border-bottom: 1px solid #e4e7ed; }
.project-brand { height: 50px; display: flex; align-items: center; padding: 0 20px; font-weight: 800; font-size: 16px; color: #1f2937; cursor: pointer; box-sizing: border-box; }
.is-collapsed .project-brand { justify-content: center; padding: 0; }
.project-collapsed-icon { font-size: 20px; color: #f56c6c; }
.project-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dropdown-icon { margin-left: 4px; font-size: 12px; color: #909399; }
.project-menu { border-right: none; background: transparent; }
.project-menu:not(.el-menu--collapse) { width: 200px; }
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
