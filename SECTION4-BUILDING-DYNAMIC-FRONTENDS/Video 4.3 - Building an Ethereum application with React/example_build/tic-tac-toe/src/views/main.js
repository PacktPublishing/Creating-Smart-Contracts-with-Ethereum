// src/views/main.js

import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Row, Col, Divider, Button, Input, InputNumber, Spin, Icon, message, notification } from 'antd';

import { getOpenGames } from '../store/actions';
import ConfirmAcceptModal from '../views/partials/confirmAcceptModal';

// Contracts
import { getWebSocketWeb3, getInjectedWeb3, isWeb3Injected } from '../contracts/web3';
import getTicTacToeInstance from '../contracts/tictactoe';

const TicTacToe = getTicTacToeInstance(true);

class MainView extends Component {

    constructor(props) {
        super(props);
        this.acceptForm = null;

        this.state = {
            showCreateGame: false,
            creationLoading: false,
            acceptLoading: false,
            showAcceptModal: false,
            gameIndexToAccept: -1
        };
    }

    componentDidMount() {
        this.TicTacToe = getTicTacToeInstance(true);
    }

    handleValue(ev) {
        if (!ev.target || !ev.target.name) {
            return;
        }
        
        this.setState({ [ev.target.name]: ev.target.value });
    }

    /**
     * Player 1: create a game
     */
    createGame() {
        // Verify game paremeters
        if (!this.state.playerNickname) {
            return message.error("Please, choose a screen name");
        } else if (this.state.playerNickname.length < 3) {
            return message.error("Please, choose a longer screen name (min. 3 characters)");
        }
        else if (typeof this.state.number == "undefined") {
            return message.error("Please, choose a random number to generate a game hash"); 
        } else if (!this.state.salt) {
            return message.error("Please, type a secret phrase to secure your game hash");
        }
        // Modulus "random" number
        const number = this.state.number % 256;

        // Generate game hash
        return this.TicTacToe.methods.saltedHash(number, this.state.salt).call()
            .then(hash => {
                let web3 = getWebSocketWeb3();
                let value = 0;
                // If we're sending a bet on our game
                if (this.state.value) {
                    value = web3.utils.toWei(String(this.state.value), "ether");
                }
                // Set loading
                this.setState({ creationLoading: true })
                // Call create game
                console.log("create game params =>", [hash, this.state.playerNickname, value, this.props.accounts[0]]);
                return TicTacToe.methods.createGame(hash, this.state.playerNickname).send({
                    value,
                    from: this.props.accounts[0]
                });
            }).then(tx => {
                // Game creation was called
                this.setState({ creationLoading: false })
                // If transaction failed
                if (!tx.events.GameCreated || !tx.events.GameCreated.returnValues) {
                    throw new Error("The transaction failed")
                }
                
                // Otherwise, business as usual
                // game creation successful
                this.props.dispatch({
                    type: "ADD_CREATED_GAME",
                    id: tx.events.GameCreated.returnValues.gameIndex,
                    number,
                    salt: this.state.salt
                })

                console.log('add created game =>',this.props);

                this.props.history.push(`/games/${tx.events.GameCreated.returnValues.gameIndex}`);

                notification.success({
                    message: 'Game created',
                    description: 'Your game has been created. Waiting for another user to accept it.',
                });
            }).catch(err => {
                // Handler errors
                this.setState({ creationLoading: false })

                let msg = err.message.replace(/\.$/, "").replace(/Returned error: Error: MetaMask Tx Signature: /, "")
                notification.error({
                    message: 'Game creation failed',
                    description: msg
                });
            });
    }

    /**
     * Accept a challenge
     */
    acceptGame() {
        const game = this.props.openGames[this.state.gameIndexToAccept]

        this.acceptForm.validateFields((err, values) => {
            if (err) {
                console.log('error =>', err);
                return;
            }
            if (!values.playerNickname) {
                return message.error("Please, choose a screen name");
            } else if (values.playerNickname.length < 3) {
                return message.error("Please, choose a longer screen name (min. 3 characters)");
            } else if (typeof values.number == "undefined") {
                return message.error("Please, choose a random to generate a game hash");
            } 

            // Modulus "random" number
            values.number = values.number % 256;

            //const TicTacToe = getTicTacToeInstance(true);

            // Game acceptance loading
            this.setState({ acceptLoading: true, showAcceptModal: false });

            // TRANSACTION
            return this.TicTacToe.methods.acceptGame(game.id, values.number, values.playerNickname).send({ value: game.amount || 0, from: this.props.accounts[0] })
                .then(tx => {
                    // Game accept tx mined
                    this.setState({ acceptLoading: false });
                    // If transaction failed
                    if (!tx.events.GameAccepted || !tx.events.GameAccepted.returnValues) {
                        throw new Error("The transaction failed");
                    }
                    // Game successfully accepted
                    this.props.history.push(`/games/${game.id}`);

                    /*notification.success({
                        message: 'Game accepted',
                        description: 'You have accepted the game. Waiting for creator to confirm.',
                    });*/
                    // Load open games
                    this.props.dispatch(getOpenGames());
                })
                .catch(err => {
                    console.log('err =>', err);
                    // Handle errors
                    this.setState({ acceptLoading: false });

                    let msg = err.message.replace(/\.$/, "").replace(/Returned error: Error: MetaMask Tx Signature: /, "");
                    notification.error({
                        message: 'Failed to accept the game',
                        description: msg
                    });
                });

        });
    }

    // Save form ref (acceptGame)
    saveAcceptFormRef(ref) {
        this.acceptForm = ref;
    }

    // Shows accept game modal
    showAcceptGameModal(index) {
        if (!this.acceptForm) {
            return;
        }
        // Show modal
        this.setState({ showAcceptModal: true, gameIndexToAccept: index });
    }

    // Hides accept game modal
    hideAcceptGameModal() {
        // Hide modal
        this.setState({ showAcceptModal: false })
    }

    renderListContent(openGames) {
        if (!openGames || !openGames.length) {
            return <p className="light">There are no open games at the moment.</p>
        } else {
            return openGames.map((game, index) => this.renderOpenGameRow(game, index));
        }
    }

    /**
     * Render list of games
     */
    renderGameList() {
        return <div className="game-list">
                    <h1 className="light">Tic Tac Toe DApp</h1>
                    <p className="light">Select a game to join or create a new game.</p>

                    <Divider />

                    {
                        this.state.acceptLoading ? <div>Please, wait  <Spin indicator={<Icon type="loading" style={{ fontSize: 14 }} spin />} /> </div> :
                        <div id="list">
                            {this.renderListContent(this.props.openGames)}
                        </div>
                    }
                </div>
    }

    /**
     * Render the table display row for a given open game
     * @param {Object} game: our game struct instance
     * @param {Number} index: the index of our game struct in the array of games
     */
    renderOpenGameRow(game, index) {
        let web3 = getWebSocketWeb3();
        return <Row key={index} className="open-game-row">
            <div className="open-game-row-text">
                <h1>Game: {game.id}</h1>
                <p>Creator: {game.nicknamePlayer1}</p>
                <p>Value of challenge: {game.amount && game.amount != "0" ? <span>(Game Bet: {web3.utils.fromWei(game.amount)} ETH)</span> : <span> 0 (no bet included in challenge)</span>}</p>
                <div className="open-game-row-accept">
                    <Button type="primary" onClick={() => this.showAcceptGameModal(index)}>Accept Game</Button>
                </div>
            </div>
        </Row>
    }

    /**
     * Render display of a new game
     */
    renderNewGame() {
        return <div className="new-game-display">
                    <h1 className="light">Start A New Game</h1>
                    <p className="light">Enter your player screen name, and type a random number and secret phrase to secure your game.</p>

                    <Divider />

                    <Row gutter={16}>
                        <Col>
                            <Input className="margin-bottom" placeholder="Screen name" name="playerNickname" onChange={ev => this.handleValue(ev)} />
                        </Col>
                        <Col span={12}>
                            <InputNumber className="width-100" min={0} placeholder="Random number" name="number" onChange={value => this.setState({ number: value })} />
                        </Col>
                        <Col span={12}>
                            <Input placeholder="Type some text" name="salt" onChange={ev => this.handleValue(ev)} />
                        </Col>
                        <Col>
                            <p className="light"><small>This will be used to randomly decide who starts the game</small></p>
                        </Col>
                        <Col>
                            <br />
                            <p className="light">Bet ether on the match outcome? (optional)</p>
                        </Col>
                        <Col>
                            <InputNumber className="margin-bottom width-100" placeholder="My challenge bet" name="value" onChange={value => this.setState({ value })} />
                        </Col>
                        <Col>
                            {
                                this.state.creationLoading ? <div className="text-center">Please, wait  <Spin indicator={<Icon type="loading" style={{ fontSize: 14 }} spin />} /> </div> : <Button type="primary" id="start" className="width-100" onClick={() => this.createGame()}>Start new game</Button>
                            }
                            <Button type="primary" onClick={() => this.setState({ showCreateGame: !this.state.showCreateGame })}>Cancel</Button>
                        </Col>
                    </Row>
                </div>
    }

    /**
     * Render web view
     */
    render() {
        //console.log('props =>', this.props);
        return <div id="main">
            <Row gutter={48}>
                <Col md={12}>
                    {this.renderGameList()}
                </Col>
                <Col md={12}>
                    {this.renderNewGame()}
                </Col>
            </Row>

            
            <ConfirmAcceptModal
                visible={this.state.showAcceptModal}
                ref={ref => this.saveAcceptFormRef(ref)}
                onCancel={() => this.hideAcceptGameModal()}
                onAccept={() => this.acceptGame()}
            />
        </div>
    }
}

export default connect(({ accounts, openGames }) => ({ accounts, openGames }))(MainView)