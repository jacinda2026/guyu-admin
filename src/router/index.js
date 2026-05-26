import { createRouter, createWebHashHistory } from 'vue-router'
import MainLayout from '../layout/MainLayout.vue' // 🌟 确保正确导入了刚才的主体外壳组件

const routes = [
  {
    path: '/',
    component: MainLayout,
    redirect: '/dashboard',
    children: [
      { 
        path: 'dashboard', 
        name: 'Dashboard', 
        component: () => import('../views/DataDashboard.vue'), 
        meta: { title: '数据总览' } 
      },
      { 
        path: 'users', 
        name: 'Users', 
        component: () => import('../views/UserManagement.vue'), 
        meta: { title: '用户管理' } 
      },
      { 
        path: 'roles', 
        name: 'Roles', 
        component: () => import('../views/RoleManagement.vue'), 
        meta: { title: '角色管理' } 
      },
      { 
        path: 'tenants', 
        name: 'Tenants', 
        component: () => import('../views/TenantManagement.vue'), 
        meta: { title: '租户管理' } 
      },
      { 
        path: 'billing', 
        name: 'BillingManagement', 
        component: () => import('../views/BillingManagement.vue'), 
        meta: { title: '费用中心' } 
      },
      { 
        path: 'keys', 
        name: 'Keys', 
        component: () => import('../views/KeyManagement.vue'), 
        meta: { title: '大模型管理' } 
      },
      {
        path: '/admin/templates',
        name: 'ReportTemplateCenter',
        component: () => import('../views/ReportTemplateCenter.vue'),
        meta: { title: '研报模板中心' }
      },
      // 🌟 根据要求修改与纠正的三个核心路由
      { 
        path: 'prompts', 
        name: 'Prompts', 
        component: () => import('../views/PromptManagement.vue'), 
        meta: { title: 'Prompt管理' } 
      },
      { 
        path: 'database', 
        name: 'Database', 
        component: () => import('../views/DatabaseManagement.vue'), 
        meta: { title: '数据库管理' } 
      },
      { 
        path: 'system-monitor', 
        name: 'SystemMonitor', 
        component: () => import('../views/SystemMonitor.vue'), 
        meta: { title: '服务运维' } 
      },
      // 🌟 任务调度与审计中心
      { 
        path: 'tasks/monitor', 
        component: () => import('../views/TaskDashboard.vue'), 
        meta: { title: '实时任务监控' } 
      },
      { 
        path: 'tasks/models', 
        component: () => import('../views/TaskModelManagement.vue'), 
        meta: { title: '大模型管理' } 
      },
      { 
        path: 'tasks/scheduling', 
        component: () => import('../views/TaskScheduling.vue'), 
        meta: { title: '任务调度' } 
      },
      { 
        path: 'execution-history', 
        component: () => import('../views/TaskExecutionHistory.vue'), 
        meta: { title: '执行审计记录' } 
      },
      { 
        path: 'analysis', 
        name: 'DataAnalysis', 
        component: () => import('../views/DataAnalysis.vue'), 
        meta: { title: '数据分析' } 
      },
      { 
        path: 'settings', 
        name: 'SystemSettings', 
        component: () => import('../views/SystemSettings.vue'), 
        meta: { title: '系统设置' } 
      }
    ]
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

// 🌟 核心点：补齐之前导致 main.js 报错挂起的 default 路由句柄导出
export default router
