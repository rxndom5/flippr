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
  Icon,
  ScaleFade,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '@chakra-ui/toast';
import { BellIcon, ChevronLeftIcon } from '@chakra-ui/icons';

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
          position: 'top-right',
        });
      }
    };
    fetchNotifications();
  }, [username, toast]);

  // Group notifications by date
  const groupByDate = (nots) => {
    const grouped = {};
    nots.forEach((not) => {
      const date = new Date(not.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(not);
    });
    return grouped;
  };

  const groupedNotifications = groupByDate(notifications);

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
            boxShadow="0 4px 12px rgba(0, 0, 0, 0.05)"
          >
            <Flex align="center" gap={3}>
              <Icon as={BellIcon} boxSize={8} color="teal.600" />
              <Heading
                size="xl"
                bgGradient="linear(to-r, teal.600, teal.400)"
                bgClip="text"
                fontWeight="extrabold"
              >
                Notifications
              </Heading>
            </Flex>
            <Button
              bg="teal.600"
              color="white"
              borderRadius="full"
              leftIcon={<ChevronLeftIcon />}
              _hover={{ bg: 'teal.500', transform: 'translateY(-2px)' }}
              size="lg"
              onClick={() => navigate('/dashboard')}
              transition="all 0.2s"
            >
              Back to Dashboard
            </Button>
          </Flex>

          {/* Notifications Content */}
          {notifications.length === 0 ? (
            <Text
              color="teal.500"
              fontStyle="italic"
              textAlign="center"
              fontSize="lg"
              py={8}
              sx={{
                animation: 'fadeIn 0.5s ease-out',
                '@keyframes fadeIn': {
                  from: { opacity: 0, transform: 'translateY(10px)' },
                  to: { opacity: 1, transform: 'translateY(0)' },
                },
              }}
            >
              No notifications yet.
            </Text>
          ) : (
            <VStack spacing={8} align="stretch">
              {Object.entries(groupedNotifications).map(([date, nots], dateIdx) => (
                <Box key={date}>
                  <Flex
                    align="center"
                    mb={6}
                    position="relative"
                    _before={{
                      content: '""',
                      position: 'absolute',
                      left: '50%',
                      bottom: '-12px',
                      width: '60%',
                      height: '2px',
                      bgGradient: 'linear(to-r, teal.400, teal.600)',
                      transform: 'translateX(-50%)',
                    }}
                  >
                    <Text
                      fontSize="lg"
                      fontWeight="bold"
                      color="teal.700"
                      bg="teal.50"
                      px={4}
                      py={2}
                      borderRadius="lg"
                      sx={{
                        animation: `fadeIn 0.5s ease-out ${dateIdx * 0.2}s both`,
                        '@keyframes fadeIn': {
                          from: { opacity: 0, transform: 'translateY(10px)' },
                          to: { opacity: 1, transform: 'translateY(0)' },
                        },
                      }}
                    >
                      {date}
                    </Text>
                  </Flex>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                    {nots.map((not, notIdx) => (
                      <ScaleFade
                        key={not.id}
                        initialScale={0.9}
                        in={true}
                        delay={dateIdx * 0.2 + notIdx * 0.1}
                      >
                        <Box
                          p={5}
                          bg={not.is_read ? 'white' : 'teal.50'}
                          borderRadius="xl"
                          boxShadow="0 4px 20px rgba(0, 0, 0, 0.1)"
                          border="1px solid rgba(0, 128, 128, 0.2)"
                          _hover={{
                            bg: not.is_read ? 'teal.50' : 'teal.100',
                            transform: 'translateY(-4px)',
                            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                          }}
                          transition="all 0.3s"
                        >
                          <Flex justify="space-between" align="center" mb={3}>
                            <Text
                              fontWeight="semibold"
                              color={not.is_read ? 'teal.600' : 'teal.700'}
                              fontSize="md"
                            >
                              {not.message}
                            </Text>
                            <Badge
                              colorScheme={
                                not.type === 'budget'
                                  ? 'red'
                                  : not.type === 'savings'
                                  ? 'green'
                                  : 'teal'
                              }
                              borderRadius="full"
                              px={3}
                              py={1}
                              fontSize="0.8em"
                              textTransform="capitalize"
                            >
                              {not.type}
                            </Badge>
                          </Flex>
                          <Text
                            fontSize="xs"
                            color="teal.500"
                            opacity={0.8}
                          >
                            {new Date(not.created_at).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: 'numeric',
                              hour12: true,
                            })}
                          </Text>
                        </Box>
                      </ScaleFade>
                    ))}
                  </SimpleGrid>
                </Box>
              ))}
            </VStack>
          )}
        </VStack>
      </Box>
    </Box>
  );
};

export default Notifications;