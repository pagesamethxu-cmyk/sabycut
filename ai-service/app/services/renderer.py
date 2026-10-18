import os
import subprocess
from typing import Dict, Any, Optional

class FFmpegRenderer:
    """
    FFmpeg Rendering Engine for SABYCUT.
    Supports high-definition 1080p and 4K export up to 60fps
    with Khmer subtitle burn-in via libass and HarfBuzz shaping.
    """

    RESOLUTIONS = {
        "720p": {"landscape": (1280, 720), "portrait": (720, 1280), "square": (720, 720)},
        "1080p": {"landscape": (1920, 1080), "portrait": (1080, 1920), "square": (1080, 1080)},
        "4k": {"landscape": (3840, 2160), "portrait": (2160, 3840), "square": (2160, 2160)}
    }

    FRAME_RATES = [24, 30, 60]

    @classmethod
    def get_dimensions(cls, resolution: str = "1080p", aspect_ratio: str = "9:16") -> tuple[int, int]:
        res_map = cls.RESOLUTIONS.get(resolution, cls.RESOLUTIONS["1080p"])
        if aspect_ratio == "9:16":
            return res_map["portrait"]
        elif aspect_ratio == "1:1":
            return res_map["square"]
        else:
            return res_map["landscape"]

    @classmethod
    def build_render_command(
        cls,
        input_video_path: str,
        output_video_path: str,
        resolution: str = "1080p",
        fps: int = 60,
        aspect_ratio: str = "9:16",
        subtitles_ass_path: Optional[str] = None,
        fonts_dir: Optional[str] = None
    ) -> list[str]:
        """
        Constructs the exact FFmpeg command array for 1080p 60fps video rendering.
        """
        if fps not in cls.FRAME_RATES:
            fps = 60

        width, height = cls.get_dimensions(resolution, aspect_ratio)

        # Video filters
        video_filters = [
            f"scale=w={width}:h={height}:force_original_aspect_ratio=decrease",
            f"pad={width}:{height}:(ow-iw)/2:(oh-ih)/2:black"
        ]

        # Burn-in Khmer subtitles using libass with HarfBuzz if subtitle file is present
        if subtitles_ass_path and os.path.exists(subtitles_ass_path):
            safe_ass = subtitles_ass_path.replace("\\", "/").replace(":", "\\:")
            if fonts_dir and os.path.exists(fonts_dir):
                safe_fonts = fonts_dir.replace("\\", "/").replace(":", "\\:")
                video_filters.append(f"subtitles='{safe_ass}':fontsdir='{safe_fonts}'")
            else:
                video_filters.append(f"subtitles='{safe_ass}'")

        vf_string = ",".join(video_filters)

        cmd = [
            "ffmpeg",
            "-y",
            "-i", input_video_path,
            "-vf", vf_string,
            "-r", str(fps),
            "-c:v", "libx264",
            "-preset", "fast",
            "-crf", "18",
            "-pix_fmt", "yuv420p",
            "-c:a", "aac",
            "-b:a", "320k",
            "-ar", "48000",
            output_video_path
        ]

        return cmd
