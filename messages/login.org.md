# description

login to a salesforce org via the web or JWT

# examples

- sf login org
- sf login org --alias MyHub
- sf login org --jwt-file myorg.key --jwt-user me@salesforce.com --client-id XXXX

# alias

set an alias for the authenticated org

# loginUrl

the login url

# jwtFile

path to a file containing the private key

# jwtUser

authentication username for JWT auth

# clientId

OAuth client ID (sometimes called the consumer key)

# success

Successfully authorized %s with ID %s

# invalidClientId

Invalid client credentials. Verify the OAuth client secret and ID. %s
