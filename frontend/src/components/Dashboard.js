import React, { useState, useEffect } from 'react';
import { Box, VStack, Heading, Text, Button, FormControl, FormLabel, Input, Progress } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '@chakra-ui/toast';

const Dashboard = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const username = localStorage.getItem('username') || 'User';
  const [goals, setGoals] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    target_amount: '',
    deadline: '',
  });
  const [loading, setLoading] = useState(false);

  // Fetch savings goals
  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const response = await axios.get('http://localhost:5001/savings-goals', {
          headers: { 'X-Username': username },
        });
        // Convert string amounts to numbers
        const formattedGoals = response.data.goals.map(goal => ({
          ...goal,
          target_amount: parseFloat(goal.target_amount),
          current_amount: parseFloat(goal.current_amount),
        }));
        setGoals(formattedGoals);
      } catch (error) {
        toast({
          title: 'Error',
          description: error.response?.data?.error || 'Failed to fetch goals.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    };
    fetchGoals();
  }, [username, toast]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('http://localhost:5001/savings-goals', formData, {
        headers: { 'X-Username': username },
      });
      toast({
        title: 'Success',
        description: 'Savings goal created.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setFormData({ name: '', target_amount: '', deadline: '' });
      // Refresh goals
      const response = await axios.get('http://localhost:5001/savings-goals', {
        headers: { 'X-Username': username },
      });
      const formattedGoals = response.data.goals.map(goal => ({
        ...goal,
        target_amount: parseFloat(goal.target_amount),
        current_amount: parseFloat(goal.current_amount),
      }));
      setGoals(formattedGoals);
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to create goal.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('username');
    localStorage.removeItem('user_id');
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
          <Text fontSize="lg">Your Savings Goals</Text>

          {/* Form to Add Goal */}
          <Box w="full" p={4} bg="teal.50" borderRadius="md">
            <Text fontWeight="bold" mb={2}>Create a New Savings Goal</Text>
            <form onSubmit={handleSubmit}>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Goal Name</FormLabel>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., Vacation Fund"
                    focusBorderColor="teal.500"
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Target Amount ($)</FormLabel>
                  <Input
                    type="number"
                    name="target_amount"
                    value={formData.target_amount}
                    onChange={handleChange}
                    placeholder="e.g., 5000"
                    focusBorderColor="teal.500"
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Deadline (YYYY-MM-DD)</FormLabel>
                  <Input
                    type="date"
                    name="deadline"
                    value={formData.deadline}
                    onChange={handleChange}
                    focusBorderColor="teal.500"
                  />
                </FormControl>
                <Button
                  type="submit"
                  colorScheme="teal"
                  w="full"
                  isLoading={loading}
                  _hover={{ bg: 'teal.600' }}
                >
                  Add Goal
                </Button>
              </VStack>
            </form>
          </Box>

          {/* List of Goals */}
          <Box w="full">
            <Text fontWeight="bold" mb={2}>Your Goals</Text>
            {goals.length === 0 ? (
              <Text color="gray.500">No savings goals yet.</Text>
            ) : (
              goals.map((goal) => (
                <Box
                  key={goal.id}
                  p={4}
                  mb={3}
                  bg="teal.50"
                  borderRadius="md"
                  boxShadow="sm"
                >
                  <Text fontWeight="bold">{goal.name}</Text>
                  <Text>
                    Target: ${goal.target_amount.toFixed(2)} | Saved: $
                    {goal.current_amount.toFixed(2)}
                  </Text>
                  <Text>Deadline: {goal.deadline || 'None'}</Text>
                  <Progress
                    value={(goal.current_amount / goal.target_amount) * 100}
                    colorScheme="teal"
                    size="sm"
                    mt={2}
                    borderRadius="md"
                  />
                </Box>
              ))
            )}
          </Box>

          {/* Placeholder for Transactions */}
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