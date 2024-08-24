// src/router/index.ts

import { createRouter, createWebHistory } from 'vue-router'
import LandingPage from '../components/LandingPage.vue'
import LoginPage from '../components/LoginPage.vue'
import RegistrationPage from '../components/RegistrationPage.vue'
import PostsPage from '../components/PostsPage.vue'
import PostDetailsPage from '../components/PostDetailsPage.vue'
import EditPost from '../components/EditPost.vue'

const routes = [
  { path: '/', name: 'LandingPage', component: LandingPage },
  { path: '/login', name: 'LoginPage', component: LoginPage },
  { path: '/register', name: 'RegistrationPage', component: RegistrationPage },
  { path: '/posts', name: 'PostsPage', component: PostsPage },
  { path: '/posts/:slug', name: 'PostDetailsPage', component: PostDetailsPage, props: true },
  { path: '/posts/:slug/edit', name: 'EditPost', component: EditPost, props: true }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
