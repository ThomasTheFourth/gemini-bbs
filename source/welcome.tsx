import React from 'react';
import {Box, Text} from 'ink';
import {VERSION} from './version.js';

export default function Welcome() {
  return (
    <Box flexDirection="column" paddingTop={1} width={80}>
      <Text color="cyan"> ---------------------------------------------------</Text>
      <Text color="green"> Gemini BBS software version <Text color="magenta">{VERSION}</Text></Text>
      <Text color="cyan"> ---------------------------------------------------</Text>
      <Box marginTop={1}>
        <Text color="cyan"> Welcome to...</Text>
      </Box>
      <Box marginTop={1} flexDirection="column">
        <Text color="red">  _____ _____ ____  __  __ ___ _   _ _   _ ____  </Text>
        <Text color="yellow">  |_   _| ____|  _ \|  \/  |_ _| \ | | | / ___| </Text>
        <Text color="green">    | | |  _| | |_) | |\/| || ||  \| | | \___ \ </Text>
        <Text color="cyan">    | | | |___|  _ &lt;| |  | || || |\  | |_| |__) |</Text>
        <Text color="blue">    |_| |_____|_| \_\_|  |_|___|_| \_|\___/____/ </Text>
        <Text color="magenta">   ____ _____  _  _____ ___ ___  _   _          </Text>
        <Text color="red">  / ___|_   _|/ \|_   _|_ _/ _ \| \ | |         </Text>
        <Text color="yellow">  \___ \ | | / _ \ | |  | | | | ||  \| |         </Text>
        <Text color="green">   ___) || |/ ___ \| |  | | |_| || |\  |         </Text>
        <Text color="cyan">  |____/ |_/_/   \_\_| |___\___/|_| \_|         </Text>
      </Box>
      <Box marginTop={1} flexDirection="column">
        <Text color="cyan"> This site and software are currently a work in progress.</Text>
        <Text color="cyan"> Please check back later and follow progress at</Text>
        <Text color="cyan"> https://github.com/ThomasTheFourth/gemini-bbs</Text>
      </Box>
      <Text> </Text>
    </Box>
  );
}
