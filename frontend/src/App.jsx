import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from './api';
import TaskItem from './components/TaskItem';
import TaskModal from './components/TaskModal';
import ConfirmDeleteModal from './components/ConfirmDeleteModal';
import './App.css';

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  // Filter & Search states
  const [filter, setFilter] = useState('all'); // 'all' | 'active' | 'completed'
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete confirmation modal states
  const [deletingTask, setDeletingTask] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Track task IDs that are currently toggling to prevent double-click race conditions
  const [togglingIds, setTogglingIds] = useState(new Set());

  // Show auto-dismissing toast notifications
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    const timer = setTimeout(() => {
      setToast(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  // Fetch tasks on initial load
  const loadTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getTasks();
      setTasks(data || []);
    } catch (err) {
      console.error('Failed to load tasks:', err);
      setError('Unable to connect to the task server. Please ensure the backend is running at http://127.0.0.1:8000.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Handle Create or Update task
  const handleSaveTask = async (formData) => {
    setIsSubmitting(true);
    try {
      if (editingTask) {
        // PUT /tasks/{id}/
        const updated = await api.updateTask(editingTask.id, formData);
        setTasks((prev) =>
          prev.map((t) => (t.id === editingTask.id ? updated : t))
        );
        showToast('Task updated successfully!');
      } else {
        // POST /tasks/
        const created = await api.createTask(formData);
        setTasks((prev) => [created, ...prev]);
        showToast('New task created successfully!');
      }
      setIsModalOpen(false);
      setEditingTask(null);
    } catch (err) {
      console.error('Save task error:', err);
      showToast(err.message || 'Failed to save task.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Toggle Completed
  const handleToggleCompleted = async (id) => {
    if (togglingIds.has(id)) return;

    setTogglingIds((prev) => new Set(prev).add(id));

    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );

    try {
      // PATCH /tasks/{id}/
      const updated = await api.toggleTaskCompleted(id);
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
      showToast(
        updated.completed
          ? 'Task marked as completed!'
          : 'Task marked as pending.'
      );
    } catch (err) {
      console.error('Toggle completed error:', err);
      // Revert optimistic update on failure
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
      );
      showToast(err.message || 'Failed to update task status.', 'error');
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  // Handle Delete task
  const handleConfirmDelete = async () => {
    if (!deletingTask) return;
    setIsDeleting(true);
    try {
      // DELETE /tasks/{id}/
      await api.deleteTask(deletingTask.id);
      setTasks((prev) => prev.filter((t) => t.id !== deletingTask.id));
      showToast('Task deleted successfully.');
      setDeletingTask(null);
    } catch (err) {
      console.error('Delete task error:', err);
      showToast(err.message || 'Failed to delete task.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered & Searched tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Status filter
      if (filter === 'active' && task.completed) return false;
      if (filter === 'completed' && !task.completed) return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = task.title?.toLowerCase().includes(q);
        const descMatch = task.description?.toLowerCase().includes(q);
        return titleMatch || descMatch;
      }
      return true;
    });
  }, [tasks, filter, searchQuery]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;
    const active = total - completed;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, active, percentage };
  }, [tasks]);

  return (
    <div className="app-container">
      {/* App Header */}
      <header className="app-header">
        <div className="brand-section">
          <div className="brand-icon-wrapper" aria-hidden="true">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
            </svg>
          </div>
          <div>
            <h1 className="brand-title">TaskFlow</h1>
            <p className="brand-subtitle">Streamlined task management powered by Django & React</p>
          </div>
        </div>

        <button
          type="button"
          className="btn-new-task"
          onClick={() => {
            setEditingTask(null);
            setIsModalOpen(true);
          }}
          id="btn-create-task"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          New Task
        </button>
      </header>

      {/* Global Toast / Feedback */}
      {toast && (
        <div className={`toast-banner ${toast.type}`} role="alert">
          <div className="toast-content">
            {toast.type === 'error' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            )}
            <span>{toast.message}</span>
          </div>
          <button type="button" className="toast-close" onClick={() => setToast(null)} aria-label="Dismiss message">
            &times;
          </button>
        </div>
      )}

      {/* Global Error Alert */}
      {error && (
        <div className="toast-banner error" role="alert">
          <div className="toast-content">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <div>
              <strong>Connection Error:</strong> {error}
            </div>
          </div>
          <button type="button" className="btn-secondary" onClick={loadTasks} style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}>
            Retry
          </button>
        </div>
      )}

      {/* Statistics Cards */}
      <section className="stats-container" aria-label="Task statistics">
        <div className="stat-card">
          <span className="stat-label">Total Tasks</span>
          <span className="stat-value">{stats.total}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Pending</span>
          <span className="stat-value" style={{ color: '#818cf8' }}>{stats.active}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Completed</span>
          <span className="stat-value" style={{ color: '#34d399' }}>{stats.completed}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Completion Rate</span>
          <span className="stat-value">{stats.percentage}%</span>
          <div className="stat-progress-bar">
            <div className="stat-progress-fill" style={{ width: `${stats.percentage}%` }}></div>
          </div>
        </div>
      </section>

      {/* Search and Filters Toolbar */}
      <section className="toolbar" aria-label="Filters and search">
        <div className="search-box">
          <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder="Search tasks by title or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            id="task-search-input"
          />
          {searchQuery && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => setSearchQuery('')}
              title="Clear search"
            >
              &times;
            </button>
          )}
        </div>

        <div className="filter-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={filter === 'all'}
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All <span className="filter-counter">{stats.total}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={filter === 'active'}
            className={`filter-tab ${filter === 'active' ? 'active' : ''}`}
            onClick={() => setFilter('active')}
          >
            Active <span className="filter-counter">{stats.active}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={filter === 'completed'}
            className={`filter-tab ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            Completed <span className="filter-counter">{stats.completed}</span>
          </button>
        </div>
      </section>

      {/* Main Task List */}
      <main>
        {isLoading ? (
          <div className="loading-box">
            <div className="spinner"></div>
            <p>Loading tasks from database...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon" aria-hidden="true">&#9776;</div>
            <h2 className="empty-title">
              {searchQuery ? 'No matching tasks found' : filter === 'completed' ? 'No completed tasks yet' : filter === 'active' ? 'All caught up! No active tasks' : 'No tasks created yet'}
            </h2>
            <p className="empty-desc">
              {searchQuery
                ? `No tasks match your query "${searchQuery}". Try a different keyword.`
                : 'Stay organized and boost productivity by creating your first task.'}
            </p>
            {!searchQuery && (
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  setEditingTask(null);
                  setIsModalOpen(true);
                }}
              >
                + Create Task
              </button>
            )}
          </div>
        ) : (
          <div className="task-list">
            {filteredTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={handleToggleCompleted}
                onEdit={(t) => {
                  setEditingTask(t);
                  setIsModalOpen(true);
                }}
                onDelete={(t) => setDeletingTask(t)}
                isToggling={togglingIds.has(task.id)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Create / Edit Task Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTask(null);
        }}
        onSubmit={handleSaveTask}
        initialTask={editingTask}
        isSubmitting={isSubmitting}
      />

      {/* Confirm Deletion Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(deletingTask)}
        onClose={() => setDeletingTask(null)}
        onConfirm={handleConfirmDelete}
        taskTitle={deletingTask?.title || ''}
        isDeleting={isDeleting}
      />
    </div>
  );
}
