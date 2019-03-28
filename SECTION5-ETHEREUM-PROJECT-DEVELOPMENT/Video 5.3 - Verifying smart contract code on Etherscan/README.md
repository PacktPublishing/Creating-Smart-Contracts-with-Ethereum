# Video 5.3: 
Verifying smart contract code on Etherscan

# Important Info:


# Etherscan.io Verify URLs:

	- Mainnet: https://etherscan.io/verifyContract2
	- Kovan: https://kovan.etherscan.io/verifyContract2
	- Rinkeby: https://rinkeby.etherscan.io/verifyContract2
	- Ropsten: https://ropsten.etherscan.io/verifyContract2

# Links to ABI Encoders:

	- https://abi.hashex.org/
	- https://adibas03.github.io/online-ethereum-abi-encoder-decoder/#/
	- (Or manually build the encoder locally): https://github.com/adibas03/online-ethereum-abi-encoder-decoder

# Install truffle-flattener
`npm install truffle-flattener -g`

# Change to contracts folder
```
cd tests/contracts
ls -l
```

# Outputs:
```
total 48
-rw-r--r--  1 apple  staff    515 24 Mar 20:26 Migrations.sol
-rw-r--r--  1 apple  staff    860 13 Mar 20:19 libstring.sol
-rw-r--r--  1 apple  staff  14788 13 Mar 20:19 tictactoe.sol
```

# Create flattened version of TicTacToe contract
`truffle-flattener tictactoe.sol > flattened.sol`

# Now the directory looks like this:
`ls -l`

# Outputs:
```
total 80
-rw-r--r--  1 apple  staff    515 24 Mar 20:26 Migrations.sol
-rw-r--r--  1 apple  staff  15694 26 Mar 01:43 flattened.sol
-rw-r--r--  1 apple  staff    860 13 Mar 20:19 libstring.sol
-rw-r--r--  1 apple  staff  14788 13 Mar 20:19 tictactoe.sol
```
