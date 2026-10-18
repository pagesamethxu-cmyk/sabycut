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
    from app.services.analyzer import VideoAnalyzer
    from app.services.planner import AutoCutPlanner
    from app.services.renderer import FFmpegRenderer
except ImportError:
    from config import Config
    from services.analyzer import VideoAnalyzer
    from services.planner import AutoCutPlanner
    from services.renderer import FFmpegRenderer

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
        "version": "0.2.0"
    }), 200

@app.route("/analyze", methods=["POST"])
@require_internal_token
def analyze():
    body = request.get_json(silent=True) or {}
    video_path = body.get("videoPath")
    duration = float(body.get("duration", 24.0))
    prompt = body.get("prompt", "")

    analysis = VideoAnalyzer.analyze_full(video_path=video_path, duration=duration, prompt=prompt)
    return jsonify({
        "message": "Analysis completed",
        "analysis": analysis
    }), 200

@app.route("/transcribe", methods=["POST"])
@require_internal_token
def transcribe():
    body = request.get_json(silent=True) or {}
    duration = float(body.get("duration", 24.0))
    prompt = body.get("prompt", "")

    segments = VideoAnalyzer.transcribe_speech(duration=duration, user_prompt=prompt)
    return jsonify({
        "message": "Transcription completed",
        "segments": segments
    }), 200

@app.route("/plan", methods=["POST"])
@require_internal_token
def plan():
    body = request.get_json(silent=True) or {}
    analysis = body.get("analysis") or {}
    form_preset = body.get("formPreset", "tiktok")
    user_prompt = body.get("prompt", "")
    provider = body.get("provider", "GEMINI")
    api_key = body.get("apiKey") # Decrypted on core server; never logged

    edl = AutoCutPlanner.plan_edl(
        analysis=analysis,
        form_preset=form_preset,
        user_prompt=user_prompt,
        provider=provider,
        api_key=api_key
    )
    return jsonify({
        "message": "Planning completed",
        "edl": edl.model_dump()
    }), 200

@app.route("/autocut/process", methods=["POST"])
@require_internal_token
def autocut_process():
    """
    Combined end-to-end Auto Cut execution endpoint:
    Runs video analysis (scenes, silence, beats, keyframes) + EDL planning.
    """
    body = request.get_json(silent=True) or {}
    duration = float(body.get("videoDuration", 24.0))
    form_preset = body.get("formPreset", "tiktok")
    user_prompt = body.get("prompt", "")
    provider = body.get("provider", "GEMINI")
    api_key = body.get("apiKey")

    analysis = VideoAnalyzer.analyze_full(duration=duration, prompt=user_prompt)
    edl = AutoCutPlanner.plan_edl(
        analysis=analysis,
        form_preset=form_preset,
        user_prompt=user_prompt,
        provider=provider,
        api_key=api_key
    )

    return jsonify({
        "message": "Auto Cut processing successful",
        "analysis": analysis,
        "edl": edl.model_dump()
    }), 200

@app.route("/render", methods=["POST"])
@require_internal_token
def render():
    body = request.get_json(silent=True) or {}
    input_path = body.get("inputPath")
    output_path = body.get("outputPath")
    resolution = body.get("resolution", "1080p")
    fps = int(body.get("fps", 60))
    aspect_ratio = body.get("aspectRatio", "9:16")

    if not input_path or not output_path:
        return jsonify({"error": "Missing inputPath or outputPath"}), 400

    result = FFmpegRenderer.render(
        input_video_path=input_path,
        output_video_path=output_path,
        resolution=resolution,
        fps=fps,
        aspect_ratio=aspect_ratio
    )
    if result.get("success"):
        return jsonify(result), 200
    else:
        return jsonify(result), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=Config.PORT, debug=True)
