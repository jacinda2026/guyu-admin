import { createRouter, createWebHashHistory } from 'vue-router'
import ClientLayout from '../layout/ClientLayout.vue'
import ProjectLayout from '../layout/ProjectLayout.vue'
import SentimentProjectLayout from '../layout/SentimentProjectLayout.vue'
import OpinionProjectLayout from '../layout/OpinionProjectLayout.vue'
const routes = [
  {
    path: '/',
    component: ClientLayout,
    redirect: '/reports/hotel', // 榛樿杩涘叆閰掑簵宸ュ崟鍒楄〃
    children: [
      {
        path: 'report', 
        name: 'GeoDiagnosis',
        component: () => import('../views/GeoDiagnosis.vue'),
        meta: { title: '鍙戣捣 AI 璇婃柇' }
      },
      // 馃専 鏂板锛氶」鐩腑蹇冭矾鐢辫妭鐐?
      {
        path: 'projects',
        name: 'ProjectCenter',
        component: () => import('../views/ProjectCenter.vue'),
        meta: { title: '鍝佺墝鐩戞帶' }
      },
      {
        path: 'projects/sentiment',
        name: 'ProjectSentimentCenter',
        component: () => import('../views/SentimentReportManagement.vue'),
        meta: { title: '鑸嗘儏鐩戞帶' }
      },
      {
        path: 'projects/opinion-deepdive',
        name: 'OpinionDeepDiveSystem',
        component: () => import('../views/opinion/OpinionProjectCenter.vue'),
        meta: { title: 'AI 鍏ㄥ煙鑸嗘儏娣遍捇绯荤粺' }
      },
      {
        path: 'intelligence',
        name: 'SmartCenter',
        component: () => import('../views/SmartCenter.vue'),
        meta: { title: '鏅鸿兘涓績' }
      },
      // 鎶ュ憡绠＄悊涓績鐙珛鐨勪簩绾ф爲鐘跺瓙璺敱
      {
        path: 'reports',
        name: 'ReportManagementParent',
        redirect: '/reports/hotel',
        meta: { title: '鎶ュ憡绠＄悊涓績' },
        children: [
          {
            path: 'hotel',
            name: 'HotelReportManagement',
            component: () => import('../views/HotelReportManagement.vue'),
            meta: { title: '閰掑簵鍗曞簵璇婃柇椤圭洰' }
          },
          {
            path: 'brand',
            name: 'BrandReportManagement',
            component: () => import('../views/BrandReportManagement.vue'),
            meta: { title: '品牌全域健康度检测' }
          },
          // 馃専 鏂板锛氬叏鍩熻垎鎯呯洃娴嬩笁绾у瓙璺敱鑺傜偣
          {
            path: 'sentiment',
            name: 'SentimentReportManagement',
            component: () => import('../views/SentimentReportManagement.vue'),
            meta: { title: '鍏ㄥ煙鑸嗘儏鐩戞祴绯荤粺' }
          }
        ]
      },

      {
        path: 'billing',
        name: 'BillingCenter',
        redirect: '/billing/recharge',
        meta: { title: '璐︽埛涓績' },
        children: [
          {
            path: 'recharge',
            name: 'AccountRecharge',
            component: () => import('../views/billing/AccountRecharge.vue'),
            meta: { title: '账户充值' }
          },
          {
            path: 'details',
            name: 'BillingDetails',
            component: () => import('../views/billing/BillingDetails.vue'),
            meta: { title: '璐圭敤璇︽儏' }
          }
        ]
      },
    ]
  },
  // 馃専 鏂板锛氱嫭绔嬬殑椤圭洰涓撳睘宸ヤ綔鍙拌矾鐢?(椤剁骇璺敱)
  {
    path: '/project/:id', // 杩欓噷鐨?:id 鏄」鐩甀D鍙傛暟
    component: ProjectLayout,
    redirect: to => { return `/project/${to.params.id}/dashboard` },
    children: [
      // 1. 鏁版嵁涓績
      { path: 'dashboard', name: 'ProjectDataOverview', component: () => import('../views/project/DataOverview.vue'), meta: { title: '鏁版嵁姒傝' } },
      { path: 'sources', name: 'ProjectSources', component: () => import('../views/project/ProjectSources.vue'), meta: { title: '淇℃簮缁熻' } },
      { path: 'monitor', name: 'ProjectMonitor', component: () => import('../views/project/ProblemMonitor.vue'), meta: { title: '闂鐩戞帶' } },
      { path: 'monitor/:questionId', name: 'ProjectMonitorQuestionDetail', component: () => import('../views/project/ProblemMonitor.vue'), meta: { title: '鐩戞帶闂姒傝' } },
      { path: 'tasks', name: 'ProjectMonitorTasks', component: () => import('../views/project/MonitorTasks.vue'), meta: { title: '鐩戞帶浠诲姟' } },
      { path: 'tasks/:taskId', name: 'ProjectMonitorTaskDetail', component: () => import('../views/project/MonitorTasks.vue'), meta: { title: '鐩戞帶浠诲姟璇︽儏' } },
      { path: 'exports', name: 'ProjectExportCenter', component: () => import('../views/project/ExportCenter.vue'), meta: { title: '瀵煎嚭涓績' } },
      
      // 2. 绱犳潗涓績
      { path: 'articles', name: 'ProjectArticles', component: () => import('../views/project/Placeholder.vue'), meta: { title: '鍙戝竷鏂囩珷' } },
      { path: 'knowledge', name: 'ProjectKnowledge', component: () => import('../views/project/Placeholder.vue'), meta: { title: '知识库' } },
      { path: 'materials', name: 'ProjectMaterials', component: () => import('../views/project/Placeholder.vue'), meta: { title: '素材库' } },
      
      // 3. 閰嶇疆涓績
      { path: 'config/issue', name: 'ConfigIssue', component: () => import('../views/project/QuestionConfig.vue'), meta: { title: '闂閰嶇疆' } },
      { path: 'config/competitor', name: 'ConfigCompetitor', component: () => import('../views/project/CompetitorConfig.vue'), meta: { title: '绔炲搧閰嶇疆' } },
      { path: 'config/monitor', name: 'ConfigMonitor', component: () => import('../views/project/MonitorConfig.vue'), meta: { title: '鐩戞帶閰嶇疆' } },
      
      // 4. 鏅鸿兘浣?
      { path: 'agent', name: 'ProjectAgent', component: () => import('../views/project/Placeholder.vue'), meta: { title: '智能体' } }
    ]
  },
  {
    path: '/sentiment-project/:id',
    component: SentimentProjectLayout,
    redirect: to => `/sentiment-project/${to.params.id}/overview`,
    children: [
      { path: 'config', redirect: to => `/sentiment-project/${to.params.id}/config/subject` },
      { path: 'config/subject', name: 'SentimentProjectConfigSubject', component: () => import('../views/sentiment/SentimentProjectWorkspace.vue'), meta: { title: '鐩戞帶涓讳綋', configPage: 'subject' } },
      { path: 'config/risk', name: 'SentimentProjectConfigRisk', component: () => import('../views/sentiment/SentimentProjectWorkspace.vue'), meta: { title: '椋庨櫓璇嶅簱', configPage: 'risk' } },
      { path: 'config/issue', name: 'SentimentProjectConfigIssue', component: () => import('../views/sentiment/SentimentProjectWorkspace.vue'), meta: { title: '鑸嗘儏闂閰嶇疆', configPage: 'issue' } },
      { path: 'config/monitor', name: 'SentimentProjectConfigMonitor', component: () => import('../views/sentiment/SentimentProjectWorkspace.vue'), meta: { title: '鐩戞帶閰嶇疆', configPage: 'monitor' } },
      { path: 'config/alert', name: 'SentimentProjectConfigAlert', component: () => import('../views/sentiment/SentimentProjectWorkspace.vue'), meta: { title: '棰勮閰嶇疆', configPage: 'alert' } },
      { path: ':section(overview|sources|question-list|question-detail|clue-detail|risk-sources|conversations|questions|tasks|reports)', name: 'SentimentProjectSection', component: () => import('../views/sentiment/SentimentProjectWorkspace.vue'), meta: { title: '鑸嗘儏椤圭洰' } }
    ]
  },
  {
    path: '/opinion-project/:id',
    component: OpinionProjectLayout,
    redirect: to => `/opinion-project/${to.params.id}/overview`,
    children: [
      { path: 'overview', name: 'OpinionProjectOverview', component: () => import('../views/opinion/OpinionDeepDiveSystem.vue'), meta: { title: '品牌监控首页', section: 'overview' } },
      { path: 'questions', name: 'OpinionProjectQuestions', component: () => import('../views/opinion/OpinionDeepDiveSystem.vue'), meta: { title: '智能问题中心', section: 'questions' } },
      { path: 'clues', name: 'OpinionProjectClues', component: () => import('../views/opinion/OpinionDeepDiveSystem.vue'), meta: { title: '舆情线索池', section: 'clues' } },
      { path: 'deep-dive', name: 'OpinionProjectDeepDive', component: () => import('../views/opinion/OpinionDeepDiveSystem.vue'), meta: { title: '深钻分析', section: 'deepDive' } },
      { path: 'deepDive', redirect: to => `/opinion-project/${to.params.id}/deep-dive` },
      { path: 'evidence', name: 'OpinionProjectEvidence', component: () => import('../views/opinion/OpinionDeepDiveSystem.vue'), meta: { title: '证据链', section: 'evidence' } },
      { path: 'alerts', name: 'OpinionProjectAlerts', component: () => import('../views/opinion/OpinionDeepDiveSystem.vue'), meta: { title: '风险预警', section: 'alerts' } },
      { path: 'reports', name: 'OpinionProjectReports', component: () => import('../views/opinion/OpinionDeepDiveSystem.vue'), meta: { title: '报告中心', section: 'reports' } }
    ]
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
