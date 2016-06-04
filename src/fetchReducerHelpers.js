import { Map, fromJS } from "immutable"
import { handleActions, handleAction } from "redux-actions"
import reduceReducers from "reduce-reducers"

function id(value) {return value}

export function fetchReducer({actionType, keyPath, payloadTransformer=id}){
    let calculateKeyPath = (action) => keyPath
    if (typeof keyPath === "function") {
        calculateKeyPath = keyPath
    }
    return handleAction(actionType, {
        next: (state, action) => {
            const actualKeyPath = calculateKeyPath(action)
            if (action.meta.sequence === "COMPLETE") {
                return state.mergeIn(actualKeyPath, fromJS({
                    data: payloadTransformer(action.payload),
                    fetching: false,
                    fetchError: null,
                }))
            }
            if (action.meta.sequence === "BEGIN") {
                return state.mergeIn(actualKeyPath, fromJS({
                    fetching: true,
                    fetchError: null,
                }))
            }
            return state
        },
        throw: (state, action) => {
            const actualKeyPath = calculateKeyPath(action)
            if (action.meta.sequence === "COMPLETE"){
                return state.mergeIn(actualKeyPath, fromJS({
                    fetching: false,
                    fetchError: action.payload,
                }))
            }
            return state
        }
    })
}

export function resourceReducer({collectionActionType, detailActionType, itemsExtractor, itemExtractor}){
    const collectionPayloadTransformer = (payload) => {
        const result = {}
        itemsExtractor(payload).forEach((item) => {
            const {id, data} = itemExtractor(item)
            result[id] = {
                data,
                fetching: false,
                fetchError: null,
            }
        })
        return result
    }
    const collectionReducer = fetchReducer({
        actionType: collectionActionType,
        keyPath: [],
        payloadTransformer: collectionPayloadTransformer,
    })
    const detailTransformer = (item) => {
        const {data} = itemExtractor(item)
        return data
    }
    const detailReducer = fetchReducer({
        actionType: detailActionType,
        keyPath: (action) => ["data", action.meta.itemId],
        payloadTransformer: detailTransformer,
    })
    const initialState = fromJS({
        fetching: false,
        fetchError: null,
        data: {},
    })
    const reducers = reduceReducers(collectionReducer, detailReducer)
    return (state=initialState, action) => reducers(state, action)
}
