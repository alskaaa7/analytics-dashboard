<template>
    <div class="column-selector">
      <button @click="showSelector = !showSelector" class="selector-toggle">
        🗂️ Выбор колонок
      </button>
      
      <div v-if="showSelector" class="selector-popup">
        <div class="selector-header">
          <h4>Выберите колонки для отображения</h4>
          <button @click="selectAll">Все</button>
          <button @click="deselectAll">Ничего</button>
        </div>
        <div class="selector-list">
          <label v-for="column in allColumns" :key="column.key" class="checkbox-item">
            <input
              type="checkbox"
              :checked="visibleColumns.includes(column.key)"
              @change="toggleColumn(column.key)"
            />
            {{ column.title }}
          </label>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, watch } from 'vue'
  
  const props = defineProps({
    allColumns: {
      type: Array,
      required: true
    },
    modelValue: {
      type: Array,
      required: true
    }
  })
  
  const emit = defineEmits(['update:modelValue'])
  
  const showSelector = ref(false)
  const visibleColumns = ref([...props.modelValue])
  
  const toggleColumn = (columnKey) => {
    const index = visibleColumns.value.indexOf(columnKey)
    if (index > -1) {
      visibleColumns.value.splice(index, 1)
    } else {
      visibleColumns.value.push(columnKey)
    }
    emit('update:modelValue', [...visibleColumns.value])
  }
  
  const selectAll = () => {
    visibleColumns.value = props.allColumns.map(col => col.key)
    emit('update:modelValue', [...visibleColumns.value])
  }
  
  const deselectAll = () => {
    visibleColumns.value = []
    emit('update:modelValue', [])
  }
  
  watch(() => props.modelValue, (newValue) => {
    visibleColumns.value = [...newValue]
  })
  </script>
  
  <style scoped>
  .column-selector {
    position: relative;
    display: inline-block;
  }
  
  .selector-toggle {
    background: #007bff;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.875rem;
  }
  
  .selector-popup {
    position: absolute;
    top: 100%;
    left: 0;
    background: white;
    border: 1px solid #ddd;
    border-radius: 4px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    z-index: 1000;
    min-width: 250px;
    max-height: 400px;
    overflow-y: auto;
  }
  
  .selector-header {
    padding: 1rem;
    border-bottom: 1px solid #eee;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  
  .selector-header h4 {
    margin: 0;
    font-size: 0.875rem;
  }
  
  .selector-header button {
    background: #6c757d;
    color: white;
    border: none;
    padding: 0.25rem 0.5rem;
    border-radius: 3px;
    cursor: pointer;
    font-size: 0.75rem;
  }
  
  .selector-list {
    padding: 0.5rem;
  }
  
  .checkbox-item {
    display: flex;
    align-items: center;
    padding: 0.25rem 0;
    cursor: pointer;
    font-size: 0.8rem;
  }
  
  .checkbox-item input {
    margin-right: 0.5rem;
  }
  </style>