const { Employee, AttendanceLog, SalaryStructure, Payroll, Leave, User } = require('../models');
const { Op } = require('sequelize');
const PDFDocument = require('pdfkit');
const sequelize = require('../config/db');

// helper: logged-in user ka employee
const getEmployeeForUser = async (userId) => {
  return Employee.findOne({ where: { user_id: userId } });
};

exports.createSalaryStructure = async (req, res) => {
  const { employee_id, basic, hra, allowances, deductions, pf, esi, tds, effective_from } = req.body;
  const employee = await Employee.findByPk(employee_id);
  if (!employee) {
    return res.status(404).json({ message: 'Employee not found' });
  }

  const structure = await SalaryStructure.create({
    employee_id,
    basic,
    hra,
    allowances,
    deductions,
    pf,
    esi,
    tds,
    effective_from
  });

  res.status(201).json({ message: 'Salary structure saved', structure });
};

exports.generateMonthlyPayroll = async (req, res) => {
  const { employee_id, month } = req.body; // month = "2025-12"
  const employee = await Employee.findByPk(employee_id);
  if (!employee) {
    return res.status(404).json({ message: 'Employee not found' });
  }

  const [year, mm] = month.split('-');

  // month date range (end date is actual last day of month)
  const startDate = `${year}-${mm}-01`;
  const endDate = new Date(Number(year), Number(mm), 0).toISOString().slice(0, 10);

  // Attendance counts
  const presentCount = await AttendanceLog.count({
    where: {
      employee_id,
      date: {
        [Op.between]: [startDate, endDate]
      },
      punch_in: { [Op.ne]: null }
    }
  });

  // Leave counts
  const leaves = await Leave.findAll({
    where: {
      employee_id,
      status: 'APPROVED',
      start_date: { [Op.lte]: endDate },
      end_date: { [Op.gte]: startDate }
    }
  });

  let paidLeaves = 0;
  let unpaidLeaves = 0;

  for (const lv of leaves) {
    if (lv.leave_type_id === 4) unpaidLeaves += lv.days; // UNPAID
    else paidLeaves += lv.days;
  }

  // Working days in month (assume 30 for simplicity)
  const workingDays = 30;
  const absent = workingDays - presentCount - paidLeaves;

  // Salary structure
  const structure = await SalaryStructure.findOne({ where: { employee_id } });
  if (!structure) {
    return res.status(404).json({ message: 'Salary structure not found for employee' });
  }

  const gross =
    Number(structure.basic) +
    Number(structure.hra) +
    Number(structure.allowances);

  const totalDeduction =
    Number(structure.deductions)
    + Number(structure.pf)
    + Number(structure.esi)
    + Number(structure.tds)
    + (unpaidLeaves * (gross / workingDays));

  const net = gross - totalDeduction;

  const payroll = await Payroll.create({
    employee_id,
    month,
    present_days: presentCount,
    paid_leaves: paidLeaves,
    unpaid_leaves: unpaidLeaves,
    absent_days: absent,
    gross_salary: gross,
    total_deductions: totalDeduction,
    net_salary: net
  });

  res.json({ message: 'Payroll generated', payroll });
};

// Logged-in employee ka payroll list
exports.getMyPayrolls = async (req, res) => {
  const userId = req.user.id;
  const employee = await getEmployeeForUser(userId);

  if (!employee) {
    return res.status(400).json({ message: 'Employee profile not found for this user' });
  }

  const payrolls = await Payroll.findAll({
    where: { employee_id: employee.id },
    order: [['month', 'DESC']]
  });

  res.json({ payrolls });
};

// Admin/HR: sab ka payroll list (optional month filter)
exports.getPayrollsAdmin = async (req, res) => {
  const { month } = req.query;

  const where = {};
  if (month) where.month = month;

  const payrolls = await Payroll.findAll({
    where,
    include: [
      {
        model: Employee,
        as: 'employee',
        include: [{ model: User, attributes: ['email'] }]
      }
    ],
    order: [['month', 'DESC']]
  });

  res.json({ payrolls });
};

exports.getSalarySlipPDF = async (req, res) => {
  const payrollId = req.params.id;

  const payroll = await Payroll.findOne({
    where: { id: payrollId },
    include: [
      {
        model: Employee,
        as: 'employee',
        include: [{ model: User, attributes: ['email'] }]
      },
      {
        model: SalaryStructure,
        where: { employee_id: sequelize.col('Payroll.employee_id') }
      }
    ]
  });

  if (!payroll) {
    return res.status(404).json({ message: 'Payroll record not found' });
  }
  if (!payroll.SalaryStructure) {
    return res.status(404).json({ message: 'Salary structure not found for payroll employee' });
  }
  const emp = payroll.employee;
  const user = emp.User;
  const s = payroll.SalaryStructure;

  // Create PDF
  const doc = new PDFDocument();

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'inline; filename="salary-slip.pdf"');
  doc.pipe(res);

  doc.fontSize(20).text('Company Name Pvt. Ltd', { align: 'center' });
  doc.fontSize(14).text(`Salary Slip – ${payroll.month}`, { align: 'center' });
  doc.moveDown(2);

  doc.fontSize(12).text(`Employee Name: ${emp.first_name} ${emp.last_name}`);
  doc.text(`Employee ID: ${emp.id}`);
  doc.text(`Email: ${user.email}`);
  doc.text(`Status: ${emp.status}`);
  doc.moveDown();

  doc.fontSize(14).text('Earnings', { underline: true });
  doc.fontSize(12).text(`Basic: Rs. ${s.basic}`);
  doc.text(`HRA: Rs. ${s.hra}`);
  doc.text(`Allowances: Rs. ${s.allowances}`);
  doc.moveDown();

  doc.fontSize(14).text('Deductions', { underline: true });
  doc.fontSize(12).text(`PF: Rs. ${s.pf}`);
  doc.text(`ESI: Rs. ${s.esi}`);
  doc.text(`TDS: Rs. ${s.tds}`);
  doc.text(`Other: Rs. ${s.deductions}`);
  doc.moveDown();

  doc.fontSize(14).text(`Net Salary: Rs. ${payroll.net_salary}`, { underline: true });
  doc.moveDown(2);
  doc.fontSize(10).text('This is a system generated salary slip.', { align: 'center' });

  doc.end();
};
