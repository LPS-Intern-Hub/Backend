const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { auth, authorize } = require('../middlewares/auth');

// Get tasks (any authenticated user can see tasks relevant to them)
router.get('/', auth, taskController.getTasks);

// Create task (Mentor or Admin)
router.post('/', auth, authorize('mentor', 'admin'), taskController.createTask);

// Update task details (Mentor or Admin)
router.put('/:id', auth, authorize('mentor', 'admin'), taskController.updateTask);

// Update task status (Intern, Mentor, or Admin)
router.patch('/:id/status', auth, taskController.updateTaskStatus);

// Delete task (Mentor or Admin)
router.delete('/:id', auth, authorize('mentor', 'admin'), taskController.deleteTask);

module.exports = router;
