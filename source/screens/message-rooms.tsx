import React from 'react';
import {Box, Text} from 'ink';

export default function MessageRooms() {
  return (
    <Box flexDirection="column" paddingX={1}>
      <Text bold color="#aa66ff">━━━ Message Rooms ━━━</Text>
      <Box marginTop={1}>
        <Text color="#888899">Coming soon! This feature is under development.</Text>
      </Box>
      <Box marginTop={1}>
        <Text color="#555566">Press any key to return to menu...</Text>
      </Box>
    </Box>
  );
}
