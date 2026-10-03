import { useEffect, useRef, useState } from 'react';
import { X, Camera, CameraOff, Upload, Keyboard, Zap, ZoomIn, ZoomOut } from 'lucide-react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { DecodeHintType, BarcodeFormat } from '@zxing/library';
import { useUIStore } from '@/stores/uiStore';
import { useCartStore } from '@/stores/cartStore';
import { useProducts } from '@/hooks/useProducts';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import type { ApiProduct } from '@/types';
import { toProduct } from '@/lib/mappers';

type Mode = 'camera' | 'manual';

function beep() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 1200;
    gain.gain.value = 0.08;
    osc.start();
    setTimeout(() => { osc.stop(); ctx.close(); }, 80);
  } catch {}
}

export function ScannerModal() {
  const setScannerOpen = useUIStore((s) => s.setScannerOpen);
  const add = useCartStore((s) => s.add);
  const { data: products } = useProducts();

  const [mode, setMode] = useState<Mode>('camera');
  const [error, setError] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [hint, setHint] = useState('Align the barcode inside the frame');
  const [zoom, setZoom] = useState(1);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const mountedRef = useRef(true);

  // Immediate dedup via ref
  const lastScanRef = useRef<{ code: string; at: number } | null>(null);
  const lookupInFlightRef = useRef(false);

  const lookupAndAdd = async (code: string): Promise<boolean> => {
    if (lookupInFlightRef.current) {
      console.log('[scan] Lookup already in flight — skipping');
      return false;
    }
    lookupInFlightRef.current = true;

    console.log('[scan] code received:', JSON.stringify(code), 'length:', code.length);
    const url = `/api/products/scan/${encodeURIComponent(code)}`;
    console.log('[scan] calling:', url);

    try {
      const { data } = await api.get<ApiProduct>(url);
      console.log('[scan] backend returned:', data);
      const product = toProduct(data);
      add(product);
      beep();
      if (navigator.vibrate) navigator.vibrate(80);
      toast.success(`${product.name} added`, { duration: 800 });
      setScannerOpen(false);
      return true;
    } catch (e: any) {
      console.error('[scan] backend error:', e?.response?.status, e?.response?.data);
      if (e?.response?.status === 404) {
        const local = (products || []).find(
          (p) => p.barcode === code || p.qr_code === code
        );
        console.log('[scan] local match:', local ? local.name : 'NONE');
        if (local) {
          add(local);
          beep();
          if (navigator.vibrate) navigator.vibrate(80);
          toast.success(`${local.name} added`, { duration: 800 });
          setScannerOpen(false);
          return true;
        }
        toast.error(`Not found: ${code}`, { duration: 1500 });
        return false;
      }
      toast.error('Lookup failed');
      return false;
    } finally {
      lookupInFlightRef.current = false;
    }
  };

  useEffect(() => {
    if (mode !== 'camera') return;

    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.CODE_128,
      BarcodeFormat.CODE_39,
      BarcodeFormat.ITF,
      BarcodeFormat.CODE_93,
      BarcodeFormat.QR_CODE,
    ]);
    hints.set(DecodeHintType.TRY_HARDER, true);
    // Note: ALSO_INVERTED removed — not supported in this @zxing/library version

    const reader = new BrowserMultiFormatReader(hints);
    mountedRef.current = true;

    let hintTimer: any;

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            // @ts-expect-error
            focusMode: 'continuous',
          },
          audio: false,
        });

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        // ZXing's own continuous scan loop — handles requestAnimationFrame internally
        const controls = await reader.decodeFromVideoElement(
          videoRef.current!,
          (result, err) => {
            if (!mountedRef.current) return;
            if (!result) return; // no code in this frame — normal

            const text = result.getText();
            const now = Date.now();

            // ── Immediate dedup via ref ──
            if (
              lastScanRef.current &&
              lastScanRef.current.code === text &&
              now - lastScanRef.current.at < 2000
            ) {
              return; // ignore duplicate
            }
            lastScanRef.current = { code: text, at: now };

            setHint('Scanning...');
            lookupAndAdd(text);
          }
        );
        controlsRef.current = controls;

        // Focus lock after 1s
        setTimeout(async () => {
          const track = stream.getVideoTracks()[0];
          try {
            const caps = track.getCapabilities() as any;
            if (caps.focusMode?.includes('continuous')) {
              await track.applyConstraints({
                // @ts-expect-error
                advanced: [{ focusMode: 'continuous' }]
              });
            }
          } catch {}
        }, 1000);

        hintTimer = setTimeout(() => {
          if (mountedRef.current) {
            setHint('Try moving closer, add light, or toggle the torch');
          }
        }, 6000);
      } catch (e: any) {
        setError(e?.message ?? 'Camera access denied');
      }
    })();

    return () => {
      mountedRef.current = false;
      clearTimeout(hintTimer);
      try { controlsRef.current?.stop(); } catch {}
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    try {
      await track.applyConstraints({
        // @ts-expect-error
        advanced: [{ torch: !torchOn }],
      });
      setTorchOn(!torchOn);
    } catch {
      toast.error('Torch not supported');
    }
  };

  const applyZoom = async (z: number) => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    try {
      await track.applyConstraints({
        // @ts-expect-error
        advanced: [{ zoom: z }]
      });
      setZoom(z);
    } catch {
      toast.error('Zoom not supported on this device');
    }
  };

  const handleImageUpload = async (file: File) => {
    const url = URL.createObjectURL(file);
    try {
      const reader = new BrowserMultiFormatReader();
      const result = await reader.decodeFromImageUrl(url);
      await lookupAndAdd(result.getText());
    } catch {
      toast.error('No code found in image');
    } finally {
      URL.revokeObjectURL(url);
    }
  };

  const handleManualSubmit = () => {
    if (!manualCode.trim()) return;
    lookupAndAdd(manualCode.trim());
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="flex items-center justify-between p-4 text-white shrink-0">
        <div className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          <span className="font-medium">
            {mode === 'camera' ? 'Scan Barcode / QR' : 'Enter Code'}
          </span>
        </div>
        <button
          onClick={() => setScannerOpen(false)}
          className="p-2 rounded-lg hover:bg-white/10"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {mode === 'camera' ? (
        <div className="flex-1 relative overflow-hidden">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
          />

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-72 h-0.5 bg-red-500 shadow-[0_0_20px_4px_rgba(239,68,68,0.7)] animate-pulse" />
          </div>

          {!error && (
            <p className="absolute bottom-40 left-0 right-0 text-center text-white text-sm px-4 drop-shadow-lg">
              {hint}
            </p>
          )}

          {!error && (
            <div className="absolute bottom-24 left-0 right-0 flex justify-center gap-3">
              <button
                onClick={() => applyZoom(Math.max(1, zoom - 0.5))}
                className="w-10 h-10 rounded-full bg-black/50 backdrop-blur text-white flex items-center justify-center"
              >
                <ZoomOut className="h-5 w-5" />
              </button>
              <div className="px-3 h-10 rounded-full bg-black/50 backdrop-blur text-white flex items-center text-sm tabular-nums">
                {zoom.toFixed(1)}×
              </div>
              <button
                onClick={() => applyZoom(Math.min(3, zoom + 0.5))}
                className="w-10 h-10 rounded-full bg-black/50 backdrop-blur text-white flex items-center justify-center"
              >
                <ZoomIn className="h-5 w-5" />
              </button>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white p-6 text-center">
              <div>
                <CameraOff className="h-12 w-12 mx-auto mb-3 text-red-400" />
                <p className="mb-2 font-medium">⚠️ {error}</p>
                <p className="text-sm text-white/70 mb-4">
                  Allow camera access, or use manual entry.
                </p>
                <Button variant="secondary" onClick={() => setMode('manual')}>
                  <Keyboard className="h-4 w-4 mr-2" />
                  Manual Entry
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-white">
          <Keyboard className="h-16 w-16 mb-4 text-white/40" />
          <p className="text-sm text-white/70 mb-6 text-center max-w-xs">
            Type the barcode or QR code manually
          </p>
          <input
            type="text"
            inputMode="numeric"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
            placeholder="e.g., 4801234567890"
            autoFocus
            className="w-full max-w-sm h-14 px-4 rounded-lg bg-white/10 border border-white/20 text-white text-center text-lg tracking-wider focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <Button
            onClick={handleManualSubmit}
            disabled={!manualCode.trim()}
            className="mt-4 w-full max-w-sm h-12"
          >
            Add to Cart
          </Button>
        </div>
      )}

      <div className="p-4 flex justify-around items-center text-white shrink-0 border-t border-white/10">
        {mode === 'camera' ? (
          <>
            <button onClick={toggleTorch} className="flex flex-col items-center gap-1 p-3">
              <Zap className={`h-6 w-6 ${torchOn ? 'text-yellow-400' : ''}`} />
              <span className="text-xs">Torch</span>
            </button>

            <label className="flex flex-col items-center gap-1 p-3 cursor-pointer">
              <Upload className="h-6 w-6" />
              <span className="text-xs">Upload</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file);
                }}
              />
            </label>

            <button
              onClick={() => setMode('manual')}
              className="flex flex-col items-center gap-1 p-3"
            >
              <Keyboard className="h-6 w-6" />
              <span className="text-xs">Manual</span>
            </button>
          </>
        ) : (
          <button
            onClick={() => setMode('camera')}
            className="flex flex-col items-center gap-1 p-3"
          >
            <Camera className="h-6 w-6" />
            <span className="text-xs">Back to Camera</span>
          </button>
        )}
      </div>
    </div>
  );
}