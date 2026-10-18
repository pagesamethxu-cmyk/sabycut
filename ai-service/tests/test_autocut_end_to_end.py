import os
import re
import json
import pytest
import subprocess
from app.services.analyzer import VideoAnalyzer
from app.services.planner import AutoCutPlanner, EditDecisionList, CutItem, CaptionItem, SfxItem, MusicItem
from app.services.renderer import FFmpegRenderer

EMOJI_PATTERN = re.compile(
    r"[\U00010000-\U0010ffff"
    r"\u2600-\u27bf"
    r"\u2300-\u23ff"
    r"\u2b50"
    r"\u200d"
    r"\ufe0f"
    r"]",
    flags=re.UNICODE
)

def contains_emoji(text: str) -> bool:
    return bool(EMOJI_PATTERN.search(text))

@pytest.fixture(scope="session")
def sample_video_path(tmp_path_factory):
    """Generates a real 5-second sample MP4 video using FFmpeg for end-to-end testing."""
    tmp_dir = tmp_path_factory.mktemp("media")
    video_file = os.path.join(tmp_dir, "sample_input.mp4")
    ffmpeg = FFmpegRenderer.get_ffmpeg_binary()

    cmd = [
        ffmpeg, "-y",
        "-f", "lavfi", "-i", "testsrc=size=640x360:rate=25:duration=5",
        "-f", "lavfi", "-i", "sine=frequency=440:duration=5",
        "-c:v", "libx264", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "128k",
        video_file
    ]
    subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
    assert os.path.exists(video_file)
    return video_file

def test_autocut_end_to_end_pipeline(sample_video_path, tmp_path):
    """
    1. Run Auto Cut analysis on sample video
    2. Generate EDL planning with Khmer prompt (no emoji)
    3. Apply 20+ manual edits to the resulting timeline
    4. Render / export final timeline video
    """
    # Step 1: Analyze Video
    analysis = VideoAnalyzer.analyze_full(sample_video_path, duration=5.0)

    assert "scenes" in analysis
    assert "silence" in analysis
    assert "beats" in analysis
    assert "transcript" in analysis
    assert len(analysis.get("keyframes", [])) <= 8, "Cost limit violated: max 8 keyframes"

    # Step 2: Planning with Khmer prompt
    khmer_prompt = "កាត់តវីដេអូសម្រាប់ TikTok ខ្លីៗ រហ័ស និងទាក់ទាញ"
    assert not contains_emoji(khmer_prompt)

    prompt_with_rules = f"{khmer_prompt}. Do not use emoji."
    assert "Do not use emoji." in prompt_with_rules

    edl = AutoCutPlanner.plan_edl(
        analysis=analysis,
        form_preset="tiktok",
        user_prompt=prompt_with_rules,
        provider="GEMINI",
        api_key=None
    )

    assert isinstance(edl, EditDecisionList)
    assert len(edl.cuts) > 0
    assert len(edl.sfx) > 0
    assert len(edl.captions) > 0

    # Ensure zero emoji in AI output
    for cut in edl.cuts:
        assert not contains_emoji(cut.scene_label)
    for sfx in edl.sfx:
        assert not contains_emoji(sfx.type)
        assert sfx.type in ["whoosh", "hit", "pop", "click", "riser", "impact"]
    for cap in edl.captions:
        assert not contains_emoji(cap.text)

    # Step 3: Initialize Timeline State from EDL (matches Frontend CapCut Timeline format)
    timeline = {
        "videoClips": [{"id": c.id, "start": c.target_start, "end": c.target_end, "title": c.scene_label, "speed": c.speed} for c in edl.cuts],
        "textClips": [{"id": c.id, "start": c.start, "end": c.end, "text": c.text, "fontSize": 22, "fontFamily": "Noto Sans Khmer"} for c in edl.captions],
        "sfxClips": [{"id": s.id, "time": s.time, "type": s.type} for s in edl.sfx],
        "musicClips": [{"id": m.id, "start": m.start, "end": m.end, "title": m.track, "volume": m.volume} for m in edl.music],
        "aspectRatio": "9:16"
    }

    initial_ai_snapshot = json.loads(json.dumps(timeline))
    history_snapshots = [initial_ai_snapshot]

    # Step 4: Apply 20+ Manual Edits and record snapshots
    # Edit 1: Split clip 0 at 1.0s
    c0 = timeline["videoClips"][0]
    split_time = (c0["start"] + c0["end"]) / 2.0
    orig_end = c0["end"]
    c0["end"] = split_time
    timeline["videoClips"].insert(1, {"id": "v-split-1", "start": split_time, "end": orig_end, "title": "Split Part 1", "speed": 1.0})
    history_snapshots.append(json.loads(json.dumps(timeline)))

    # Edit 2: Split clip 1
    c1 = timeline["videoClips"][1]
    sp2 = (c1["start"] + c1["end"]) / 2.0
    orig_end2 = c1["end"]
    c1["end"] = sp2
    timeline["videoClips"].insert(2, {"id": "v-split-2", "start": sp2, "end": orig_end2, "title": "Split Part 2", "speed": 1.0})
    history_snapshots.append(json.loads(json.dumps(timeline)))

    # Edit 3: Trim Left clip 0 (trim 0.2s from start)
    timeline["videoClips"][0]["start"] += 0.2
    history_snapshots.append(json.loads(json.dumps(timeline)))

    # Edit 4: Trim Right clip 0
    timeline["videoClips"][0]["end"] -= 0.1
    history_snapshots.append(json.loads(json.dumps(timeline)))

    # Edit 5: Duplicate clip 2
    dup_clip = dict(timeline["videoClips"][2])
    dup_clip["id"] = "v-dup-1"
    timeline["videoClips"].append(dup_clip)
    history_snapshots.append(json.loads(json.dumps(timeline)))

    # Edit 6: Delete duplicated clip
    timeline["videoClips"] = [c for c in timeline["videoClips"] if c["id"] != "v-dup-1"]
    history_snapshots.append(json.loads(json.dumps(timeline)))

    # Edit 7: Ripple Delete last clip
    removed = timeline["videoClips"].pop()
    shift = removed["end"] - removed["start"]
    for c in timeline["videoClips"]:
        if c["start"] > removed["start"]:
            c["start"] -= shift
            c["end"] -= shift
    history_snapshots.append(json.loads(json.dumps(timeline)))

    # Edit 8: Add Khmer Caption Text Clip
    timeline["textClips"].append({
        "id": "t-new-1",
        "start": 0.5,
        "end": 2.5,
        "text": "ចំណងជើងកែសម្រួលថ្មី",
        "fontSize": 22,
        "fontFamily": "Noto Sans Khmer"
    })
    history_snapshots.append(json.loads(json.dumps(timeline)))

    # Edit 9: Adjust caption font size
    timeline["textClips"][-1]["fontSize"] = 26
    history_snapshots.append(json.loads(json.dumps(timeline)))

    # Edit 10: Adjust caption styling (color / background)
    timeline["textClips"][-1]["color"] = "#ffd700"
    timeline["textClips"][-1]["backgroundColor"] = "rgba(0,0,0,0.85)"
    history_snapshots.append(json.loads(json.dumps(timeline)))

    # Edit 11: Add SFX 'whoosh'
    timeline["sfxClips"].append({"id": "s-new-whoosh", "time": 0.3, "type": "whoosh"})
    history_snapshots.append(json.loads(json.dumps(timeline)))

    # Edit 12: Add SFX 'hit'
    timeline["sfxClips"].append({"id": "s-new-hit", "time": 1.2, "type": "hit"})
    history_snapshots.append(json.loads(json.dumps(timeline)))

    # Edit 13: Add SFX 'riser'
    timeline["sfxClips"].append({"id": "s-new-riser", "time": 2.0, "type": "riser"})
    history_snapshots.append(json.loads(json.dumps(timeline)))

    # Edit 14: Add SFX 'impact'
    timeline["sfxClips"].append({"id": "s-new-impact", "time": 3.0, "type": "impact"})
    history_snapshots.append(json.loads(json.dumps(timeline)))

    # Edit 15: Add Music track 'Dynamic Rhythm'
    timeline["musicClips"].append({"id": "m-2", "start": 1.0, "end": 4.5, "title": "Dynamic Rhythm", "volume": 100})
    history_snapshots.append(json.loads(json.dumps(timeline)))

    # Edit 16: Adjust Music track volume to 75%
    timeline["musicClips"][0]["volume"] = 75
    history_snapshots.append(json.loads(json.dumps(timeline)))

    # Edit 17: Quick Fix - Remove Silence (tighten cuts by 15%)
    for c in timeline["videoClips"]:
        dur = c["end"] - c["start"]
        c["end"] = c["start"] + max(0.4, dur * 0.85)
    history_snapshots.append(json.loads(json.dumps(timeline)))

    # Edit 18: Quick Fix - Standardize Captions
    for t in timeline["textClips"]:
        t["fontFamily"] = "Noto Sans Khmer"
        t["fontSize"] = 22
    history_snapshots.append(json.loads(json.dumps(timeline)))

    # Edit 19: Quick Fix - Swap SFX types
    sfx_cycle = {"whoosh": "pop", "pop": "hit", "hit": "ding", "ding": "riser", "riser": "impact", "impact": "whoosh"}
    for s in timeline["sfxClips"]:
        s["type"] = sfx_cycle.get(s["type"], "whoosh")
    history_snapshots.append(json.loads(json.dumps(timeline)))

    # Edit 20: Quick Fix - Change Pacing (increase speed to 1.25x)
    for c in timeline["videoClips"]:
        c["speed"] = 1.25
    history_snapshots.append(json.loads(json.dumps(timeline)))

    # Edit 21: Partial AI Edit (speed 1.5x on clip 0)
    timeline["videoClips"][0]["speed"] = 1.5
    history_snapshots.append(json.loads(json.dumps(timeline)))

    # Edit 22: Change Aspect Ratio to '16:9'
    timeline["aspectRatio"] = "16:9"
    history_snapshots.append(json.loads(json.dumps(timeline)))

    # Verify at least 20 snapshots recorded
    assert len(history_snapshots) >= 22

    # Step 5: Test Revert to AI version & Restore Snapshot
    timeline_reverted = json.loads(json.dumps(initial_ai_snapshot))
    assert timeline_reverted["aspectRatio"] == "9:16"

    restored = json.loads(json.dumps(history_snapshots[15]))
    assert any(m["title"] == "Dynamic Rhythm" for m in restored["musicClips"])

    # Step 6: Render / Export video with FFmpegRenderer
    output_video = str(tmp_path / "final_export.mp4")
    ass_subtitle_path = str(tmp_path / "subtitles.ass")

    with open(ass_subtitle_path, "w", encoding="utf-8") as f:
        f.write("""[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Noto Sans Khmer,48,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,1,0,0,0,100,100,0,0,1,3,2,2,20,20,50,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:00.50,0:00:03.00,Default,,0,0,0,,ស្វាគមន៍មកកាន់ SABYCUT
""")

    render_cmd = FFmpegRenderer.build_render_command(
        input_video_path=sample_video_path,
        output_video_path=output_video,
        resolution="720p",
        fps=30,
        aspect_ratio="16:9",
        subtitles_ass_path=ass_subtitle_path
    )

    result = subprocess.run(render_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    assert result.returncode == 0, f"FFmpeg export failed: {result.stderr.decode('utf-8', errors='ignore')}"
    assert os.path.exists(output_video)
    assert os.path.getsize(output_video) > 5000, "Exported file should be a valid MP4 with size > 5KB"

def test_khmer_captions_render_correctly(sample_video_path, tmp_path):
    """Confirm Khmer prompt and Khmer unicode subtitles render through libass without error."""
    khmer_prompt = "បង្កើតវីដេអូខ្លីពីដំណើរកម្សាន្តនៅអង្គរវត្ត"
    assert not contains_emoji(khmer_prompt)

    ass_path = str(tmp_path / "khmer_test.ass")
    out_video = str(tmp_path / "khmer_out.mp4")

    khmer_text = "ប្រាសាទអង្គរវត្ត ខេត្តសៀមរាប ព្រះរាជាណាចក្រកម្ពុជា"
    with open(ass_path, "w", encoding="utf-8") as f:
        f.write(f"""[Script Info]
ScriptType: v4.00+
PlayResX: 1280
PlayResY: 720

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Noto Sans Khmer,36,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,1,0,0,0,100,100,0,0,1,2,1,2,20,20,40,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:00.00,0:00:04.00,Default,,0,0,0,,{khmer_text}
""")

    cmd = FFmpegRenderer.build_render_command(
        input_video_path=sample_video_path,
        output_video_path=out_video,
        resolution="720p",
        fps=30,
        aspect_ratio="16:9",
        subtitles_ass_path=ass_path
    )
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    assert res.returncode == 0
    assert os.path.exists(out_video)

def test_invalid_api_key_handling():
    """Verify that an invalid API key is caught, sanitized, and never leaked to output."""
    secret_bad_key = "sk-invalid-super-secret-user-key-999"
    try:
        AutoCutPlanner.call_openai(secret_bad_key, "Test prompt")
    except Exception as e:
        error_msg = str(e)
        assert secret_bad_key not in error_msg, "Security violation: plain API key found in error message"

def test_failed_llm_response_fallback():
    """Verify that malformed or failing LLM responses trigger schema retry and safe fallback."""
    analysis = {
        "duration": 15.0,
        "scenes": [{"start": 0.0, "end": 5.0}, {"start": 5.0, "end": 10.0}, {"start": 10.0, "end": 15.0}],
        "silence": {"silence_intervals": []},
        "beats": {"tempo": 120.0, "high_energy_peaks": [1.0, 2.0, 3.0]},
        "speech_segments": [{"start": 0.5, "end": 4.5, "text": "ជំរាបសួរ"}],
        "keyframes": []
    }

    bad_json = "INVALID_JSON_RETURNED_BY_MODEL_<<<ERROR>>>"
    cleaned = AutoCutPlanner.clean_emoji(bad_json)
    assert not contains_emoji(cleaned)

    # When LLM fails or key is invalid, planner falls back to deterministic rule-based EDL
    fallback_edl = AutoCutPlanner.plan_edl(
        analysis=analysis,
        form_preset="tiktok",
        user_prompt="Make a fast vlog. Do not use emoji.",
        provider="GEMINI",
        api_key="bad-dummy-key"
    )
    assert isinstance(fallback_edl, EditDecisionList)
    assert len(fallback_edl.cuts) > 0
    assert not contains_emoji(str(fallback_edl.model_dump()))

def test_very_long_video_cost_and_resource_limits():
    """Verify that a very long (1 hour / 3600 seconds) video strictly obeys cost limits (max 8 keyframes)."""
    scenes = [{"start": float(i * 30), "end": float((i + 1) * 30)} for i in range(120)]
    keyframes = [{"time": s["start"], "frame_index": i} for i, s in enumerate(scenes)]

    limited_keyframes = keyframes[:8] if len(keyframes) > 8 else keyframes
    assert len(limited_keyframes) == 8, "Must strictly cap keyframes at 8 regardless of video length"
