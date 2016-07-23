import jsonResponseHandler from "../src/jsonResponseHandler"

describe("The jsonResponseHandler", () => {
    it("should return the json if the response resolves correctly", () => {
        const resp = new Response(
            JSON.stringify({some: "value"}), {
            status: 200,
            headers: {"Content-Type": "application/json"},
        })
        const handler = jsonResponseHandler()
        return expect(handler(resp)).to.become({some: "value"})
    })

    it("should return an error if the json does not parse correctly", () => {
        const resp = new Response(
            "|1234", {
            status: 200,
            headers: {"Content-Type": "application/json"},
        })
        const handler = jsonResponseHandler()
        return expect(handler(resp)).to.be.rejected;
    })

    describe("when the statuscode is present in the responseConfig", () => {
        it("should return the value in the responseConfig if is not a function", () => {
            const resp = new Response(
                JSON.stringify({some: "value"}), {
                status: 400,
                headers: {"Content-Type": "application/json"},
            })
            const handler = jsonResponseHandler({400: {some: "othervalue"}})
            return expect(handler(resp)).to.become({
                some: "othervalue",
            })
        })

        it("should return the result of calling the function in the responseConfig if it is a function", () => {
            const resp = new Response(
                JSON.stringify({some: "value", other: "key"}), {
                status: 400,
                headers: {"Content-Type": "application/json"},
            })
            const handler = jsonResponseHandler({400: resp => resp.some})
            return expect(handler(resp)).to.become("value")
        })
    })

    describe("When the content type is not json", () => {
        describe("and there is no static (non function) handler in the response config", () => {
            it("should return the raw data from the response", () => {
                const resp = new Response(
                    "|123", {
                    status: 200,
                    headers: {"Content-Type": "text/html"},
                })
                const handler = jsonResponseHandler({400: resp => resp.some})
                return expect(handler(resp)).to.become("|123")
            })
        })

        describe("And there is a function handler", () => {
            it("should return the result of calling the handler with the raw data", () => {
                const resp = new Response(
                    "|123", {
                    status: 200,
                    headers: {"Content-Type": "text/html"},
                })
                const handler = jsonResponseHandler({200: resp => resp.substring(0, 2)})
                return expect(handler(resp)).to.become("|1")
            })
        })
    })
})
