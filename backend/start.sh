#!/bin/bash
# Start script for Render deployment
export PORT=${PORT:-5000}

# Run the Flask app
python api.py

