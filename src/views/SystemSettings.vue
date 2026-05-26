<template>
  <div class="page-container">
    <div class="page-header">
      <div class="header-info">
        <h2>系统全局设置</h2>
        <p class="subtitle">管理全平台调度逻辑、算力配额及各入口接入安全规范</p>
      </div>
      <el-button type="primary" size="default" @click="handleSave">保存当前配置</el-button>
    </div>

    <el-tabs tab-position="left" class="settings-tabs-container">
      <el-tab-pane label="调度引擎配置">
        <div class="settings-content">
          <h3>全局调度策略</h3>
          <el-form label-width="150px" label-position="left">
            <el-form-item label="默认负载均衡模式">
              <el-radio-group v-model="config.strategy">
                <el-radio label="weight">资源权重优先</el-radio>
                <el-radio label="polling">轮询平均分配</el-radio>
                <el-radio label="cost">Tokens 成本优先</el-radio>
              </el-radio-group>
              <div class="form-tip">定义当同一任务支持多个来源（如官方API和模力平台）时的路由逻辑。</div>
            </el-form-item>
            
            <el-form-item label="全局并发保护">
              <el-input-number v-model="config.maxGlobalConcurrency" :min="1" :max="1000" />
              <span class="unit">并行任务数</span>
            </el-form-item>

            <el-form-item label="自动熔断机制">
              <el-switch v-model="config.autoBreak" />
              <span class="side-tip">当接口连续报错超过 5 次时，自动停止调度 10 分钟。</span>
            </el-form-item>
          </el-form>
        </div>
      </el-tab-pane>

      <el-tab-pane label="租户配额模板">
        <div class="settings-content">
          <h3>新租户初始化默认限额</h3>
          <el-form label-width="150px" label-position="left">
            <el-form-item label="单日 Token 上限">
              <el-input v-model="config.defaultTokenLimit" style="width: 220px">
                <template #append>Tokens</template>
              </el-input>
            </el-form-item>
            <el-form-item label="单次任务最大深度">
              <el-input-number v-model="config.maxDepth" :min="1" :max="10" />
              <div class="form-tip">限制租户在执行 GEO 诊断时的递归搜索深度。</div>
            </el-form-item>
          </el-form>
        </div>
      </el-tab-pane>

      <el-tab-pane label="接口与安全">
        <div class="settings-content">
          <h3>安全防护设置</h3>
          <el-form label-width="150px" label-position="left">
            <el-form-item label="API 访问白名单">
              <el-input type="textarea" :rows="3" v-model="config.ipWhitelist" placeholder="多个 IP 请用逗号隔开" />
            </el-form-item>
            <el-form-item label="敏感词脱敏管理">
              <el-switch v-model="config.masking" />
              <span class="side-tip">启用后，所有输出结果中的敏感信息将被自动打码。</span>
            </el-form-item>
          </el-form>
        </div>
      </el-tab-pane>

      <el-tab-pane label="消息与告警">
        <div class="settings-content">
          <h3>运维告警配置</h3>
          <el-form label-width="150px" label-position="left">
            <el-form-item label="告警通知邮箱">
              <el-input v-model="config.adminEmail" placeholder="admin@guyu-geo.com" style="width: 300px" />
            </el-form-item>
            <el-form-item label="告警阈值">
              <el-select v-model="config.alertThreshold">
                <el-option label="模型失败率 > 5%" value="5" />
                <el-option label="模型失败率 > 10%" value="10" />
              </el-select>
            </el-form-item>
          </el-form>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import { ElMessage } from 'element-plus'

const config = reactive({
  strategy: 'weight',
  maxGlobalConcurrency: 200,
  autoBreak: true,
  defaultTokenLimit: '1,000,000',
  maxDepth: 3,
  ipWhitelist: '127.0.0.1, 192.168.1.100',
  masking: true,
  adminEmail: 'monitor@guyu-tech.com',
  alertThreshold: '5'
})

const handleSave = () => {
  ElMessage.success('系统全局配置已更新，即刻生效。')
}
</script>

<style scoped>
.page-container { padding: 24px; background-color: #f5f7fa; min-height: 100vh; }
.page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; }
.header-info h2 { margin: 0; font-size: 22px; color: #303133; }
.subtitle { margin: 6px 0 0; color: #909399; font-size: 14px; }

.settings-tabs-container { background: #fff; border-radius: 8px; border: 1px solid #ebeef5; min-height: 600px; padding: 20px 0; }

.settings-content { padding: 0 40px; max-width: 900px; }
.settings-content h3 { margin-top: 0; margin-bottom: 30px; font-size: 17px; color: #303133; border-left: 4px solid #2b65f0; padding-left: 15px; }

.form-tip { font-size: 12px; color: #999; margin-top: 5px; line-height: 1.4; }
.side-tip { font-size: 13px; color: #666; margin-left: 15px; }
.unit { margin-left: 10px; color: #606266; font-size: 14px; }

:deep(.el-tabs__item) { height: 55px; font-size: 15px; padding-left: 30px !important; text-align: left !important; justify-content: flex-start !important; }
:deep(.el-tabs__nav-wrap::after) { width: 1px; }
</style>