const { Leave, LeaveType, Employee, User } = require('../models');
const { Op } = require('sequelize');

// Helper: logged-in user -> employee
const getEmployeeForUser = async (userId) => {
  return Employee.findOne({ where: { user_id: userId } });
};

// Employee applies for leave
exports.applyLeave = async (req, res) => {
  const userId = req.user.id;
  const { leave_type_id, start_date, end_date, days, reason } = req.body;

  const employee = await getEmployeeForUser(userId);
  if (!employee) {
    return res.status(400).json({ message: 'Employee profile not found for this user' });
  }

  // basic validation: end_date >= start_date
  if (end_date < start_date) {
    return res.status(400).json({ message: 'end_date cannot be before start_date' });
  }

  const leave = await Leave.create({
    employee_id: employee.id,
    leave_type_id,
    start_date,
    end_date,
    days,
    reason,
    status: 'PENDING'
  });

  res.status(201).json({ message: 'Leave applied successfully', leave });
};

// Logged-in employee's own leave list
exports.getMyLeaves = async (req, res) => {
  const userId = req.user.id;
  const { from, to } = req.query;

  const employee = await getEmployeeForUser(userId);
  if (!employee) {
    return res.status(400).json({ message: 'Employee profile not found for this user' });
  }

  const where = { employee_id: employee.id };

  if (from && to) {
    where.start_date = { [Op.gte]: from };
    where.end_date = { [Op.lte]: to };
  }

  const leaves = await Leave.findAll({
    where,
    include: [{ model: LeaveType, as: 'leaveType' }],
    order: [['start_date', 'DESC']]
  });

  res.json({ leaves });
};

// Admin / HR / Manager: list all leaves (filter by status optional)
exports.getAllLeaves = async (req, res) => {
  const { status } = req.query;

  const where = {};
  if (status) {
    where.status = status;
  }

  const leaves = await Leave.findAll({
    where,
    include: [
      { model: LeaveType, as: 'leaveType' },
      {
        model: Employee,
        as: 'employee',
        include: [{ model: User, attributes: ['email'] }]
      }
    ],
    order: [['start_date', 'DESC']]
  });

  res.json({ leaves });
};

// Approve / Reject leave
exports.updateLeaveStatus = async (req, res) => {
  const approverUserId = req.user.id;
  const { id } = req.params;
  const { status } = req.body; // APPROVED / REJECTED / CANCELLED

  const leave = await Leave.findByPk(id);
  if (!leave) {
    return res.status(404).json({ message: 'Leave not found' });
  }

  if (leave.status !== 'PENDING') {
    return res.status(400).json({ message: 'Only PENDING leaves can be updated' });
  }

  leave.status = status;
  leave.approved_by_id = approverUserId;
  leave.approved_at = new Date();

  await leave.save();

  res.json({ message: 'Leave status updated', leave });
};

// List leave types (for dropdown)
exports.getLeaveTypes = async (req, res) => {
  const types = await LeaveType.findAll({ order: [['name', 'ASC']] });
  res.json(types);
};
