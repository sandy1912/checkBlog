<template>
  <div class="post-details-page">
    <div v-if="loading" class="loading">Loading...</div>
    <div v-if="error" class="error">{{ error }}</div>
    <div v-if="post">
      <div v-if="isEditing" class="edit-post-form">
        <h2>Edit Post</h2>
        <form @submit.prevent="updatePost">
          <div class="form-group">
            <label for="edit-title">Title:</label>
            <input v-model="post.title" id="edit-title" type="text" required />
          </div>
          <div class="form-group">
            <label for="edit-content">Content:</label>
            <textarea v-model="post.content" id="edit-content" required></textarea>
          </div>
          <button type="submit" class="button update-button">Update Post</button>
          <button type="button" @click="cancelEdit" class="button cancel-button">Cancel</button>
        </form>
      </div>

      <div v-else class="post-view">
        <h2>{{ post.title }}</h2>
        <p><strong>Content:</strong> {{ post.content }}</p>
        <p><strong>Author:</strong> {{ post.user.name }}</p>
        <p><strong>Post ID:</strong> {{ post.id }}</p>
        <p><strong>Slug:</strong> {{ post.slug }}</p>

        <div v-if="isPostOwner" class="actions">
          <button @click="startEdit" class="button edit-button">
            <i class="fas fa-edit"></i> Edit Post
          </button>
          <button @click="deletePost(post.id)" class="button delete-button">
            <i class="fas fa-trash"></i> Delete Post
          </button>
        </div>
      </div>

      <div class="comments-section">
        <h3>Comments</h3>
        <div v-if="post.comments.length === 0" class="no-comments">No comments available</div>
        <div v-for="comment in post.comments" :key="comment.id" class="comment">
          <p>
            <strong>{{ comment.user.name }}:</strong> {{ comment.content }}
          </p>
          <div v-if="isCommentOwner(comment.user.id)" class="comment-actions">
            <button @click="editComment(comment.id)" class="button edit-comment-button">
              <i class="fas fa-edit"></i> Edit Comment
            </button>
            <button @click="deleteComment(comment.id)" class="button delete-comment-button">
              <i class="fas fa-trash"></i> Delete Comment
            </button>
          </div>
        </div>
        <div v-if="isPostOwner" class="add-comment">
          <textarea v-model="newComment" placeholder="Add a comment..." rows="3"></textarea>
          <button @click="addComment" class="button add-comment-button">
            <i class="fas fa-plus"></i> Add Comment
          </button>
        </div>
      </div>
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
const isEditing = ref(false)
const token = localStorage.getItem('token')
const newComment = ref('')

const apiBaseUrl = 'https://interns-blog.nafistech.com/api'

const fetchPostDetails = async () => {
  try {
    if (!token) {
      alert('You must be logged in to access this page.')
      router.push('/login')
      return
    }
    const response = await axios.get(`${apiBaseUrl}/posts/${route.params.slug}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    if (response.status === 200) {
      post.value = response.data
    } else {
      error.value = `Error: ${response.statusText}`
    }
  } catch (err) {
    error.value = `Failed to load post details: ${err.message}`
    console.error('Fetch Post Details Error:', err)
  } finally {
    loading.value = false
  }
}

const updatePost = async () => {
  try {
    const response = await axios.put(
      `${apiBaseUrl}/posts/${post.value.slug}`,
      {
        title: post.value.title,
        content: post.value.content
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    )
    if (response.status === 200) {
      alert('Post updated successfully.')
      isEditing.value = false
    } else {
      alert('Failed to update the post.')
    }
  } catch (err) {
    alert('Failed to update the post.')
    console.error('Update Post Error:', err)
  }
}

const startEdit = () => {
  isEditing.value = true
}

const cancelEdit = () => {
  isEditing.value = false
  fetchPostDetails() // Reload post to discard unsaved changes
}

const deletePost = async (id: number) => {
  try {
    const response = await axios.delete(`${apiBaseUrl}/posts/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    if (response.status === 200) {
      alert('Post deleted successfully.')
      router.push('/posts')
    } else {
      alert('Failed to delete the post.')
    }
  } catch (err) {
    alert('Failed to delete the post.')
    console.error('Delete Post Error:', err)
  }
}

const deleteComment = async (id: number) => {
  try {
    const response = await axios.delete(`${apiBaseUrl}/comments/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    if (response.status === 200) {
      alert('Comment deleted successfully.')
      fetchPostDetails() // Refresh comments
    } else {
      alert('Failed to delete the comment.')
    }
  } catch (err) {
    alert('Failed to delete the comment.')
    console.error('Delete Comment Error:', err)
  }
}

const addComment = async () => {
  if (!newComment.value.trim()) {
    alert('Comment cannot be empty.')
    return
  }
  try {
    const response = await axios.post(
      `${apiBaseUrl}/posts/${route.params.slug}/comments`,
      {
        content: newComment.value
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    )
    if (response.status === 201) {
      alert('Comment added successfully.')
      newComment.value = ''
      fetchPostDetails() // Refresh comments
    } else {
      alert('Failed to add comment.')
      console.error('Unexpected response status:', response.status, response.statusText)
    }
  } catch (err) {
    const errorMsg = err.response
      ? `Error ${err.response.status}: ${err.response.data.message || err.response.data}`
      : `Error: ${err.message}`
    alert('Failed to add comment.')
    console.error('Add Comment Error:', errorMsg)
  }
}

const isPostOwner = () => {
  const currentUserId = JSON.parse(localStorage.getItem('user') || '{}').id
  return post.value && post.value.user.id === currentUserId
}

const isCommentOwner = (commentUserId: number) => {
  const currentUserId = JSON.parse(localStorage.getItem('user') || '{}').id
  return commentUserId === currentUserId
}

onMounted(fetchPostDetails)
</script>

<style scoped>
.post-details-page {
  background-color: #e0f7fa; /* Light baby blue background */
  color: #00796b; /* Darker blue text color */
  padding: 20px;
  font-family: Arial, sans-serif;
}

.loading {
  font-size: 1.5rem;
  color: #00796b;
}

.error {
  color: red;
  font-size: 1.125rem;
}

.post-view,
.edit-post-form,
.comments-section {
  background-color: #ffffff;
  border-radius: 10px;
  padding: 20px;
  margin: 20px 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.edit-post-form h2,
.comments-section h3 {
  color: #00796b;
}

.form-group {
  margin-bottom: 15px;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

input,
textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #00796b;
  border-radius: 5px;
}

textarea {
  resize: vertical;
}

.button {
  background-color: #00796b;
  color: #ffffff;
  padding: 10px 15px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.button:hover {
  background-color: #004d40;
}

.update-button {
  background-color: #004d40;
}

.cancel-button {
  background-color: #b2dfdb;
}

.delete-button {
  background-color: #e57373;
}

.edit-button,
.delete-comment-button,
.add-comment-button {
  background-color: #4fc3f7;
}

.comment-actions,
.add-comment {
  margin-top: 20px;
}

.no-comments {
  font-style: italic;
  color: #00796b;
}

.comment {
  margin-bottom: 15px;
}

.comment-actions button {
  margin-right: 5px;
}
</style>
