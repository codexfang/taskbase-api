const app = require('./src/app');
const { migrate } = require('./src/database/client');

const PORT = process.env.PORT || 3001;

migrate().then(() => {
  app.listen(PORT, () => {
    console.log(`Taskbase API running on http://localhost:${PORT}`);
  });
});
