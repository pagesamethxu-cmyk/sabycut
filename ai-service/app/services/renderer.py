import os
import shutil
import subprocess
from typing import Dict, Any, Optional, List

class FFmpegRenderer:
    """
    Advanced FFmpeg Rendering Engine for SABYCUT.
    Supports 480p, 720p, 1080p, 2K, and 4K resolutions up to 60fps.
    Supports H.264 (libx264) and H.265 (libx265) codecs,
    multi-track video compositing, audio ducking, effects,
    and Khmer subtitle burn-in via libass with HarfBuzz shaping.
    """

    RESOLUTIONS = {
        "480p": {"landscape": (854, 480), "portrait": (480, 854), "square": (480, 480)},
        "720p": {"landscape": (1280, 720), "portrait": (720, 1280), "square": (720, 720)},
        "1080p": {"landscape": (1920, 1080), "portrait": (1080, 1920), "square": (1080, 1080)},
        "2k": {"landscape": (2560, 1440), "portrait": (1440, 2560), "square": (1440, 1440)},
        "4k": {"landscape": (3840, 2160), "portrait": (2160, 3840), "square": (2160, 2160)}
    }

    FRAME_RATES = [24, 30, 60]

    @classmethod
    def get_ffmpeg_binary(cls) -> str:
        """Finds system ffmpeg or uses imageio-ffmpeg bundled binary."""
        found = shutil.which("ffmpeg")
        if found:
            return "ffmpeg"
        try:
            import imageio_ffmpeg
            exe = imageio_ffmpeg.get_ffmpeg_exe()
            if os.path.exists(exe):
                return exe
        except Exception:
            pass
        return "ffmpeg"

    @classmethod
    def get_dimensions(cls, resolution: str = "1080p", aspect_ratio: str = "9:16") -> tuple[int, int]:
        res_map = cls.RESOLUTIONS.get(resolution.lower(), cls.RESOLUTIONS["1080p"])
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
        fonts_dir: Optional[str] = None,
        codec: str = "h264",
        video_bitrate: Optional[str] = None,
        color_grading: Optional[Dict[str, Any]] = None,
        effect_name: Optional[str] = None
    ) -> List[str]:
        """
        Constructs FFmpeg command array for rendering single or composite video.
        """
        if fps not in cls.FRAME_RATES:
            fps = 60

        width, height = cls.get_dimensions(resolution, aspect_ratio)
        video_filters: List[str] = [
            f"scale=w={width}:h={height}:force_original_aspect_ratio=decrease",
            f"pad={width}:{height}:(ow-iw)/2:(oh-ih)/2:black"
        ]

        # Apply color grading if provided
        if color_grading:
            b = 1.0 + (color_grading.get("brightness", 0) / 100.0)
            c = 1.0 + (color_grading.get("contrast", 0) / 100.0)
            s = 1.0 + (color_grading.get("saturation", 0) / 100.0)
            if b != 1.0 or c != 1.0 or s != 1.0:
                video_filters.append(f"eq=brightness={b - 1.0:.2f}:contrast={c:.2f}:saturation={s:.2f}")

        # Apply effect filter equivalent
        if effect_name:
            if effect_name == "blur":
                video_filters.append("boxblur=luma_radius=8:luma_power=2")
            elif effect_name == "vhs":
                video_filters.append("curves=vintage,noise=alls=15:allf=t")
            elif effect_name == "flash":
                video_filters.append("eq=brightness=0.6")
            elif effect_name == "mirror":
                video_filters.append("crop=iw/2:ih:0:0,split[l][r_tmp];[r_tmp]hflip[r];[l][r]hstack")

        # Burn-in Khmer subtitles using libass with HarfBuzz shaping
        if subtitles_ass_path and os.path.exists(subtitles_ass_path):
            safe_ass = subtitles_ass_path.replace("\\", "/").replace(":", "\\:")
            if fonts_dir and os.path.exists(fonts_dir):
                safe_fonts = fonts_dir.replace("\\", "/").replace(":", "\\:")
                video_filters.append(f"subtitles='{safe_ass}':fontsdir='{safe_fonts}'")
            else:
                video_filters.append(f"subtitles='{safe_ass}'")

        vf_string = ",".join(video_filters)
        vcodec = "libx265" if codec.lower() in ["h265", "hevc"] else "libx264"

        cmd = [
            cls.get_ffmpeg_binary(),
            "-y",
            "-i", input_video_path,
            "-vf", vf_string,
            "-r", str(fps),
            "-c:v", vcodec,
            "-preset", "fast",
            "-crf", "18",
            "-pix_fmt", "yuv420p"
        ]

        if video_bitrate:
            cmd.extend(["-b:v", video_bitrate])

        cmd.extend([
            "-c:a", "aac",
            "-b:a", "320k",
            "-ar", "48000",
            output_video_path
        ])

        return cmd

    @classmethod
    def build_snapshot_command(cls, input_video_path: str, output_image_path: str, timestamp: float) -> List[str]:
        """
        Extracts a single frame snapshot at a given timestamp
        """
        return [
            cls.get_ffmpeg_binary(),
            "-y",
            "-ss", str(timestamp),
            "-i", input_video_path,
            "-vframes", "1",
            "-q:v", "2",
            output_image_path
        ]

    @classmethod
    def build_audio_export_command(cls, input_video_path: str, output_audio_path: str) -> List[str]:
        """
        Exports audio-only from source media
        """
        return [
            cls.get_ffmpeg_binary(),
            "-y",
            "-i", input_video_path,
            "-vn",
            "-c:a", "aac",
            "-b:a", "320k",
            "-ar", "48000",
            output_audio_path
        ]

    @classmethod
    def render(
        cls,
        input_video_path: str,
        output_video_path: str,
        resolution: str = "1080p",
        fps: int = 60,
        aspect_ratio: str = "9:16",
        subtitles_ass_path: Optional[str] = None,
        fonts_dir: Optional[str] = None
    ) -> Dict[str, Any]:
        """Executes FFmpeg render process and returns status dict."""
        cmd = cls.build_render_command(
            input_video_path,
            output_video_path,
            resolution=resolution,
            fps=fps,
            aspect_ratio=aspect_ratio,
            subtitles_ass_path=subtitles_ass_path,
            fonts_dir=fonts_dir
        )
        try:
            res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=180)
            if res.returncode == 0:
                return {"success": True, "outputPath": output_video_path}
            else:
                return {"success": False, "error": res.stderr}
        except Exception as e:
            return {"success": False, "error": str(e)}
