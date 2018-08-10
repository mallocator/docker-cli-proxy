const argv = require('minimist')(process.argv.slice(2));
const Docker = require('dockerode');
const path = require('path');
const print = require('./print');

/**
 * Default handler function wrapper for all docker responses.
 * This wrapper will automatically exit on error with the message printed, or call the callback function
 * (if set) with the rest, non-error arguments.
 * @param {Function} [cb] The callback function to be called if no error occurred
 * @returns {Function} The handler function to be called by the docker lib
 */
function handle(cb) {
  return function(e, ...rest) {
    if (e) {
      console.error(e.message);
      process.exit(1);
    } else {
      cb && cb(...rest);
    }
  }
}

/**
 * Converts any relative path including those with "." dot notation into an absolute path with
 * a Dockerfile
 * @param location
 * @returns {*}
 */
exports.resolveDockerfile = function (location) {
  if (!path.isAbsolute(location)) {
    location = path.resolve(process.cwd(), location);
  }
  if (location.indexOf('Dockerfile') === -1) {
    location += location.endsWith('/') ? '' : '/';
    location += 'Dockerfile';
  }
  return location;
};

exports.run = function () {
  const docker = new Docker();
  const cmd = argv._[0];
  const id = argv._[1];
  const launchstring = process.argv.slice(2).join(' ');
  const restArgs = launchstring.replace(cmd, '').replace(id, '').split(' ').filter(val => val.match(/\w/g));
  print.args = argv;

  switch (cmd) {
    case 'build':
      docker.buildImage(exports.resolveDockerfile(id), {
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
        AttachStdout: true,
        authconfig: {}
      }, handle());
      break;
    case 'exec':
      docker.getContainer(id).exec({
        Cmd: restArgs,
        AttachStdin: true,
        AttachStdout: true
      }, handle());
      break;
    case 'logs':
      docker.getContainer(id).logs({
        details: argv.details,
        follow: argv.f || argv.follow,
        since: argv.since,
        until: argv.until,
        timestamps: argv.t || argv.timestamps,
        tail: argv.tail,
        AttachStdin: true,
        AttachStdout: true
      }, handle());
      break;
    case 'pull':
      docker.pull(id, {AttachStdin: true, AttachStdout: true}, handle());
      break;
    case 'push':
      docker.getImage(id).push({AttachStdin: true, AttachStdout: true}, handle());
      break;
    case 'run':
      docker.run(id, restArgs, [process.stdout, process.stderr], {Tty: false}, handle());
      break;
    case 'stop':
      docker.getContainer(id).stop({AttachStdin: true, AttachStdout: true}, handle());
      break;
    case 'tag':
      docker.getImage(id).tag({
        tag: argv._[2],
        AttachStdin: true,
        AttachStdout: true
      }, handle());
      break;
    case 'images':
      console.log("Not yet implemented")
      break;
    case 'ps':
      docker.listContainers({
        all: argv.a || argv.all,
        limit: argv.n || argv.last,
        size: argv.s || argv.size,
        filters: argv.f || argv.filter,
        AttachStdin: true,
        AttachStdout: true
      }, handle(print.ps));
      break;
    default:
      console.error("Unknown docker command: %s", cmd);
      process.exit(2);
  }
};
