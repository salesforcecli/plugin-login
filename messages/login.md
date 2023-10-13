# summary

Log interactively into an environment.

# description

NOTE: This general command is deprecated. Use specific commands instead, such as "org login web" or "org login jwt".

Logging into an environment authorizes the CLI to run other commands that connect to that environment.

# examples

- Log in interactively:

  <%= config.bin %> <%= command.id %>

# deprecationMessage

The login command is deprecated. Use the environment-specific login command, such as "sf org login" or "sf login functions".
