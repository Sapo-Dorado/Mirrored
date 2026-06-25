import React, { useRef, useState } from 'react';
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
import SpeedControl from '../components/SpeedControl';
import { parseYouTubeId } from '../utils/youtube';

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
// Current fix: wrap embed in a full HTML page with an <iframe>, giving it a
// real parent document context. YouTube IFrame API (enablejsapi=1) controls
// playback rate. Mirror is handled at the React Native View level (scaleX: -1).
// fs=0 hides YouTube's own fullscreen button — we lock to landscape via
// expo-screen-orientation instead.
function buildEmbedHtml(videoId: string): string {
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
    src="https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&controls=1&rel=0&playsinline=1&enablejsapi=1&fs=0"
    allow="autoplay; encrypted-media"
    frameborder="0"
  ></iframe>
  <script>
    var player = null;
    window.onYouTubeIframeAPIReady = function() {
      player = new YT.Player('yt', {
        events: { onReady: function(e) { e.target.playVideo(); } }
      });
    };
    window._choreo = {
      setRate: function(r) {
        if (player && player.setPlaybackRate) player.setPlaybackRate(r);
      },
    };
  </script>
  <script src="https://www.youtube.com/iframe_api"></script>
</body>
</html>`;
}

export default function PlayerScreen({ videoUrl, onBack }: PlayerScreenProps) {
  const webViewRef = useRef<WebView | null>(null);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [mirrored, setMirrored] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const videoId = parseYouTubeId(videoUrl);
  const { width, height } = useWindowDimensions();
  const portraitPlayerHeight = Math.round(width * (9 / 16));

  async function enterFullscreen() {
    setFullscreen(true);
    await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
  }

  async function exitFullscreen() {
    setFullscreen(false);
    await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
  }

  function handleRateChange(rate: number) {
    setPlaybackRate(rate);
    webViewRef.current?.injectJavaScript(`window._choreo.setRate(${rate}); true;`);
  }

  function handleMirrorToggle() {
    setMirrored(m => !m);
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

  const webview = (
    <WebView
      ref={webViewRef}
      source={{
        html: buildEmbedHtml(videoId),
        baseUrl: 'https://www.youtube-nocookie.com',
      }}
      style={styles.webview}
      javaScriptEnabled
      allowsInlineMediaPlayback
      mediaPlaybackRequiresUserAction={false}
      sharedCookiesEnabled
      scrollEnabled={false}
    />
  );

  if (fullscreen) {
    // Device is locked to landscape — width/height reflect the rotated dimensions
    return (
      <View style={[styles.fullscreenContainer, { width, height }]}>
        {/* Mirror applied only to the video layer */}
        <View style={[StyleSheet.absoluteFill, mirrored && styles.mirrored]}>
          {webview}
        </View>

        {/* Controls sit outside the mirrored layer — never flipped */}
        <View style={styles.fsControls}>
          <Pressable onPress={exitFullscreen} style={styles.fsExitBtn}>
            <Text style={styles.fsExitText}>✕ Exit</Text>
          </Pressable>
          <View style={styles.fsRightControls}>
            <SpeedControl currentRate={playbackRate} onRateChange={handleRateChange} />
            <MirrorToggle mirrored={mirrored} onToggle={handleMirrorToggle} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={onBack} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </Pressable>
        </View>

        {/* Mirror applied only to the video layer */}
        <View style={[{ width, height: portraitPlayerHeight }, mirrored && styles.mirrored]}>
          {webview}
        </View>

        <View style={styles.controls}>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: { paddingVertical: 6, paddingRight: 16 },
  backText: { color: '#fff', fontSize: 17, fontWeight: '500' },
  webview: { flex: 1, backgroundColor: '#000' },
  mirrored: { transform: [{ scaleX: -1 }] },

  // Fullscreen (landscape locked)
  fullscreenContainer: { backgroundColor: '#000' },
  fsControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  fsExitBtn: { paddingVertical: 6, paddingRight: 12 },
  fsExitText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  fsRightControls: { flexDirection: 'row', alignItems: 'center', gap: 20 },

  // Portrait controls
  controls: { paddingHorizontal: 20, paddingTop: 16, gap: 16 },
  fsBtn: { paddingVertical: 4 },
  fsBtnText: { color: '#888', fontSize: 14 },

  errorContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24,
  },
  errorText: { color: '#ff5555', fontSize: 16, textAlign: 'center' },
});
