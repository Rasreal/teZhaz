import React, { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  Box,
  Flex,
  Text,
  Input,
  Button,
} from '@chakra-ui/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faReply, faTimes } from '@fortawesome/free-solid-svg-icons';

// Get server URL from environment variable or use default for development
const SERVER_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:8082';

interface ChatProps {
  username: string;
  room: string;
}

interface Message {
  id: string;
  message: string;
  username: string;
  time: string;
  replyTo?: {
    id: string;
    message: string;
    username: string;
  };
}

export const Chat: React.FC<ChatProps> = ({ username, room }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState('');
  const [users, setUsers] = useState<string[]>([]);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    socketRef.current = io(SERVER_URL, {
      transports: ['websocket']
    });
    const socket = socketRef.current;

    socket.emit('join_room', { username, room });

    socket.on('receive_message', (data: Message) => {
      setMessages((prev) => [...prev, data]);
    });

    socket.on('user_joined', (data: { users: string[] }) => {
      setUsers(data.users);
    });

    socket.on('user_left', (data: { users: string[] }) => {
      setUsers(data.users);
    });

    return () => {
      socket.disconnect();
    };
  }, [username, room]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleReply = (msg: Message) => {
    setReplyingTo(msg);
  };

  const cancelReply = () => {
    setReplyingTo(null);
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && socketRef.current) {
      const newMessage = {
        message: message.trim(),
        room,
        replyTo: replyingTo ? {
          id: replyingTo.id,
          message: replyingTo.message,
          username: replyingTo.username,
        } : undefined,
      };
      
      socketRef.current.emit('send_message', newMessage);
      setMessage('');
      setReplyingTo(null);
    }
  };

  const renderMessage = (msg: Message) => {
    const isOwnMessage = msg.username === username;
    
    return (
      <Box
        position="relative"
        width="100%"
        display="flex"
        justifyContent={isOwnMessage ? 'flex-end' : 'flex-start'}
      >
        <Box
          bg={isOwnMessage ? 'blue.100' : 'gray.100'}
          p={3}
          borderRadius="lg"
          maxW="70%"
          position="relative"
          _hover={{
            '& > .reply-button': {
              opacity: 1,
              transform: 'translateX(0)',
            }
          }}
        >
          {msg.replyTo && (
            <Box
              borderLeftWidth="2px"
              borderLeftColor="gray.400"
              pl={2}
              mb={2}
              opacity={0.8}
              bg={isOwnMessage ? 'blue.50' : 'gray.50'}
              borderRadius="md"
              p={1}
            >
              <Text fontSize="xs" color="gray.600" fontWeight="medium">
                Reply to {msg.replyTo.username}
              </Text>
              <Text fontSize="sm" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                {msg.replyTo.message}
              </Text>
            </Box>
          )}
          <Text fontWeight="bold" fontSize="sm" mb={1}>
            {msg.username} {isOwnMessage && '(You)'}
          </Text>
          <Text mb={1}>{msg.message}</Text>
          <Text fontSize="xs" color="gray.500" textAlign="right">
            {new Date(msg.time).toLocaleTimeString()}
          </Text>
          
          {!isOwnMessage && (
            <Button
              className="reply-button"
              aria-label="Reply to message"
              size="xs"
              position="absolute"
              right="-28px"
              top="50%"
              transform="translateY(-50%) translateX(10px)"
              opacity="0"
              transition="all 0.2s"
              variant="solid"
              colorScheme="blue"
              onClick={() => handleReply(msg)}
              _hover={{ bg: 'blue.500' }}
              p={1}
              minW="auto"
              h="auto"
            >
              <FontAwesomeIcon icon={faReply} />
            </Button>
          )}
        </Box>
      </Box>
    );
  };

  return (
    <Box bg="white" p={4} rounded="lg" shadow="lg">
      <Flex gap={4}>
        {/* Chat messages */}
        <Box flex="1">
          <Text fontSize="xl" fontWeight="bold" mb={4}>
            Room: {room}
          </Text>
          <Box
            height="60vh"
            overflowY="auto"
            borderWidth={1}
            borderRadius="md"
            p={4}
          >
            <Flex direction="column" gap={4}>
              {messages.map((msg, index) => (
                <Box key={index}>
                  {renderMessage(msg)}
                </Box>
              ))}
              <div ref={messagesEndRef} />
            </Flex>
          </Box>
          <form onSubmit={sendMessage}>
            {replyingTo && (
              <Box
                mt={4}
                p={2}
                bg="blue.50"
                borderRadius="md"
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                borderLeft="4px solid"
                borderLeftColor="blue.400"
              >
                <Box>
                  <Text fontSize="sm" color="gray.700" fontWeight="medium">
                    Replying to {replyingTo.username}
                  </Text>
                  <Text fontSize="sm" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap" color="gray.600">
                    {replyingTo.message}
                  </Text>
                </Box>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={cancelReply}
                  p={1}
                  minW="auto"
                  h="auto"
                  color="gray.500"
                  _hover={{ color: 'gray.700' }}
                >
                  <FontAwesomeIcon icon={faTimes} />
                </Button>
              </Box>
            )}
            <Flex mt={4} gap={2}>
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                bg="white"
              />
              <Button type="submit" colorScheme="blue" px={6}>
                Send
              </Button>
            </Flex>
          </form>
        </Box>

        {/* Online users */}
        <Box w="200px">
          <Text fontSize="lg" fontWeight="bold" mb={2}>
            Online Users
          </Text>
          <Box h="1px" bg="gray.200" mb={2} />
          <Flex direction="column" gap={2}>
            {users.map((user, index) => (
              <Text key={index} fontSize="sm">
                {user} {user === username && '(You)'}
              </Text>
            ))}
          </Flex>
        </Box>
      </Flex>
    </Box>
  );
}; 