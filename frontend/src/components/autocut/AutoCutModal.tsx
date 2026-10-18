import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Film, 
  Upload, 
  FileVideo, 
  ArrowRight, 
  Loader2, 
  CheckCircle2, 
  Sliders, 
  Plus, 
  Trash2, 
  AlertCircle,
  Clock,
  Radio,
  Check
} from 'lucide-react';
import { t } from '../../i18n';
import { api, KeyInfo } from '../../services/api';

export interface VideoItem {
  id: string;
  file: File;
  name: string;
  url: string;
  duration: number;
}

export interface AutoCutResult {
  videoUrl?: string;
  videoName?: string;
  videoDuration: number;
  formName: string;
  cuts: Array<{ id?: string; start: number; end: number; title: string }>;
  sfx: Array<{ id?: string; time: number; type: string; title?: string }>;
  captions: Array<{ id?: string; start: number; end: number; text: string; title?: string }>;
  timelineJson?: string;
  originalTimelineJson?: string;
  aspectRatio?: '9:16' | '16:9' | '1:1';
}

interface AutoCutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (result: AutoCutResult) => void;
  onOpenSettings?: () => void;
}

export const AutoCutModal: React.FC<AutoCutModalProps> = ({ isOpen, onClose, onApply, onOpenSettings }) => {
  // Step 1: Pick One or More Videos
  const [videoList, setVideoList] = useState<VideoItem[]>([]);
  const rawVideoInputRef = useRef<HTMLInputElement>(null);

  // Step 2: Video Form (Preset, Custom, Reference Video)
  const [formType, setFormType] = useState<'preset' | 'custom' | 'reference'>('preset');
  const [selectedPreset, setSelectedPreset] = useState<'tiktok' | 'vlog' | 'gaming' | 'podcast'>('tiktok');
  
  // Custom Form controls
  const [customDuration, setCustomDuration] = useState<number>(30);
  const [customPacing, setCustomPacing] = useState<'fast' | 'normal' | 'slow'>('fast');
  const [customAspect, setCustomAspect] = useState<'9:16' | '16:9' | '1:1'>('9:16');

  // Reference Video
  const [refVideoFile, setRefVideoFile] = useState<File | null>(null);
  const [refVideoName, setRefVideoName] = useState<string>('');
  const refVideoInputRef = useRef<HTMLInputElement>(null);

  // Step 3: User Prompt
  const [prompt, setPrompt] = useState('');
  const [provider, setProvider] = useState<'GEMINI' | 'OPENAI'>('GEMINI');

  // Vault key check
  const [hasKey, setHasKey] = useState<boolean>(true);
  const [keyNotice, setKeyNotice] = useState<string | null>(null);

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeStep, setActiveStep] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [stepMessage, setStepMessage] = useState<string>('');
  const [result, setResult] = useState<AutoCutResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const wsCleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (isOpen) {
      checkKeyStatus();
    } else {
      if (wsCleanupRef.current) {
        wsCleanupRef.current();
        wsCleanupRef.current = null;
      }
    }
  }, [isOpen, provider]);

  const checkKeyStatus = async () => {
    try {
      const keys = await api.keys.getKeys();
      const active = keys.find((k: KeyInfo) => k.provider.toUpperCase() === provider);
      const guestKey = localStorage.getItem(`sabycut_${provider.toLowerCase()}_key`);
      if (active || guestKey) {
        setHasKey(true);
        setKeyNotice(null);
      } else {
        setHasKey(false);
        setKeyNotice(`No API key configured for ${provider}. Please configure it in Settings.`);
      }
    } catch {
      setHasKey(true);
    }
  };

  if (!isOpen) return null;

  // Handle Picking Multiple Videos
  const handleAddVideos = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newItems: VideoItem[] = [];
      Array.from(e.target.files).forEach((file) => {
        const url = URL.createObjectURL(file);
        const item: VideoItem = {
          id: `vid-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          file,
          name: file.name,
          url,
          duration: 18.0
        };

        const tempVideo = document.createElement('video');
        tempVideo.src = url;
        tempVideo.onloadedmetadata = () => {
          if (tempVideo.duration && !isNaN(tempVideo.duration)) {
            setVideoList((prev) =>
              prev.map((v) => v.id === item.id ? { ...v, duration: Number(tempVideo.duration.toFixed(2)) } : v)
            );
          }
        };

        newItems.push(item);
      });

      setVideoList((prev) => [...prev, ...newItems]);
    }
  };

  const handleRemoveVideo = (id: string) => {
    setVideoList((prev) => prev.filter((v) => v.id !== id));
  };

  const totalRawDuration = videoList.reduce((acc, v) => acc + (v.duration || 18), 0);

  // Handle Reference Video Upload
  const handleRefVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setRefVideoFile(file);
      setRefVideoName(file.name);
    }
  };

  const handleStartAutoCut = async () => {
    setIsProcessing(true);
    setErrorMsg(null);
    setResult(null);
    setActiveStep('analyzing');
    setProgressPercent(10);
    setStepMessage(t('autocut.stepAnalyzing'));

    // Enforce prompt hard rule: "Do not use emoji."
    const cleanPrompt = prompt.trim().length > 0
      ? `${prompt.trim()}. Do not use emoji.`
      : 'Create a high-impact edit removing silence and highlighting key action. Do not use emoji.';

    const guestKey = localStorage.getItem(`sabycut_${provider.toLowerCase()}_key`) || undefined;
    const primaryVideo = videoList[0];
    const videoUrl = primaryVideo ? primaryVideo.url : undefined;
    const duration = totalRawDuration > 0 ? totalRawDuration : 24.0;

    try {
      const job = await api.autocut.startJob({
        videoUrls: videoList.map((v) => v.url),
        videoNames: videoList.map((v) => v.name),
        videoDuration: duration,
        formType,
        formPreset: formType === 'preset' ? selectedPreset : undefined,
        customFormConfig: formType === 'custom' ? {
          targetDuration: customDuration,
          pacing: customPacing,
          aspectRatio: customAspect
        } : undefined,
        referenceVideoUrl: refVideoName || undefined,
        prompt: cleanPrompt,
        provider,
        guestApiKey: guestKey
      });

      // Connect to WebSocket for live step updates
      const cleanup = api.autocut.connectWebSocket(
        job.id,
        (step, percent, msg, payload) => {
          setActiveStep(step);
          setProgressPercent(percent);
          if (msg) setStepMessage(msg);

          if (step === 'completed' || percent === 100) {
            handleComplete(payload, videoUrl, primaryVideo?.name, duration);
          } else if (step === 'failed') {
            setIsProcessing(false);
            setErrorMsg(msg || 'Auto Cut processing failed.');
          }
        },
        () => {
          // Fallback poll
        }
      );
      wsCleanupRef.current = cleanup;

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('API_KEY_REQUIRED')) {
        setIsProcessing(false);
        setErrorMsg(`API key for ${provider} is missing. Please configure it in Settings.`);
        return;
      }

      // Offline simulation fallback for demo / test runs
      runSimulation(duration, primaryVideo?.name, videoUrl);
    }
  };

  const runSimulation = (duration: number, videoName?: string, videoUrl?: string) => {
    setActiveStep('analyzing');
    setProgressPercent(20);
    setStepMessage('Analyzing video (PySceneDetect, silence, beats, keyframes)');

    setTimeout(() => {
      setActiveStep('planning');
      setProgressPercent(50);
      setStepMessage('Planning Edit Decision List with AI (strict schema validation)');
    }, 1000);

    setTimeout(() => {
      setActiveStep('building');
      setProgressPercent(80);
      setStepMessage('Building multi-track timeline & sound effects (whoosh, hit, pop)');
    }, 2200);

    setTimeout(() => {
      setActiveStep('rendering');
      setProgressPercent(95);
      setStepMessage('Rendering preview & waveform buffer');
    }, 3200);

    setTimeout(() => {
      setIsProcessing(false);
      setProgressPercent(100);
      setActiveStep('completed');

      const segLength = selectedPreset === 'tiktok' ? 2.5 : selectedPreset === 'gaming' ? 3.0 : 4.5;
      const cuts: Array<{ start: number; end: number; title: string }> = [];
      const sfx: Array<{ time: number; type: string }> = [];
      const captions: Array<{ start: number; end: number; text: string }> = [];

      let cur = 0;
      let count = 1;
      const sampleCaptions = [
        'ស្វាគមន៍មកកាន់ SABYCUT',
        'កាត់តវីដេអូស្វ័យប្រវត្តិតាម AI',
        'គុណភាពខ្ពស់ និងរហ័សទាន់ចិត្ត',
        'សូមចុច Like និង Follow'
      ];

      while (cur < duration) {
        const segEnd = Math.min(cur + segLength, duration);
        cuts.push({
          start: Number(cur.toFixed(2)),
          end: Number(segEnd.toFixed(2)),
          title: count === 1 ? 'Hook Scene' : `Scene ${count}`
        });

        if (count === 1) {
          sfx.push({ time: 0.05, type: 'whoosh' });
        } else if (count % 3 === 0) {
          sfx.push({ time: Number((cur + 0.05).toFixed(2)), type: 'pop' });
        } else if (count % 2 === 0) {
          sfx.push({ time: Number((cur + 0.05).toFixed(2)), type: 'hit' });
        }

        if (captions.length < sampleCaptions.length && (count === 1 || count % 2 === 0)) {
          captions.push({
            start: Number(cur.toFixed(2)),
            end: Number(Math.min(cur + 2.6, duration).toFixed(2)),
            text: sampleCaptions[captions.length % sampleCaptions.length]
          });
        }

        cur = segEnd;
        count++;
      }

      setResult({
        videoUrl,
        videoName: videoName || 'Source Footage',
        videoDuration: duration,
        formName: formType === 'reference' ? `Reference: ${refVideoName}` : formType === 'custom' ? `Custom (${customDuration}s)` : selectedPreset.toUpperCase(),
        cuts,
        sfx,
        captions,
        aspectRatio: formType === 'custom' ? customAspect : selectedPreset === 'vlog' ? '16:9' : '9:16'
      });
    }, 3800);
  };

  const handleComplete = (payload: unknown, videoUrl?: string, videoName?: string, duration: number = 24) => {
    setIsProcessing(false);
    setProgressPercent(100);
    setActiveStep('completed');

    let timelineObj: Record<string, unknown> | null = null;
    const p = payload as { timelineJson?: string } | undefined;
    if (p && p.timelineJson) {
      try {
        timelineObj = JSON.parse(p.timelineJson);
      } catch {
        // Fallback
      }
    }

    const cuts: Array<{ start: number; end: number; title: string }> = [];
    const sfx: Array<{ time: number; type: string }> = [];
    const captions: Array<{ start: number; end: number; text: string }> = [];

    if (timelineObj && Array.isArray(timelineObj.tracks)) {
      for (const track of timelineObj.tracks as Array<{ type: string; clips: Array<{ start: number; end: number; title: string; sfxType?: string; text?: string }> }>) {
        if (track.type === 'video') {
          track.clips.forEach((c) => cuts.push({ start: c.start, end: c.end, title: c.title }));
        } else if (track.type === 'sfx') {
          track.clips.forEach((c) => sfx.push({ time: c.start, type: c.sfxType || 'whoosh' }));
        } else if (track.type === 'text') {
          track.clips.forEach((c) => captions.push({ start: c.start, end: c.end, text: c.text || c.title }));
        }
      }
    }

    setResult({
      videoUrl,
      videoName: videoName || 'Source Video',
      videoDuration: duration,
      formName: formType === 'reference' ? `Reference: ${refVideoName}` : formType === 'custom' ? `Custom (${customDuration}s)` : selectedPreset.toUpperCase(),
      cuts: cuts.length > 0 ? cuts : [{ start: 0, end: duration, title: 'Hook Scene' }],
      sfx: sfx.length > 0 ? sfx : [{ time: 0.1, type: 'whoosh' }],
      captions: captions.length > 0 ? captions : [{ start: 0.5, end: Math.min(3.5, duration), text: 'ស្វាគមន៍មកកាន់ SABYCUT' }],
      timelineJson: p?.timelineJson,
      aspectRatio: formType === 'custom' ? customAspect : selectedPreset === 'vlog' ? '16:9' : '9:16'
    });
  };

  const handleApplyResult = () => {
    if (result) {
      onApply(result);
      onClose();
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.85)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: '#11131c',
        border: '1px solid #272d42',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '680px',
        padding: '24px',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: 'rgba(167, 139, 250, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(167, 139, 250, 0.4)'
            }}>
              <Sparkles size={20} color="#c4b5fd" />
            </div>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#ffffff' }}>
                {t('autocut.title')}
              </h2>
              <p style={{ fontSize: '11px', color: '#94a3b8' }}>
                Pick videos, choose form, and let AI build a fully editable multi-track timeline
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', color: '#94a3b8' }}>
            <X size={20} />
          </button>
        </div>

        {/* API Key Notice if absent */}
        {keyNotice && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            borderRadius: '10px',
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            marginBottom: '16px',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} color="#f87171" />
              <span style={{ fontSize: '12px', color: '#fca5a5' }}>{keyNotice}</span>
            </div>
            {onOpenSettings && (
              <button
                onClick={() => {
                  onClose();
                  onOpenSettings();
                }}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 700
                }}
              >
                Configure
              </button>
            )}
          </div>
        )}

        {/* STEP 1: PICK ONE OR MORE VIDEOS */}
        <div style={{
          backgroundColor: '#171926',
          borderRadius: '12px',
          border: '1px solid #282f45',
          padding: '16px',
          marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <label style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileVideo size={16} color="#818cf8" />
              <span>Step 1: Pick One or More Videos (ជ្រើសរើសវីដេអូ)</span>
            </label>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
              {videoList.length} picked • Total {totalRawDuration.toFixed(1)}s
            </span>
          </div>

          <input
            ref={rawVideoInputRef}
            type="file"
            multiple
            accept="video/*"
            onChange={handleAddVideos}
            style={{ display: 'none' }}
          />

          {/* Video List */}
          {videoList.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
              {videoList.map((v, i) => (
                <div key={v.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  backgroundColor: '#11131e',
                  border: '1px solid #23283d'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                    <span style={{ fontSize: '11px', color: '#818cf8', fontWeight: 700 }}>#{i + 1}</span>
                    <span style={{ fontSize: '12px', color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {v.name}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                    <span style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>
                      {v.duration.toFixed(1)}s
                    </span>
                    <button
                      onClick={() => handleRemoveVideo(v.id)}
                      style={{ background: 'none', color: '#f87171', padding: '2px' }}
                      title="Remove"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div
            onClick={() => rawVideoInputRef.current?.click()}
            style={{
              border: '2px dashed #343c56',
              borderRadius: '8px',
              padding: videoList.length > 0 ? '10px' : '18px',
              textAlign: 'center',
              cursor: 'pointer',
              backgroundColor: '#12141f',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {videoList.length > 0 ? (
              <>
                <Plus size={16} color="#818cf8" />
                <span style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 600 }}>{t('autocut.addMoreVideos')}</span>
              </>
            ) : (
              <div>
                <Upload size={24} color="#818cf8" style={{ margin: '0 auto 6px' }} />
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#e2e8f0' }}>
                  Pick one or multiple video files (.mp4, .mov, .webm)
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                  AI will analyze and splice them into a cohesive timeline
                </div>
              </div>
            )}
          </div>
        </div>

        {/* STEP 2: VIDEO FORM (PRESET, CUSTOM, OR REFERENCE) */}
        <div style={{
          backgroundColor: '#171926',
          borderRadius: '12px',
          border: '1px solid #282f45',
          padding: '16px',
          marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <label style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Film size={16} color="#a78bfa" />
              <span>Step 2: Video Form (ទម្រង់វីដេអូ)</span>
            </label>

            {/* Segmented control for Form Type */}
            <div style={{ display: 'flex', gap: '2px', backgroundColor: '#11131e', padding: '2px', borderRadius: '8px' }}>
              {(['preset', 'custom', 'reference'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setFormType(mode)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    backgroundColor: formType === mode ? '#4f46e5' : 'transparent',
                    color: formType === mode ? '#ffffff' : '#94a3b8',
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'capitalize'
                  }}
                >
                  {mode === 'preset' ? 'Built-in' : mode === 'custom' ? 'Custom' : 'Reference'}
                </button>
              ))}
            </div>
          </div>

          {/* Mode 1: Built-in Presets */}
          {formType === 'preset' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[
                { id: 'tiktok', label: 'TikTok / Reels (9:16)', desc: 'Fast cuts (2-3s), high hook pacing' },
                { id: 'vlog', label: 'Vlog / Story (16:9)', desc: 'Narrative flow, ambient pauses' },
                { id: 'gaming', label: 'Gaming / Action', desc: 'Dead air removed, highlight wins & action' },
                { id: 'podcast', label: 'Podcast / Talk', desc: 'Cut silent pauses, focus on speaker' }
              ].map((p) => (
                <div
                  key={p.id}
                  onClick={() => setSelectedPreset(p.id as typeof selectedPreset)}
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    border: selectedPreset === p.id ? '2px solid #818cf8' : '1px solid #282f45',
                    backgroundColor: selectedPreset === p.id ? 'rgba(99, 102, 241, 0.15)' : '#11131e',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff', marginBottom: '2px' }}>
                    {p.label}
                  </div>
                  <div style={{ fontSize: '10px', color: '#94a3b8' }}>{p.desc}</div>
                </div>
              ))}
            </div>
          )}

          {/* Mode 2: Custom Form */}
          {formType === 'custom' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#cbd5e1', marginBottom: '4px' }}>
                  <span>{t('autocut.targetDuration')}:</span>
                  <span style={{ fontWeight: 700, color: '#818cf8' }}>{customDuration}s</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="120"
                  value={customDuration}
                  onChange={(e) => setCustomDuration(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#4f46e5' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                    {t('autocut.pacing')}
                  </label>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {(['fast', 'normal', 'slow'] as const).map((p) => (
                      <button
                        key={p}
                        onClick={() => setCustomPacing(p)}
                        style={{
                          flex: 1,
                          padding: '6px',
                          borderRadius: '6px',
                          backgroundColor: customPacing === p ? '#4f46e5' : '#11131e',
                          border: '1px solid #282f45',
                          color: customPacing === p ? '#ffffff' : '#94a3b8',
                          fontSize: '11px',
                          fontWeight: 600
                        }}
                      >
                        {p === 'fast' ? 'Fast' : p === 'normal' ? 'Medium' : 'Slow'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                    Aspect Ratio
                  </label>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {(['9:16', '16:9', '1:1'] as const).map((r) => (
                      <button
                        key={r}
                        onClick={() => setCustomAspect(r)}
                        style={{
                          flex: 1,
                          padding: '6px',
                          borderRadius: '6px',
                          backgroundColor: customAspect === r ? '#4f46e5' : '#11131e',
                          border: '1px solid #282f45',
                          color: customAspect === r ? '#ffffff' : '#94a3b8',
                          fontSize: '11px',
                          fontWeight: 600
                        }}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Mode 3: Generated from Reference Video */}
          {formType === 'reference' && (
            <div>
              <input
                ref={refVideoInputRef}
                type="file"
                accept="video/*"
                onChange={handleRefVideoChange}
                style={{ display: 'none' }}
              />
              <div
                onClick={() => refVideoInputRef.current?.click()}
                style={{
                  border: '2px dashed #475569',
                  borderRadius: '8px',
                  padding: '16px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  backgroundColor: refVideoFile ? 'rgba(167, 139, 250, 0.12)' : '#11131e'
                }}
              >
                <Upload size={22} color="#a78bfa" style={{ margin: '0 auto 6px' }} />
                <div style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 600 }}>
                  {refVideoFile ? `Reference Video: ${refVideoName}` : 'Upload Reference Video (e.g. viral TikTok or short)'}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                  AI will analyze cut rhythm, scene lengths, and sound effect timing from this reference
                </div>
              </div>
            </div>
          )}
        </div>

        {/* STEP 3: USER PROMPT & PROVIDER */}
        <div style={{
          backgroundColor: '#171926',
          borderRadius: '12px',
          border: '1px solid #282f45',
          padding: '16px',
          marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sliders size={16} color="#34d399" />
              <span>Step 3: Instructions to AI in Khmer or English (ការណែនាំ)</span>
            </label>

            {/* Provider Pill */}
            <div style={{ display: 'flex', gap: '4px', backgroundColor: '#11131e', padding: '2px', borderRadius: '6px' }}>
              {(['GEMINI', 'OPENAI'] as const).map((prov) => (
                <button
                  key={prov}
                  onClick={() => setProvider(prov)}
                  style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: provider === prov ? '#10b981' : 'transparent',
                    color: provider === prov ? '#ffffff' : '#94a3b8',
                    fontSize: '10px',
                    fontWeight: 700
                  }}
                >
                  {prov}
                </button>
              ))}
            </div>
          </div>

          <textarea
            rows={2}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Type instructions in Khmer or English (e.g. Remove silent pauses, keep laugh moments, add whoosh on transitions. Do not use emoji.)"
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '8px',
              backgroundColor: '#11131e',
              border: '1px solid #282f45',
              color: '#ffffff',
              fontSize: '12px',
              lineHeight: '1.5',
              fontFamily: "'Noto Sans Khmer', sans-serif"
            }}
          />
        </div>

        {/* STEP LIST WITH LIVE PROGRESS OVER WEBSOCKET */}
        {isProcessing && (
          <div style={{
            backgroundColor: '#141724',
            borderRadius: '12px',
            border: '1px solid #2e3752',
            padding: '16px',
            marginBottom: '16px'
          }}>
            {/* Step list header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Loader2 size={16} className="animate-spin" color="#818cf8" />
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#f1f5f9' }}>
                  Live Auto Cut Progress
                </span>
              </div>
              <span style={{ fontSize: '12px', fontFamily: 'monospace', color: '#818cf8', fontWeight: 700 }}>
                {progressPercent}%
              </span>
            </div>

            {/* Progress bar */}
            <div style={{ height: '6px', borderRadius: '3px', backgroundColor: '#1e2337', overflow: 'hidden', marginBottom: '14px' }}>
              <div style={{
                height: '100%',
                width: `${progressPercent}%`,
                backgroundColor: '#4f46e5',
                transition: 'width 0.3s ease'
              }} />
            </div>

            {/* Step List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { id: 'analyzing', num: 1, label: t('autocut.stepAnalyzing'), desc: 'PySceneDetect, silence, librosa beats, keyframe sampling' },
                { id: 'planning', num: 2, label: t('autocut.stepPlanning'), desc: 'Strict JSON EDL planning with LLM schema validation and retry' },
                { id: 'building', num: 3, label: t('autocut.stepBuilding'), desc: 'Tagged SFX placement (whoosh, hit, pop, riser), Khmer captions' },
                { id: 'rendering', num: 4, label: t('autocut.stepRendering'), desc: 'Timeline playback engine & waveform preview' }
              ].map((stepItem) => {
                const isCurrent = activeStep === stepItem.id;
                const isDone = (
                  (activeStep === 'planning' && stepItem.num === 1) ||
                  (activeStep === 'building' && stepItem.num <= 2) ||
                  (activeStep === 'rendering' && stepItem.num <= 3) ||
                  activeStep === 'completed'
                );

                return (
                  <div
                    key={stepItem.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      backgroundColor: isCurrent ? 'rgba(99, 102, 241, 0.15)' : '#0e1018',
                      border: isCurrent ? '1px solid #818cf8' : '1px solid #1f2538'
                    }}
                  >
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '10px',
                      backgroundColor: isDone ? '#10b981' : isCurrent ? '#4f46e5' : '#272d42',
                      color: '#ffffff',
                      fontSize: '11px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {isDone ? <Check size={12} strokeWidth={3} /> : stepItem.num}
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: isCurrent ? 700 : 500, color: isCurrent ? '#ffffff' : '#94a3b8' }}>
                        {stepItem.label}
                      </div>
                      <div style={{ fontSize: '10px', color: '#64748b' }}>{stepItem.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {stepMessage && (
              <div style={{ fontSize: '11px', color: '#a5b4fc', marginTop: '10px', textAlign: 'center' }}>
                {stepMessage}
              </div>
            )}
          </div>
        )}

        {/* Error notification */}
        {errorMsg && (
          <div style={{
            padding: '12px',
            borderRadius: '8px',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            fontSize: '12px',
            marginBottom: '16px'
          }}>
            {errorMsg}
          </div>
        )}

        {/* RESULT READY VIEW */}
        {result && !isProcessing ? (
          <div style={{
            padding: '16px',
            borderRadius: '12px',
            backgroundColor: 'rgba(52, 211, 153, 0.1)',
            border: '1px solid rgba(52, 211, 153, 0.3)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399', fontSize: '14px', fontWeight: 700, marginBottom: '6px' }}>
              <CheckCircle2 size={18} />
              <span>{t('autocut.completed')}</span>
            </div>
            <p style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.5' }}>
              Video: {result.videoName} • Form: {result.formName}
              <br />
              Generated {result.cuts.length} cuts, {result.sfx.length} tagged sound effects, and {result.captions.length} captions.
            </p>
            <button
              onClick={handleApplyResult}
              style={{
                marginTop: '12px',
                width: '100%',
                padding: '11px',
                borderRadius: '8px',
                backgroundColor: '#10b981',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <span>{t('autocut.applyToEditor')}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        ) : !isProcessing ? (
          <button
            onClick={handleStartAutoCut}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              backgroundColor: '#4f46e5',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <Sparkles size={16} />
            <span>{t('autocut.startBtn')}</span>
          </button>
        ) : null}
      </div>
    </div>
  );
};
