# TaskFlow - Full-Stack Task Manager

A modern, responsive full-stack Task Management web application built with **Django REST Framework** (using `viewsets.ViewSet`) on the backend and **React.js** (Hooks + native `fetch`) on the frontend, with SQLite as the database.

---

## Architecture & Technology Stack

- **Backend**:
  - **Framework**: Django 6.x + Django REST Framework 3.18
  - **ViewSet Pattern**: Explicit `rest_framework.viewsets.ViewSet` (not `ModelViewSet`)
  - **Database**: SQLite (`db.sqlite3`)
  - **CORS**: `django-cors-headers` configured for seamless client communication
- **Frontend**:
  - **Framework**: React.js 19 with functional components & Hooks (`useState`, `useEffect`, `useMemo`, `useCallback`)
  - **Build Tool**: Vite
  - **HTTP Client**: Native `window.fetch` with robust error parsing and status code checking
  - **Styling**: Modern, responsive Vanilla CSS design system with dark/glassmorphism aesthetics, fluid micro-interactions, accessible modal dialogs, and progress tracking
- **Features**:
  - View all tasks with status badges and creation timestamps
  - Create new tasks with title (required) and optional description
  - Edit existing tasks (title and description)
  - Toggle completion status (strike-through and status badge update)
  - Delete tasks with safe confirmation modal
  - Filter tasks by status: **All**, **Active**, **Completed**
  - Instant live keyword search (searches title and description)
  - Real-time task statistics (Total, Pending, Completed, Completion Rate %)
  - Loading indicators and user feedback toasts

---

## Directory Structure

```text
yahshua-operational-test/
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── task_manager/            # Django project configuration
│   │   ├── __init__.py
│   │   ├── asgi.py
│   │   ├── settings.py          # DRF, CORS, and tasks app settings
│   │   ├── urls.py              # Root router mounting /tasks/
│   │   └── wsgi.py
│   └── tasks/                   # Tasks application
│       ├── __init__.py
│       ├── admin.py
│       ├── apps.py
│       ├── models.py            # Task model (id, title, description, completed, created_at)
│       ├── serializers.py       # TaskSerializer
│       ├── views.py             # TaskViewSet extending viewsets.ViewSet
│       ├── urls.py              # DRF DefaultRouter for TaskViewSet
│       └── tests.py             # Automated unit tests for all endpoints
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js           # Vite config with proxy to backend:8000
│   └── src/
│       ├── api.js               # Centralized native fetch API service
│       ├── App.jsx              # Main dashboard component with React hooks
│       ├── App.css              # Custom styling & animations
│       ├── index.css            # Base design system & theme variables
│       ├── main.jsx             # React entry point
│       └── components/
│           ├── TaskItem.jsx     # Individual task card with actions
│           ├── TaskModal.jsx    # Create/Edit task modal
│           └── ConfirmDeleteModal.jsx # Deletion confirmation modal
└── README.md
```

---

## Setup & Running Instructions

### Prerequisites
- **Python 3.10+**
- **Node.js 18+** and **npm**

---

### 1. Backend Setup (Django)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   - **Windows (PowerShell)**:
     ```powershell
     python -m venv venv
     .\venv\Scripts\Activate.ps1
     ```
   - **macOS / Linux**:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

3. Install backend dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Apply database migrations:
   ```bash
   python manage.py migrate
   ```

5. (Optional) Run automated backend test suite:
   ```bash
   python manage.py test tasks
   ```

6. Start the Django development server:
   ```bash
   python manage.py runserver 127.0.0.1:8000
   ```
   The backend API will be available at `http://127.0.0.1:8000`.

---

### 2. Frontend Setup (React + Vite)

1. Open a new terminal and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to:
   ```text
   http://127.0.0.1:5173
   ```

---

## API Endpoint Summary

The backend exposes the following RESTful endpoints registered via DRF's router from `TaskViewSet` (`viewsets.ViewSet`):

| Method | Endpoint | Description | Request Body | Response (Success) |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/tasks/` | List all tasks (ordered by newest first) | None | `200 OK` (Array of Tasks) |
| **POST** | `/tasks/` | Create a new task | `{"title": "...", "description": "..."}` | `201 Created` (Created Task object) |
| **GET** | `/tasks/{id}/` | Retrieve a task by ID | None | `200 OK` (Task object) or `404 Not Found` |
| **PUT** | `/tasks/{id}/` | Update a task (title & description) | `{"title": "...", "description": "..."}` | `200 OK` (Updated Task object) |
| **PATCH** | `/tasks/{id}/` | Toggle task completed status only | `{}` or `{"completed": boolean}` | `200 OK` (Updated Task object) |
| **DELETE** | `/tasks/{id}/` | Delete a task | None | `204 No Content` or `404 Not Found` |

### Task Model Schema
- `id` (`AutoField`, Primary Key)
- `title` (`CharField`, max_length=255, required)
- `description` (`TextField`, optional, default="")
- `completed` (`BooleanField`, default=False)
- `created_at` (`DateTimeField`, auto_now_add=True)

---

## Implementation Details & Design Decisions

1. **`viewsets.ViewSet` Implementation**:
   - Rather than extending `ModelViewSet`, `TaskViewSet` directly inherits from `rest_framework.viewsets.ViewSet`.
   - Each action method (`list`, `create`, `retrieve`, `update`, `partial_update`, `destroy`) is explicitly defined and handles querying, serialization, validation, status codes, and 404 responses via `get_object_or_404`.
2. **PATCH Endpoint Flexibility**:
   - Calling `PATCH /tasks/{id}/` with an empty JSON body `{}` toggles the current `completed` boolean value (`task.completed = not task.completed`).
   - If an explicit `{"completed": true/false}` payload is provided, it updates `completed` to that value directly.
3. **Optimistic UI Updates with Rollback**:
   - In React, toggling a task immediately updates the UI state for zero latency. If the network call fails, the change is reverted gracefully and an error toast is displayed.
4. **Native `fetch` Wrapper**:
   - Implemented in [api.js](file:///c:/Users/Admin/Documents/yahshua-operational-test/frontend/src/api.js) without external HTTP libraries (such as Axios). Automatically extracts backend validation errors from DRF response payloads.
5. **CORS & Environment Setup**:
   - `django-cors-headers` is configured with `CORS_ALLOW_ALL_ORIGINS = True` to support decoupled client/server architectures.
   - Vite is configured with an optional dev proxy for `/tasks` to simplify development.
