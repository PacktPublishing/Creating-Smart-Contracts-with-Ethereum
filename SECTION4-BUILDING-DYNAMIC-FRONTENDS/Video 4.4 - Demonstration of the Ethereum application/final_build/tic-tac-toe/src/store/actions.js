// src/store/actions.js

import getTicTacToeInstance from '../contracts/tictactoe';

export function getOpenGames() {
    // Using readonly instance of Web3
    const TicTacToe = getTicTacToeInstance(false);

    return (dispatch) => {
        TicTacToe.methods.getOpenGames().call().then(games => {
            return Promise.all(games.map(gameId => {
                return TicTacToe.methods.getGameInfo(gameId).call()
                    .then(gameData => {
                        gameData.id = gameId
                        return gameData
                    });
            })).then(games => {
                console.log('games =>', games);
                dispatch({ type: "SET", openGames: games });
            });
        });
    };
}