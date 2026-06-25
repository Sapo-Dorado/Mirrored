import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import WebView from 'react-native-webview';
import * as ScreenOrientation from 'expo-screen-orientation';
import MirrorToggle from '../components/MirrorToggle';
import SeekBar from '../components/SeekBar';
import SpeedControl from '../components/SpeedControl';
import { parseYouTubeId, fetchVideoTitle } from '../utils/youtube';
import { useFavorites } from '../hooks/useFavorites';

interface PlayerScreenProps {
  videoUrl: string;
  onBack: () => void;
}

// Error 153 history:
//   July 2025: YouTube rejected WKWebView inline HTML (null origin).
//   Fix: load embed URL directly via uri — nocookie.com was less strict.
//
//   June 2026: YouTube now rejects embed URL loaded directly (no parent page
//   context), on both youtube.com and youtube-nocookie.com.
//
// Current fix: wrap embed in a full HTML page with an <iframe>. IFrame API
// (enablejsapi=1) controls playback rate. controls=0 hides YouTube's own UI.
// Mirror + fullscreen handled at React Native layer.
function buildEmbedHtml(videoId: string, initialRate: number): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: #000; }
    iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; }
  </style>
</head>
<body>
  <iframe
    id="yt"
    src="https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&controls=0&rel=0&playsinline=1&enablejsapi=1&fs=0&modestbranding=1&disablekb=1&iv_load_policy=3"
    allow="autoplay; encrypted-media"
    frameborder="0"
  ></iframe>
  <script>
    var player = null;
    window.onYouTubeIframeAPIReady = function() {
      player = new YT.Player('yt', {
        events: { onReady: function(e) { e.target.setPlaybackRate(${initialRate}); e.target.playVideo(); } }
      });
    };
    window._choreo = {
      setRate: function(r) {
        if (player && player.setPlaybackRate) player.setPlaybackRate(r);
      },
      seekTo: function(s) {
        if (player && player.seekTo) player.seekTo(s, true);
      },
    };

    setInterval(function() {
      if (!player || !player.getCurrentTime) return;
      var cur = player.getCurrentTime();
      var dur = player.getDuration();
      if (dur > 0) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'progress', current: cur, duration: dur,
        }));
      }
    }, 500);
  </script>
  <script src="https://www.youtube.com/iframe_api"></script>
</body>
</html>`;
}

export default function PlayerScreen({ videoUrl, onBack }: PlayerScreenProps) {
  const webViewRef = useRef<WebView | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [playbackRate, setPlaybackRate] = useState(1);
  const playbackRateRef = useRef(playbackRate);
  const [mirrored, setMirrored] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [showFsControls, setShowFsControls] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const videoId = parseYouTubeId(videoUrl);
  const { isFavorite, addFavorite, removeFavorite, favorites } = useFavorites();
  const starred = isFavorite(videoUrl);

  // Keep a ref in sync so useMemo can read the current rate when videoId changes
  // without adding playbackRate as a dependency (which would rebuild + reload the WebView).
  useEffect(() => { playbackRateRef.current = playbackRate; }, [playbackRate]);

  // Rebuild the embed HTML only when the video changes — not when rate changes.
  // Rate changes mid-playback go through injectJavaScript instead.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const embedHtml = useMemo(
    () => buildEmbedHtml(videoId ?? '', playbackRateRef.current),
    [videoId],
  );
  const { width, height } = useWindowDimensions();
  const portraitPlayerHeight = Math.round(width * (9 / 16));

  function showControlsBriefly() {
    setShowFsControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowFsControls(false), 3000);
  }

  async function enterFullscreen() {
    setFullscreen(true);
    await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
  }

  async function exitFullscreen() {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setShowFsControls(false);
    setFullscreen(false);
    await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
  }

  function handleMessage(event: { nativeEvent: { data: string } }) {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'progress') {
        setCurrentTime(msg.current);
        setDuration(msg.duration);
      }
    } catch {}
  }

  function handleSeek(seconds: number) {
    webViewRef.current?.injectJavaScript(`window._choreo.seekTo(${seconds}); true;`);
  }

  function handleRateChange(rate: number) {
    setPlaybackRate(rate);
    webViewRef.current?.injectJavaScript(`window._choreo.setRate(${rate}); true;`);
  }

  function handleMirrorToggle() {
    setMirrored(m => !m);
  }

  async function handleStarToggle() {
    if (starred) {
      const fav = favorites.find((f) => f.url === videoUrl);
      if (fav) removeFavorite(fav.id);
    } else {
      // Fetch the real video title from YouTube's oEmbed API (no key needed).
      // Falls back to the video ID if the fetch fails.
      const title = await fetchVideoTitle(videoUrl);
      addFavorite(videoUrl, title ?? videoId ?? videoUrl);
    }
  }

  if (!videoId) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Pressable onPress={onBack} style={styles.backButton}>
              <Text style={styles.backText}>← Back</Text>
            </Pressable>
          </View>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              Could not load video — invalid YouTube URL or ID.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Keep the WebView in the same position in the React tree at all times so it
  // never remounts (which would restart the video). We hide the portrait header
  // and controls via display:none in fullscreen, and use absoluteFill + zIndex
  // on the player container to cover the screen when fullscreen.
  const playerStyle = fullscreen
    ? [StyleSheet.absoluteFill, styles.fullscreenPlayer]
    : { width, height: portraitPlayerHeight };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>

        {/* Portrait header — hidden in fullscreen via display:none */}
        <View style={[styles.header, fullscreen && styles.hidden]}>
          <Pressable onPress={onBack} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </Pressable>
          <Pressable onPress={handleStarToggle} hitSlop={10} style={styles.starBtn}>
            <Text style={[styles.starText, starred && styles.starTextActive]}>
              {starred ? '★' : '☆'}
            </Text>
          </Pressable>
        </View>

        {/* Player container — always in the tree, style changes for fullscreen.
            The WebView inside never remounts. */}
        <Pressable style={playerStyle} onPress={fullscreen ? showControlsBriefly : undefined}>
          {/* Mirror layer — only the video is flipped */}
          <View style={[StyleSheet.absoluteFill, mirrored && styles.mirrored]}>
            <WebView
              ref={webViewRef}
              source={{
                html: embedHtml,
                baseUrl: 'https://www.youtube-nocookie.com',
              }}
              style={styles.webview}
              javaScriptEnabled
              allowsInlineMediaPlayback
              mediaPlaybackRequiresUserAction={false}
              sharedCookiesEnabled
              scrollEnabled={false}
              onMessage={handleMessage}
              onShouldStartLoadWithRequest={({ url, isTopFrame }) => {
                // Main frame may only sit on our injected HTML (the baseUrl).
                // Any navigation away (YouTube logo, links, redirects) is blocked.
                // Subframes (the YouTube iframe and all its resources) load freely.
                if (isTopFrame) {
                  return (
                    url.startsWith('about:') ||
                    url === 'https://www.youtube-nocookie.com' ||
                    url === 'https://www.youtube-nocookie.com/'
                  );
                }
                return true;
              }}
            />
          </View>

          {/* Fullscreen controls overlay — tap anywhere to reveal, auto-hides after 3s.
              Outside the mirror layer so buttons are never flipped. */}
          {fullscreen && showFsControls && (
            <View style={styles.fsOverlay} pointerEvents="box-none">
              <View style={styles.fsTop} pointerEvents="box-none">
                <Pressable onPress={exitFullscreen} style={styles.fsExitBtn} hitSlop={12}>
                  <Text style={styles.fsExitText}>✕ Exit</Text>
                </Pressable>
                <View style={styles.fsRightControls}>
                  <SpeedControl currentRate={playbackRate} onRateChange={handleRateChange} />
                  <MirrorToggle mirrored={mirrored} onToggle={handleMirrorToggle} />
                </View>
              </View>
              <View style={styles.fsSeekBar} pointerEvents="box-none">
                <SeekBar current={currentTime} duration={duration} onSeek={handleSeek} />
              </View>
            </View>
          )}
        </Pressable>

        {/* Portrait seek bar + controls — hidden in fullscreen via display:none */}
        <View style={[styles.seekBarWrap, fullscreen && styles.hidden]}>
          <SeekBar current={currentTime} duration={duration} onSeek={handleSeek} />
        </View>
        <View style={[styles.controls, fullscreen && styles.hidden]}>
          <SpeedControl currentRate={playbackRate} onRateChange={handleRateChange} />
          <MirrorToggle mirrored={mirrored} onToggle={handleMirrorToggle} />
          <Pressable onPress={enterFullscreen} style={styles.fsBtn}>
            <Text style={styles.fsBtnText}>⛶  Fullscreen</Text>
          </Pressable>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#111' },
  container: { flex: 1, backgroundColor: '#111' },
  hidden: { display: 'none' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: { paddingVertical: 6, paddingRight: 16 },
  backText: { color: '#fff', fontSize: 17, fontWeight: '500' },
  webview: { flex: 1, backgroundColor: '#000' },
  mirrored: { transform: [{ scaleX: -1 }] },

  // Fullscreen
  fullscreenPlayer: { zIndex: 100, backgroundColor: '#000' },
  fsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  fsTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
  },
  fsExitBtn: { paddingVertical: 4, paddingRight: 8 },
  fsExitText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  fsRightControls: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  fsSeekBar: { paddingHorizontal: 16, paddingBottom: 12 },

  // Portrait controls
  seekBarWrap: { paddingHorizontal: 20, paddingTop: 12 },
  controls: { paddingHorizontal: 20, paddingTop: 12, gap: 16 },
  fsBtn: { paddingVertical: 4 },
  fsBtnText: { color: '#888', fontSize: 14 },
  starBtn: { paddingVertical: 4 },
  starText: { fontSize: 22, color: '#666' },
  starTextActive: { color: '#e62117' },

  errorContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24,
  },
  errorText: { color: '#ff5555', fontSize: 16, textAlign: 'center' },
});
