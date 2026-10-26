/**
 * Centralized API service using native fetch for Task Manager.
 * Communicates with the Django REST Framework backend.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

/**
 * Helper to handle fetch responses and error parsing.
 */
async function handleResponse(response) {
  if (!response.ok) {
    let errorDetail = `Request failed with status ${response.status}`;
    try {
      const data = await response.json();
      if (typeof data === 'object' && data !== null) {
        if (data.detail) {
          errorDetail = data.detail;
        } else {
          // Format field errors if any (e.g. { title: ["This field is required."] })
          errorDetail = Object.entries(data)
            .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(' ') : val}`)
            .join(' | ');
        }
      }
    } catch {
      // response might not be JSON (e.g. 500 error page or empty)
    }
    const error = new Error(errorDetail);
    error.status = response.status;
    throw error;
  }

  // 204 No Content has no body
  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export const api = {
  /**
   * GET /tasks/ - List all tasks
   */
  async getTasks() {
    const res = await fetch(`${API_BASE_URL}/tasks/`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    return handleResponse(res);
  },

  /**
   * POST /tasks/ - Create a new task
   */
  async createTask({ title, description }) {
    const res = await fetch(`${API_BASE_URL}/tasks/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        title: title.trim(),
        description: description ? description.trim() : '',
        completed: false,
      }),
    });
    return handleResponse(res);
  },

  /**
   * GET /tasks/{id}/ - Retrieve a task by ID
   */
  async getTask(id) {
    const res = await fetch(`${API_BASE_URL}/tasks/${id}/`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    return handleResponse(res);
  },

  /**
   * PUT /tasks/{id}/ - Update a task (title & description)
   */
  async updateTask(id, { title, description }) {
    const res = await fetch(`${API_BASE_URL}/tasks/${id}/`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        title: title.trim(),
        description: description ? description.trim() : '',
      }),
    });
    return handleResponse(res);
  },

  /**
   * PATCH /tasks/{id}/ - Toggle task completed status only
   */
  async toggleTaskCompleted(id) {
    const res = await fetch(`${API_BASE_URL}/tasks/${id}/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({}),
    });
    return handleResponse(res);
  },

  /**
   * DELETE /tasks/{id}/ - Delete a task
   */
  async deleteTask(id) {
    const res = await fetch(`${API_BASE_URL}/tasks/${id}/`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
      },
    });
    return handleResponse(res);
  },
};
