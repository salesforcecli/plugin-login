# summary

Log out of all environments, such as Salesforce orgs and compute environments.

# description

By default, the command prompts you to confirm that you want to log out of all environments. You can't log out of selected environments, only all of them. Use --noprompt to not be prompted.

# examples

- Log out of all environments:

  <%= config.bin %> <%= command.id %>

- Log out of all environments with no confirmation prompt:

  <%= config.bin %> <%= command.id %> --noprompt

# flags.noprompt.summary

Don't prompt for confirmation.

# success

You are now logged out of all environments.

# config-removal-of-all-environment-authentications

Do you want to logout of all %d environments (y/n)?

# no-authentications-logged-out

No environments were logged out.
