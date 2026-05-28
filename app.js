const API_BASE = window.TASKBASE_API_URL || '/api';

let tasks = [];
let isOnline = true;
let mockData = [];
let searchTimeout = null;

const form = document.getElementById('taskForm');
const titleInput = document.getElementById('titleInput');
const descriptionInput = document.getElementById('descriptionInput');
const priorityInput = document.getElementById('priorityInput');
const submitBtn = document.getElementById('submitBtn');
const taskList = document.getElementById('taskList');
const loadingIndicator = document.getElementById('loadingIndicator');
const emptyState = document.getElementById('emptyState');
const statusFilter = document.getElementById('statusFilter');
const priorityFilter = document.getElementById('priorityFilter');
const sortOrder = document.getElementById('sortOrder');
const searchInput = document.getElementById('searchInput');
const statTotal = document.getElementById('statTotal');
const statTodo = document.getElementById('statTodo');
const statProgress = document.getElementById('statProgress');
const statDone = document.getElementById('statDone');

function generateId() {
  return crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function getNow() {
  return new Date().toISOString();
}

async function apiRequest(path, options = {}) {
  if (!isOnline) {
    return mockRequest(path, options);
  }

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    });

    if (res.status === 204) return null;

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Request failed');
    }

    return data;
  } catch (err) {
    if (!isOnline) {
      return mockRequest(path, options);
    }
    isOnline = false;
    return mockRequest(path, options);
  }
}

function mockRequest(path, options) {
  const method = (options.method || 'GET').toUpperCase();

  if (path.startsWith('/tasks/') && method === 'GET') {
    const id = path.split('/').pop();
    const task = mockData.find(t => t.id === id);
    if (!task) throw new Error('Task not found');
    return { data: task };
  }

  if (path === '/tasks' && method === 'GET') {
    let filtered = [...mockData];
    return { data: filtered, stats: computeStats(filtered) };
  }

  if (path === '/tasks' && method === 'POST') {
    const body = JSON.parse(options.body || '{}');
    const task = {
      id: generateId(),
      title: body.title,
      description: body.description || '',
      status: 'todo',
      priority: body.priority || 'medium',
      created_at: getNow(),
      updated_at: getNow(),
    };
    mockData.unshift(task);
    return { data: task };
  }

  if (path.startsWith('/tasks/') && method === 'PUT') {
    const id = path.split('/').pop();
    const idx = mockData.findIndex(t => t.id === id);
    if (idx === -1) throw new Error('Task not found');
    const body = JSON.parse(options.body || '{}');
    Object.assign(mockData[idx], body, { updated_at: getNow() });
    return { data: mockData[idx] };
  }

  if (path.startsWith('/tasks/') && method === 'DELETE') {
    const id = path.split('/').pop();
    const idx = mockData.findIndex(t => t.id === id);
    if (idx === -1) throw new Error('Task not found');
    mockData.splice(idx, 1);
    return null;
  }

  throw new Error('Unknown request');
}

function computeStats(data) {
  return {
    total: data.length,
    todo: data.filter(t => t.status === 'todo').length,
    in_progress: data.filter(t => t.status === 'in-progress').length,
    done: data.filter(t => t.status === 'done').length,
  };
}

function showLoading() {
  loadingIndicator.classList.remove('hidden');
  emptyState.classList.add('hidden');
}

function hideLoading() {
  loadingIndicator.classList.add('hidden');
}

function showEmptyState() {
  emptyState.classList.remove('hidden');
}

function updateStats(stats) {
  statTotal.textContent = stats.total;
  statTodo.textContent = stats.todo;
  statProgress.textContent = stats.in_progress;
  statDone.textContent = stats.done;
}

function getStatusLabel(status) {
  const labels = { 'todo': 'Todo', 'in-progress': 'Progress', 'done': 'Done' };
  return labels[status] || status;
}

function getPriorityLabel(priority) {
  return priority ? priority.charAt(0).toUpperCase() + priority.slice(1) : '';
}

function renderTasks() {
  const filtered = filterTasks();
  const searched = searchTasks(filtered);
  const sorted = sortTasks(searched);

  taskList.innerHTML = '';

  if (sorted.length === 0) {
    showEmptyState();
    return;
  }

  hideLoading();
  emptyState.classList.add('hidden');

  sorted.forEach(task => {
    const card = document.createElement('div');
    card.className = 'task-card';

    const isDone = task.status === 'done';
    const statuses = ['todo', 'in-progress', 'done'];

    card.innerHTML = `
      <div class="task-body">
        <div class="task-title ${isDone ? 'done-text' : ''}">${escapeHtml(task.title)}</div>
        ${task.description ? `<div class="task-desc">${escapeHtml(task.description)}</div>` : ''}
        <div class="task-meta">
          <span class="priority-badge ${task.priority || 'medium'}">${getPriorityLabel(task.priority)}</span>
          <span>${formatDate(task.created_at)}</span>
        </div>
      </div>
      <div class="task-actions">
        ${statuses.map(s => `
          <button class="btn-status ${s === task.status ? 'active ' : ''}is-${s}" data-id="${task.id}" data-status="${s}">${getStatusLabel(s)}</button>
        `).join('')}
        <button class="btn-delete" data-id="${task.id}" title="Delete">✕</button>
      </div>
    `;

    card.querySelectorAll('.btn-status').forEach(btn => {
      btn.addEventListener('click', () => updateTaskStatus(task.id, btn.dataset.status));
    });
    card.querySelector('.btn-delete').addEventListener('click', () => deleteTask(task.id));

    taskList.appendChild(card);
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function filterTasks() {
  let filtered = [...tasks];
  const sf = statusFilter.value;
  if (sf !== 'all') {
    filtered = filtered.filter(t => t.status === sf);
  }
  const pf = priorityFilter.value;
  if (pf !== 'all') {
    filtered = filtered.filter(t => t.priority === pf);
  }
  return filtered;
}

function searchTasks(list) {
  const q = searchInput.value.trim().toLowerCase();
  if (!q) return list;
  return list.filter(t =>
    t.title.toLowerCase().includes(q) ||
    (t.description && t.description.toLowerCase().includes(q))
  );
}

function sortTasks(list) {
  const order = sortOrder.value;
  const sorted = [...list];
  sorted.sort((a, b) => {
    const da = new Date(a.created_at).getTime();
    const db = new Date(b.created_at).getTime();
    return order === 'asc' ? da - db : db - da;
  });
  return sorted;
}

async function loadTasks() {
  showLoading();
  try {
    const res = await apiRequest('/tasks');
    tasks = res.data;
    updateStats(res.stats);
    renderTasks();
    hideLoading();
    if (tasks.length === 0) {
      showEmptyState();
    }
  } catch (err) {
    renderTasks();
    hideLoading();
  }
}

async function createTask(title, description, priority) {
  submitBtn.disabled = true;
  submitBtn.textContent = 'Adding...';
  try {
    await apiRequest('/tasks', {
      method: 'POST',
      body: JSON.stringify({ title, description, priority }),
    });
    titleInput.value = '';
    descriptionInput.value = '';
    priorityInput.value = 'medium';
    await loadTasks();
  } catch (err) {
    console.error(err);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Add Task';
  }
}

async function updateTaskStatus(id, status) {
  const prev = tasks.find(t => t.id === id);
  if (prev && prev.status === status) return;
  try {
    await apiRequest(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
    await loadTasks();
  } catch (err) {
    console.error(err);
  }
}

async function deleteTask(id) {
  try {
    await apiRequest(`/tasks/${id}`, { method: 'DELETE' });
    await loadTasks();
  } catch (err) {
    console.error(err);
  }
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const title = titleInput.value.trim();
  const description = descriptionInput.value.trim();
  const priority = priorityInput.value;
  if (!title) return;
  createTask(title, description, priority);
});

statusFilter.addEventListener('change', renderTasks);
priorityFilter.addEventListener('change', renderTasks);
sortOrder.addEventListener('change', renderTasks);

searchInput.addEventListener('input', () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(renderTasks, 200);
});

loadTasks();
