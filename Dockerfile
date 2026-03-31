FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY agents.py used_images.json ./

CMD ["sh", "-c", "uvicorn agents:app --host 0.0.0.0 --port ${PORT:-8080}"]
