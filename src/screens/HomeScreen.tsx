import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { parseYouTubeId } from '../utils/youtube';

interface HomeScreenProps {
  onPlay: (url: string) => void;
}

export default function HomeScreen({ onPlay }: HomeScreenProps) {
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);

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
      <Text style={styles.title}>Choreo</Text>

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
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        onPress={handlePlay}
      >
        <Text style={styles.buttonText}>Play</Text>
      </Pressable>
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 40,
    letterSpacing: 2,
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
  button: {
    width: '100%',
    backgroundColor: '#e62117',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonPressed: {
    backgroundColor: '#b71c1c',
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
});
