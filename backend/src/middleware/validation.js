function validateCreate(req, res, next) {
  const { title } = req.body;

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return res.status(400).json({ error: 'Title is required and must be a non-empty string' });
  }

  if (title.trim().length > 200) {
    return res.status(400).json({ error: 'Title must be at most 200 characters' });
  }

  if (req.body.description !== undefined && typeof req.body.description !== 'string') {
    return res.status(400).json({ error: 'Description must be a string' });
  }

  req.body.title = title.trim();
  if (req.body.description) req.body.description = req.body.description.trim();

  next();
}

function validateUpdate(req, res, next) {
  const { title, description, status } = req.body;

  if (title !== undefined) {
    if (typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ error: 'Title must be a non-empty string' });
    }
    if (title.trim().length > 200) {
      return res.status(400).json({ error: 'Title must be at most 200 characters' });
    }
    req.body.title = title.trim();
  }

  if (description !== undefined) {
    if (typeof description !== 'string') {
      return res.status(400).json({ error: 'Description must be a string' });
    }
    req.body.description = description.trim();
  }

  if (status !== undefined) {
    const allowed = ['todo', 'in-progress', 'done'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: 'Status must be: todo, in-progress, or done' });
    }
  }

  if (Object.keys(req.body).length === 0) {
    return res.status(400).json({ error: 'At least one field must be provided for update' });
  }

  next();
}

module.exports = { validateCreate, validateUpdate };
