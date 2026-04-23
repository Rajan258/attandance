const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const asyncHandler = require('../middlewares/asyncHandler');
const auth = require('../middlewares/authMiddleware');
const role = require('../middlewares/roleMiddleware');
const validate = require('../middlewares/validateMiddleware');
const { idParamSchema } = require('../validations/commonValidation');
const {
  createProjectSchema,
  updateProjectSchema
} = require('../validations/projectValidation');

router.use(auth);

router.get('/', role(1, 2, 3, 4), asyncHandler(projectController.getProjects));
router.post('/', role(1, 2), validate(createProjectSchema), asyncHandler(projectController.createProject));

router.get('/:id', role(1, 2, 3, 4), validate(idParamSchema, 'params'), asyncHandler(projectController.getProjectById));
router.put(
  '/:id',
  role(1, 2),
  validate(idParamSchema, 'params'),
  validate(updateProjectSchema),
  asyncHandler(projectController.updateProject)
);
router.delete('/:id', role(1, 2), validate(idParamSchema, 'params'), asyncHandler(projectController.deleteProject));

module.exports = router;
