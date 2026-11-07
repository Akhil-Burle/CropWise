#!/usr/bin/env bash
# Starts the local CropWise API on 127.0.0.1:8000 using the ML virtualenv (it has PyTorch).
set -euo pipefail
cd "$(dirname "$0")"
PY="${CROPWISE_PYTHON:-../ml/.venv/bin/python}"
exec "$PY" -m uvicorn cropwise_api.main:app --host 127.0.0.1 --port "${CROPWISE_PORT:-8000}" "$@"
