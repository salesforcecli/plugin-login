# description

login to a salesforce org via the web or JWT

# examples

- sf login org
- sf login org --alias MyHub
- sf login org --jwt-key-file myorg.key --username me@salesforce.com --clientid XXXX

# alias

Set an alias for the account or environment

# instanceUrl

The login url

# audienceUrl

Audience URL for the given instance url

# browser

Override system default browser with the specified browser

# jwtFile

Path to a file containing the private key

# jwtUser

Authentication username

# clientId

OAuth client ID (sometimes called the consumer key)

# setDefault

Set the org as the default org after login

# invalidClientId

Invalid client credentials. Verify the OAuth client secret and ID. %s
