# Video 5.1: 
Setting up an Ethereum production environment

# Setup and Installation Guide:

# Install Truffle as a global node module:
`npm install -g truffle`

# Or, if the command fails because you need privileges:
`sudo npm install -g truffle`

# Change to our tests folder
(Create it first, if it doesn't exist):
```
mkdir tests
cd tests
```

# Install an instance of the tools suite:
`truffle init`

# Outputs:
```
✔ Preparing to download
✔ Downloading
✔ Cleaning up temporary files
✔ Setting up box

Unbox successful. Sweet!

Commands:

	Compile:        truffle compile
	Migrate:        truffle migrate
	Test contracts: truffle test
```

# Start a Truffle Private Blockchain Instance:
`truffle develop`

# Run a Truffle Migration:
`truffle migrate`

# Hard Reset and Run All Truffle Migrations
`truffle migrate --reset`

# Example: Exit From a truffle(develop) prompt
`truffle(develop) process.exit()`
