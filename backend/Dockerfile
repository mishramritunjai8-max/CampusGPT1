FROM python:3.12-slim

WORKDIR /app

# Install build dependencies and curl for health check
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Create directory structure and run as non-root user
RUN useradd -u 1001 -r -g users -m -s /sbin/nologin appuser && \
    mkdir -p logs uploads && \
    chown -R appuser:users /app

USER appuser

EXPOSE 8000

ENV PORT=8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
