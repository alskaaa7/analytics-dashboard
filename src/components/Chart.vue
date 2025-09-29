<template>
    <div class="chart-container">
      <canvas ref="chartCanvas"></canvas>
    </div>
</template>
  
  <script setup>
  import { ref, onMounted, watch, onUnmounted } from 'vue'
  import { Chart, registerables } from 'chart.js'
  
  Chart.register(...registerables)
  
  const props = defineProps({
    data: {
      type: Array,
      default: () => []
    },
    chartConfig: {
      type: Object,
      required: true
    }
  })
  
  const chartCanvas = ref(null)
  let chartInstance = null
  
  const renderChart = () => {
    if (chartInstance) {
      chartInstance.destroy()
    }
  
    if (!chartCanvas.value || !props.data.length) return
  
    const { labels, datasets } = props.chartConfig.getChartData(props.data)
  
    chartInstance = new Chart(chartCanvas.value, {
      type: 'line',
      data: {
        labels,
        datasets
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: props.chartConfig.title
          }
        }
      }
    })
  }
  
  onMounted(renderChart)
  watch(() => props.data, renderChart)
  onUnmounted(() => {
    if (chartInstance) {
      chartInstance.destroy()
    }
  })
  </script>
  
  <style scoped>
  .chart-container {
    height: 400px;
    margin: 2rem 0;
  }
  </style>