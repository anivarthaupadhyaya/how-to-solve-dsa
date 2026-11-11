FROM python:3.11-slim AS base

# System deps for PyMySQL cryptography bindings
RUN apt-get update \
    && apt-get install -y --no-install-recommends gcc libffi-dev \
    && rm -rf /var/lib/apt/lists/*

# Non-root user
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser

WORKDIR /app

# Install Python deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Make entrypoint executable
RUN chmod +x entrypoint.sh

# Default port
ENV PORT=8000
EXPOSE ${PORT}

USER appuser

ENTRYPOINT ["./entrypoint.sh"]
