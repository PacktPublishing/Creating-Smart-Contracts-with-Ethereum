const LibString = artifacts.require("libstring");
const TicTacToe = artifacts.require("tictactoe");

module.exports = function(deployer) {
  // deployment steps
  deployer.deploy(LibString);
  deployer.link(LibString, TicTacToe)
  deployer.deploy(TicTacToe, 5); // Game timeout of 5 seconds (since we can confirm blocks so quickly)
};