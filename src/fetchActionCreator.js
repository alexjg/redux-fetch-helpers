import { createAction } from "redux-actions"
import jsonResponseHandler from "./jsonResponseHandler"

function id(val) {return val}


export default function fetchActionCreator({
    url,
    fetchOptions,
    actionType,
    metaTransform,
    responseConfig,
    createResponsePayload,
}) {
    if (!metaTransform) {
        metaTransform = id
    }
    if (!createResponsePayload) {
        createResponsePayload = jsonResponseHandler(responseConfig)
    }
    return dispatch => {
        dispatch({
            type: actionType,
            meta: metaTransform({sequence: "BEGIN"}),
        })
        const promise = fetch(url, fetchOptions)
        promise.then(
            result => {
                createResponsePayload(result).then(payload => {
                    const action = {
                        type: actionType,
                        meta: metaTransform({sequence: "COMPLETE"}),
                        payload: payload,
                    }
                    if (payload instanceof Error) {
                        action.error = true
                    }
                    dispatch(action)
                })
            }
        ).catch(err => {
            dispatch({
                type: actionType,
                meta: metaTransform({sequence: "COMPLETE"}),
                payload: err,
                error: true,
            })
        })
    }
}

export function fetchDetailActionCreator(url, fetchOptions, actionType, itemId) {
    return fetchActionCreator(url, fetchOptions, actionType, (meta) => {
        meta.itemId = itemId
        return meta
    })
}
