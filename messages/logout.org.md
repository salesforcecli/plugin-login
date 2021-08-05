# summary

Log out of a specified Salesforce org.

# description

By default, the command prompts you to confirm that you want to log out of the specified org. Use --no-prompt to not be prompted.

# examples

- Log out of an org with alias "ci-org":

  <%= config.bin %> <%= command.id %> --target-org ci-org

- If your org doesn’t have an alias, specify the username that you used when you logged into it:

  <%= config.bin %> <%= command.id %> --target-org jdoe@example.org

# flags.target-org.summary

Org alias or username to log out of.

# flags.no-prompt.summary

Don't prompt for confirmation.

# prompt.confirm

Are you sure you want to logout of %s?

# success

You are now logged out of %s.

# failure

We failed to log out of %s.

# warning

Warning: If you log out of a scratch org without having access to its password you won't be able to access this environment again, either through the CLI or the Salesforce UI.
