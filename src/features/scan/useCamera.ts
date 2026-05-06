import { useCallback, useEffect, useRef, useState } from 'react';

export type CameraStatus = 'idle' | 'requesting' | 'streaming' | 'denied' | 'unsupported' | 'error';

export type UseCameraResult = {
  status: CameraStatus;
  errorMessage: string | null;
  videoRef: React.RefObject<HTMLVideoElement>;
  start: () => Promise<void>;
  stop: () => void;
};

/**
 * Camera lifecycle hook around `getUserMedia`. Owns the MediaStream and
 * binds it to a video element via the returned ref. Always releases tracks
 * on unmount so the OS-level camera indicator turns off when the user
 * navigates away — leaking a stream is the main pitfall on this API.
 *
 * Tests using jsdom land in `unsupported` because `navigator.mediaDevices`
 * is undefined; that path is fine to assert against.
 */
export function useCamera(): UseCameraResult {
  const [status, setStatus] = useState<CameraStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const releaseStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const start = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setStatus('unsupported');
      return;
    }
    setStatus('requesting');
    setErrorMessage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      // Defensive: if the consumer unmounted between the await and resolve,
      // there is no longer a video element to bind to. Release immediately.
      if (!videoRef.current) {
        stream.getTracks().forEach((track) => {
          track.stop();
        });
        return;
      }
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      setStatus('streaming');
    } catch (err) {
      const name = err instanceof DOMException ? err.name : '';
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        setStatus('denied');
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        setStatus('unsupported');
      } else {
        setStatus('error');
        setErrorMessage(err instanceof Error ? err.message : null);
      }
    }
  }, []);

  const stop = useCallback(() => {
    releaseStream();
    setStatus('idle');
  }, [releaseStream]);

  useEffect(() => {
    return releaseStream;
  }, [releaseStream]);

  return { status, errorMessage, videoRef, start, stop };
}
