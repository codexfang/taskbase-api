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

## License

MIT
