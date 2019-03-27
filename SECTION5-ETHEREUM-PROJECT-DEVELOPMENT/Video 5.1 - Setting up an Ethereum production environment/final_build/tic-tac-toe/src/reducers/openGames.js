// src/reducers/openGames.js

const initialState = []

export default function reducer(state = initialState, action = {}) {
    switch (action.type) {
        case "SET":
            if (action.openGames) {
                return action.openGames
            } else {
                return state
            }

        default:
            return state
    }
}