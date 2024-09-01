<template>
  <div class="post-details-page">
    <div v-if="loading" class="loading">Loading...</div>
    <div v-if="error" class="error">{{ error }}</div>
    <div v-if="post">
      <!-- Post Image -->
      <img src="../assets/thumbnail.jpeg" alt="Post Thumbnail" class="post-image" />

      <!-- Edit Post Form -->
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

      <!-- Post View -->
      <div v-else class="post-view">
        <h2>{{ post.title }}</h2>
        <p><strong>Content:</strong> {{ post.content }}</p>
        <p><strong>Author:</strong> {{ post.user.name }}</p>
        <p><strong>Post ID:</strong> {{ post.id }}</p>
        <p><strong>Slug:</strong> {{ post.slug }}</p>

        <!-- Only show edit/delete buttons to post owner -->
        <div v-if="isPostOwner()" class="actions">
          <button @click="startEdit" class="button edit-button">
            <i class="fas fa-edit"></i> Edit Post
          </button>
          <button @click="deletePost(post.id)" class="button delete-button">
            <i class="fas fa-trash"></i> Delete Post
          </button>
        </div>
      </div>

      <!-- Comments Section -->
      <div class="comments-section">
        <h3>Comments</h3>
        <div v-if="post.comments.length === 0" class="no-comments">No comments available</div>
        <div v-for="comment in post.comments" :key="comment.id" class="comment">
          <p>
            <strong>{{ comment.user.name }}:</strong>
            <span v-if="commentToEdit !== comment.id">{{ comment.content }}</span>
            <span v-else>
              <textarea v-model="editedCommentContent" rows="2" required></textarea>
            </span>
          </p>
          <!-- Only show edit/delete buttons to comment owner -->
          <div v-if="isCommentOwner(comment.user.id)">
            <button
              v-if="commentToEdit !== comment.id"
              @click="editComment(comment.id)"
              class="button edit-comment-button"
            >
              <i class="fas fa-edit"></i> Edit Comment
            </button>
            <button
              v-if="commentToEdit === comment.id"
              @click="updateComment"
              class="button update-comment-button"
            >
              <i class="fas fa-check"></i> Save Changes
            </button>
            <button
              v-if="commentToEdit === comment.id"
              @click="cancelEditComment"
              class="button cancel-edit-comment-button"
            >
              <i class="fas fa-times"></i> Cancel
            </button>
            <button
              v-if="commentToEdit !== comment.id"
              @click="deleteComment(comment.id)"
              class="button delete-comment-button"
            >
              <i class="fas fa-trash"></i> Delete Comment
            </button>
          </div>
        </div>
        <!-- Add Comment Field -->
        <div class="add-comment">
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
const commentToEdit = ref<number | null>(null)
const editedCommentContent = ref('')

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
      post.value = response.data.data
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
      `${apiBaseUrl}/posts/${post.value.id}`,
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
      `${apiBaseUrl}/posts/${post.value.id}/comments`,
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

const editComment = (commentId: number) => {
  const comment = post.value.comments.find((c: any) => c.id === commentId)
  if (comment) {
    commentToEdit.value = commentId
    editedCommentContent.value = comment.content
  }
}

const updateComment = async () => {
  if (!editedCommentContent.value.trim()) {
    alert('Comment cannot be empty.')
    return
  }
  try {
    const response = await axios.put(
      `${apiBaseUrl}/comments/${commentToEdit.value}`,
      {
        content: editedCommentContent.value
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    )
    if (response.status === 200) {
      alert('Comment updated successfully.')
      commentToEdit.value = null
      editedCommentContent.value = ''
      fetchPostDetails() // Refresh comments
    } else {
      alert('Failed to update comment.')
      console.error('Unexpected response status:', response.status, response.statusText)
    }
  } catch (err) {
    const errorMsg = err.response
      ? `Error ${err.response.status}: ${err.response.data.message || err.response.data}`
      : `Error: ${err.message}`
    alert('Failed to update comment.')
    console.error('Update Comment Error:', errorMsg)
  }
}

const cancelEditComment = () => {
  commentToEdit.value = null
  editedCommentContent.value = ''
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
  color: #5a2a8f; /* Dark purple text color */
  padding: 20px;
  font-family: Arial, sans-serif;
  text-align: center; /* Center align the content */
}

.loading {
  font-size: 1.5rem;
  color: #5a2a8f;
}

.error {
  color: red;
  font-size: 1.125rem;
}

.post-image {
  max-width: 300px; /* Adjust the size as needed */
  height: auto; /* Maintain aspect ratio */
  border-radius: 10px;
  margin: 0 auto; /* Center the image horizontally */
  display: block; /* Make the image a block element */
}

.post-view,
.edit-post-form,
.comments-section {
  background-color: #ffffff;
  border-radius: 10px;
  padding: 20px;
  margin: 20px auto; /* Center the sections horizontally */
  max-width: 800px; /* Limit the width of the sections */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.edit-post-form,
.comments-section {
  background-color: #f3e5f5; /* Light purple background for the forms */
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.5rem;
  border-radius: 5px;
  border: 1px solid #ddd;
}

button.button {
  background-color: #ab47bc; /* Purple button */
  color: #fff;
  border: none;
  border-radius: 5px;
  padding: 10px 20px;
  cursor: pointer;
  font-size: 1rem;
  margin-right: 10px;
}

button.button:hover {
  background-color: #8e24aa; /* Darker purple on hover */
}

.add-comment textarea {
  width: calc(100% - 22px); /* Adjust for padding and button */
  padding: 10px;
  margin-bottom: 10px;
  border-radius: 5px;
  border: 1px solid #ddd;
}

.comment-actions,
.actions {
  margin-top: 10px;
}

.comment-actions button,
.actions button {
  background-color: #d32f2f; /* Red button for delete actions */
}

.comment-actions button:hover,
.actions button:hover {
  background-color: #b71c1c; /* Darker red on hover */
}

.no-comments {
  font-style: italic;
}
</style>
