const test = require('node:test');
const assert = require('node:assert/strict');

const {
  loginSchema,
  forgotPasswordSchema,
  changePasswordSchema,
  refreshTokenSchema
} = require('../src/validations/authValidation');
const {
  createEmployeeSchema,
  updateEmployeeSchema,
  resetEmployeePasswordSchema
} = require('../src/validations/employeeValidation');
const { idParamSchema } = require('../src/validations/commonValidation');
const {
  applyLeaveSchema,
  updateLeaveStatusSchema
} = require('../src/validations/leaveValidation');
const {
  createSalaryStructureSchema,
  generatePayrollSchema,
  payrollAdminQuerySchema
} = require('../src/validations/payrollValidation');
const {
  createProjectSchema,
  updateProjectSchema
} = require('../src/validations/projectValidation');
const {
  createTaskSchema,
  updateTaskSchema,
  addCommentSchema,
  uploadTaskFileSchema,
  taskListQuerySchema
} = require('../src/validations/taskValidation');

test('auth schemas validate expected constraints', () => {
  assert.equal(loginSchema.validate({ email: 'a@b.com', password: 'x' }).error, undefined);
  assert.ok(forgotPasswordSchema.validate({ email: 'a@b.com', newPassword: 'short' }).error);
  assert.ok(changePasswordSchema.validate({ currentPassword: '', newPassword: '12345678' }).error);
  assert.equal(refreshTokenSchema.validate({ token: 'refresh-token' }).error, undefined);
});

test('employee schemas enforce required fields and min password length', () => {
  assert.ok(
    createEmployeeSchema.validate({
      email: 'user@example.com',
      password: '1234567',
      role_id: 2,
      employee_code: 'EMP-001'
    }).error
  );

  assert.equal(
    createEmployeeSchema.validate({
      email: 'user@example.com',
      password: '12345678',
      role_id: 2,
      employee_code: 'EMP-001'
    }).error,
    undefined
  );

  assert.ok(updateEmployeeSchema.validate({}).error);
  assert.equal(resetEmployeePasswordSchema.validate({ newPassword: '12345678' }).error, undefined);
});

test('common id params schema requires positive integers', () => {
  assert.equal(idParamSchema.validate({ id: 5 }).error, undefined);
  assert.ok(idParamSchema.validate({ id: 0 }).error);
  assert.ok(idParamSchema.validate({ id: 'abc' }).error);
});

test('leave schemas validate required fields and allowed status', () => {
  assert.equal(
    applyLeaveSchema.validate({
      leave_type_id: 1,
      start_date: '2026-02-01',
      end_date: '2026-02-02',
      days: 1
    }).error,
    undefined
  );
  assert.ok(updateLeaveStatusSchema.validate({ status: 'PENDING' }).error);
});

test('payroll schemas validate month format and numeric fields', () => {
  assert.equal(
    createSalaryStructureSchema.validate({
      employee_id: 1,
      basic: 1000,
      hra: 500,
      effective_from: '2026-02-01'
    }).error,
    undefined
  );
  assert.ok(generatePayrollSchema.validate({ employee_id: 1, month: '2026-13' }).error);
  assert.equal(payrollAdminQuerySchema.validate({ month: '2026-12' }).error, undefined);
});

test('project schemas validate create and update payloads', () => {
  assert.equal(createProjectSchema.validate({ name: 'Website Revamp' }).error, undefined);
  assert.ok(updateProjectSchema.validate({}).error);
});

test('task schemas validate task, comment, upload and query payloads', () => {
  assert.equal(
    createTaskSchema.validate({
      project_id: 1,
      assigned_to: 2,
      title: 'Implement API',
      priority: 'MEDIUM'
    }).error,
    undefined
  );
  assert.ok(updateTaskSchema.validate({ status: 'INVALID' }).error);
  assert.equal(addCommentSchema.validate({ task_id: 1, comment: 'Looks good' }).error, undefined);
  assert.equal(uploadTaskFileSchema.validate({ task_id: 1 }).error, undefined);
  assert.equal(taskListQuerySchema.validate({ project_id: 8 }).error, undefined);
});
