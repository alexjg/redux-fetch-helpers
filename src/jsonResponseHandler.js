export default function(responseConfig={}) {
    return (response) => {
        const handler = responseConfig[response.status]
        if (handler) {
            if (typeof handler !== "function"){
                return Promise.resolve(handler)
            }
        }
        if (response.headers.get("content-type") === "application/json") {
            if (handler) {
                return response.json().then(data => handler(data))
            }
            return response.json()
        }
        return response.text()
    }
}
