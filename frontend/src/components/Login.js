import React, { useState } from 'react';
import { Box, VStack, Heading, Text } from '@chakra-ui/react';
import { FormControl, FormLabel } from '@chakra-ui/form-control';
import { Input, InputGroup, InputRightElement } from '@chakra-ui/input';
import { Button } from '@chakra-ui/button';
import { useToast } from '@chakra-ui/toast';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5001/login', {
        username: formData.username,
        password: formData.password,
      });
      toast({
        title: 'Success',
        description: response.data.message,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      localStorage.setItem('username', response.data.username);
      localStorage.setItem('user_id', response.data.user_id);
      setFormData({ username: '', password: '' });
      navigate('/dashboard');
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Login failed.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
    setLoading(false);
  };

  return (
    <Box
      minH="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bg="gray.50"
    >
      <Box
        p={8}
        maxW="md"
        w="full"
        bg="white"
        boxShadow="lg"
        borderRadius="md"
        transition="all 0.3s"
        _hover={{ boxShadow: 'xl' }}
      >
        <Heading mb={6} textAlign="center" color="teal.600">
          Log In
        </Heading>
        <form onSubmit={handleSubmit}>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Username</FormLabel>
              <Input
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Enter username"
                focusBorderColor="teal.500"
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Password</FormLabel>
              <InputGroup>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter password"
                  focusBorderColor="teal.500"
                />
                <InputRightElement width="4.5rem">
                  <Button
                    h="1.75rem"
                    size="sm"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </Button>
                </InputRightElement>
              </InputGroup>
            </FormControl>
            <Button
              type="submit"
              colorScheme="teal"
              w="full"
              isLoading={loading}
              mt={4}
              _hover={{ bg: 'teal.600' }}
            >
              Log In
            </Button>
          </VStack>
        </form>
        <Text mt={4} textAlign="center">
          Don’t have an account?{' '}
          <Box as="span" color="teal.500" cursor="pointer">
            Register
          </Box>
        </Text>
      </Box>
    </Box>
  );
};

export default Login;