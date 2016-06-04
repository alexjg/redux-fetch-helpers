import { Map, fromJS } from "immutable"
import { handleActions } from "redux-actions"

export function fetchReducer({collectionActionType, detailActionType, itemsExtractor, itemExtractor}){
    return handleActions({
        [collectionActionType]: {
            next: (state, action) => {
                if (action.meta.sequence === "BEGIN") {
                    return state.merge({
                        fetchError: null,
                        fetching: true,
                    })
                }
                if (action.meta.sequence === "COMPLETE") {
                    const data = {}
                    itemsExtractor(action.payload).forEach((item) => {
                        const {id, data: itemData} = itemExtractor(item)
                        data[id] = {
                            data: itemData,
                            fetching: false,
                            fetchError: null,
                        }
                    })
                    return state.merge({
                        fetching: false,
                        fetchError: null,
                        data: fromJS(data),
                    })
                }
                return state
            },
            throw: (state, action) => {
                if (action.meta.sequence === "COMPLETE") {
                    return state.merge({
                        fetching: false,
                        fetchError: action.payload,
                    })
                }
            },
        },
        [detailActionType]: {
            next: (state, action) => {
                if (action.meta.sequence === "BEGIN") {
                    const {itemId} = action.meta
                    return state.mergeIn(["data", itemId], fromJS({
                        fetching: true,
                        fetchError: null,
                    }))
                }
                if (action.meta.sequence === "COMPLETE") {
                    const {id, data} = itemExtractor(action.payload)
                    return state.mergeIn(["data", id], fromJS({
                        data,
                        fetching: false,
                    }))
                }
                return state
            },
            throw: (state, action) => {
                if (action.meta.sequence === "COMPLETE") {
                    const id = action.meta.itemId
                    return state.mergeIn(["data", id], fromJS({
                        fetching: false,
                        fetchError: action.payload,
                    }))
                }
            }
        },
    }, Map({
        fetching: false,
        fetchError: null,
        data: Map({}),
    }))
}
