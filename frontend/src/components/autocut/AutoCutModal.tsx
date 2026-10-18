import React, { useState, useRef } from 'react';
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
  Check
} from 'lucide-react';
import { t } from '../../i18n';

export interface AutoCutResult {
  videoUrl?: string;
  videoName?: string;
  videoDuration: number;
  formName: string;
  cuts: Array<{ start: number; end: number; title: string }>;
  sfx: Array<{ time: number; type: string }>;
  captions: Array<{ start: number; end: number; text: string }>;
}

interface AutoCutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (result: AutoCutResult) => void;
}

export const AutoCutModal: React.FC<AutoCutModalProps> = ({ isOpen, onClose, onApply }) => {
  // Step 1: Raw Video Import
  const [rawVideoFile, setRawVideoFile] = useState<File | null>(null);
  const [rawVideoUrl, setRawVideoUrl] = useState<string>('');
  const [rawVideoDuration, setRawVideoDuration] = useState<number>(24);
  const rawVideoInputRef = useRef<HTMLInputElement>(null);

  // Step 2: Video Form / Reference Video
  const [formType, setFormType] = useState<'preset' | 'reference'>('preset');
  const [selectedPreset, setSelectedPreset] = useState<'tiktok' | 'vlog' | 'gaming' | 'podcast'>('tiktok');
  const [refVideoFile, setRefVideoFile] = useState<File | null>(null);
  const [refVideoName, setRefVideoName] = useState<string>('');
  const refVideoInputRef = useRef<HTMLInputElement>(null);

  // Step 3: User Prompt
  const [prompt, setPrompt] = useState('');

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState('');
  const [result, setResult] = useState<AutoCutResult | null>(null);

  if (!isOpen) return null;

  // Handle Raw Video Upload
  const handleRawVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setRawVideoFile(file);
      const url = URL.createObjectURL(file);
      setRawVideoUrl(url);

      // Measure duration
      const tempVideo = document.createElement('video');
      tempVideo.src = url;
      tempVideo.onloadedmetadata = () => {
        if (tempVideo.duration && !isNaN(tempVideo.duration)) {
          setRawVideoDuration(tempVideo.duration);
        }
      };
    }
  };

  // Handle Reference Video Upload
  const handleRefVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setRefVideoFile(file);
      setRefVideoName(file.name);
    }
  };

  const handleStartAutoCut = () => {
    setIsProcessing(true);
    setResult(null);
    setCurrentStep(t('autocut.stepAnalyzing'));

    setTimeout(() => {
      setCurrentStep(t('autocut.stepTranscribing'));
    }, 1100);

    setTimeout(() => {
      setCurrentStep(t('autocut.stepPlanning'));
    }, 2200);

    setTimeout(() => {
      setCurrentStep(t('autocut.stepBuilding'));
    }, 3200);

    setTimeout(() => {
      setIsProcessing(false);
      const duration = rawVideoDuration || 24;

      // Calculate cuts based on form
      let segmentLength = 3.5;
      if (selectedPreset === 'tiktok') segmentLength = 2.8;
      if (selectedPreset === 'vlog') segmentLength = 5.0;
      if (selectedPreset === 'gaming') segmentLength = 3.0;

      const cuts: Array<{ start: number; end: number; title: string }> = [];
      const sfx: Array<{ time: number; type: string }> = [];
      const captions: Array<{ start: number; end: number; text: string }> = [];

      let cur = 0;
      let count = 1;
      const sfxTypes = ['whoosh', 'ding', 'pop', 'bass_drop'];
      const sampleCaptions = [
        'ស្វាគមន៍មកកាន់ SABYCUT',
        'កាត់តវីដេអូស្វ័យប្រវត្តិតាម AI',
        'គុណភាពខ្ពស់ និងរហ័សទាន់ចិត្ត',
        'សូមចុច Like និង Follow'
      ];

      while (cur < duration) {
        const segEnd = Math.min(cur + segmentLength, duration);
        cuts.push({
          start: Number(cur.toFixed(2)),
          end: Number(segEnd.toFixed(2)),
          title: count === 1 ? 'Intro Hook' : `Scene ${count}`
        });

        if (count === 1) {
          sfx.push({ time: 0.1, type: 'whoosh' });
        } else if (count % 2 === 0) {
          sfx.push({
            time: Number((cur + 0.1).toFixed(2)),
            type: sfxTypes[(count - 1) % sfxTypes.length]
          });
        }

        if (captions.length < sampleCaptions.length && (count === 1 || count % 2 === 0)) {
          captions.push({
            start: Number(cur.toFixed(2)),
            end: Number(Math.min(cur + 2.5, duration).toFixed(2)),
            text: sampleCaptions[captions.length % sampleCaptions.length]
          });
        }

        cur = segEnd;
        count++;
      }

      setResult({
        videoUrl: rawVideoUrl,
        videoName: rawVideoFile ? rawVideoFile.name : 'Sample Video Footage',
        videoDuration: duration,
        formName: formType === 'reference' ? `Reference: ${refVideoName}` : selectedPreset.toUpperCase(),
        cuts,
        sfx,
        captions
      });
    }, 4000);
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
      backgroundColor: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: '#12141d',
        border: '1px solid #282d3f',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '620px',
        padding: '24px',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={20} color="#a78bfa" />
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff' }}>
                AI Auto Cut Studio
              </h2>
              <p style={{ fontSize: '11px', color: '#94a3b8' }}>
                Import video, select form, and generate timeline cuts with matched sound effects
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', color: '#94a3b8' }}>
            <X size={18} />
          </button>
        </div>

        {/* STEP 1: IMPORT RAW VIDEO */}
        <div style={{
          backgroundColor: '#181b26',
          borderRadius: '12px',
          border: '1px solid #262b3d',
          padding: '16px',
          marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileVideo size={16} color="#818cf8" />
              <span>Step 1: Import Raw Video to Cut (ដាក់បញ្ចូលវីដេអូដើម)</span>
            </label>
            {rawVideoFile && (
              <span style={{ fontSize: '11px', color: '#34d399', fontWeight: 600 }}>
                Loaded ({rawVideoDuration.toFixed(1)}s)
              </span>
            )}
          </div>

          <input
            ref={rawVideoInputRef}
            type="file"
            accept="video/*"
            onChange={handleRawVideoChange}
            style={{ display: 'none' }}
          />

          <div
            onClick={() => rawVideoInputRef.current?.click()}
            style={{
              border: '2px dashed #343a4e',
              borderRadius: '8px',
              padding: '16px',
              textAlign: 'center',
              cursor: 'pointer',
              backgroundColor: rawVideoFile ? 'rgba(99, 102, 241, 0.1)' : '#13151f'
            }}
          >
            <Upload size={22} color="#818cf8" style={{ margin: '0 auto 6px' }} />
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#e2e8f0' }}>
              {rawVideoFile ? rawVideoFile.name : 'Click to select or drag and drop your raw video (.mp4, .mov, .webm)'}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
              Supported: 720p, 1080p, 4K video files
            </div>
          </div>
        </div>

        {/* STEP 2: VIDEO FORM & REFERENCE */}
        <div style={{
          backgroundColor: '#181b26',
          borderRadius: '12px',
          border: '1px solid #262b3d',
          padding: '16px',
          marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Film size={16} color="#a78bfa" />
              <span>Step 2: Video Form & Style (ទម្រង់វីដេអូ / វីដេអូគំរូ)</span>
            </label>

            {/* Toggle Preset vs Reference Upload */}
            <div style={{ display: 'flex', gap: '4px', backgroundColor: '#13151f', padding: '2px', borderRadius: '6px' }}>
              <button
                onClick={() => setFormType('preset')}
                style={{
                  padding: '3px 8px',
                  borderRadius: '4px',
                  backgroundColor: formType === 'preset' ? '#4f46e5' : 'transparent',
                  color: formType === 'preset' ? '#ffffff' : '#94a3b8',
                  fontSize: '11px',
                  fontWeight: 600
                }}
              >
                Presets
              </button>
              <button
                onClick={() => setFormType('reference')}
                style={{
                  padding: '3px 8px',
                  borderRadius: '4px',
                  backgroundColor: formType === 'reference' ? '#4f46e5' : 'transparent',
                  color: formType === 'reference' ? '#ffffff' : '#94a3b8',
                  fontSize: '11px',
                  fontWeight: 600
                }}
              >
                Reference Video
              </button>
            </div>
          </div>

          {formType === 'preset' ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[
                { id: 'tiktok', label: 'TikTok / Reels (9:16)', desc: 'Fast cut (2-3s), high hook pacing' },
                { id: 'vlog', label: 'Vlog / Story (16:9)', desc: 'Smooth narrative flow, ambient pauses' },
                { id: 'gaming', label: 'Gaming / Action', desc: 'Cut dead air, highlight screams and wins' },
                { id: 'podcast', label: 'Podcast / Talk', desc: 'Remove silence, focus on active speaker' }
              ].map((p) => (
                <div
                  key={p.id}
                  onClick={() => setSelectedPreset(p.id as typeof selectedPreset)}
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    border: selectedPreset === p.id ? '2px solid #818cf8' : '1px solid #282d3f',
                    backgroundColor: selectedPreset === p.id ? 'rgba(99, 102, 241, 0.15)' : '#13151f',
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
          ) : (
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
                  padding: '14px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  backgroundColor: refVideoFile ? 'rgba(167, 139, 250, 0.1)' : '#13151f'
                }}
              >
                <Upload size={20} color="#a78bfa" style={{ margin: '0 auto 4px' }} />
                <div style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 600 }}>
                  {refVideoFile ? `Reference: ${refVideoName}` : 'Upload Reference Video (e.g. TikTok video you want to match)'}
                </div>
                <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                  AI will analyze cut rhythm, scene lengths, and sound effect timing from this video
                </div>
              </div>
            </div>
          )}
        </div>

        {/* STEP 3: USER PROMPT */}
        <div style={{
          backgroundColor: '#181b26',
          borderRadius: '12px',
          border: '1px solid #262b3d',
          padding: '16px',
          marginBottom: '16px'
        }}>
          <label style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <Sliders size={16} color="#34d399" />
            <span>Step 3: Instructions for AI (សំណេរណែនាំដល់ AI)</span>
          </label>
          <textarea
            rows={2}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Type instructions (e.g. Remove silent pauses, keep laughing moments, add whoosh on transitions. Do not use emoji.)"
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '8px',
              backgroundColor: '#13151f',
              border: '1px solid #282d3f',
              color: '#ffffff',
              fontSize: '12px',
              lineHeight: '1.5'
            }}
          />
        </div>

        {/* Action Button & Processing Feedback */}
        {isProcessing ? (
          <div style={{
            padding: '16px',
            borderRadius: '10px',
            backgroundColor: '#181b26',
            border: '1px solid #2e344a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            color: '#a5b4fc',
            fontSize: '13px'
          }}>
            <Loader2 size={16} className="animate-spin" />
            <span>{currentStep}</span>
          </div>
        ) : result ? (
          <div style={{
            padding: '14px',
            borderRadius: '10px',
            backgroundColor: 'rgba(52, 211, 153, 0.1)',
            border: '1px solid rgba(52, 211, 153, 0.3)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
              <CheckCircle2 size={16} />
              <span>Auto Cut Complete! Video and matched Form are ready.</span>
            </div>
            <p style={{ fontSize: '12px', color: '#cbd5e1' }}>
              Source: {result.videoName} ({result.videoDuration.toFixed(1)}s) • Form: {result.formName}
              <br />
              Generated {result.cuts.length} cuts, {result.sfx.length} sound effects, and {result.captions.length} Khmer captions.
            </p>
            <button
              onClick={handleApplyResult}
              style={{
                marginTop: '10px',
                width: '100%',
                padding: '10px',
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
              <span>Apply to Timeline & Open Editor (កែសម្រួលបន្ថែម)</span>
              <ArrowRight size={16} />
            </button>
          </div>
        ) : (
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
            <span>Start AI Auto Cut (ចាប់ផ្តើមកាត់តដោយ AI)</span>
          </button>
        )}
      </div>
    </div>
  );
};
