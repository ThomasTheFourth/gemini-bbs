import React from 'react';
import {Box, Text} from 'ink';
import type {User} from '../types.js';

type ProfileProps = {
  user: User | null;
};

export default function Profile({user}: ProfileProps) {
  return (
    <Box flexDirection="column" paddingX={1}>
      <Text bold color="#ff8844">━━━ User Profile ━━━</Text>
      {user ? (
        <Box marginTop={1} flexDirection="column">
          <Box>
            <Text color="#888899">Username:   </Text>
            <Text bold color="#00ddff">{user.username}</Text>
          </Box>
          <Box>
            <Text color="#888899">Member since: </Text>
            <Text color="#aabbcc">{user.createdAt}</Text>
          </Box>
          <Box>
            <Text color="#888899">Last login:   </Text>
            <Text color="#aabbcc">{user.lastLogin ?? 'First time!'}</Text>
          </Box>
        </Box>
      ) : (
        <Box marginTop={1}>
          <Text color="red">Could not load profile.</Text>
        </Box>
      )}
      <Box marginTop={1}>
        <Text color="#555566">Press any key to return to menu...</Text>
      </Box>
    </Box>
  );
}
