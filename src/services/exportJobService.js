const crypto = require('crypto');
const logger = require('../config/logger');

const jobs = new Map();

const getJob = (jobId) => jobs.get(jobId) || null;

const createJob = ({ userId, scope, format, filters }) => {
  const id = crypto.randomUUID();
  const job = {
    id,
    status: 'queued',
    userId,
    scope,
    format,
    filters,
    createdAt: new Date().toISOString(),
    completedAt: null,
    failedAt: null,
    rowCount: 0,
    fileName: null,
    mimeType: null,
    payloadBase64: null,
    error: null
  };
  jobs.set(id, job);
  return job;
};

const completeJob = (jobId, { fileName, mimeType, buffer, rowCount }) => {
  const job = jobs.get(jobId);
  if (!job) return;
  job.status = 'completed';
  job.completedAt = new Date().toISOString();
  job.fileName = fileName;
  job.mimeType = mimeType;
  job.payloadBase64 = buffer.toString('base64');
  job.rowCount = rowCount || 0;
};

const failJob = (jobId, err) => {
  const job = jobs.get(jobId);
  if (!job) return;
  job.status = 'failed';
  job.failedAt = new Date().toISOString();
  job.error = err.message || 'Export failed';
  logger.error({ message: 'Export job failed', jobId, error: job.error });
};

module.exports = {
  getJob,
  createJob,
  completeJob,
  failJob
};
