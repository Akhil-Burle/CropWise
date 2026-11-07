# contracts/

`openapi.json` is the spec exported from the local FastAPI backend (`backend/`), which serves it at `/openapi.json`.
Re-export it after changing `backend/cropwise_api/schemas.py` or the routes:

```bash
backend/start.sh                                   # in another terminal
curl -s http://localhost:8000/openapi.json | python3 -m json.tool > contracts/openapi.json
```

Optional typed client: `cd app && npm run api:types` writes `app/src/services/generated/api.d.ts`. It downloads
`openapi-typescript` through `npx`, so it needs network access; nothing in the app imports the generated file yet
(responses are validated at runtime with the Zod schemas in `app/src/services/schemas/`).

The `uploads` and `analysis` methods in `app/src/services/http/index.ts` are already implemented. For the
remaining TODOs: call the endpoint, pass the response through `decode(Schema, raw, mapper)`. If the backend's
field names differ from the app's domain types, change only `app/src/services/schemas/` and
`app/src/services/mappers/`. No screen changes.
