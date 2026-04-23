const { Project, Task, Employee } = require('../models');

exports.createProject = async (req, res) => {
  const project = await Project.create(req.body);
  res.status(201).json({ message: 'Project created', project });
};

exports.getProjects = async (req, res) => {
  if (req.user?.role_id === 4) {
    const employee = await Employee.findOne({ where: { user_id: req.user.id } });
    if (!employee) {
      return res.status(400).json({ message: 'Employee profile not found for this user' });
    }

    const projects = await Project.findAll({
      include: [{ model: Task, as: 'tasks', where: { assigned_to: employee.id }, required: true }]
    });
    return res.json({ projects });
  }

  const projects = await Project.findAll({
    include: [{ model: Task, as: 'tasks' }]
  });
  res.json({ projects });
};

exports.getProjectById = async (req, res) => {
  if (req.user?.role_id === 4) {
    const employee = await Employee.findOne({ where: { user_id: req.user.id } });
    if (!employee) {
      return res.status(400).json({ message: 'Employee profile not found for this user' });
    }

    const project = await Project.findOne({
      where: { id: req.params.id },
      include: [{ model: Task, as: 'tasks', where: { assigned_to: employee.id }, required: true }]
    });
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    return res.json({ project });
  }

  const project = await Project.findOne({
    where: { id: req.params.id },
    include: [{ model: Task, as: 'tasks' }]
  });
  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }
  res.json({ project });
};

exports.updateProject = async (req, res) => {
  const project = await Project.findByPk(req.params.id);
  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }

  await project.update(req.body);
  res.json({ message: 'Project updated', project });
};

exports.deleteProject = async (req, res) => {
  const project = await Project.findByPk(req.params.id);
  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }

  await project.destroy();
  res.json({ message: 'Project deleted' });
};
