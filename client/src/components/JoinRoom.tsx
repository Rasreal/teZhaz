import React, { useState } from 'react';
import {
  Box,
  Button,
  Stack,
  Text,
  Input,
  Heading,
} from '@chakra-ui/react';

interface JoinRoomProps {
  onJoin: (username: string, room: string) => void;
}

export const JoinRoom: React.FC<JoinRoomProps> = ({ onJoin }) => {
  const [username, setUsername] = useState('');
  const [room, setRoom] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !room.trim()) {
      // Show error message
      alert('Please enter both username and room');
      return;
    }
    onJoin(username.trim(), room.trim());
  };

  return (
    <Box bg="white" p={8} rounded="lg" shadow="lg">
      <Stack as="form" onSubmit={handleSubmit} gap={4}>
        <Heading size="lg">Join Chat Room</Heading>
        
        <Box>
          <Text mb={2}>Username</Text>
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            required
          />
        </Box>

        <Box>
          <Text mb={2}>Room</Text>
          <Input
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            placeholder="Enter room name"
            required
          />
        </Box>

        <Button
          type="submit"
          colorScheme="blue"
          width="full"
          mt={4}
        >
          Join Room
        </Button>
      </Stack>
    </Box>
  );
}; 