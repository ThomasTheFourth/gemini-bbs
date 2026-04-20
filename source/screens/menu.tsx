import React from 'react';
import {Box, Text} from 'ink';

type MenuProps = {
  username: string;
};

export default function Menu({username}: MenuProps) {
  return (
    <Box flexDirection="column" paddingX={1}>
      <Text bold color="#ffcc00">━━━ Main Menu ━━━</Text>
      <Box marginTop={1}>
        <Text color="#888899">Welcome, </Text>
        <Text bold color="#00ddff">{username}</Text>
        <Text color="#888899">!</Text>
      </Box>
      <Box marginTop={1} flexDirection="column">
        <Text color="#aabbcc">  <Text bold color="#ffcc00">1</Text> ─ Who's Online</Text>
        <Text color="#aabbcc">  <Text bold color="#ffcc00">2</Text> ─ Message Rooms</Text>
        <Text color="#aabbcc">  <Text bold color="#ffcc00">3</Text> ─ User Profile</Text>
        <Text color="#aabbcc">  <Text bold color="#ffcc00">4</Text> ─ Logout</Text>
      </Box>
      <Box marginTop={1}>
        <Text color="#555566">Choose an option: <Text color="#00ddff">▌</Text></Text>
      </Box>
    </Box>
  );
}
