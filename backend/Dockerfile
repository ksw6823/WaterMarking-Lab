# Use an official Python runtime as a parent image
FROM python:3.10-slim

# Set the working directory in the container
WORKDIR /app

# Install system dependencies (needed for psycopg2, etc)
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy the requirements file into the container at /app
COPY requirements.txt /app/

# Install any exact dependencies specified in requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . /app

# Make port 8000 available to the world outside this container
EXPOSE 8000

COPY entrypoint.sh /app/
RUN chmod +x /app/entrypoint.sh

# Run run.py when the container launches
CMD ["/app/entrypoint.sh"]
