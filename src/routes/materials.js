const express = require('express');
const router = express.Router();
const materialController = require('../controllers/materialController');
const { auth, authorize } = require('../middlewares/auth');
const uploadMaterial = require('../middlewares/uploadMaterial');

/**
 * @swagger
 * tags:
 *   name: Materials
 *   description: Learning materials for interns
 */

router.get('/', auth, materialController.getAllMaterials);

router.post(
    '/',
    auth,
    authorize('mentor', 'admin'),
    uploadMaterial.single('file'),
    materialController.createMaterial
);

router.delete(
    '/:id',
    auth,
    authorize('mentor', 'admin'),
    materialController.deleteMaterial
);

module.exports = router;
