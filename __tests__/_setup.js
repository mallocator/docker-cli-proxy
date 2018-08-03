const cp = require('child_process');
const fs = require('fs');
const path = require('path');

module.exports = function () {
  console.log('Setting up integration tests for docker');
  const nodeModules = path.join(__dirname, '/node_modules');
  fs.existsSync(nodeModules) || cp.execSync('npm i --production', {cwd: __dirname, windowsHide: true});
};
