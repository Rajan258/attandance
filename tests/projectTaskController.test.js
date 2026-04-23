const test = require('node:test');
const assert = require('node:assert/strict');

const modelsModulePath = require.resolve('../src/models');
const taskControllerPath = require.resolve('../src/controllers/taskController');
const projectControllerPath = require.resolve('../src/controllers/projectController');

const loadControllerWithModels = (controllerPath, modelsMock) => {
  delete require.cache[controllerPath];
  delete require.cache[modelsModulePath];
  require.cache[modelsModulePath] = { exports: modelsMock };
  return require(controllerPath);
};

const createRes = () => {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    }
  };
  return res;
};

test('taskController.getTasks returns 400 for employee without employee profile', async () => {
  const taskController = loadControllerWithModels(taskControllerPath, {
    Task: { findAll: async () => [] },
    Employee: { findOne: async () => null },
    Project: {},
    TaskComment: {},
    TaskFile: {},
    User: {}
  });

  const req = { query: {}, user: { id: 11, role_id: 4 } };
  const res = createRes();

  await taskController.getTasks(req, res);

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.message, 'Employee profile not found for this user');
});

test('taskController.updateTask blocks employee updating another employee task', async () => {
  const taskController = loadControllerWithModels(taskControllerPath, {
    Task: {
      findByPk: async () => ({
        id: 44,
        assigned_to: 2,
        update: async () => {}
      })
    },
    Employee: { findOne: async () => ({ id: 5 }) },
    Project: {},
    TaskComment: {},
    TaskFile: {},
    User: {}
  });

  const req = {
    params: { id: 44 },
    body: { status: 'COMPLETED' },
    user: { id: 99, role_id: 4 }
  };
  const res = createRes();

  await taskController.updateTask(req, res);

  assert.equal(res.statusCode, 403);
  assert.equal(res.body.message, 'You can only update tasks assigned to you');
});

test('projectController.getProjects filters projects by assigned employee for role 4', async () => {
  let findAllOptions;
  const projectController = loadControllerWithModels(projectControllerPath, {
    Project: {
      findAll: async (options) => {
        findAllOptions = options;
        return [];
      }
    },
    Task: {},
    Employee: { findOne: async () => ({ id: 7 }) }
  });

  const req = { user: { id: 21, role_id: 4 } };
  const res = createRes();

  await projectController.getProjects(req, res);

  assert.equal(res.statusCode, 200);
  assert.ok(findAllOptions);
  assert.equal(findAllOptions.include[0].as, 'tasks');
  assert.equal(findAllOptions.include[0].required, true);
  assert.equal(findAllOptions.include[0].where.assigned_to, 7);
  assert.deepEqual(res.body, { projects: [] });
});

test('projectController.getProjectById returns 404 for employee without assigned tasks in project', async () => {
  const projectController = loadControllerWithModels(projectControllerPath, {
    Project: {
      findOne: async () => null
    },
    Task: {},
    Employee: { findOne: async () => ({ id: 7 }) }
  });

  const req = { params: { id: 100 }, user: { id: 21, role_id: 4 } };
  const res = createRes();

  await projectController.getProjectById(req, res);

  assert.equal(res.statusCode, 404);
  assert.equal(res.body.message, 'Project not found');
});
