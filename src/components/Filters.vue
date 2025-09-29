<template>
    <div class="filters">
      <div class="filter-group">
        <label>Дата с:</label>
        <input type="date" v-model="localFilters.dateFrom" @change="updateFilters">
      </div>
      
      <div v-if="showDateTo" class="filter-group">
        <label>Дата по:</label>
        <input type="date" v-model="localFilters.dateTo" @change="updateFilters">
      </div>
      
      <div class="filter-group">
        <label>Лимит:</label>
        <select v-model="localFilters.limit" @change="updateFilters">
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
  
  const props = defineProps({
    showDateTo: {
      type: Boolean,
      default: true
    }
  })
  
  const emit = defineEmits(['filters-change'])
  
  const localFilters = ref({
    dateFrom: '',
    dateTo: '',
    limit: '100',
    page: 1
  })
  
  const updateFilters = () => {
    const filters = { ...localFilters.value }
    if (!filters.dateFrom) delete filters.dateFrom
    if (!filters.dateTo) delete filters.dateTo
    emit('filters-change', filters)
  }
  
  watch(localFilters, updateFilters, { deep: true })
  </script>
  
  <style scoped>
  .filters {
    display: flex;
    gap: 1rem;
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