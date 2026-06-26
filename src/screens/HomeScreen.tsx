import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { parseYouTubeId } from '../utils/youtube';
import { useFavorites } from '../hooks/useFavorites';

interface HomeScreenProps {
  onPlay: (url: string) => void;
}

export default function HomeScreen({ onPlay }: HomeScreenProps) {
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { favorites, removeFavorite } = useFavorites();

  function handlePlay() {
    const id = parseYouTubeId(input);
    if (!id) {
      setError('Could not find a YouTube video ID — check your URL and try again.');
      return;
    }
    setError(null);
    onPlay(input);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Mirrored</Text>

          <TextInput
            style={styles.input}
            value={input}
            onChangeText={(text) => {
              setInput(text);
              if (error) setError(null);
            }}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            placeholder="Paste YouTube URL"
            placeholderTextColor="#777"
            returnKeyType="go"
            onSubmitEditing={handlePlay}
          />

          {error !== null && (
            <Text style={styles.errorText}>{error}</Text>
          )}

          <Pressable
            style={({ pressed }) => [styles.playButton, pressed && styles.playButtonPressed]}
            onPress={handlePlay}
          >
            <Text style={styles.playButtonText}>Play</Text>
          </Pressable>

          {favorites.length > 0 && (
            <View style={styles.favSection}>
              <Text style={styles.favLabel}>Favorites</Text>
              {favorites.map((item, index) => (
                <View key={item.id}>
                  {index > 0 && <View style={styles.separator} />}
                  <View style={styles.favRow}>
                    <Pressable
                      style={({ pressed }) => [styles.favTitleWrap, pressed && styles.favTitlePressed]}
                      onPress={() => onPlay(item.url)}
                    >
                      <Text style={styles.favTitle} numberOfLines={1}>
                        {item.label}
                      </Text>
                      <Text style={styles.favSubtitle} numberOfLines={1}>
                        {item.url}
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => removeFavorite(item.id)}
                      hitSlop={8}
                      style={({ pressed }) => [styles.favStar, pressed && styles.favStarPressed]}
                    >
                      <Text style={styles.favStarText}>★</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
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
  },
  scroll: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 40,
    letterSpacing: 2,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    backgroundColor: '#1e1e1e',
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#fff',
    marginBottom: 12,
  },
  errorText: {
    color: '#ff5555',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  playButton: {
    width: '100%',
    backgroundColor: '#e62117',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  playButtonPressed: {
    backgroundColor: '#b71c1c',
  },
  playButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  // Favorites section
  favSection: {
    marginTop: 32,
  },
  favLabel: {
    color: '#888',
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  separator: {
    height: 1,
    backgroundColor: '#2a2a2a',
  },
  favRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  favTitleWrap: {
    flex: 1,
    borderRadius: 6,
    paddingVertical: 2,
  },
  favTitlePressed: {
    opacity: 0.6,
  },
  favTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  favSubtitle: {
    color: '#666',
    fontSize: 12,
    marginTop: 2,
  },
  favStar: {
    padding: 4,
    borderRadius: 4,
  },
  favStarPressed: {
    opacity: 0.5,
  },
  favStarText: {
    color: '#e62117',
    fontSize: 20,
  },
});
