import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Select,
  VStack,
  HStack,
  useToast,
  Text,
  Flex,
  Container,
} from '@chakra-ui/react';
import { ArrowBackIcon } from '@chakra-ui/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Transactions = () => {
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
  const toast = useToast();
  const navigate = useNavigate();
  const username = localStorage.getItem('username');

  useEffect(() => {
    if (!username) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const [transactionsRes, goalsRes, budgetsRes] = await Promise.all([
          axios.get('http://localhost:5001/transactions', {
            headers: { 'X-Username': username },
          }),
          axios.get('http://localhost:5001/savings-goals', {
            headers: { 'X-Username': username },
          }),
          axios.get('http://localhost:5001/budgets', {
            headers: { 'X-Username': username },
          }),
        ]);

        setTransactions(transactionsRes.data.transactions);
        setGoals(goalsRes.data.goals);
        setBudgets(budgetsRes.data.budgets);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch data',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    };

    fetchData();
  }, [username, navigate, toast]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
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
        bg: 'teal.500',
        color: 'white',
      });
      setFormData({
        amount: '',
        description: '',
        transaction_date: '',
        goal_id: '',
        budget_id: '',
      });
      navigate('/dashboard');
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to add transaction',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (transactionId) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) {
      return;
    }

    try {
      await axios.delete(`http://localhost:5001/transactions/${transactionId}`, {
        headers: { 'X-Username': username },
      });
      setTransactions(transactions.filter((t) => t.id !== transactionId));
      toast({
        title: 'Success',
        description: 'Transaction deleted',
        status: 'success',
        duration: 3000,
        isClosable: true,
        bg: 'teal.500',
        color: 'white',
      });
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to delete transaction',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Container maxW="container.xl" py={8}>
      <Button
        leftIcon={<ArrowBackIcon />}
        colorScheme="teal"
        variant="outline"
        mb={6}
        onClick={() => navigate('/dashboard')}
      >
        Back to Dashboard
      </Button>
      <Flex direction={{ base: 'column', md: 'row' }} gap={8}>
        <Box
          flex="1"
          p={6}
          bg="teal.50"
          shadow="md"
          borderWidth="1px"
          borderRadius="lg"
          borderColor="teal.200"
        >
          <Heading size="lg" mb={6} color="teal.700">
            Add Transaction
          </Heading>
          <form onSubmit={handleSubmit}>
            <VStack spacing={5}>
              <FormControl isRequired>
                <FormLabel color="teal.600">Amount</FormLabel>
                <Input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="Enter amount (positive for income, negative for expense)"
                  bg="white"
                  borderColor="teal.300"
                  _hover={{ borderColor: 'teal.500' }}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel color="teal.600">Description</FormLabel>
                <Input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Enter description"
                  bg="white"
                  borderColor="teal.300"
                  _hover={{ borderColor: 'teal.500' }}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel color="teal.600">Date</FormLabel>
                <Input
                  type="date"
                  name="transaction_date"
                  value={formData.transaction_date}
                  onChange={handleChange}
                  bg="white"
                  borderColor="teal.300"
                  _hover={{ borderColor: 'teal.500' }}
                />
              </FormControl>
              <FormControl>
                <FormLabel color="teal.600">Savings Goal</FormLabel>
                <Select
                  name="goal_id"
                  value={formData.goal_id}
                  onChange={handleChange}
                  placeholder="Select savings goal (optional)"
                  bg="white"
                  borderColor="teal.300"
                  _hover={{ borderColor: 'teal.500' }}
                >
                  {goals.map((goal) => (
                    <option key={goal.id} value={goal.id}>
                      {goal.name}
                    </option>
                  ))}
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel color="teal.600">Budget</FormLabel>
                <Select
                  name="budget_id"
                  value={formData.budget_id}
                  onChange={handleChange}
                  placeholder="Select budget (optional)"
                  bg="white"
                  borderColor="teal.300"
                  _hover={{ borderColor: 'teal.500' }}
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
                isLoading={loading}
                loadingText="Adding..."
                size="lg"
                width="full"
              >
                Add Transaction
              </Button>
            </VStack>
          </form>

          <Heading size="md" mt={10} mb={4} color="teal.700">
            Transaction History
          </Heading>
          <Table variant="simple" colorScheme="teal">
            <Thead>
              <Tr>
                <Th>Date</Th>
                <Th>Description</Th>
                <Th isNumeric>Amount</Th>
                <Th>Goal</Th>
                <Th>Budget</Th>
                <Th>Action</Th>
              </Tr>
            </Thead>
            <Tbody>
              {transactions.map((transaction) => (
                <Tr key={transaction.id}>
                  <Td>{transaction.transaction_date}</Td>
                  <Td>{transaction.description}</Td>
                  <Td isNumeric>${Math.abs(transaction.amount).toFixed(2)}</Td>
                  <Td>{transaction.goal_name || '-'}</Td>
                  <Td>{transaction.budget_category || '-'}</Td>
                  <Td>
                    <Button
                      size="sm"
                      colorScheme="red"
                      onClick={() => handleDelete(transaction.id)}
                    >
                      Delete
                    </Button>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>

        <Box
          flex="1"
          p={6}
          bg="teal.50"
          shadow="md"
          borderWidth="1px"
          borderRadius="lg"
          borderColor="teal.200"
        >
          <Heading size="lg" mb={6} color="teal.700">
            AI Categorization
          </Heading>
          {transactions.length === 0 ? (
            <Text color="teal.600">No transactions available.</Text>
          ) : (
            <VStack spacing={4} align="start">
              {transactions.map((transaction) => (
                <Box
                  key={transaction.id}
                  p={4}
                  bg="white"
                  shadow="sm"
                  borderWidth="1px"
                  borderRadius="md"
                  width="100%"
                  borderColor="teal.300"
                >
                  <Text fontWeight="bold" color="teal.800">{transaction.description}</Text>
                  <Text color="teal.600">AI Category: {transaction.ai_category}</Text>
                  <Text color="teal.600">Amount: ${Math.abs(transaction.amount).toFixed(2)}</Text>
                </Box>
              ))}
            </VStack>
          )}
        </Box>
      </Flex>
    </Container>
  );
};

export default Transactions;