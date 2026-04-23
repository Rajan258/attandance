const express = require('express');
const multer = require('multer');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const role = require('../middlewares/roleMiddleware');
const validate = require('../middlewares/validateMiddleware');
const asyncHandler = require('../middlewares/asyncHandler');
const importController = require('../controllers/importController');
const { attendanceImportBodySchema } = require('../validations/importValidation');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

router.use(auth);

router.get('/attendance/template', role(1, 2, 3), asyncHandler(importController.downloadAttendanceTemplate));
router.post(
  '/attendance/preview',
  role(1, 2, 3),
  upload.single('file'),
  validate(attendanceImportBodySchema),
  asyncHandler(importController.previewAttendanceImport)
);
router.post(
  '/attendance',
  role(1, 2, 3),
  upload.single('file'),
  validate(attendanceImportBodySchema),
  asyncHandler(importController.importAttendance)
);

module.exports = router;
