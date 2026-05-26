import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useTaskStore = defineStore('task', () => {
  // 定义全局状态：进行中的任务数量，默认先给个 0
  const globalProcessingCount = ref(0)
  const headerBreadcrumbs = ref([])
  const headerBreadcrumbHandler = ref(null)

  // 定义修改状态的方法
  function updateCount(count) {
    globalProcessingCount.value = count
  }

  function setHeaderBreadcrumbs(items, handler = null) {
    headerBreadcrumbs.value = items
    headerBreadcrumbHandler.value = handler
  }

  function clearHeaderBreadcrumbs() {
    headerBreadcrumbs.value = []
    headerBreadcrumbHandler.value = null
  }

  function handleHeaderBreadcrumb(item) {
    if (item?.clickable && headerBreadcrumbHandler.value) {
      headerBreadcrumbHandler.value(item.key)
    }
  }

  return { globalProcessingCount, headerBreadcrumbs, updateCount, setHeaderBreadcrumbs, clearHeaderBreadcrumbs, handleHeaderBreadcrumb }
})
