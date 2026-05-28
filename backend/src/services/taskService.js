const { v4: uuidv4 } = require('uuid');
const TaskModel = require('../models/taskModel');

class TaskService {
  static async getAll(filters = {}) {
    const allowedStatuses = ['todo', 'in-progress', 'done'];
    const cleanFilters = {};

    if (filters.status && allowedStatuses.includes(filters.status)) {
      cleanFilters.status = filters.status;
    }

    if (filters.sortBy === 'created_at') {
      cleanFilters.sortBy = 'created_at';
    }
    if (filters.order === 'asc' || filters.order === 'desc') {
      cleanFilters.order = filters.order;
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
    const task = {
      id: uuidv4(),
      title: data.title,
      description: data.description || '',
      status: 'todo',
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

  static async getStats() {
    return TaskModel.getStats();
  }
}

module.exports = TaskService;
