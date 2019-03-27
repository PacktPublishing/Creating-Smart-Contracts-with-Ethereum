// src/reducers/index.js

import { combineReducers } from 'redux';

import accounts from "./accounts"
import status from "./status"
import openGames from "./openGames"

export default combineReducers({
	accounts,
	status,
	openGames
});