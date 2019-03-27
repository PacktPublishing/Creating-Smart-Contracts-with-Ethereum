pragma solidity ^0.4.25;

contract Mortal {
    /* Define variable owner of the type address */
    address owner;

    /* This function is executed at initialization and sets the owner of the contract */
    constructor() public { 
        owner = msg.sender; 
    }
}

contract Greeter is Mortal {
    /* Define variable greeting of the type string */
    string greeting;

    /* This runs when the contract is executed */
    constructor() public {
        greeting = "Hello world";
    }

    /* Main function */
    function greet() public constant returns (string) {
        return greeting;
    }
}