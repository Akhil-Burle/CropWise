# contracts/

Put the FastAPI-generated `openapi.json` here (FastAPI serves it at `/openapi.json`).

```bash
curl http://localhost:8000/openapi.json -o contracts/openapi.json
cd app && npm run api:types          # → app/src/services/generated/api.d.ts
```

Then, in `app/src/services/http/index.ts`, implement each TODO: call the endpoint, pass the response
through `decode(Schema, raw, mapper)`. If the backend's field names differ from the app's domain
types, change only `app/src/services/schemas/` and `app/src/services/mappers/`. No screen changes.
