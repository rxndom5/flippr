import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  Heading,
  Text,
  Button,
  SimpleGrid,
  Badge,
  Flex,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '@chakra-ui/toast';

const Notifications = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const username = localStorage.getItem('username') || 'User';
  const [notifications, setNotifications] = useState([]);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await axios.get('http://localhost:5001/notifications', {
          headers: { 'X-Username': username },
        });
        setNotifications(response.data.notifications);
      } catch (error) {
        toast({
          title: 'Error',
          description: error.response?.data?.error || 'Failed to fetch notifications.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    };
    fetchNotifications();
  }, [username, toast]);

  // Group notifications by date
  const groupByDate = (nots) => {
    const grouped = {};
    nots.forEach((not) => {
      const date = new Date(not.created_at).toLocaleDateString();
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(not);
    });
    return grouped;
  };

  const groupedNotifications = groupByDate(notifications);

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
              Notifications
            </Heading>
            <Button
              colorScheme="teal"
              variant="outline"
              size="md"
              onClick={() => navigate('/dashboard')}
            >
              Back to Dashboard
            </Button>
          </Flex>

          {notifications.length === 0 ? (
            <Text color="gray.500">No notifications yet.</Text>
          ) : (
            Object.entries(groupedNotifications).map(([date, nots]) => (
              <Box key={date}>
                <Text fontSize="lg" fontWeight="bold" mb={4} color="teal.700">
                  {date}
                </Text>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  {nots.map((not) => (
                    <Box
                      key={not.id}
                      p={4}
                      bg={not.is_read ? 'gray.50' : 'teal.50'}
                      borderRadius="md"
                      boxShadow="sm"
                    >
                      <Flex justify="space-between" align="center">
                        <Text fontWeight="medium">{not.message}</Text>
                        <Badge colorScheme={not.type === 'budget' ? 'red' : not.type === 'savings' ? 'green' : 'blue'}>
                          {not.type.charAt(0).toUpperCase() + not.type.slice(1)}
                        </Badge>
                      </Flex>
                      <Text fontSize="xs" color="gray.500" mt={2}>
                        {new Date(not.created_at).toLocaleTimeString()}
                      </Text>
                    </Box>
                  ))}
                </SimpleGrid>
              </Box>
            ))
          )}
        </VStack>
      </Box>
    </Box>
  );
};

export default Notifications;