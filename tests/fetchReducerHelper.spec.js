import { fetchReducer } from "../src/fetchReducerHelpers"
import { Map, fromJS } from "immutable"

describe("The fetchReducerHelper", () => {
    const actionType = "SOME_ACTION"
    let reducer
    let initialState

    beforeEach(() => {
        reducer = fetchReducer({
            actionType,
            keyPath: ["one", "two"],
        })
        initialState = fromJS({
            one: {
                two: {
                    data: {
                        some: "data",
                    },
                    fetching: true,
                    fetchError: null,
                }
            }
        })
    })

    it("merges the result of a successful fetch into the data at it's key path", () => {
        const action = {
            meta: {sequence: "COMPLETE"},
            type: actionType,
            payload: {some: "data", other: "data"}
        }
        expect(reducer(initialState, action)).to.equal(fromJS({
            one: {
                two: {
                    data: {
                        some: "data",
                        other: "data",
                    },
                    fetching: false,
                    fetchError: null,
                }
            }
        }))
    })

    it("sets the fetching key on it's keypath when the action BEGINs", () => {
        const action = {
            meta: {sequence: "BEGIN"},
            type: actionType,
        }
        initialState = initialState.mergeIn(["one", "two"], {
            data: {
                some: "data",
            },
            fetching: true,
            fetchError: null,
        })
        expect(reducer(initialState, action)).to.equal(fromJS({
            one: {
                two: {
                    data: {
                        some: "data",
                    },
                    fetching: true,
                    fetchError: null,
                }
            }
        }))
    })

    it("sets the error on  the state if the action is an error", () => {
        const err = new Error("Argh!")
        const action = {
            meta: {sequence: "COMPLETE"},
            type: actionType,
            error: true,
            payload: err,
        }
        initialState = initialState.mergeIn(["one", "two"], {
            data: {
                some: "data",
            },
            fetching: false,
            fetchError: err,
        })
        expect(reducer(initialState, action)).to.equal(fromJS({
            one: {
                two: {
                    data: {
                        some: "data",
                    },
                    fetching: false,
                    fetchError: err,
                }
            }
        }))
    })

    it("transforms the payload using the payloadTransformer", () => {
        reducer = fetchReducer({
            actionType,
            keyPath: ["one", "two"],
            payloadTransformer: (payload) => payload.items,
        })
        const action = {
            type: actionType,
            meta: {sequence: "COMPLETE"},
            payload: {items: [{one: "one"}, {two: "two"}]},
        }
        expect(reducer(initialState, action).getIn(["one", "two", "data"])).to.equal(fromJS(
            [{one: "one"}, {two: "two"}]
        ))
    })

    describe("when the keypath is a function", () => {
        it("should choose the keypath by passing the action to the keypath function", () => {
            const reducer = fetchReducer({
                actionType,
                keyPath: (action) => action.dummyKeyPath,
            })
            const action = {
                meta: {sequence: "COMPLETE"},
                type: actionType,
                payload: {some: "data", other: "data"},
                dummyKeyPath: ["one", "two"],
            }
            const initialState = fromJS({
                one: {
                    two: {
                        data: {
                            some: "data",
                        },
                        fetching: true,
                        fetchError: null,
                    }
                }
            })
            expect(reducer(initialState, action)).to.equal(fromJS({
                one: {
                    two: {
                        data: {
                            some: "data",
                            other: "data",
                        },
                        fetching: false,
                        fetchError: null,
                    }
                }
            }))
        })

        it("should use the keypath function even if the action is an error", () => {
            const reducer = fetchReducer({
                actionType,
                keyPath: (action) => action.dummyKeyPath,
            })
            const err = new Error("arg!")
            const action = {
                meta: {sequence: "COMPLETE"},
                type: actionType,
                payload: err,
                dummyKeyPath: ["one", "two"],
                error: true,
            }
            const initialState = fromJS({
                one: {
                    two: {
                        data: {
                            some: "data",
                        },
                        fetching: true,
                        fetchError: null,
                    }
                }
            })
            expect(reducer(initialState, action)).to.equal(fromJS({
                one: {
                    two: {
                        data: {
                            some: "data",
                        },
                        fetching: false,
                        fetchError: err,
                    }
                }
            }))
        })
    })
})
