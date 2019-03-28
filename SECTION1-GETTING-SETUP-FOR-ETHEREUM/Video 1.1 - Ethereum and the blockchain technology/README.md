# Video 1.1: 
Ethereum and the blockchain technology

#Installation & Setup Instructions:

# Connect to your JSON RPC instance, e.g.:
`ssh -i "ethbox.pem" ubuntu@34.234.234.23`

# Check if JSON RPC instance started
`ps aux | grep parity`

# If no, start an instance of Parity (with root user permissions) syncing the Kovan testnet
# We will run the instance as a background process
```
sudo su
nohup parity --chain=kovan --jsonrpc-hosts=all --jsonrpc-interface=all --jsonrpc-cors=all >/dev/null 2>&1 &
exit
```

# Fetch the latest block data from Parity using `curl`
# This method can also be used for users running Geth
`curl -H 'Content-Type: application/json' -X POST --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":83}' localhost:8545`

# Since the resulting number from JSON RPC is a hex value we need to convert it
# to a regular integer, this is easy to do using the JavaScript `parseInt()` function
# which, if Node.js is installed, can be run in the same bash instance
node
```
// Remember to replace hexValue with the JSON RPC result :)
console.log(parseInt(hexValue));
process.exit();
```