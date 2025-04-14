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
  Icon,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  Badge,
  IconButton,
  useDisclosure,
} from '@chakra-ui/react';
import {
  CheckCircleIcon,
  StarIcon,
  CalendarIcon,
  CheckIcon,
  BellIcon,
} from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '@chakra-ui/toast';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const Dashboard = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const username = localStorage.getItem('username') || 'User';
  const [goals, setGoals] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [transactions, setTransactions] = useState([]);
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

  // Icon mapping for achievements
  const iconMap = {
    CheckCircleIcon,
    StarIcon,
    CalendarIcon,
    CheckIcon,
  };

  // Compute balance trend data from transactions
  const computeBalanceTrend = (transactions) => {
    if (!transactions || transactions.length === 0) {
      return {
        labels: [new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short' })],
        datasets: [
          {
            label: 'Balance',
            data: [0],
            borderColor: 'cyan.400',
            backgroundColor: 'rgba(0, 188, 212, 0.2)',
            borderWidth: 2,
            tension: 0.4,
            pointRadius: 4,
            pointBackgroundColor: 'cyan.500',
          },
        ],
      };
    }

    // Sort transactions by date
    const sortedTransactions = [...transactions].sort(
      (a, b) => new Date(a.transaction_date) - new Date(b.transaction_date)
    );

    // Determine date range (last 30 days or transaction range)
    const today = new Date();
    const earliestDate = sortedTransactions.length
      ? new Date(sortedTransactions[0].transaction_date)
      : new Date(today.setDate(today.getDate() - 30));
    const startDate = new Date(
      Math.min(earliestDate, new Date(today.setDate(today.getDate() - 30)))
    );
    const endDate = new Date();

    // Generate daily balance points
    const balances = [];
    const labels = [];
    let currentBalance = 0;

    // Create a map of transactions by date
    const transactionsByDate = sortedTransactions.reduce((acc, t) => {
      const dateStr = new Date(t.transaction_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      if (!acc[dateStr]) acc[dateStr] = 0;
      acc[dateStr] += parseFloat(t.amount);
      return acc;
    }, {});

    // Iterate through each day in the range
    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      const dateStr = d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      const label = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
      currentBalance += transactionsByDate[dateStr] || 0;
      labels.push(label);
      balances.push(currentBalance);
    }

    // Simplify labels to avoid clutter (e.g., show every 5th day)
    const simplifiedLabels = labels.reduce((acc, label, idx) => {
      if (labels.length <= 10 || idx % Math.ceil(labels.length / 10) === 0) {
        acc.push(label);
      } else {
        acc.push('');
      }
      return acc;
    }, []);

    return {
      labels: simplifiedLabels,
      datasets: [
        {
          label: 'Balance',
          data: balances,
          borderColor: 'cyan.400',
          backgroundColor: 'rgba(0, 188, 212, 0.2)',
          borderWidth: 2,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: 'cyan.500',
        },
      ],
    };
  };

  // Chart options
  const balanceTrendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: false },
      tooltip: {
        enabled: true,
        callbacks: {
          label: (context) => `$${context.parsed.y.toFixed(2)}`,
        },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: 'gray.300' } },
      y: {
        grid: { color: 'gray.600', borderColor: 'gray.600' },
        ticks: {
          color: 'gray.300',
          callback: (value) => `$${value.toFixed(0)}`,
        },
        min: transactions.length
          ? Math.min(...computeBalanceTrend(transactions).datasets[0].data) * 1.1
          : 0,
        max: transactions.length
          ? Math.max(...computeBalanceTrend(transactions).datasets[0].data) * 1.1
          : 1000,
      },
    },
  };

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [goalsResponse, budgetsResponse, achievementsResponse, notificationsResponse, transactionsResponse] =
          await Promise.all([
            axios.get('http://localhost:5001/savings-goals', {
              headers: { 'X-Username': username },
            }),
            axios.get('http://localhost:5001/budgets', {
              headers: { 'X-Username': username },
            }),
            axios.get('http://localhost:5001/achievements', {
              headers: { 'X-Username': username },
            }),
            axios.get('http://localhost:5001/notifications', {
              headers: { 'X-Username': username },
            }),
            axios.get('http://localhost:5001/transactions', {
              headers: { 'X-Username': username },
            }),
          ]);

        const formattedGoals = goalsResponse.data.goals.map((goal) => ({
          ...goal,
          target_amount: parseFloat(goal.target_amount),
          current_amount: parseFloat(goal.current_amount),
        }));
        setGoals(formattedGoals);

        setBudgets(
          budgetsResponse.data.budgets.map((b) => ({
            ...b,
            budget_amount: parseFloat(b.budget_amount),
            spent_amount: parseFloat(b.spent_amount),
          }))
        );

        setAchievements(achievementsResponse.data.achievements);
        setNotifications(notificationsResponse.data.notifications);
        setTransactions(transactionsResponse.data.transactions);
      } catch (error) {
        toast({
          title: 'Error',
          description: error.response?.data?.error || 'Failed to fetch data.',
          status: 'error',
          duration: 3000,
          isClosable: true,
          position: 'top-right',
        });
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
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
        position: 'top-right',
      });
      setGoalForm({ name: '', target_amount: '', deadline: '' });
      const response = await axios.get('http://localhost:5001/savings-goals', {
        headers: { 'X-Username': username },
      });
      const formattedGoals = response.data.goals.map((goal) => ({
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
        position: 'top-right',
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
        position: 'top-right',
      });
      setBudgetForm({ category: '', amount: '' });
      const response = await axios.get('http://localhost:5001/budgets', {
        headers: { 'X-Username': username },
      });
      setBudgets(
        response.data.budgets.map((b) => ({
          ...b,
          budget_amount: parseFloat(b.budget_amount),
          spent_amount: parseFloat(b.spent_amount),
        }))
      );
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to create budget.',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top-right',
      });
    }
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('username');
    localStorage.removeItem('user_id');
    navigate('/login');
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // Calculate current balance and percentage change
  const balanceTrendData = computeBalanceTrend(transactions);
  const currentBalance = balanceTrendData.datasets[0].data.slice(-1)[0] || 0;
  const previousBalance =
    balanceTrendData.datasets[0].data.slice(-2, -1)[0] || currentBalance || 1;
  const percentageChange = ((currentBalance - previousBalance) / previousBalance) * 100;
  const changeText = `${percentageChange < 0 ? '' : '+'}${percentageChange.toFixed(0)}%`;
  const changeColor = percentageChange < 0 ? 'red.400' : 'green.400';

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
            from: { opacity: 0, transform: 'translateY(10px)' },
            to: { opacity: 1, transform: 'translateY(0)' },
          },
        }}
      >
        <VStack spacing={10} align="stretch">
          {/* Header Section */}
          <Flex
            justify="space-between"
            align="center"
            bg="teal.50"
            p={6}
            borderRadius="xl"
            boxShadow="sm"
          >
            <Heading
              size="xl"
              bgGradient="linear(to-r, teal.600, teal.400)"
              bgClip="text"
              fontWeight="extrabold"
            >
              Hello, {username}!
            </Heading>
            <Flex align="center" gap={4}>
              <Box position="relative">
                <IconButton
                  icon={<BellIcon w={6} h={6} />}
                  bg="teal.600"
                  color="white"
                  borderRadius="full"
                  _hover={{
                    bg: 'teal.500',
                    sx: {
                      animation: 'pulse 0.3s',
                      '@keyframes pulse': {
                        '0%': { transform: 'scale(1)' },
                        '50%': { transform: 'scale(1.05)' },
                        '100%': { transform: 'scale(1)' },
                      },
                    },
                  }}
                  onClick={onOpen}
                  aria-label="Notifications"
                  size="lg"
                />
                {unreadCount > 0 && (
                  <Badge
                    position="absolute"
                    top="-2"
                    right="-2"
                    borderRadius="full"
                    bg="red.500"
                    color="white"
                    fontSize="0.9em"
                    px={2}
                    py={1}
                  >
                    {unreadCount}
                  </Badge>
                )}
              </Box>
              <Button
                bg="teal.600"
                color="white"
                borderRadius="full"
                _hover={{ bg: 'teal.500', transform: 'translateY(-2px)' }}
                size="lg"
                onClick={handleLogout}
                transition="all 0.2s"
              >
                Log Out
              </Button>
            </Flex>
          </Flex>

          {/* Notification Drawer */}
          <Drawer isOpen={isOpen} placement="right" onClose={onClose}>
            <DrawerOverlay bg="rgba(0, 0, 0, 0.4)" />
            <DrawerContent
              bg="white"
              borderLeft="1px solid rgba(0, 128, 128, 0.2)"
            >
              <DrawerCloseButton color="teal.600" />
              <DrawerHeader
                borderBottomWidth="1px"
                borderColor="teal.100"
                color="teal.700"
                fontSize="xl"
              >
                Notifications
              </DrawerHeader>
              <DrawerBody>
                {notifications.filter((n) => !n.is_read).length === 0 ? (
                  <Text color="teal.500" fontStyle="italic">
                    No unread notifications.
                  </Text>
                ) : (
                  <VStack spacing={4} align="stretch">
                    {notifications
                      .filter((n) => !n.is_read)
                      .map((not) => (
                        <Box
                          key={not.id}
                          p={4}
                          bg="teal.50"
                          borderRadius="lg"
                          boxShadow="0 4px 12px rgba(0, 0, 0, 0.1)"
                          _hover={{ bg: 'teal.100', transform: 'translateY(-2px)' }}
                          transition="all 0.2s"
                        >
                          <Text fontWeight="semibold" color="teal.800">
                            {not.message}
                          </Text>
                          <Text fontSize="sm" color="teal.600" mt={1}>
                            {new Date(not.created_at).toLocaleString()}
                          </Text>
                          <Badge
                            colorScheme={
                              not.type === 'budget'
                                ? 'red'
                                : not.type === 'savings'
                                ? 'green'
                                : 'teal'
                            }
                            mt={2}
                            fontSize="0.9em"
                          >
                            {not.type.charAt(0).toUpperCase() + not.type.slice(1)}
                          </Badge>
                        </Box>
                      ))}
                  </VStack>
                )}
                <Button
                  colorScheme="teal"
                  size="md"
                  mt={6}
                  w="full"
                  borderRadius="full"
                  onClick={() => {
                    onClose();
                    navigate('/notifications');
                  }}
                >
                  View All Notifications
                </Button>
              </DrawerBody>
            </DrawerContent>
          </Drawer>

          {/* Main Content */}
          <VStack spacing={8} align="stretch">
            {/* Balance Trend Graph */}
            <Box
              bg="gray.700"
              p={{ base: 4, md: 6 }}
              borderRadius="xl"
              boxShadow="0 4px 20px rgba(0, 0, 0, 0.3)"
              textAlign="center"
              sx={{
                animation: 'fadeIn 0.6s ease-out',
                '@keyframes fadeIn': {
                  from: { opacity: 0, transform: 'translateY(10px)' },
                  to: { opacity: 1, transform: 'translateY(0)' },
                },
              }}
            >
              <Text
                fontSize={{ base: 'md', md: 'lg' }}
                color="gray.300"
                fontWeight="semibold"
                mb={2}
              >
                Balance Trend
              </Text>
              <Flex
                justify="space-between"
                align="center"
                mb={4}
                flexDirection={{ base: 'column', md: 'row' }}
              >
                <Text
                  fontSize={{ base: 'xl', md: '2xl' }}
                  color="white"
                  fontWeight="bold"
                  textShadow="0 1px 2px rgba(0, 0, 0, 0.3)"
                >
                  ${currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </Text>
                <Text
                  color={changeColor}
                  fontSize={{ base: 'md', md: 'lg' }}
                  fontWeight="semibold"
                  textShadow="0 1px 2px rgba(0, 0, 0, 0.3)"
                >
                  vs past period {changeText}
                </Text>
              </Flex>
              <Box h={{ base: '200px', md: '250px' }}>
                <Line data={balanceTrendData} options={balanceTrendOptions} />
              </Box>
              <Button
                mt={4}
                colorScheme="teal"
                variant="outline"
                borderRadius="full"
                size="sm"
                onClick={() => navigate('/financial-overview')}
              >
                Show More
              </Button>
            </Box>

            {/* Manage Transactions Card */}
            <Box
              bg="teal.600"
              p={{ base: 6, md: 8 }}
              borderRadius="xl"
              boxShadow="0 6px 24px rgba(0, 0, 0, 0.2)"
              border="2px solid"
              borderColor="teal.400"
              textAlign="center"
              sx={{
                animation: 'fadeInUp 0.6s ease-out',
                '@keyframes fadeInUp': {
                  from: { opacity: 0, transform: 'translateY(20px)' },
                  to: { opacity: 1, transform: 'translateY(0)' },
                },
              }}
            >
              <Heading
                size={{ base: 'lg', md: 'xl' }}
                color="white"
                mb={4}
                fontWeight="extrabold"
              >
                Manage Your Transactions
              </Heading>
              <Text
                color="teal.50"
                fontSize={{ base: 'md', md: 'lg' }}
                mb={6}
                maxW="lg"
                mx="auto"
              >
                Track, add, and categorize your transactions to stay in control of your finances.
              </Text>
              <Button
                bg="white"
                color="teal.700"
                size="lg"
                borderRadius="full"
                onClick={() => navigate('/transactions')}
                _hover={{ bg: 'teal.50', transform: 'scale(1.05)' }}
                _active={{ bg: 'teal.100' }}
                transition="all 0.2s"
                px={8}
                fontWeight="bold"
              >
                Go to Transactions
              </Button>
            </Box>

            {/* Grid for Other Sections */}
            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8}>
              {/* Left Column: Achievements and Navigation */}
              <VStack spacing={8} align="stretch">
                {/* Achievements Section */}
                <Box
                  bg="white"
                  p={6}
                  borderRadius="xl"
                  boxShadow="0 4px 20px rgba(0, 0, 0, 0.1)"
                  border="1px solid rgba(0, 128, 128, 0.2)"
                >
                  <Text
                    fontSize="2xl"
                    fontWeight="bold"
                    mb={6}
                    color="teal.700"
                    bgGradient="linear(to-r, teal.600, teal.400)"
                    bgClip="text"
                  >
                    Achievements
                  </Text>
                  {achievements.length === 0 ? (
                    <Text color="teal.500" fontStyle="italic">
                      No achievements yet. Keep budgeting to earn badges!
                    </Text>
                  ) : (
                    <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
                      {achievements.map((achievement, index) => {
                        const gradients = [
                          'linear(to-r, blue.400, sky.500)',
                          'linear(to-r, green.400, lime.500)',
                          'linear(to-r, orange.400, yellow.500)',
                          'linear(to-r, purple.400, violet.500)',
                        ];
                        const gradient = gradients[index % gradients.length];
                        return (
                          <Box
                            key={achievement.name}
                            p={4}
                            bg={gradient}
                            borderRadius="lg"
                            boxShadow="0 4px 12px rgba(0, 0, 0, 0.1)"
                            textAlign="center"
                            _hover={{
                              transform: 'scale(1.05)',
                              filter: 'brightness(1.1)',
                              boxShadow: '0 6px 24px rgba(0, 0, 0, 0.2)',
                            }}
                            transition="all 0.3s"
                            sx={{
                              animation: `fadeIn 0.5s ease-out ${index * 0.1}s both`,
                              '@keyframes fadeIn': {
                                from: { opacity: 0, transform: 'translateY(10px)' },
                                to: { opacity: 1, transform: 'translateY(0)' },
                              },
                            }}
                          >
                            <Box
                              p={3}
                              bg="rgba(255, 255, 255, 0.9)"
                              borderRadius="md"
                              mb={3}
                            >
                              <Icon
                                as={iconMap[achievement.icon] || StarIcon}
                                w={10}
                                h={10}
                                color="black"
                                _hover={{
                                  color: 'gray.700',
                                  sx: {
                                    animation: 'pulse 0.5s',
                                    '@keyframes pulse': {
                                      '0%': { transform: 'scale(1)' },
                                      '50%': { transform: 'scale(1.05)' },
                                      '100%': { transform: 'scale(1)' },
                                    },
                                  },
                                }}
                              />
                            </Box>
                            <Text
                              fontWeight="bold"
                              color="black"
                              textShadow="none"
                            >
                              {achievement.name}
                            </Text>
                            <Text
                              fontSize="sm"
                              color="black"
                              textShadow="none"
                            >
                              {achievement.description}
                            </Text>
                            <Text
                              fontSize="xs"
                              color="black"
                              mt={2}
                              textShadow="none"
                            >
                              Earned: {new Date(achievement.earned_at).toLocaleDateString()}
                            </Text>
                          </Box>
                        );
                      })}
                    </SimpleGrid>
                  )}
                </Box>

                {/* Navigation Section */}
                <Box
                  bg="white"
                  p={6}
                  borderRadius="xl"
                  boxShadow="0 4px 20px rgba(0, 0, 0, 0.1)"
                  border="1px solid rgba(0, 128, 128, 0.2)"
                >
                  <Text
                    fontSize="xl"
                    fontWeight="bold"
                    mb={4}
                    color="teal.700"
                    bgGradient="linear(to-r, teal.600, teal.400)"
                    bgClip="text"
                  >
                    Explore More
                  </Text>
                  <VStack spacing={3}>
                    {[
                      { label: 'Financial Overview', path: '/financial-overview' },
                      { label: 'All Notifications', path: '/notifications' },
                    ].map((item, index) => (
                      <Button
                        key={item.label}
                        bg="teal.600"
                        color="white"
                        size="lg"
                        borderRadius="full"
                        onClick={() => navigate(item.path)}
                        _hover={{ bg: 'teal.500', transform: 'translateY(-2px)' }}
                        transition="all 0.2s"
                        sx={{
                          animation: `fadeIn 0.5s ease-out ${0.2 + index * 0.1}s both`,
                          '@keyframes fadeIn': {
                            from: { opacity: 0, transform: 'translateY(10px)' },
                            to: { opacity: 1, transform: 'translateY(0)' },
                          },
                        }}
                        w="full"
                      >
                        {item.label}
                      </Button>
                    ))}
                  </VStack>
                </Box>
              </VStack>

              {/* Right Column: Goals and Budgets */}
              <VStack spacing={8} align="stretch">
                {/* Savings Goals Section */}
                <Box
                  bg="white"
                  p={6}
                  borderRadius="xl"
                  boxShadow="0 4px 20px rgba(0, 0, 0, 0.1)"
                  border="1px solid rgba(0, 128, 128, 0.2)"
                >
                  <Text
                    fontSize="2xl"
                    fontWeight="bold"
                    mb={6}
                    color="teal.700"
                    bgGradient="linear(to-r, teal.600, teal.400)"
                    bgClip="text"
                  >
                    Savings Goals
                  </Text>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                    <Box>
                      <Text fontWeight="bold" mb={4} color="teal.700" fontSize="lg">
                        Create a New Goal
                      </Text>
                      <form onSubmit={handleGoalSubmit}>
                        <VStack spacing={5}>
                          <FormControl isRequired>
                            <FormLabel color="teal.600">Goal Name</FormLabel>
                            <Input
                              name="name"
                              value={goalForm.name}
                              onChange={handleGoalChange}
                              placeholder="e.g., Vacation Fund"
                              bg="teal.50"
                              border="1px solid teal.200"
                              color="teal.800"
                              focusBorderColor="teal.400"
                              borderRadius="lg"
                              size="lg"
                              _placeholder={{ color: 'teal.400' }}
                            />
                          </FormControl>
                          <FormControl isRequired>
                            <FormLabel color="teal.600">Target Amount ($)</FormLabel>
                            <Input
                              type="number"
                              name="target_amount"
                              value={goalForm.target_amount}
                              onChange={handleGoalChange}
                              placeholder="e.g., 5000"
                              bg="teal.50"
                              border="1px solid teal.200"
                              color="teal.800"
                              focusBorderColor="teal.400"
                              borderRadius="lg"
                              size="lg"
                              _placeholder={{ color: 'teal.400' }}
                            />
                          </FormControl>
                          <FormControl>
                            <FormLabel color="teal.600">Deadline</FormLabel>
                            <Input
                              type="date"
                              name="deadline"
                              value={goalForm.deadline}
                              onChange={handleGoalChange}
                              bg="teal.50"
                              border="1px solid teal.200"
                              color="teal.800"
                              focusBorderColor="teal.400"
                              borderRadius="lg"
                              size="lg"
                              _placeholder={{ color: 'teal.400' }}
                            />
                          </FormControl>
                          <Button
                            type="submit"
                            bg="teal.600"
                            color="white"
                            w="full"
                            isLoading={loading}
                            size="lg"
                            borderRadius="full"
                            _hover={{ bg: 'teal.500', transform: 'translateY(-2px)' }}
                            transition="all 0.2s"
                          >
                            Add Goal
                          </Button>
                        </VStack>
                      </form>
                    </Box>
                    <Box>
                      <Text fontWeight="bold" mb={4} color="teal.700" fontSize="lg">
                        Your Goals
                      </Text>
                      {goals.length === 0 ? (
                        <Text color="teal.500" fontStyle="italic">
                          No savings goals yet.
                        </Text>
                      ) : (
                        <VStack spacing={4} align="stretch">
                          {goals.map((goal, index) => (
                            <Box
                              key={goal.id}
                              p={5}
                              bg="teal.50"
                              borderRadius="lg"
                              boxShadow="0 4px 12px rgba(0, 0, 0, 0.05)"
                              _hover={{ bg: 'teal.100', transform: 'translateY(-2px)' }}
                              transition="all 0.3s"
                              sx={{
                                animation: `fadeIn 0.5s ease-out ${index * 0.1}s both`,
                                '@keyframes fadeIn': {
                                  from: { opacity: 0, transform: 'translateY(10px)' },
                                  to: { opacity: 1, transform: 'translateY(0)' },
                                },
                              }}
                            >
                              <Text fontWeight="semibold" color="teal.700">
                                {goal.name}
                              </Text>
                              <Text color="teal.600">
                                Target: ${goal.target_amount.toFixed(2)} | Saved: $
                                {goal.current_amount.toFixed(2)}
                              </Text>
                              <Text color="teal.600">Deadline: {goal.deadline || 'None'}</Text>
                              <Progress
                                value={(goal.current_amount / goal.target_amount) * 100}
                                bg="teal.100"
                                colorScheme="teal"
                                size="md"
                                mt={3}
                                borderRadius="full"
                                hasStripe
                                isAnimated
                              />
                            </Box>
                          ))}
                        </VStack>
                      )}
                    </Box>
                  </SimpleGrid>
                </Box>

                {/* Budgets Section */}
                <Box
                  bg="white"
                  p={6}
                  borderRadius="xl"
                  boxShadow="0 4px 20px rgba(0, 0, 0, 0.1)"
                  border="1px solid rgba(0, 128, 128, 0.2)"
                >
                  <Text
                    fontSize="2xl"
                    fontWeight="bold"
                    mb={6}
                    color="teal.700"
                    bgGradient="linear(to-r, teal.600, teal.400)"
                    bgClip="text"
                  >
                    Budgets
                  </Text>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                    <Box>
                      <Text fontWeight="bold" mb={4} color="teal.700" fontSize="lg">
                        Create a New Budget
                      </Text>
                      <form onSubmit={handleBudgetSubmit}>
                        <VStack spacing={5}>
                          <FormControl isRequired>
                            <FormLabel color="teal.600">Category</FormLabel>
                            <Input
                              name="category"
                              value={budgetForm.category}
                              onChange={handleBudgetChange}
                              placeholder="e.g., Groceries"
                              bg="teal.50"
                              border="1px solid teal.200"
                              color="teal.800"
                              focusBorderColor="teal.400"
                              borderRadius="lg"
                              size="lg"
                              _placeholder={{ color: 'teal.400' }}
                            />
                          </FormControl>
                          <FormControl isRequired>
                            <FormLabel color="teal.600">Amount ($)</FormLabel>
                            <Input
                              type="number"
                              name="amount"
                              value={budgetForm.amount}
                              onChange={handleBudgetChange}
                              placeholder="e.g., 500"
                              bg="teal.50"
                              border="1px solid teal.200"
                              color="teal.800"
                              focusBorderColor="teal.400"
                              borderRadius="lg"
                              size="lg"
                              _placeholder={{ color: 'teal.400' }}
                            />
                          </FormControl>
                          <Button
                            type="submit"
                            bg="teal.600"
                            color="white"
                            w="full"
                            isLoading={loading}
                            size="lg"
                            borderRadius="full"
                            _hover={{ bg: 'teal.500', transform: 'translateY(-2px)' }}
                            transition="all 0.2s"
                          >
                            Add Budget
                          </Button>
                        </VStack>
                      </form>
                    </Box>
                    <Box>
                      <Text fontWeight="bold" mb={4} color="teal.700" fontSize="lg">
                        Your Budgets
                      </Text>
                      {budgets.length === 0 ? (
                        <Text color="teal.500" fontStyle="italic">
                          No budgets yet.
                        </Text>
                      ) : (
                        <VStack spacing={4} align="stretch">
                          {budgets.map((budget, index) => (
                            <Box
                              key={budget.id}
                              p={5}
                              bg="teal.50"
                              borderRadius="lg"
                              boxShadow="0 4px 12px rgba(0, 0, 0, 0.05)"
                              _hover={{ bg: 'teal.100', transform: 'translateY(-2px)' }}
                              transition="all 0.3s"
                              sx={{
                                animation: `fadeIn 0.5s ease-out ${index * 0.1}s both`,
                                '@keyframes fadeIn': {
                                  from: { opacity: 0, transform: 'translateY(10px)' },
                                  to: { opacity: 1, transform: 'translateY(0)' },
                                },
                              }}
                            >
                              <Text fontWeight="semibold" color="teal.700">
                                {budget.category}
                              </Text>
                              <Text color="teal.600">
                                Budget: ${budget.budget_amount.toFixed(2)} | Spent: $
                                {Math.abs(budget.spent_amount).toFixed(2)} | Remaining: $
                                {(budget.budget_amount - Math.abs(budget.spent_amount)).toFixed(2)}
                              </Text>
                              <Progress
                                value={(Math.abs(budget.spent_amount) / budget.budget_amount) * 100}
                                bg="teal.100"
                                colorScheme={budget.spent_amount >= budget.budget_amount ? 'red' : 'teal'}
                                size="md"
                                mt={3}
                                borderRadius="full"
                                hasStripe
                                isAnimated
                              />
                            </Box>
                          ))}
                        </VStack>
                      )}
                    </Box>
                  </SimpleGrid>
                </Box>
              </VStack>
            </SimpleGrid>
          </VStack>
        </VStack>
      </Box>
    </Box>
  );
};

export default Dashboard;