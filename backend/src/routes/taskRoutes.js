const { Router } = require('express');
const TaskController = require('../controllers/taskController');
const { validateCreate, validateUpdate } = require('../middleware/validation');

const router = Router();

router.get('/', TaskController.getAll);
router.get('/:id', TaskController.getById);
router.post('/', validateCreate, TaskController.create);
router.put('/:id', validateUpdate, TaskController.update);
router.delete('/:id', TaskController.delete);

module.exports = router;
