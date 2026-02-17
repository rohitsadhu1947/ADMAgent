FROM python:3.11-slim

WORKDIR /app

# Install system deps
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project files
COPY backend/ ./backend/
COPY bot/ ./bot/
COPY railway_start.sh .
RUN chmod +x railway_start.sh

# Expose port
EXPOSE ${PORT:-8000}

# Start
CMD ["bash", "railway_start.sh"]
