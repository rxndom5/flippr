import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  Heading,
  Text,
  Button,
  FormControl,
  FormLabel,
  Input,
  Progress,
  Flex,
  SimpleGrid,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '@chakra-ui/toast';

const Dashboard = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const username = localStorage.getItem('username') || 'User';
  const [goals, setGoals] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [goalForm, setGoalForm] = useState({
    name: '',
    target_amount: '',
    deadline: '',
  });
  const [budgetForm, setBudgetForm] = useState({
    category: '',
    amount: '',
  });
  const [loading, setLoading] = useState(false);

  // Fetch savings goals and budgets
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch goals
        const goalsResponse = await axios.get('http://localhost:5001/savings-goals', {
          headers: { 'X-Username': username },
        });
        const formattedGoals = goalsResponse.data.goals.map(goal => ({
          ...goal,
          target_amount: parseFloat(goal.target_amount),
          current_amount: parseFloat(goal.current_amount),
        }));
        setGoals(formattedGoals);

        // Fetch budgets
        const budgetsResponse = await axios.get('http://localhost:5001/budgets', {
          headers: { 'X-Username': username },
        });
        setBudgets(budgetsResponse.data.budgets.map(b => ({
          ...b,
          budget_amount: parseFloat(b.budget_amount),
          spent_amount: parseFloat(b.spent_amount),
        })));
      } catch (error) {
        toast({
          title: 'Error',
          description: error.response?.data?.error || 'Failed to fetch data.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    };
    fetchData();
  }, [username, toast]);

  const handleGoalChange = (e) => {
    setGoalForm({ ...goalForm, [e.target.name]: e.target.value });
  };

  const handleBudgetChange = (e) => {
    setBudgetForm({ ...budgetForm, [e.target.name]: e.target.value });
  };

  const handleGoalSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('http://localhost:5001/savings-goals', goalForm, {
        headers: { 'X-Username': username },
      });
      toast({
        title: 'Success',
        description: 'Savings goal created.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setGoalForm({ name: '', target_amount: '', deadline: '' });
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

  const handleBudgetSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('http://localhost:5001/budgets', budgetForm, {
        headers: { 'X-Username': username },
      });
      toast({
        title: 'Success',
        description: 'Budget created.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setBudgetForm({ category: '', amount: '' });
      const response = await axios.get('http://localhost:5001/budgets', {
        headers: { 'X-Username': username },
      });
      setBudgets(response.data.budgets.map(b => ({
        ...b,
        budget_amount: parseFloat(b.budget_amount),
        spent_amount: parseFloat(b.spent_amount),
      })));
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to create budget.',
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
      py={8}
      px={{ base: 4, md: 8 }}
    >
      <Box
        p={8}
        maxW="4xl"
        w="full"
        bg="white"
        boxShadow="lg"
        borderRadius="lg"
        transition="all 0.3s"
        _hover={{ boxShadow: 'xl' }}
      >
        <VStack spacing={8} align="stretch">
          <Flex justify="space-between" align="center">
            <Heading size="lg" color="teal.600">
              Welcome, {username}!
            </Heading>
            <Button
              colorScheme="teal"
              variant="outline"
              size="md"
              onClick={handleLogout}
            >
              Log Out
            </Button>
          </Flex>

          {/* Savings Goals Section */}
          <Box bg="white" p={6} borderRadius="md" boxShadow="md">
            <Text fontSize="xl" fontWeight="bold" mb={4} color="teal.700">
              Savings Goals
            </Text>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
              <Box>
                <Text fontWeight="bold" mb={3}>Create a New Savings Goal</Text>
                <form onSubmit={handleGoalSubmit}>
                  <VStack spacing={4}>
                    <FormControl isRequired>
                      <FormLabel>Goal Name</FormLabel>
                      <Input
                        name="name"
                        value={goalForm.name}
                        onChange={handleGoalChange}
                        placeholder="e.g., Vacation Fund"
                        focusBorderColor="teal.500"
                        size="md"
                      />
                    </FormControl>
                    <FormControl isRequired>
                      <FormLabel>Target Amount ($)</FormLabel>
                      <Input
                        type="number"
                        name="target_amount"
                        value={goalForm.target_amount}
                        onChange={handleGoalChange}
                        placeholder="e.g., 5000"
                        focusBorderColor="teal.500"
                        size="md"
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Deadline (YYYY-MM-DD)</FormLabel>
                      <Input
                        type="date"
                        name="deadline"
                        value={goalForm.deadline}
                        onChange={handleGoalChange}
                        focusBorderColor="teal.500"
                        size="md"
                      />
                    </FormControl>
                    <Button
                      type="submit"
                      colorScheme="teal"
                      w="full"
                      isLoading={loading}
                      size="md"
                      _hover={{ bg: 'teal.600' }}
                    >
                      Add Goal
                    </Button>
                  </VStack>
                </form>
              </Box>
              <Box>
                <Text fontWeight="bold" mb={3}>Your Goals</Text>
                {goals.length === 0 ? (
                  <Text color="gray.500">No savings goals yet.</Text>
                ) : (
                  <VStack spacing={4} align="stretch">
                    {goals.map((goal) => (
                      <Box
                        key={goal.id}
                        p={4}
                        bg="teal.50"
                        borderRadius="md"
                        boxShadow="sm"
                      >
                        <Text fontWeight="medium">{goal.name}</Text>
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
                    ))}
                  </VStack>
                )}
              </Box>
            </SimpleGrid>
          </Box>

          {/* Budgets Section */}
          <Box bg="white" p={6} borderRadius="md" boxShadow="md">
            <Text fontSize="xl" fontWeight="bold" mb={4} color="teal.700">
              Budgets
            </Text>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
              <Box>
                <Text fontWeight="bold" mb={3}>Create a New Budget</Text>
                <form onSubmit={handleBudgetSubmit}>
                  <VStack spacing={4}>
                    <FormControl isRequired>
                      <FormLabel>Category</FormLabel>
                      <Input
                        name="category"
                        value={budgetForm.category}
                        onChange={handleBudgetChange}
                        placeholder="e.g., Groceries"
                        focusBorderColor="teal.500"
                        size="md"
                      />
                    </FormControl>
                    <FormControl isRequired>
                      <FormLabel>Amount ($)</FormLabel>
                      <Input
                        type="number"
                        name="amount"
                        value={budgetForm.amount}
                        onChange={handleBudgetChange}
                        placeholder="e.g., 500"
                        focusBorderColor="teal.500"
                        size="md"
                      />
                    </FormControl>
                    <Button
                      type="submit"
                      colorScheme="teal"
                      w="full"
                      isLoading={loading}
                      size="md"
                      _hover={{ bg: 'teal.600' }}
                    >
                      Add Budget
                    </Button>
                  </VStack>
                </form>
              </Box>
              <Box>
                <Text fontWeight="bold" mb={3}>Your Budgets</Text>
                {budgets.length === 0 ? (
                  <Text color="gray.500">No budgets yet.</Text>
                ) : (
                  <VStack spacing={4} align="stretch">
                    {budgets.map((budget) => (
                      <Box
                        key={budget.id}
                        p={4}
                        bg="teal.50"
                        borderRadius="md"
                        boxShadow="sm"
                      >
                        <Text fontWeight="medium">{budget.category}</Text>
                        <Text>
                          Budget: ${budget.budget_amount.toFixed(2)} | Spent: $
                          {Math.abs(budget.spent_amount).toFixed(2)} | Remaining: $
                          {(budget.budget_amount - Math.abs(budget.spent_amount)).toFixed(2)}
                        </Text>
                        <Progress
                          value={(Math.abs(budget.spent_amount) / budget.budget_amount) * 100}
                          colorScheme={budget.spent_amount >= budget.budget_amount ? 'red' : 'teal'}
                          size="sm"
                          mt={2}
                          borderRadius="md"
                        />
                      </Box>
                    ))}
                  </VStack>
                )}
              </Box>
            </SimpleGrid>
          </Box>

          {/* Navigation */}
          <Flex
            direction={{ base: 'column', md: 'row' }}
            gap={4}
            justify="center"
            mt={6}
          >
            <Button
              colorScheme="teal"
              size="lg"
              onClick={() => navigate('/financial-overview')}
              _hover={{ bg: 'teal.600' }}
            >
              View Financial Overview
            </Button>
            <Button
              colorScheme="teal"
              size="lg"
              onClick={() => navigate('/transactions')}
              _hover={{ bg: 'teal.600' }}
            >
              Manage Transactions
            </Button>
          </Flex>
        </VStack>
      </Box>
    </Box>
  );
};

export default Dashboard;