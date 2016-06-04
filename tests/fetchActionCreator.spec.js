import fetchMock from "fetch-mock"
import fetchActionCreator from "../src/fetchActionCreator"

describe("The fetchActionCreator helper",  () => {
    let dispatchedPromiseOne
    let dispatchedPromiseTwo
    let resolveOne
    let resolveTwo
    let dispatchCount
    let actionCreator

    const dispatch = (value) => {
        if (dispatchCount == 0) {
            resolveOne(value)
        } else if (dispatchCount == 1) {
            resolveTwo(value)
        } else {
            throw "Dispatch called more than twice"
        }
        dispatchCount += 1
    }

    beforeEach(() => {
        dispatchCount = 0
        dispatchedPromiseOne = new Promise((resolve, reject) => {
            resolveOne = resolve
        })
        dispatchedPromiseTwo = new Promise((resolve, reject) => {
            resolveTwo = resolve
        })
        actionCreator = fetchActionCreator({
            url: "http://testserver/someurl/",
            fetchOptions: {
                method: "POST",
                body: JSON.stringify({some: "data"})
            },
            actionType: "SOME_ACTION_TYPE",
            errorConfig: {
                401: new Error("Unauthorized"),
                other: new Error("Other!"),
            }
        })
    })

    afterEach(fetchMock.restore)

    it("should dispatch a BEGIN event when starting the action", () => {
        fetchMock.mock("http://testserver/someurl/", "POST", {
            status: 200,
            body: {"some": "value"},
            headers: {"Content-Type": "application/json"},
        })
        actionCreator(dispatch)
        return expect(dispatchedPromiseOne).to.eventually.become({
            type: "SOME_ACTION_TYPE",
            meta: {sequence: "BEGIN"},
        })
    })

    it("should dispatch a success action with the JSON on a 200 response", () => {
        fetchMock.mock("http://testserver/someurl/", "POST", {
            status: 200,
            body: {"some": "value"},
            headers: {"Content-Type": "application/json"},
        })
        actionCreator(dispatch)
        return expect(dispatchedPromiseTwo).to.eventually.become({
            type: "SOME_ACTION_TYPE",
            meta: {sequence: "COMPLETE"},
            payload: {"some": "value"},
        })
    })

    it("should dispatch an error when the status is 401", () => {
        fetchMock.mock("http://testserver/someurl/", "POST", {
            status: 401,
            body: "Unauthorized",
            sendAsJson: false,
        })
        actionCreator(dispatch)
        return expect(dispatchedPromiseTwo).to.become({
            type: "SOME_ACTION_TYPE",
            meta: {sequence: "COMPLETE"},
            payload: new Error("Unauthorized"),
            error: true,
        })
    })

    it("should return an error when the fetch throws an error", () => {
        const err = new Error("Other!")
        fetchMock.mock("http://testserver/someurl/", "POST", {
            throws: err,
        })
        actionCreator(dispatch)
        return expect(dispatchedPromiseTwo).to.become({
            type: "SOME_ACTION_TYPE",
            meta: {sequence: "COMPLETE"},
            payload: err,
            error: true,
        })
    })

    describe("When a metaTransform is specified", () => {
        beforeEach(() => {
            actionCreator = fetchActionCreator({
                url: "http://testserver/someurl/",
                fetchOptions: {
                    method: "POST",
                    body: JSON.stringify({some: "data"})
                },
                actionType: "SOME_ACTION_TYPE",
                metaTransform: (meta) => {
                    meta.test = "result"
                    return meta
                },
            })
        })

        it("should be used to create the meta of the BEGIN action", () => {
            fetchMock.mock("http://testserver/someurl/", "POST", {
                status: 200,
                body: {"some": "value"},
                headers: {"Content-Type": "application/json"},
            })
            actionCreator(dispatch)
            return expect(dispatchedPromiseOne).to.eventually.become({
                type: "SOME_ACTION_TYPE",
                meta: {sequence: "BEGIN", test: "result"},
            })
        })

        it("should be used to create the meta of the successful completion action", () => {
            fetchMock.mock("http://testserver/someurl/", "POST", {
                status: 200,
                body: {"some": "value"},
                headers: {"Content-Type": "application/json"},
            })
            actionCreator(dispatch)
            return expect(dispatchedPromiseTwo).to.eventually.have.deep.property(
                "meta.test", "result"
            )
        })

        it("should be used to create the meta of the error completion action", () => {
            fetchMock.mock("http://testserver/someurl/", "POST", {throws: new Error("argh")})
            actionCreator(dispatch)
            return expect(dispatchedPromiseTwo).to.eventually.have.deep.property(
                "meta.test", "result"
            )
        })
    })
})
