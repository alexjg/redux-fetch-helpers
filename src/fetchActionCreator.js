import { createAction } from "redux-actions"

function id(val) {return val}

export default function fetchActionCreator({url, fetchOptions, actionType, metaTransform}) {
    if (!metaTransform) {
        metaTransform = id
    }
    return dispatch => {
        dispatch({
            type: actionType,
            meta: metaTransform({sequence: "BEGIN"}),
        })
        const promise = fetch(url, fetchOptions)
        promise.then(
            result => {
                if (result.status === 200) {
                    result.json().then(data => dispatch({
                        type: actionType,
                        meta: metaTransform({sequence: "COMPLETE"}),
                        payload: data,
                    }))
                } else if (result.status === 401) {
                    dispatch({
                        type: actionType,
                        meta: {sequence: "COMPLETE"},
                        payload: new NotAuthorizedException(),
                        error: true,
                    })
                }
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
