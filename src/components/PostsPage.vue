<!-- src/views/PostsPage.vue -->

<template>
  <div class="posts-page">
    <h2>All Posts</h2>
    <div v-if="loading" class="loading">Loading...</div>
    <div v-if="error" class="error">{{ error }}</div>
    <div v-if="posts.length === 0 && !loading" class="no-posts">No posts available.</div>
    <ul v-if="posts.length > 0">
      <li v-for="post in posts" :key="post.id" class="post-item">
        <router-link :to="{ name: 'PostDetailsPage', params: { slug: post.slug } }">{{
          post.title
        }}</router-link>
        <span v-if="post.belongs_to_user" class="actions">
          <router-link :to="{ name: 'EditPost', params: { slug: post.slug } }" class="edit"
            >Edit</router-link
          >
          <button @click="deletePost(post.id)" class="delete">Delete</button>
        </span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

const posts = ref([])
const loading = ref(false)
const error = ref('')
const router = useRouter()

const fetchPosts = async () => {
  loading.value = true
  error.value = ''
  try {
    const token = localStorage.getItem('token')
    if (!token) {
      alert('You must be logged in to access this page.')
      router.push('/login')
      return
    }
    const response = await axios.get('https://interns-blog.nafistech.com/api/posts', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    if (response.status === 200) {
      posts.value = response.data
    } else {
      error.value = `Error: ${response.statusText}`
    }
  } catch (err) {
    error.value = `Failed to load posts: ${err.message}`
    console.error(err)
  } finally {
    loading.value = false
  }
}

const deletePost = async (id: number) => {
  const token = localStorage.getItem('token')
  try {
    await axios.delete(`https://interns-blog.nafistech.com/api/posts/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    posts.value = posts.value.filter((post: any) => post.id !== id)
    alert('Post deleted successfully.')
  } catch (err) {
    alert('Failed to delete the post.')
    console.error(err)
  }
}

onMounted(fetchPosts)
</script>

<style scoped>
.posts-page {
  padding: 20px;
  background-color: #add8e6;
  min-height: 100vh;
}

.loading {
  color: #fff;
}

.error {
  color: red;
}

.no-posts {
  color: #fff;
}

ul {
  list-style-type: none;
  padding: 0;
}

.post-item {
  padding: 10px;
  background-color: #fff;
  margin-bottom: 10px;
  border-radius: 5px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.actions {
  display: flex;
  gap: 10px;
}

.edit,
.delete {
  background-color: #add8e6;
  color: #fff;
  border: none;
  padding: 5px 10px;
  border-radius: 5px;
  cursor: pointer;
}

.edit:hover {
  background-color: #87ceeb;
}

.delete:hover {
  background-color: #ff6961;
}
</style>
