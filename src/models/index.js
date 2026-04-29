const sequelize = require('../config/db');
const { DB_SYNC_ALTER, DB_SYNC_FORCE, ALLOW_DB_SYNC } = require('../config/config');
const logger = require('../config/logger');
const { findMissingTables } = require('./dbSyncPolicy');

const Role = require('./Role');
const User = require('./User');
const Employee = require('./Employee');
const RefreshToken = require('./RefreshToken');
const AttendanceLog = require('./AttendanceLog');      // 👈 NEW
const { hashPassword } = require('../utils/passwordUtil');
const LeaveType = require('./LeaveType');
const Leave = require('./Leave');
const SalaryStructure = require('./SalaryStructure');
const Payroll = require('./Payroll');
const Project = require('./Project');
const Task = require('./Task');
const TaskComment = require('./TaskComment');
const ActivityLog = require('./ActivityLog');
const TaskFile = require('./TaskFile');
const ImportExportLog = require('./ImportExportLog');





// Relations
// User -> Employee reverse relation (optional but useful)
User.hasOne(Employee, { foreignKey: 'user_id' });
Employee.belongsTo(User, { foreignKey: 'user_id' });
Employee.hasMany(AttendanceLog, { foreignKey: 'employee_id' });
AttendanceLog.belongsTo(Employee, { foreignKey: 'employee_id' });
// Employee ↔ Leave
Employee.hasMany(Leave, { foreignKey: 'employee_id', as: 'leaves' });
Leave.belongsTo(Employee, { foreignKey: 'employee_id', as: 'employee' });

// LeaveType ↔ Leave
LeaveType.hasMany(Leave, { foreignKey: 'leave_type_id', as: 'leaves' });
Leave.belongsTo(LeaveType, { foreignKey: 'leave_type_id', as: 'leaveType' });
Employee.hasOne(SalaryStructure, { foreignKey: 'employee_id', as: 'salary' });
SalaryStructure.belongsTo(Employee, { foreignKey: 'employee_id' });

Employee.hasMany(Payroll, { foreignKey: 'employee_id', as: 'payrolls' });
Payroll.belongsTo(Employee, { foreignKey: 'employee_id', as: 'employee' });

// Project → Tasks
Project.hasMany(Task, { foreignKey: 'project_id', as: 'tasks' });
Task.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });

// Employee → Tasks
Employee.hasMany(Task, { foreignKey: 'assigned_to', as: 'assignedTasks' });
Task.belongsTo(Employee, { foreignKey: 'assigned_to', as: 'employee' });



// Task → Comments
Task.hasMany(TaskComment, { foreignKey: 'task_id', as: 'comments' });
TaskComment.belongsTo(Task, { foreignKey: 'task_id' });

// User → Comments
User.hasMany(TaskComment, { foreignKey: 'user_id', as: 'taskComments' });
TaskComment.belongsTo(User, { foreignKey: 'user_id' });

// Task → Activity logs
Task.hasMany(ActivityLog, { foreignKey: 'task_id', as: 'activity' });
ActivityLog.belongsTo(Task, { foreignKey: 'task_id' });

// User → Activity logs
User.hasMany(ActivityLog, { foreignKey: 'user_id', as: 'activityLogs' });
ActivityLog.belongsTo(User, { foreignKey: 'user_id' });

Task.hasMany(TaskFile, { foreignKey: 'task_id', as: 'files' });
TaskFile.belongsTo(Task, { foreignKey: 'task_id' });

User.hasMany(TaskFile, { foreignKey: 'user_id', as: 'uploadedFiles' });
TaskFile.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(ImportExportLog, { foreignKey: 'user_id', as: 'importExportLogs' });
ImportExportLog.belongsTo(User, { foreignKey: 'user_id' });







// DB sync + seed data
const REQUIRED_TABLES = ['roles', 'users', 'employees', 'refresh_tokens', 'leave_types'];

const getSyncDecision = async () => {
  await sequelize.authenticate();

  if (ALLOW_DB_SYNC) {
    return { shouldSync: true, reason: 'ALLOW_DB_SYNC enabled', missingTables: [] };
  }

  const existingTables = await sequelize.getQueryInterface().showAllTables();
  const missingTables = findMissingTables(existingTables, REQUIRED_TABLES);

  if (missingTables.length === 0) {
    return { shouldSync: false, reason: 'required tables already exist', missingTables: [] };
  }

  return {
    shouldSync: true,
    reason: 'required tables are missing',
    missingTables
  };
};

const syncDb = async () => {
  const syncDecision = await getSyncDecision();

  if (!syncDecision.shouldSync) {
    logger.info({
      message: 'Database schema check passed without sync',
      reason: syncDecision.reason
    });
    return;
  }

  const syncOptions = {};
  if (DB_SYNC_FORCE) syncOptions.force = true;
  else if (DB_SYNC_ALTER) syncOptions.alter = true;

  logger.info({
    message: 'Running database sync',
    reason: syncDecision.reason,
    missingTables: syncDecision.missingTables,
    syncOptions
  });
  await sequelize.sync(syncOptions);

  // 1) Roles seed
  const roleCount = await Role.count();
  if (roleCount === 0) {
    await Role.bulkCreate([
      { id: 1, name: 'ADMIN' },
      { id: 2, name: 'HR' },
      { id: 3, name: 'MANAGER' },
      { id: 4, name: 'EMPLOYEE' }
    ]);
    console.log('Seeded default roles');
  }

  // 2) Default admin user
  const adminEmail = 'admin@ems.com';
  let adminUser = await User.findOne({ where: { email: adminEmail } });

  if (!adminUser) {
    const password_hash = await hashPassword('Admin@12345');

    adminUser = await User.create({
      email: adminEmail,
      password_hash,
      role_id: 1,   // ADMIN
      is_active: true
    });

    console.log('Created default admin user:', adminEmail);
  }

  // 3) Default admin employee profile (for attendance etc.)
  let adminEmployee = await Employee.findOne({ where: { user_id: adminUser.id } });

  if (!adminEmployee) {
    adminEmployee = await Employee.create({
      user_id: adminUser.id,
      employee_code: 'ADM-001',
      first_name: 'System',
      last_name: 'Admin',
      status: 'ACTIVE'
    });

    console.log('Created default admin employee profile with code ADM-001');
  }

    // 4) Default leave types
    const leaveTypeCount = await LeaveType.count();
    if (leaveTypeCount === 0) {
      await LeaveType.bulkCreate([
        { code: 'SICK', name: 'Sick Leave', is_paid: true },
        { code: 'CASUAL', name: 'Casual Leave', is_paid: true },
        { code: 'PAID', name: 'Paid Leave', is_paid: true },
        { code: 'UNPAID', name: 'Unpaid Leave', is_paid: false }
      ]);
      console.log('Seeded default leave types');
    }
  
};


module.exports = {
  sequelize,
  syncDb,
  Role,
  User,
  Employee,
  RefreshToken,
  AttendanceLog,
  LeaveType,
  Leave,
  SalaryStructure,
Payroll,
  Project,
  Task,
  TaskComment,
  ActivityLog,
  TaskFile,
  ImportExportLog,


};
