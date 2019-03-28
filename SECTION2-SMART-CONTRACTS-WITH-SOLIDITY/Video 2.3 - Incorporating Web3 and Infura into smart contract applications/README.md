# Video 2.3: 
Incorporating Web3 and Infura into smart contract applications

# Setup and Installation Guide:

Let's start by using the Infura open permissions RPC interface to check out the latest block Infura has of the Kovan testnet:

```
curl -H 'Content-Type: application/json' -X POST --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":83}' https://kovan.infura.io/
```

To use web3 we need it in our local node modules

# Start by creating a new npm project:
```
npm init
```

Follow the prompts to get your package.json file created

# Now we can save web3.js as a dependency:
```
npm install web3
```

# Start node:
```
$ node
```

First we need an instance of the Web3 node library

```
> const Web3 = require('web3');
```

Now that we have access to the Web3 library, we need an instance of Web3 that's connected to an Ethereum testnetwhere we want to deploy smart contract to (e.g. https://kovan.infura.io/):

```
> const web3 = new Web3(new Web3.providers.HttpProvider("https://kovan.infura.io/"));
```

Now that we have access to a configured instance of Web3 connected to the correct blockchain, we can query it:

```
> let latestBlock = web3.eth.getBlock('latest');
> console.log(latestBlock)
```

# Example Return:
```
: ' 
Promise {
  { author: '0x0010f94b296a852aaac52ea6c5ac72e03afd032d',
  difficulty: '340282366920938463463374607431768211454',
  extraData: '0xde830200088f5061726974792d457468657265756d86312e32392e30826c69',
  gasLimit: 8000000,
  gasUsed: 163903,
  hash: '0xc777d471381be07d7791c21f3f89a3cf4abf59b2bd23ece6a25e9ff9f1a22934',
  logsBloom: '0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
  miner: '0x0010f94b296A852aAac52EA6c5Ac72e03afD032D',
  number: 9146454,
  parentHash: '0x8e9c82d1dcb310d67db0a99579f23a7ac851cee91ca9985eb618c77735a20930',
  receiptsRoot: '0x357266380b28a948a6e308033aa8ef992400fc7fd30c942b4d96b012d1c04b5d',
  sealFields:
   [ '0x8416f33ba9',
     '0xb8413cfae690d7b7561849e32c6426f6876ec326e8778ea10982aafd69662f7da454282f9fe706cc75650e59ae519315d8d05fc017b4bcafa9d0cc33dd60d9bbdbe200' ],
  sha3Uncles: '0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347',
  signature: '3cfae690d7b7561849e32c6426f6876ec326e8778ea10982aafd69662f7da454282f9fe706cc75650e59ae519315d8d05fc017b4bcafa9d0cc33dd60d9bbdbe200',
  size: 1321,
  stateRoot: '0xabe4de535de2f1f9fe53a14bffaffe0033cc8c08452cd9428faaf2ee156c68e0',
  step: '385039273',
  timestamp: 1540157092,
  totalDifficulty: '3061933898263492296013089343211648216255178026',
  transactions:
   [ '0x91fe3eb0a19a71fab509fd245ead1d389cddceace27b91664bc39d7cc9222c28',
     '0x72ee98a3b705945306d30f2963248a16bc8ff741cc9576f7626448eeb6db4d87' ],
  transactionsRoot: '0xc9c91cc35eaa0e8471305b7707e34b25a5f8f23fe348008a870af66e065eb2ee',
  uncles: [] },
  domain:
   Domain {
     domain: null,
     _events: { error: [Function: debugDomainError] },
     _eventsCount: 1,
     _maxListeners: undefined,
     members: [] } }
'
```
