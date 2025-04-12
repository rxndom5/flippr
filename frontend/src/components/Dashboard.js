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
  useToast,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

const Dashboard = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const username = localStorage.getItem('username') || 'User';
  const userId = localStorage.getItem('user_id');
  const [expenses, setExpenses] = useState([]);
  const [formData, setFormData] = useState({
    amount: '',
    category: 'Food',
    description: '',
    expense_date: new Date().toISOString().split('T')[0],
  });

  // Chart data
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [],
  });

  // Fetch expenses and update chart
  useEffect(() => {
    if (userId) {
      axios
        .get(`http://localhost:5001/expenses/${userId}`)
        .then((response) => {
          setExpenses(response.data.expenses);
          // Aggregate expenses by category
          const categorySums = response.data.expenses.reduce((acc, expense) => {
            const amount = parseFloat(expense.amount);
            acc[expense.category] = (acc[expense.category] || 0) + amount;
            return acc;
          }, {});
          // Prepare chart data
          const labels = Object.keys(categorySums);
          const data = Object.values(categorySums);
          setChartData({
            labels,
            datasets: [
              {
                label: 'Expenses by Category',
                data,
                backgroundColor: [
                  'rgba(75, 192, 192, 0.6)', // Teal for Food
                  'rgba(54, 162, 235, 0.6)', // Blue for Transport
                  'rgba(255, 99, 132, 0.6)', // Red for Entertainment
                  'rgba(255, 206, 86, 0.6)', // Yellow for Bills
                  'rgba(153, 102, 255, 0.6)', // Purple for Other
                ],
                borderColor: [
                  'rgba(75, 192, 192, 1)',
                  'rgba(54, 162, 235, 1)',
                  'rgba(255, 99, 132, 1)',
                  'rgba(255, 206, 86, 1)',
                  'rgba(153, 102, 255, 1)',
                ],
                borderWidth: 1,
              },
            ],
          });
        })
        .catch((error) => {
          toast({
            title: 'Error',
            description: error.response?.data?.error || 'Failed to fetch expenses.',
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
        });
    }
  }, [userId, toast]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5001/expenses', {
        user_id: userId,
        amount: parseFloat(formData.amount),
        category: formData.category,
        description: formData.description,
        expense_date: formData.expense_date,
      });
      toast({
        title: 'Success',
        description: 'Expense added successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      // Reset form
      setFormData({
        amount: '',
        category: 'Food',
        description: '',
        expense_date: new Date().toISOString().split('T')[0],
      });
      // Refresh expenses and chart
      const response = await axios.get(`http://localhost:5001/expenses/${userId}`);
      setExpenses(response.data.expenses);
      // Update chart
      const categorySums = response.data.expenses.reduce((acc, expense) => {
        const amount = parseFloat(expense.amount);
        acc[expense.category] = (acc[expense.category] || 0) + amount;
        return acc;
      }, {});
      const labels = Object.keys(categorySums);
      const data = Object.values(categorySums);
      setChartData({
        labels,
        datasets: [
          {
            label: 'Expenses by Category',
            data,
            backgroundColor: [
              'rgba(75, 192, 192, 0.6)',
              'rgba(54, 162, 235, 0.6)',
              'rgba(255, 99, 132, 0.6)',
              'rgba(255, 206, 86, 0.6)',
              'rgba(153, 102, 255, 0.6)',
            ],
            borderColor: [
              'rgba(75, 192, 192, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 99, 132, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(153, 102, 255, 1)',
            ],
            borderWidth: 1,
          },
        ],
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to add expense.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
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
      p={4}
    >
      <Box
        p={8}
        maxW="lg"
        w="full"
        bg="white"
        boxShadow="lg"
        borderRadius="md"
        transition="all 0.3s"
        _hover={{ boxShadow: 'xl' }}
      >
        <VStack spacing={8} align="stretch">
          <Heading color="teal.600">Welcome, {username}!</Heading>
          <Text fontSize="lg">Your Budget Dashboard</Text>

          {/* Pie Chart */}
          {chartData.labels.length > 0 ? (
            <Box
              p={4}
              bg="teal.50"
              borderRadius="md"
              boxShadow="sm"
              transition="transform 0.2s"
              _hover={{ transform: 'scale(1.02)' }}
            >
              <Text fontSize="lg" fontWeight="bold" mb={4}>
                Expenses by Category
              </Text>
              <Box maxW="300px" mx="auto">
                <Pie
                  data={chartData}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: 'bottom',
                      },
                      tooltip: {
                        callbacks: {
                          label: (context) =>
                            `${context.label}: $${context.parsed.toFixed(2)}`,
                        },
                      },
                    },
                  }}
                />
              </Box>
            </Box>
          ) : (
            <Text>No expenses to display in chart.</Text>
          )}

          {/* Expense Form */}
          <Box as="form" onSubmit={handleSubmit}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Amount</FormLabel>
                <Input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="Enter amount"
                  focusBorderColor="teal.500"
                  step="0.01"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Category</FormLabel>
                <Select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  focusBorderColor="teal.500"
                >
                  <option value="Food">Food</option>
                  <option value="Transport">Transport</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Bills">Bills</option>
                  <option value="Other">Other</option>
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>Description</FormLabel>
                <Input
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Enter description"
                  focusBorderColor="teal.500"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Date</FormLabel>
                <Input
                  type="date"
                  name="expense_date"
                  value={formData.expense_date}
                  onChange={handleChange}
                  focusBorderColor="teal.500"
                />
              </FormControl>
              <Button
                type="submit"
                colorScheme="teal"
                w="full"
                _hover={{ bg: 'teal.600' }}
              >
                Add Expense
              </Button>
            </VStack>
          </Box>

          {/* Expense List */}
          <Box>
            <Text fontSize="lg" fontWeight="bold" mb={4}>
              Recent Expenses
            </Text>
            {expenses.length > 0 ? (
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Amount</Th>
                    <Th>Category</Th>
                    <Th>Description</Th>
                    <Th>Date</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {expenses.map((expense) => (
                    <Tr key={expense.id}>
                      <Td>${parseFloat(expense.amount).toFixed(2)}</Td>
                      <Td>{expense.category}</Td>
                      <Td>{expense.description || '-'}</Td>
                      <Td>{expense.expense_date}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            ) : (
              <Text>No expenses yet.</Text>
            )}
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