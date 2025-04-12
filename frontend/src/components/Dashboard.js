import React from 'react';
import { Box, VStack, Heading, Text, Button } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const username = localStorage.getItem('username') || 'User';

  const handleLogout = () => {
    localStorage.removeItem('username');
    navigate('/login');
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
        <VStack spacing={6} align="start">
          <Heading color="teal.600">Welcome, {username}!</Heading>
          <Text fontSize="lg">Your Budget Dashboard</Text>
          <Box w="full" p={4} bg="teal.50" borderRadius="md">
            <Text fontWeight="bold">Your Budget</Text>
            <Text>Coming soon: Budget overview and insights.</Text>
          </Box>
          <Box w="full" p={4} bg="teal.50" borderRadius="md">
            <Text fontWeight="bold">Recent Transactions</Text>
            <Text>Coming soon: View your latest transactions.</Text>
          </Box>
          <Button
            colorScheme="teal"
            w="full"
            onClick={handleLogout}
            _hover={{ bg: 'teal.600' }}
          >
            Log Out
          </Button>
        </VStack>
      </Box>
    </Box>
  );
};

export default Dashboard;