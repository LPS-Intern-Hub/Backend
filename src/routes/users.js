const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { auth, authorize } = require('../middlewares/auth');

// All user routes require admin privilege for now
router.use(auth, authorize('admin'));

router.get('/', userController.getAllUsers);
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.put('/:id/role', userController.editUserRole);
router.put('/:id/status', userController.toggleUserStatus);
router.put('/:id/reset-password', userController.resetPassword);

module.exports = router;
