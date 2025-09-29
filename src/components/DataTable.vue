<template>
    <div class="table-container">
      <div v-if="loading" class="loading">Загрузка данных...</div>
      <div v-else-if="error" class="error">Ошибка: {{ error }}</div>
      <div v-else-if="data.length === 0" class="no-data">Данные не найдены</div>
      <table v-else class="data-table">
        <thead>
          <tr>
            <th v-for="column in columns" :key="column.key">
              {{ column.title }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in data" :key="index">
            <td v-for="column in columns" :key="column.key">
              {{ formatValue(getNestedValue(item, column.key), column.type) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </template>
  
  <script setup>
  import { computed } from 'vue'
  
  const props = defineProps({
    data: {
      type: Array,
      default: () => []
    },
    columns: {
      type: Array,
      required: true
    },
    loading: {
      type: Boolean,
      default: false
    },
    error: {
      type: String,
      default: null
    }
  })
  
  const getNestedValue = (obj, path) => {
    return path.split('.').reduce((acc, part) => {
      return acc && acc[part] !== undefined ? acc[part] : null
    }, obj)
  }
  
  const formatValue = (value, type = 'string') => {
    if (value === null || value === undefined || value === '') return '-'
    
    switch (type) {
      case 'date':
        try {
          return new Date(value).toLocaleDateString('ru-RU')
        } catch {
          return String(value)
        }
      case 'datetime':
        try {
          return new Date(value).toLocaleString('ru-RU')
        } catch {
          return String(value)
        }
      case 'number':
        return new Intl.NumberFormat('ru-RU').format(Number(value))
      case 'currency':
        return new Intl.NumberFormat('ru-RU', {
          style: 'currency',
          currency: 'RUB',
          minimumFractionDigits: 0
        }).format(Number(value))
      case 'boolean':
        return value ? '✅ Да' : value === false ? '❌ Нет' : '-'
      default:
        return String(value)
    }
  }
  </script>
  
  <style scoped>
  .table-container {
    overflow-x: auto;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    margin: 1rem 0;
  }
  
  .data-table {
    width: 100%;
    border-collapse: collapse;
    margin: 0;
    font-size: 0.875rem;
  }
  
  .data-table th,
  .data-table td {
    padding: 0.75rem;
    text-align: left;
    border-bottom: 1px solid #e0e0e0;
    white-space: nowrap;
  }
  
  .data-table th {
    background-color: #f8f9fa;
    font-weight: 600;
    color: #495057;
    position: sticky;
    top: 0;
  }
  
  .data-table tr:hover {
    background-color: #f8f9fa;
  }
  
  .loading, .no-data, .error {
    text-align: center;
    padding: 2rem;
    color: #666;
    font-style: italic;
  }
  
  .error {
    color: #dc3545;
    background: #f8d7da;
    border-radius: 4px;
  }
  </style>