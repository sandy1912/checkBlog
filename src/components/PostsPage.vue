<template>
  <div class="posts-page">
    <!-- Purple Authentic Image at the top -->
    <div class="authentic-image-container">
      <img :src="purpleAuthenticImage" alt="Purple Authentic" class="purple-authentic-image" />
    </div>

    <!-- All Posts Title -->
    <h2>All Posts</h2>

    <!-- Create Post Form -->
    <div class="create-post-form">
      <input v-model="newPostTitle" placeholder="Post title..." />
      <textarea v-model="newPostContent" placeholder="Post content..."></textarea>
      <input type="file" @change="handleImageUpload" />
      <button @click="createPost">Create Post</button>
    </div>

    <!-- Search bar -->
    <div class="search-bar">
      <input v-model="searchQuery" placeholder="Search posts..." />
    </div>

    <!-- Sort Buttons -->
    <div class="sort-buttons">
      <button @click="sortPosts('asc')">⬆ Sort Ascending</button>
      <button @click="sortPosts('desc')">⬇ Sort Descending</button>
    </div>

    <!-- Pagination Controls -->
    <div class="pagination-controls" v-if="totalPages > 1">
      <button @click="goToPage(currentPage - 1)" :disabled="currentPage === 1">Previous</button>
      <span>Page {{ currentPage }} of {{ totalPages }}</span>
      <button @click="goToPage(currentPage + 1)" :disabled="currentPage === totalPages">
        Next
      </button>
    </div>

    <!-- Loading, Error, and No Posts Message -->
    <div v-if="loading" class="loading">Loading...</div>
    <div v-if="error" class="error">{{ error }}</div>
    <div v-if="filteredPosts.length === 0 && !loading" class="no-posts">No posts available.</div>

    <!-- List of Posts -->
    <ul v-if="filteredPosts.length > 0">
      <li v-for="post in paginatedPosts" :key="post.id" class="post-item">
        <img :src="post.image || authenticImage" alt="Post Image" class="post-image" />
        <div class="post-details">
          <router-link :to="{ name: 'PostDetailsPage', params: { slug: post.slug } }">
            {{ post.title }}
          </router-link>
          <p>{{ post.comments_count || 0 }} Comments</p>
          <p v-if="post.last_comment">
            <strong>Last Comment:</strong> {{ post.last_comment.content }}
          </p>
          <p><strong>Date:</strong> {{ new Date(post.created_at).toLocaleDateString() }}</p>
          <div v-if="post.belongs_to_user" class="actions">
            <router-link :to="{ name: 'EditPost', params: { slug: post.slug } }" class="edit"
              >Edit</router-link
            >
            <button @click="deletePost(post.id)" class="delete">Delete</button>
          </div>
        </div>
      </li>
    </ul>

    <!-- Pagination Controls (bottom) -->
    <div class="pagination-controls" v-if="totalPages > 1">
      <button @click="goToPage(currentPage - 1)" :disabled="currentPage === 1">Previous</button>
      <span>Page {{ currentPage }} of {{ totalPages }}</span>
      <button @click="goToPage(currentPage + 1)" :disabled="currentPage === totalPages">
        Next
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

// Import images
import authenticImage from '@/assets/blue-img.jpeg'
import purpleAuthenticImage from '@/assets/purple-img.jpeg'

interface Post {
  id: number
  title: string
  content: string
  created_at: string
  updated_at: string
  slug: string
  comments_count: number
  last_comment: Comment | null
  belongs_to_user: boolean
  image: string
}

interface Comment {
  id: number
  content: string
  created_at: string
}

const posts = ref<Post[]>([])
const loading = ref(false)
const error = ref('')
const router = useRouter()
const searchQuery = ref('')
const currentPage = ref(1)
const itemsPerPage = 5
const sortOrder = ref<'asc' | 'desc'>('desc')

const newPostTitle = ref('')
const newPostContent = ref('')
const newPostImage = ref<File | null>(null)

// Fetch posts
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
      posts.value = response.data.data
      sortPosts(sortOrder.value) // Sort posts by default order (descending)
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

// Create new post
const createPost = async () => {
  if (!newPostTitle.value || !newPostContent.value) {
    alert('Title and content are required.')
    return
  }

  const token = localStorage.getItem('token')
  const formData = new FormData()
  formData.append('title', newPostTitle.value)
  formData.append('content', newPostContent.value)
  if (newPostImage.value) {
    formData.append('image', newPostImage.value)
  }

  try {
    const response = await axios.post('https://interns-blog.nafistech.com/api/posts', formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    })
    if (response.status === 201) {
      posts.value.unshift(response.data.data) // Add new post to the top
      newPostTitle.value = ''
      newPostContent.value = ''
      newPostImage.value = null
      alert('Post created successfully.')
    } else {
      alert('Failed to create the post.')
    }
  } catch (err) {
    alert('Failed to create the post.')
    console.error(err)
  }
}

const handleImageUpload = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files && input.files.length > 0) {
    newPostImage.value = input.files[0]
  }
}

// Sort posts based on the selected order
const sortPosts = (order: 'asc' | 'desc') => {
  sortOrder.value = order
  posts.value.sort((a: Post, b: Post) => {
    const dateA = new Date(a.created_at).getTime()
    const dateB = new Date(b.created_at).getTime()
    return order === 'asc' ? dateA - dateB : dateB - dateA
  })
}

// Filter posts based on search query
const filteredPosts = computed(() => {
  return posts.value.filter((post) =>
    post.title.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

// Paginated posts
const paginatedPosts = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredPosts.value.slice(start, end)
})

// Total pages
const totalPages = computed(() => Math.ceil(filteredPosts.value.length / itemsPerPage))

// Go to specific page
const goToPage = (page: number) => {
  if (page > 0 && page <= totalPages.value) {
    currentPage.value = page
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
    posts.value = posts.value.filter((post: Post) => post.id !== id)
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
  background: linear-gradient(to right, #9370db, #add8e6); /* Purple and blue gradient */
  min-height: 100vh;
  font-family: Arial, sans-serif;
}

.authentic-image-container {
  display: flex;
  justify-content: center;
  margin: 20px 0; /* Adjust margin as needed */
}

.purple-authentic-image {
  width: 200px; /* Adjust width as needed */
  height: 200px; /* Adjust height as needed */
  border-radius: 50%; /* Optional: Make it a circle */
  object-fit: cover;
}

h2 {
  color: #4b0082; /* Dark purple */
  text-align: center;
  font-size: 28px;
  margin-bottom: 20px;
}

.create-post-form,
.search-bar {
  margin-bottom: 20px;
  text-align: center;
}

.create-post-form input,
.create-post-form textarea {
  display: block;
  width: 100%;
  padding: 10px;
  margin-bottom: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
}

.create-post-form button {
  padding: 10px 20px;
  background-color: #9370db; /* Medium purple */
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.create-post-form button:hover {
  background-color: #6a5acd; /* Slate blue */
}

.sort-buttons {
  text-align: center;
  margin-bottom: 20px;
}

.sort-buttons button {
  padding: 10px 20px;
  background-color: #9370db; /* Medium purple */
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  margin-right: 10px;
}

.sort-buttons button:hover {
  background-color: #6a5acd; /* Slate blue */
}

.pagination-controls {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.pagination-controls button {
  padding: 10px;
  margin: 0 5px;
  background-color: #9370db; /* Medium purple */
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.pagination-controls button:disabled {
  background-color: #ddd;
  cursor: not-allowed;
}

.loading,
.error,
.no-posts {
  text-align: center;
  margin-top: 20px;
}

ul {
  list-style: none;
  padding: 0;
}

.post-item {
  display: flex;
  align-items: center;
  background-color: white;
  padding: 15px;
  margin-bottom: 10px;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.post-image {
  width: 100px;
  height: 100px;
  border-radius: 10px;
  object-fit: cover;
  margin-right: 15px;
}

.post-details {
  flex: 1;
}

.post-details p {
  margin: 5px 0;
}

.actions {
  margin-top: 10px;
}

.actions .edit,
.actions .delete {
  margin-right: 10px;
  cursor: pointer;
  color: #9370db; /* Medium purple */
}

.actions .edit:hover,
.actions .delete:hover {
  text-decoration: underline;
}
</style>
