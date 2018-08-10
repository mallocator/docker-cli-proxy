#!/usr/bin/env node
if (process.env.DOCKER_PASSTHROUGH == 1) {
  const cp = require('child_process');

  let executables = cp.execSync('which -a docker', { encoding: 'utf8' })
    .split('\n')
    .filter((value, index, self) => self.indexOf(value) === index)
    .filter(value => value.trim() !== '')
    .filter(value => value !== process.argv[1]);

  if (executables.length >= 1) {
    cp.spawn(executables[0], process.argv.splice(2), { encoding: 'utf8', env: process.env, stdio: 'inherit' });
  } else {
    require('./lib').run();
  }
} else {
  require('./lib').run();
}
