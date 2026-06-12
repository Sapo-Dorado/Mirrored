import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { View } from 'react-native';
import HomeScreen from './src/screens/HomeScreen';
import PlayerScreen from './src/screens/PlayerScreen';

type Screen = 'home' | 'player';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [videoUrl, setVideoUrl] = useState('');

  return (
    <View style={{ flex: 1, backgroundColor: '#111' }}>
      <StatusBar style="light" />
      {screen === 'player' ? (
        <PlayerScreen
          videoUrl={videoUrl}
          onBack={() => setScreen('home')}
        />
      ) : (
        <HomeScreen
          onPlay={(url) => {
            setVideoUrl(url);
            setScreen('player');
          }}
        />
      )}
    </View>
  );
}
