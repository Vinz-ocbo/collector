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
  const generationRef = useRef(0);

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
    releaseStream();
    // Generation counter so a stale getUserMedia resolution from a previous
    // call (e.g. React StrictMode's double-mount in dev, or a fast retry)
    // can release its stream without clobbering the latest call's state.
    const gen = ++generationRef.current;
    setStatus('requesting');
    setErrorMessage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      if (generationRef.current !== gen) {
        stream.getTracks().forEach((track) => {
          track.stop();
        });
        return;
      }
      streamRef.current = stream;
      setStatus('streaming');
    } catch (err) {
      if (generationRef.current !== gen) return;
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
  }, [releaseStream]);

  const stop = useCallback(() => {
    releaseStream();
    setStatus('idle');
  }, [releaseStream]);

  // The <video> element only mounts in the consumer's 'streaming' branch, so
  // we can't bind the stream synchronously inside start() — by the time the
  // promise resolves, videoRef.current is still null. Binding here runs
  // after React commits the streaming JSX, when the ref is populated.
  useEffect(() => {
    if (status === 'streaming' && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [status]);

  useEffect(() => {
    return releaseStream;
  }, [releaseStream]);

  return { status, errorMessage, videoRef, start, stop };
}
