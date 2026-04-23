const os = require('os');

exports.getHealth = async (req, res) => {
  res.json({
    status: 'ok',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    host: os.hostname(),
    requestId: req.requestId
  });
};
