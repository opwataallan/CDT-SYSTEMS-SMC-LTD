import React, { useEffect, useRef, useState } from 'react';
import {
  Camera,
  CameraOff,
  Flashlight,
  FlashlightOff,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  X,
  Barcode,
  Volume2,
  VolumeX,
  Plus,
  Layers,
} from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Product } from '../../types';

interface PosCameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (code: string) => { success: boolean; message: string; product?: Product };
  products: Product[];
}

export const PosCameraScannerModal: React.FC<PosCameraScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  products,
}) => {
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [continuousMode, setContinuousMode] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [torchSupported, setTorchSupported] = useState<boolean>(false);
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [manualCode, setManualCode] = useState<string>('');
  const [sessionScanCount, setSessionScanCount] = useState<number>(0);
  const [lastScannedResult, setLastScannedResult] = useState<{
    code: string;
    success: boolean;
    message: string;
    productName?: string;
    time: Date;
  } | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isCooldownRef = useRef<boolean>(false);
  const lastScannedCodeRef = useRef<string>('');
  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const containerId = 'pos-camera-barcode-stream';

  // Audio Beep generator
  const playBeep = (isSuccess: boolean) => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (isSuccess) {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1250, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1800, ctx.currentTime + 0.09);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.09);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.09);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(320, ctx.currentTime);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.22);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.22);
      }
    } catch {
      // Audio context may be restricted by browser policy
    }
  };

  // Safe scanner cleanup
  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (err) {
        console.warn('Scanner stop error:', err);
      } finally {
        scannerRef.current = null;
        setIsScanning(false);
        setTorchOn(false);
        setTorchSupported(false);
      }
    }
  };

  // Process a scanned or manually entered barcode
  const handleProcessCode = (rawCode: string) => {
    const cleaned = rawCode.trim();
    if (!cleaned) return;

    // Check cooldown if same code repeated within 1.5s
    if (isCooldownRef.current && lastScannedCodeRef.current === cleaned) {
      return;
    }

    isCooldownRef.current = true;
    lastScannedCodeRef.current = cleaned;

    if (cooldownTimerRef.current) {
      clearTimeout(cooldownTimerRef.current);
    }
    cooldownTimerRef.current = setTimeout(() => {
      isCooldownRef.current = false;
      lastScannedCodeRef.current = '';
    }, 1200);

    const result = onScanSuccess(cleaned);
    playBeep(result.success);

    // Haptic vibration on mobile devices
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(result.success ? [50, 40, 60] : [150]);
      } catch {
        // ignore
      }
    }

    if (result.success) {
      setSessionScanCount((prev) => prev + 1);
      setLastScannedResult({
        code: cleaned,
        success: true,
        message: result.message,
        productName: result.product?.name,
        time: new Date(),
      });

      // If continuous mode is disabled, close after single scan
      if (!continuousMode) {
        setTimeout(() => {
          onClose();
        }, 500);
      }
    } else {
      setLastScannedResult({
        code: cleaned,
        success: false,
        message: result.message || `No item matching "${cleaned}"`,
        time: new Date(),
      });
    }
  };

  // Initialize and start camera scanning
  const startScanner = async (cameraIdToUse?: string) => {
    setCameraError(null);
    await stopScanner();

    // Check if DOM container exists
    const container = document.getElementById(containerId);
    if (!container) return;

    try {
      const html5QrCode = new Html5Qrcode(containerId, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.CODE_93,
          Html5QrcodeSupportedFormats.ITF,
          Html5QrcodeSupportedFormats.CODABAR,
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.DATA_MATRIX,
        ],
        verbose: false,
      });

      scannerRef.current = html5QrCode;

      // Scan box configuration
      const config = {
        fps: 15,
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          const boxWidth = Math.max(220, Math.floor(minEdge * 0.85));
          const boxHeight = Math.max(120, Math.floor(minEdge * 0.55));
          return { width: Math.min(boxWidth, 380), height: Math.min(boxHeight, 220) };
        },
        aspectRatio: 1.333333,
      };

      // Determine camera target (preferred back camera if no camera ID specified)
      const cameraTarget = cameraIdToUse
        ? cameraIdToUse
        : { facingMode: { ideal: 'environment' } };

      await html5QrCode.start(
        cameraTarget,
        config,
        (decodedText: string) => {
          handleProcessCode(decodedText);
        },
        () => {
          // Frame misses are normal during active video processing
        }
      );

      setIsScanning(true);

      // Check if torch/flashlight capability is available
      try {
        const capabilities = html5QrCode.getRunningTrackCameraCapabilities();
        if (capabilities && (capabilities as any).torchFeature?.().isSupported?.()) {
          setTorchSupported(true);
        }
      } catch {
        // Torch capability check non-critical
      }
    } catch (err: any) {
      console.error('Camera init error:', err);
      let errorMsg = 'Unable to access camera.';
      if (err?.name === 'NotAllowedError' || err?.message?.includes('Permission denied')) {
        errorMsg = 'Camera access was blocked. Please grant camera permission in your browser settings to scan product barcodes.';
      } else if (err?.name === 'NotFoundError' || err?.message?.includes('Requested device not found')) {
        errorMsg = 'No camera device detected on this workstation.';
      } else if (err?.message) {
        errorMsg = err.message;
      }
      setCameraError(errorMsg);
      setIsScanning(false);
    }
  };

  // Toggle Torch/Flashlight
  const toggleTorch = async () => {
    if (!scannerRef.current || !torchSupported) return;
    try {
      const newTorch = !torchOn;
      await (scannerRef.current as any).applyVideoConstraints({
        advanced: [{ torch: newTorch }],
      });
      setTorchOn(newTorch);
    } catch (err) {
      console.warn('Torch toggle failed:', err);
    }
  };

  // Load available cameras and launch on open
  useEffect(() => {
    let mounted = true;

    if (isOpen) {
      setSessionScanCount(0);
      setLastScannedResult(null);

      Html5Qrcode.getCameras()
        .then((devices) => {
          if (!mounted) return;
          if (devices && devices.length > 0) {
            setCameras(devices);
            // Default to back camera if detected by label
            const backCam = devices.find((d) =>
              /back|rear|environment|world/i.test(d.label)
            );
            const chosenId = backCam ? backCam.id : devices[0].id;
            setSelectedCameraId(chosenId);
            // Allow container to mount in DOM
            setTimeout(() => {
              if (mounted) startScanner(chosenId);
            }, 150);
          } else {
            setTimeout(() => {
              if (mounted) startScanner();
            }, 150);
          }
        })
        .catch(() => {
          if (!mounted) return;
          setTimeout(() => {
            if (mounted) startScanner();
          }, 150);
        });
    }

    return () => {
      mounted = false;
      stopScanner();
      if (cooldownTimerRef.current) {
        clearTimeout(cooldownTimerRef.current);
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      id="pos-camera-scanner-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-4 py-3 bg-[#0f172a] border-b border-slate-700/80 flex items-center justify-between text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#920d35]/30 text-amber-300 flex items-center justify-center border border-[#920d35]/50">
              <Camera className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm text-white">Live Camera Barcode Scanner</h3>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Scanner Active
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Point camera at 1D Barcodes (UPC/EAN/Code 128) or QR Codes
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close scanner"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Camera Viewport */}
        <div className="relative bg-black flex-1 min-h-[260px] sm:min-h-[320px] max-h-[420px] overflow-hidden flex flex-col items-center justify-center">
          {/* HTML5 QR Container */}
          <div id={containerId} className="w-full h-full min-h-[260px]" />

          {/* Custom Overlay / Reticle when Scanning */}
          {isScanning && !cameraError && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              {/* Target Aim Box */}
              <div className="relative w-64 sm:w-72 h-36 sm:h-44 border-2 border-amber-400/70 rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.25)]">
                {/* Corner Accents */}
                <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-amber-400 rounded-tl-sm" />
                <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-amber-400 rounded-tr-sm" />
                <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-amber-400 rounded-bl-sm" />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-amber-400 rounded-br-sm" />

                {/* Sweeping Laser Line */}
                <div className="absolute left-2 right-2 top-1/2 h-0.5 bg-[#920d35] shadow-[0_0_8px_#920d35] animate-pulse" />
              </div>

              <div className="mt-3 px-3 py-1 bg-slate-900/90 backdrop-blur-xs rounded-full border border-slate-700/80 text-[11px] font-medium text-slate-300 flex items-center gap-1.5 shadow-md">
                <Barcode className="w-3.5 h-3.5 text-amber-400" />
                <span>Center product barcode inside the frame</span>
              </div>
            </div>
          )}

          {/* Camera Error State */}
          {cameraError && (
            <div className="absolute inset-0 bg-slate-900 p-6 flex flex-col items-center justify-center text-center text-white">
              <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mb-3">
                <CameraOff className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-sm text-white mb-1">Camera Not Available</h4>
              <p className="text-xs text-slate-400 max-w-sm mb-4 leading-relaxed">
                {cameraError}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => startScanner(selectedCameraId)}
                  className="px-3.5 py-1.5 bg-[#920d35] hover:bg-[#770929] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors border border-amber-400/30"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry Camera</span>
                </button>
              </div>
            </div>
          )}

          {/* Last Scanned Floating Confirmation Toast */}
          {lastScannedResult && (
            <div
              className={`absolute top-3 inset-x-4 z-20 px-3 py-2 rounded-xl border backdrop-blur-md shadow-lg flex items-center justify-between transition-all duration-300 ${
                lastScannedResult.success
                  ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-100'
                  : 'bg-amber-950/90 border-amber-500/50 text-amber-100'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {lastScannedResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                )}
                <div className="min-w-0">
                  <div className="text-xs font-black truncate">
                    {lastScannedResult.success
                      ? `Added: ${lastScannedResult.productName || lastScannedResult.code}`
                      : lastScannedResult.message}
                  </div>
                  <div className="text-[10px] opacity-80 font-mono">
                    Code: {lastScannedResult.code}
                  </div>
                </div>
              </div>

              {lastScannedResult.success && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  +1 in Cart
                </span>
              )}
            </div>
          )}
        </div>

        {/* Camera Controls Toolbar */}
        <div className="p-3 bg-slate-800/80 border-t border-slate-700/60 flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Camera Selection Dropdown */}
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
              Camera:
            </span>
            <select
              value={selectedCameraId}
              onChange={(e) => {
                setSelectedCameraId(e.target.value);
                startScanner(e.target.value);
              }}
              disabled={cameras.length === 0}
              className="flex-1 h-8 bg-slate-900 border border-slate-700 rounded-lg px-2 text-xs text-white focus:outline-hidden focus:border-cyan-500"
            >
              {cameras.length > 0 ? (
                cameras.map((cam, idx) => (
                  <option key={cam.id} value={cam.id}>
                    {cam.label || `Camera ${idx + 1}`}
                  </option>
                ))
              ) : (
                <option value="">Default Workstation Camera</option>
              )}
            </select>
          </div>

          {/* Quick Action Toggles */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Torch toggle */}
            {torchSupported && (
              <button
                type="button"
                onClick={toggleTorch}
                className={`h-8 px-2.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                  torchOn
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                    : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-white'
                }`}
                title="Toggle Torch/Flashlight"
              >
                {torchOn ? <Flashlight className="w-3.5 h-3.5" /> : <FlashlightOff className="w-3.5 h-3.5" />}
                <span>Flash</span>
              </button>
            )}

            {/* Continuous Mode Toggle */}
            <button
              type="button"
              onClick={() => setContinuousMode(!continuousMode)}
              className={`h-8 px-2.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                continuousMode
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
              }`}
              title="Continuous Multi-Item Scanning"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{continuousMode ? 'Batch: On' : 'Single'}</span>
            </button>

            {/* Sound Mute Toggle */}
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="h-8 px-2.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white text-xs flex items-center gap-1 cursor-pointer transition-colors"
              title="Toggle Audio Beep"
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
            </button>
          </div>
        </div>

        {/* Manual Barcode Entry Fallback */}
        <div className="p-3 bg-slate-900 border-t border-slate-800 space-y-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (manualCode) {
                handleProcessCode(manualCode);
                setManualCode('');
              }
            }}
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <Barcode className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Can't scan? Type barcode or SKU & press Enter..."
                className="w-full pl-9 pr-3 py-2 text-xs font-mono bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-500"
              />
            </div>
            <button
              type="submit"
              disabled={!manualCode.trim()}
              className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shrink-0 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </form>

          {/* Quick Clickable Product Barcodes for Instant Testing */}
          <div className="pt-1">
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
              <span className="flex items-center gap-1 font-semibold text-slate-300">
                <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                Quick-test product barcodes from your catalog:
              </span>
              <span>Session Scans: <strong className="text-cyan-400">{sessionScanCount}</strong></span>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-16 overflow-y-auto pr-1">
              {products.slice(0, 6).map((p) => {
                const codeToDisplay = p.sku || `CDT-${p.id}`;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleProcessCode(codeToDisplay)}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-[10px] font-mono text-cyan-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                    title={`Click to simulate scanning ${p.name}`}
                  >
                    <span>{codeToDisplay}</span>
                    <span className="text-[9px] text-slate-400 truncate max-w-[90px]">
                      ({p.name.split(' ')[0]})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-2.5 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Cyber Dynamic Technologies POS Camera Engine</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
          >
            Done Scanning
          </button>
        </div>
      </div>
    </div>
  );
};
