<template>
  <div class="placeholder-container">
    <el-empty :description="`正在建设中：${route.meta.title}`">
      <template #image>
        <el-icon style="font-size: 64px; color: #c0c4cc;"><Suitcase /></el-icon>
      </template>
      <el-button type="primary" plain @click="$router.push(`/project/${route.params.id}/dashboard`)">
        返回数据概览
      </el-button>
    </el-empty>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'
import { Suitcase } from '@element-plus/icons-vue'
const route = useRoute()
</script>

<style scoped>
.placeholder-container {
  height: calc(100vh - 100px);
  background: #fff;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e4e7ed;
}
</style>