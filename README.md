This is a tiny library for generating actions which fetch things.

E.g

```javascript
actionCreator = fetchActionCreator({
    url: "http://testserver/someurl/",
    fetchOptions: {
        method: "POST",
        body: JSON.stringify({some: "data"})
    },
    actionType: "SOME_ACTION_TYPE",
    responseConfig: {
        201: {created: true},
        401: new Error("Unauthorized"),
        other: new Error("Other!"),
    }
})
```

Would create an action creator which will send POST requests to "http://testserver/someurl" using `redux-thunk`. The `fetchOptions` and `url` are passed to `fetch`. When the request begins an action like

```javascript
{
    type: "SOME_ACTION_TYPE",
    meta: {sequence: "BEGIN"},
}
```

Will be dispatched. When the request completes sucesfully:

```javascript
{
    type: "SOME_ACTION_TYPE",
    meta: {sequence: "COMPLETE"},
}
```

The `responseConfig` map is used to map statuses to action payloads. If a value is a function then that function will be called with the body of the response (parsed into JS if content type is "application/json".
