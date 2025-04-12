import React from 'react';
import { ChakraProvider, CSSReset } from '@chakra-ui/react';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { Box, HStack } from '@chakra-ui/react';
import Register from './components/Register';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

const emotionCache = createCache({
  key: 'chakra-emotion-cache',
});

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem('username');
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <CacheProvider value={emotionCache}>
      <ChakraProvider>
        <CSSReset />
        <Router>
          <Box p={4}>
            <HStack spacing={4} mb={4} justify="center">
              <Link to="/register">
                <Box as="span" color="teal.500" fontWeight="bold">
                  Register
                </Box>
              </Link>
              <Link to="/login">
                <Box as="span" color="teal.500" fontWeight="bold">
                  Log In
                </Box>
              </Link>
            </HStack>
            <Routes>
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route path="/" element={<Navigate to="/register" />} />
            </Routes>
          </Box>
        </Router>
      </ChakraProvider>
    </CacheProvider>
  );
}

export default App;