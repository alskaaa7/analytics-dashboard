<template>
    <div class="chart-container">
      <canvas ref="chartCanvas"></canvas>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, watch } from 'vue'
  import { Chart, registerables } from 'chart.js'
  
  Chart.register(...registerables)
  
  const props = defineProps({
    chartData: Object
  })
  
  const chartCanvas = ref(null)
  let chart = null
  
  watch(() => props.chartData, (newData) => {
    if (chart && newData) {
      chart.data = newData
      chart.update()
    }
  })
  
  onMounted(() => {
    if (chartCanvas.value && props.chartData) {
      chart = new Chart(chartCanvas.value, {
        type: 'doughnut',
        data: props.chartData,
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'bottom',
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const label = context.label || '';
                  const value = context.raw || 0;
                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                  const percentage = Math.round((value / total) * 100);
                  return `${label}: ${value} (${percentage}%)`;
                }
              }
            }
          }
        }
      })
    }
  })
  </script>
  
  <style scoped>
  .chart-container {
    position: relative;
    height: 300px;
    width: 100%;
  }
  </style>