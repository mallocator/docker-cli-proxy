/* global describe, it, expect, beforeAll, afterAll */
const cp = require('child_process');
const fs = require('fs');
const path = require('path');

const imageName = 'custom.com/project';

function run(cmd, env = {}) {
  try {
    env.DOCKER_HOST = process.env.DOCKER_HOST;
    let envString = '';
    for (let key in env) {
      if (env[key] != null) {
        envString += `${key}='${env[key]}' `;
      }
    }
    cmd = `npx -c "${envString} ${cmd}" 2>&1`;
    return cp.execSync(cmd, { cwd: __dirname, encoding: 'utf8', timeout: 100000, windowsHide: true });
  } catch (e) {
    throw e;
  }
}

/**
 * Starts a container that runs for the next 5 seconds and prints a static message
 * @returns {string}
 */
function launchContainer() {
  run('docker create ' + imageName);
  let id = run("docker ps -a | grep '" + imageName + "' | head -1 | cut -f 1 -d ' '").trim();
  run('docker start ' + id);
  return id;
}

describe('Integration Tests', () => {
  /**
   * Install the package locally so that the binary is linked the way npm would do it.
   */
  beforeAll(() => {
    const nodeModules = path.join(__dirname, '/node_modules');
    fs.existsSync(nodeModules) || cp.execSync('npm i --production', {cwd: __dirname, windowsHide: true});
  });

  /**
   * Clean up package-lock.json to prevent any version locking during testing.
   */
  afterAll(() => {
    const lockfile = path.join(__dirname, '/package-lock.json');
    fs.existsSync(lockfile) && fs.unlinkSync(lockfile);
  });

  it('should be able to build an image', () => {
    run('docker build -t ' + imageName + ' .');
    // TODO look via docker images if the command was successful
  });

  it('should be able to execute a command inside a container', () => {
    let response = run('docker exec -u root ' + launchContainer() + ' echo -n Hello World');
    expect(response).toBe('Hello World');
  });

  it('should be able to grab logs from a docker container', () => {
    let response = run('docker logs ' + launchContainer() + ' --since=0 -t');
    expect(response).toContain('Test Container Setup');
  });

  it('should be able to pull an image from docker hub', () => {
    let response = run('docker pull alpine:latest');
    expect(response).toContain('Status: Image is up to date');
  });

  it('should be able to push a docker container to the registry', () => {
    run('docker build -t ' + imageName + ' .');
    try {
      run('docker push custom.com/project');
    } catch (e) {
      // There's no registry at "custom.com" so the expected behavior is an output of "server misbehaving"
      expect(e.message).toContain('server misbehaving');
    }
  });

  it('should be able to tag a docker image', () => {
    run('docker build -t ' + imageName + ' .');
    run('docker tag custom.com/project custom.com/project:mylabel');
  });

  it('should be able to print the process list', () => {
     let response = run('docker ps -a');
     expect(response).toContain('CONTAINER ID');
  });

  it('should be able to print the images list', () => {
    let response = run('docker images -a');
    expect(response).toContain('REPOSITORY');
  });

  it('should look for a local docker binary of the environment variable is set', () => {
    let response = run('docker build -t ' + imageName + ' .', { DOCKER_PASSTHROUGH: 1 });
    expect(response).toContain('Local docker binary detected');
  });
});
