pragma solidity ^0.4.23;

contract SimpleOutput {
    function arithmetics(uint _a, uint _b) public pure returns (uint sum, uint product) {
        sum = _a + _b;
        product = _a * _b;
    }
}