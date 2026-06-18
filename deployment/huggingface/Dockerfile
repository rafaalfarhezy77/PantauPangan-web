FROM python:3.10-slim

# Install system dependencies (build-essential & python3-dev are needed to compile prophet/stan dependencies)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Set up working directory
WORKDIR /code

# Copy requirements and install python packages
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY app.py .

# Hugging Face Space runs on port 7860 by default
ENV PROPHET_PORT=7860
EXPOSE 7860

# Run with Gunicorn for production (with 180s timeout to allow prediction tasks to finish)
CMD ["gunicorn", "-b", "0.0.0.0:7860", "app:app", "--timeout", "180"]
