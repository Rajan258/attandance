const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const role = require('../middlewares/roleMiddleware');
const validate = require('../middlewares/validateMiddleware');
const asyncHandler = require('../middlewares/asyncHandler');
const exportController = require('../controllers/exportController');
const { exportQuerySchema, exportJobParamsSchema, exportLogsQuerySchema } = require('../validations/exportValidation');
const { EXPORT_SCOPES } = require('../services/exportService');

router.use(auth);

const withScope = (scope) => (req, res, next) => {
  req.query.scope = scope;
  next();
};

router.get('/templates', role(1, 2, 3), asyncHandler(exportController.getExportTemplatesHandler));
router.get('/jobs/:id', role(1, 2, 3), validate(exportJobParamsSchema, 'params'), asyncHandler(exportController.getExportJobHandler));
router.get('/logs', role(1, 2, 3), validate(exportLogsQuerySchema, 'query'), asyncHandler(exportController.getImportExportLogsHandler));

router.get('/employees', role(1, 2, 3), withScope(EXPORT_SCOPES.EMPLOYEES), validate(exportQuerySchema, 'query'), asyncHandler(exportController.exportDataHandler));
router.get('/attendance', role(1, 2, 3), withScope(EXPORT_SCOPES.ATTENDANCE), validate(exportQuerySchema, 'query'), asyncHandler(exportController.exportDataHandler));
router.get('/leaves', role(1, 2, 3), withScope(EXPORT_SCOPES.LEAVES), validate(exportQuerySchema, 'query'), asyncHandler(exportController.exportDataHandler));
router.get('/payroll', role(1, 2, 3), withScope(EXPORT_SCOPES.PAYROLL), validate(exportQuerySchema, 'query'), asyncHandler(exportController.exportDataHandler));
router.get('/projects-tasks', role(1, 2, 3), withScope(EXPORT_SCOPES.PROJECTS_TASKS), validate(exportQuerySchema, 'query'), asyncHandler(exportController.exportDataHandler));
router.get('/audit-logs', role(1, 2, 3), withScope(EXPORT_SCOPES.AUDIT_LOGS), validate(exportQuerySchema, 'query'), asyncHandler(exportController.exportDataHandler));

module.exports = router;
