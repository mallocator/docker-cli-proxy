const fs = require('fs');
const path = require('path');

module.exports = function () {
  console.log('Tearing down integration tests for docker');
  const lockfile = path.join(__dirname, '/package-lock.json');
  fs.existsSync(lockfile) && fs.unlinkSync(lockfile);
};
