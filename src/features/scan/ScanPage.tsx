import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Camera, Image as ImageIcon, RefreshCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button, EmptyState, useToast } from '@/shared/ui';
import { tDynamic } from '@/shared/lib';
import { captureFrame } from './captureFrame';
import { useCamera } from './useCamera';

type CapturedImage = {
  blob: Blob;
  url: string;
};

export function ScanPage() {
  const { t } = useTranslation();
  const { show } = useToast();
  const { status, errorMessage, videoRef, start, stop } = useCamera();
  const [captured, setCaptured] = useState<CapturedImage | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void start();
  }, [start]);

  // Revoke object URLs on unmount or when the captured image changes.
  useEffect(() => {
    if (!captured) return;
    return () => {
      URL.revokeObjectURL(captured.url);
    };
  }, [captured]);

  const handleCapture = async () => {
    if (!videoRef.current) return;
    try {
      const blob = await captureFrame(videoRef.current);
      const url = URL.createObjectURL(blob);
      setCaptured({ blob, url });
      stop();
    } catch {
      show({
        title: t('scan.error.title'),
        description: t('scan.error.description'),
        tone: 'danger',
      });
    }
  };

  const handleRetake = () => {
    setCaptured(null);
    void start();
  };

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ''; // allow re-picking the same file
    if (!file) return;
    stop();
    const url = URL.createObjectURL(file);
    setCaptured({ blob: file, url });
  };

  if (captured) {
    return (
      <section className="flex min-h-[calc(100dvh-5rem)] flex-col bg-bg">
        <div className="flex-1 p-4">
          <div className="mx-auto aspect-[5/7] w-full max-w-xs overflow-hidden rounded-lg bg-bg-raised">
            <img
              src={captured.url}
              alt={t('scan.preview.alt')}
              className="h-full w-full object-cover"
            />
          </div>
          <p className="mt-4 text-center text-sm text-fg-muted">{t('scan.preview.ocrPending')}</p>
        </div>
        <div className="border-t border-border bg-bg-raised p-4">
          <div className="mx-auto flex max-w-md gap-2">
            <Button variant="secondary" fullWidth onClick={handleRetake}>
              <RefreshCcw className="h-4 w-4" aria-hidden="true" />
              {t('scan.preview.retake')}
            </Button>
            <Button fullWidth disabled>
              {t('scan.preview.continueDisabled')}
            </Button>
          </div>
        </div>
      </section>
    );
  }

  if (status === 'streaming') {
    return (
      <section className="flex min-h-[calc(100dvh-5rem)] flex-col bg-black">
        <div className="relative flex-1 overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover"
            aria-label={t('scan.title')}
          />
          <div
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
            aria-hidden="true"
          >
            <div className="aspect-[5/7] w-3/4 max-w-xs rounded-lg border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]" />
          </div>
          <p
            className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-md bg-black/60 px-3 py-1 text-xs text-white"
            aria-live="polite"
          >
            {t('scan.guide')}
          </p>
        </div>
        <div className="border-t border-border bg-bg-raised p-4">
          <Button
            fullWidth
            onClick={() => {
              void handleCapture();
            }}
          >
            <Camera className="h-5 w-5" aria-hidden="true" />
            {t('scan.capture')}
          </Button>
        </div>
      </section>
    );
  }

  if (status === 'requesting') {
    return (
      <section className="flex min-h-[calc(100dvh-5rem)] items-center justify-center p-4">
        <p role="status" aria-live="polite" className="text-fg-muted">
          {t('scan.requesting')}
        </p>
      </section>
    );
  }

  const fallbackKey: 'denied' | 'unsupported' | 'error' | 'idle' =
    status === 'denied' || status === 'unsupported' || status === 'error' ? status : 'idle';
  const canRetry = status !== 'unsupported';

  return (
    <section className="flex min-h-[calc(100dvh-5rem)] flex-col items-center justify-center gap-4 p-4">
      <EmptyState
        icon={<Camera className="h-12 w-12" aria-hidden="true" />}
        title={tDynamic(t, `scan.${fallbackKey}.title`)}
        description={
          fallbackKey === 'error' && errorMessage
            ? errorMessage
            : tDynamic(t, `scan.${fallbackKey}.description`)
        }
      />
      <div className="flex flex-col items-stretch gap-2">
        {canRetry ? (
          <Button
            onClick={() => {
              void start();
            }}
          >
            {t('scan.retry')}
          </Button>
        ) : null}
        <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
          <ImageIcon className="h-4 w-4" aria-hidden="true" />
          {t('scan.useFile')}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          aria-hidden="true"
          tabIndex={-1}
          onChange={handleFile}
        />
      </div>
    </section>
  );
}
