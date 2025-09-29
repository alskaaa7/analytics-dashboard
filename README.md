# wb-api-app

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```

---

# Analytics Dashboard

Веб-приложение для анализа и визуализации данных с интуитивно понятным интерфейсом и адаптивной версткой.

## О проекте

Панель управления для мониторинга ключевых метрик бизнеса с помощью интерактивных графиков и диаграмм. Позволяет отслеживать продажи, анализировать эффективность и принимать data-driven решения.

## Особенности

- **Интерактивные графики** - динамические диаграммы с использованием Chart.js
- **Адаптивный дизайн** - оптимизирован для desktop и mobile устройств
- **Фильтрация данных** - гибкие инструменты для анализа данных
- **Быстрый отклик** - построено на современном стеке Vue 3 + Vite
- **Real-time данные** - подключение к внешнему API для актуальной информации

## Технологии

**Frontend:**

- [Vue 3](https://vuejs.org/) - Прогрессивный JavaScript фреймворк
- [Vite](https://vitejs.dev/) - Быстрая сборка и разработка
- [Chart.js](https://www.chartjs.org/) - Визуализация данных
- [Vue Router](https://router.vuejs.org/) - Навигация между страницами

**Backend:**

- RESTful API для получения данных
- JSON формат обмена данными

## Установка и запуск

### Предварительные требования

- Node.js (версия 16 или выше)
- npm или yarn

### Локальная разработка

1. **Клонирование репозитория**

```bash
git clone https://github.com/alskaaa7/analytics-dashboard.git
cd analytics-dashboard

## Установка зависимостей
npm install

## Запуск в режиме разработки
## Приложение будет доступно по адресу: http://localhost:3000

## Сборка для продакшн
npm run build

## Превью сборки
npm run preview

## Использование


##  Основные страницы:
 - Дашборд - Обзор ключевых метрик

 - Продажи - Анализ продаж и выручки

 - Продукты - Статистика по товарам

 - Аналитика - Детальная аналитика и отчеты

##  Функциональность:
 - Просмотр данных в табличном формате

 - Интерактивные графики с возможностью масштабирования

 - Фильтрация по датам, категориям и другим параметрам

 - Экспорт данных в различных форматах

## Деплой
- Проект задеплоен на Netlify и доступен по адресу:
https://analyticsdatabase.netlify.app

## Структура проекта
analytics-dashboard/
├── src/
│   ├── components/     # Переиспользуемые компоненты
│   ├── views/          # Страницы приложения
│   ├── composables/    # Композаблы Vue 3 (логика API)
│   ├── assets/         # Статические ресурсы
│   └── main.js         # Точка входа
├── public/             # Публичные файлы
├── package.json        # Зависимости и скрипты
└── vite.config.js      # Конфигурация Vite

## Автор
 - GitHub: @alskaaa7
```
