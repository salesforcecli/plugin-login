# summary

Login to your Salesforce orgs.

# description

Allows you to login to a Salesforce org using either the default https://login.salesforce.com portal or a specific instance URL as defined with a flag.

# examples

- Login to an org.
  sf login org
- Login to an org and set an alias.
  sf login org --alias MyHub

# flags.summary.alias

Set an alias for the account or environment

# flags.summary.browser

Override system default browser with the specified browser.

# flags.summary.clientId

OAuth client ID (sometimes called the consumer key)

# flags.description.instanceUrl

The login url

# flags.summary.setDefault

Set the org as the default org after login
