<template>
  <div class="edit-post-page">
    <div v-if="loading" class="loading">Loading...</div>
    <div v-if="error" class="error">{{ error }}</div>
    <div v-if="post">
      <h2>Edit Post</h2>
      <form @submit.prevent="updatePost">
        <div class="form-group">
          <label for="title">Title:</label>
          <input v-model="post.title" id="title" type="text" required />
        </div>
        <div class="form-group">
          <label for="content">Content:</label>
          <textarea v-model="post.content" id="content" required></textarea>
        </div>
        <button type="submit" class="button">Update Post</button>
        <button @click="deletePost" class="button delete-button">Delete Post</button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'

const route = useRoute()
const router = useRouter()
const post = ref<any>(null)
const loading = ref(true)
const error = ref('')
const token = localStorage.getItem('token')

const fetchPost = async () => {
  try {
    const response = await axios.get(
      `https://interns-blog.nafistech.com/api/posts/${route.params.slug}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )
    if (response.status === 200) {
      post.value = response.data
    } else {
      error.value = `Error: ${response.statusText}`
    }
  } catch (err) {
    error.value = `Failed to load post: ${err.message}`
    console.error(err)
  } finally {
    loading.value = false
  }
}

const updatePost = async () => {
  try {
    await axios.put(`https://interns-blog.nafistech.com/api/posts/${post.value.id}`, post.value, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    alert('Post updated successfully.')
    router.push(`/posts/${post.value.slug}`)
  } catch (err) {
    alert('Failed to update the post.')
    console.error(err)
  }
}

const deletePost = async () => {
  try {
    await axios.delete(`https://interns-blog.nafistech.com/api/posts/${post.value.id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    alert('Post deleted successfully.')
    router.push('/posts') // Redirect to posts list
  } catch (err) {
    alert('Failed to delete the post.')
    console.error(err)
  }
}

onMounted(fetchPost)
</script>

<style scoped>
.edit-post-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  background-color: #add8e6;
  min-height: 100vh;
  color: #fff;
  max-width: 800px;
  margin: 0 auto;
}

h2 {
  font-size: 2rem;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 15px;
}

label {
  display: block;
  font-size: 1.25rem;
  margin-bottom: 5px;
}

input,
textarea {
  width: 100%;
  padding: 10px;
  border-radius: 5px;
  border: 1px solid #ccc;
}

button {
  padding: 10px 20px;
  background-color: #fff;
  color: #add8e6;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition:
    background-color 0.3s,
    color 0.3s;
}

button:hover {
  background-color: #87ceeb;
  color: #fff;
}

.delete-button {
  background-color: #ff6f6f;
}

.delete-button:hover {
  background-color: #ff4d4d;
}

.loading,
.error {
  font-size: 1rem;
}

.error {
  color: red;
}
</style>
