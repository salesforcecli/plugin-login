# summary

Log out of all environments, such as Salesforce orgs and compute environments.

# description

By default, the command prompts you to select which environments you want to log out of. Use --no-prompt to not be prompted and log out of all environments.

# examples

- Log out of all environments:

  <%= config.bin %> <%= command.id %>

- Log out of all environments with no confirmation prompt:

  <%= config.bin %> <%= command.id %> --noprompt

# flags.no-prompt.summary

Don't prompt for confirmation.

# success

You are now logged out of these environments: %s.

# prompt.select-envs

Select the environments you want to logout of:

# prompt.confirm

Are you sure want to logout of %d environments?

# prompt.confirm-all

Are you sure want to logout of all of your environments?

# no-environments

No environments were logged out.
