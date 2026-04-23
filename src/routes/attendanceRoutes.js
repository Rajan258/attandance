const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const asyncHandler = require('../middlewares/asyncHandler');
const auth = require('../middlewares/authMiddleware');
const role = require('../middlewares/roleMiddleware');

router.use(auth);

// Punch In/Out – sab roles (Admin, HR, Manager, Employee) use kar sakte hain
router.post('/punch-in', role(1, 2, 3, 4), asyncHandler(attendanceController.punchIn));
router.post('/punch-out', role(1, 2, 3, 4), asyncHandler(attendanceController.punchOut));

// Logged-in user ke liye attendance history
router.get('/me', role(1, 2, 3, 4), asyncHandler(attendanceController.getMyAttendance));

// Admin / HR / Manager – ek din ka attendance sab employees ka
router.get('/admin/day', role(1, 2, 3), asyncHandler(attendanceController.getAttendanceForDayAdmin));


module.exports = router;
