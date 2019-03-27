// src/contracts/tictactoe.js

import { getInjectedWeb3, getWebSocketWeb3 } from "./web3"
import ticTacToeAbi from '../../contracts/tictactoe.abi.json';

const CONTRACT_ADDRESS = '0x93118ae10da8e690e550bc5424fbe7d1da8369d4';
const NETWORK = "rinkeby";
const ENDPOINT = "https://rinkeby.infura.io/";

const contract = {
    address: CONTRACT_ADDRESS,
    network: NETWORK,
    endpoint: ENDPOINT,
    abi: ticTacToeAbi
};

export default function (useBrowserWeb3 = false) {
    let web3 = null;
    if (useBrowserWeb3) {
        web3 = getInjectedWeb3();
    }
    else {
        web3 = getWebSocketWeb3();
    }
    
    let instance = new web3.eth.Contract(contract.abi, contract.address);
    return instance;
}