# Taskbase API

A production-style task management system with a RESTful backend API built with Node.js and Express, persistent SQLite storage, and a minimal dark-themed frontend.

## Features

- Full CRUD task management (Create, Read, Update, Delete)
- Persistent SQLite storage (survives restarts and IDE closures)
- Filter tasks by status (todo, in-progress, done)
- Sort tasks by creation date
- Task analytics dashboard (total, todo, in-progress, done counts)
- Offline fallback mode (frontend works without backend)
- Clean, responsive dark-themed UI
- Configurable API base URL for separate deployment

## Tech Stack

- **Backend**: Node.js, Express, better-sqlite3
- **Database**: SQLite (with WAL mode for performance)
- **Frontend**: Vanilla JavaScript, CSS3 (no frameworks)
- **Deployment**: GitHub Pages (frontend), any Node host (backend)

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | List all tasks (query: `status`, `sortBy`, `order`) |
| GET | `/api/tasks/:id` | Get a single task |
| POST | `/api/tasks` | Create a task |
| PUT | `/api/tasks/:id` | Update a task (title, description, status) |
| DELETE | `/api/tasks/:id` | Delete a task |
| GET | `/api/health` | Health check |

### Task Schema

```json
{
  "id": "uuid",
  "title": "string (required)",
  "description": "string",
  "status": "todo | in-progress | done",
  "created_at": "ISO 8601",
  "updated_at": "ISO 8601"
}
```

## Setup

### Prerequisites

- Node.js 18+
- npm

### Local Development

```bash
git clone https://github.com/codexfang/taskbase-api.git
cd taskbase-api

cd backend
npm install
npm run dev
```

The API will be available at `http://localhost:3001/api`.

### Frontend

Open `http://localhost:3001` in your browser (the backend serves the frontend automatically).

To configure the API URL for separate deployment, set the `TASKBASE_API_URL` global variable:

```html
<script>window.TASKBASE_API_URL = 'https://your-api.com/api';</script>
```

## GitHub Pages Deployment

1. Push the `frontend/` directory to the repository
2. Go to Settings > Pages
3. Set source to "Deploy from a branch"
4. Select the branch and set folder to `/frontend`
5. Save

The frontend will automatically use offline fallback mode when the backend is unavailable. For a connected experience, deploy the backend separately and set the API URL.

## Backend Deployment

```bash
cd backend
npm install
npm start
```

Set the `PORT` environment variable to change the port (default: 3001).

## Docker

```bash
docker-compose up --build
```

This starts the backend on port 3001 and serves the frontend on port 8080.

## License

MIT License
