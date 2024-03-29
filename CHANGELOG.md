# **CHANGELOG**

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.7.0]

### Fixed

- endpoint URL (added slash)

## [0.6.0]

### Changed

- endpoint URL prefix

## [0.5.0]

### Added

- version of core systems for adapters

### Changed

- build process in order to make directory name with current version of pluing

## [0.4.0]

### Added

- firefox support in getFunctionCaller method
- getters for class fields
- consoleOutputMode flag which enables printing logs to F12 dev-tools console
- info logs for audit
- consoleOutputMode now stored in localStorage as well
- styles for consoleOutputMode messages in console

### Changed

- all class fields are privatre and accessible from getters
- changed endpoints
- the way configuration sets in the system

### Fixed

- correct adding users global log level to configuration in localstorage
- broken tests after fixing configuration setup
- rollup build file issue with building path
- correctly setting system config if server response empty json

## [0.3.1] - 2021-03-18

### Fixed

- configuration endpoint name

## [0.3.0] - 2021-03-18

### Added

- Added tests for all new methods

### Changed

- Refactored whole LogSystem

## [0.2.0] - 2021-02-10

### Changed

- [Makefile](Makefile) to current project structure
- downloading DTCD-SDK from nexus
- changed paths in source files to DTCD-SDK
- renamed code source directory from LogSystem to DTCD-LogSystem

### Fixed

- [LICENSE.md](LICENSE.md) file text content
- [Jenkinsfile](Jenkinsfile) text content

## [0.1.0] - 2021-02-09

### Added

- Base functionality
