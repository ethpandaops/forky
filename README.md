# Forkchoice

TODO

----------
## Contents
* [Features](#features)
* [What is forkchoice?](#what-is-forkchoice)
- [Usage](#usage)
  * [Configuration](#configuration)
    + [Simple example](#simple-example)
    + [Full example](#full-example)
  * [Getting Started](#getting-started)
    + [Download a release](#download-a-release)
    + [Docker](#docker)
      - [Images](#images)
    + [Kubernetes via Helm](#kubernetes-via-helm)
    + [Building yourself](#building-yourself)
* [Contributing](#contributing)
  + [Running locally](#running-locally)
    - [Backend](#backend)
    - [Frontend](#frontend)
* [Contact](#contact)

----------

## Features

TODO

## What is forkchoice?

TODO

# Usage
Forkchoice requires a config file. An example file can be found [here](https://github.com/ethpandaops/forkchoice/blob/master/example_config.yaml).

```
Forkchoice TODO

Usage:
  forkchoice [flags]

Flags:
      --config string   config file (default is config.yaml) (default "config.yaml")
  -h, --help            help for forkchoice
```

## Configuration

Forkchoice relies entirely on a single `yaml` config file.

| Name | Default | Description |
| --- | --- | --- |
| global.listenAddr | `:5555` | The address the main http server will listen on |
| global.logging | `warn` | Log level (`panic`, `fatal`, `warn`, `info`, `debug`, `trace`) |
| global.metricsAddr | `:9090` | The address the metrics server will listen on |


### Simple example

TODO

### Full example

TODO

## Getting Started

### Download a release
Download the latest release from the [Releases page](https://github.com/ethpandaops/forkchoice/releases). Extract and run with:
```
./forkchoice --config your-config.yaml
```

### Docker
Available as a docker image at [ethpandaops/forkchoice](https://hub.docker.com/r/ethpandaops/forkchoice/tags)
#### Images
- `latest` - distroless, multiarch
- `latest-debian` - debian, multiarch
- `$version` - distroless, multiarch, pinned to a release (i.e. `0.4.0`)
- `$version-debian` - debian, multiarch, pinned to a release (i.e. `0.4.0-debian`)

**Quick start**
```
docker run -d  --name forkchoice -v $HOST_DIR_CHANGE_ME/config.yaml:/opt/forkchoice/config.yaml -p 9090:9090 -p 5555:5555 -it ethpandaops/forkchoice:latest --config /opt/forkchoice/config.yaml;
docker logs -f forkchoice;
```

### Kubernetes via Helm
[Read more](https://github.com/skylenet/ethereum-helm-charts/tree/master/charts/forkchoice)
```
helm repo add ethereum-helm-charts https://skylenet.github.io/ethereum-helm-charts

helm install forkchoice ethereum-helm-charts/forkchoice -f your_values.yaml
```

### Building yourself

1. Clone the repo
   ```sh
   go get github.com/ethpandaops/forkchoice
   ```
2. Change directories
   ```sh
   cd ./forkchoice
   ```
3. Build the binary
   ```sh  
    go build -o forkchoice .
   ```
4. Run the service
   ```sh  
    ./forkchoice
   ```

## Contributing

Contributions are greatly appreciated! Pull requests will be reviewed and merged promptly if you're interested in improving the Forkchoice!

1. Fork the project
2. Create your feature branch:
    - `git checkout -b feat/new-feature`
3. Commit your changes:
    - `git commit -m 'feat(profit): new feature`
4. Push to the branch:
    -`git push origin feat/new-feature`
5. Open a pull request

### Running locally
#### Backend
```
go run main.go --config your_config.yaml
```

#### Frontend

A frontend is provided in this project in [`./web`](https://github.com/ethpandaops/forkchoice/blob/master/example_config.yaml) directory which needs to be built before it can be served by the server, eg. `http://localhost:5555`.

The frontend can be built with the following command;
```bash
# install node modules and build
make build-web
```

Building frontend requires `npm` and `NodeJS` to be installed.


## Contact

Sam - [@samcmau](https://twitter.com/samcmau)

Andrew - [@savid](https://twitter.com/Savid)
