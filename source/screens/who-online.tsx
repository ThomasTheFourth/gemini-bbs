import React from 'react';
import {Box, Text} from 'ink';
import type {Connection} from '../types.js';

type WhoOnlineProps = {
  connections: Connection[];
};

export default function WhoOnline({connections}: WhoOnlineProps) {
  return (
    <Box flexDirection="column" paddingX={1}>
      <Text bold color="#00ddff">━━━ Who's Online ━━━</Text>
      <Box marginTop={1} flexDirection="column">
        {connections.length === 0 ? (
          <Text dimColor>No one is online.</Text>
        ) : (
          <>
            <Box>
              <Box width={20}>
                <Text bold color="#ffcc00">Username</Text>
              </Box>
              <Box width={22}>
                <Text bold color="#ffcc00">IP Address</Text>
              </Box>
            </Box>
            {connections.map((conn) => (
              <Box key={conn.id}>
                <Box width={20}>
                  <Text color="#aabbcc">{conn.username ?? '(logging in)'}</Text>
                </Box>
                <Box width={22}>
                  <Text color="#667788">{conn.remoteAddress}</Text>
                </Box>
              </Box>
            ))}
          </>
        )}
      </Box>
      <Box marginTop={1}>
        <Text color="#555566">Press any key to return to menu...</Text>
      </Box>
    </Box>
  );
}
