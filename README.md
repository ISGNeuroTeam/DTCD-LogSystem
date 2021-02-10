# LogSystem

Core system-plugin (part of DTCD-SDK) for recording logs in [DTCD](https://github.com/ISGNeuroTeam/DTCD) application.

## Getting Started

In order to use this plugin you need to download it, build and move build-file to _plugins_ folder on DTCD server.

### Prerequisites

- [node.js](https://nodejs.org/en/) LTS version 14.x.x
- `make` utility
- [DTCD](https://github.com/ISGNeuroTeam/DTCD) application

### Building

```
make build
```

## Running the tests

```
make test
```

## Create build package

```
make pack
```

## Clear dependencies

```
make clear
```

## Deployment

Create package, then move archive to _plugins_ folder on DTCD server and unarchive it with the following command:

```
tar -zxf DTCD-LogSystem-*.tar.gz ./DTCD-LogSystem/LogSystem.js | mv ./DTCD-LogSystem/LogSystem.js LogSystem.js
```

## Built With

- [rollup](https://rollupjs.org/guide/en/) - Builder

## Contributing

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/ISGNeuroTeam/DTCD-LogSystem/tags).

Also you can see the [CHANGELOG](CHANGELOG.md) file.

## Authors

Roman Kuramshin (rkuramshin@isgneuro.com)

## License

This project is licensed under the OT.PLATFORM license agreement - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments
