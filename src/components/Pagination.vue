<template>
    <div class="pagination">
      <button @click="prevPage" :disabled="currentPage === 1" class="pagination-btn">Назад</button>
      <span class="pagination-info">Страница {{ currentPage }}</span>
      <button @click="nextPage" :disabled="!hasNextPage" class="pagination-btn">Вперед</button>
    </div>
  </template>
  
  <script setup>
  import { computed } from 'vue'
  
  const props = defineProps({
    currentPage: Number,
    totalPages: Number
  })
  
  const emit = defineEmits(['page-change'])
  
  const hasNextPage = computed(() => {
    return !props.totalPages || props.currentPage < props.totalPages
  })
  
  const prevPage = () => {
    if (props.currentPage > 1) {
      emit('page-change', props.currentPage - 1)
    }
  }
  
  const nextPage = () => {
    if (hasNextPage.value) {
      emit('page-change', props.currentPage + 1)
    }
  }
  </script>
  
  <style scoped>
  .pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.5rem; 
    margin: 1rem 0;
    padding: 1rem;
    background: rgba(15, 23, 42, 0.8);
    border-radius: 12px;
    border: 1px solid rgba(236, 72, 153, 0.2);
    backdrop-filter: blur(10px);
  }
  
  .pagination-btn {
    padding: 0.5rem 1rem;
    border: 1px solid rgba(236, 72, 153, 0.3);
    background: linear-gradient(135deg, #ec4899 0%, #db2777 100%);
    border-radius: 8px;
    cursor: pointer;
    color: white !important; 
    font-weight: 500;
    transition: all 0.3s ease;
    min-width: 80px;
  }
  
  .pagination-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(236, 72, 153, 0.4);
    border-color: rgba(236, 72, 153, 0.6);
    background: linear-gradient(135deg, #db2777 0%, #be185d 100%);
  }
  
  .pagination-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: rgba(236, 72, 153, 0.3);
    color: rgba(255, 255, 255, 0.7) !important;
    transform: none;
    box-shadow: none;
  }

  .pagination-info {
    color: white !important; 
    font-weight: 500;
    margin: 0 0.75rem;
    font-size: 0.95rem;
  }
  </style>