# plugin-login

[![NPM](https://img.shields.io/npm/v/@salesforce/plugin-login.svg?label=@salesforce/plugin-login)](https://www.npmjs.com/package/@salesforce/plugin-login) [![CircleCI](https://circleci.com/gh/salesforcecli/plugin-login/tree/main.svg?style=shield)](https://circleci.com/gh/salesforcecli/plugin-login/tree/main) [![Downloads/week](https://img.shields.io/npm/dw/@salesforce/plugin-login.svg)](https://npmjs.org/package/@salesforce/plugin-login) [![License](https://img.shields.io/badge/License-BSD%203--Clause-brightgreen.svg)](https://raw.githubusercontent.com/salesforcecli/plugin-login/main/LICENSE.txt)

## Install

```bash
sf plugins:install plugin-login@x.y.z
```

## Issues

Please report any issues at https://github.com/forcedotcom/cli/issues

## Contributing

1. Please read our [Code of Conduct](CODE_OF_CONDUCT.md)
2. Create a new issue before starting your project so that we can keep track of
   what you are trying to add/fix. That way, we can also offer suggestions or
   let you know if there is already an effort in progress.
3. Fork this repository.
4. [Build the plugin locally](#build)
5. Create a _topic_ branch in your fork. Note, this step is recommended but technically not required if contributing using a fork.
6. Edit the code in your fork.
7. Write appropriate tests for your changes. Try to achieve at least 95% code coverage on any new code. No pull request will be accepted without unit tests.
8. Sign CLA (see [CLA](#cla) below).
9. Send us a pull request when you are done. We'll review your code, suggest any needed changes, and merge it in.

### CLA

External contributors will be required to sign a Contributor's License
Agreement. You can do so by going to https://cla.salesforce.com/sign-cla.

### Build

To build the plugin locally, make sure to have yarn installed and run the following commands:

```bash
# Clone the repository
git clone git@github.com:salesforcecli/plugin-login

# Install the dependencies and compile
yarn install
yarn build
```

To use your plugin, run using the local `./bin/run` or `./bin/run.cmd` file.

```bash
# Run using local run file.
./bin/run login
```

There should be no differences when running via the Salesforce CLI or using the local run file. However, it can be useful to link the plugin to do some additional testing or run your commands from anywhere on your machine.

```bash
# Link your plugin to the sfdx cli
sf plugins:link .
# To verify
sf plugins
```

## Commands

<!-- commands -->
* [`sf login`](#sf-login)
* [`sf login org`](#sf-login-org)
* [`sf login org jwt`](#sf-login-org-jwt)
* [`sf logout`](#sf-logout)

## `sf login`

Log in interactively to Salesforce orgs and other services.

```
USAGE
  $ sf login

DESCRIPTION
  Log in interactively to Salesforce orgs and other services.

EXAMPLES
  $ sf login
```

_See code: [src/commands/login.ts](https://github.com/salesforcecli/plugin-login/blob/v0.0.4/src/commands/login.ts)_

## `sf login org`

Allows you to login to a Salesforce org using either the default https://login.salesforce.com portal or a specific instance URL as defined with a flag.

```
USAGE
  $ sf login org [--json] [-a <value>] [-b <value>] [-i <value>] [-l <value>] [-d]

FLAGS
  -a, --alias=<value>         Set an alias for the account or environment
  -b, --browser=<value>       Override system default browser with the specified browser.
  -d, --set-default           Set the org as the default org after login
  -i, --clientid=<value>      OAuth client ID (sometimes called the consumer key)
  -l, --instance-url=<value>  [default: https://login.salesforce.com] The login url

GLOBAL FLAGS
  --json  format output as json

DESCRIPTION
  Login to your Salesforce orgs.

  Allows you to login to a Salesforce org using either the default https://login.salesforce.com portal or a specific
  instance URL as defined with a flag.

EXAMPLES
  Login to an org.

    $ sf login org

  Login to an org and set an alias.

    $ sf login org --alias MyHub
```

## `sf login org jwt`

Log in to your Salesforce orgs using a JSON web token

```
USAGE
  $ sf login org jwt [--json] [-a <value>] [-l <value>] [-f <value> -u <value> -i <value>] [-d]

FLAGS
  -a, --alias=<value>         Set an alias for the account or environment
  -d, --set-default           Set the org as the default org after login
  -f, --jwt-key-file=<value>  Path to a file containing the private key
  -i, --clientid=<value>      OAuth client ID (sometimes called the consumer key)
  -l, --instance-url=<value>  [default: https://login.salesforce.com] The login url
  -u, --username=<value>      Authentication username

GLOBAL FLAGS
  --json  format output as json

DESCRIPTION
  Log in to your Salesforce orgs using a JSON web token

EXAMPLES
  $ sf login org jwt --jwt-key-file myorg.key --username me@salesforce.com --clientid XXXX
```

## `sf logout`

Log out of all Salesforce orgs and environments.

```
USAGE
  $ sf logout [--json]

GLOBAL FLAGS
  --json  format output as json

DESCRIPTION
  Log out of all Salesforce orgs and environments.

EXAMPLES
  $ sf logout
```

_See code: [src/commands/logout.ts](https://github.com/salesforcecli/plugin-login/blob/v0.0.4/src/commands/logout.ts)_
<!-- commandsstop -->
