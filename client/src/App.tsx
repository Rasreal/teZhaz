import React from 'react';
import { ChakraProvider, Box, Container, defaultSystem } from '@chakra-ui/react';
import { Chat } from './components/Chat';
import { JoinRoom } from './components/JoinRoom';
import { useState } from 'react';

function App() {
  const [isJoined, setIsJoined] = useState(false);
  const [userData, setUserData] = useState({ username: '', room: '' });

  const handleJoinRoom = (username: string, room: string) => {
    setUserData({ username, room });
    setIsJoined(true);
  };

  return (
    <ChakraProvider value={defaultSystem}>
      <Box minH="100vh" bg="gray.100" py={10}>
        <Container maxW="container.md">
          {!isJoined ? (
            <JoinRoom onJoin={handleJoinRoom} />
          ) : (
            <Chat username={userData.username} room={userData.room} />
          )}
        </Container>
      </Box>
    </ChakraProvider>
  );
}

export default App;
