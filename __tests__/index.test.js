/* global describe, it, expect */
const cp = require('child_process');

const imageName = 'custom.com/project';

function run(cmd) {
  try {
    // TODO point this at a dockerized docker service not on this machine
    cmd = `DOCKER_HOST="tcp://192.168.64.7:2376"; npx ${cmd}`;
    return cp.execSync(cmd, { encoding: 'utf8', timeout: 100000, windowsHide: true });
  } catch (e) {
    throw e;
  }
}

function launchContainer() {
  run('docker run -d ' + imageName);
  return run("docker ps -a | grep 'custom.com/project' | awk '{print $1}' | head -1").trim();
}

describe('Integration Tests', () => {
  it('should be able to build an image', () => {
    run('docker build -t ' + imageName + ' __tests__');
  });

  it('should be able to execute a command inside a container', () => {
    let response = run('docker exec -u root ' + launchContainer() + ' echo -n Hello World');
    expect(response).toBe('Hello World');
  });

  it('should be able to grab logs from a docker container', () => {
    let response = run('docker logs ' + launchContainer() + ' --since=0m -t');
    expect(response).toContain('Test Container Setup');
  });

  it('should be able to pull an image from docker hub', () => {
    let response = run('docker pull alpine');
    expect(response).toContain('Status: Image is up to date');
  });

  it('should be able to push a docker container to the registry', () => {
    run('docker build -t ' + imageName + ' __tests__');
    try {
      run('docker push custom.com/project');
    } catch (e) {
      // There's no registry at "custom.com" so the expected behavior is an output of "server misbehaving"
      expect(e.message).toContain('server misbehaving');
    }
  });

  it('should be able to tag a docker image', () => {
    run('docker build -t ' + imageName + ' __tests__');
    run('docker tag custom.com/project custom.com/project:mylabel');
  });
});
