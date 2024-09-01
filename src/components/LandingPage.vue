<!-- src/views/LandingPage.vue -->

<template>
  <div class="landing-page">
    <h1>Welcome to the Blog</h1>
    <p>Explore and share your thoughts with the world.</p>
    <div class="buttons">
      <router-link to="/login" class="button">Login</router-link>
      <router-link to="/register" class="button">Register</router-link>
      <button v-if="isAuthenticated" @click="logout" class="button">Logout</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const isAuthenticated = ref(!!localStorage.getItem('token'))

const logout = () => {
  localStorage.removeItem('token')
  isAuthenticated.value = false
  router.push('/')
}
</script>

<style scoped>
.landing-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background-image: url('@/assets/img.jpeg');
  background-size: cover;
  background-position: center;
  color: #fff;
  text-align: center;
}

h1 {
  font-size: 3rem;
  margin-bottom: 20px;
}

p {
  font-size: 1.5rem;
  margin-bottom: 40px;
}

.buttons {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.button {
  padding: 15px 30px;
  background-color: #fff;
  color: #add8e6;
  border: none;
  border-radius: 8px;
  text-decoration: none;
  font-weight: bold;
  cursor: pointer;
  transition:
    background-color 0.3s,
    color 0.3s;
}

.button:hover {
  background-color: #87ceeb;
  color: #fff;
}
</style>
