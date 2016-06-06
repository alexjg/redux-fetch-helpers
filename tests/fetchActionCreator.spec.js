import fetchMock from "fetch-mock"
import fetchActionCreator from "../src/fetchActionCreator"
import sinon from "sinon"

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
            responseConfig: {
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

    describe("When the action complets succesfully", () => {
        let createResponsePayload = sinon.stub().returns("something")
        beforeEach(() => {
            createResponsePayload = sinon.stub().returns(Promise.resolve("something"))
            actionCreator = fetchActionCreator({
                url: "http://testserver/someurl/",
                fetchOptions: {method: "POST"},
                actionType: "SOME_ACTION_TYPE",
                createResponsePayload,
            })
            fetchMock.mock("http://testserver/someurl/", "POST", {
                status: 200,
                body: {"some": "value"},
                headers: {"Content-Type": "application/json"},
            })
        })

        it("when the createResponsePayload promise resolves it should return the result in the action", () => {
            const err = new Error("argh!")
            createResponsePayload.returns(Promise.resolve(err))
            actionCreator(dispatch)
            return dispatchedPromiseTwo.then(val => {
                expect(val.payload).to.equal(err)
                expect(val.error).to.be.true
                expect(createResponsePayload).to.have.been.calledWithMatch(
                    sinon.match.has("status", 200)
                )
            })
        })

        it("when the createResponsePaylod promise resolves with an error it should return the error in the action", () => {
            actionCreator(dispatch)
            return dispatchedPromiseTwo.then(val => {
                expect(val.payload).to.equal("something")
                expect(createResponsePayload).to.have.been.calledWithMatch(
                    sinon.match.has("status", 200)
                )
            })
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
