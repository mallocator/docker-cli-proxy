#!/usr/bin/env node

/**
 * Suppresses the "Error [ERR_STDOUT_CLOSE]: process.stderr cannot be closed" message when piping to stdout.
 */
process.on('uncaughtException', e => {
  if (e.code !== 'ERR_STDOUT_CLOSE' && e.code !== 'ERR_STDERR_CLOSE') {
    console.log(e.message);
    process.exit(1);
  }
});

/**
 * Allows commands to be executed by a local binary.
 */
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
