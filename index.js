#!/usr/bin/env node

const argv = require('minimist')(process.argv.slice(2));
const Docker = require('dockerode');

function error(e) {
  if (e) {
    console.error(e.message);
    process.exit(1);
  }
}

const docker = new Docker();
const cmd = argv._[0];
const id = argv._[1];
const launchstring = process.argv.slice(2).join(' ');
const restArgs = launchstring.replace(cmd, '').replace(id, '').split(' ').filter(val => val.match(/\w/g));

switch (cmd) {
  case 'build':
    docker.buildImage(id.endsWith('Dockerfile') ? id : id + '/Dockerfile', {
      t: argv.t,
      extrahosts: argv['add-host'],
      q: argv.q || argv.quiet,
      nocache: argv['no-cache'],
      cachefrom: argv['cache-from'],
      pull: argv.pull,
      rm: argv.rm,
      forcerm: argv['force-rm'],
      memory: argv.m || argv.memory,
      memswap: argv['memory-swap'],
      cpushares: argv.c || argv['cpu-shares'],
      cpusetcpus: argv['cpuset-cpus'],
      cpusetmems: argv['cpuset-mems'],
      cpuperiod: argv['cpu-period'],
      cpuquota: argv['cpu-quota'],
      buildargs: argv['build-arg'],
      shmsize: argv['shm-size'],
      squash: argv.squash,
      labels: argv['label'],
      networkmode: argv.network,
      platform: argv.platform,
      AttachStdin: true,
      AttachStdout: true
    }, error);
    break;
  case 'exec':
    docker.getContainer(id).exec({
      Cmd: restArgs,
      AttachStdin: true,
      AttachStdout: true
    }, error);
    break;
  case 'logs':
    docker.getContainer(id).logs({
      details: argv.details,
      follow: argv.f || argv.follow,
      since: argv.since,
      timestamps: argv.t || argv.timestamps,
      tail: argv.tail,
      AttachStdin: true,
      AttachStdout: true
    }, error);
    break;
  case 'pull':
    docker.pull(id, {AttachStdin: true, AttachStdout: true}, error);
    break;
  case 'push':
    docker.getImage(id).push({AttachStdin: true, AttachStdout: true}, error);
    break;
  case 'run':
    docker[cmd](id, restArgs, [process.stdout, process.stderr], {Tty: false}, error);
    break;
  case 'tag':
    docker.getImage(id).tag({
      tag: argv._[2],
      AttachStdin: true,
      AttachStdout: true
    }, error);
    break;
  default:
    console.error("Unknown docker command: %s", cmd);
    process.exit(2);
}