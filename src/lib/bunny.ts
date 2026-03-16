const BUNNY_CDN_HOSTNAME = import.meta.env.VITE_BUNNY_CDN_HOSTNAME || "";

export function getBunnyHlsUrl(videoId: string): string {
  if (!BUNNY_CDN_HOSTNAME) return "";
  return `https://${BUNNY_CDN_HOSTNAME}/${videoId}/playlist.m3u8`;
}

export function getBunnyThumbnailUrl(videoId: string): string {
  if (!BUNNY_CDN_HOSTNAME) return "";
  return `https://${BUNNY_CDN_HOSTNAME}/${videoId}/thumbnail.jpg`;
}

export function isBunnyConfigured(): boolean {
  return !!BUNNY_CDN_HOSTNAME;
}
