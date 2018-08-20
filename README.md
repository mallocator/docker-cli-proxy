# docker-cli-proxy
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![NPM Version](https://badge.fury.io/js/docker-cli-proxy.svg)](https://badge.fury.io/js/docker-cli-proxy)
[![Dependencies](https://david-dm.org/mallocator/docker-cli-proxy/status.svg)](https://david-dm.org/mallocator/docker-cli-proxy)
[![Build Status](https://travis-ci.org/mallocator/docker-cli-proxy.svg?branch=master)](https://travis-ci.org/mallocator/docker-cli-proxy)


A docker client dropin when no local binary is available that can connect to remote docker services

This is currently only a partial implementation for my specific usecase and will be extended as needed.

This version is built against [Docker API v1.37](https://docs.docker.com/engine/api/v1.37/#)

Currently supported commands include:
* build
* tag
* exec (failing)
* logs (failing)
* create (partial option support)
* start
* stop
* pull
* push
* ps
* images

## Pass through feature

The docker binary allows you to pass commands to a local docker binary if one
is available. By default it will ignore any local versions and use the proxy,
but in case you want to have a fallback set the following environment variable:

```DOCKER_PASSTHROUGH=1```
