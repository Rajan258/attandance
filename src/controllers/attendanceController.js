const { AttendanceLog, Employee, User } = require('../models');
const { Op } = require('sequelize');

// helper: logged in user -> employee_id
const getEmployeeForUser = async (userId) => {
  const employee = await Employee.findOne({ where: { user_id: userId } });
  return employee;
};

exports.punchIn = async (req, res) => {
  const userId = req.user.id;

  const employee = await getEmployeeForUser(userId);
  if (!employee) {
    return res.status(400).json({ message: 'Employee profile not found for this user' });
  }

  const todayStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  let log = await AttendanceLog.findOne({
    where: { employee_id: employee.id, date: todayStr }
  });

  if (log && log.punch_in) {
    return res.status(400).json({ message: 'Already punched in for today' });
  }

  const now = new Date();

  if (!log) {
    log = await AttendanceLog.create({
      employee_id: employee.id,
      date: todayStr,
      punch_in: now
    });
  } else {
    await log.update({ punch_in: now });
  }

  // Simple late_flag example: 9:15 ke baad late
  const hour = now.getHours();
  const minute = now.getMinutes();
  const isLate = hour > 9 || (hour === 9 && minute > 15);

  await log.update({ late_flag: isLate });

  res.json({ message: 'Punched in', log });
};

exports.punchOut = async (req, res) => {
  const userId = req.user.id;
  const employee = await getEmployeeForUser(userId);
  if (!employee) {
    return res.status(400).json({ message: 'Employee profile not found for this user' });
  }

  const todayStr = new Date().toISOString().slice(0, 10);

  let log = await AttendanceLog.findOne({
    where: { employee_id: employee.id, date: todayStr }
  });

  if (!log || !log.punch_in) {
    return res.status(400).json({ message: 'Punch in first before punch out' });
  }

  if (log.punch_out) {
    return res.status(400).json({ message: 'Already punched out for today' });
  }

  const now = new Date();

  const totalMs = now.getTime() - new Date(log.punch_in).getTime();
  const totalHours = totalMs / (1000 * 60 * 60); // ms to hours

  // Early exit example: agar totalHours < 8 ho to early_exit_flag = true
  const earlyExit = totalHours < 8;

  await log.update({
    punch_out: now,
    total_hours: totalHours.toFixed(2),
    early_exit_flag: earlyExit
  });

  res.json({ message: 'Punched out', log });
};

exports.getMyAttendance = async (req, res) => {
  const userId = req.user.id;
  const { range = 'monthly' } = req.query;

  const employee = await getEmployeeForUser(userId);
  if (!employee) {
    return res.status(400).json({ message: 'Employee profile not found for this user' });
  }

  const now = new Date();
  let fromDate;

  if (range === 'daily') {
    fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (range === 'weekly') {
    const day = now.getDay(); // 0=Sunday
    fromDate = new Date(now);
    fromDate.setDate(now.getDate() - day); // simple week start (Sunday)
  } else { // monthly default
    fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const logs = await AttendanceLog.findAll({
    where: {
      employee_id: employee.id,
      date: { [Op.gte]: fromDate.toISOString().slice(0, 10) }
    },
    order: [['date', 'DESC']]
  });

  res.json({ logs });
};


// ... pehle se punchIn, punchOut, getMyAttendance defined hain

// ADMIN / HR: ek particular date ke liye sab employees ka attendance
exports.getAttendanceForDayAdmin = async (req, res) => {
  const { date } = req.query; // expected format: YYYY-MM-DD

  const targetDate = date || new Date().toISOString().slice(0, 10);

  // Saare Employees + unka attendance log us date ke liye
  const employees = await Employee.findAll({
    include: [
      {
        model: User,
        attributes: ['email', 'role_id', 'is_active']
      },
      {
        model: AttendanceLog,
        required: false,
        where: { date: targetDate }
      }
    ],
    order: [['employee_code', 'ASC']]
  });

  // Response ko clean format me map karein
  const data = employees.map((emp) => {
    const log = (emp.AttendanceLogs && emp.AttendanceLogs[0]) || null;

    return {
      employee_id: emp.id,
      employee_code: emp.employee_code,
      first_name: emp.first_name,
      last_name: emp.last_name,
      status: emp.status,
      user_email: emp.User?.email,
      user_role_id: emp.User?.role_id,
      is_active: emp.User?.is_active,
      attendance: log
        ? {
            id: log.id,
            date: log.date,
            punch_in: log.punch_in,
            punch_out: log.punch_out,
            total_hours: log.total_hours,
            late_flag: log.late_flag,
            early_exit_flag: log.early_exit_flag
          }
        : null
    };
  });

  res.json({
    date: targetDate,
    records: data
  });
};
