import pytest
from app.services.renderer import FFmpegRenderer

def test_renderer_1080p_60fps():
    cmd = FFmpegRenderer.build_render_command(
        input_video_path="input.mp4",
        output_video_path="output.mp4",
        resolution="1080p",
        fps=60,
        aspect_ratio="9:16"
    )

    # Check FPS flag
    assert "-r" in cmd
    fps_idx = cmd.index("-r")
    assert cmd[fps_idx + 1] == "60"

    # Check 1080p portrait dimensions (1080x1920)
    vf_idx = cmd.index("-vf")
    vf_string = cmd[vf_idx + 1]
    assert "scale=w=1080:h=1920" in vf_string
    assert "pad=1080:1920" in vf_string

    # Check audio fidelity
    assert "-b:a" in cmd
    ba_idx = cmd.index("-b:a")
    assert cmd[ba_idx + 1] == "320k"

def test_renderer_1080p_landscape_60fps():
    cmd = FFmpegRenderer.build_render_command(
        input_video_path="input.mp4",
        output_video_path="output_16_9.mp4",
        resolution="1080p",
        fps=60,
        aspect_ratio="16:9"
    )

    vf_idx = cmd.index("-vf")
    vf_string = cmd[vf_idx + 1]
    assert "scale=w=1920:h=1080" in vf_string
    assert "-r" in cmd
    assert cmd[cmd.index("-r") + 1] == "60"

def test_renderer_4k_60fps():
    cmd = FFmpegRenderer.build_render_command(
        input_video_path="raw.mp4",
        output_video_path="out_4k.mp4",
        resolution="4k",
        fps=60,
        aspect_ratio="16:9"
    )

    vf_string = cmd[cmd.index("-vf") + 1]
    assert "scale=w=3840:h=2160" in vf_string
    assert cmd[cmd.index("-r") + 1] == "60"
