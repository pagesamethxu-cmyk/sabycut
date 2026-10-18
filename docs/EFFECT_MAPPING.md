# SABYCUT Video Effects and Filters: WebGL / FFmpeg Mapping Table

This document specifies the exact mapping between SABYCUT's WebGL fragment shaders, CSS compositor filters, and FFmpeg filtergraph strings to ensure identical visual output between real-time mobile preview and high-definition server render export.

Rule: Strict compliance - no emoji anywhere.

---

## 1. Video Effects Mapping

| Effect ID | Effect Name | Category | WebGL Shader Implementation | FFmpeg Filtergraph Equivalent |
|---|---|---|---|---|
| `blur` | Gaussian Blur | Blur | 9-tap 2D Gaussian kernel with sigma uniform `u_intensity * 0.1` | `boxblur=luma_radius={val}:luma_power=2` |
| `glitch` | Digital Glitch | Distortion | UV displacement based on pseudo-random noise step and scanline offset | `frei0r=filter_name=glitch0r:filter_params={val}` or `geq=r='p(X+sin(Y*0.1)*{val},Y)':g='p(X,Y)':b='p(X-sin(Y*0.1)*{val},Y)'` |
| `shake` | Camera Shake | Motion | Dynamic translation matrix modulated by sinusoidal oscillation | `crop=w=in_w-40:h=in_h-40:x=(in_w-out_w)/2+sin(t*22)*{val}:y=(in_h-out_h)/2+cos(t*18)*{val}` |
| `zoom_pulse` | Zoom Pulse | Motion | Radial scaling matrix oscillating on tempo beat | `zoompan=z='min(zoom+0.002*{val},1.15)':d=1` |
| `rgb_split` | RGB Split (Chromatic Aberration) | Distortion | Independent sampling of R, G, B channels with horizontal pixel shifts | `rgbashift=rh={val}:bv=-{val}` |
| `film_grain` | 35mm Film Grain | Retro | Per-frame temporal noise synthesized from fract(sin(dot(uv, vec2(12.9898, 78.233)))) | `noise=alls={val}:allf=t+u` |
| `light_leak` | Warm Light Leak | Light | Additive gradient blend with amber color `#ffaa44` and screen mode | `colorchannelmixer=rr=1.2:rg=0.1:rb=0.0` |
| `vhs` | Vintage VHS | Retro | Combined scanline rasterization, color desaturation, and tape jitter | `curves=vintage,noise=alls=15:allf=t` |
| `flash` | White Flash | Light | Exponential brightness flare decaying over transition span | `eq=brightness={val}` |
| `mirror` | Mirror Reflection | Distortion | UV mirror condition `uv.x = abs(uv.x - 0.5) * 2.0` | `crop=iw/2:ih:0:0,split[left][tmp];[tmp]hflip[right];[left][right]hstack` |

---

## 2. Color Grading Controls Mapping

| Control | Range | WebGL Uniform / Math | FFmpeg Filter Equivalent |
|---|---|---|---|
| Brightness | -100 to +100 | `color.rgb += u_brightness / 100.0;` | `eq=brightness={val/100}` |
| Contrast | -100 to +100 | `color.rgb = (color.rgb - 0.5) * (1.0 + u_contrast / 100.0) + 0.5;` | `eq=contrast={1.0 + val/100}` |
| Saturation | -100 to +100 | `vec3 luma = vec3(dot(color.rgb, vec3(0.2126, 0.7152, 0.0722))); color.rgb = mix(luma, color.rgb, 1.0 + u_saturation / 100.0);` | `eq=saturation={1.0 + val/100}` |
| Sharpness | 0 to 100 | 3x3 unsharp masking convolution kernel | `unsharp=5:5:{val/50}:5:5:0.0` |
| Temperature | -100 to +100 | Warm: boost R channel; Cool: boost B channel | `colorbalance=rs={val/200}:bs={-val/200}` |
| Vignette | 0 to 100 | Smoothstep distance attenuation from frame center | `vignette=angle=PI/4:scale={val/100}` |
| 3D LUT | .cube file | 3D texture sampler `texture(u_lutTexture, color.rgb)` | `lut3d=file='{path_to_cube_file}'` |

---

## 3. Transitions Mapping

| Transition ID | Name | Shader Algorithm | FFmpeg xfade Equivalent |
|---|---|---|---|
| `fade` / `dissolve` | Cross Dissolve | `mix(texA, texB, progress)` | `xfade=transition=fade:duration={dur}:offset={offset}` |
| `slide_left` | Slide Left | Dual UV translation from right to left | `xfade=transition=slideleft:duration={dur}:offset={offset}` |
| `slide_right` | Slide Right | Dual UV translation from left to right | `xfade=transition=slideright:duration={dur}:offset={offset}` |
| `zoom_in` | Zoom In | Smooth zoom scaling with alpha blend | `xfade=transition=zoomin:duration={dur}:offset={offset}` |
| `wipe` | Wipe Horizontal | Step threshold UV horizontal wipe | `xfade=transition=wipeleft:duration={dur}:offset={offset}` |
| `glitch` | Glitch Cut | Randomized UV displacement across transition point | `xfade=transition=radial:duration={dur}:offset={offset}` |
| `spin` | Spin Rotation | Angular rotation around frame center | `xfade=transition=rotate:duration={dur}:offset={offset}` |
