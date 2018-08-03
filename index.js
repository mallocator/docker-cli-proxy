#!/usr/bin/env node

if (process.env.DOCKER_PASSTHROUGH == 1) {

}

require('./lib').run();
