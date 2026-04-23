const { Op } = require('sequelize');
const { Employee, AttendanceLog, Leave, Project, Task } = require('../models');

exports.getOverview = async (req, res) => {
  const now = new Date();
  const today = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);

  const [
    totalEmployees,
    activeEmployees,
    terminatedEmployees,
    presentToday,
    onLeaveToday,
    projects,
    tasks,
    statusRows
  ] = await Promise.all([
    Employee.count(),
    Employee.count({ where: { status: 'ACTIVE' } }),
    Employee.count({ where: { status: 'TERMINATED' } }),
    AttendanceLog.count({ where: { date: today } }),
    Leave.count({
      where: {
        status: 'APPROVED',
        start_date: { [Op.lte]: today },
        end_date: { [Op.gte]: today }
      }
    }),
    Project.count(),
    Task.count(),
    Employee.findAll({
      attributes: ['status'],
      raw: true
    })
  ]);

  const statusCounts = statusRows.reduce(
    (acc, row) => {
      if (acc[row.status] !== undefined) {
        acc[row.status] += 1;
      }
      return acc;
    },
    {
      ACTIVE: 0,
      ON_NOTICE: 0,
      RESIGNED: 0,
      TERMINATED: 0
    }
  );

  return res.json({
    date: today,
    totalEmployees,
    activeEmployees,
    terminatedEmployees,
    presentToday,
    onLeaveToday,
    leavesToday: onLeaveToday,
    projects,
    tasks,
    statusCounts
  });
};
