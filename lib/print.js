const ago = require('s-ago');
const filesize = require('filesize');


// Configure "ago" to use same humanizing output as docker.
ago.units = [
  { max: 3540000, value: 60000, name: 'minute', prev: 'a minute ago' },
  { max: 168000000, value: 3600000, name: 'hour', prev: 'an hour ago' },
  { max: 518400000, value: 171600000, name: 'day', prev: 'a day ago' },
  { max: 2419200000, value: 604800000, name: 'week', prev: 'a week ago' },
  { max: 28512000000, value: 2592000000, name: 'month', prev: 'last month' },
  { max: Infinity, value: 31536000000, name: 'year', prev: 'last year' }
];

// Is set at launch from the calling library
exports.args = {};

/**
 * Prints all container for the "ps" command.
 * @param {Object[]} containers
 */
exports.ps = containers => {
  if (exports.args.format) {
    console.log("Warning: only default format supported for now.");
    return;
  }

  // Quiet mode
  if (exports.args.q || exports.args.quiet) {
    for (let container of containers) {
      console.log(container.Id.substr(0, 12));
    }
    return;
  }

  // Default mode
  console.log(`CONTAINER ID        IMAGE               COMMAND                  CREATED             STATUS              PORTS               NAMES`);
  for (let container of containers) {
    let id = container.Id.substr(0, 12).padEnd(19);
    let image = (container.Image === '' ? '<no image>' : container.Image).padEnd(19);
    let cmd = ('"'
      + ( container.Command.length > 17 ? container.Command.substr(0, 17) + '…' : container.Command)
      + '"').padEnd(24);
    let created = ago(new Date(container.Created * 1000)).padEnd(19);
    let status = container.Status.padEnd(19);
    let ports = container.Ports.join(',').padEnd(19);
    let names = container.Names.join(',').replace(/^\//, '');
    console.log(`${id} ${image} ${cmd} ${created} ${status} ${ports} ${names}`);
  }
};

/**
 * Prints the output from the "pull" command.
 * @param stream
 */
exports.pull = stream => {
  stream.on('data', data => {
    let line = JSON.parse(data.toString());
    if (line.id) {
      console.log(`${line.id}: ${line.status}`);
    } else {
      console.log(line.status)
    }
  });
};

/**
 * Prints the output of the "build" command.
 * @param {Object} response
 * @param {string} [response.stream]
 * @param {string} [response.error]
 */
exports.build = response => response.on('data', data => {
  let entry = JSON.parse(data.toString());
  if (entry.error) {
    console.error(entry.error.trim())
  } else if (entry.stream && entry.stream.trim().length > 0) {
    console.log(entry.stream.trim())
  }
});

/**
 * Prints the output of the "images" command.
 * @param images
 */
exports.images = images => {
  if (exports.args.format) {
    console.log("Warning: only default format supported for now.");
    return;
  }

  let entries = [];
  for (let image of images) {
    for (let tag of image.RepoTags) {
      let tagParts = tag.split(':');
      if (tagParts)
        entries.push({
          repo: tagParts[0].padEnd(24),
          tag: tagParts[1].padEnd(19),
          id: image.Id.substr(7,12).padEnd(19),
          created: ago(new Date(image.Created * 1000)).padEnd(19),
          size: filesize(image.Size).replace(' ', '')
        })
    }
  }

  // Quiet mode
  if (exports.args.q || exports.args.quiet) {
    for (let entry of entries) {
      console.log(entry.id)
    }
    return;
  }

  // Default mode
  console.log('REPOSITORY               TAG                 IMAGE ID            CREATED             SIZE');
  for (let entry of entries) {
    console.log(`${entry.repo} ${entry.tag} ${entry.id} ${entry.created} ${entry.size}`)
  }
};

/**
 * Tries to print the output of any command.
 * @param output
 */
exports.generic = output => {
  if (output instanceof Buffer) {
    return console.log(output.toString());
  }
  if (!output.on) {
    return console.log(output);
  }
  output.pipe(process.stdout);
};

