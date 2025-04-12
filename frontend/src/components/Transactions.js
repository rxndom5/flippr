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
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Flex,
  Divider,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '@chakra-ui/toast';

const Transactions = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const username = localStorage.getItem('username');
  const [transactions, setTransactions] = useState([]);
  const [goals, setGoals] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    transaction_date: '',
    goal_id: '',
    budget_id: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!username) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const transResponse = await axios.get('http://localhost:5001/transactions', {
          headers: { 'X-Username': username },
        });
        setTransactions(
          transResponse.data.transactions.map((t) => ({
            ...t,
            amount: parseFloat(t.amount),
          }))
        );

        const goalsResponse = await axios.get('http://localhost:5001/savings-goals', {
          headers: { 'X-Username': username },
        });
        setGoals(goalsResponse.data.goals);

        const budgetsResponse = await axios.get('http://localhost:5001/budgets', {
          headers: { 'X-Username': username },
        });
        setBudgets(budgetsResponse.data.budgets);
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
  }, [username, navigate, toast]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(
        'http://localhost:5001/transactions',
        {
          amount: formData.amount,
          description: formData.description,
          transaction_date: formData.transaction_date,
          goal_id: formData.goal_id || null,
          budget_id: formData.budget_id || null,
        },
        {
          headers: { 'X-Username': username },
        }
      );
      toast({
        title: 'Success',
        description: `Transaction added. AI Category: ${response.data.ai_category}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setFormData({ amount: '', description: '', transaction_date: '', goal_id: '', budget_id: '' });
      navigate('/dashboard');
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to add transaction.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
    setLoading(false);
  };

  return (
    <Box minH="100vh" bg="gray.50" p={4}>
      <Flex maxW="1200px" mx="auto" gap={6}>
        {/* Left Section: Form and Table */}
        <Box flex="3" bg="white" p={8} borderRadius="md" boxShadow="lg">
          <VStack spacing={6} align="start">
            <Heading color="teal.600">Your Transactions</Heading>

            {/* Form */}
            <Box w="full" p={4} bg="teal.50" borderRadius="md">
              <Text fontWeight="bold" mb={2}>
                Add a Transaction
              </Text>
              <form onSubmit={handleSubmit}>
                <VStack spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>Amount ($)</FormLabel>
                    <Input
                      type="number"
                      step="0.01"
                      name="amount"
                      value={formData.amount}
                      onChange={handleChange}
                      placeholder="e.g., -50.00 or 100.00"
                      focusBorderColor="teal.500"
                    />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel>Description</FormLabel>
                    <Input
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="e.g., Oreo"
                      focusBorderColor="teal.500"
                    />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel>Date</FormLabel>
                    <Input
                      type="date"
                      name="transaction_date"
                      value={formData.transaction_date}
                      onChange={handleChange}
                      focusBorderColor="teal.500"
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Link to Savings Goal (Optional)</FormLabel>
                    <Select
                      name="goal_id"
                      value={formData.goal_id}
                      onChange={handleChange}
                      placeholder="Select a goal"
                      focusBorderColor="teal.500"
                    >
                      {goals.map((goal) => (
                        <option key={goal.id} value={goal.id}>
                          {goal.name}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl>
                    <FormLabel>Link to Budget (Optional)</FormLabel>
                    <Select
                      name="budget_id"
                      value={formData.budget_id}
                      onChange={handleChange}
                      placeholder="Select a budget"
                      focusBorderColor="teal.500"
                    >
                      {budgets.map((budget) => (
                        <option key={budget.id} value={budget.id}>
                          {budget.category}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                  <Button
                    type="submit"
                    colorScheme="teal"
                    w="full"
                    isLoading={loading}
                    _hover={{ bg: 'teal.600' }}
                  >
                    Add Transaction
                  </Button>
                </VStack>
              </form>
            </Box>

            {/* Table */}
            <Box w="full">
              <Text fontWeight="bold" mb={2}>
                Transaction History
              </Text>
              {transactions.length === 0 ? (
                <Text color="gray.500">No transactions yet.</Text>
              ) : (
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Date</Th>
                      <Th>Description</Th>
                      <Th isNumeric>Amount ($)</Th>
                      <Th>Goal</Th>
                      <Th>Budget</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {transactions.map((trans) => (
                      <Tr key={trans.id}>
                        <Td>{trans.transaction_date}</Td>
                        <Td>{trans.description}</Td>
                        <Td isNumeric color={trans.amount < 0 ? 'red.500' : 'green.500'}>
                          {trans.amount.toFixed(2)}
                        </Td>
                        <Td>{trans.goal_name || 'None'}</Td>
                        <Td>{trans.budget_category || 'None'}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              )}
            </Box>

            <Button
              colorScheme="teal"
              w="full"
              onClick={() => navigate('/dashboard')}
              _hover={{ bg: 'teal.600' }}
            >
              Back to Dashboard
            </Button>
          </VStack>
        </Box>

        {/* Right Section: AI Categorization */}
        <Box flex="1" bg="white" p={6} borderRadius="md" boxShadow="lg">
          <VStack spacing={4} align="start">
            <Heading size="md" color="teal.600">
              AI Categorization
            </Heading>
            <Text fontSize="sm" color="gray.600">
              Powered by Groq Cloud AI
            </Text>
            <Divider />
            {transactions.length === 0 ? (
              <Text color="gray.500">No transactions to categorize.</Text>
            ) : (
              <VStack w="full" spacing={3} align="start">
                {transactions.map((trans) => (
                  <Box
                    key={trans.id}
                    p={3}
                    bg="teal.50"
                    borderRadius="md"
                    w="full"
                    _hover={{ bg: 'teal.100' }}
                  >
                    <Text fontWeight="bold">{trans.description}</Text>
                    <Text>
                      AI Category:{' '}
                      <Text as="span" color="teal.600">
                        {trans.ai_category || 'Processing...'}
                      </Text>
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      Amount: ${Math.abs(trans.amount).toFixed(2)}
                    </Text>
                  </Box>
                ))}
              </VStack>
            )}
          </VStack>
        </Box>
      </Flex>
    </Box>
  );
};

export default Transactions;