// tests/test/TestGameCreation.sol
pragma solidity ^0.4.24;

import "truffle/Assert.sol"; // A helper library, for testing contracts, that extends base Solidity Assert fn
import "truffle/DeployedAddresses.sol"; // A helper library to keep track of deployed addresses of the contract
import "../contracts/tictactoe.sol"; // A contract we want to test
import "../contracts/libstring.sol"; // A contract we want to test

contract TestGameCreation {
    TicTacToe gamesInstance;

    /**
     * First we get a deployed instance (from Truffle deployments) of the 
     * contract we're writing this unit test for
     */
    constructor() public {
        gamesInstance = TicTacToe(DeployedAddresses.TicTacToe());
    }

    /**
     * Verify our contract is created with a clean slate: zero games
     */
    function testInitiallyEmpty() public {
        Assert.equal(gamesInstance.getOpenGames().length, 0, "The games array should be empty at the begining");
    }

    /**
     * Tests for our implementation of random number hashing using the libstring child contract
     */
    function testHashingFunction() public {
        // Create 3 random number hashes from both smart contract instances 
        // (libstring and tictactoe) and verify them
        // #1 
        bytes32 hash1 = gamesInstance.saltedHash(123, "A secret salt phrase");
        bytes32 hashA = LibString.saltedHash(123, "A secret salt phrase");
        // #2 - Same number but with a different salt
        bytes32 hash2 = gamesInstance.saltedHash(123, "A different salt phrase");
        bytes32 hashB = LibString.saltedHash(123, "A different salt phrase");
        // #3 - Different number and different salt
        bytes32 hash3 = gamesInstance.saltedHash(234, "A secret salt phrase");
        bytes32 hashC = LibString.saltedHash(234, "A secret salt phrase");
        
        // Check for a valid hash value
        Assert.isNotZero(hash1, "Salted hash should be valid");

        // Check to make sure calling the libstring contract directly
        // always produces the same output hash
        Assert.equal(hash1, hashA, "Hash for gamesInstance should match hash from directly calling libstring");
        Assert.equal(hash2, hashB, "Hash for gamesInstance should match hash from directly calling libstring");
        Assert.equal(hash3, hashC, "Hash for gamesInstance should match hash from directly calling libstring");
        // Check to make sure different salts and numbers are correctly
        // changing the hash value
        Assert.notEqual(hash1, hash2, "Different salt should produce different hashes");
        Assert.notEqual(hash1, hash3, "Different numbers should produce different hashes");
        Assert.notEqual(hash2, hash3, "Different numbers and salt should produce different hashes");
    }

    /**
     * Verify creating a new game
     */
    function testGameCreation() public {
        uint8[9] memory cells;
        uint8 status;
        uint amount;
        uint lastTransaction;
        string memory nicknamePlayer1;
        string memory nicknamePlayer2;

        // Create a game salt
        bytes32 hash = gamesInstance.saltedHash(123, "player salt goes here");

        // Create the first game
        uint32 gameIndex = gamesInstance.createGame(hash, "player1 screen name");

        // Verify the first created game has the correct index
        Assert.equal(uint(gameIndex), 0, "The first game should have index 0");

        // Verify the 1 game was actually created and no others
        uint32[] memory openGames = gamesInstance.getOpenGames();
        Assert.equal(openGames.length, 1, "One game should have been created");
        Assert.equal(uint(openGames[0]), 0, "The first game should have index 0");

        // Verify the game was created with an empty paying board
        (cells, status, amount, nicknamePlayer1, nicknamePlayer2) = gamesInstance.getGameInfo(gameIndex);
        Assert.equal(uint(cells[0]), 0, "The board should be empty");
        Assert.equal(uint(cells[1]), 0, "The board should be empty");
        Assert.equal(uint(cells[2]), 0, "The board should be empty");
        Assert.equal(uint(cells[3]), 0, "The board should be empty");
        Assert.equal(uint(cells[4]), 0, "The board should be empty");
        Assert.equal(uint(cells[5]), 0, "The board should be empty");
        Assert.equal(uint(cells[6]), 0, "The board should be empty");
        Assert.equal(uint(cells[7]), 0, "The board should be empty");
        Assert.equal(uint(cells[8]), 0, "The board should be empty");

        // Verify the game hasn't been started
        Assert.equal(uint(status), 0, "The game should not be started");

        // Verify the bid amount was 0
        Assert.equal(amount, 0, "The first bid amount should be zero");

        // Verify player screen names
        Assert.equal(nicknamePlayer1, "player1 screen name", "The first player screen name should be: 'player1 screen name'");
        Assert.isEmpty(nicknamePlayer2, "nicknamePlayer2 should be empty");

        // Verify the transaction timestamp tracker is setting timestamps correctly
        lastTransaction = gamesInstance.getGameTimestamp(gameIndex);
        Assert.isAbove(lastTransaction, 0, "The first player's transaction timestamp should be already set");
    }

    /**
     * Verify accepting a newly created game
     */
    function testGameAccepted() public {
        uint8[9] memory cells;
        uint8 status;
        uint amount;
        uint lastTransaction;
        string memory nicknamePlayer1;
        string memory nicknamePlayer2;

        // Verify that only one openGame is available to be accepted
        uint32[] memory openGames = gamesInstance.getOpenGames();
        Assert.equal(openGames.length, 1, "One game should be available");

        // Verify that accepting a game works
        uint32 gameIndex = openGames[0];
        gamesInstance.acceptGame(gameIndex, 234, "player2 screen name");
        // After accepting the game has processed verify
        // the accepted game can't be accepted anymore
        openGames = gamesInstance.getOpenGames();
        Assert.equal(openGames.length, 0, "The game should not be available anymore");

        // Verify the game board playing state is still unplayed
        (cells, status, amount, nicknamePlayer1, nicknamePlayer2) = gamesInstance.getGameInfo(gameIndex);
        Assert.equal(uint(cells[0]), 0, "The board should be empty");
        Assert.equal(uint(cells[1]), 0, "The board should be empty");
        Assert.equal(uint(cells[2]), 0, "The board should be empty");
        Assert.equal(uint(cells[3]), 0, "The board should be empty");
        Assert.equal(uint(cells[4]), 0, "The board should be empty");
        Assert.equal(uint(cells[5]), 0, "The board should be empty");
        Assert.equal(uint(cells[6]), 0, "The board should be empty");
        Assert.equal(uint(cells[7]), 0, "The board should be empty");
        Assert.equal(uint(cells[8]), 0, "The board should be empty");

        // Verify the game still hasn't started yet
        Assert.equal(uint(status), 0, "The game should not be started");
        
        // Verify the bid amount was 0
        Assert.equal(amount, 0, "The first bid amount should be zero");

        // Verify player screen names
        Assert.equal(nicknamePlayer1, "player1 screen name", "The first player screen name should be: 'player1 screen name'");
        Assert.equal(nicknamePlayer2, "player2 screen name", "The second player screen name should be: 'player2 screen name'");

        // Verify the transaction timestamp tracker is setting timestamps correctly
        lastTransaction = gamesInstance.getGameTimestamp(gameIndex);
        Assert.isAbove(lastTransaction, 0, "The first player's transaction timestamp should be already set");
    }
}