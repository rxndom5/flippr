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
  IconButton,
  ScaleFade,
  SimpleGrid,
  InputGroup,
  InputLeftElement,
  RadioGroup,
  Radio,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerCloseButton,
} from '@chakra-ui/react';
import {
  ArrowBackIcon,
  DeleteIcon,
  CalendarIcon,
  InfoIcon,
  AddIcon,
  HamburgerIcon,
} from '@chakra-ui/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [goals, setGoals] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [formData, setFormData] = useState({
    type: 'Debit',
    amount: '',
    description: '',
    transaction_date: '',
    goal_id: '',
    budget_id: '',
  });
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
          position: 'top-right',
        });
      }
    };

    fetchData();
  }, [username, navigate, toast]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleTypeChange = (value) => {
    setFormData({ ...formData, type: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const rawAmount = parseFloat(formData.amount);
      if (isNaN(rawAmount) || rawAmount <= 0) {
        throw new Error('Amount must be a positive number');
      }
      const amount = formData.type === 'Debit' ? -rawAmount : rawAmount;

      const response = await axios.post(
        'http://localhost:5001/transactions',
        {
          amount: amount,
          description: formData.description,
          transaction_date: formData.transaction_date,
          goal_id: formData.goal_id || null,
          budget_id: formData.budget_id || null,
        },
        {
          headers: { 'X-Username': username },
        }
      );

      const newTransaction = {
        id: response.data.id || Date.now(),
        amount: amount,
        description: formData.description,
        transaction_date: formData.transaction_date,
        goal_name: goals.find((g) => g.id === formData.goal_id)?.name || null,
        budget_category: budgets.find((b) => b.id === formData.budget_id)?.category || null,
        ai_category: response.data.ai_category,
      };
      setTransactions((prev) => [newTransaction, ...prev]);

      toast({
        title: 'Success',
        description: `Transaction added. AI Category: ${response.data.ai_category}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
        position: 'top-right',
        bg: 'teal.500',
        color: 'white',
      });
      setFormData({
        type: 'Debit',
        amount: '',
        description: '',
        transaction_date: '',
        goal_id: '',
        budget_id: '',
      });
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast({
        title: 'Error',
        description: error.message || error.response?.data?.error || 'Failed to add transaction',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top-right',
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
        position: 'top-right',
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
        position: 'top-right',
      });
    }
  };

  return (
    <Box
      minH="100vh"
      bgGradient="linear(to-br, teal.800, teal.500)"
      py={12}
      px={{ base: 4, md: 8 }}
    >
      <Box
        maxW="6xl"
        mx="auto"
        bg="rgba(255, 255, 255, 0.95)"
        borderRadius="2xl"
        boxShadow="0 8px 32px rgba(0, 0, 0, 0.15)"
        p={{ base: 6, md: 10 }}
        sx={{
          animation: 'fadeIn 0.6s ease-out',
          '@keyframes fadeIn': {
            from: { opacity: 0, transform: 'translateY(20px)' },
            to: { opacity: 1, transform: 'translateY(0)' },
          },
        }}
      >
        <VStack spacing={8} align="stretch">
          {/* Header Section */}
          <Flex
            justify="space-between"
            align="center"
            bg="teal.50"
            p={6}
            borderRadius="xl"
            boxShadow="0 4px 12px rgba(0, 0, 0, 0.05)"
          >
            <Heading
              size="xl"
              bgGradient="linear(to-r, teal.600, teal.400)"
              bgClip="text"
              fontWeight="extrabold"
            >
              Transactions
            </Heading>
            <Button
              bg="teal.600"
              color="white"
              borderRadius="full"
              leftIcon={<ArrowBackIcon />}
              _hover={{ bg: 'teal.500', transform: 'translateY(-2px)' }}
              size="lg"
              onClick={() => navigate('/dashboard')}
              transition="all 0.2s"
            >
              Back to Dashboard
            </Button>
          </Flex>

          {/* Main Layout with Sidebar */}
          <Flex direction={{ base: 'column', md: 'row' }} gap={6}>
            {/* Main Content (Manage Transactions and Transaction History) */}
            <Box flex="1">
              {/* Manage Transactions Form */}
              <Box
                bg="white"
                p={{ base: 6, md: 8 }}
                borderRadius="xl"
                boxShadow="0 6px 24px rgba(0, 0, 0, 0.1)"
                border="1px solid rgba(0, 128, 128, 0.2)"
                mb={6}
                _before={{
                  content: '""',
                  position: 'absolute',
                  top: '-12px',
                  left: '50%',
                  width: '30%',
                  height: '4px',
                  bgGradient: 'linear(to-r, teal.400, teal.600)',
                  transform: 'translateX(-50%)',
                  borderRadius: 'full',
                }}
              >
                <Text
                  fontSize={{ base: 'xl', md: '2xl' }}
                  fontWeight="bold"
                  mb={6}
                  color="teal.700"
                  bgGradient="linear(to-r, teal.600, teal.400)"
                  bgClip="text"
                >
                  Manage Transactions
                </Text>
                <form onSubmit={handleSubmit}>
                  <VStack spacing={5} align="stretch">
                    <FormControl isRequired>
                      <FormLabel color="teal.600" fontWeight="semibold" fontSize="sm">
                        Transaction Type
                      </FormLabel>
                      <RadioGroup
                        name="type"
                        value={formData.type}
                        onChange={handleTypeChange}
                        colorScheme="teal"
                      >
                        <HStack spacing={6}>
                          <Radio value="Debit" size="md">
                            <Text color="teal.700">Debit</Text>
                          </Radio>
                          <Radio value="Credit" size="md">
                            <Text color="teal.700">Credit</Text>
                          </Radio>
                        </HStack>
                      </RadioGroup>
                    </FormControl>
                    <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
                      <FormControl isRequired>
                        <FormLabel color="teal.600" fontWeight="semibold" fontSize="sm">
                          Amount
                        </FormLabel>
                        <InputGroup>
                          <InputLeftElement pointerEvents="none">
                            <AddIcon color="teal.400" />
                          </InputLeftElement>
                          <Input
                            type="number"
                            name="amount"
                            value={formData.amount}
                            onChange={handleChange}
                            placeholder="Enter amount"
                            step="0.01"
                            min="0"
                            bg="teal.50"
                            borderColor="teal.200"
                            focusBorderColor="teal.400"
                            borderRadius="lg"
                            size="md"
                            pl={10}
                            _hover={{ borderColor: 'teal.300' }}
                            _placeholder={{ color: 'teal.400' }}
                            sx={{
                              transition: 'all 0.2s',
                              _focus: { transform: 'scale(1.02)' },
                            }}
                          />
                        </InputGroup>
                      </FormControl>
                      <FormControl isRequired>
                        <FormLabel color="teal.600" fontWeight="semibold" fontSize="sm">
                          Date
                        </FormLabel>
                        <InputGroup>
                          <InputLeftElement pointerEvents="none">
                            <CalendarIcon color="teal.400" />
                          </InputLeftElement>
                          <Input
                            type="date"
                            name="transaction_date"
                            value={formData.transaction_date}
                            onChange={handleChange}
                            bg="teal.50"
                            borderColor="teal.200"
                            focusBorderColor="teal.400"
                            borderRadius="lg"
                            size="md"
                            pl={10}
                            _hover={{ borderColor: 'teal.300' }}
                            sx={{
                              transition: 'all 0.2s',
                              _focus: { transform: 'scale(1.02)' },
                            }}
                          />
                        </InputGroup>
                      </FormControl>
                    </SimpleGrid>
                    <FormControl isRequired>
                      <FormLabel color="teal.600" fontWeight="semibold" fontSize="sm">
                        Description
                      </FormLabel>
                      <InputGroup>
                        <InputLeftElement pointerEvents="none">
                          <InfoIcon color="teal.400" />
                        </InputLeftElement>
                        <Input
                          type="text"
                          name="description"
                          value={formData.description}
                          onChange={handleChange}
                          placeholder="Enter description"
                          bg="teal.50"
                          borderColor="teal.200"
                          focusBorderColor="teal.400"
                          borderRadius="lg"
                          size="md"
                          pl={10}
                          _hover={{ borderColor: 'teal.300' }}
                          _placeholder={{ color: 'teal.400' }}
                          sx={{
                            transition: 'all 0.2s',
                            _focus: { transform: 'scale(1.02)' },
                          }}
                        />
                      </InputGroup>
                    </FormControl>
                    <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
                      <FormControl>
                        <FormLabel color="teal.600" fontWeight="semibold" fontSize="sm">
                          Savings Goal (Optional)
                        </FormLabel>
                        <Select
                          name="goal_id"
                          value={formData.goal_id}
                          onChange={handleChange}
                          placeholder="Select savings goal"
                          bg="teal.50"
                          borderColor="teal.200"
                          focusBorderColor="teal.400"
                          borderRadius="lg"
                          size="md"
                          _hover={{ borderColor: 'teal.300' }}
                          sx={{
                            transition: 'all 0.2s',
                            _focus: { transform: 'scale(1.02)' },
                          }}
                        >
                          {goals.map((goal) => (
                            <option key={goal.id} value={goal.id}>
                              {goal.name}
                            </option>
                          ))}
                        </Select>
                      </FormControl>
                      <FormControl>
                        <FormLabel color="teal.600" fontWeight="semibold" fontSize="sm">
                          Budget (Optional)
                        </FormLabel>
                        <Select
                          name="budget_id"
                          value={formData.budget_id}
                          onChange={handleChange}
                          placeholder="Select budget"
                          bg="teal.50"
                          borderColor="teal.200"
                          focusBorderColor="teal.400"
                          borderRadius="lg"
                          size="md"
                          _hover={{ borderColor: 'teal.300' }}
                          sx={{
                            transition: 'all 0.2s',
                            _focus: { transform: 'scale(1.02)' },
                          }}
                        >
                          {budgets.map((budget) => (
                            <option key={budget.id} value={budget.id}>
                              {budget.category}
                            </option>
                          ))}
                        </Select>
                      </FormControl>
                    </SimpleGrid>
                    <Button
                      type="submit"
                      bg="teal.600"
                      color="white"
                      borderRadius="full"
                      size="lg"
                      width="full"
                      isLoading={loading}
                      loadingText="Adding..."
                      _hover={{ bg: 'teal.500', transform: 'scale(1.05)' }}
                      transition="all 0.2s"
                      mt={4}
                    >
                      Add Transaction
                    </Button>
                  </VStack>
                </form>
              </Box>

              {/* Transaction History */}
              <Box
                bg="teal.50"
                p={4}
                borderRadius="lg"
                overflowX="auto"
                sx={{
                  '&::-webkit-scrollbar': {
                    height: '8px',
                  },
                  '&::-webkit-scrollbar-track': {
                    background: 'teal.100',
                    borderRadius: '4px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: 'teal.400',
                    borderRadius: '4px',
                  },
                  '&::-webkit-scrollbar-thumb:hover': {
                    background: 'teal.500',
                  },
                }}
              >
                <Text
                  fontSize="lg"
                  fontWeight="bold"
                  mb={4}
                  color="teal.700"
                  bgGradient="linear(to-r, teal.600, teal.400)"
                  bgClip="text"
                >
                  Transaction History
                </Text>
                {transactions.length === 0 ? (
                  <Text
                    color="teal.600"
                    fontStyle="italic"
                    textAlign="center"
                    py={4}
                  >
                    No transactions available.
                  </Text>
                ) : (
                  <Table variant="simple" size="sm">
                    <Thead bg="teal.600">
                      <Tr>
                        <Th color="white" textAlign="center" p={2} fontSize="xs">
                          Date
                        </Th>
                        <Th color="white" textAlign="center" p={2} fontSize="xs">
                          Description
                        </Th>
                        <Th color="white" textAlign="center" p={2} fontSize="xs">
                          Amount
                        </Th>
                        <Th color="white" textAlign="center" p={2} fontSize="xs">
                          Type
                        </Th>
                        <Th color="white" textAlign="center" p={2} fontSize="xs">
                          Goal
                        </Th>
                        <Th color="white" textAlign="center" p={2} fontSize="xs">
                          Budget
                        </Th>
                        <Th color="white" textAlign="center" p={2} fontSize="xs">
                          Action
                        </Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {transactions.map((transaction, idx) => (
                        <ScaleFade
                          key={transaction.id}
                          initialScale={0.95}
                          in={true}
                          delay={idx * 0.03}
                        >
                          <Tr
                            _hover={{ bg: 'teal.100' }}
                            transition="all 0.2s"
                          >
                            <Td textAlign="center" fontSize="xs" py={2}>
                              {new Date(
                                transaction.transaction_date
                              ).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </Td>
                            <Td textAlign="center" fontSize="xs" py={2}>
                              {transaction.description || '-'}
                            </Td>
                            <Td textAlign="center" fontSize="xs" py={2}>
                              ${Math.abs(transaction.amount).toFixed(2)}
                            </Td>
                            <Td textAlign="center" fontSize="xs" py={2}>
                              {transaction.amount < 0 ? 'Debit' : 'Credit'}
                            </Td>
                            <Td textAlign="center" fontSize="xs" py={2}>
                              {transaction.goal_name || '-'}
                            </Td>
                            <Td textAlign="center" fontSize="xs" py={2}>
                              {transaction.budget_category || '-'}
                            </Td>
                            <Td textAlign="center" fontSize="xs" py={2}>
                              <IconButton
                                icon={<DeleteIcon />}
                                colorScheme="red"
                                size="xs"
                                onClick={() => handleDelete(transaction.id)}
                                borderRadius="full"
                                _hover={{ transform: 'scale(1.2)' }}
                                transition="all 0.2s"
                                bg="red.500"
                                color="white"
                                p={1}
                              />
                            </Td>
                          </Tr>
                        </ScaleFade>
                      ))}
                    </Tbody>
                  </Table>
                )}
              </Box>
            </Box>

            {/* AI Categorization Sidebar */}
            <Box
              as="aside"
              w={{ base: 'full', md: '300px' }}
              bg="teal.50"
              p={4}
              borderRadius="lg"
              boxShadow="0 4px 12px rgba(0, 0, 0, 0.05)"
              border="1px solid rgba(0, 128, 128, 0.2)"
              overflowY="auto"
              maxH={{ base: 'none', md: 'calc(100vh - 200px)' }}
              position={{ base: 'relative', md: 'sticky' }}
              top={{ md: '20' }}
              display={{ base: isSidebarOpen ? 'block' : 'none', md: 'block' }}
            >
              <Flex
                justify="space-between"
                align="center"
                mb={4}
                display={{ md: 'none' }}
              >
                <Heading
                  size="md"
                  bgGradient="linear(to-r, teal.600, teal.400)"
                  bgClip="text"
                  fontWeight="extrabold"
                >
                  AI Categorization
                </Heading>
                <IconButton
                  icon={<HamburgerIcon />}
                  colorScheme="teal"
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  borderRadius="full"
                  aria-label="Toggle Sidebar"
                />
              </Flex>
              {transactions.length === 0 ? (
                <Text
                  color="teal.600"
                  fontStyle="italic"
                  textAlign="center"
                  py={4}
                >
                  No transactions to categorize.
                </Text>
              ) : (
                <VStack spacing={3} align="stretch">
                  {transactions.map((transaction, idx) => (
                    <ScaleFade
                      key={transaction.id}
                      initialScale={0.9}
                      in={true}
                      delay={idx * 0.03}
                    >
                      <Box
                        p={3}
                        bg="white"
                        borderRadius="md"
                        boxShadow="0 2px 6px rgba(0, 0, 0, 0.05)"
                        _hover={{
                          bg: 'teal.100',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                        }}
                        transition="all 0.2s"
                      >
                        <Text
                          fontWeight="semibold"
                          color="teal.700"
                          fontSize="sm"
                          mb={1}
                        >
                          {transaction.description}
                        </Text>
                        <Text color="teal.600" fontSize="xs">
                          AI Category: {transaction.ai_category}
                        </Text>
                        <Text
                          color={transaction.amount < 0 ? 'red.500' : 'teal.600'}
                          fontSize="xs"
                        >
                          Amount: ${Math.abs(transaction.amount).toFixed(2)}
                        </Text>
                        <Text color="teal.600" fontSize="xs">
                          Type: {transaction.amount < 0 ? 'Debit' : 'Credit'}
                        </Text>
                      </Box>
                    </ScaleFade>
                  ))}
                </VStack>
              )}
            </Box>
          </Flex>

          {/* Mobile Drawer for Sidebar */}
          <Drawer
            isOpen={isSidebarOpen}
            placement="right"
            onClose={() => setIsSidebarOpen(false)}
            size="xs"
          >
            <DrawerOverlay />
            <DrawerContent bg="teal.50" borderLeft="1px solid rgba(0, 128, 128, 0.2)">
              <DrawerHeader borderBottomWidth="1px" bg="teal.600" color="white">
                AI Categorization
                <DrawerCloseButton color="white" />
              </DrawerHeader>
              <DrawerBody p={4}>
                {transactions.length === 0 ? (
                  <Text
                    color="teal.600"
                    fontStyle="italic"
                    textAlign="center"
                    py={4}
                  >
                    No transactions to categorize.
                  </Text>
                ) : (
                  <VStack spacing={3} align="stretch">
                    {transactions.map((transaction, idx) => (
                      <ScaleFade
                        key={transaction.id}
                        initialScale={0.9}
                        in={true}
                        delay={idx * 0.03}
                      >
                        <Box
                          p={3}
                          bg="white"
                          borderRadius="md"
                          boxShadow="0 2px 6px rgba(0, 0, 0, 0.05)"
                          _hover={{
                            bg: 'teal.100',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                          }}
                          transition="all 0.2s"
                        >
                          <Text
                            fontWeight="semibold"
                            color="teal.700"
                            fontSize="sm"
                            mb={1}
                          >
                            {transaction.description}
                          </Text>
                          <Text color="teal.600" fontSize="xs">
                            AI Category: {transaction.ai_category}
                          </Text>
                          <Text
                            color={transaction.amount < 0 ? 'red.500' : 'teal.600'}
                            fontSize="xs"
                          >
                            Amount: ${Math.abs(transaction.amount).toFixed(2)}
                          </Text>
                          <Text color="teal.600" fontSize="xs">
                            Type: {transaction.amount < 0 ? 'Debit' : 'Credit'}
                          </Text>
                        </Box>
                      </ScaleFade>
                    ))}
                  </VStack>
                )}
              </DrawerBody>
            </DrawerContent>
          </Drawer>
        </VStack>
      </Box>
    </Box>
  );
};

export default Transactions;