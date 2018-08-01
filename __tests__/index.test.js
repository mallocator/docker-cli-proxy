/* global describe, it */

const cp = require('child_process');
const path = require('path');

function run(cmd) {
  try {
    return cp.execSync('npx ' + cmd, {
      cwd: path.join(__dirname, '/..'),
      encoding: 'utf8',
      timeout: 10000,
      windowsHide: true
    });
  } catch (e) {
    console.error(e.message);
    throw e;
  }
}

describe('Samples', () => {
  it('should be able to build an image', () => {
    run('node . build -t custom.com/project .');
  });

  it('should be able to execute a command inside a container', () => {
    run('node . exec -u node scratch');
  });

  it('should be able to grab logs from a docker container', () => {
    run('node . logs -f scratch --since=0m --tail -t');
  });

  it('should be able to push a docker container to the registry', () => {
    run('node . push custom.com/scratch');
  });

  it('should tag a docker container', () => {
    run('node . tag custom.com/project custom.com/scratch:mylabel');
  });
});
