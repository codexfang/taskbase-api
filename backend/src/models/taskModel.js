const db = require('../database/client');

class TaskModel {
  static async findAll(filters = {}) {
    let sql = 'SELECT * FROM tasks';
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
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    const sortBy = filters.sortBy === 'created_at' ? 'created_at' : 'created_at';
    const order = filters.order === 'asc' ? 'ASC' : 'DESC';
    sql += ` ORDER BY ${sortBy} ${order}`;

    let data = await db.query(sql, params);

    if (filters.limit) {
      const limit = Math.min(Math.max(parseInt(filters.limit, 10) || 50, 1), 100);
      const offset = Math.max(parseInt(filters.offset, 10) || 0, 0);
      data = data.slice(offset, offset + limit);
    }

    return data;
  }

  static async findById(id) {
    return db.get('SELECT * FROM tasks WHERE id = ?', [id]);
  }

  static async create(task) {
    await db.run(
      'INSERT INTO tasks (id, title, description, status, priority, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [task.id, task.title, task.description, task.status, task.priority, task.createdAt, task.updatedAt]
    );
    return this.findById(task.id);
  }

  static async update(id, fields) {
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

    sets.push('updated_at = datetime(\'now\')');
    params.push(id);

    await db.run(`UPDATE tasks SET ${sets.join(', ')} WHERE id = ?`, params);
    return this.findById(id);
  }

  static async delete(id) {
    const task = await this.findById(id);
    if (task) {
      await db.run('DELETE FROM tasks WHERE id = ?', [id]);
    }
    return task;
  }

  static async getStats(filters = {}) {
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

    return db.get(`
      SELECT
        COUNT(*) AS total,
        COALESCE(SUM(CASE WHEN status = 'todo' THEN 1 ELSE 0 END), 0) AS todo,
        COALESCE(SUM(CASE WHEN status = 'in-progress' THEN 1 ELSE 0 END), 0) AS in_progress,
        COALESCE(SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END), 0) AS done
      FROM tasks${where}
    `, params);
  }

  static async getPriorities() {
    return db.query(`
      SELECT priority, COUNT(*) AS count
      FROM tasks
      GROUP BY priority
      ORDER BY CASE priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 WHEN 'low' THEN 2 END
    `);
  }
}

module.exports = TaskModel;
