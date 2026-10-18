import json
import re
import requests
from typing import List, Dict, Any, Optional, Literal
from pydantic import BaseModel, Field, ValidationError

class CutItem(BaseModel):
    id: str
    source_start: float
    source_end: float
    target_start: float
    target_end: float
    scene_label: str
    speed: float = 1.0
    transition: str = "none"

class CaptionItem(BaseModel):
    id: str
    start: float
    end: float
    text: str

class SfxItem(BaseModel):
    id: str
    time: float
    type: Literal["whoosh", "hit", "pop", "click", "riser", "impact"]
    reason: str

class MusicItem(BaseModel):
    id: str
    start: float
    end: float
    track: str = "ambient_modern"
    volume: float = 80.0

class EditDecisionList(BaseModel):
    cuts: List[CutItem]
    captions: List[CaptionItem]
    sfx: List[SfxItem]
    music: List[MusicItem]
    target_duration: float
    aspect_ratio: str = "9:16"

CutDecision = CutItem
SFXDecision = SfxItem
CaptionDecision = CaptionItem

class AutoCutPlanner:
    """
    AI Auto Cut Decision Engine.
    Takes video analysis JSON + Video Form + user prompt,
    communicates with Gemini or OpenAI with strict 'Do not use emoji' instructions,
    and returns a validated EditDecisionList (EDL) with schema retry loops.
    """

    TAGGED_SFX = ["whoosh", "hit", "pop", "click", "riser", "impact"]

    @classmethod
    def clean_emoji(cls, text: str) -> str:
        """Removes any unintentional emoji characters from text."""
        emoji_pattern = re.compile(
            r"[\U00010000-\U0010ffff\uD800-\uDBFF\uDC00-\uDFFF\u2600-\u27BF\u2300-\u23FF\u2B50\u2B06]",
            flags=re.UNICODE
        )
        return emoji_pattern.sub("", text)

    @classmethod
    def build_prompt(cls, analysis: Dict[str, Any], form_preset: str, user_prompt: str, error_feedback: Optional[str] = None) -> str:
        base_prompt = f"""You are the SABYCUT AI Video Editor Planner.
Hard Rule: Do not use emoji. No emoji anywhere. No emojis in scene labels, captions, or any other field.
Analyze the provided video metadata and create an optimal Edit Decision List (EDL).

Video Form: {form_preset}
User Prompt: {user_prompt if user_prompt else 'Create a high-engagement edit removing silence and highlighting key moments.'}
Video Analysis Summary:
- Total Duration: {analysis.get('duration', 24)} seconds
- Detected Scenes: {len(analysis.get('scenes', []))} scenes
- Silences detected: {len(analysis.get('silence', {}).get('silence_intervals', []))}
- Music Tempo: {analysis.get('beats', {}).get('tempo', 120)} BPM

Required Sound Effects Library:
Choose only from: whoosh, hit, pop, click, riser, impact. Place whoosh at scene cuts, hit/impact at action moments, and pop/click on caption entries.

Return strictly a valid JSON object matching this schema:
{{
  "cuts": [
    {{"id": "c1", "source_start": 0.0, "source_end": 3.0, "target_start": 0.0, "target_end": 3.0, "scene_label": "Hook Scene", "speed": 1.0, "transition": "none"}}
  ],
  "captions": [
    {{"id": "t1", "start": 0.5, "end": 2.8, "text": "Khmer or English caption without emoji"}}
  ],
  "sfx": [
    {{"id": "s1", "time": 0.05, "type": "whoosh", "reason": "intro transition"}}
  ],
  "music": [
    {{"id": "m1", "start": 0.0, "end": 18.0, "track": "ambient_modern", "volume": 80.0}}
  ],
  "target_duration": 18.0,
  "aspect_ratio": "9:16"
}}

Do not use emoji. Output JSON only. No markdown fences, no explanation text."""

        if error_feedback:
            base_prompt += f"\n\nCRITICAL FIX: The previous output failed schema validation: {error_feedback}. Fix the structure and return valid JSON. Do not use emoji."

        return base_prompt

    @classmethod
    def call_gemini(cls, api_key: str, prompt: str, model: str = "gemini-1.5-flash") -> str:
        """Calls Google Gemini API with 'Do not use emoji' prompt."""
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
        payload = {
            "contents": [{
                "parts": [{"text": prompt}]
            }],
            "generationConfig": {
                "temperature": 0.2,
                "responseMimeType": "application/json"
            }
        }
        res = requests.post(url, json=payload, timeout=25)
        if res.status_code != 200:
            raise ValueError(f"Gemini API returned HTTP {res.status_code}: {res.text}")
        data = res.json()
        try:
            return data["candidates"][0]["content"]["parts"][0]["text"]
        except (KeyError, IndexError):
            raise ValueError("Unexpected response structure from Gemini API")

    @classmethod
    def call_openai(cls, api_key: str, prompt: str, model: str = "gpt-4o-mini") -> str:
        """Calls OpenAI API with 'Do not use emoji' prompt."""
        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": "You are a professional video editor decision engine. Do not use emoji."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.2,
            "response_format": {"type": "json_object"}
        }
        res = requests.post(url, json=payload, headers=headers, timeout=25)
        if res.status_code != 200:
            raise ValueError(f"OpenAI API returned HTTP {res.status_code}: {res.text}")
        data = res.json()
        try:
            return data["choices"][0]["message"]["content"]
        except (KeyError, IndexError):
            raise ValueError("Unexpected response structure from OpenAI API")

    @classmethod
    def plan_edl(
        cls,
        analysis: Dict[str, Any],
        form_preset: str = "tiktok",
        user_prompt: str = "",
        provider: str = "GEMINI",
        api_key: Optional[str] = None,
        max_retries: int = 3
    ) -> EditDecisionList:
        """
        Executes EDL planning with schema validation and automatic retries.
        """
        error_feedback = None

        if api_key and len(api_key) > 10:
            for attempt in range(max_retries):
                try:
                    prompt = cls.build_prompt(analysis, form_preset, user_prompt, error_feedback)
                    if provider.upper() == "OPENAI":
                        raw_json = cls.call_openai(api_key, prompt)
                    else:
                        raw_json = cls.call_gemini(api_key, prompt)

                    # Clean json fences and emoji
                    clean_str = cls.clean_emoji(raw_json.strip())
                    if clean_str.startswith("```json"):
                        clean_str = clean_str[7:]
                    if clean_str.startswith("```"):
                        clean_str = clean_str[3:]
                    if clean_str.endswith("```"):
                        clean_str = clean_str[:-3]

                    parsed = json.loads(clean_str.strip())
                    edl = EditDecisionList.model_validate(parsed)
                    return edl
                except (json.JSONDecodeError, ValidationError) as ve:
                    error_feedback = str(ve)
                except Exception as ex:
                    # In case of API quota, rate limit, or invalid key, break to fallback generator
                    break

        # Fallback intelligent deterministic EDL generator
        return cls.generate_heuristic_edl(analysis, form_preset, user_prompt)

    @classmethod
    def generate_heuristic_edl(
        cls,
        analysis: Dict[str, Any],
        form_preset: str = "tiktok",
        user_prompt: str = ""
    ) -> EditDecisionList:
        """
        Generates structured, validated EDL aligned with form preset and silence removal.
        """
        duration = analysis.get("duration", 24.0)
        scenes = analysis.get("scenes", [])
        silences = analysis.get("silence", {}).get("silence_intervals", [])
        energy_peaks = analysis.get("beats", {}).get("high_energy_peaks", [])

        # Form target pacing
        pacing = 2.6 if form_preset == "tiktok" else 3.0 if form_preset == "gaming" else 4.5
        cuts: List[CutItem] = []
        sfx: List[SfxItem] = []
        captions: List[CaptionItem] = []

        cur_target = 0.0
        clip_num = 1

        for scene in scenes:
            s_start = scene["start"]
            s_end = scene["end"]

            # Skip or trim silent zones
            for sil in silences:
                if sil["start"] <= s_start and sil["end"] >= s_end:
                    # Scene is completely silent
                    continue
                elif sil["start"] > s_start and sil["start"] < s_end:
                    s_end = sil["start"]

            seg_len = s_end - s_start
            if seg_len < 0.6:
                continue

            target_len = min(seg_len, pacing)
            target_end = round(cur_target + target_len, 2)

            cuts.append(CutItem(
                id=f"clip-v{clip_num}",
                source_start=round(s_start, 2),
                source_end=round(s_start + target_len, 2),
                target_start=cur_target,
                target_end=target_end,
                scene_label=f"Hook Scene" if clip_num == 1 else f"Scene {clip_num}",
                speed=1.0,
                transition="fade" if form_preset == "vlog" else "none"
            ))

            # Tagged SFX placement at event timestamps
            if clip_num == 1:
                sfx.append(SfxItem(id=f"clip-s{clip_num}", time=cur_target + 0.05, type="whoosh", reason="intro transition"))
            elif clip_num % 3 == 0:
                sfx.append(SfxItem(id=f"clip-s{clip_num}", time=cur_target + 0.05, type="pop", reason="scene punchline"))
            elif clip_num % 2 == 0:
                sfx.append(SfxItem(id=f"clip-s{clip_num}", time=cur_target + 0.05, type="hit", reason="action accent"))

            cur_target = target_end
            clip_num += 1

        # Khmer Captions
        khmer_texts = [
            "ស្វាគមន៍មកកាន់ SABYCUT",
            "កាត់តវីដេអូស្វ័យប្រវត្តិតាម AI",
            "គុណភាពខ្ពស់ និងរហ័សទាន់ចិត្ត",
            "សូមចុច Like និង Follow"
        ]
        cap_time = 0.4
        for idx, text in enumerate(khmer_texts):
            if cap_time < cur_target:
                cap_end = min(round(cap_time + 2.8, 2), cur_target)
                captions.append(CaptionItem(
                    id=f"clip-t{idx + 1}",
                    start=cap_time,
                    end=cap_end,
                    text=cls.clean_emoji(text)
                ))
                cap_time = round(cap_end + 1.2, 2)

        # Background music
        music = [
            MusicItem(id="clip-m1", start=0.0, end=cur_target, track="beat_synced_groove", volume=75.0)
        ]

        return EditDecisionList(
            cuts=cuts,
            captions=captions,
            sfx=sfx,
            music=music,
            target_duration=cur_target,
            aspect_ratio="16:9" if form_preset == "vlog" else "9:16"
        )
