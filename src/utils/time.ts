/**
 * Formats seconds into SRT timestamp: HH:MM:SS,mmm
 */
export function formatSrtTimestamp(totalSeconds: number): string {
  if (totalSeconds < 0 || !Number.isFinite(totalSeconds)) {
    totalSeconds = 0;
  }

  const roundedMs = Math.round(totalSeconds * 1000);
  const hours = Math.floor(roundedMs / 3600000);
  const minutes = Math.floor((roundedMs % 3600000) / 60000);
  const seconds = Math.floor((roundedMs % 60000) / 1000);
  const ms = roundedMs % 1000;

  const hStr = String(hours).padStart(2, "0");
  const mStr = String(minutes).padStart(2, "0");
  const sStr = String(seconds).padStart(2, "0");
  const msStr = String(ms).padStart(3, "0");

  return `${hStr}:${mStr}:${sStr},${msStr}`;
}

/**
 * Formats seconds into WebVTT timestamp: HH:MM:SS.mmm
 */
export function formatVttTimestamp(totalSeconds: number): string {
  if (totalSeconds < 0 || !Number.isFinite(totalSeconds)) {
    totalSeconds = 0;
  }

  const roundedMs = Math.round(totalSeconds * 1000);
  const hours = Math.floor(roundedMs / 3600000);
  const minutes = Math.floor((roundedMs % 3600000) / 60000);
  const seconds = Math.floor((roundedMs % 60000) / 1000);
  const ms = roundedMs % 1000;

  const hStr = String(hours).padStart(2, "0");
  const mStr = String(minutes).padStart(2, "0");
  const sStr = String(seconds).padStart(2, "0");
  const msStr = String(ms).padStart(3, "0");

  return `${hStr}:${mStr}:${sStr}.${msStr}`;
}

/**
 * Formats seconds into SubStation Alpha (ASS) timestamp: H:MM:SS.cc (centiseconds)
 */
export function formatAssTimestamp(totalSeconds: number): string {
  if (totalSeconds < 0 || !Number.isFinite(totalSeconds)) {
    totalSeconds = 0;
  }

  const roundedCs = Math.round(totalSeconds * 100);
  const hours = Math.floor(roundedCs / 360000);
  const minutes = Math.floor((roundedCs % 360000) / 6000);
  const seconds = Math.floor((roundedCs % 6000) / 100);
  const cs = roundedCs % 100;

  const mStr = String(minutes).padStart(2, "0");
  const sStr = String(seconds).padStart(2, "0");
  const csStr = String(cs).padStart(2, "0");

  return `${hours}:${mStr}:${sStr}.${csStr}`;
}
