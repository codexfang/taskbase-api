const { v4: uuidv4 } = require('uuid');
const TaskModel = require('../models/taskModel');

class TaskService {
  static async getAll(filters = {}) {
    const allowedStatuses = ['todo', 'in-progress', 'done'];
    const allowedPriorities = ['low', 'medium', 'high'];
    const cleanFilters = {};

    if (filters.status && allowedStatuses.includes(filters.status)) {
      cleanFilters.status = filters.status;
    }

    if (filters.priority && allowedPriorities.includes(filters.priority)) {
      cleanFilters.priority = filters.priority;
    }

    if (filters.query && typeof filters.query === 'string' && filters.query.trim().length > 0) {
      cleanFilters.query = filters.query.trim();
    }

    if (filters.sortBy === 'created_at') {
      cleanFilters.sortBy = 'created_at';
    }

    if (filters.order === 'asc' || filters.order === 'desc') {
      cleanFilters.order = filters.order;
    }

    if (filters.limit) {
      cleanFilters.limit = Math.min(Math.max(parseInt(filters.limit, 10) || 50, 1), 100);
    }

    if (filters.offset) {
      cleanFilters.offset = Math.max(parseInt(filters.offset, 10) || 0, 0);
    }

    return TaskModel.findAll(cleanFilters);
  }

  static async getById(id) {
    const task = TaskModel.findById(id);
    if (!task) {
      const err = new Error('Task not found');
      err.status = 404;
      throw err;
    }
    return task;
  }

  static async create(data) {
    const allowedPriorities = ['low', 'medium', 'high'];
    const priority = data.priority && allowedPriorities.includes(data.priority) ? data.priority : 'medium';

    const task = {
      id: uuidv4(),
      title: data.title,
      description: data.description || '',
      status: 'todo',
      priority,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return TaskModel.create(task);
  }

  static async update(id, data) {
    const existing = TaskModel.findById(id);
    if (!existing) {
      const err = new Error('Task not found');
      err.status = 404;
      throw err;
    }

    const allowedStatuses = ['todo', 'in-progress', 'done'];
    const allowedPriorities = ['low', 'medium', 'high'];
    const fields = {};

    if (data.title !== undefined) fields.title = data.title;
    if (data.description !== undefined) fields.description = data.description;

    if (data.status !== undefined) {
      if (!allowedStatuses.includes(data.status)) {
        const err = new Error('Invalid status. Must be: todo, in-progress, or done');
        err.status = 400;
        throw err;
      }
      fields.status = data.status;
    }

    if (data.priority !== undefined) {
      if (!allowedPriorities.includes(data.priority)) {
        const err = new Error('Invalid priority. Must be: low, medium, or high');
        err.status = 400;
        throw err;
      }
      fields.priority = data.priority;
    }

    return TaskModel.update(id, fields);
  }

  static async delete(id) {
    const task = TaskModel.delete(id);
    if (!task) {
      const err = new Error('Task not found');
      err.status = 404;
      throw err;
    }
    return task;
  }

  static async getStats(filters = {}) {
    const allowedStatuses = ['todo', 'in-progress', 'done'];
    const allowedPriorities = ['low', 'medium', 'high'];
    const cleanFilters = {};

    if (filters.status && allowedStatuses.includes(filters.status)) {
      cleanFilters.status = filters.status;
    }

    if (filters.priority && allowedPriorities.includes(filters.priority)) {
      cleanFilters.priority = filters.priority;
    }

    if (filters.query && typeof filters.query === 'string' && filters.query.trim().length > 0) {
      cleanFilters.query = filters.query.trim();
    }

    return TaskModel.getStats(cleanFilters);
  }

  static async getPriorities() {
    return TaskModel.getPriorities();
  }
}

module.exports = TaskService;
