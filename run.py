#!/usr/bin/env python3
"""
Startup script for YouTube Topic Filter that prevents __pycache__ generation
"""
import os
import sys

# Prevent Python from writing .pyc files and __pycache__ directories
os.environ['PYTHONDONTWRITEBYTECODE'] = '1'

# Run the Flask app
if __name__ == '__main__':
    from app import app
    app.run(debug=True, port=9000) 