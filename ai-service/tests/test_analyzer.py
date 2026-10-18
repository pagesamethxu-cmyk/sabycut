import pytest
from app.services.analyzer import VideoAnalyzer

def test_detect_scenes():
    scenes = VideoAnalyzer.detect_scenes(duration=18.0)
    assert len(scenes) >= 3
    assert scenes[0]["start"] == 0.0
    assert scenes[0]["end"] > 0.0
    assert scenes[-1]["end"] == 18.0

def test_detect_silence_and_fillers():
    result = VideoAnalyzer.detect_silence_and_fillers(duration=24.0)
    assert "silence_intervals" in result
    assert "speech_segments" in result
    assert len(result["speech_segments"]) > 0

def test_detect_beats_and_energy():
    result = VideoAnalyzer.detect_beats_and_energy(duration=20.0)
    assert "tempo" in result
    assert result["tempo"] > 0
    assert len(result["beat_timestamps"]) > 0
    assert len(result["high_energy_peaks"]) > 0

def test_keyframe_cost_limits():
    scenes = [{"scene_index": i, "start": i * 2.0, "end": (i + 1) * 2.0, "duration": 2.0} for i in range(25)]
    keyframes = VideoAnalyzer.sample_keyframes(scenes, max_keyframes=8)
    # Strictly must not exceed cost limit of 8 keyframes
    assert len(keyframes) <= 8
    assert keyframes[0]["is_hook"] is True

def test_transcribe_speech_khmer():
    transcript = VideoAnalyzer.transcribe_speech(duration=20.0)
    assert len(transcript) >= 2
    # Verify Khmer characters present without emoji
    assert any("ស្វាគមន៍" in item["text"] for item in transcript)
    for item in transcript:
        assert item["start"] < item["end"]
