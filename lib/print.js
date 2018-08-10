const moment = require('moment');

// Is set at launch from the calling library
exports.args = {};

/**
 * Prints all container for the "ps" command
 * @param {Object[]} containers
 */
exports.ps = containers => {
  // Quiet mode
  if (exports.args.q || exports.args.quiet) {
    for (let container of containers) {
      console.log(container.id.substr(0, 12));
    }
    return;
  }

  // Default mode
  console.log(`CONTAINER ID        IMAGE               COMMAND                  CREATED              STATUS              PORTS               NAMES`);
  for (let container of containers) {
    let id = container.Id.substr(0, 12).padEnd(19);
    let image = (container.Image === '' ? '<no image>' : container.Image).padEnd(19);
    let cmd = ('"'
      + ( container.Command.length > 17 ? container.Command.substr(0, 17) + '…' : container.Command)
      + '"').padEnd(24);
    let created = moment(container.Created * 1000).fromNow().padEnd(20);
    let status = container.Status.padEnd(19);
    let ports = container.Ports.join(',').padEnd(19);
    let names = container.Names.join(',').replace(/^\//, '');
    console.log(`${id} ${image} ${cmd} ${created} ${status} ${ports} ${names}`);
  }
};

/**
 * Prints the output of the "build" command
 * @param {Object} response
 * @param {string} [response.stream]
 * @param {string} [response.error]
 */
exports.build = response => {
  response.on('data', data => {
    let entry = JSON.parse(data.toString());
    if (entry.error) {
      console.error(entry.error.trim())
    } else if (entry.stream && entry.stream.trim().length > 0) {
      console.log(entry.stream.trim())
    }
  });
};
