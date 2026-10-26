import React from 'react';

export default function TaskItem({ task, onToggle, onEdit, onDelete, isToggling = false }) {
  const formattedDate = task.created_at
    ? new Date(task.created_at).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <div className={`task-card ${task.completed ? 'completed' : ''}`}>
      {/* Checkbox Toggle Button */}
      <button
        type="button"
        className={`toggle-btn ${task.completed ? 'completed' : ''}`}
        onClick={() => onToggle(task.id)}
        disabled={isToggling}
        title={task.completed ? 'Mark as incomplete' : 'Mark as completed'}
        aria-label={task.completed ? 'Mark as incomplete' : 'Mark as completed'}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </button>

      {/* Task Content */}
      <div className="task-body">
        <div className="task-title-row">
          <span className={`task-title ${task.completed ? 'strike' : ''}`}>
            {task.title}
          </span>
          <span className={`status-badge ${task.completed ? 'completed' : 'pending'}`}>
            {task.completed ? 'Completed' : 'Pending'}
          </span>
        </div>

        {task.description && (
          <p className="task-description">{task.description}</p>
        )}

        <div className="task-meta">
          <span className="task-meta-item">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            {formattedDate}
          </span>
          <span className="task-meta-item">
            #{task.id}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="task-actions">
        <button
          type="button"
          className="action-btn edit"
          onClick={() => onEdit(task)}
          title="Edit task"
          aria-label="Edit task"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        </button>

        <button
          type="button"
          className="action-btn delete"
          onClick={() => onDelete(task)}
          title="Delete task"
          aria-label="Delete task"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            <line x1="10" y1="11" x2="10" y2="17"></line>
            <line x1="14" y1="11" x2="14" y2="17"></line>
          </svg>
        </button>
      </div>
    </div>
  );
}
