export default function(responseConfig={}) {
    return (response) => {
        const handler = responseConfig[response.status]
        if (handler) {
            if (typeof handler !== "function"){
                return Promise.resolve(handler)
            }
        }

        const responseIsJson  = (response.headers.get("content-type") === "application/json")

        if (handler) {
            //we know handler is a function at this point
            const bodyPromise = responseIsJson ? response.json() : response.text()
            return bodyPromise.then(data => handler(data))
        }

        if (responseIsJson) {
            return response.json()
        }

        return response.text()
    }
}
