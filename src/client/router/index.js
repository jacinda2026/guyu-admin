import { createRouter, createWebHashHistory } from 'vue-router'
import ClientLayout from '../layout/ClientLayout.vue' // 确保你的主外壳组件存在
import ProjectLayout from '../layout/ProjectLayout.vue' // 🌟 引入刚写好的项目专属壳子
const routes = [
  {
    path: '/',
    component: ClientLayout,
    redirect: '/reports/hotel', // 默认进入酒店工单列表
    children: [
      {
        path: 'report', 
        name: 'GeoDiagnosis',
        component: () => import('../views/GeoDiagnosis.vue'),
        meta: { title: '发起 AI 诊断' }
      },
      // 🌟 新增：项目中心路由节点
      {
        path: 'projects',
        name: 'ProjectCenter',
        component: () => import('../views/ProjectCenter.vue'),
        meta: { title: '项目中心' }
      },  
      {
        path: 'intelligence',
        name: 'SmartCenter',
        component: () => import('../views/SmartCenter.vue'),
        meta: { title: '智能中心' }
      },
      // 报告管理中心独立的二级树状子路由
      {
        path: 'reports',
        name: 'ReportManagementParent',
        redirect: '/reports/hotel',
        meta: { title: '报告管理中心' },
        children: [
          {
            path: 'hotel',
            name: 'HotelReportManagement',
            component: () => import('../views/HotelReportManagement.vue'),
            meta: { title: '酒店单店诊断项目' }
          },
          {
            path: 'brand',
            name: 'BrandReportManagement',
            component: () => import('../views/BrandReportManagement.vue'),
            meta: { title: '品牌全域健康度检测' }
          },
          // 🌟 新增：全域舆情监测三级子路由节点
          {
            path: 'sentiment',
            name: 'SentimentReportManagement',
            component: () => import('../views/SentimentReportManagement.vue'),
            meta: { title: '全域舆情监测系统' }
          }
        ]
      },

      {
        path: 'billing',
        name: 'BillingCenter',
        redirect: '/billing/recharge',
        meta: { title: '账户中心' },
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
            meta: { title: '费用详情' }
          }
        ]
      },
    ]
  },
  // 🌟 新增：独立的项目专属工作台路由 (顶级路由)
  {
    path: '/project/:id', // 这里的 :id 是项目ID参数
    component: ProjectLayout,
    redirect: to => { return `/project/${to.params.id}/dashboard` },
    children: [
      // 1. 数据中心
      { path: 'dashboard', name: 'ProjectDataOverview', component: () => import('../views/project/DataOverview.vue'), meta: { title: '数据概览' } },
      { path: 'sources', name: 'ProjectSources', component: () => import('../views/project/ProjectSources.vue'), meta: { title: '信源统计' } },
      { path: 'monitor', name: 'ProjectMonitor', component: () => import('../views/project/ProblemMonitor.vue'), meta: { title: '问题监控' } },
      { path: 'monitor/:questionId', name: 'ProjectMonitorQuestionDetail', component: () => import('../views/project/ProblemMonitor.vue'), meta: { title: '监控问题概览' } },
      { path: 'tasks', name: 'ProjectMonitorTasks', component: () => import('../views/project/MonitorTasks.vue'), meta: { title: '监控任务' } },
      { path: 'tasks/:taskId', name: 'ProjectMonitorTaskDetail', component: () => import('../views/project/MonitorTasks.vue'), meta: { title: '监控任务详情' } },
      { path: 'exports', name: 'ProjectExportCenter', component: () => import('../views/project/ExportCenter.vue'), meta: { title: '导出中心' } },
      
      // 2. 素材中心
      { path: 'articles', name: 'ProjectArticles', component: () => import('../views/project/Placeholder.vue'), meta: { title: '发布文章' } },
      { path: 'knowledge', name: 'ProjectKnowledge', component: () => import('../views/project/Placeholder.vue'), meta: { title: '知识库' } },
      { path: 'materials', name: 'ProjectMaterials', component: () => import('../views/project/Placeholder.vue'), meta: { title: '素材库' } },
      
      // 3. 配置中心
      { path: 'config/issue', name: 'ConfigIssue', component: () => import('../views/project/QuestionConfig.vue'), meta: { title: '问题配置' } },
      { path: 'config/competitor', name: 'ConfigCompetitor', component: () => import('../views/project/CompetitorConfig.vue'), meta: { title: '竞品配置' } },
      { path: 'config/monitor', name: 'ConfigMonitor', component: () => import('../views/project/MonitorConfig.vue'), meta: { title: '监控配置' } },
      
      // 4. 智能体
      { path: 'agent', name: 'ProjectAgent', component: () => import('../views/project/Placeholder.vue'), meta: { title: '智能体' } }
    ]
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
