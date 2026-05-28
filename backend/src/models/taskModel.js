const db = require('../database/db');

class TaskModel {
  static findAll(filters = {}) {
    let query = 'SELECT * FROM tasks';
    const conditions = [];
    const params = [];

    if (filters.status) {
      conditions.push('status = ?');
      params.push(filters.status);
    }

    if (filters.priority) {
      conditions.push('priority = ?');
      params.push(filters.priority);
    }

    if (filters.query) {
      conditions.push('(title LIKE ? OR description LIKE ?)');
      params.push(`%${filters.query}%`, `%${filters.query}%`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    const sortBy = filters.sortBy === 'created_at' ? 'created_at' : 'created_at';
    const order = filters.order === 'asc' ? 'ASC' : 'DESC';
    query += ` ORDER BY ${sortBy} ${order}`;

    let data = db.prepare(query).all(...params);

    if (filters.limit) {
      const limit = parseInt(filters.limit, 10) || 50;
      const offset = parseInt(filters.offset, 10) || 0;
      data = data.slice(offset, offset + limit);
    }

    return data;
  }

  static findById(id) {
    return db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  }

  static create(task) {
    const stmt = db.prepare(`
      INSERT INTO tasks (id, title, description, status, priority, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(task.id, task.title, task.description, task.status, task.priority, task.createdAt, task.updatedAt);
    return this.findById(task.id);
  }

  static update(id, fields) {
    const sets = [];
    const params = [];

    if (fields.title !== undefined) {
      sets.push('title = ?');
      params.push(fields.title);
    }
    if (fields.description !== undefined) {
      sets.push('description = ?');
      params.push(fields.description);
    }
    if (fields.status !== undefined) {
      sets.push('status = ?');
      params.push(fields.status);
    }
    if (fields.priority !== undefined) {
      sets.push('priority = ?');
      params.push(fields.priority);
    }

    if (sets.length === 0) return this.findById(id);

    sets.push("updated_at = datetime('now')");
    params.push(id);

    const query = `UPDATE tasks SET ${sets.join(', ')} WHERE id = ?`;
    db.prepare(query).run(...params);
    return this.findById(id);
  }

  static delete(id) {
    const task = this.findById(id);
    if (task) {
      db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
    }
    return task;
  }

  static getStats(filters = {}) {
    const conditions = [];
    const params = [];

    if (filters.status) {
      conditions.push('status = ?');
      params.push(filters.status);
    }

    if (filters.priority) {
      conditions.push('priority = ?');
      params.push(filters.priority);
    }

    if (filters.query) {
      conditions.push('(title LIKE ? OR description LIKE ?)');
      params.push(`%${filters.query}%`, `%${filters.query}%`);
    }

    const where = conditions.length > 0 ? ' WHERE ' + conditions.join(' AND ') : '';

    const row = db.prepare(`
      SELECT
        COUNT(*) AS total,
        COALESCE(SUM(CASE WHEN status = 'todo' THEN 1 ELSE 0 END), 0) AS todo,
        COALESCE(SUM(CASE WHEN status = 'in-progress' THEN 1 ELSE 0 END), 0) AS in_progress,
        COALESCE(SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END), 0) AS done
      FROM tasks${where}
    `).get(...params);
    return row;
  }

  static getPriorities() {
    return db.prepare(`
      SELECT priority, COUNT(*) AS count
      FROM tasks
      GROUP BY priority
      ORDER BY CASE priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 WHEN 'low' THEN 2 END
    `).all();
  }
}

module.exports = TaskModel;
