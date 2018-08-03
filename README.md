# docker-cli-proxy
A docker client dropin when no local binary is available that can connect to remote docker services

This is currently only a partial implementation for my specific usecase and will be extended as needed.

This version is built against [Docker API v1.37](https://docs.docker.com/engine/api/v1.37/#)

Currently supported commands include:
* build
* tag
* run
* exec
* logs
* stop
* pull
* push

## Pass through feature

The docker binary allows you to pass commands to a local docker binary if one
is available. By default it will ignore any local versions and use the proxy,
but in case you want to have a fallback set the following environment variable:

```DOCKER_PASSTHROUGH=1```
