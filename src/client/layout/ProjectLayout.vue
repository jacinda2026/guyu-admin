<template>
  <el-container class="project-layout">
    <el-aside :width="asideWidth" class="project-aside" :class="{ 'is-collapsed': isMenuCollapsed }">
      <el-dropdown trigger="click" class="project-switcher" @command="switchProject">
        <div class="project-brand">
          <template v-if="!isMenuCollapsed">
            <span class="project-name">{{ currentProjectName }}</span>
            <el-icon class="dropdown-icon"><CaretBottom /></el-icon>
          </template>
          <el-icon v-else class="project-collapsed-icon"><DataBoard /></el-icon>
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
            <div class="group-title"><el-icon><DataBoard /></el-icon> 数据中心</div>
          </template>
          <el-menu-item :index="`/project/${projectId}/dashboard`">数据概览</el-menu-item>
          <el-menu-item :index="`/project/${projectId}/sources`">信源统计</el-menu-item>
          <el-menu-item :index="`/project/${projectId}/monitor`">问题监控</el-menu-item>
          <el-menu-item :index="`/project/${projectId}/tasks`">监控任务</el-menu-item>
          <el-menu-item :index="`/project/${projectId}/exports`">导出中心</el-menu-item>
        </el-menu-item-group>

        <el-menu-item-group>
          <template #title>
            <div class="group-title"><el-icon><Setting /></el-icon> 配置中心</div>
          </template>
          <el-menu-item :index="`/project/${projectId}/config/issue`">问题配置</el-menu-item>
          <el-menu-item :index="`/project/${projectId}/config/competitor`">竞品配置</el-menu-item>
          <el-menu-item :index="`/project/${projectId}/config/monitor`">监控配置</el-menu-item>
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
              <button type="button" class="breadcrumb-link" @click="goPrimaryMenu">{{ currentPrimaryMenu }}</button>
            </el-breadcrumb-item>
            <el-breadcrumb-item>
              <button type="button" class="breadcrumb-link" @click="goCurrentPage">{{ currentPageTitle }}</button>
            </el-breadcrumb-item>
            <el-breadcrumb-item v-if="currentDetailTitle">{{ currentDetailTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-tooltip content="返回主控制台" placement="bottom">
            <el-icon class="home-btn" @click="goHome"><House /></el-icon>
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
import { CaretBottom, Expand, Fold, House, DataBoard, Setting } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const isMenuCollapsed = ref(false)
const asideWidth = computed(() => (isMenuCollapsed.value ? '64px' : '200px'))

const toggleMenu = () => {
  isMenuCollapsed.value = !isMenuCollapsed.value
}

const projectOptions = [
  { id: 'proj-jinan', name: '卓牧羊奶粉项目' },
  { id: 'proj-shuangyanpi', name: '初敏护肤品项目' },
  { id: 'proj-meirongzhen', name: '美容针' },
  { id: 'proj-remaji', name: '热玛吉' },
  { id: 'proj-neimeng', name: '内蒙古美白项目' }
]

const monitorQuestionTitles = {
  Q001: '湿疹宝宝护肤品牌推荐',
  Q002: '婴儿湿疹用什么护肤品好',
  Q003: '儿童湿疹霜排行榜',
  Q004: '湿疹宝宝面霜什么牌子好用',
  Q005: '宝宝湿疹护肤哪个牌子好',
  Q006: '婴儿湿疹特护护肤霜',
  Q007: '儿童湿疹特护霜',
  Q008: '新生儿湿疹膏推荐',
  Q009: '湿疹宝宝皮肤干痒红用什么保湿霜',
  Q010: '宝宝湿疹红疹修护霜',
  Q011: '婴儿皮肤干痒红裂护理霜',
  Q012: '宝宝湿疹润肤霜',
  Q013: '新生儿湿疹怎么护理',
  Q014: '宝宝湿疹反复怎么办',
  Q015: '婴儿湿疹如何保湿',
  Q016: '湿疹宝宝怎么好得快',
  Q017: '敏感肌宝宝护肤品',
  Q018: '秋冬宝宝皮肤干痒护理',
  Q019: '新生儿皮肤屏障修复霜',
  Q020: '换季敏感宝宝护肤品推荐',
  Q021: '宝宝护肤品怎么选',
  Q022: '婴幼儿护肤品选购攻略',
  Q023: '婴儿护肤品好物推荐清单',
  Q024: '宝宝敏感肌护肤推荐品牌',
  Q025: '敏感肌面霜前10品牌',
  Q026: '儿童过敏护肤推荐品牌',
  Q027: '婴幼儿护肤全套产品推荐',
  Q028: '新生儿护肤品精选推荐',
  Q029: '幼童护肤品测评推荐',
  Q030: '宝宝舒缓修护护肤品推荐',
  Q031: '新生儿补水护肤品推荐',
  Q032: '婴幼儿防皴防干裂护肤品推荐',
  Q033: '宝宝敏感肌专用护肤品推荐',
  Q034: '婴幼儿屏障修护护肤品推荐',
  Q035: '宝宝泛红干痒护肤品推荐',
  Q036: '婴幼儿清爽保湿护肤品推荐',
  Q037: '无激素婴儿湿疹霜',
  Q038: '温和安全的宝宝湿疹霜',
  Q039: '适合敏感肌宝宝的湿疹霜'
}

const projectId = computed(() => route.params.id || 'demo-project')
const currentProjectName = computed(() => projectOptions.find(project => project.id === projectId.value)?.name || '未知项目')

const currentPrimaryMenu = computed(() => {
  const path = route.path
  if (path.includes('/config/')) return '配置中心'
  if (path.includes('/dashboard') || path.includes('/sources') || path.includes('/monitor') || path.includes('/tasks') || path.includes('/exports')) return '数据中心'
  return '项目中心'
})

const currentPageTitle = computed(() => {
  const path = route.path
  if (path.includes('/config/issue')) return '问题配置'
  if (path.includes('/config/competitor')) return '竞品配置'
  if (path.includes('/config/monitor')) return '监控配置'
  if (path.includes('/dashboard')) return '数据概览'
  if (path.includes('/sources')) return '信源统计'
  if (path.includes('/monitor')) return '问题监控'
  if (path.includes('/tasks')) return '监控任务'
  if (path.includes('/exports')) return '导出中心'
  return route.meta.title || '当前页面'
})

const currentDetailTitle = computed(() => {
  if (route.path.includes('/monitor/') && route.params.questionId) {
    return monitorQuestionTitles[route.params.questionId] || String(route.params.questionId)
  }
  if (route.path.includes('/tasks/') && route.params.taskId) return String(route.params.taskId)
  return ''
})

const switchProject = (targetProjectId) => {
  if (!targetProjectId || targetProjectId === projectId.value) return
  const currentSubPath = route.path.replace(`/project/${projectId.value}`, '') || '/dashboard'
  router.push(`/project/${targetProjectId}${currentSubPath}`)
}

const goHome = () => {
  router.push('/projects')
}

const goPrimaryMenu = () => {
  if (route.path.includes('/config/')) {
    router.push(`/project/${projectId.value}/config/issue`)
    return
  }
  router.push(`/project/${projectId.value}/dashboard`)
}

const goCurrentPage = () => {
  if (route.path.includes('/tasks')) {
    router.push(`/project/${projectId.value}/tasks`)
    return
  }
  if (route.path.includes('/exports')) {
    router.push(`/project/${projectId.value}/exports`)
    return
  }
  if (route.path.includes('/monitor')) {
    router.push(`/project/${projectId.value}/monitor`)
    return
  }
  if (route.path.includes('/sources')) {
    router.push(`/project/${projectId.value}/sources`)
    return
  }
  if (route.path.includes('/dashboard')) {
    router.push(`/project/${projectId.value}/dashboard`)
    return
  }
  if (route.path.includes('/config/issue')) {
    router.push(`/project/${projectId.value}/config/issue`)
    return
  }
  if (route.path.includes('/config/competitor')) {
    router.push(`/project/${projectId.value}/config/competitor`)
    return
  }
  if (route.path.includes('/config/monitor')) {
    router.push(`/project/${projectId.value}/config/monitor`)
  }
}
</script>

<style scoped>
.project-layout { height: 100vh; width: 100vw; overflow: hidden; background: #f0f2f5; }
.project-aside { background-color: #f5f7fa; border-right: 1px solid #e4e7ed; display: flex; flex-direction: column; transition: width 0.2s ease; overflow-x: hidden; }
.project-switcher { width: 100%; border-bottom: 1px solid #e4e7ed; }
.project-brand { height: 50px; display: flex; align-items: center; padding: 0 20px; font-weight: 800; font-size: 16px; color: #1f2937; cursor: pointer; box-sizing: border-box; }
.is-collapsed .project-brand { justify-content: center; padding: 0; }
.project-collapsed-icon { font-size: 20px; color: #2563eb; }
.project-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dropdown-icon { margin-left: 4px; font-size: 12px; color: #909399; }
.project-menu { border-right: none; background: transparent; }
.project-menu:not(.el-menu--collapse) { width: 200px; }
.project-menu.el-menu--collapse { width: 64px; }
.group-title { font-weight: bold; color: #111827; display: flex; align-items: center; gap: 8px; font-size: 14px; margin-top: 10px; }
:deep(.el-menu-item-group__title) { padding-bottom: 4px; }
:deep(.el-menu-item) { height: 40px; line-height: 40px; margin: 4px 12px; border-radius: 6px; color: #4b5563; font-size: 13px; }
:deep(.el-menu-item.is-active) { background-color: #e0e7ff !important; color: #2563eb !important; font-weight: bold; }
.project-menu.el-menu--collapse :deep(.el-menu-item) {
  justify-content: center;
  margin: 4px 8px;
  width: calc(100% - 16px);
}
.project-menu.el-menu--collapse :deep(.el-menu-item-group__title) {
  display: none;
}
.project-main-container { display: flex; flex-direction: column; }
.project-header { height: 50px; background: #fff; display: flex; justify-content: space-between; align-items: center; padding: 0 24px; border-bottom: 1px solid #e4e7ed; }
.header-left { display: flex; align-items: center; gap: 16px; min-width: 0; }
.collapse-toggle { color: #606266; font-size: 18px; }
.collapse-toggle:hover { color: #2b65f0; background: #eef4ff; }
:deep(.el-breadcrumb__inner) { font-size: 13px; color: #606266; }
.breadcrumb-link { padding: 0; border: 0; background: transparent; color: #475569; font: inherit; cursor: pointer; }
.breadcrumb-link:hover { color: #2563eb; text-decoration: underline; }
.header-right { display: flex; align-items: center; gap: 24px; }
.home-btn { font-size: 20px; color: #3b82f6; cursor: pointer; transition: transform 0.2s; }
.home-btn:hover { transform: scale(1.1); }
.user-info { display: flex; align-items: center; gap: 8px; cursor: pointer; }
.username { font-size: 13px; color: #303133; }
.project-main-bg { background-color: #f0f2f5; padding: 20px; }
</style>
