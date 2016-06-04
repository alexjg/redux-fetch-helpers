import { Map, fromJS } from "immutable"
import { resourceReducer } from "../src/fetchReducerHelpers"

describe("The resource reducer helper", () => {
    const detailActionType = "SOME_DETAIL"
    const collectionActionType = "SOME_COLLECTION"
    const itemExtractor = (item) => ({id: item.id, data: item})
    const itemsExtractor = (payload) => {
        return payload.items
    }
    const reducer = resourceReducer({
        detailActionType,
        collectionActionType,
        itemsExtractor,
        itemExtractor,
    })

    describe("when fetching the collection", () => {

        it("should initially be data:null, fetching: false, fetchError: null", () => {
            let action = {type: "SOME_TYPE"}
            expect(reducer(undefined, action)).to.equal(Map({
                fetching: false,
                data: Map({}),
                fetchError: null,
            }))
        })

        it("should update fetching to true when the collection fetch starts",  () => {
            const action = {type: collectionActionType, meta: {sequence: "BEGIN"}}
            const initialState = Map({
                fetching: false,
                fetchError: null,
                data: null,
            })
            expect(reducer(initialState, action)).to.equal(Map({
                fetching: true,
                fetchError: null,
                data: null,
            }))
        })

        it("should set the data when the action completes sucesfully", () => {
            const action = {
                type: collectionActionType,
                meta: {sequence: "COMPLETE"},
                payload: {items: [
                    {id: 123, key1: "value11", key2: "value12"},
                    {id: 456, key1: "value21", key2: "value22"},
                ]}
            }
            const initialState = Map({
                fetching: true,
                fetchError: null,
                data: null,
            })
            expect(reducer(initialState, action)).to.equal(Map({
                fetching: false,
                fetchError: null,
                data: fromJS({
                    "123": {
                        data: {
                            id: 123,
                            key1: "value11",
                            key2: "value12",
                        },
                        fetching: false,
                        fetchError: null,
                    },
                    "456": {
                        data: {
                            id: 456,
                            key1: "value21",
                            key2: "value22",
                        },
                        fetching: false,
                        fetchError: null,
                    },
                })
            }))
        })

        it("should set the error when the action fails", () => {
            const initialState = Map({
                fetchError: null,
                data: Map({}),
                fetching: true,
            })
            const err = new Error("argh!")
            const action = {
                meta: {sequence: "COMPLETE"},
                type: collectionActionType,
                error: true,
                payload: err,
            }
            expect(reducer(initialState, action)).to.equal(Map({
                fetchError: err,
                data: Map({}),
                fetching: false,
            }))
        })
    })

    describe("when fetching individual items", () => {
        it("should set fetching to true on that items id", () => {
            const initialState = fromJS({
                fetchError: null,
                fetching: false,
                data: {
                    "123": {
                        data: {some: "data"},
                        fetching: false,
                        fetchError: new Error("something"),
                    }
                }
            })
            const action = {
                type: detailActionType,
                meta: {sequence: "BEGIN", itemId: "123"},
            }
            expect(reducer(initialState, action)).to.equal(fromJS({
                fetchError:null,
                fetching: false,
                data: {
                    "123": {
                        data: {some: "data"},
                        fetching: true,
                        fetchError: null,
                    }
                }
            }))
        })

        it("should set the data to the fetched data when the action completes succesfully", () => {
            const initialState = fromJS({
                fetchError: null,
                fetching: false,
                data: {
                    "123": {
                        data: {some: "data"},
                        fetching: true,
                        fetchError: null,
                    }
                },
            })
            const action = {
                type: detailActionType,
                meta: {sequence: "COMPLETE", itemId: "123"},
                payload: {id: "123", some: "otherdata"},
            }
            expect(reducer(initialState, action)).to.equal(fromJS({
                fetchError: null,
                fetching: false,
                data: {
                    "123": {
                        data: {
                            id: "123",
                            some: "otherdata",
                        },
                        fetching: false,
                        fetchError: null,
                    },
                }
            }))
        })

        it("should set the fetcherror on the item when the request fails", () => {
            const initialState = fromJS({
                fetching: false,
                fetchError: null,
                data: {
                    "123": {
                        data: {some: "data"},
                        fetching: true,
                        fetchError: null,
                    }
                }
            })
            const err = new Error("Argh!")
            const action = {
                type: detailActionType,
                meta: {sequence: "COMPLETE", itemId: "123"},
                error: true,
                payload: err,
            }
            expect(reducer(initialState, action)).to.equal(fromJS({
                fetching: false,
                fetchError: null,
                data: {
                    "123": {
                        data: {some: "data"},
                        fetchError: err,
                        fetching: false,
                    }
                }
            }))
        })

    })

})
