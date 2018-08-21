const argv = require('minimist')(process.argv.slice(2));
const Docker = require('dockerode');
const glob = require('glob');
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
      console.error(e);
      process.exit(1);
    } else {
      cb && cb(...rest);
    }
  }
}

/**
 * Removes any properties from an object that resolve to null.
 * @param {Object} obj
 */
function cleanObject(obj) {
  if (obj instanceof Object) {
    Object.keys(obj).forEach((key) => (obj[key] == null) && delete obj[key]);
  }
  return obj;
}

/**
 * Converts any relative path including those with "." dot notation into an absolute path with
 * a Dockerfile.
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

/**
 * Parses a Dockerfile and looks for sources that may be needed to build this image.
 * @param context
 * @returns {{context: *, src: *[]}}
 */
function getDockerfileContext(context) {
  const fs = require('fs');
  let files = [];
  let dockerfile = exports.resolveDockerfile(context);
  let file = fs.readFileSync(dockerfile, {encoding: 'utf8'});
  for (let line of file.split('\n')) {
    if (line.match(/^\s*(ADD|COPY).*$/)) {
      let entries = line.split(' ')
        .splice(1)
        .map(val => val.trim())
        .filter(val => val !== '')
        .filter(val => !val.startsWith('http'));
      if (entries[0].startsWith('--chown')) {
        entries = entries.splice(1);
      }

      // Array mode
      if (line.indexOf('[') !== -1 && line.indexOf(']') !== -1) {
        let args = JSON.parse(entries.join(' '));
        args.splice(-1);
        files = args
      }
      // Default mode
      else {
        entries.splice(-1);
        files = entries;
      }
    }
  }

  let resolvedFiles = [];
  for (let file of files) {
    resolvedFiles = resolvedFiles.concat(glob.sync(path.join(path.dirname(context), file)));
  }

  return { context, src: ['Dockerfile', ...resolvedFiles] };
}

/**
 * Main function called by the cli wrapper to execute the docker client.
 */
exports.run = function () {
  const docker = new Docker();
  const cmd = argv._[0];
  const id = argv._[1];
  const launchString = process.argv.slice(2).join(' ');
  const restArgs = launchString.replace(cmd, '').replace(id, '').split(' ').filter(val => val.match(/\w+/));
  print.args = argv;

  switch (cmd) {
    case 'build':
      docker.buildImage(getDockerfileContext(id), cleanObject({
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
        AttachStderr: true
      }), handle(print.build));
      break;
    case 'exec':
      docker.getContainer(id).exec({
        Cmd: restArgs,
        Privileged: argv.u === 'root',
        User: argv.u,
        AttachStdin: true,
        AttachStdout: true,
        AttachStderr: true
      }, handle(exec => exec.start(null, handle(print.generic))));
      break;
    case 'logs':
      docker.getContainer(id).logs({
        stdout: 1,
        stderr: 1,
        details: argv.details,
        follow: argv.f || argv.follow,
        // TODO argv.since expects unix timestamp but cli supports human readable (0m, 1h, etc.)
        since: 0,
        until: argv.until,
        timestamps: argv.t || argv.timestamps,
        tail: argv.tail,
        AttachStdin: true,
        AttachStdout: true,
        AttachStderr: true
      }, handle(print.generic));
      break;
    case 'pull':
      docker.pull(id, {
        AttachStdin: true,
        AttachStdout: true,
        AttachStderr: true
      }, handle(print.pull));
      break;
    case 'push':
      docker.getImage(id).push({
        AttachStdin: true,
        AttachStdout: true,
        AttachStderr: true
      }, handle());
      break;
    case 'run':
      let createOpts = cleanObject({
        Tty:false
      });
      let runOpts = cleanObject({});
      docker.run(id, restArgs, [process.stdin, process.stdout], createOpts, runOpts, handle(console.log));
      break;
    case 'create':
      docker.createContainer({
        Hostname: argv.h || argv.hostname,
        AttachStdin: !!(argv.a || argv.attach),
        AttachStdout: true,
        AttachStderr: true,
        Tty: argv.t || argv.tty,
        Entrypoint: argv.entrypoint,
        Image: id,
        Cmd: '',
        WorkingDir: argv.w || argv.workdir,
        MacAddress: argv['mac-address'],
        StopSignal: argv['stop-signal'],
        StopTimeout: argv['stop-timeout']
      }, handle());
      break;
    case 'start':
      // WARN: This doesn't like to get any parameters, otherwise newer versions of docker will not work
      docker.getContainer(id).start(null, handle());
      break;
    case 'stop':
      docker.getContainer(id).stop({
        AttachStdin: true,
        AttachStdout: true,
        AttachStderr: true
      }, handle());
      break;
    case 'tag':
      let [repo, tag] = argv._[2].indexOf(':') !== -1 ? argv._[2].split(':') : [undefined, argv._[2]];
      docker.getImage(id).tag(cleanObject({
        tag: tag,
        repo: repo,
        AttachStdin: true,
        AttachStdout: true,
        AttachStderr: true
      }), handle());
      break;
    case 'images':
      docker.listImages({
        all: argv.a || argv.all,
        filters: argv.f || argv.filter,
        digests: argv.digests,
        AttachStdin: true,
        AttachStdout: true,
        AttachStderr: true
      }, handle(print.images));
      break;
    case 'ps':
      docker.listContainers({
        all: argv.a || argv.all,
        limit: argv.n || argv.last,
        size: argv.s || argv.size,
        filters: argv.f || argv.filter,
        AttachStdin: true,
        AttachStdout: true,
        AttachStderr: true
      }, handle(print.ps));
      break;
    default:
      console.error("Unknown docker command: %s", cmd);
      process.exit(2);
  }
};
