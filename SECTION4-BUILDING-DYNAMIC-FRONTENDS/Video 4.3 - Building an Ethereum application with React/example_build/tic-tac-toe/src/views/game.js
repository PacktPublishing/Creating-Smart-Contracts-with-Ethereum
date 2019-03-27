// src/views/game.js

import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Row, Col, Divider, Button, Spin, Icon, message, notification } from 'antd';

// Contracts
import { getWebSocketWeb3 } from '../contracts/web3';
import getTicTacToeInstance from '../contracts/tictactoe';

// Child Views
import LoadingView from '../views/loading';
import MessageView from '../views/message';

const CONTRACT_TIMEOUT = 1000 * 60 * 10; // 10 minutes by default

class GameView extends Component {
    constructor(props) {
        super(props)

        this.state = {
            loadingGameInfo: true,
            confirmLoading: false,
            markLoading: false,
            game: null
        }
    }

    componentDidMount() {
        this.TicTacToe = getTicTacToeInstance(true);
        // Loading game
        this.setState({ loadingGameInfo: true });

        // Get game status
        this.getGameStatus().then(game => {
            this.setState({ game, loadingGameInfo: false });
            // Check if we need to confirm the game
            return this.checkConfirmGame(game)
        }).then(() => {
            return this.checkLastPositionLeft(this.state.game);
        }).catch(err => {
            this.setState({ loadingGameInfo: false });
        });

        // Game accepted event
        this.acceptedEvent = this.TicTacToe.events.GameAccepted({
            filter: { opponent: this.props.accounts && this.props.accounts[0] },
            fromBlock: this.props.status.startingBlock || 0
        })
        .on('data', event => this.onGameAccepted(event))
        .on('error', err => message.error(err && err.message || err));
        // Game started event
        this.startedEvent = this.TicTacToe.events.GameStarted({
            filter: { opponent: this.props.accounts && this.props.accounts[0] },
            fromBlock: this.props.status.startingBlock || 0
        })
        .on('data', event => this.onGameStarted(event))
        .on('error', err => message.error(err && err.message || err));
        // Turn played event
        this.positionMarkedEvent = this.TicTacToe.events.PositionMarked({
            filter: { opponent: this.props.accounts && this.props.accounts[0] },
            fromBlock: this.props.status.startingBlock || 0
        })
        .on('data', event => this.onPositionMarked(event))
        .on('error', err => message.error(err && err.message || err));

        this.endedEvent = this.TicTacToe.events.GameEnded({
            filter: { opponent: this.props.accounts && this.props.accounts[0] },
            fromBlock: this.props.status.startingBlock || 0
        })
        .on('data', event => this.onGameEnded(event))
        .on('error', err => message.error(err && err.message || err));
    }

    /**
     * Handle unsubscriptions - protect memory leaks when changing views
     */
    componentWillUnmount() {
        if (this.acceptedEvent)
            this.acceptedEvent.unsubscribe();
        if (this.startedEvent)
            this.startedEvent.unsubscribe();
        if (this.positionMarkedEvent)
            this.positionMarkedEvent.unsubscribe();
        if (this.endedEvent)
            this.endedEvent.unsubscribe();
    }

    /**
     * A new challenger approaches - sends UI notification on game accepted
     */
    onGameAccepted() {
        return this.getGameStatus().then(game => {
            this.setState({ game, loadingGameInfo: false });

            console.log('gameAccepted =>', game);

            notification.success({
                message: 'Game accepted',
                description: `${game.player2} has accepted the game!`
            })
            return this.checkConfirmGame(game);
        });
    }

    /**
     * Get ready to play - sends UI notification on game started
     */
    onGameStarted() {
        return this.getGameStatus().then(game => {
            this.setState({ game, loadingGameInfo: false });

            notification.success({
                message: 'Game confirmed',
                description: `${game.player1} has confirmed the game!`
            })
        })
    }

    /**
     * Game over - updates view based on game status game ended
     */
    onGameEnded() {
        return this.getGameStatus().then(game => {
            this.setState({ game, loadingGameInfo: false })

            let type = 'info', message = "Game ended", description = ""

            if (game.player1 == this.props.accounts[0]) {
                if (game.status == "10") {
                    description = "The game has ended in draw"
                    if (game.amount != "0") description += ". You can withdraw your initial bet."
                }
                else if (game.status == "11") {
                    type = "success"
                    description = "You have won the game!"
                    if (game.amount != "0") description += " You can withdraw the full amount."
                }
                else if (game.status == "12") {
                    type = "warning"
                    description = `${game.player2} has won the game`
                }
                else return
            }
            else if (game.player2 == this.props.accounts[0]) {
                if (game.status == "10") {
                    description = "The game has ended in draw"
                    if (game.amount != "0") description += ". You can withdraw your initial bet."
                }
                else if (game.status == "11") {
                    type = "warning"
                    description = `${game.player1} has won the game`
                }
                else if (game.status == "12") {
                    type = "success"
                    description = "You have won the game!"
                    if (game.amount != "0") description += " You can withdraw the full amount."
                }
                else if (game.status == "11") {
                    type = "warning"
                    description = `${game.player1} has won the game`
                }
                else return
            }
            else {
                if (game.status == "10") {
                    description = "The game has ended in draw"
                }
                else if (game.status == "11") {
                    description = `${game.player1} has won the game`
                }
                else if (game.status == "12") {
                    description = `${game.player2} has won the game`
                }
                else return
            }

            notification[type]({
                message,
                description
            });
        })
    }

    // Get current game status from blockchain / EVM
    // Do we need to accept / confirm the game, play a turn, or withdraw a reward?
    getGameStatus() {

        const result = {}

        return this.TicTacToe.methods.getGameInfo(this.props.match.params.id).call().then(gameInfo => {
            result.amount = gameInfo.amount
            result.cells = gameInfo.cells
            result.player1 = gameInfo.player1
            result.player2 = gameInfo.player2
            result.status = gameInfo.status

            return this.TicTacToe.methods.getGamePlayers(this.props.match.params.id).call();
        }).then(players => {
            result.player1 = players.player1
            result.player2 = players.player2

            return this.TicTacToe.methods.getGameTimestamp(this.props.match.params.id).call();
        }).then(timestamp => {
            result.lastTransaction = timestamp * 1000

            return this.TicTacToe.methods.getGameWithdrawals(this.props.match.params.id).call();
        }).then(withdrawals => {
            result.withdrawn1 = withdrawals.player1
            result.withdrawn2 = withdrawals.player2

            return result;
        });
    }

    // Transactions
    checkConfirmGame(game) {
        let data = null;
        if (this.state.confirmLoading || game.status != "0" || game.player2.match(/^0x0+$/) || game.player1 != this.props.accounts[0]) {
            return;
        }

        if (this.props.status.createdGames) {
            console.log('[this.props.status.createdGames, this.props.match.params.id]', [this.props.status.createdGames, this.props.match.params.id]);
            data = this.props.status.createdGames[this.props.match.params.id];
            if (!data) {
                return notification.error({
                    message: 'Failed to confirm the game',
                    description: 'The random number and the salt can\'t be found'
                });
            }
        } else {
            console.log('props',this.props);
            return;
        }

        this.setState({ confirmLoading: true });

        return this.TicTacToe.methods.confirmGame(this.props.match.params.id, data.number, data.salt)
            .send({ from: this.props.accounts[0] })
            .then(tx => {

                console.log('tx', tx);

                this.setState({ confirmLoading: false });

                if (!tx.events.GameStarted || !tx.events.GameStarted.returnValues) {
                    throw new Error("The transaction failed");
                }

                notification.success({
                    message: 'Game confirmed',
                    description: 'The game is on. Good luck!',
                });
                this.props.dispatch({ type: "REMOVE_CREATED_GAME", id: game.id });

                return this.getGameStatus().then(game => {
                    this.setState({ game });
                });
            })
            .catch(err => {
                this.setState({ confirmLoading: false });

                let msg = err.message.replace(/\.$/, "").replace(/Returned error: Error: MetaMask Tx Signature: /, "");
                notification.error({
                    message: 'Unable to confirm the game',
                    description: msg
                });
            });
    }

    goBack() {
        // TODO: Probably a better way to do this
        document.location.hash = "#/";
    }

    // Get current game status from props / state
    // Do we need to accept / confirm the game, play a turn, or withdraw a reward?
    getStatus() {
        if (!this.state.game || !this.props.accounts) {
            return "";
        } else if (this.state.game.status == 0) {
            if (this.state.game.player2.match(/^0x0+$/)) {
                return "Waiting for an opponent to accept the game";
            } else {
                if (this.state.game.player1 == this.props.accounts[0]) {
                    return "You need to confirm the game...";
                } else {
                    return `Waiting for ${this.state.game.player1} to confirm the game`;
                }
            }
        } else if (this.state.game.status == 1) {
            if (this.state.game.player1 == this.props.accounts[0]) {
                return "It's your turn";
            } else {
                return `Waiting for ${this.state.game.nicknamePlayer1}`;
            }
        } else if (this.state.game.status == 2) {
            if (this.state.game.player2 == this.props.accounts[0]) {
                return "It's your turn";
            } else {
                return `Waiting for ${this.state.game.nicknamePlayer2}`;
            }
        } else if (this.state.game.status == 10) {
            return "The game ended in draw";
        } else if (this.state.game.status == 11) {
            if (this.state.game.player1 == this.props.accounts[0]) {
                return "Congratulations! You are the winner";
            } else {
                return `${this.state.game.nicknamePlayer1} is the winner of this game`;
            }
        } else if (this.state.game.status == 12) {
            if (this.state.game.player2 == this.props.accounts[0]) {
                return "Congratulations! You are the winner";
            } else {
                return `${this.state.game.nicknamePlayer2} is the winner of this game`;
            }
        }
    }

    // Determine if game has expired
    getTimeStatus() {
        let action = "", 
            subject = "", 
            message = "";

        let remaining = (this.state.game.lastTransaction + CONTRACT_TIMEOUT) - Date.now();

        if (!this.state.game || !this.props.accounts) { 
            return "-"; 
        } else if (this.state.game.status == "0") {
            if (this.state.game.player2.match(/^0x0+$/)) {
                subject = (this.state.game.player1 == this.props.accounts[0]) ? "you" : this.state.game.nicknamePlayer1;
                action = "cancel the game";
            } else {
                subject = (this.state.game.player2 == this.props.accounts[0]) ? "you" : this.state.game.nicknamePlayer2;
                action = "claim deposited ETH from the game contract";
            }
        }
        else if (this.state.game.status == "1") {
            action = "claim deposited ETH from the game contract";

            if (this.state.game.player2 == this.props.accounts[0]) {
                subject = "you";
            } else {
                subject = this.state.game.nicknamePlayer2;
            }
        }
        else if (this.state.game.status == 2) {
            action = "claim deposited ETH from the game contract";

            if (this.state.game.player1 == this.props.accounts[0]) {
                subject = "you";
            } else {
                subject = this.state.game.nicknamePlayer1;
            }
        } else {
            return ""
        }

        remaining /= 1000; // in seconds

        if (remaining >= 120) {
            return `Remaining time: ${Math.round(remaining / 60)} minutes before ${subject} can ${action}`;
        } else if (remaining >= 60) {
            return `Remaining time: About one minute before ${subject} can ${action}`;
        } else if (remaining >= 0) {
            return `Remaining time: ${Math.round(remaining)} seconds before ${subject} can ${action}`
        } else {
            return `Out of time: ${subject} could ${action}`
        }
    }

    // So then, do you need this money or not? 
    canWithdraw() {
        const remaining = (this.state.game.lastTransaction + CONTRACT_TIMEOUT) - Date.now()

        if (!this.state.game || !this.props.accounts) {
            return false;
        } else if (this.state.game.player1 != this.props.accounts[0] && this.state.game.player2 != this.props.accounts[0]) { 
            return false;
        } else if (this.state.game.status == 0) {
            if (remaining > 0) {
                return false;
            } else if (this.state.game.player2.match(/^0x0+$/)) { // not accepted yet
                return this.state.game.player1 == this.props.accounts[0];
            } else { // not confirmed yet
                return this.state.game.player2 == this.props.accounts[0];
            }
        }
        else if (this.state.game.status == 1) {
            if (remaining > 0) {
                return false;
            } else {
                return this.state.game.player2 == this.props.accounts[0];
            }
        } else if (this.state.game.status == 2) {
            if (remaining > 0) {
                return false;
            } else {
                return this.state.game.player1 == this.props.accounts[0];
            }
        } else if (this.state.game.status == 10) {
            if (this.state.game.player1 == this.props.accounts[0] && !this.state.game.withdrawn1) {
                return true;
            } else if (this.state.game.player2 == this.props.accounts[0] && !this.state.game.withdrawn2) {
                return true;
            }
            return false;
        } else if (this.state.game.status == 11) {
            if (this.state.game.withdrawn1) {
                return false;
            }
            return this.state.game.player1 == this.props.accounts[0];
        }
        else if (this.state.game.status == 12) {
            if (this.state.game.withdrawn2) {
                return false;
            } 
            return this.state.game.player2 == this.props.accounts[0];
        }
        return false;
    }

    // RENDER
    render() {
        let web3 = getWebSocketWeb3();
        if (this.state.loadingGameInfo) {
            return <LoadingView />
        }
        else if (!this.state.game || !this.state.game.player1 || this.state.game.player1.match(/^0x0+$/)) {
            return <MessageView message="404 game not found, tx is probably confirming. Try refreshing." />
        }

        return <div id="game">
            <Row gutter={48}>
                <Col md={12}>
                    <div>
                        <h1 className="light">Current game</h1>

                        <Divider />

                        {/* GAME BOARD HTML WILL GO HERE */}

                    </div>
                </Col>
                <Col md={12}>
                    <div className="card">
                        <h1 className="light">Game status</h1>

                        <Divider />

                        {
                            (this.state.loadingGameInfo || this.state.confirmLoading || this.state.markLoading || this.state.withdrawLoading) ?
                                <div className="loading-spinner">Waiting  <Spin indicator={<Icon type="loading" style={{ fontSize: 14 }} spin />} /> </div> :
                                <div>
                                    <p id="status" className="light">{this.getStatus()}</p>
                                    <p id="timer" className="light">{this.getTimeStatus()}</p>
                                    {
                                        this.state.game ? <p id="bet" className="light">Game bet: {web3.utils.fromWei(this.state.game.amount)}</p> : null
                                    }
                                    <Button id="back" type="primary" className="width-100" onClick={() => this.goBack()}>Go back</Button>
                                </div>
                        }

                    </div>
                </Col>
            </Row>
        </div>
    }
}

export default connect(({ accounts, status }) => ({ accounts, status }))(GameView)