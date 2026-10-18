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

def test_renderer_h265_codec():
    cmd = FFmpegRenderer.build_render_command(
        input_video_path="input.mp4",
        output_video_path="output_h265.mp4",
        codec="h265"
    )
    assert "-c:v" in cmd
    cv_idx = cmd.index("-c:v")
    assert cmd[cv_idx + 1] == "libx265"

def test_renderer_480p_and_2k():
    cmd_480 = FFmpegRenderer.build_render_command("in.mp4", "out_480.mp4", resolution="480p", aspect_ratio="9:16")
    vf_480 = cmd_480[cmd_480.index("-vf") + 1]
    assert "scale=w=480:h=854" in vf_480

    cmd_2k = FFmpegRenderer.build_render_command("in.mp4", "out_2k.mp4", resolution="2k", aspect_ratio="16:9")
    vf_2k = cmd_2k[cmd_2k.index("-vf") + 1]
    assert "scale=w=2560:h=1440" in vf_2k

def test_renderer_color_grading_and_effects():
    cmd = FFmpegRenderer.build_render_command(
        "in.mp4", "out.mp4",
        color_grading={"brightness": 20, "contrast": 15, "saturation": 30},
        effect_name="blur"
    )
    vf = cmd[cmd.index("-vf") + 1]
    assert "eq=brightness=0.20:contrast=1.15:saturation=1.30" in vf
    assert "boxblur=luma_radius=8:luma_power=2" in vf

def test_renderer_snapshot_and_audio_only():
    snap_cmd = FFmpegRenderer.build_snapshot_command("input.mp4", "frame.png", timestamp=2.5)
    assert "-ss" in snap_cmd
    assert snap_cmd[snap_cmd.index("-ss") + 1] == "2.5"
    assert "-vframes" in snap_cmd
    assert "frame.png" in snap_cmd

    audio_cmd = FFmpegRenderer.build_audio_export_command("input.mp4", "audio.m4a")
    assert "-vn" in audio_cmd
    assert "-c:a" in audio_cmd
    assert "audio.m4a" in audio_cmd
