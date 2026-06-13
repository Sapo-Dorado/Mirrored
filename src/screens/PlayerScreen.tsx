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
import MirrorToggle from '../components/MirrorToggle';
import SpeedControl from '../components/SpeedControl';
import { parseYouTubeId } from '../utils/youtube';

interface PlayerScreenProps {
  videoUrl: string;
  onBack: () => void;
}

// Builds a self-contained HTML page using the official YouTube IFrame API.
// This is the standard embedding approach per YouTube's ToS.
// Note: videos with embedding disabled by the uploader will show an error —
// that is a YouTube policy decision and cannot be worked around.
//
// Controls via window._choreo:
//   - setRate(n)    → ytPlayer.setPlaybackRate(n)
//   - setMirror(b)  → CSS scaleX(-1) on the iframe element
function buildPlayerHtml(videoId: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <style>
    html, body {
      margin: 0; padding: 0;
      width: 100%; height: 100%;
      background: #000;
      overflow: hidden;
    }
    #player { width: 100%; height: 100%; }
    #player iframe {
      width: 100% !important;
      height: 100% !important;
      border: none;
    }
  </style>
</head>
<body>
  <div id="player"></div>
  <script>
    var ytPlayer;
    var pendingRate = 1;
    var pendingMirror = false;

    function applyRate(rate) {
      pendingRate = rate;
      if (ytPlayer && ytPlayer.setPlaybackRate) {
        ytPlayer.setPlaybackRate(rate);
      }
    }

    function applyMirror(mirrored) {
      pendingMirror = mirrored;
      var iframe = document.querySelector('#player iframe');
      if (iframe) {
        iframe.style.transform = mirrored ? 'scaleX(-1)' : 'none';
      }
    }

    window._choreo = { setRate: applyRate, setMirror: applyMirror };

    // Load the YouTube IFrame API
    var tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);

    window.onYouTubeIframeAPIReady = function() {
      ytPlayer = new YT.Player('player', {
        videoId: '${videoId}',
        playerVars: {
          autoplay: 1,
          controls: 1,
          rel: 0,
          playsinline: 1,
          modestbranding: 1,
          fs: 1
        },
        events: {
          onReady: function(e) {
            e.target.playVideo();
            applyRate(pendingRate);
            applyMirror(pendingMirror);
          }
        }
      });
    };
  </script>
</body>
</html>`;
}

export default function PlayerScreen({ videoUrl, onBack }: PlayerScreenProps) {
  const webViewRef = useRef<WebView | null>(null);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [mirrored, setMirrored] = useState(false);

  const videoId = parseYouTubeId(videoUrl);
  const { width: playerWidth } = useWindowDimensions();
  const playerHeight = Math.round(playerWidth * (9 / 16));

  function handleRateChange(rate: number) {
    setPlaybackRate(rate);
    webViewRef.current?.injectJavaScript(`window._choreo.setRate(${rate}); true;`);
  }

  function handleMirrorToggle() {
    const newMirrored = !mirrored;
    setMirrored(newMirrored);
    webViewRef.current?.injectJavaScript(`window._choreo.setMirror(${String(newMirrored)}); true;`);
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={onBack} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </Pressable>
        </View>

        <WebView
          ref={webViewRef}
          source={{ html: buildPlayerHtml(videoId) }}
          style={{ width: playerWidth, height: playerHeight }}
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled
          allowsFullscreenVideo
        />

        <View style={styles.controls}>
          <SpeedControl
            currentRate={playbackRate}
            onRateChange={handleRateChange}
          />
          <MirrorToggle
            mirrored={mirrored}
            onToggle={handleMirrorToggle}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#111',
  },
  container: {
    flex: 1,
    backgroundColor: '#111',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    paddingVertical: 6,
    paddingRight: 16,
  },
  backText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '500',
  },
  controls: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 16,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  errorText: {
    color: '#ff5555',
    fontSize: 16,
    textAlign: 'center',
  },
});
