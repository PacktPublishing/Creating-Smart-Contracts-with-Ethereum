// src/app.js

import React, { Component } from 'react';
import { Route, Switch, Redirect, withRouter } from 'react-router-dom';
import { connect } from 'react-redux';

// Contracts
import { isWeb3Injected, getInjectedWeb3 } from './contracts/web3';
import getTicTacToeInstance from './contracts/tictactoe';
import { getOpenGames } from './store/actions';

// Views
import MainView from './views/main';
import GameView from './views/game';
import LoadingView from './views/loading';
import MessageView from './views/message';
import Container from './views/partials/container';

class App extends Component {
    /**
     * Loads Web3, checks network and account settings, then loads an 
     * instance of the TicTacToe contract
     */
    componentDidMount() {
        if (isWeb3Injected()) {
            let web3 = getInjectedWeb3();
            this.TicTacToe = getTicTacToeInstance();

            web3.eth.getBlockNumber().then(blockNumber => {
                this.props.dispatch({ type: "SET_STARTING_BLOCK", blockNumber });
                return this.checkWeb3Status();
            }).then(() => {
                // Make sure we don't lose our Web3 access
                this.checkWeb3Status();
                this.props.dispatch(getOpenGames());
                // Start listening for contract events
                this.addListeners();
            })
        }
        else {
            this.props.dispatch({ type: "SET_UNSUPPORTED" })
        }
    }

    /**
     * Check for Web3 connection, correct network and wallet account
     */
    checkWeb3Status() {
        let web3 = getInjectedWeb3();
        return web3.eth.net.isListening().then(listening => {
            if (!listening) {
                return this.props.dispatch({ type: "SET_DISCONNECTED" });
            }

            return web3.eth.net.getNetworkType().then(id => {
                this.props.dispatch({ type: "SET_NETWORK_ID", networkId: id });

                return web3.eth.getAccounts().then(accounts => {
                    if (accounts.length != this.props.accounts.length || accounts[0] != this.props.accounts[0]) {
                        this.props.dispatch({ type: "SET", accounts });
                    }
                    this.props.dispatch({ type: "SET_CONNECTED" });
                });
            });
        });
    }

    // On game created
    onGameCreated(event) {
        console.log('Game Created =>', event.returnValues);
        this.props.dispatch(getOpenGames());
    }

    // On game accepted
    onGameAccepted(event) {
        console.log('Game Accepted =>', event.returnValues);
        this.props.dispatch(getOpenGames());
    }

    // Listen for contract events
    addListeners() {
        this.creationEvent = this.TicTacToe.events.GameCreated({
            fromBlock: this.props.status.startingBlock || 0
        })
        .on('data', event => this.onGameCreated(event))
        .on('error', function (err) {
            console.log(err);
        });

        this.acceptedEvent = this.TicTacToe.events.GameAccepted({
            filter: { opponent: this.props.accounts && this.props.accounts[0] },
            fromBlock: this.props.status.startingBlock || 0
        })
        .on('data', event => this.onGameAccepted(event))
        .on('error', function (err) {
            console.log(err);
        });
    }

    render() {
        if (this.props.status.loading) {
            return <LoadingView />
        } else if (this.props.status.unsupported) {
            return <MessageView message="Please, install Metamask" />
        } else if (this.props.status.networkId != "rinkeby"){
            return <MessageView message="Please, switch Metamask to the Rinkeby network" />
        }
        else if (!this.props.status.connected) { 
            return <MessageView message="Your connection seems to be down" />
        }
        else if (!this.props.accounts || !this.props.accounts.length) {
            return <MessageView message="Please, unlock your wallet or create an account" />
        }

        return <Container>
            <Switch>
                <Route path="/" exact component={MainView} />
                <Route path="/games/:id" exact component={GameView} />
                <Redirect to="/" />
            </Switch>
        </Container>
    }
}

export default withRouter(connect(({ accounts, status, openGames }) => ({ accounts, status, openGames }))(App))