import React from 'react';
import { ChakraProvider, CSSReset } from '@chakra-ui/react';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import Register from './components/Register';

// Create Emotion cache
const emotionCache = createCache({
  key: 'chakra-emotion-cache',
});

function App() {
  return (
    <CacheProvider value={emotionCache}>
      <ChakraProvider>
        <CSSReset />
        <Register />
      </ChakraProvider>
    </CacheProvider>
  );
}

export default App;