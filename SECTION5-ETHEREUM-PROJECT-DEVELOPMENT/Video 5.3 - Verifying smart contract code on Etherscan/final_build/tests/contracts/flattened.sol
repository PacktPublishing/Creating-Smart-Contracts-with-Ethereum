
// File: contracts/libstring.sol

pragma solidity ^0.4.24;

library LibString {
    function saltedHash(uint8 randomNumber, string salt) public pure returns (bytes32) {
        bytes memory bNum = new bytes(1);
        bNum[0] = byte(randomNumber);

        return keccak256(bytes(concat(string(bNum), salt)));
    }
    
    function concat(string first, string second) internal pure returns (string){
        bytes memory bFirst = bytes(first);
        bytes memory bSecond = bytes(second);
        string memory memStr = new string(bFirst.length + bSecond.length);
        bytes memory result = bytes(memStr);
        uint k = 0;
        for (uint i = 0; i < bFirst.length; i++) {
            result[k] = bFirst[i];
            k++;
        }
        for (i = 0; i < bSecond.length; i++) {
            result[k] = bSecond[i];
            k++;
        }
        return string(result);
    }
}

// File: contracts/tictactoe.sol

pragma solidity ^0.4.24;


contract TicTacToe {
    // DATA
    struct Game {
        uint32 openListIndex; // position in openGames[]
        uint8[9] cells; // the game board
        uint8 status;
        uint amount; // amount of money each user has sent (their stake in the game)
        address[2] players;
        string[2] playerNicknames;
        uint lastTransaction; // timestamp => block number
        bool[2] withdrawn;
        bytes32 creator;
        uint8 guestRandomNumber;
    }
    uint32[] openGames; // list of active games' id's
    uint32 nextGameIndex;
    uint16 public timeout;
    mapping(uint32 => Game) gamesData; // data containers

    // EVENTS
    event GameCreated(uint32 indexed gameIndex);
    event GameAccepted(uint32 indexed gameIndex, address indexed opponent);
    event GameStarted(uint32 indexed gameIndex, address indexed opponent);
    event PositionMarked(uint32 indexed gameIndex, address indexed opponent);
    event GameEnded(uint32 indexed gameIndex, address indexed opponent);

    constructor(uint16 givenTimeout) public {
        if (givenTimeout != 0) {
            timeout = givenTimeout;
        }
        else {
            timeout = 10 minutes;
        }
    }

    // CALLABLE
    function getOpenGames() public view returns (uint32[]){
        return openGames;
    }

    /**
     * Get information about a given game
     * @param gameIndex {uint32}: the game to analyze
     * @return {uint8[9]} cells, {uint8} status, {uint} amount, {string} nicknamePlayer1, {string} nicknamePlayer2
     */
    function getGameInfo(uint32 gameIndex) public view returns (uint8[9] cells, uint8 status, uint amount, string nicknamePlayer1, string nicknamePlayer2) {
        return (
            gamesData[gameIndex].cells,
            gamesData[gameIndex].status,
            gamesData[gameIndex].amount,
            gamesData[gameIndex].playerNicknames[0],
            gamesData[gameIndex].playerNicknames[1]
        );
    }

    /**
     * Get the last transaction time of a given game.
     * Ex. can use this to check if a game is not longer valid / open, or if it's expired
     * @param gameIndex {uint32}: the game to analyze
     * @return {uint} lastTransaction
     */
    function getGameTimestamp(uint32 gameIndex) public view returns (uint lastTransaction) {
        return (gamesData[gameIndex].lastTransaction);
    }

    /**
     * Get the wallet addresses / identities of the players in a given game
     * @param gameIndex {uint32}: the game to analyze
     */
    function getGamePlayers(uint32 gameIndex) public view returns (address player1, address player2) {
        return (
            gamesData[gameIndex].players[0],
            gamesData[gameIndex].players[1]
        );
    }

    /**
     * Get booking keeping (withdrawals) from a particular game
     * @param gameIndex {uint32}: the game to analyze
     * @return {bool} player1, {bool} player2
     */
    function getGameWithdrawals(uint32 gameIndex) public view returns (bool player1, bool player2) {
        return (
            gamesData[gameIndex].withdrawn[0],
            gamesData[gameIndex].withdrawn[1]
        );
    }

    // GAME OPERATIONS
    /**
     * Creates a new game
     * @param randomNumberHash {bytes32}: a hash created from a random number using libstring
     * @param playerNickname {string}: a screen display name for the creating player
     * @return {uint32} gameIndex
     */
    function createGame(bytes32 randomNumberHash, string playerNickname) public payable returns (uint32 gameIndex) {
        require(nextGameIndex + 1 > nextGameIndex);

        gamesData[nextGameIndex].openListIndex = uint32(openGames.length);
        gamesData[nextGameIndex].creator = randomNumberHash;
        gamesData[nextGameIndex].amount = msg.value;
        gamesData[nextGameIndex].playerNicknames[0] = playerNickname;
        gamesData[nextGameIndex].players[0] = msg.sender;
        gamesData[nextGameIndex].lastTransaction = now;
        openGames.push(nextGameIndex);

        gameIndex = nextGameIndex;
        emit GameCreated(nextGameIndex);
        
        nextGameIndex++;
    }

    /**
     * Accept a game created by another player
     * @param gameIndex {uint32}: the game to be accepted
     * @param randomNumber {uint8}: a random secret number 
     * @param playerNickname {string}: a screen display name for the accepting player
     */
    function acceptGame(uint32 gameIndex, uint8 randomNumber, string playerNickname) public payable {
        require(gameIndex < nextGameIndex);
        require(gamesData[gameIndex].players[0] != 0x0);
        require(msg.value == gamesData[gameIndex].amount);
        require(gamesData[gameIndex].players[1] == 0x0);
        require(gamesData[gameIndex].status == 0);

        gamesData[gameIndex].guestRandomNumber = randomNumber;
        gamesData[gameIndex].playerNicknames[1] = playerNickname;
        gamesData[gameIndex].players[1] = msg.sender;
        gamesData[gameIndex].lastTransaction = now;

        // Game accepted
        emit GameAccepted(gameIndex, gamesData[gameIndex].players[0]);

        // Remove from the available list (unordered)
        uint32 idxToDelete = uint32(gamesData[gameIndex].openListIndex);
        openGames[idxToDelete] = openGames[openGames.length - 1];
        gamesData[gameIndex].openListIndex = idxToDelete;
        openGames.length--;
    }

    /**
     * Officially starts a game
     * @param gameIndex {uint32}: the game to be started
     * @param revealedRandomNumber {uint8}: random secret number used by game creator to generate random number hash
     * @param revealedSalt {string}: salt used by game creator to generate random number hash
     */
    function confirmGame(uint32 gameIndex, uint8 revealedRandomNumber, string revealedSalt) public {
        require(gameIndex < nextGameIndex);
        require(gamesData[gameIndex].players[0] == msg.sender);
        require(gamesData[gameIndex].players[1] != 0x0);
        require(gamesData[gameIndex].status == 0);

        bytes32 computedHash = saltedHash(revealedRandomNumber, revealedSalt);
        if (computedHash != gamesData[gameIndex].creator) {
            gamesData[gameIndex].status = 12;
            // Game ended caller
            emit GameEnded(gameIndex, msg.sender);
            // Game ended opponent
            emit GameEnded(gameIndex, gamesData[gameIndex].players[1]);
            return;
        }

        gamesData[gameIndex].lastTransaction = now;

        // Define the starting player
        if ((revealedRandomNumber ^ gamesData[gameIndex].guestRandomNumber) & 0x01 == 0) {
            gamesData[gameIndex].status = 1;
            // Game started
            emit GameStarted(gameIndex, gamesData[gameIndex].players[1]);
        }
        else {
            gamesData[gameIndex].status = 2;
            // Game started
            emit GameStarted(gameIndex, gamesData[gameIndex].players[1]);
        }
    }

    /**
     * Proccesses a turn for a player and records the position of their 'X' / 'O'
     * @param gameIndex {uint32}: the game to be updated
     * @param cell {uint8}: the cell to mark with an 'X' / 'O'
     */
    function markPosition(uint32 gameIndex, uint8 cell) public {
        require(gameIndex < nextGameIndex);
        require(cell <= 8);

        uint8[9] storage cells = gamesData[gameIndex].cells;
        require(cells[cell] == 0);

        if (gamesData[gameIndex].status == 1) {
            require(gamesData[gameIndex].players[0] == msg.sender);

            cells[cell] = 1;

            // Position marked
            emit PositionMarked(gameIndex, gamesData[gameIndex].players[1]);
        }
        else if (gamesData[gameIndex].status == 2) {
            require(gamesData[gameIndex].players[1] == msg.sender);
            
            cells[cell] = 2;
            
            // Position marked
            emit PositionMarked(gameIndex, gamesData[gameIndex].players[0]);
        }
        else {
            revert();
        }

        gamesData[gameIndex].lastTransaction = now;


        // Board indexes:
        //    0 1 2
        //    3 4 5
        //    6 7 8

        // Detect a winner:
        // 0x01 & 0x01 & 0x01 != 0 => WIN
        // 0x02 & 0x02 & 0x02 != 0 => WIN
        
        // 0x01 & 0x01 & 0x02 == 0 => Diverse row
        // 0x01 & 0x02 & 0x02 == 0
        // ...

        if ((cells[0] & cells [1] & cells [2] != 0x0) || 
            (cells[3] & cells [4] & cells [5] != 0x0) || 
            (cells[6] & cells [7] & cells [8] != 0x0) || 
            (cells[0] & cells [3] & cells [6] != 0x0) || 
            (cells[1] & cells [4] & cells [7] != 0x0) || 
            (cells[2] & cells [5] & cells [8] != 0x0) || 
            (cells[0] & cells [4] & cells [8] != 0x0) || 
            (cells[2] & cells [4] & cells [6] != 0x0)) {
                // winner
                gamesData[gameIndex].status = 10 + cells[cell];  // 11 or 12
                // Game ended player 1
                emit GameEnded(gameIndex, gamesData[gameIndex].players[0]);
                // Game ended player 2
                emit GameEnded(gameIndex, gamesData[gameIndex].players[1]);
        } else if (cells[0] != 0x0 && cells[1] != 0x0 && cells[2] != 0x0 && cells[3] != 0x0 && cells[4] != 0x0 && cells[5] != 0x0 && cells[6] != 0x0 && cells[7] != 0x0 && cells[8] != 0x0) {
            // draw
            gamesData[gameIndex].status = 10;
            // Game ended player 1
            emit GameEnded(gameIndex, gamesData[gameIndex].players[0]);
            // Game ended player 2
            emit GameEnded(gameIndex, gamesData[gameIndex].players[1]);
        } else {
            if (cells[cell] == 1) {
                gamesData[gameIndex].status = 2;
            }
            else if (cells[cell] == 2) {
                gamesData[gameIndex].status = 1;
            }
            else {
                revert();
            }
        }
    }

    /**
     * Claim winnings / withdraw funds from a game (i.e. an unaccepted game)
     * @param gameIndex {uint32}: the index of the game to witdraw from
     */
    function withdraw(uint32 gameIndex) public {
        require(gameIndex < nextGameIndex);
        require(gamesData[gameIndex].amount > 0);

        uint8 status = gamesData[gameIndex].status;

        if (status == 0) {
            require((now - gamesData[gameIndex].lastTransaction) > timeout);
            
            // Player 1 cancels the non-accepted game
            if (gamesData[gameIndex].players[0] == msg.sender) {
                // checking !withdrawn[0] is redundant, status would not be 0
                require(gamesData[gameIndex].players[1] == 0x0);

                gamesData[gameIndex].withdrawn[0] = true;
                gamesData[gameIndex].status = 10; // consider it ended in draw
                msg.sender.transfer(gamesData[gameIndex].amount);
                
                // The game was open
                // Remove from the available list (unordered)
                uint32 openListIdxToDelete = uint32(gamesData[gameIndex].openListIndex);
                openGames[openListIdxToDelete] = openGames[openGames.length - 1];
                gamesData[gameIndex].openListIndex = openListIdxToDelete;
                openGames.length--;

                // Game ended
                emit GameEnded(gameIndex, msg.sender);
            }
            // Player 2 claims the non-confirmed game
            else if (gamesData[gameIndex].players[1] == msg.sender) {
                // checking !withdrawn[1] is redundant, status would not be 0
                gamesData[gameIndex].withdrawn[1] = true;
                gamesData[gameIndex].status = 12; // consider it won by P2
                msg.sender.transfer(gamesData[gameIndex].amount * 2);
            
                // The game was not open: no need to clean it
                // from the openGames[] list

                // Game ended
                emit GameEnded(gameIndex, msg.sender);
            } else {
                revert();
            }
        } else if (status == 1) {
            // player 2 claims
            require(gamesData[gameIndex].players[1] == msg.sender);
            require(now - gamesData[gameIndex].lastTransaction > timeout);

            gamesData[gameIndex].withdrawn[1] = true;
            gamesData[gameIndex].status = 12;
            msg.sender.transfer(gamesData[gameIndex].amount * 2);

            // Game ended
            emit GameEnded(gameIndex, gamesData[gameIndex].players[0]);
        } else if (status == 2) {
            // player 1 claims
            require(gamesData[gameIndex].players[0] == msg.sender);
            require(now - gamesData[gameIndex].lastTransaction > timeout);

            gamesData[gameIndex].withdrawn[0] = true;
            gamesData[gameIndex].status = 11;
            msg.sender.transfer(gamesData[gameIndex].amount * 2);

            // Game ended
            emit GameEnded(gameIndex, gamesData[gameIndex].players[1]);
        } else if (status == 10) {
            if (gamesData[gameIndex].players[0] == msg.sender) {
                require(!gamesData[gameIndex].withdrawn[0]);

                gamesData[gameIndex].withdrawn[0] = true;
                msg.sender.transfer(gamesData[gameIndex].amount);
            } else if (gamesData[gameIndex].players[1] == msg.sender) {
                require(!gamesData[gameIndex].withdrawn[1]);

                gamesData[gameIndex].withdrawn[1] = true;
                msg.sender.transfer(gamesData[gameIndex].amount);
            } else {
                revert();
            }
        } else if (status == 11) {
            require(gamesData[gameIndex].players[0] == msg.sender);
            require(!gamesData[gameIndex].withdrawn[0]);

            gamesData[gameIndex].withdrawn[0] = true;
            msg.sender.transfer(gamesData[gameIndex].amount * 2);
        } else if (status == 12) {
            require(gamesData[gameIndex].players[1] == msg.sender);
            require(!gamesData[gameIndex].withdrawn[1]);

            gamesData[gameIndex].withdrawn[1] = true;
            msg.sender.transfer(gamesData[gameIndex].amount * 2);
        } else {
            revert();
        }
    }

    // PUBLIC HELPER FUNCTIONS
    /**
     * Generates an output hash from two inputs (a number and a secret phrase)
     * @param randomNumber {uint8}: an integer chosen or generated by a player creating a game
     * @param salt {string}: a secret phrase or salt to add entropy to the output hash
     */
    function saltedHash(uint8 randomNumber, string salt) public pure returns (bytes32) {
        return LibString.saltedHash(randomNumber, salt);
    }

    // DEFAULT
    function () public payable {
        revert();
    }
}
