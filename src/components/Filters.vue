<template>
  <div class="filters-container">
    <div class="filters-card elegant-filters">
      <div class="filters-header">
        <div class="header-content">
          <div class="filters-icon">🔍</div>
          <div class="header-text">
            <h3 class="filters-title">Фильтры и поиск</h3>
            <div class="filters-subtitle">Уточните параметры для анализа данных</div>
          </div>
        </div>
        <button 
          @click="toggleFilters" 
          class="toggle-filters-btn elegant-toggle"
          :class="{ 'expanded': isExpanded }"
        >
          <span class="toggle-icon">{{ isExpanded ? '▼' : '▲' }}</span>
          {{ isExpanded ? 'Скрыть фильтры' : 'Показать фильтры' }}
        </button>
      </div>

      <transition name="filters-slide">
        <div class="filters-content" v-if="isExpanded">
          <div class="filters-grid">
            <!-- Основные фильтры -->
            <div class="filter-section">
              <h4 class="section-title">Основные параметры</h4>
              <div class="filter-row">
                <div class="filter-group elegant-group">
                  <label class="filter-label">
                    <span class="label-icon">📅</span>
                    Дата с:
                  </label>
                  <input 
                    type="date" 
                    v-model="filters.dateFrom"
                    @change="emitFilters"
                    class="animated-input elegant-input"
                  >
                </div>

                <div class="filter-group elegant-group">
                  <label class="filter-label">
                    <span class="label-icon">📅</span>
                    Дата по:
                  </label>
                  <input 
                    type="date" 
                    v-model="filters.dateTo"
                    @change="emitFilters"
                    class="animated-input elegant-input"
                  >
                </div>

                <div class="filter-group elegant-group">
                  <label class="filter-label">
                    <span class="label-icon">📊</span>
                    Лимит записей:
                  </label>
                  <select 
                    v-model="filters.limit"
                    @change="emitFilters"
                    class="animated-input elegant-input"
                  >
                    <option value="50">50 записей</option>
                    <option value="100">100 записей</option>
                    <option value="200">200 записей</option>
                    <option value="500">500 записей</option>
                    <!-- Убираем 1000 -->
                  </select>
                </div>
              </div>
            </div>

            <!-- Дополнительные фильтры из слота -->
            <div class="filter-section" v-if="$slots['additional-filters']">
              <h4 class="section-title">Дополнительные фильтры</h4>
              <div class="filter-row">
                <slot name="additional-filters"></slot>
              </div>
            </div>
          </div>

          <div class="filters-actions">
            <button @click="resetFilters" class="reset-btn elegant-button secondary">
              <span class="btn-icon">🔄</span>
              Сбросить фильтры
            </button>
            <button @click="applyFilters" class="apply-btn elegant-button">
              <span class="btn-icon">✅</span>
              Применить фильтры
            </button>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'

const emit = defineEmits(['filters-change'])

const isExpanded = ref(true)

const filters = reactive({
  dateFrom: '',
  dateTo: '',
  limit: 100,
  page: 1
})

// В Filters.vue
const getDefaultDateFrom = () => {
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  return weekAgo.toISOString().split('T')[0]
}

const getDefaultDateTo = () => {
  const today = new Date()
  return today.toISOString().split('T')[0]
}

const getPreviousPeriodStart = () => {
  const from = additionalFilters.value.dateFrom || getDefaultDateFrom()
  const fromDate = new Date(from)
  fromDate.setDate(fromDate.getDate() - 7) // Предыдущая неделя
  return fromDate.toISOString().split('T')[0]
}

const getPreviousPeriodEnd = () => {
  const to = additionalFilters.value.dateTo || getDefaultDateTo()
  const toDate = new Date(to)
  toDate.setDate(toDate.getDate() - 7) // Предыдущая неделя
  return toDate.toISOString().split('T')[0]
}

const toggleFilters = () => {
  isExpanded.value = !isExpanded.value
}

const emitFilters = () => {
  emit('filters-change', { ...filters })
}

const applyFilters = () => {
  emit('filters-change', { ...filters })
}

const resetFilters = () => {
  filters.dateFrom = getDefaultDateFrom()
  filters.dateTo = getDefaultDateTo()
  filters.limit = 100
  filters.page = 1
  emit('filters-change', { ...filters })
}

onMounted(() => {
  // Устанавливаем значения по умолчанию
  filters.dateFrom = getDefaultDateFrom()
  filters.dateTo = getDefaultDateTo()
  emit('filters-change', { ...filters })
})
</script>

<style scoped>
.filters-container {
  margin-bottom: 2rem;
}

.elegant-filters {
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%);
  border-radius: 20px;
  border: 1px solid rgba(239, 68, 68, 0.2);
  backdrop-filter: blur(10px);
  overflow: hidden;
  position: relative;
}

.elegant-filters::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #e86aa9, #f15299, #be185d);
}

.filters-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid rgba(239, 68, 68, 0.1);
}

.header-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.filters-icon {
  font-size: 1.8rem;
  filter: drop-shadow(0 0 10px rgba(239, 68, 68, 0.5));
}

.header-text {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.filters-title {
  margin: 0;
  color: #f1f5f9;
  font-size: 1.3rem;
  font-weight: 600;
}

.filters-subtitle {
  color: #94a3b8;
  font-size: 0.9rem;
  font-weight: 400;
}

.elegant-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 10px;
  color: #e2e8f0;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);
}

.elegant-toggle:hover {
  border-color: #ec4899;
  background: rgba(239, 68, 68, 0.2);
  transform: translateY(-2px);
}

.toggle-icon {
  font-size: 0.9rem;
  transition: transform 0.3s ease;
}

.elegant-toggle.expanded .toggle-icon {
  transform: rotate(180deg);
}

.filters-content {
  padding: 2rem;
}

.filter-section {
  margin-bottom: 2rem;
}

.filter-section:last-child {
  margin-bottom: 0;
}

.section-title {
  color: #f1f5f9;
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.section-title::before {
  content: '';
  width: 4px;
  height: 16px;
  background: linear-gradient(135deg, #e86aa9, #f15299);
  border-radius: 2px;
}

.filter-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.elegant-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.filter-label {
  font-weight: 600;
  color: #e2e8f0;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.label-icon {
  font-size: 1.1rem;
  opacity: 0.8;
}

.elegant-input {
  padding: 0.875rem 1rem;
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 10px;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  background: rgba(15, 23, 42, 0.8);
  color: #e2e8f0;
  font-family: 'Inter', sans-serif;
  backdrop-filter: blur(10px);
}

.elegant-input:focus {
  outline: none;
  border-color: #ec4899;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2);
  background: rgba(15, 23, 42, 0.9);
  transform: translateY(-1px);
}

.elegant-input:hover {
  border-color: rgba(239, 68, 68, 0.5);
}

.elegant-input::placeholder {
  color: #64748b;
}

.filters-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(239, 68, 68, 0.1);
}

.elegant-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1.75rem;
  border: none;
  border-radius: 10px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-family: 'Inter', sans-serif;
  font-size: 0.95rem;
}

.elegant-button:not(.secondary) {
  background: linear-gradient(135deg, #ec4899, #db2777);
  color: white;
  box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3);
}

.elegant-button:not(.secondary):hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(239, 68, 68, 0.4);
  background: linear-gradient(135deg, #db2777, #be185d);
}

.elegant-button.secondary {
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #e2e8f0;
}

.elegant-button.secondary:hover {
  border-color: #ec4899;
  background: rgba(239, 68, 68, 0.2);
  transform: translateY(-2px);
}

.btn-icon {
  font-size: 1.1rem;
}

.filters-slide-enter-active,
.filters-slide-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  max-height: 500px;
  overflow: hidden;
}

.filters-slide-enter-from,
.filters-slide-leave-to {
  max-height: 0;
  opacity: 0;
  transform: translateY(-10px);
}

@media (max-width: 768px) {
  .filters-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .filter-row {
    grid-template-columns: 1fr;
  }
  
  .filters-actions {
    flex-direction: column;
  }
  
  .header-content {
    text-align: center;
    justify-content: center;
  }
}

:deep(.filter-group) {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

:deep(.filter-group label) {
  font-weight: 600;
  color: #e2e8f0 !important;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

:deep(.animated-input) {
  padding: 0.875rem 1rem;
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 10px;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  background: rgba(15, 23, 42, 0.8);
  color: #e2e8f0;
  font-family: 'Inter', sans-serif;
  backdrop-filter: blur(10px);
}

:deep(.animated-input:focus) {
  outline: none;
  border-color: #ec4899;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2);
  background: rgba(15, 23, 42, 0.9);
  transform: translateY(-1px);
}

:deep(.animated-input:hover) {
  border-color: rgba(239, 68, 68, 0.5);
}

:deep(.animated-input::placeholder) {
  color: #64748b;
}
</style>
