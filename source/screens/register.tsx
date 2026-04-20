import React from 'react';
import {Box, Text} from 'ink';

type RegisterProps = {
  step: 'username' | 'password' | 'confirm' | 'error';
  username: string;
  passwordLength: number;
  inputBuffer: string;
  error: string;
};

export default function Register({step, username, passwordLength, inputBuffer, error}: RegisterProps) {
  return (
    <Box flexDirection="column" paddingX={1}>
      <Text bold color="#00ff88">━━━ Register New Account ━━━</Text>
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
                <Text color="#00ff88">{inputBuffer}<Text color="#00ff88">▌</Text></Text>
              ) : (
                <Text color="#aabbcc">{username}</Text>
              )}
            </Box>
            {(step === 'password' || step === 'confirm') && (
              <Box>
                <Text color="#888899">Password: </Text>
                {step === 'password' ? (
                  <Text color="#00ff88">{'*'.repeat(inputBuffer.length)}<Text color="#00ff88">▌</Text></Text>
                ) : (
                  <Text color="#aabbcc">{'*'.repeat(passwordLength)}</Text>
                )}
              </Box>
            )}
            {step === 'confirm' && (
              <Box>
                <Text color="#888899">Confirm:  </Text>
                <Text color="#00ff88">{'*'.repeat(inputBuffer.length)}<Text color="#00ff88">▌</Text></Text>
              </Box>
            )}
          </>
        )}
      </Box>
    </Box>
  );
}
