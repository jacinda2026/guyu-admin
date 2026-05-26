<template>
  <div class="page-container">
    <div class="page-header">
      <h2>Prompt管理</h2>
      <el-button type="primary" size="default">+ 添加Prompt</el-button>
    </div>

    <div class="prompt-list">
      <el-card v-for="item in prompts" :key="item.id" shadow="hover" class="prompt-card">
        <div class="card-header">
          <span class="prompt-title">{{ item.title }}</span>
          <div class="header-ops">
            <el-button type="primary" link>编辑</el-button>
            <el-button type="danger" link>删除</el-button>
          </div>
        </div>
        <p class="prompt-desc">{{ item.desc }}</p>
        
        <div class="prompt-meta">
          <div class="meta-row">
            <el-icon class="ai-icon"><Cpu /></el-icon>
            <span class="label">模型:</span>
            <el-tag size="small" effect="plain" class="model-tag">{{ item.model }}</el-tag>
            <span class="provider">提供商: {{ item.provider }}</span>
          </div>
          <div class="meta-row bottom">
            <el-tag size="small" type="info" class="category-tag">{{ item.category }}</el-tag>
            <span class="update-time">更新时间: {{ item.updateTime }}</span>
          </div>
        </div>
        
        <div class="card-footer">
          <el-link type="primary" :underline="false">查看Prompt内容</el-link>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { Cpu } from '@element-plus/icons-vue'
const prompts = [
  { id: 1, title: 'AI品牌分析', desc: 'AI回答分析提示词，用于识别品牌提级及情况和相关信息', model: 'qwen-plus', provider: 'tongyi', category: '商业数据', updateTime: '2026/2/4' },
  { id: 2, title: 'DEEPSEEK专家', desc: '专业的商业问题回答优化提示词，指导AI如何更好地回答商业相关问题', model: 'deepseek-chat', provider: 'deepseek', category: '商业问答', updateTime: '2026/2/4' },
  { id: 3, title: 'Doubao专家', desc: '专业的商业营销提示词，指导AI如何更好地进行商业营销分析', model: 'doubao-1-5-pro', provider: 'doubao', category: '商业营销', updateTime: '2026/2/4' },
  { id: 4, title: 'GEO报告生成', desc: 'GEO策略诊断报告生成提示词，根据已计算指标与数据摘要生成全维度HTML报告', model: 'gpt-4o', provider: 'openai', category: '其他', updateTime: '2026/2/4' }
]
</script>

<style scoped>
.page-container { padding: 24px; background-color: #f5f7fa; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.prompt-list { display: flex; flex-direction: column; gap: 16px; }
.prompt-card { border-radius: 8px; }
.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.prompt-title { font-weight: bold; font-size: 16px; color: #303133; }
.prompt-desc { font-size: 14px; color: #606266; margin-bottom: 16px; line-height: 1.5; }
.prompt-meta { background: #fafafa; padding: 12px; border-radius: 4px; margin-bottom: 12px; }
.meta-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; font-size: 13px; }
.ai-icon { color: #409eff; font-size: 16px; }
.model-tag { font-family: monospace; }
.provider, .update-time { color: #909399; }
.meta-row.bottom { margin-bottom: 0; }
.card-footer { border-top: 1px solid #f0f2f5; padding-top: 12px; }
</style>