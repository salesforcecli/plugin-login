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

- [`sf login`](#sf-login)
- [`sf login org`](#sf-login-org)
- [`sf login org jwt`](#sf-login-org-jwt)
- [`sf logout`](#sf-logout)
- [`sf logout org`](#sf-logout-org)

## `sf login`

Log interactively into an environment, such as a Salesforce org.

```
USAGE
  $ sf login

DESCRIPTION
  Log interactively into an environment, such as a Salesforce org.

  Logging into an environment authorizes the CLI to run other commands that connect to that environment, such as
  deploying or retrieving metadata to and from an org.

  The command first prompts you to choose an environment from a list of available ones. It then opens a browser to the
  appropriate login URL, such as https://login.salesforce.com for an org. Then, depending on the environment you choose,
  the command prompts for other actions, such as giving the environment an alias or setting it as your default.

  This command is fully interactive and has no flags other than displaying the command-line help. Each environment has
  its own specific login command, such as "sf login org", which usually provide more flags than this interactive one.
  For more information about the interactive prompts from this command, see the help for the environment-specific
  command, such as "sf login org --help".

EXAMPLES
  Log in interactively:

    $ sf login
```

_See code: [src/commands/login.ts](https://github.com/salesforcecli/plugin-login/blob/v1.0.8/src/commands/login.ts)_

## `sf login org`

Log in to a Salesforce org using the web server flow.

```
USAGE
  $ sf login org [--json] [-a <value>] [-b <value>] [-i <value>] [-l <value>] [-d] [-v]

FLAGS
  -a, --alias=<value>         Alias for the org.
  -b, --browser=<value>       Browser in which to open the org.
  -d, --set-default           Set the org as the default that all org-related commands run against.
  -i, --clientid=<value>      OAuth client id (also called consumer key) of your custom connected app.
  -l, --instance-url=<value>  [default: https://login.salesforce.com] URL of the instance that the org lives on.
                              (defaults to https://login.salesforce.com)
  -v, --set-default-dev-hub   Set the org as the default Dev Hub for scratch org creation.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Log in to a Salesforce org using the web server flow.

  Opens a Salesforce instance URL in a web browser so you can enter your credentials and log in to your org. After you
  log in, you can close the browser window.

  Logging into an org authorizes the CLI to run other commands that connect to that org, such as deploying or retrieving
  a project. You can log into many types of orgs, such as sandboxes, Dev Hubs, Env Hubs, production orgs, and scratch
  orgs.

  We recommend that you set an alias when you log into an org. Aliases make it easy to later reference this org when
  running commands that require it. If you don’t set an alias, you use the username that you specified when you logged
  in to the org. If you run multiple commands that reference the same org, consider setting the org as your default. Use
  --set-default for your default scratch org or sandbox, or --set-default-dev-hub for your default Dev Hub.

  By default, this command uses the global out-of-the-box connected app in your org. If you need more security or
  control, such as setting the refresh token timeout or specifying IP ranges, create your own connected app using a
  digital certificate. Make note of the consumer key (also called cliend id) that’s generated for you. Then specify the
  consumer key with the --clientid flag.

EXAMPLES
  Run the command with no flags to open the default Salesforce login page (https://login.salesforce.com):

    $ sf login org

  Log in to your Dev Hub, set it as your default Dev Hub, and set an alias that you reference later when you create a
  scratch org:

    $ sf login org --set-default-dev-hub --alias dev-hub

  Log in to a sandbox and set it as your default org:

    $ sf login org --instance-url https://MyDomainName--SandboxName.sandbox.my.salesforce.com --set-default

  Use --browser to specify a specific browser, such as Google Chrome:

    $ sf login org --instance-url https://MyDomainName--SandboxName.sandbox.my.salesforce.com --set-default \
      --browser chrome

  Use your own connected app by specifying its consumer key (also called client ID):

    $ sf login org --instance-url https://MyDomainName--SandboxName.sandbox.my.salesforce.com --set-default \
      --browser chrome --clientid 04580y4051234051

FLAG DESCRIPTIONS
  -b, --browser=<value>  Browser in which to open the org.

    You can log in to an org with one of the following browsers: Firefox, Safari, Google Chrome, or Windows Edge. If you
    don’t specify --browser, the command uses your default browser. The exact names of the browser applications differ
    depending on the operating system you're on; check your documentation for details.

  -l, --instance-url=<value>  URL of the instance that the org lives on. (defaults to https://login.salesforce.com)

    If you specify --instance-url, the value overrides the sfdcLoginUrl value in your sfdx-project.json file.

    To specify a My Domain URL, use the format https://yourcompanyname.my.salesforce.com.

    To specify a sandbox, set --instance-url to https://MyDomainName--SandboxName.sandbox.my.salesforce.com.
```

## `sf login org jwt`

Log in to a Salesforce org using a JSON web token (JWT).

```
USAGE
  $ sf login org jwt [--json] [-a <value>] [-l <value>] [-f <value> -u <value> -i <value>] [-d] [-v]

FLAGS
  -a, --alias=<value>         Alias for the org.
  -d, --set-default           Set the org as the default that all org-related commands run against.
  -f, --keyfile=<value>       Path to a file containing the private key.
  -i, --clientid=<value>      OAuth client id (also called consumer key) of your custom connected app.
  -l, --instance-url=<value>  [default: https://login.salesforce.com] URL of the instance that the org lives on.
  -u, --username=<value>      Username of the user logging in.
  -v, --set-default-dev-hub   Set the org as the default Dev Hub for scratch org creation.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Log in to a Salesforce org using a JSON web token (JWT).

  Use this command in automated environments where you can’t interactively log in with a browser, such as in CI/CD
  scripts.

  Logging into an org authorizes the CLI to run other commands that connect to that org, such as deploying or retrieving
  a project. You can log into many types of orgs, such as sandboxes, Dev Hubs, Env Hubs, production orgs, and scratch
  orgs.

  Complete these steps before you run this command:

  1. Create a digital certificate (also called digital signature) and the private key to sign the certificate. You can
  use your own key and certificate issued by a certification authority. Or use OpenSSL to create a key and a self-signed
  digital certificate.

  2. Store the private key in a file on your computer. When you run this command, you set the --keyfile flag to this
  file.

  3. Create a custom connected app in your org using the digital certificate. Make note of the consumer key (also called
  client id) that’s generated for you. Be sure the username of the user logging in is approved to use the connected app.
  When you run this command, you set the --clientid flag to the consumer key.

  See https://developer.salesforce.com/docs/atlas.en-us.sfdx_dev.meta/sfdx_dev/sfdx_dev_auth_jwt_flow.htm for more
  information.

  We recommend that you set an alias when you log into an org. Aliases make it easy to later reference this org when
  running commands that require it. If you don’t set an alias, you use the username that you specified when you logged
  in to the org. If you run multiple commands that reference the same org, consider setting the org as your default. Use
  --set-default for your default scratch org or sandbox, or --set-default-dev-hub for your default Dev Hub.

EXAMPLES
  Log into an org with username jdoe@example.org and on the default instance URL (https://login.salesforce.org). The
  private key is stored in the file /Users/jdoe/JWT/server.key and the command uses the connected app with consumer
  key (client id) 04580y4051234051.

    $ sf login org jwt --username jdoe@example.org --keyfile /Users/jdoe/JWT/server.key --clientid 04580y4051234051

  Set the org as the default and give it an alias:

    $ sf login org jwt --username jdoe@example.org --keyfile /Users/jdoe/JWT/server.key --clientid 04580y4051234051 \
      --alias ci-org --set-default

  Set the org as the default Dev Hub and give it an alias:

    $ sf login org jwt --username jdoe@example.org --keyfile /Users/jdoe/JWT/server.key --clientid 04580y4051234051 \
      --alias ci-dev-hub --set-default-dev-hub

  Log in to a sandbox using URL https://MyDomainName--SandboxName.sandbox.my.salesforce.com:

    $ sf login org jwt --username jdoe@example.org --keyfile /Users/jdoe/JWT/server.key --clientid 04580y4051234051 \
      --alias ci-org --set-default --instance-url https://MyDomainName--SandboxName.sandbox.my.salesforce.com

FLAG DESCRIPTIONS
  -l, --instance-url=<value>  URL of the instance that the org lives on.

    If you specify an --instance-url value, this value overrides the sfdcLoginUrl value in your sfdx-project.json file.

    To specify a My Domain URL, use the format https://yourcompanyname.my.salesforce.com.

    To specify a sandbox, set --instance-url to https://MyDomainName--SandboxName.sandbox.my.salesforce.com.
```

## `sf logout`

Log out interactively from environments, such as Salesforce orgs and compute environments.

```
USAGE
  $ sf logout [--json] [--no-prompt]

FLAGS
  --no-prompt  Don't prompt for confirmation; logs you out of all environments.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Log out interactively from environments, such as Salesforce orgs and compute environments.

  By default, the command prompts you to select which environments you want to log out of. Use --no-prompt to not be
  prompted and log out of all environments.

  Be careful! If you log out of a scratch org without having access to its password, you can't access the scratch org
  again, either through the CLI or the Salesforce UI.

EXAMPLES
  Interactively select the environments to log out of:

    $ sf logout

  Log out of all environments, without being prompted:

    $ sf logout --no-prompt
```

_See code: [src/commands/logout.ts](https://github.com/salesforcecli/plugin-login/blob/v1.0.8/src/commands/logout.ts)_

## `sf logout org`

Log out of a specified Salesforce org.

```
USAGE
  $ sf logout org -o <value> [--json] [--no-prompt]

FLAGS
  -o, --target-org=<value>  (required) Org alias or username to log out of.
  --no-prompt               Don't prompt for confirmation.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Log out of a specified Salesforce org.

  By default, the command prompts you to confirm that you want to log out of the specified org. Use --no-prompt to not
  be prompted.

  Be careful! If you log out of a scratch org without having access to its password, you can't access the scratch org
  again, either through the CLI or the Salesforce UI.

EXAMPLES
  Log out of an org with alias "ci-org":

    $ sf logout org --target-org ci-org

  If your org doesn’t have an alias, specify the username that you used when you logged into it:

    $ sf logout org --target-org jdoe@example.org
```

<!-- commandsstop -->
