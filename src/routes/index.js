const express = require('express');
const router = express.Router();

router.use('/health', require('./healthRoutes'));
router.use('/auth', require('./authRoutes'));
router.use('/import', require('./importRoutes'));
router.use('/export', require('./exportRoutes'));
router.use('/employees', require('./employeeRoutes'));
router.use('/attendance', require('./attendanceRoutes'));
router.use('/leaves', require('./leaveRoutes'));
router.use('/dashboard', require('./dashboardRoutes'));
router.use('/payroll', require('./payrollRoutes'));
router.use('/projects', require('./projectRoutes'));
router.use('/tasks', require('./taskRoutes'));

module.exports = router;
