<template>
  <div class="data-table-container">
    <div class="table-loading" v-if="loading">
      <div class="loading-spinner"></div>
      <div class="loading-text">Загрузка данных...</div>
    </div>

    <div class="table-error" v-else-if="error">
      <div class="error-icon">⚠️</div>
      <div class="error-text">{{ error }}</div>
    </div>

    <div class="table-wrapper" v-else>
      <div class="table-scroll-container">
        <table class="data-table">
          <thead>
            <tr>
              <th 
                v-for="column in columns" 
                :key="column.key"
                :class="['column-header', column.type]"
              >
                <div class="header-content">
                  {{ column.title }}
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="(row, index) in data" 
              :key="index"
              @click="handleRowClick(row)"
              :class="{ 'clickable': hasRowClick }"
            >
              <td 
                v-for="column in columns" 
                :key="column.key"
                :class="['cell', column.type, getCellClass(column.key)]"
              >
                <div class="cell-content" v-html="getCellContent(row, column)"></div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="table-empty" v-if="data.length === 0">
        <div class="empty-icon">📊</div>
        <div class="empty-text">Нет данных для отображения</div>
      </div>
    </div>
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
    default: () => []
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

const emit = defineEmits(['row-click'])

const hasRowClick = computed(() => {
  return emit['row-click'] !== undefined
})

const handleRowClick = (row) => {
  emit('row-click', row)
}

const getCellClass = (key) => {
  if (key === 'change') return 'change-cell'
  if (key === 'currentValue' || key === 'previousValue') return 'value-cell'
  if (key === 'nm_id') return 'article-cell'
  return ''
}

const getCellContent = (row, column) => {
  const value = row[column.key]
  
  if (column.render) {
    return column.render(value, row)
  }

  switch (column.type) {
    case 'currency':
      return formatCurrency(value)
    case 'number':
      return formatNumber(value)
    case 'datetime':
      return formatDateTime(value)
    case 'boolean':
      return formatBoolean(value)
    default:
      return value || '-'
  }
}

const formatCurrency = (value) => {
  if (!value && value !== 0) return '<span class="no-data">-</span>'
  const num = Number(value)
  return isNaN(num) ? value : `
    <div class="currency-value">
      ${Math.round(num).toLocaleString()} ₽
    </div>
  `
}

const formatNumber = (value) => {
  if (!value && value !== 0) return '<span class="no-data">-</span>'
  const num = Number(value)
  return isNaN(num) ? value : `
    <div class="number-value">
      ${num.toLocaleString()}
    </div>
  `
}

const formatDateTime = (value) => {
  if (!value) return '<span class="no-data">-</span>'
  try {
    const date = new Date(value)
    return `
      <div class="datetime-value">
        <div class="date">${date.toLocaleDateString('ru-RU')}</div>
        <div class="time">${date.toLocaleTimeString('ru-RU', {
          hour: '2-digit',
          minute: '2-digit'
        })}</div>
      </div>
    `
  } catch {
    return value
  }
}

const formatBoolean = (value) => {
  return value ? 
    '<div class="boolean-true">✅</div>' : 
    '<div class="boolean-false">❌</div>'
}
</script>

<style scoped>
.data-table-container {
  width: 100%;
  border-radius: 12px;
  overflow: hidden;
}

.table-loading {
  padding: 3rem;
  text-align: center;
  color: #94a3b8;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(239, 68, 68, 0.3);
  border-top: 3px solid #ec4899;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

.loading-text {
  font-size: 0.9rem;
}

.table-error {
  padding: 2rem;
  text-align: center;
  color: #fecaca;
  background: rgba(239, 68, 68, 0.1);
  border-radius: 12px;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.error-icon {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.error-text {
  font-size: 0.9rem;
}

.table-wrapper {
  background: rgba(15, 23, 42, 0.6);
  border-radius: 12px;
  border: 1px solid rgba(239, 68, 68, 0.2);
  overflow: hidden;
}

.table-scroll-container {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  background: transparent;
  min-width: 600px;
}

.column-header {
  padding: 1rem 0.75rem;
  text-align: left;
  font-weight: 600;
  color: #e2e8f0;
  background: rgba(30, 41, 59, 0.9);
  border-bottom: 1px solid rgba(239, 68, 68, 0.2);
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
  position: relative;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 20px;
}

.cell {
  padding: 0.875rem 0.75rem;
  border-bottom: 1px solid rgba(239, 68, 68, 0.1);
  color: #cbd5e1;
  transition: all 0.2s ease;
  vertical-align: top;
}

.data-table tbody tr:last-child .cell {
  border-bottom: none;
}

.data-table tbody tr:hover {
  background: rgba(239, 68, 68, 0.05);
}

.data-table tbody tr.clickable {
  cursor: pointer;
}

.data-table tbody tr.clickable:hover {
  background: rgba(239, 68, 68, 0.1);
}

/* Специфичные стили для ячеек */
.article-cell {
  min-width: 120px;
}

.value-cell {
  min-width: 100px;
}

.change-cell {
  min-width: 90px;
}

.cell-content {
  display: flex;
  align-items: center;
  min-height: 20px;
  line-height: 1.4;
}

.table-empty {
  padding: 3rem;
  text-align: center;
  color: #64748b;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-text {
  font-size: 0.9rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Стили для контента ячеек */
:deep(.article-cell) {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 120px;
}

:deep(.article-cell:hover) {
  color: #ec4899 !important;
}

:deep(.article-cell strong) {
  font-size: 0.95rem;
  color: #f1f5f9;
  font-weight: 600;
}

:deep(.article-name) {
  font-size: 0.8rem;
  color: #94a3b8;
  line-height: 1.3;
}

:deep(.change-cell) {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-weight: 600;
  font-size: 0.85rem;
  min-width: 90px;
  flex-wrap: wrap;
}

:deep(.change-cell.positive) {
  color: #10b981 !important;
}

:deep(.change-cell.negative) {
  color: #ef4444 !important;
}

:deep(.change-arrow) {
  font-size: 1rem;
  flex-shrink: 0;
}

:deep(.currency-value) {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 600;
  color: #10b981;
  font-size: 0.9rem;
  white-space: nowrap;
}

:deep(.number-value) {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 500;
  font-size: 0.9rem;
  white-space: nowrap;
}

:deep(.datetime-value) {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  font-size: 0.8rem;
}

:deep(.datetime-value .date) {
  font-weight: 500;
}

:deep(.datetime-value .time) {
  color: #94a3b8;
  font-size: 0.75rem;
}

:deep(.boolean-true),
:deep(.boolean-false) {
  text-align: center;
  font-size: 1rem;
}

:deep(.no-data) {
  color: #64748b;
  font-style: italic;
  font-size: 0.85rem;
}

:deep(.metric-name) {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: #f1f5f9;
  font-size: 0.9rem;
}

:deep(.metric-icon) {
  font-size: 1rem;
  flex-shrink: 0;
}

:deep(.metric-value) {
  font-weight: 600;
  font-family: 'JetBrains Mono', monospace;
  padding: 0.3rem 0.6rem;
  border-radius: 6px;
  background: rgba(15, 23, 42, 0.4);
  text-align: center;
  font-size: 0.85rem;
  white-space: nowrap;
  min-width: 60px;
}

:deep(.metric-value.revenue) {
  color: #10b981;
  background: rgba(16, 185, 129, 0.1);
}

:deep(.metric-value.discount) {
  color: #ec4899;
  background: rgba(236, 72, 153, 0.1);
}

/* Адаптивность */
@media (max-width: 768px) {
  .column-header,
  .cell {
    padding: 0.75rem 0.5rem;
    font-size: 0.8rem;
  }
  
  .table-scroll-container {
    border-radius: 8px;
  }
  
  :deep(.article-cell) {
    min-width: 100px;
  }
  
  :deep(.value-cell) {
    min-width: 80px;
  }
  
  :deep(.change-cell) {
    min-width: 70px;
    font-size: 0.8rem;
  }
  
  :deep(.metric-value) {
    font-size: 0.8rem;
    padding: 0.25rem 0.5rem;
    min-width: 50px;
  }
}

@media (max-width: 480px) {
  .data-table {
    min-width: 500px;
  }
  
  .column-header,
  .cell {
    padding: 0.5rem 0.375rem;
    font-size: 0.75rem;
  }
  
  :deep(.article-name) {
    font-size: 0.75rem;
  }
  
  :deep(.change-cell) {
    gap: 0.25rem;
    font-size: 0.75rem;
  }
  
  :deep(.change-arrow) {
    font-size: 0.9rem;
  }
}
</style>
