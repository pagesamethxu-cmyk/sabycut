import os
import sys

# Ensure current directory is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.main import app
from app.config import Config

if __name__ == '__main__':
    print(f"Starting SABYCUT AI Service on port {Config.PORT}...")
    app.run(host='0.0.0.0', port=Config.PORT, debug=True)
