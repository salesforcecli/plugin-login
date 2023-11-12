# plugin-login

[![NPM](https://img.shields.io/npm/v/@salesforce/plugin-login.svg?label=@salesforce/plugin-login)](https://www.npmjs.com/package/@salesforce/plugin-login) [![Downloads/week](https://img.shields.io/npm/dw/@salesforce/plugin-login.svg)](https://npmjs.org/package/@salesforce/plugin-login) [![License](https://img.shields.io/badge/License-BSD%203--Clause-brightgreen.svg)](https://raw.githubusercontent.com/salesforcecli/plugin-login/main/LICENSE.txt)

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

To use your plugin, run using the local `./bin/dev` or `./bin/dev.cmd` file.

```bash
# Run using local run file.
./bin/dev login
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

- [`sf login`](#sf-login)
- [`sf logout`](#sf-logout)

## `sf login`

Log interactively into an environment.

```
USAGE
  $ sf login

DESCRIPTION
  Log interactively into an environment.

  NOTE: This general command is deprecated. Use specific commands instead, such as "org login web" or "org login jwt".

  Logging into an environment authorizes the CLI to run other commands that connect to that environment.

EXAMPLES
  Log in interactively:

    $ sf login
```

_See code: [src/commands/login.ts](https://github.com/salesforcecli/plugin-login/blob/2.0.2/src/commands/login.ts)_

## `sf logout`

Log out interactively from environments.

```
USAGE
  $ sf logout [--json] [--no-prompt]

FLAGS
  --no-prompt  Don't prompt for confirmation; logs you out of all environments.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Log out interactively from environments.

  NOTE: This general command is deprecated. Use specific commands instead, such as "org login web" or "org login jwt".

  By default, the command prompts you to select which environments you want to log out of. Use --no-prompt to not be
  prompted and log out of all environments.

EXAMPLES
  Interactively select the environments to log out of:

    $ sf logout

  Log out of all environments, without being prompted:

    $ sf logout --no-prompt
```

_See code: [src/commands/logout.ts](https://github.com/salesforcecli/plugin-login/blob/2.0.2/src/commands/logout.ts)_

<!-- commandsstop -->
