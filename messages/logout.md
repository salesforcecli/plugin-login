# summary

Log out of all environments, such as Salesforce orgs and compute environments.

# examples

- Log out of all environments:

<%= config.bin %> <%= command.id %>

- Log out of all environments with no confirmation prompt:

<%= config.bin %> <%= command.id %> --no-prompt

# flags.prompt.summary

Tells logout command if one wants to confirm the removal of all authentications from all environments.

# success

You are now logged out of all environments.

# config-removal-of-all-environment-authentications

Do you wish to logout of all %d environments (y/n)?

# no-authentications-logged-out

No environments were logged out.
