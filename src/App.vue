<template>
  <div id="app">
    <nav class="navbar">
      <router-link to="/sales" class="nav-link">Продажи</router-link>
      <router-link to="/orders" class="nav-link">Заказы</router-link>
      <router-link to="/stocks" class="nav-link">Склады</router-link>
      <router-link to="/incomes" class="nav-link">Доходы</router-link>
    </nav>
    
    <main class="main-content">
      <router-view></router-view>
    </main>
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: #f5f5f5;
}

#app {
  min-height: 100vh;
}

.navbar {
  background: #2c3e50;
  padding: 1rem;
  display: flex;
  gap: 2rem;
  justify-content: center;
}

.nav-link {
  color: white;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.nav-link:hover,
.nav-link.router-link-active {
  background-color: #34495e;
}

.main-content {
  padding: 0;
}
</style>