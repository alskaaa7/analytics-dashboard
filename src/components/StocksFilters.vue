<template>
    <div class="filters">
      <div class="filter-group">
        <label>Дата (dateFrom):</label>
        <input 
          type="date" 
          v-model="filters.dateFrom"
          @change="updateFilters"
        >
      </div>
      
      <div class="filter-group">
        <label>Лимит:</label>
        <select v-model="filters.limit" @change="updateFilters">
          <option value="50">50</option>
          <option value="100">100</option>
          <option value="200">200</option>
          <option value="500">500</option>
        </select>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, watch } from 'vue'
  
  const emit = defineEmits(['filters-change'])
  
  const filters = ref({
    dateFrom: '',
    limit: 100,
    page: 1
  })
  
  const updateFilters = () => {
    emit('filters-change', { ...filters.value })
  }
  
  watch(filters, () => {
    filters.value.page = 1
  }, { deep: true })
  </script>
  
  <style scoped>
  .filters {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
    margin-bottom: 1rem;
    padding: 1rem;
    background: #f8f9fa;
    border-radius: 8px;
  }
  
  .filter-group {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .filter-group label {
    font-weight: 500;
    font-size: 0.875rem;
  }
  
  .filter-group input,
  .filter-group select {
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
  }
  </style>