# summary
  
Log interactively into an environment, such as a Salesforce org.

# description

Logging into an environment authorizes the CLI to run other commands that connect to that environment, such as deploying or retrieving metadata to and from an org.

The command first prompts you to choose an environment from a list of available ones. It then opens a browser to the appropriate login URL, such as https://login.salesforce.com for an org. Then, depending on the environment you choose, the command prompts for other actions, such as giving the environment an alias or setting it as your default.

This command is fully interactive and has no flags other than displaying the command-line help. Each environment has its own specific login command, such as "sf login org", which usually provide more flags than this interactive one. For more information about the interactive prompts from this command, see the help for the environment-specific command, such as "sf login org --help".

# examples

- Log in interactively:

  <%= config.bin %> <%= command.id %>

# success

You're now logged in to %s.
