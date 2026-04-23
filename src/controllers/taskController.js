const { Task, Employee, Project, TaskComment, TaskFile, User } = require('../models');
const path = require('path');
const fs = require('fs');

// GET TASKS
exports.getTasks = async (req, res) => {
  const { project_id } = req.query;
  const where = {};
  if (project_id) where.project_id = project_id;

  // Employees can only read their own assigned tasks.
  if (req.user?.role_id === 4) {
    const employee = await Employee.findOne({ where: { user_id: req.user.id } });
    if (!employee) {
      return res.status(400).json({ message: 'Employee profile not found for this user' });
    }
    where.assigned_to = employee.id;
  }

  const tasks = await Task.findAll({
    where,
    include: [
      { model: Employee, as: 'employee', attributes: ['id', 'first_name', 'last_name'] },
      { model: Project, as: 'project' }
    ]
  });

  res.json({ tasks });
};

// GET MY TASKS
exports.getMyTasks = async (req, res) => {
  const employee = await Employee.findOne({ where: { user_id: req.user.id } });
  if (!employee) {
    return res.status(400).json({ message: 'Employee profile not found for this user' });
  }

  const tasks = await Task.findAll({
    where: { assigned_to: employee.id },
    include: [{ model: Project, as: 'project' }]
  });

  res.json({ tasks });
};

// CREATE TASK
exports.createTask = async (req, res) => {
  const [project, employee] = await Promise.all([
    Project.findByPk(req.body.project_id),
    Employee.findByPk(req.body.assigned_to)
  ]);

  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }
  if (!employee) {
    return res.status(404).json({ message: 'Assigned employee not found' });
  }

  const task = await Task.create(req.body);
  res.status(201).json({ message: 'Task created', task });
};

// UPDATE TASK
exports.updateTask = async (req, res) => {
  const task = await Task.findByPk(req.params.id);
  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }

  if (req.user?.role_id === 4) {
    const employee = await Employee.findOne({ where: { user_id: req.user.id } });
    if (!employee || task.assigned_to !== employee.id) {
      return res.status(403).json({ message: 'You can only update tasks assigned to you' });
    }
  }

  await task.update(req.body);
  res.json({ message: 'Task updated', task });
};

// DELETE TASK
exports.deleteTask = async (req, res) => {
  const task = await Task.findByPk(req.params.id);
  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }

  await task.destroy();
  res.json({ message: 'Task deleted' });
};

// COMMENTS
exports.addComment = async (req, res) => {
  const { task_id, comment } = req.body;
  const task = await Task.findByPk(task_id);
  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }

  const newComment = await TaskComment.create({
    task_id,
    user_id: req.user.id,
    comment
  });

  const finalComment = await TaskComment.findByPk(newComment.id, {
    include: [{ model: User, attributes: ['email'] }]
  });

  res.status(201).json({ message: 'Comment added', comment: finalComment });
};

exports.getComments = async (req, res) => {
  const comments = await TaskComment.findAll({
    where: { task_id: req.params.id },
    include: [{ model: User, attributes: ['email'] }]
  });

  res.json({ comments });
};

// FILE UPLOAD
exports.uploadFile = async (req, res) => {
  const { task_id } = req.body;
  const file = req.file;
  if (!file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const task = await Task.findByPk(task_id);
  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }

  const saved = await TaskFile.create({
    task_id,
    user_id: req.user.id,
    filename: file.filename,
    original_name: file.originalname,
    file_type: file.mimetype,
    size: file.size
  });

  res.status(201).json({ message: 'File uploaded', file: saved });
};

// GET FILES
exports.getFiles = async (req, res) => {
  const files = await TaskFile.findAll({ where: { task_id: req.params.id } });
  res.json({ files });
};

// DOWNLOAD FILE
exports.downloadFile = async (req, res) => {
  const file = await TaskFile.findByPk(req.params.id);
  if (!file) {
    return res.status(404).json({ message: 'File not found' });
  }

  const filePath = path.join(__dirname, '../../uploads/task_files', file.filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'Stored file not found on server' });
  }

  res.download(filePath, file.original_name);
};

// DELETE FILE
exports.deleteFile = async (req, res) => {
  const file = await TaskFile.findByPk(req.params.id);
  if (!file) {
    return res.status(404).json({ message: 'File not found' });
  }

  await file.destroy();
  res.json({ message: 'File deleted' });
};
