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
        return value ? 'Да' : value === false ? 'Нет' : '-'
      default:
        return String(value)
    }
  }
  </script>
  
  <style scoped>
  .table-container {
    overflow-x: auto;
    background: transparent;
    border-radius: 12px;
    margin: 1rem 0;
    border: 1px solid rgba(17, 14, 40, 0.2);
  }
  
  .data-table {
    width: 100%;
    border-collapse: collapse;
    margin: 0;
    font-size: 0.875rem;
    background: rgba(15, 23, 42, 0.8);
    backdrop-filter: blur(10px);
  }
  
  .data-table th,
  .data-table td {
    padding: 0.75rem;
    text-align: left;
    border-bottom: 1px solid rgba(21, 17, 46, 0.2);
    white-space: nowrap;
    color: #e2e8f0;
  }
  
  .data-table th {
    background: linear-gradient(135deg, rgba(27, 27, 82, 0.2) 0%, rgba(34, 45, 100, 0.1) 100%);
    font-weight: 600;
    color: #f1f5f9;
    border-bottom: 2px solid rgba(23, 19, 54, 0.378);
  }
  
  .data-table tr:hover {
    background: rgba(34, 29, 66, 0.1);
  }
  
  .data-table tr:last-child td {
    border-bottom: none;
  }
  
  .loading, .no-data, .error {
    text-align: center;
    padding: 2rem;
    color: #94a3b8;
    font-style: italic;
    background: rgba(15, 23, 42, 0.8);
    border-radius: 12px;
    border: 1px solid rgba(236, 72, 153, 0.2);
  }
  
  .error {
    color: #fecaca;
    background: linear-gradient(135deg, rgba(236, 72, 153, 0.2) 0%, rgba(219, 39, 119, 0.1) 100%);
    border-color: rgba(236, 72, 153, 0.3);
  }

  .no-data {
    color: #bae6fd;
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(30, 64, 175, 0.1) 100%);
  }
  </style>