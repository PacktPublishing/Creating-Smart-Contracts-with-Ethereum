# Video 2.4: 
Interacting with smart contracts using Web3 and Infura

# Setup and Installation Guide:

# First we startup node and bootstrap our Web3 environment again
```
$ node
> const Web3 = require('web3');
> const web3 = new Web3(new Web3.providers.HttpProvider("https://kovan.infura.io/"));
```

# Next we store a reference to our ABI
```
> const contractAbi = [{"constant": true,"inputs":[],"name":"greet","outputs":[{"name": "","type": "string"}],"payable": false,"stateMutability": "view","type": "function"},{"inputs": [],"payable": false,"stateMutability": "nonpayable","type": "constructor"}];
```

# And our contract address too
```
> const contractAddress = "0x0e6dd50782dde9132f8e703722dc5cbfe45bca04";
```

# Next we create a Web3 instance that's interfaced with our contract
```
> let contractInstance = new web3.eth.contract(ContractAbi, contractAddress);
```                                                                            

# Sweet, now we can call our contract. If our Ethereum provider node from Infura has the block data
# for the transaction where our contract is deployed, calling our contract greet() function returns 
# the desired output, namely the words "Hello world"

# First, let's store our method and method callback in local variables 
```
> let Greeter = contractInstance.methods.greet();
> let greeting = Greeter.call();
```

# Now we can call our method
```
> console.log(greeting);
```

# Example Return:
```
: '
Promise {
  'Hello world',
  domain:
   Domain {
     domain: null,
     _events: { error: [Function: debugDomainError] },
     _eventsCount: 1,
     _maxListeners: undefined,
     members: [] } }
'
```