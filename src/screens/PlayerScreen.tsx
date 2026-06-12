import React, { useRef, useState } from 'react';
import {
  Dimensions,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import YoutubePlayer, { YoutubeIframeRef } from 'react-native-youtube-iframe';
import { parseYouTubeId } from '../utils/youtube';

interface PlayerScreenProps {
  videoUrl: string;
  onBack: () => void;
}

export default function PlayerScreen({ videoUrl, onBack }: PlayerScreenProps) {
  const playerRef = useRef<YoutubeIframeRef | null>(null);

  // Phase 2 state (no UI yet)
  const [playbackRate, setPlaybackRate] = useState(1);   // eslint-disable-line @typescript-eslint/no-unused-vars
  const [mirrored, setMirrored] = useState(false);       // eslint-disable-line @typescript-eslint/no-unused-vars

  const videoId = parseYouTubeId(videoUrl);
  const playerHeight = Math.round(Dimensions.get('window').width * (9 / 16));

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

        <YoutubePlayer
          ref={playerRef}
          height={playerHeight}
          videoId={videoId}
          play={true}
          initialPlayerParams={{ rel: false, controls: true }}
        />
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
