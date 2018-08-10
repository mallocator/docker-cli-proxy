/* global describe, it, expect */
const cp = require('child_process');

const imageName = 'custom.com/project';

function run(cmd, env = {}) {
  try {
    // TODO point this at a dockerized docker service not on this machine
    env.DOCKER_HOST = process.env.DOCKER_HOST;
    let envString = '';
    for (let key in env) {
      envString += `${key}='${env[key]}' `;
    }
    cmd = `npx -c "${envString} ${cmd}"`;
    console.log(cmd)
    return cp.execSync(cmd, { cwd: __dirname, encoding: 'utf8', timeout: 100000, windowsHide: true });
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
    run('docker build -t ' + imageName + ' .');
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

  it('should look for a local docker binary of the environment variable is set', () => {
    let response = run('docker build -t ' + imageName + ' .', { DOCKER_PASSTHROUGH: 1 });
    expect(response).toBe('Environment Variable');
  })
});
