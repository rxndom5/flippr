import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  Heading,
  Text,
  Button,
  Stat,
  StatLabel,
  StatNumber,
  Flex,
  Tooltip,
  List,
  ListItem,
  ListIcon,
  Progress,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  IconButton,
  useDisclosure,
  SimpleGrid,
  Avatar,
} from '@chakra-ui/react';
import {
  InfoIcon,
  CheckCircleIcon,
  ArrowForwardIcon,
  QuestionIcon,
} from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '@chakra-ui/react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip as ChartTooltip, Legend } from 'chart.js';

// Register Chart.js components
ChartJS.register(ArcElement, ChartTooltip, Legend);

const FinancialOverview = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const username = localStorage.getItem('username') || 'User';
  const [report, setReport] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [insightMessages, setInsightMessages] = useState([
    {
      type: 'bot',
      text: `Hello ${username}! Want to view your financial report?`,
    },
  ]);
  const [insightStep, setInsightStep] = useState(0);
  const [currentPrompt, setCurrentPrompt] = useState('View report');

  // Fetch transaction report
  useEffect(() => {
    const fetchReport = async () => {
      try {
        const reportResponse = await axios.get('http://localhost:5001/transaction-report', {
          headers: { 'X-Username': username },
        });
        setReport(reportResponse.data);
      } catch (error) {
        toast({
          title: 'Error',
          description: error.response?.data?.error || 'Failed to fetch report.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    };
    fetchReport();
  }, [username, toast]);

  // Parse AI insights into sections
  const parseInsights = (insights) => {
    const sections = {
      summary: '',
      observations: [],
      savingsGoals: [],
      budgetAdherence: [],
      advice: [],
    };
    const lines = insights.split('\n').filter(line => line.trim());
    let currentSection = null;

    lines.forEach(line => {
      if (line.startsWith('**Summary:**')) {
        currentSection = 'summary';
      } else if (line.startsWith('**Key Observations:**')) {
        currentSection = 'observations';
      } else if (line.startsWith('**Savings Goals:**')) {
        currentSection = 'savingsGoals';
      } else if (line.startsWith('**Budget Adherence:**')) {
        currentSection = 'budgetAdherence';
      } else if (line.startsWith('**Actionable Advice:**')) {
        currentSection = 'advice';
      } else if (currentSection) {
        if (currentSection === 'summary') {
          sections.summary += line + '\n';
        } else {
          sections[currentSection].push(line.replace(/^\d+\.\s*/, '').replace(/^\s*-\s*/, '').trim());
        }
      }
    });

    return sections;
  };

  // Handle insight progression
  const handleInsightResponse = (response) => {
    if (!report) return;

    const userMessage = { type: 'user', text: response };
    setInsightMessages((prev) => [...prev, userMessage]);

    const parsedInsights = parseInsights(report.ai_insights);
    let botMessage = null;

    switch (insightStep) {
      case 0:
        botMessage = {
          type: 'bot',
          text: `Here's your financial summary:\n${parsedInsights.summary.trim()}\n\nWould you like to see key observations?`,
        };
        setCurrentPrompt('Show observations');
        setInsightStep(1);
        break;
      case 1:
        botMessage = {
          type: 'bot',
          text: `Key observations:\n${parsedInsights.observations.join('\n')}\n\nWould you like to view your savings goals?`,
        };
        setCurrentPrompt('View savings goals');
        setInsightStep(2);
        break;
      case 2:
        botMessage = {
          type: 'bot',
          text: `Savings goals:\n${parsedInsights.savingsGoals.join('\n')}\n\nWould you like to check your budget adherence?`,
        };
        setCurrentPrompt('Check budget adherence');
        setInsightStep(3);
        break;
      case 3:
        botMessage = {
          type: 'bot',
          text: `Budget adherence:\n${parsedInsights.budgetAdherence.join('\n')}\n\nWould you like some actionable advice?`,
        };
        setCurrentPrompt('Get advice');
        setInsightStep(4);
        break;
      case 4:
        botMessage = {
          type: 'bot',
          text: `Actionable advice:\n${parsedInsights.advice.join('\n')}\n\nWould you like to review your report again?`,
        };
        setCurrentPrompt('Start over');
        setInsightStep(5);
        break;
      case 5:
        setInsightMessages([
          {
            type: 'bot',
            text: `Hello ${username}! Want to view your financial report?`,
          },
        ]);
        setCurrentPrompt('View report');
        setInsightStep(0);
        return;
      default:
        break;
    }

    if (botMessage) {
      setInsightMessages((prev) => [...prev, botMessage]);
    }
  };

  // Pie chart data for categories
  const getPieChartData = () => {
    if (!report || !report.categories) return { labels: [], datasets: [] };
    const labels = report.categories.map(cat => cat.name);
    const data = report.categories.map(cat => Math.abs(cat.amount));

    // Define an array of distinct colors for the pie chart
    const colorPalette = [
      'rgba(56, 178, 172, 0.7)',  // Teal
      'rgba(255, 99, 132, 0.7)',  // Red
      'rgba(255, 206, 86, 0.7)',  // Yellow
      'rgba(75, 192, 192, 0.7)',  // Cyan
      'rgba(153, 102, 255, 0.7)', // Purple
      'rgba(255, 159, 64, 0.7)',  // Orange
      'rgba(54, 162, 235, 0.7)',  // Blue
      'rgba(201, 203, 207, 0.7)', // Grey
    ];

    // Assign colors to categories, cycling through the palette if needed
    const colors = report.categories.map((_, index) =>
      colorPalette[index % colorPalette.length]
    );

    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: colors,
          borderColor: colors.map(c => c.replace('0.7', '1')),
          borderWidth: 1,
        },
      ],
    };
  };

  // Handle sending chat message for modal
  const handleSendMessage = async () => {
    if (!input.trim() || !report) return;

    const userMessage = { type: 'user', text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await axios.post(
        'http://localhost:5001/chat',
        { query: input, financialData: report },
        { headers: { 'X-Username': username } }
      );
      const botMessage = { type: 'bot', text: response.data.response };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      const errorMessage = { type: 'bot', text: 'Sorry, something went wrong. Try again!' };
      setMessages((prev) => [...prev, errorMessage]);
      toast({
        title: 'Chat Error',
        description: error.response?.data?.error || 'Failed to get response.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
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
              Financial Overview
            </Heading>
            <Button
              bg="teal.600"
              color="white"
              borderRadius="full"
              _hover={{ bg: 'teal.500', transform: 'translateY(-2px)' }}
              size="lg"
              onClick={() => navigate('/dashboard')}
              transition="all 0.2s"
            >
              Back to Dashboard
            </Button>
          </Flex>

          {/* Main Content Grid */}
          {report ? (
            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8}>
              {/* Left Column: Summary and Insights */}
              <VStack spacing={8} align="stretch">
                {/* Summary Section */}
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
                    Financial Summary
                  </Text>
                  <Text mb={4} color="teal.600">
                    {report.summary.period}
                  </Text>
                  <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={4}>
                    <Stat
                      bg="teal.50"
                      p={4}
                      borderRadius="lg"
                      boxShadow="0 4px 12px rgba(0, 0, 0, 0.05)"
                      _hover={{ transform: 'scale(1.02)' }}
                      transition="all 0.3s"
                      sx={{
                        animation: 'fadeIn 0.5s ease-out',
                        '@keyframes fadeIn': {
                          from: { opacity: 0, transform: 'translateY(10px)' },
                          to: { opacity: 1, transform: 'translateY(0)' },
                        },
                      }}
                    >
                      <StatLabel color="teal.600">
                        Income
                        <Tooltip label="Total money received">
                          <InfoIcon ml={1} color="teal.500" />
                        </Tooltip>
                      </StatLabel>
                      <StatNumber color="teal.700">
                        ${report.summary.total_income.toFixed(2)}
                      </StatNumber>
                    </Stat>
                    <Stat
                      bg="teal.50"
                      p={4}
                      borderRadius="lg"
                      boxShadow="0 4px 12px rgba(0, 0, 0, 0.05)"
                      _hover={{ transform: 'scale(1.02)' }}
                      transition="all 0.3s"
                      sx={{
                        animation: 'fadeIn 0.5s ease-out 0.1s both',
                        '@keyframes fadeIn': {
                          from: { opacity: 0, transform: 'translateY(10px)' },
                          to: { opacity: 1, transform: 'translateY(0)' },
                        },
                      }}
                    >
                      <StatLabel color="teal.600">
                        Expenses
                        <Tooltip label="Total money spent">
                          <InfoIcon ml={1} color="teal.500" />
                        </Tooltip>
                      </StatLabel>
                      <StatNumber color="red.500">
                        ${report.summary.total_expenses.toFixed(2)}
                      </StatNumber>
                    </Stat>
                    <Stat
                      bg="teal.50"
                      p={4}
                      borderRadius="lg"
                      boxShadow="0 4px 12px rgba(0, 0, 0, 0.05)"
                      _hover={{ transform: 'scale(1.02)' }}
                      transition="all 0.3s"
                      sx={{
                        animation: 'fadeIn 0.5s ease-out 0.2s both',
                        '@keyframes fadeIn': {
                          from: { opacity: 0, transform: 'translateY(10px)' },
                          to: { opacity: 1, transform: 'translateY(0)' },
                        },
                      }}
                    >
                      <StatLabel color="teal.600">
                        Net Balance
                        <Tooltip label="Income minus Expenses">
                          <InfoIcon ml={1} color="teal.500" />
                        </Tooltip>
                      </StatLabel>
                      <StatNumber
                        color={report.summary.net_balance >= 0 ? 'teal.700' : 'red.500'}
                      >
                        ${report.summary.net_balance.toFixed(2)}
                      </StatNumber>
                    </Stat>
                  </SimpleGrid>
                </Box>

                {/* Financial Insights Section */}
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
                    Financial Insights
                  </Text>
                  <VStack
                    spacing={4}
                    align="stretch"
                    maxH="400px"
                    overflowY="auto"
                    bg="teal.50"
                    borderRadius="lg"
                    p={4}
                    sx={{
                      '&::-webkit-scrollbar': {
                        width: '8px',
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
                    {insightMessages.map((msg, idx) => (
                      <Flex
                        key={idx}
                        direction={msg.type === 'user' ? 'row-reverse' : 'row'}
                        align="center"
                        gap={3}
                        sx={{
                          animation: `slideIn 0.4s ease-out ${idx * 0.1}s both`,
                          '@keyframes slideIn': {
                            from: {
                              opacity: 0,
                              transform:
                                msg.type === 'user'
                                  ? 'translateX(20px)'
                                  : 'translateX(-20px)',
                            },
                            to: { opacity: 1, transform: 'translateX(0)' },
                          },
                        }}
                      >
                        <Avatar
                          size="sm"
                          name={msg.type === 'user' ? username : 'Advisor'}
                          bg={msg.type === 'user' ? 'teal.500' : 'teal.300'}
                          color="white"
                          mt={msg.type === 'user' ? 0 : 2}
                        />
                        <Box
                          bg={msg.type === 'user' ? 'teal.600' : 'white'}
                          color={msg.type === 'user' ? 'white' : 'teal.700'}
                          p={4}
                          borderRadius={
                            msg.type === 'user'
                              ? '20px 20px 0 20px'
                              : '20px 20px 20px 0'
                          }
                          maxW="70%"
                          boxShadow="0 4px 12px rgba(0, 0, 0, 0.1)"
                          _hover={{
                            bg: msg.type === 'user' ? 'teal.700' : 'teal.50',
                            transform: 'translateY(-2px)',
                          }}
                          transition="all 0.2s"
                        >
                          <Text fontSize="md" whiteSpace="pre-wrap">
                            {msg.text}
                          </Text>
                        </Box>
                      </Flex>
                    ))}
                    {insightStep <= 5 && currentPrompt && (
                      <Flex justify="flex-start">
                        <Button
                          bg="teal.600"
                          color="white"
                          borderRadius="full"
                          size="sm"
                          onClick={() => handleInsightResponse(currentPrompt)}
                          _hover={{ bg: 'teal.500', transform: 'scale(1.05)' }}
                          transition="all 0.2s"
                          sx={{
                            animation: 'fadeIn 0.5s ease-out',
                            '@keyframes fadeIn': {
                              from: { opacity: 0, transform: 'translateY(10px)' },
                              to: { opacity: 1, transform: 'translateY(0)' },
                            },
                          }}
                        >
                          {currentPrompt}
                        </Button>
                      </Flex>
                    )}
                  </VStack>
                </Box>
              </VStack>

              {/* Right Column: Categories, Goals, Budgets */}
              <VStack spacing={8} align="stretch">
                {/* Spending by Category Section */}
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
                    Spending by Category
                  </Text>
                  {report.categories.length === 0 ? (
                    <Text color="teal.500" fontStyle="italic">
                      No transactions recorded.
                    </Text>
                  ) : (
                    <Box maxW="350px" mx="auto">
                      <Pie
                        data={getPieChartData()}
                        options={{
                          responsive: true,
                          plugins: {
                            legend: {
                              position: 'bottom',
                              labels: {
                                color: 'teal.700',
                                font: { size: 14 },
                              },
                            },
                            tooltip: {
                              backgroundColor: 'rgba(255, 255, 255, 0.95)',
                              titleColor: 'teal.700',
                              bodyColor: 'teal.600',
                              borderColor: 'teal.200',
                              borderWidth: 1,
                              callbacks: {
                                label: context =>
                                  `${context.label}: $${context.parsed.toFixed(2)}`,
                              },
                            },
                          },
                        }}
                      />
                    </Box>
                  )}
                </Box>

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
                  {report.goals.length === 0 ? (
                    <Text color="teal.500" fontStyle="italic">
                      No savings goals set.
                    </Text>
                  ) : (
                    <VStack spacing={4} align="stretch">
                      {report.goals.map((goal, idx) => (
                        <Box
                          key={idx}
                          p={5}
                          bg="teal.50"
                          borderRadius="lg"
                          boxShadow="0 4px 12px rgba(0, 0, 0, 0.05)"
                          _hover={{ bg: 'teal.100', transform: 'translateY(-2px)' }}
                          transition="all 0.3s"
                          sx={{
                            animation: `fadeIn 0.5s ease-out ${idx * 0.1}s both`,
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
                            ${goal.current.toFixed(2)} / ${goal.target.toFixed(2)}
                          </Text>
                          <Text fontSize="sm" color="teal.500">
                            Contributed: ${goal.contributed.toFixed(2)}
                          </Text>
                          <Progress
                            value={(goal.current / goal.target) * 100}
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
                  {report.budgets.length === 0 ? (
                    <Text color="teal.500" fontStyle="italic">
                      No budgets set.
                    </Text>
                  ) : (
                    <VStack spacing={4} align="stretch">
                      {report.budgets.map((budget, idx) => (
                        <Box
                          key={idx}
                          p={5}
                          bg="teal.50"
                          borderRadius="lg"
                          boxShadow="0 4px 12px rgba(0, 0, 0, 0.05)"
                          _hover={{ bg: 'teal.100', transform: 'translateY(-2px)' }}
                          transition="all 0.3s"
                          sx={{
                            animation: `fadeIn 0.5s ease-out ${idx * 0.1}s both`,
                            '@keyframes fadeIn': {
                              from: { opacity: 0, transform: 'translateY(10px)' },
                              to: { opacity: 1, transform: 'translateY(0)' },
                            },
                          }}
                        >
                          <Text fontWeight="semibold" color="teal.700">
                            {budget.category}
                          </Text>
                          <Text
                            color={budget.spent > budget.limit ? 'red.500' : 'teal.600'}
                          >
                            Spent ${budget.spent.toFixed(2)} / Limit ${budget.limit.toFixed(2)}
                          </Text>
                          <Progress
                            value={(budget.spent / budget.limit) * 100}
                            bg="teal.100"
                            colorScheme={budget.spent >= budget.limit ? 'red' : 'teal'}
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
              </VStack>
            </SimpleGrid>
          ) : (
            <Text
              color="teal.500"
              fontStyle="italic"
              textAlign="center"
              fontSize="lg"
              sx={{
                animation: 'fadeIn 0.5s ease-out',
                '@keyframes fadeIn': {
                  from: { opacity: 0, transform: 'translateY(10px)' },
                  to: { opacity: 1, transform: 'translateY(0)' },
                },
              }}
            >
              Loading report...
            </Text>
          )}

          {/* Chatbot Button */}
          <Button
            bg="teal.600"
            color="white"
            leftIcon={<QuestionIcon />}
            onClick={onOpen}
            position="fixed"
            bottom="6"
            right="6"
            zIndex="10"
            borderRadius="full"
            size="lg"
            _hover={{ bg: 'teal.500', transform: 'translateY(-2px)' }}
            transition="all 0.2s"
            sx={{
              animation: 'pulse 2s infinite',
              '@keyframes pulse': {
                '0%': { transform: 'scale(1)' },
                '50%': { transform: 'scale(1.05)' },
                '100%': { transform: 'scale(1)' },
              },
            }}
          >
            Chat with Advisor
          </Button>

          {/* Chatbot Modal */}
          <Modal isOpen={isOpen} onClose={onClose} size="xl">
            <ModalOverlay bg="rgba(0, 0, 0, 0.4)" />
            <ModalContent
              bg="white"
              borderRadius="2xl"
              boxShadow="0 8px 32px rgba(0, 0, 0, 0.15)"
              border="1px solid rgba(0, 128, 128, 0.2)"
              maxW="800px"
              mx={4}
            >
              <ModalHeader
                color="teal.700"
                bgGradient="linear(to-r, teal.600, teal.400)"
                bgClip="text"
                fontSize="2xl"
                py={6}
                textAlign="center"
              >
                Your Financial Advisor
              </ModalHeader>
              <ModalBody>
                <VStack
                  spacing={4}
                  align="stretch"
                  maxH="600px"
                  overflowY="auto"
                  p={6}
                  bg="teal.50"
                  borderRadius="lg"
                  sx={{
                    '&::-webkit-scrollbar': {
                      width: '8px',
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
                  {messages.length === 0 ? (
                    <Text
                      color="teal.500"
                      fontStyle="italic"
                      textAlign="center"
                      fontSize="lg"
                      py={4}
                      sx={{
                        animation: 'fadeIn 0.5s ease-out',
                        '@keyframes fadeIn': {
                          from: { opacity: 0, transform: 'translateY(10px)' },
                          to: { opacity: 1, transform: 'translateY(0)' },
                        },
                      }}
                    >
                      Ask me about your finances!
                    </Text>
                  ) : (
                    messages.map((msg, idx) => (
                      <Flex
                        key={idx}
                        direction={msg.type === 'user' ? 'row-reverse' : 'row'}
                        align="center"
                        gap={3}
                        sx={{
                          animation: `slideIn 0.4s ease-out ${idx * 0.1}s both`,
                          '@keyframes slideIn': {
                            from: {
                              opacity: 0,
                              transform:
                                msg.type === 'user'
                                  ? 'translateX(20px)'
                                  : 'translateX(-20px)',
                            },
                            to: { opacity: 1, transform: 'translateX(0)' },
                          },
                        }}
                      >
                        <Avatar
                          size="sm"
                          name={msg.type === 'user' ? username : 'Advisor'}
                          bg={msg.type === 'user' ? 'teal.500' : 'teal.300'}
                          color="white"
                          mt={msg.type === 'user' ? 0 : 2}
                        />
                        <Box
                          bg={msg.type === 'user' ? 'teal.600' : 'white'}
                          color={msg.type === 'user' ? 'white' : 'teal.700'}
                          p={4}
                          borderRadius={
                            msg.type === 'user'
                              ? '20px 20px 0 20px'
                              : '20px 20px 20px 0'
                          }
                          maxW="70%"
                          boxShadow="0 4px 12px rgba(0, 0, 0, 0.1)"
                          _hover={{
                            bg: msg.type === 'user' ? 'teal.700' : 'teal.50',
                            transform: 'translateY(-2px)',
                          }}
                          transition="all 0.2s"
                        >
                          <Text fontSize="md">{msg.text}</Text>
                        </Box>
                      </Flex>
                    ))
                  )}
                </VStack>
              </ModalBody>
              <ModalFooter bg="teal.50" borderBottomRadius="2xl" py={6}>
                <Input
                  placeholder="Type your question..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  isDisabled={loading || !report}
                  bg="white"
                  border="1px solid teal.200"
                  color="teal.700"
                  focusBorderColor="teal.400"
                  borderRadius="full"
                  size="lg"
                  _placeholder={{ color: 'teal.400' }}
                  mr={4}
                  py={6}
                  px={5}
                />
                <IconButton
                  icon={<ArrowForwardIcon />}
                  bg="teal.600"
                  color="white"
                  borderRadius="full"
                  onClick={handleSendMessage}
                  isDisabled={loading || !input.trim() || !report}
                  _hover={{ bg: 'teal.500', transform: 'scale(1.05)' }}
                  transition="all 0.2s"
                  size="lg"
                  isLoading={loading}
                />
              </ModalFooter>
            </ModalContent>
          </Modal>
        </VStack>
      </Box>
    </Box>
  );
};

export default FinancialOverview;