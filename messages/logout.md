# summary

Log out interactively from environments.

# description

By default, the command prompts you to select which environments you want to log out of. Use --no-prompt to not be prompted and log out of all environments.

# examples

- Interactively select the environments to log out of:

  <%= config.bin %> <%= command.id %>

- Log out of all environments, without being prompted:

  <%= config.bin %> <%= command.id %> --no-prompt

# flags.no-prompt.summary

Don't prompt for confirmation; logs you out of all environments.

# success

You're now logged out of these environments: %s.

# failure

We failed to log you out of these environments: %s.

# warning

Warning: If you log out of a scratch org without having access to its password, you can't access this environment again, either through the CLI or the Salesforce UI.

# prompt.select-envs

Select the environments you want to log out of:

# prompt.confirm

Are you sure you want to log out of %d environment%s?

# prompt.confirm-all

Are you sure you want to log out of all your environments?

# no-environments

We didn't log you out of any environments.

# deprecationMessage

The logout command is deprecated. Use the environment-specific logout command, such as "sf org logout" or "sf logout functions".
