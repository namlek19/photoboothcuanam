import { useEffect, useRef, useState, useCallback } from 'react';

export interface CameraStreamState {
  videoRef: React.RefObject<HTMLVideoElement>;
  fallbackCanvasRef: React.RefObject<HTMLCanvasElement>;
  hasCamera: boolean;
  isLoading: boolean;
  errorMsg: string | null;
  usingSimulatedCamera: boolean;
  devices: MediaDeviceInfo[];
  selectedDeviceId: string;
  setSelectedDeviceId: (id: string) => void;
  retryCamera: () => void;
  enableSimulatedCamera: () => void;
  captureFullFrameDataUrl: () => {
    dataUrl: string;
    width: number;
    height: number;
  } | null;
}

/**
 * Shared Camera Stream Hook with automatic fallback to an interactive
 * animated live mirror canvas when a device has no physical webcam.
 */
export function useCameraStream(): CameraStreamState {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fallbackCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [hasCamera, setHasCamera] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [usingSimulatedCamera, setUsingSimulatedCamera] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

  const stopCurrentStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(
    async (deviceId?: string) => {
      setIsLoading(true);
      setErrorMsg(null);

      if (
        typeof navigator === 'undefined' ||
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        setHasCamera(false);
        setUsingSimulatedCamera(true);
        setIsLoading(false);
        setErrorMsg('Trình duyệt không hỗ trợ WebRTC Camera, đang dùng Gương Mô Phỏng.');
        return;
      }

      try {
        stopCurrentStream();

        const constraints: MediaStreamConstraints = {
          video: deviceId
            ? {
                deviceId: { exact: deviceId },
                width: { ideal: 1920 },
                height: { ideal: 1080 },
              }
            : {
                facingMode: 'user',
                width: { ideal: 1920 },
                height: { ideal: 1080 },
              },
          audio: false,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }

        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = allDevices.filter((d) => d.kind === 'videoinput');
        setDevices(videoDevices);

        setHasCamera(true);
        setUsingSimulatedCamera(false);
        setIsLoading(false);
      } catch {
        setHasCamera(false);
        setUsingSimulatedCamera(true);
        setIsLoading(false);
        setErrorMsg(
          'Không tìm thấy webcam hoặc chưa cấp quyền. Đã bật chế độ Gương Mô Phỏng trực tiếp để bạn trải nghiệm đầy đủ.'
        );
      }
    },
    [stopCurrentStream]
  );

  useEffect(() => {
    startCamera(selectedDeviceId || undefined);
    return () => {
      stopCurrentStream();
    };
  }, [selectedDeviceId, startCamera, stopCurrentStream]);

  // Re-attach stream if video element remounts when switching between Mirror Mode and Booth Mode
  const attachVideoElement = useCallback(() => {
    if (videoRef.current && streamRef.current && videoRef.current.srcObject !== streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(attachVideoElement, 300);
    return () => clearInterval(interval);
  }, [attachVideoElement]);

  // Animated Live Simulated Mirror when no physical camera is available
  useEffect(() => {
    if (!usingSimulatedCamera) return;
    let animId = 0;
    let startTime = performance.now();

    const renderSimulatedMirror = (now: number) => {
      const canvas = fallbackCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const w = canvas.width;
          const h = canvas.height;
          const t = (now - startTime) * 0.001;

          // Bright dreamy ocean studio backdrop
          const bg = ctx.createLinearGradient(0, 0, w, h);
          bg.addColorStop(0, '#c6f7e9');
          bg.addColorStop(0.5, '#d8f0ff');
          bg.addColorStop(1, '#a5d8ff');
          ctx.fillStyle = bg;
          ctx.fillRect(0, 0, w, h);

          // Soft caustic light rays
          ctx.save();
          ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
          for (let i = 0; i < 4; i++) {
            const rx = w * (0.2 + i * 0.22) + Math.sin(t * 0.8 + i) * 35;
            ctx.beginPath();
            ctx.moveTo(rx - 40, 0);
            ctx.lineTo(rx + 60, 0);
            ctx.lineTo(rx + 180, h);
            ctx.lineTo(rx - 90, h);
            ctx.closePath();
            ctx.fill();
          }
          ctx.restore();

          // Cute animated character in the mirror so users can test Pan/Zoom & Filters vividly
          const cx = w / 2 + Math.sin(t * 1.1) * 22;
          const cy = h * 0.56 + Math.cos(t * 1.5) * 10;

          // Shoulders / sweater
          ctx.fillStyle = '#3182ce';
          ctx.beginPath();
          ctx.ellipse(cx, cy + 185, 175, 130, 0, Math.PI, 0, false);
          ctx.fill();
          ctx.lineWidth = 5;
          ctx.strokeStyle = '#000080';
          ctx.stroke();

          // Collar
          ctx.fillStyle = '#7FFFD4';
          ctx.beginPath();
          ctx.moveTo(cx - 55, cy + 72);
          ctx.lineTo(cx, cy + 120);
          ctx.lineTo(cx + 55, cy + 72);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Hair back
          ctx.fillStyle = '#1e293b';
          ctx.beginPath();
          ctx.arc(cx, cy - 18, 108, 0, Math.PI * 2);
          ctx.fill();

          // Face
          ctx.fillStyle = '#ffe4d6';
          ctx.beginPath();
          ctx.arc(cx, cy - 8, 86, 0, Math.PI * 2);
          ctx.fill();
          ctx.lineWidth = 4.5;
          ctx.strokeStyle = '#000080';
          ctx.stroke();

          // Rosy cheeks
          ctx.fillStyle = 'rgba(251, 113, 133, 0.42)';
          ctx.beginPath();
          ctx.ellipse(cx - 46, cy + 6, 16, 10, 0, 0, Math.PI * 2);
          ctx.ellipse(cx + 46, cy + 6, 16, 10, 0, 0, Math.PI * 2);
          ctx.fill();

          // Eyes (blinking occasionally)
          const blink = Math.sin(t * 2.6) > 0.94;
          ctx.fillStyle = '#000080';
          if (blink) {
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(cx - 42, cy - 14);
            ctx.lineTo(cx - 22, cy - 14);
            ctx.moveTo(cx + 22, cy - 14);
            ctx.lineTo(cx + 42, cy - 14);
            ctx.stroke();
          } else {
            ctx.beginPath();
            ctx.arc(cx - 32, cy - 14, 9, 0, Math.PI * 2);
            ctx.arc(cx + 32, cy - 14, 9, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(cx - 35, cy - 17, 3.5, 0, Math.PI * 2);
            ctx.arc(cx + 29, cy - 17, 3.5, 0, Math.PI * 2);
            ctx.fill();
          }

          // Happy smile
          ctx.strokeStyle = '#000080';
          ctx.lineWidth = 4;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.arc(cx, cy + 2, 22, 0.18 * Math.PI, 0.82 * Math.PI);
          ctx.stroke();

          // Cute peace sign hand waving
          const handX = cx + 128 + Math.sin(t * 2.8) * 12;
          const handY = cy + 20 + Math.cos(t * 2.8) * 8;
          ctx.fillStyle = '#ffe4d6';
          ctx.strokeStyle = '#000080';
          ctx.lineWidth = 4;
          // Two fingers V sign
          ctx.beginPath();
          ctx.roundRect(handX - 14, handY - 52, 13, 42, 6);
          ctx.roundRect(handX + 2, handY - 50, 13, 40, 6);
          ctx.fill();
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(handX, handY, 22, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Floating ocean bubbles inside studio
          for (let b = 0; b < 8; b++) {
            const bx = ((b * 173 + t * 28) % (w - 80)) + 40;
            const by = h - (((b * 137 + t * 55) % (h - 60)) + 30);
            const br = 12 + (b % 3) * 8;
            ctx.beginPath();
            ctx.arc(bx, by, br, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(127, 255, 212, 0.35)';
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(renderSimulatedMirror);
    };

    animId = requestAnimationFrame(renderSimulatedMirror);
    return () => cancelAnimationFrame(animId);
  }, [usingSimulatedCamera]);

  /**
   * Captures the FULL-FRAME non-destructive image (horizontally mirrored just like the mirror view)
   */
  const captureFullFrameDataUrl = useCallback(() => {
    const offscreen = document.createElement('canvas');

    if (hasCamera && videoRef.current && videoRef.current.videoWidth > 0) {
      const vw = videoRef.current.videoWidth;
      const vh = videoRef.current.videoHeight;
      offscreen.width = vw;
      offscreen.height = vh;
      const ctx = offscreen.getContext('2d');
      if (!ctx) return null;

      // Flip horizontally to match the mirror scaleX(-1)
      ctx.save();
      ctx.translate(vw, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(videoRef.current, 0, 0, vw, vh);
      ctx.restore();

      return {
        dataUrl: offscreen.toDataURL('image/jpeg', 0.95),
        width: vw,
        height: vh,
      };
    }

    if (fallbackCanvasRef.current) {
      const fw = fallbackCanvasRef.current.width;
      const fh = fallbackCanvasRef.current.height;
      offscreen.width = fw;
      offscreen.height = fh;
      const ctx = offscreen.getContext('2d');
      if (!ctx) return null;

      ctx.save();
      ctx.translate(fw, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(fallbackCanvasRef.current, 0, 0, fw, fh);
      ctx.restore();

      return {
        dataUrl: offscreen.toDataURL('image/jpeg', 0.95),
        width: fw,
        height: fh,
      };
    }

    return null;
  }, [hasCamera]);

  return {
    videoRef,
    fallbackCanvasRef,
    hasCamera,
    isLoading,
    errorMsg,
    usingSimulatedCamera,
    devices,
    selectedDeviceId,
    setSelectedDeviceId,
    retryCamera: () => startCamera(selectedDeviceId || undefined),
    enableSimulatedCamera: () => {
      stopCurrentStream();
      setHasCamera(false);
      setUsingSimulatedCamera(true);
    },
    captureFullFrameDataUrl,
  };
}
