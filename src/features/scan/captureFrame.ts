/**
 * Grab the current video frame as a JPEG Blob via an offscreen canvas.
 * Quality 0.92 keeps the image well above OCR thresholds while staying
 * under ~300 KB for a typical 1920x1080 frame.
 */
export async function captureFrame(video: HTMLVideoElement): Promise<Blob> {
  if (!video.videoWidth || !video.videoHeight) {
    throw new Error('Video stream has no dimensions yet');
  }
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');
  ctx.drawImage(video, 0, 0);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas toBlob returned null'));
      },
      'image/jpeg',
      0.92,
    );
  });
}
