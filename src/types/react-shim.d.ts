// react-native-youtube-iframe@2.4.1 uses React.VFC which was removed in @types/react v18+.
// Patch it back as an alias for React.FC so the library's types compile correctly.
import type React from 'react';

declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type VFC<P = Record<string, never>> = React.FC<P>;
}
