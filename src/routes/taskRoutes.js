const express = require('express');
const router = express.Router();

const taskController = require('../controllers/taskController');
const asyncHandler = require('../middlewares/asyncHandler');
const auth = require('../middlewares/authMiddleware');
const role = require('../middlewares/roleMiddleware');
const upload = require('../utils/upload');
const validate = require('../middlewares/validateMiddleware');
const { idParamSchema } = require('../validations/commonValidation');
const {
  createTaskSchema,
  updateTaskSchema,
  addCommentSchema,
  uploadTaskFileSchema,
  taskListQuerySchema
} = require('../validations/taskValidation');

// AUTH required for all
router.use(auth);

// CRUD for tasks
router.get('/', role(1, 2, 3, 4), validate(taskListQuerySchema, 'query'), asyncHandler(taskController.getTasks));
router.post('/', role(1, 2), validate(createTaskSchema), asyncHandler(taskController.createTask));
router.put('/:id', role(1, 2, 3, 4), validate(idParamSchema, 'params'), validate(updateTaskSchema), asyncHandler(taskController.updateTask));
router.delete('/:id', role(1, 2), validate(idParamSchema, 'params'), asyncHandler(taskController.deleteTask));

// Employee → My Tasks
router.get('/my/tasks', role(1, 2, 3, 4), asyncHandler(taskController.getMyTasks));

// Comments
router.post('/comment', role(1, 2, 3, 4), validate(addCommentSchema), asyncHandler(taskController.addComment));
router.get('/:id/comments', role(1, 2, 3, 4), validate(idParamSchema, 'params'), asyncHandler(taskController.getComments));

// Files
router.post('/upload', upload.single('file'), validate(uploadTaskFileSchema), asyncHandler(taskController.uploadFile));
router.get('/:id/files', validate(idParamSchema, 'params'), asyncHandler(taskController.getFiles));
router.get('/file/download/:id', validate(idParamSchema, 'params'), asyncHandler(taskController.downloadFile));
router.delete('/file/:id', role(1, 2), validate(idParamSchema, 'params'), asyncHandler(taskController.deleteFile));

module.exports = router;
