import React, { useState } from 'react';
import {
  Box,
  VStack,
  Heading,
  Text,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
  Select,
  Button,
  useToast,
  FormErrorMessage,
  Flex,
  Link,
  useColorModeValue,
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    currency: 'USD',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const toast = useToast();
  const navigate = useNavigate();
  const bgGradient = useColorModeValue('linear(to-br, teal.800, teal.500)', 'gray.800');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: '' }); // Clear error on change
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.username.trim()) newErrors.username = 'Username is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.password.trim()) newErrors.password = 'Password is required';
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (!formData.confirmPassword.trim()) newErrors.confirmPassword = 'Confirm password is required';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5001/register', {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        full_name: formData.fullName,
        currency: formData.currency,
      });
      toast({
        title: 'Success',
        description: response.data.message,
        status: 'success',
        duration: 3000,
        isClosable: true,
        position: 'top-right',
        bg: 'teal.500',
        color: 'white',
      });
      setFormData({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        fullName: '',
        currency: 'USD',
      });
      navigate('/login');
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Registration failed.',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top-right',
      });
      const form = e.target;
      form.style.animation = 'shake 0.5s';
      setTimeout(() => (form.style.animation = ''), 500);
    }
    setLoading(false);
  };

  return (
    <Box
      minH="100vh"
      bgGradient={bgGradient}
      display="flex"
      alignItems="center"
      justifyContent="center"
      py={{ base: 6, md: 12 }}
      px={{ base: 4, md: 8 }}
    >
      <Box
        p={{ base: 6, md: 10 }}
        maxW={{ base: '90%', md: 'md' }}
        w="full"
        bg="rgba(255, 255, 255, 0.95)"
        boxShadow="0 8px 32px rgba(0, 0, 0, 0.1)"
        borderRadius="2xl"
        border="1px solid teal.200"
        backdropFilter="blur(10px)"
        transition="all 0.3s"
        _hover={{ boxShadow: '0 12px 48px rgba(0, 0, 0, 0.2)' }}
        sx={{
          animation: 'fadeIn 0.6s ease-out',
          '@keyframes fadeIn': {
            from: { opacity: 0, transform: 'translateY(20px)' },
            to: { opacity: 1, transform: 'translateY(0)' },
          },
          '@keyframes shake': {
            '0%, 100%': { transform: 'translateX(0)' },
            '25%': { transform: 'translateX(-5px)' },
            '75%': { transform: 'translateX(5px)' },
          },
        }}
        maxH={{ base: '90vh', md: 'auto' }}
        overflowY="auto"
      >
        <VStack spacing={6} align="stretch">
          {/* Logo */}
          <Flex justify="center" mb={-2}>
            <Box
              w="60px"
              h="60px"
              bgGradient="linear(to-r, teal.400, teal.600)"
              borderRadius="full"
              boxShadow="md"
              aria-label="Logo"
            />
          </Flex>
          <Heading
            as="h1"
            size="2xl"
            textAlign="center"
            color="teal.600"
            fontWeight="extrabold"
            letterSpacing="wide"
          >
            Create Your Account
          </Heading>
          <form onSubmit={handleSubmit}>
            <VStack spacing={5}>
              <FormControl isRequired isInvalid={errors.username}>
                <FormLabel color="teal.700" fontWeight="semibold">
                  Username <Text as="span" color="red.500">*</Text>
                </FormLabel>
                <Input
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Enter your username"
                  bg="teal.50"
                  borderColor="teal.200"
                  focusBorderColor="teal.400"
                  borderRadius="md"
                  _placeholder={{ color: 'teal.400' }}
                  _hover={{ borderColor: 'teal.300' }}
                  transition="all 0.2s"
                  _focus={{ transform: 'scale(1.02)', boxShadow: '0 0 0 2px teal.200' }}
                />
                <FormErrorMessage color="red.500">{errors.username}</FormErrorMessage>
              </FormControl>
              <FormControl isRequired isInvalid={errors.email}>
                <FormLabel color="teal.700" fontWeight="semibold">
                  Email <Text as="span" color="red.500">*</Text>
                </FormLabel>
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  bg="teal.50"
                  borderColor="teal.200"
                  focusBorderColor="teal.400"
                  borderRadius="md"
                  _placeholder={{ color: 'teal.400' }}
                  _hover={{ borderColor: 'teal.300' }}
                  transition="all 0.2s"
                  _focus={{ transform: 'scale(1.02)', boxShadow: '0 0 0 2px teal.200' }}
                />
                <FormErrorMessage color="red.500">{errors.email}</FormErrorMessage>
              </FormControl>
              <FormControl isRequired isInvalid={errors.password}>
                <FormLabel color="teal.700" fontWeight="semibold">
                  Password <Text as="span" color="red.500">*</Text>
                </FormLabel>
                <InputGroup>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    bg="teal.50"
                    borderColor="teal.200"
                    focusBorderColor="teal.400"
                    borderRadius="md"
                    _placeholder={{ color: 'teal.400' }}
                    _hover={{ borderColor: 'teal.300' }}
                    transition="all 0.2s"
                    _focus={{ transform: 'scale(1.02)', boxShadow: '0 0 0 2px teal.200' }}
                  />
                  <InputRightElement width="4.5rem">
                    <Button
                      h="1.75rem"
                      size="sm"
                      onClick={() => setShowPassword(!showPassword)}
                      bg="transparent"
                      _hover={{ bg: 'teal.100' }}
                      borderRadius="md"
                    >
                      {showPassword ? <ViewOffIcon color="teal.600" /> : <ViewIcon color="teal.600" />}
                    </Button>
                  </InputRightElement>
                </InputGroup>
                <FormErrorMessage color="red.500">{errors.password}</FormErrorMessage>
              </FormControl>
              <FormControl isRequired isInvalid={errors.confirmPassword}>
                <FormLabel color="teal.700" fontWeight="semibold">
                  Confirm Password <Text as="span" color="red.500">*</Text>
                </FormLabel>
                <Input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  bg="teal.50"
                  borderColor="teal.200"
                  focusBorderColor="teal.400"
                  borderRadius="md"
                  _placeholder={{ color: 'teal.400' }}
                  _hover={{ borderColor: 'teal.300' }}
                  transition="all 0.2s"
                  _focus={{ transform: 'scale(1.02)', boxShadow: '0 0 0 2px teal.200' }}
                />
                <FormErrorMessage color="red.500">{errors.confirmPassword}</FormErrorMessage>
              </FormControl>
              <FormControl isInvalid={errors.fullName}>
                <FormLabel color="teal.700" fontWeight="semibold">
                  Full Name
                </FormLabel>
                <Input
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  bg="teal.50"
                  borderColor="teal.200"
                  focusBorderColor="teal.400"
                  borderRadius="md"
                  _placeholder={{ color: 'teal.400' }}
                  _hover={{ borderColor: 'teal.300' }}
                  transition="all 0.2s"
                  _focus={{ transform: 'scale(1.02)', boxShadow: '0 0 0 2px teal.200' }}
                />
                <FormErrorMessage color="red.500">{errors.fullName}</FormErrorMessage>
              </FormControl>
              <FormControl>
                <FormLabel color="teal.700" fontWeight="semibold">
                  Preferred Currency
                </FormLabel>
                <Select
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  bg="teal.50"
                  borderColor="teal.200"
                  focusBorderColor="teal.400"
                  borderRadius="md"
                  _hover={{ borderColor: 'teal.300' }}
                  transition="all 0.2s"
                  _focus={{ transform: 'scale(1.02)', boxShadow: '0 0 0 2px teal.200' }}
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="INR">INR</option>
                </Select>
              </FormControl>
              <Button
                type="submit"
                bgGradient="linear(to-r, teal.400, teal.600)"
                color="white"
                w="full"
                size="lg"
                isLoading={loading}
                loadingText="Registering..."
                _hover={{ bgGradient: 'linear(to-r, teal.500, teal.700)', transform: 'scale(1.05)' }}
                transition="all 0.3s"
                mt={4}
                _active={{ transform: 'scale(0.98)' }}
                borderRadius="md"
              >
                Register
              </Button>
            </VStack>
          </form>
          <Text mt={6} textAlign="center" color="teal.700" fontSize="sm">
            Already have an account?{' '}
            <Link
              href="#"
              color="teal.500"
              _hover={{ textDecoration: 'underline', color: 'teal.600' }}
              onClick={() => navigate('/login')}
            >
              Log in
            </Link>
          </Text>
        </VStack>
      </Box>
    </Box>
  );
};

export default Register;