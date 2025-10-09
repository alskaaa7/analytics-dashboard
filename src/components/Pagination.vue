<template>
  <div class="pagination-container" v-if="totalPages > 1">
    <div class="pagination-info">
      Показано {{ startItem }}-{{ endItem }} из {{ totalItems }}
    </div>
    
    <div class="pagination-controls">
      <button 
        @click="goToPage(currentPage - 1)"
        :disabled="currentPage === 1"
        class="pagination-btn pagination-prev"
      >
        ← Назад
      </button>

      <div class="pagination-pages">
        <button
          v-for="page in visiblePages"
          :key="page"
          @click="goToPage(page)"
          :class="[
            'pagination-page',
            { 'active': page === currentPage }
          ]"
        >
          {{ page }}
        </button>
        
        <span class="pagination-ellipsis" v-if="showStartEllipsis">...</span>
        <span class="pagination-ellipsis" v-if="showEndEllipsis">...</span>
      </div>

      <button 
        @click="goToPage(currentPage + 1)"
        :disabled="currentPage === totalPages"
        class="pagination-btn pagination-next"
      >
        Вперед →
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  currentPage: {
    type: Number,
    required: true
  },
  totalPages: {
    type: Number,
    required: true
  },
  totalItems: {
    type: Number,
    required: true
  },
  itemsPerPage: {
    type: Number,
    default: 100
  }
})

const emit = defineEmits(['page-change'])

const startItem = computed(() => {
  return (props.currentPage - 1) * props.itemsPerPage + 1
})

const endItem = computed(() => {
  const end = props.currentPage * props.itemsPerPage
  return end > props.totalItems ? props.totalItems : end
})

const visiblePages = computed(() => {
  const pages = []
  const delta = 2 // Количество страниц показываемых с каждой стороны от текущей
  
  for (
    let i = Math.max(2, props.currentPage - delta);
    i <= Math.min(props.totalPages - 1, props.currentPage + delta);
    i++
  ) {
    pages.push(i)
  }
  
  // Всегда показываем первую и последнюю страницу
  if (props.currentPage - delta > 1) {
    pages.unshift(1)
  }
  if (props.currentPage + delta < props.totalPages) {
    pages.push(props.totalPages)
  }
  
  // Убираем дубликаты и сортируем
  return [...new Set(pages)].sort((a, b) => a - b)
})

const showStartEllipsis = computed(() => {
  return visiblePages.value.length > 0 && visiblePages.value[0] > 1
})

const showEndEllipsis = computed(() => {
  return visiblePages.value.length > 0 && 
         visiblePages.value[visiblePages.value.length - 1] < props.totalPages
})

const goToPage = (page) => {
  if (page >= 1 && page <= props.totalPages && page !== props.currentPage) {
    emit('page-change', page)
  }
}
</script>

<style scoped>
.pagination-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 2rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%);
  border-radius: 12px;
  border: 1px solid rgba(239, 68, 68, 0.2);
  backdrop-filter: blur(10px);
}

.pagination-info {
  color: #94a3b8;
  font-size: 0.9rem;
  font-weight: 500;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.pagination-btn {
  padding: 0.75rem 1rem;
  border: 1px solid rgba(239, 68, 68, 0.3);
  background: rgba(15, 23, 42, 0.8);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
  color: #e2e8f0;
  min-width: 80px;
}

.pagination-btn:hover:not(:disabled) {
  border-color: #ec4899;
  background: rgba(239, 68, 68, 0.2);
  transform: translateY(-2px);
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.pagination-pages {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.pagination-page {
  padding: 0.75rem 1rem;
  border: 1px solid rgba(239, 68, 68, 0.2);
  background: rgba(15, 23, 42, 0.6);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
  color: #cbd5e1;
  min-width: 44px;
}

.pagination-page:hover {
  border-color: rgba(239, 68, 68, 0.5);
  background: rgba(239, 68, 68, 0.1);
  color: #e2e8f0;
}

.pagination-page.active {
  background: linear-gradient(135deg, #ec4899, #db2777);
  border-color: #ec4899;
  color: white;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.pagination-ellipsis {
  padding: 0.75rem 0.5rem;
  color: #64748b;
  font-weight: 500;
}

@media (max-width: 768px) {
  .pagination-container {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .pagination-controls {
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .pagination-btn {
    min-width: 70px;
    padding: 0.5rem 0.75rem;
    font-size: 0.9rem;
  }
  
  .pagination-page {
    min-width: 40px;
    padding: 0.5rem 0.75rem;
    font-size: 0.9rem;
  }
}
</style>
