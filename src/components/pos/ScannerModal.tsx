import { useEffect, useRef, useState, useCallback } from 'react';
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
import { cn } from '@/lib/utils';

type Mode = 'camera' | 'manual';

function beep() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 1250;
    gain.gain.value = 0.1;
    osc.start();
    setTimeout(() => {
      osc.stop();
      ctx.close();
    }, 70);
  } catch {}
}

interface ScannerProps {
  open: boolean;
  onClose: () => void;
  onScan: (code: string) => void | Promise<void>;
  title?: string;
}

export function Scanner({ open, onClose, onScan, title = 'Scan Barcode' }: ScannerProps) {
  const [mode, setMode] = useState<Mode>('camera');
  const [error, setError] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [hint, setHint] = useState('Center barcode within frame');
  const [zoom, setZoom] = useState(1);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const mountedRef = useRef(true);
  const lastScanRef = useRef<{ code: string; at: number } | null>(null);

  const stopTracks = useCallback(() => {
    try {
      controlsRef.current?.stop();
    } catch {}
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => {
        t.stop();
        t.enabled = false;
      });
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!open || mode !== 'camera') {
      stopTracks();
      return;
    }

    mountedRef.current = true;
    setError(null);

    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.CODE_128,
      BarcodeFormat.CODE_39,
      BarcodeFormat.QR_CODE,
    ]);
    hints.set(DecodeHintType.TRY_HARDER, true);

    const reader = new BrowserMultiFormatReader(hints);
    let hintTimer: any;

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        if (!mountedRef.current) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        const controls = await reader.decodeFromVideoElement(
          videoRef.current!,
          (result) => {
            if (!mountedRef.current || !result) return;
            const text = result.getText().trim();
            const now = Date.now();

            if (
              lastScanRef.current &&
              lastScanRef.current.code === text &&
              now - lastScanRef.current.at < 2000
            ) {
              return;
            }

            lastScanRef.current = { code: text, at: now };
            beep();
            if (navigator.vibrate) navigator.vibrate(80);
            onScan(text);
          }
        );
        controlsRef.current = controls;

        hintTimer = setTimeout(() => {
          if (mountedRef.current) setHint('Move closer or tap Torch in low light');
        }, 5000);
      } catch (e: any) {
        if (mountedRef.current) {
          setError(e?.name === 'NotAllowedError' ? 'Camera permission was denied' : 'Camera unavailable');
        }
      }
    })();

    return () => {
      mountedRef.current = false;
      clearTimeout(hintTimer);
      stopTracks();
    };
  }, [open, mode, stopTracks, onScan]);

  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    try {
      // @ts-expect-error Torch constraint
      await track.applyConstraints({ advanced: [{ torch: !torchOn }] });
      setTorchOn(!torchOn);
    } catch {
      toast.error('Flashlight not supported on this device');
    }
  };

  const applyZoom = async (val: number) => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    try {
      // @ts-expect-error Zoom constraint
      await track.applyConstraints({ advanced: [{ zoom: val }] });
      setZoom(val);
    } catch {
      toast.error('Hardware zoom not supported');
    }
  };

  const handleImageUpload = async (file: File) => {
    const url = URL.createObjectURL(file);
    try {
      const reader = new BrowserMultiFormatReader();
      const result = await reader.decodeFromImageUrl(url);
      beep();
      onScan(result.getText());
    } catch {
      toast.error('No readable barcode found in photo');
    } finally {
      URL.revokeObjectURL(url);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/40 backdrop-blur-md text-white z-10">
        <div className="flex items-center gap-2">
          <Camera className="h-5 w-5 text-primary" />
          <span className="font-semibold text-sm">{title}</span>
        </div>
        <button
          type="button"
          onClick={() => {
            stopTracks();
            onClose();
          }}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 active:scale-90"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {mode === 'camera' ? (
        <div className="flex-1 relative overflow-hidden flex items-center justify-center">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
          />

          {/* Scanner Reticle Frame */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-6">
            <div className="relative w-64 h-48 border-2 border-white/60 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
              {/* Corner Accents */}
              <div className="absolute -top-0.5 -left-0.5 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-xl" />
              <div className="absolute -top-0.5 -right-0.5 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-xl" />
              <div className="absolute -bottom-0.5 -left-0.5 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-xl" />
              <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-xl" />

              {/* Red Target Laser Line */}
              <div className="absolute left-2 right-2 top-1/2 -translate-y-1/2 h-0.5 bg-red-500 shadow-[0_0_12px_2px_rgba(239,68,68,0.9)] animate-pulse" />
            </div>

            <p className="text-white/90 text-xs font-medium mt-6 text-center drop-shadow-md">
              {hint}
            </p>
          </div>

          {/* Zoom Controls */}
          {!error && (
            <div className="absolute bottom-6 left-0 right-0 flex justify-center items-center gap-3 z-10">
              <button
                type="button"
                onClick={() => applyZoom(Math.max(1, zoom - 0.5))}
                className="w-10 h-10 rounded-full bg-black/60 text-white flex items-center justify-center active:scale-90"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <div className="px-3 h-8 rounded-full bg-black/60 text-white text-xs flex items-center font-mono">
                {zoom.toFixed(1)}×
              </div>
              <button
                type="button"
                onClick={() => applyZoom(Math.min(3, zoom + 0.5))}
                className="w-10 h-10 rounded-full bg-black/60 text-white flex items-center justify-center active:scale-90"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/90 text-white p-6 text-center z-20">
              <div className="max-w-xs space-y-3">
                <CameraOff className="h-10 w-10 mx-auto text-destructive" />
                <p className="text-sm font-medium">{error}</p>
                <Button variant="secondary" onClick={() => setMode('manual')} className="w-full">
                  Enter Code Manually
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Manual Key-in Fallback */
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-white">
          <div className="w-full max-w-xs space-y-4 text-center">
            <Keyboard className="h-12 w-12 mx-auto text-white/50" />
            <h3 className="font-semibold text-base">Manual Barcode Entry</h3>
            <input
              type="text"
              inputMode="numeric"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && manualCode.trim() && onScan(manualCode.trim())}
              placeholder="Barcode digits"
              autoFocus
              className="w-full h-13 px-4 rounded-xl bg-white/10 border border-white/20 text-white text-center text-lg font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Button
              onClick={() => manualCode.trim() && onScan(manualCode.trim())}
              disabled={!manualCode.trim()}
              className="w-full h-12 text-sm font-bold"
            >
              Confirm Code
            </Button>
          </div>
        </div>
      )}

      {/* Bottom Tool Bar */}
      <div className="p-3 pb-[max(1rem,env(safe-area-inset-bottom))] flex justify-around items-center bg-black/60 backdrop-blur-md text-white border-t border-white/10 z-10">
        {mode === 'camera' ? (
          <>
            <button
              type="button"
              onClick={toggleTorch}
              className="flex flex-col items-center gap-1 p-2 active:scale-90"
            >
              <Zap className={cn('h-5 w-5', torchOn ? 'text-yellow-400 fill-yellow-400' : 'text-white')} />
              <span className="text-[10px]">Flash</span>
            </button>
            <label className="flex flex-col items-center gap-1 p-2 cursor-pointer active:scale-90">
              <Upload className="h-5 w-5 text-white" />
              <span className="text-[10px]">Upload</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleImageUpload(f);
                }}
              />
            </label>
            <button
              type="button"
              onClick={() => {
                stopTracks();
                setMode('manual');
              }}
              className="flex flex-col items-center gap-1 p-2 active:scale-90"
            >
              <Keyboard className="h-5 w-5 text-white" />
              <span className="text-[10px]">Manual</span>
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setMode('camera')}
            className="flex items-center gap-2 py-2 px-4 rounded-xl bg-white/10 active:scale-95 text-xs font-semibold"
          >
            <Camera className="h-4 w-4" />
            Back to Camera
          </button>
        )}
      </div>
    </div>
  );
}

export function ScannerModal() {
  const setScannerOpen = useUIStore((s) => s.setScannerOpen);
  const scannerOpen = useUIStore((s) => s.scannerOpen);
  const add = useCartStore((s) => s.add);
  const { data: products } = useProducts();
  const lookupInFlightRef = useRef(false);

  const handleScan = async (code: string) => {
    if (lookupInFlightRef.current) return;
    lookupInFlightRef.current = true;
    try {
      const { data } = await api.get<ApiProduct>(`/api/products/scan/${encodeURIComponent(code)}`);
      const product = toProduct(data);
      add(product);
      toast.success(`${product.name} added`, { duration: 800 });
      setScannerOpen(false);
    } catch (e: any) {
      if (e?.response?.status === 404) {
        const local = (products || []).find((p) => p.barcode === code || p.qr_code === code);
        if (local) {
          add(local);
          toast.success(`${local.name} added`, { duration: 800 });
          setScannerOpen(false);
        } else {
          toast.error(`Not found: ${code}`, { duration: 1500 });
        }
      } else {
        toast.error('Lookup failed');
      }
    } finally {
      lookupInFlightRef.current = false;
    }
  };

  return (
    <Scanner
      open={scannerOpen}
      onClose={() => setScannerOpen(false)}
      onScan={handleScan}
      title="Scan Barcode to Add"
    />
  );
}