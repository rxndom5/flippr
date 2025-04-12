import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  Heading,
  Text,
  Button,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Stat,
  StatLabel,
  StatNumber,
  Flex,
  Tooltip,
  List,
  ListItem,
  ListIcon,
  Alert,
  AlertIcon,
  Progress,
} from '@chakra-ui/react';
import { InfoIcon, CheckCircleIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '@chakra-ui/toast';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip as ChartTooltip, Legend } from 'chart.js';

// Register Chart.js components
ChartJS.register(ArcElement, ChartTooltip, Legend);

const FinancialOverview = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const username = localStorage.getItem('username') || 'User';
  const [report, setReport] = useState(null);

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

  // Pie chart data for categories
  const getPieChartData = () => {
    if (!report || !report.categories) return { labels: [], datasets: [] };
    const labels = report.categories.map(cat => cat.name);
    const data = report.categories.map(cat => Math.abs(cat.amount));
    const colors = report.categories.map(cat =>
      cat.type === 'Income' ? 'rgba(75, 192, 192, 0.6)' : 'rgba(255, 99, 132, 0.6)'
    );
    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: colors,
          borderColor: colors.map(c => c.replace('0.6', '1')),
          borderWidth: 1,
        },
      ],
    };
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
        maxW="3xl"
        w="full"
        bg="white"
        boxShadow="lg"
        borderRadius="md"
        transition="all 0.3s"
        _hover={{ boxShadow: 'xl' }}
      >
        <VStack spacing={6} align="start">
          <Heading color="teal.600">Financial Overview</Heading>
          <Button
            colorScheme="teal"
            variant="outline"
            onClick={() => navigate('/dashboard')}
          >
            Back to Dashboard
          </Button>

          {/* Financial Report */}
          <Box w="full" p={4} bg="teal.50" borderRadius="md" boxShadow="sm">
            {report ? (
              <Accordion allowToggle>
                {/* Summary */}
                <AccordionItem>
                  <AccordionButton>
                    <Box flex="1" textAlign="left" fontWeight="bold">
                      Summary
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                  <AccordionPanel pb={4}>
                    <Text mb={4} color="teal.600">
                      {report.summary.period}
                    </Text>
                    <Flex
                      direction={{ base: 'column', md: 'row' }}
                      gap={4}
                      justify="space-between"
                    >
                      <Stat bg="white" p={4} borderRadius="md" boxShadow="sm">
                        <StatLabel>
                          Income
                          <Tooltip label="Total money received">
                            <InfoIcon ml={1} color="teal.500" />
                          </Tooltip>
                        </StatLabel>
                        <StatNumber color="teal.600">
                          ${report.summary.total_income.toFixed(2)}
                        </StatNumber>
                      </Stat>
                      <Stat bg="white" p={4} borderRadius="md" boxShadow="sm">
                        <StatLabel>
                          Expenses
                          <Tooltip label="Total money spent">
                            <InfoIcon ml={1} color="teal.500" />
                          </Tooltip>
                        </StatLabel>
                        <StatNumber color="red.500">
                          ${report.summary.total_expenses.toFixed(2)}
                        </StatNumber>
                      </Stat>
                      <Stat bg="white" p={4} borderRadius="md" boxShadow="sm">
                        <StatLabel>
                          Net Balance
                          <Tooltip label="Income minus Expenses">
                            <InfoIcon ml={1} color="teal.500" />
                          </Tooltip>
                        </StatLabel>
                        <StatNumber
                          color={report.summary.net_balance >= 0 ? 'teal.600' : 'red.500'}
                        >
                          ${report.summary.net_balance.toFixed(2)}
                        </StatNumber>
                      </Stat>
                    </Flex>
                  </AccordionPanel>
                </AccordionItem>

                {/* Category Breakdown */}
                <AccordionItem>
                  <AccordionButton>
                    <Box flex="1" textAlign="left" fontWeight="bold">
                      Spending by Category
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                  <AccordionPanel pb={4}>
                    {report.categories.length === 0 ? (
                      <Text color="gray.500">No transactions recorded.</Text>
                    ) : (
                      <Box maxW="300px" mx="auto">
                        <Pie
                          data={getPieChartData()}
                          options={{
                            responsive: true,
                            plugins: {
                              legend: {
                                position: 'bottom',
                              },
                              tooltip: {
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
                  </AccordionPanel>
                </AccordionItem>

                {/* Savings Goals */}
                <AccordionItem>
                  <AccordionButton>
                    <Box flex="1" textAlign="left" fontWeight="bold">
                      Savings Goals
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                  <AccordionPanel pb={4}>
                    {report.goals.length === 0 ? (
                      <Text color="gray.500">No savings goals set.</Text>
                    ) : (
                      report.goals.map((goal, idx) => (
                        <Box
                          key={idx}
                          p={3}
                          mb={3}
                          bg="white"
                          borderRadius="md"
                          boxShadow="sm"
                        >
                          <Text fontWeight="medium">{goal.name}</Text>
                          <Text color="teal.600">
                            ${goal.current.toFixed(2)} / ${goal.target.toFixed(2)}
                          </Text>
                          <Text fontSize="sm" color="gray.600">
                            Contributed: ${goal.contributed.toFixed(2)}
                          </Text>
                          <Progress
                            value={(goal.current / goal.target) * 100}
                            colorScheme="teal"
                            size="sm"
                            mt={2}
                            borderRadius="md"
                          />
                        </Box>
                      ))
                    )}
                  </AccordionPanel>
                </AccordionItem>

                {/* Budgets */}
                <AccordionItem>
                  <AccordionButton>
                    <Box flex="1" textAlign="left" fontWeight="bold">
                      Budgets
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                  <AccordionPanel pb={4}>
                    {report.budgets.length === 0 ? (
                      <Text color="gray.500">No budgets set.</Text>
                    ) : (
                      report.budgets.map((budget, idx) => (
                        <Box
                          key={idx}
                          p={3}
                          mb={3}
                          bg="white"
                          borderRadius="md"
                          boxShadow="sm"
                        >
                          <Text fontWeight="medium">{budget.category}</Text>
                          <Text
                            color={budget.spent > budget.limit ? 'red.500' : 'teal.600'}
                          >
                            Spent ${budget.spent.toFixed(2)} / Limit ${budget.limit.toFixed(2)}
                          </Text>
                          <Progress
                            value={(budget.spent / budget.limit) * 100}
                            colorScheme={budget.spent >= budget.limit ? 'red' : 'teal'}
                            size="sm"
                            mt={2}
                            borderRadius="md"
                          />
                        </Box>
                      ))
                    )}
                  </AccordionPanel>
                </AccordionItem>

                {/* AI Insights */}
                <AccordionItem>
                  <AccordionButton>
                    <Box flex="1" textAlign="left" fontWeight="bold">
                      Financial Insights
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                  <AccordionPanel pb={4}>
                    <Alert status="info" borderRadius="md" bg="teal.100">
                      <AlertIcon />
                      <Box>
                        <Text fontWeight="bold" mb={2}>
                          Your Financial Advisor Says:
                        </Text>
                        <List spacing={3}>
                          {report.ai_insights
                            .split('\n')
                            .filter(line => line.trim())
                            .map((line, idx) => (
                              <ListItem key={idx}>
                                <ListIcon
                                  as={CheckCircleIcon}
                                  color="teal.500"
                                  verticalAlign="top"
                                />
                                {line.replace(/^\d+\.\s*/, '').replace(/^\s*-\s*/, '')}
                              </ListItem>
                            ))}
                        </List>
                      </Box>
                    </Alert>
                  </AccordionPanel>
                </AccordionItem>
              </Accordion>
            ) : (
              <Text color="gray.500">Loading report...</Text>
            )}
          </Box>
        </VStack>
      </Box>
    </Box>
  );
};

export default FinancialOverview;