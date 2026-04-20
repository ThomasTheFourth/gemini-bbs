import React from 'react';
import {Box, Text} from 'ink';

type LoginProps = {
  step: 'username' | 'password' | 'error';
  username: string;
  inputBuffer: string;
  error: string;
};

export default function Login({step, username, inputBuffer, error}: LoginProps) {
  return (
    <Box flexDirection="column" paddingX={1}>
      <Text bold color="#00ddff">━━━ Login ━━━</Text>
      <Box marginTop={1} flexDirection="column">
        {step === 'error' ? (
          <>
            <Text color="red">{error}</Text>
            <Box marginTop={1}>
              <Text color="#888899">Press any key to try again...</Text>
            </Box>
          </>
        ) : (
          <>
            <Box>
              <Text color="#888899">Username: </Text>
              {step === 'username' ? (
                <Text color="#00ddff">{inputBuffer}<Text color="#00ddff">▌</Text></Text>
              ) : (
                <Text color="#aabbcc">{username}</Text>
              )}
            </Box>
            {step === 'password' && (
              <Box>
                <Text color="#888899">Password: </Text>
                <Text color="#00ddff">{'*'.repeat(inputBuffer.length)}<Text color="#00ddff">▌</Text></Text>
              </Box>
            )}
          </>
        )}
      </Box>
    </Box>
  );
}
