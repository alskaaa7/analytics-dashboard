<template>
    <div class="pagination">
      <button @click="prevPage" :disabled="currentPage === 1">Назад</button>
      <span>Страница {{ currentPage }}</span>
      <button @click="nextPage" :disabled="!hasNextPage">Вперед</button>
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
    gap: 1rem;
    margin: 1rem 0;
  }
  
  .pagination button {
    padding: 0.5rem 1rem;
    border: 1px solid #ddd;
    background: white;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .pagination button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  </style>