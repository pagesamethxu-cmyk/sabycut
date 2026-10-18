import os
import sys
from functools import wraps
from flask import Flask, request, jsonify
from flask_cors import CORS

# Add root directory to sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, ".."))
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

try:
    from app.config import Config
except ImportError:
    from config import Config

app = Flask(__name__)
CORS(app)

def require_internal_token(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        expected = f"Bearer {Config.INTERNAL_API_TOKEN}"
        if auth_header != expected:
            return jsonify({"error": "Unauthorized internal service request"}), 401
        return f(*args, **kwargs)
    return decorated

@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "UP",
        "service": "sabycut-ai-service",
        "version": "0.1.0"
    }), 200

@app.route("/analyze", methods=["POST"])
@require_internal_token
def analyze():
    # Placeholder for Phase 4 video scene and audio analysis
    return jsonify({
        "message": "Analysis endpoint ready for Phase 4 integration",
        "scenes": [],
        "silences": []
    }), 200

@app.route("/transcribe", methods=["POST"])
@require_internal_token
def transcribe():
    # Placeholder for Phase 3 Khmer Whisper/Gemini transcription
    return jsonify({
        "message": "Transcription endpoint ready for Phase 3 integration",
        "segments": []
    }), 200

@app.route("/plan", methods=["POST"])
@require_internal_token
def plan():
    # Placeholder for Phase 5 AI Auto Cut EDL Planner
    return jsonify({
        "message": "Planning endpoint ready for Phase 5 integration",
        "edl": {}
    }), 200

@app.route("/render", methods=["POST"])
@require_internal_token
def render():
    # Placeholder for Phase 2 server-side FFmpeg rendering
    return jsonify({
        "message": "Render endpoint ready for Phase 2 integration",
        "outputAssetId": None
    }), 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=Config.PORT, debug=True)
