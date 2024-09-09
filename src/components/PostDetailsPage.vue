<template>
  <div class="post-details-page">
    <div v-if="loading" class="loading">Loading...</div>
    <div v-if="error" class="error">{{ error }}</div>
    <div v-if="post">
      <!-- Post Image -->
      <img
        :src="post.image || '../assets/thumbnail.jpeg'"
        alt="Post Thumbnail"
        class="post-image"
      />

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
        <p><strong>Comments Count:</strong> {{ post.comments_count }}</p>
        <p><strong>Created At:</strong> {{ post.created_at_readable }}</p>
        <p><strong>Updated At:</strong> {{ post.updated_at_readable }}</p>

        <!-- Show edit/delete buttons only if the user is the owner -->
        <div v-if="isPostOwner" class="actions">
          <button @click="startEdit" class="button edit-button">Edit</button>
          <button @click="deletePost" class="button delete-button">Delete</button>
        </div>

        <!-- Like Button and Count -->
        <div class="likes">
          <button @click="toggleLike(post)" :class="{ liked: post.liked_by_user }">
            {{ post.liked_by_user ? 'Unlike' : 'Like' }} ({{ post.likes_count }})
          </button>
        </div>

        <!-- Users Who Liked the Post -->
        <div class="liked-users" v-if="post.liked_users && post.liked_users.length > 0">
          <h3>Liked by:</h3>
          <ul>
            <li v-for="user in post.liked_users" :key="user.id">{{ user.name }}</li>
          </ul>
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
          <div v-if="isCommentOwner(comment.user.id)" class="comment-actions">
            <button
              v-if="commentToEdit !== comment.id"
              @click="editComment(comment.id)"
              class="button edit-comment-button"
            >
              Edit Comment
            </button>
            <button
              v-if="commentToEdit === comment.id"
              @click="updateComment"
              class="button update-comment-button"
            >
              Save Changes
            </button>
            <button
              v-if="commentToEdit === comment.id"
              @click="cancelEditComment"
              class="button cancel-edit-comment-button"
            >
              Cancel
            </button>
            <button
              v-if="commentToEdit !== comment.id"
              @click="deleteComment(comment.id)"
              class="button delete-comment-button"
            >
              Delete Comment
            </button>
          </div>
        </div>

        <!-- Add Comment Field -->
        <div class="add-comment">
          <textarea v-model="newComment" placeholder="Add a comment..." rows="3"></textarea>
          <button @click="addComment" class="button add-comment-button">Add Comment</button>
        </div>
      </div>
    </div>

    <div v-if="showDeleteModal" class="modal-overlay">
      <div class="modal-content">
        <h2>Confirm Deletion</h2>
        <p>Are you sure you want to delete this post?</p>
        <button @click="deletePost">Yes, Delete</button>
        <button @click="cancelDelete">Cancel</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'

interface User {
  id: number
  name: string
}

interface Comment {
  id: number
  content: string
  user: User
}

interface Post {
  id: number
  title: string
  content: string
  slug: string
  user: User
  comments: Comment[]
  liked_users: User[]
  likes_count: number
  liked_by_user: boolean
  comments_count: number
  created_at_readable: string
  updated_at_readable: string
  image: string
}

const route = useRoute()
const router = useRouter()
const post = ref<Post | null>(null)
const loading = ref(true)
const error = ref('')
const isEditing = ref(false)
const isPostOwner = ref(false)
const token = localStorage.getItem('token')
const newComment = ref('')
const commentToEdit = ref<number | null>(null)
const editedCommentContent = ref('')
const currentUserId = ref<string>('')
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
      const currentUserId = Number(localStorage.getItem('userId'))
      isPostOwner.value = post.value?.user.id === currentUserId
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
  if (!post.value) return
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
      fetchPostDetails()
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
  fetchPostDetails()
}

// const deletePost = async () => {
//   try {
//     const response = await axios.delete(`${apiBaseUrl}/posts/${post.value?.id}`, {
//       headers: {
//         Authorization: `Bearer ${token}`
//       }
//     })
//     if (response.status === 200) {
//       alert('Post deleted successfully.')
//       router.push('/posts')
//     } else {
//       alert('Failed to delete the post.')
//     }
//   } catch (err) {
//     alert('Failed to delete the post.')
//     console.error('Delete Post Error:', err)
//   }
// }

const deletePost = async (slug: string) => {
  const userConfirmed = window.confirm('Are you sure? This action cannot be undone!')

  if (userConfirmed) {
    try {
      const token = localStorage.getItem('authToken')
      if (!token) {
        console.error('No auth token found')
        return
      }

      await axios.delete(`https://interns-blog.nafistech.com/api/posts/${slug}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      alert('Your post has been deleted.')
      router.push('/')
    } catch (error) {
      console.error('Error deleting post:', error)
      alert('Failed to delete the post. Please try again.')
    }
  }
}

const deleteComment = async (commentId: number) => {
  try {
    const response = await axios.delete(`${apiBaseUrl}/comments/${commentId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    if (response.status === 200) {
      alert('Comment deleted successfully.')
      fetchPostDetails()
    } else {
      alert('Failed to delete the comment.')
    }
  } catch (err) {
    alert('Failed to delete the comment.')
    console.error('Delete Comment Error:', err)
  }
}

const addComment = async () => {
  if (!newComment.value.trim()) return
  try {
    const response = await axios.post(
      `${apiBaseUrl}/comments`,
      {
        content: newComment.value,
        post_id: post.value?.id
      },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )
    if (response.status === 200) {
      alert('Comment added successfully.')
      newComment.value = ''
      fetchPostDetails()
    } else {
      alert('Failed to add the comment.')
    }
  } catch (err) {
    alert('Failed to add the comment.')
    console.error('Add Comment Error:', err)
  }
}

const editComment = (commentId: number) => {
  const comment = post.value?.comments.find((c) => c.id === commentId)
  if (comment) {
    commentToEdit.value = commentId
    editedCommentContent.value = comment.content
  }
}

const updateComment = async () => {
  if (commentToEdit.value === null || !editedCommentContent.value.trim()) return
  try {
    const response = await axios.put(
      `${apiBaseUrl}/comments/${commentToEdit.value}`,
      {
        content: editedCommentContent.value
      },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )
    if (response.status === 200) {
      alert('Comment updated successfully.')
      commentToEdit.value = null
      fetchPostDetails()
    } else {
      alert('Failed to update the comment.')
    }
  } catch (err) {
    alert('Failed to update the comment.')
    console.error('Update Comment Error:', err)
  }
}

const cancelEditComment = () => {
  commentToEdit.value = null
}

const toggleLike = async (post: Post) => {
  try {
    const url = post.liked_by_user
      ? `${apiBaseUrl}/posts/${post.slug}/unlike`
      : `${apiBaseUrl}/posts/${post.slug}/like`
    const response = await axios.post(url, null, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    if (response.status === 200) {
      fetchPostDetails()
    } else {
      alert('Failed to update like status.')
    }
  } catch (err) {
    alert('Failed to update like status.')
    console.error('Toggle Like Error:', err)
  }
}

const isCommentOwner = (userId: number) => {
  return userId === Number(localStorage.getItem('userId'))
}

onMounted(fetchPostDetails)
</script>

<style scoped>
.post-details-page {
  max-width: 800px;
  margin: auto;
  padding: 20px;
  color: #333;
  background: #f0f0f0;
}

.post-image {
  width: 100%;
  height: auto;
  max-height: 300px;
  object-fit: cover;
  margin-bottom: 20px;
}

.edit-post-form,
.post-view {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.edit-post-form h2,
.post-view h2 {
  color: #4a4a4a;
}

.button {
  background-color: #6a1b29;
  color: #fff;
  border: none;
  padding: 10px 15px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  margin-right: 10px;
  transition: background-color 0.3s;
}

.button:hover {
  background-color: #9b2d3f;
}

.update-button {
  background-color: #4a148c;
}

.update-button:hover {
  background-color: #7b1fa2;
}

.cancel-button,
.cancel-edit-comment-button {
  background-color: #d32f2f;
}

.cancel-button:hover,
.cancel-edit-comment-button:hover {
  background-color: #f44336;
}

.delete-button {
  background-color: #c62828;
}

.delete-button:hover {
  background-color: #e53935;
}

.like-button {
  background-color: #0288d1;
}

.like-button.liked {
  background-color: #01579b;
}

.like-button:hover {
  background-color: #039be5;
}

.liked-users ul {
  list-style-type: none;
  padding: 0;
}

.liked-users li {
  background: #eee;
  padding: 5px;
  margin-bottom: 5px;
  border-radius: 4px;
}

.comments-section {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.comment {
  border-bottom: 1px solid #ddd;
  padding: 10px 0;
}

.comment-actions .button {
  margin-right: 5px;
}

.add-comment {
  margin-top: 20px;
}

.add-comment textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
}

.add-comment-button {
  background-color: #4a148c;
}

.add-comment-button:hover {
  background-color: #7b1fa2;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-content {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.modal-content button {
  background-color: #4a148c;
  color: #fff;
  border: none;
  padding: 10px 15px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  margin: 5px;
  transition: background-color 0.3s;
}

.modal-content button:hover {
  background-color: #7b1fa2;
}
</style>
