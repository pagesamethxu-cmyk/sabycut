import pytest
from app.services.planner import AutoCutPlanner, EditDecisionList

def test_edl_schema_validation():
    analysis = {
        "duration": 20.0,
        "scenes": [
            {"scene_index": 0, "start": 0.0, "end": 4.0, "duration": 4.0},
            {"scene_index": 1, "start": 4.0, "end": 10.0, "duration": 6.0},
            {"scene_index": 2, "start": 10.0, "end": 20.0, "duration": 10.0}
        ],
        "silence": {
            "silence_intervals": [{"start": 3.8, "end": 4.5, "duration": 0.7}]
        },
        "beats": {
            "tempo": 120.0,
            "high_energy_peaks": [0.1, 4.2, 10.5]
        }
    }

    edl = AutoCutPlanner.plan_edl(
        analysis=analysis,
        form_preset="tiktok",
        user_prompt="Create punchy video without silence",
        provider="GEMINI",
        api_key=None
    )

    assert isinstance(edl, EditDecisionList)
    assert len(edl.cuts) >= 3
    assert len(edl.sfx) >= 1
    assert len(edl.captions) >= 1

    # Verify Tagged SFX
    valid_sfx_types = {"whoosh", "hit", "pop", "click", "riser", "impact"}
    for s in edl.sfx:
        assert s.type in valid_sfx_types

    # Hard Rule Check: No emoji anywhere in output
    for cut in edl.cuts:
        assert not any(ord(char) > 0x1F600 and ord(char) < 0x1F64F for char in cut.scene_label)
    for cap in edl.captions:
        assert not any(ord(char) > 0x1F600 and ord(char) < 0x1F64F for char in cap.text)

def test_emoji_cleaning_filter():
    dirty_text = "Intro scene with fire 🔥 and smiling face 😊"
    clean = AutoCutPlanner.clean_emoji(dirty_text)
    assert "🔥" not in clean
    assert "😊" not in clean
    assert clean == "Intro scene with fire  and smiling face "

def test_prompt_includes_hard_rule():
    prompt = AutoCutPlanner.build_prompt({}, "tiktok", "Please edit video")
    assert "Do not use emoji" in prompt
    assert "No emoji anywhere" in prompt
