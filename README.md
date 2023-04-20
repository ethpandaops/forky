<img align="left" height="168px" src="/web/src/assets/forky_logo.png">
  <h1> Forky </h1>
</img>

Forky captures, stores and visualizes fork choice data from the Ethereum Beacon Chain. Forky is designed to provide a live view of the Ethereum network, along with historical access.

----------

<p align="center">
  <b> Live Versions </b>
</p>
<p align="center">
  <a href="https://forky.mainnet.ethpandaops.io" target="_blank">Mainnet</a>
</p>
<p align="center">
  <a href="https://forky.goerli.ethpandaops.io" target="_blank">Goerli</a>
</p>

----------
## Contents

* [Features](#features)
- [Usage](#usage) 
  * [Configuration](#configuration)
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

* [x] Web interface for viewing fork choice data
* [x] Configurable retention period
* [x] Prometheus metrics

### Capturing

* [x] Ethereum Beacon Node (only Teku has support currently)
* [x] [Xatu](https://github.com/ethpandaops/xatu)

### Storing

* [x] Memory
* [x] Filesystem
* [x] S3

### Indexing

* [x] Sqlite
* [x] Postgres

## Usage

Forky requires a config file. An example file can be found [here](https://github.com/ethpandaops/forky/blob/master/example_config.yaml).

```bash
forky - fetches and serves Ethereum fork choice data

Usage:
  forky [flags]

Flags:
      --config string   config file (default is config.yaml) (default "config.yaml")
  -h, --help            help for forky
```

## Getting Started

### Download a release

Download the latest release from the [Releases page](https://github.com/ethpandaops/forky/releases). Extract and run with:

```bash
./forky --config your-config.yaml
```

### Docker

Available as a docker image at [ethpandaops/forky](https://hub.docker.com/r/ethpandaops/forky/tags)
#### Images

- `latest` - distroless, multiarch
- `latest-debian` - debian, multiarch
- `$version` - distroless, multiarch, pinned to a release (i.e. `0.1.0`)
- `$version-debian` - debian, multiarch, pinned to a release (i.e. `0.1.0-debian`)

**Quick start**

```bash
docker run -d  --name forky -v $HOST_DIR_CHANGE_ME/config.yaml:/opt/forky/config.yaml -p 9090:9090 -p 5555:5555 -it ethpandaops/forky:latest --config /opt/forky/config.yaml;
docker logs -f forky;
```

### Kubernetes via Helm

[Read more](https://github.com/skylenet/ethereum-helm-charts/tree/master/charts/forky)

```bash
helm repo add ethereum-helm-charts https://ethpandaops.github.io/ethereum-helm-charts

helm install forky ethereum-helm-charts/forky -f your_values.yaml
```

### Building yourself

1. Clone the repo
   ```sh
   go get github.com/ethpandaops/forky
   ```
2. Change directories
   ```sh
   cd ./forky
   ```
3. Build the binary
   ```sh  
    go build -o forky .
   ```
4. Run the service
   ```sh  
    ./forky
   ```

## Contributing

Contributions are greatly appreciated! Pull requests will be reviewed and merged promptly if you're interested in improving the forky!

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

A frontend is provided in this project in [`./web`](https://github.com/ethpandaops/forky/blob/master/example_config.yaml) directory which needs to be built before it can be served by the server, eg. `http://localhost:5555`.

The frontend can be built with the following command;
```bash
# install node modules and build
make build-web
```

Building frontend requires `npm` and `NodeJS` to be installed.


## Contact

Sam - [@samcmau](https://twitter.com/samcmau)

Andrew - [@savid](https://twitter.com/Savid)
