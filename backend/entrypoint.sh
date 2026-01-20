#!/bin/bash
set -e

# Add current directory to PYTHONPATH so alembic can find 'app'
export PYTHONPATH=$PYTHONPATH:.

# Run migrations
echo "Running migrations..."
alembic upgrade head

# Start the application
echo "Starting application..."
python run.py
