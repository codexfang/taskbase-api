const TaskService = require('../services/taskService');

class TaskController {
  static async getAll(req, res, next) {
    try {
      const { status, priority, sortBy, order, query, limit, offset } = req.query;
      const tasks = await TaskService.getAll({ status, priority, sortBy, order, query, limit, offset });
      const stats = await TaskService.getStats({ status, priority, query });
      const priorities = await TaskService.getPriorities();
      res.json({ data: tasks, stats, priorities });
    } catch (err) {
      next(err);
    }
  }

  static async getById(req, res, next) {
    try {
      const task = await TaskService.getById(req.params.id);
      res.json({ data: task });
    } catch (err) {
      next(err);
    }
  }

  static async create(req, res, next) {
    try {
      const task = await TaskService.create(req.body);
      res.status(201).json({ data: task });
    } catch (err) {
      next(err);
    }
  }

  static async update(req, res, next) {
    try {
      const task = await TaskService.update(req.params.id, req.body);
      res.json({ data: task });
    } catch (err) {
      next(err);
    }
  }

  static async delete(req, res, next) {
    try {
      await TaskService.delete(req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
}

module.exports = TaskController;
