const { Employee, User, Role } = require('../models');
const { hashPassword } = require('../utils/passwordUtil');

const getEmployeeWithUserOrNull = (id) =>
  Employee.findByPk(id, { include: [User] });

exports.getEmployees = async (req, res) => {
  const employees = await Employee.findAll({
    include: [{ model: User, include: [Role] }]
  });
  res.json(employees);
};

exports.getEmployeeById = async (req, res) => {
  const employee = await Employee.findByPk(req.params.id, {
    include: [{ model: User, include: [Role] }]
  });
  if (!employee) return res.status(404).json({ message: 'Employee not found' });
  res.json(employee);
};

exports.createEmployee = async (req, res) => {
  const t = await Employee.sequelize.transaction();
  try {
    const { email, password, role_id, ...employeeData } = req.body;

    const password_hash = await hashPassword(password);

    const user = await User.create(
      { email, password_hash, role_id },
      { transaction: t }
    );

    const employee = await Employee.create(
      { ...employeeData, user_id: user.id },
      { transaction: t }
    );

    await t.commit();
    res.status(201).json(employee);
  } catch (err) {
    await t.rollback();
    res.status(500).json({ message: 'Error creating employee', error: err.message });
  }
};

exports.updateEmployee = async (req, res) => {
  const employee = await Employee.findByPk(req.params.id);
  if (!employee) return res.status(404).json({ message: 'Employee not found' });

  await employee.update(req.body);
  res.json(employee);
};


// SOFT DELETE – employee ko TERMINATED mark + user ko inactive
exports.deleteEmployee = async (req, res) => {
  const employee = await getEmployeeWithUserOrNull(req.params.id);

  if (!employee) {
    return res.status(404).json({ message: 'Employee not found' });
  }

  // Employee status TERMINATED
  await employee.update({ status: 'TERMINATED' });

  // User ko inactive karo (login disable)
  if (employee.User) {
    await employee.User.update({ is_active: false });
  }

  res.json({ message: 'Employee terminated and user deactivated' });
};

// RESTORE – wapas ACTIVE + user ko active
exports.restoreEmployee = async (req, res) => {
  const employee = await getEmployeeWithUserOrNull(req.params.id);

  if (!employee) {
    return res.status(404).json({ message: 'Employee not found' });
  }

  // Sirf TERMINATED employee ko hi restore karna chahte hain
  if (employee.status !== 'TERMINATED') {
    return res.status(400).json({ message: 'Only terminated employees can be restored' });
  }

  await employee.update({ status: 'ACTIVE' });

  if (employee.User) {
    await employee.User.update({ is_active: true });
  }

  res.json({ message: 'Employee restored and user reactivated' });
};

exports.resetEmployeePassword = async (req, res) => {
  const { newPassword } = req.body;

  const employee = await getEmployeeWithUserOrNull(req.params.id);
  if (!employee || !employee.User) {
    return res.status(404).json({ message: 'Employee account not found' });
  }

  const password_hash = await hashPassword(newPassword);
  await employee.User.update({ password_hash, is_active: true });

  return res.json({ message: 'Employee password reset successfully' });
};
