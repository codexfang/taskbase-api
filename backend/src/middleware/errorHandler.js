function errorHandler(err, req, res, _next) {
  console.error(err);

  const status = err.status || 500;
  const message = err.status ? err.message : 'Internal server error';

  res.status(status).json({ error: message, detail: err.message, stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined });
}

module.exports = errorHandler;
