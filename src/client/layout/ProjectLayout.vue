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

      <button type="button" class="balance-entry" :class="{ 'is-collapsed': isMenuCollapsed }" @click="goRecharge">
        <el-icon><CreditCard /></el-icon>
        <span v-if="!isMenuCollapsed">余额: ¥18,186.03</span>
      </button>
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
          <el-button
            class="analysis-entry"
            :type="analysisPanelVisible ? 'primary' : 'default'"
            @click="toggleAnalysisPanel"
          >
            <el-icon><ChatDotRound /></el-icon>
            <span>智能分析</span>
          </el-button>
          <el-tooltip content="返回主控制台" placement="bottom">
            <el-icon class="home-btn" @click="goHome"><House /></el-icon>
          </el-tooltip>
          <div class="user-info">
            <el-avatar :size="28" src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" />
            <span class="username">momo.zxy</span>
          </div>
        </div>
      </el-header>

      <div class="project-content-shell">
        <el-main class="project-main-bg">
          <router-view />
        </el-main>

        <aside v-if="analysisPanelVisible" class="analysis-panel">
          <div class="analysis-panel-header">
            <div>
              <h3>{{ currentAnalysisGuide.title }}</h3>
              <p>{{ currentProjectName }} · {{ currentAnalysisGuide.subtitle }}</p>
            </div>
            <el-button text circle class="analysis-close" @click="analysisPanelVisible = false">
              <el-icon><Close /></el-icon>
            </el-button>
          </div>

          <div class="analysis-topic-bar">
            <button
              v-for="prompt in currentAnalysisGuide.prompts"
              :key="prompt"
              type="button"
              @click="useQuickPrompt(prompt)"
            >
              {{ prompt }}
            </button>
          </div>

          <div class="analysis-chat">
            <div class="analysis-guide-card">
              <strong>{{ currentAnalysisGuide.heading }}</strong>
              <p>{{ currentAnalysisGuide.description }}</p>
              <ul>
                <li v-for="item in currentAnalysisGuide.points" :key="item">{{ item }}</li>
              </ul>
            </div>
            <div
              v-for="message in analysisMessages"
              :key="message.id"
              class="chat-message"
              :class="`is-${message.role}`"
            >
              <div class="message-avatar">
                <el-icon v-if="message.role === 'assistant'"><Cpu /></el-icon>
                <span v-else>我</span>
              </div>
              <div class="message-bubble">
                <p>{{ message.content }}</p>
              </div>
            </div>
          </div>

          <div class="analysis-input">
            <el-input
              v-model="analysisInput"
              type="textarea"
              :rows="3"
              resize="none"
              :placeholder="currentAnalysisGuide.placeholder"
              @keydown.enter.exact.prevent="sendAnalysisMessage"
            />
            <div class="input-actions">
              <span>Enter 发送</span>
              <el-button type="primary" :disabled="!analysisInput.trim()" @click="sendAnalysisMessage">
                <el-icon><Promotion /></el-icon>
                发送
              </el-button>
            </div>
          </div>
        </aside>
      </div>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { CaretBottom, ChatDotRound, Close, Cpu, CreditCard, DataBoard, Expand, Fold, House, Promotion, Setting } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const isMenuCollapsed = ref(false)
const analysisPanelVisible = ref(false)
const analysisInput = ref('')
const asideWidth = computed(() => (isMenuCollapsed.value ? '64px' : '200px'))
const analysisMessages = ref([])

const analysisGuides = {
  dashboard: {
    title: '项目智能分析',
    subtitle: '客户关注指标解读',
    heading: '客户通常想先看项目结论',
    description: '我会把提及率、推荐顺位、竞品差距和趋势变化翻译成客户能直接理解的业务结论。',
    points: ['当前品牌在 AI 回答中的整体表现如何', '本周相比上周是变好还是变差', '哪些平台、问题或竞品最值得客户关注'],
    prompts: [
      '当期品牌表现如何？',
      '本周表现有什么变化？',
      '本品和竞品差距在哪里？',
      '哪些模型对本品更友好？',
      '哪些竞品增长最快？',
      '本品是否存在“被提到但排位靠后”的问题？',
      '哪些指标最影响用户判断？',
      '下一步应该优先优化什么？'
    ],
    placeholder: '输入客户关注的问题，例如：帮我总结当前项目表现'
  },
  sources: {
    title: '信源智能分析',
    subtitle: '客户关心的信源覆盖与影响',
    heading: '客户最关心的信源问题',
    description: '我会围绕 AI 更信任哪些平台、品牌是否被权威信源覆盖、低质或负面信源是否影响认知，生成面向客户的解释和建议。',
    points: ['我方缺的是官网、参数库、评测、论坛还是百科', '竞品被推荐是否来自更强的权威信源覆盖', '哪些低质、过期或负面信源需要优先处理'],
    prompts: [
      'AI主要从哪些平台认识我的品牌？',
      '我的品牌是否出现在高权威信源中？',
      '竞品在哪些信源上比我更强？',
      '哪些信源正在影响AI对品牌的判断？',
      '不同大模型引用的信源是否一致？',
      '是否存在低质、过时或负面信源？',
      '我应该优先优化哪些平台内容？',
      '如何提升AI回答中的品牌可信度？'
    ],
    placeholder: '输入客户关注的问题，例如：给我一份信源分析报告'
  },
  monitor: {
    title: '问题表现分析',
    subtitle: '客户关心的 AI 答案表现',
    heading: '客户通常关心哪些问题影响转化',
    description: '我会把问题监控数据转成客户视角的答案：用户问什么时品牌表现弱、为什么竞品更容易出现、应该先优化哪些问题。',
    points: ['哪些用户问题没有推荐我方品牌', '哪些问题里竞品占据了推荐理由', '哪些高价值问题最适合优先修复'],
    prompts: [
      '本品是否存在“被提到但排名靠后”的问题？',
      '哪些问题属于“高提问、高竞品、低本品”的风险问题？',
      '哪些问题属于“高提及、高顺位”的优势问题？',
      '哪些标签下本品认知不足，需要补充内容资产？',
      '哪些问题会直接影响用户购买或选择判断？',
      '哪些问题应该进入下一轮重点优化清单？'
    ],
    placeholder: '输入客户关注的问题，例如：客户应该优先优化哪些问题？'
  },
  tasks: {
    title: '监测进展分析',
    subtitle: '客户关心的达标与异常原因',
    heading: '客户通常关心为什么没达标',
    description: '我会把任务执行、达标结果、日报周报月报和异常记录转成客户能理解的原因说明。',
    points: ['今天任务是否达标，未达标卡在哪里', '是提及率、推荐顺位、模型覆盖还是采集失败导致异常', '当前数据能否支撑日报、周报或复盘说明'],
    prompts: [
      '当前监控任务执行情况如何？',
      '哪些任务已经达标？',
      '哪些任务未达标，原因是什么？',
      '本次任务和上次相比有什么变化？',
      '哪些模型覆盖不足？',
      '最近日报表现是否稳定？',
      '给我一份监控任务复盘报告',
      '下一步需要调整哪些监控计划？'
    ],
    placeholder: '输入客户关注的问题，例如：今天的任务没有达标，问题出在哪？'
  },
  exports: {
    title: '报告生成助手',
    subtitle: '客户交付物生成建议',
    heading: '客户通常想直接拿到可交付报告',
    description: '我会围绕客户要交付的周报、月报、信源分析、品牌分析，整理报告重点、核心结论、风险说明和下一步行动建议。',
    points: ['本周或本月品牌 AI 表现总结', '信源覆盖、竞品推荐原因和负面风险', '可直接放进报告的客户汇报结论'],
    prompts: ['帮我生成一份本周的周报', '帮我生成一份最新月报', '给我一份信源分析报告', '给我一份当前的品牌分析报告'],
    placeholder: '输入客户想要的报告，例如：帮我生成一份本周的周报'
  },
  questionConfig: {
    title: '问题方向分析',
    subtitle: '客户视角的问题覆盖建议',
    heading: '客户通常关心问题方向是否完整',
    description: '我会从用户决策链路出发，判断当前问题库是否覆盖品牌认知、品类选择、竞品对比、购买顾虑和负面风险。',
    points: ['问题方向是否覆盖客户真实搜索和提问场景', '哪些高价值问题还没有纳入监控', '问题分类是否能支撑后续分析报告'],
    prompts: [
      '我还应该新增哪些问题？',
      '哪些用户场景还没有覆盖？',
      '是否需要增加竞品对比类问题？',
      '是否需要增加功效验证类问题？',
      '是否需要增加购买决策类问题？',
      '是否需要增加安全成分类问题？',
      '是否需要增加适用人群类问题？'
    ],
    placeholder: '输入客户关注的问题，例如：还应该补哪些方面的问题？'
  },
  competitorConfig: {
    title: '竞品范围分析',
    subtitle: '客户视角的竞品选择建议',
    heading: '客户通常关心竞品选得准不准',
    description: '我会判断当前竞品是否覆盖真实推荐场景，避免只看直接竞品而漏掉 AI 回答中经常出现的替代品牌。',
    points: ['竞品是否覆盖客户真正会比较的品牌', '是否遗漏 AI 高频推荐的替代品牌', '竞品分组是否能解释推荐差距'],
    prompts: ['竞品选择是否合理？', '有没有遗漏高频出现的竞品？', '哪些竞品最影响我方推荐？', '竞品应该按什么维度分组？'],
    placeholder: '输入客户关注的问题，例如：有没有遗漏高频出现的竞品？'
  },
  monitorConfig: {
    title: '监控配置分析',
    subtitle: '客户视角的报告能力评估',
    heading: '客户通常关心配置能产出什么级别的报告',
    description: '我会根据监控周期、单日次数、模型覆盖、问题数量和截图/深度能力，判断当前配置适合日报、周报、月报还是深度专项报告。',
    points: ['当前配置能支撑什么级别的报告', '如果要做深度报告，需要提高哪些采集维度', '监控频率和模型覆盖是否足够解释波动原因'],
    prompts: [
      '我现在这样配置合适吗？',
      '每天监控一次够不够？',
      '凌晨2点执行是否合适？',
      '我需要监控哪些AI模型？',
      '我的目标设得太高还是太低？',
      '我应该看日报、周报还是月报？',
      '帮我给出一套推荐配置？',
      '这个监控配置能给到什么级别的报告？'
    ],
    placeholder: '输入客户关注的问题，例如：需要深度的报告，该如何配置？'
  },
  default: {
    title: '客户智能分析',
    subtitle: '客户关注问题解读',
    heading: '可以直接问客户关心的问题',
    description: '我会从客户视角解释当前项目的品牌表现、竞品差距、信源风险和报告产出建议。',
    points: ['当前品牌表现如何', '客户应该关注哪些风险和机会', '下一步应该优化哪些平台和内容'],
    prompts: ['当前品牌表现如何？', '竞品为什么更容易被推荐？', '给我一份客户汇报结论', '下一步优先优化什么？'],
    placeholder: '输入客户关注的问题，例如：当前品牌表现如何？'
  }
}

const toggleMenu = () => {
  isMenuCollapsed.value = !isMenuCollapsed.value
}

const toggleAnalysisPanel = () => {
  analysisPanelVisible.value = !analysisPanelVisible.value
}

const useQuickPrompt = (prompt) => {
  analysisInput.value = prompt
  sendAnalysisMessage()
}

const sendAnalysisMessage = () => {
  const text = analysisInput.value.trim()
  if (!text) return

  analysisMessages.value.push({
    id: Date.now(),
    role: 'user',
    content: text
  })

  analysisMessages.value.push({
    id: Date.now() + 1,
    role: 'assistant',
    content: `已收到「${text}」。我会按「${currentAnalysisGuide.value.title}」的分析口径，结合 ${currentProjectName.value} 的当前页面数据生成可追溯结论。`
  })
  analysisInput.value = ''
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

const currentAnalysisGuide = computed(() => {
  const path = route.path
  if (path.includes('/config/issue')) return analysisGuides.questionConfig
  if (path.includes('/config/competitor')) return analysisGuides.competitorConfig
  if (path.includes('/config/monitor')) return analysisGuides.monitorConfig
  if (path.includes('/sources')) return analysisGuides.sources
  if (path.includes('/monitor')) return analysisGuides.monitor
  if (path.includes('/tasks')) return analysisGuides.tasks
  if (path.includes('/exports')) return analysisGuides.exports
  if (path.includes('/dashboard')) return analysisGuides.dashboard
  return analysisGuides.default
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

const goRecharge = () => {
  router.push('/billing/recharge')
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
.balance-entry {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: calc(100% - 24px);
  height: 38px;
  margin: auto 12px 14px;
  border: 1px solid #c7d2fe;
  border-radius: 10px;
  background: #eef2ff;
  color: #2563eb;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}
.balance-entry:hover {
  border-color: #93c5fd;
  background: #e0e7ff;
  color: #1d4ed8;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.12);
}
.balance-entry .el-icon { font-size: 15px; }
.balance-entry.is-collapsed {
  width: 38px;
  margin: auto auto 14px;
  padding: 0;
}
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
.project-main-container { display: flex; flex-direction: column; min-width: 0; }
.project-header { height: 50px; background: #fff; display: flex; justify-content: space-between; align-items: center; padding: 0 24px; border-bottom: 1px solid #e4e7ed; }
.header-left { display: flex; align-items: center; gap: 16px; min-width: 0; }
.collapse-toggle { color: #606266; font-size: 18px; }
.collapse-toggle:hover { color: #2b65f0; background: #eef4ff; }
:deep(.el-breadcrumb__inner) { font-size: 13px; color: #606266; }
.breadcrumb-link { padding: 0; border: 0; background: transparent; color: #475569; font: inherit; cursor: pointer; }
.breadcrumb-link:hover { color: #2563eb; text-decoration: underline; }
.header-right { display: flex; align-items: center; gap: 24px; }
.analysis-entry {
  height: 32px;
  padding: 0 12px;
  border-radius: 8px;
  font-weight: 700;
}
.analysis-entry :deep(.el-icon) { margin-right: 5px; }
.home-btn { font-size: 20px; color: #3b82f6; cursor: pointer; transition: transform 0.2s; }
.home-btn:hover { transform: scale(1.1); }
.user-info { display: flex; align-items: center; gap: 8px; cursor: pointer; }
.username { font-size: 13px; color: #303133; }
.project-content-shell {
  flex: 1;
  min-height: 0;
  display: flex;
  overflow: hidden;
  background-color: #f0f2f5;
}
.project-main-bg { flex: 1; min-width: 0; background-color: #f0f2f5; padding: 20px; overflow-y: auto; }
.analysis-panel {
  width: 380px;
  flex: 0 0 380px;
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: #fff;
  border-left: 1px solid #e5e7eb;
  box-shadow: -8px 0 22px rgba(15, 23, 42, 0.06);
}
.analysis-panel-header {
  min-height: 72px;
  padding: 16px 18px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px solid #eef2f7;
}
.analysis-panel-header h3 { margin: 0; font-size: 17px; line-height: 24px; color: #111827; }
.analysis-panel-header p { margin: 4px 0 0; font-size: 12px; line-height: 18px; color: #8a95a6; }
.analysis-close { flex: 0 0 auto; color: #64748b; }
.analysis-topic-bar {
  padding: 12px 14px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  border-bottom: 1px solid #eef2f7;
  background: #f8fafc;
}
.analysis-topic-bar button {
  height: 28px;
  padding: 0 10px;
  border: 1px solid #dbe3ef;
  border-radius: 7px;
  background: #fff;
  color: #334155;
  font-size: 12px;
  cursor: pointer;
}
.analysis-topic-bar button:hover {
  color: #2563eb;
  border-color: #b8ccff;
  background: #eef4ff;
}
.analysis-chat {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.analysis-guide-card {
  padding: 14px;
  border: 1px solid #dbeafe;
  border-radius: 8px;
  background: #f8fbff;
  color: #1f2937;
}
.analysis-guide-card strong { display: block; font-size: 14px; line-height: 20px; }
.analysis-guide-card p { margin: 6px 0 10px; color: #64748b; font-size: 12px; line-height: 1.6; }
.analysis-guide-card ul { margin: 0; padding-left: 18px; color: #334155; font-size: 12px; line-height: 1.7; }
.chat-message { display: flex; gap: 10px; align-items: flex-start; }
.chat-message.is-user { flex-direction: row-reverse; }
.message-avatar {
  width: 30px;
  height: 30px;
  flex: 0 0 30px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  background: #eef4ff;
  color: #2563eb;
  font-size: 13px;
  font-weight: 800;
}
.chat-message.is-user .message-avatar { background: #111827; color: #fff; }
.message-bubble {
  max-width: 278px;
  padding: 10px 12px;
  border-radius: 8px;
  background: #f3f6fb;
  color: #253044;
  font-size: 13px;
  line-height: 1.6;
}
.chat-message.is-user .message-bubble { background: #2563eb; color: #fff; }
.message-bubble p { margin: 0; white-space: pre-wrap; word-break: break-word; }
.analysis-input {
  padding: 14px;
  border-top: 1px solid #eef2f7;
  background: #fff;
}
.input-actions {
  margin-top: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.input-actions span { font-size: 12px; color: #94a3b8; }
.input-actions .el-button { border-radius: 8px; font-weight: 700; }

@media (max-width: 980px) {
  .analysis-panel {
    position: absolute;
    top: 50px;
    right: 0;
    bottom: 0;
    width: min(380px, calc(100vw - 64px));
    z-index: 20;
  }
}
</style>
