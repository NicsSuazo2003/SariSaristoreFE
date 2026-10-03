import { useEffect, useRef, useState } from 'react';
import { X, Camera, CameraOff, Upload, Keyboard, Zap } from 'lucide-react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { DecodeHintType, BarcodeFormat } from '@zxing/library';
import { useUIStore } from '@/stores/uiStore';
import { useCartStore } from '@/stores/cartStore';
import { useProducts } from '@/hooks/useProducts';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import type { ApiProduct, Product } from '@/types';
import { toProduct } from '@/lib/mappers';

type Mode = 'camera' | 'manual';

export function ScannerModal() {
  const setScannerOpen = useUIStore((s) => s.setScannerOpen);
  const add = useCartStore((s) => s.add);
  const { data: products } = useProducts();

  const [mode, setMode] = useState<Mode>('camera');
  const [error, setError] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [lastScan, setLastScan] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<any>(null);
  const mountedRef = useRef(true);

  // Lookup product by code (barcode OR qr) — hits backend so offline cache doesn't block
  const lookupAndAdd = async (code: string) => {
    try {
      // Try backend scan first (handles barcode + QR)
      const { data } = await api.get<ApiProduct>(`/api/products/scan/${encodeURIComponent(code)}`);
      const product = toProduct(data);
      add(product);
      if (navigator.vibrate) navigator.vibrate(80);
      toast.success(`${product.name} added`, { duration: 1000 });
      setScannerOpen(false);
      return true;
    } catch (e: any) {
      if (e?.response?.status === 404) {
        // Fallback: check local cache
        const local = (products || []).find((p) => p.barcode === code || p.qr_code === code);
        if (local) {
          add(local);
          if (navigator.vibrate) navigator.vibrate(80);
          toast.success(`${local.name} added`, { duration: 1000 });
          setScannerOpen(false);
          return true;
        }
        toast.error(`No product with code ${code}`);
        return false;
      }
      toast.error('Lookup failed');
      return false;
    }
  };

  // Start camera
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
      BarcodeFormat.QR_CODE,
    ]);
    hints.set(DecodeHintType.TRY_HARDER, true);

    const reader = new BrowserMultiFormatReader(hints);
    mountedRef.current = true;

    (async () => {
      try {
        const controls = await reader.decodeFromConstraints(
          {
            video: {
              facingMode: { ideal: 'environment' },
              width: { ideal: 1280 },
              height: { ideal: 720 },
              // @ts-expect-error focusMode not in TS types
              focusMode: 'continuous',
            },
            audio: false,
          },
          videoRef.current!,
          (result, err) => {
            if (!mountedRef.current) return;
            if (result) {
              const text = result.getText();
              if (text === lastScan) return;
              setLastScan(text);
              lookupAndAdd(text);
              setTimeout(() => setLastScan(null), 1500);
            }
          }
        );
        controlsRef.current = controls;
      } catch (e: any) {
        setError(e?.message ?? 'Camera access denied');
      }
    })();

    return () => {
      mountedRef.current = false;
      try {
        controlsRef.current?.stop();
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const toggleTorch = async () => {
    const track = (videoRef.current?.srcObject as MediaStream)
      ?.getVideoTracks()[0];
    if (!track) return;
    try {
      await track.applyConstraints({
        // @ts-expect-error torch not in standard types
        advanced: [{ torch: !torchOn }],
      });
      setTorchOn(!torchOn);
    } catch {
      toast.error('Torch not supported on this device');
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
      {/* Header */}
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

      {/* Camera / Manual */}
      {mode === 'camera' ? (
        <div className="flex-1 relative overflow-hidden">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
          />

          {/* Reticle */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-72 h-40 border-2 border-white/90 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
              <div className="w-full h-0.5 bg-red-500 animate-pulse mt-20" />
            </div>
          </div>

          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white p-6 text-center">
              <div>
                <CameraOff className="h-12 w-12 mx-auto mb-3 text-red-400" />
                <p className="mb-2 font-medium">⚠️ {error}</p>
                <p className="text-sm text-white/70 mb-4">
                  Allow camera access, or use manual entry.
                </p>
                <Button
                  variant="secondary"
                  onClick={() => setMode('manual')}
                >
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

      {/* Bottom controls */}
      <div className="p-4 flex justify-around items-center text-white shrink-0 border-t border-white/10">
        {mode === 'camera' ? (
          <>
            <button
              onClick={toggleTorch}
              className="flex flex-col items-center gap-1 p-3"
            >
              <Zap
                className={`h-6 w-6 ${torchOn ? 'text-yellow-400' : ''}`}
              />
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