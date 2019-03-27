pragma solidity ^0.4.23;

contract owned {
    constructor() public { owner = msg.sender; }
    address owner;

    modifier onlyOwner {
        require(
            msg.sender == owner,
            "Only owner can call this function."
        );
        _;
    }
}

contract mortal is owned {
    function close() public onlyOwner {
        selfdestruct(owner);
    }
}