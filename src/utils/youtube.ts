/**
 * Extracts an 11-character YouTube video ID from a variety of URL formats,
 * or returns the input directly if it already looks like a bare video ID.
 *
 * Supported URL patterns:
 *   https://www.youtube.com/watch?v=XXXXXXXXXXX
 *   https://youtu.be/XXXXXXXXXXX
 *   https://www.youtube.com/embed/XXXXXXXXXXX
 *   https://m.youtube.com/watch?v=XXXXXXXXXXX
 *   https://youtube.com/shorts/XXXXXXXXXXX
 *
 * Returns null if no valid 11-char ID can be extracted.
 */
export function parseYouTubeId(input: string): string | null {
  const trimmed = input.trim();

  // Bare 11-character video ID (alphanumeric + hyphen + underscore)
  if (/^[A-Za-z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // watch?v= (youtube.com and m.youtube.com)
  const watchMatch = trimmed.match(
    /(?:https?:\/\/)?(?:www\.|m\.)?youtube\.com\/watch\?(?:[^#&]*&)*v=([A-Za-z0-9_-]{11})/
  );
  if (watchMatch) return watchMatch[1];

  // youtu.be/<id>
  const shortMatch = trimmed.match(
    /(?:https?:\/\/)?youtu\.be\/([A-Za-z0-9_-]{11})/
  );
  if (shortMatch) return shortMatch[1];

  // /embed/<id>
  const embedMatch = trimmed.match(
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([A-Za-z0-9_-]{11})/
  );
  if (embedMatch) return embedMatch[1];

  // /shorts/<id>
  const shortsMatch = trimmed.match(
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/
  );
  if (shortsMatch) return shortsMatch[1];

  // /live/<id>
  const liveMatch = trimmed.match(
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/live\/([A-Za-z0-9_-]{11})/
  );
  if (liveMatch) return liveMatch[1];

  return null;
}

/**
 * Fetches the video title from YouTube's oEmbed endpoint (no API key required).
 * Returns null on any error or network failure.
 */
export async function fetchVideoTitle(url: string): Promise<string | null> {
  try {
    const endpoint = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const res = await fetch(endpoint);
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data.title === 'string' ? data.title : null;
  } catch {
    return null;
  }
}
