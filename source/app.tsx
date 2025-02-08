import React from 'react';
import { Box, Text } from 'ink';
import Gradient from 'ink-gradient';
import BigText from 'ink-big-text';

export default function App() {
  return (
		<>
			<Box width={500} flexDirection='column'>
				<Text color="cyan">
					{'\n'} ---------------------------------------------------
				</Text>
				<Text color="green">
					{' '}
					Gemini BBS software version <Text color="magentca">1.01beta</Text>
				</Text>
				<Text color="cyan">
					{' '}
					---------------------------------------------------
				</Text>
				<Text color="cyan">{'\n'} Welcome to...</Text>
				<Gradient name="rainbow">
					<BigText text="TERMINUS STATION" />
				</Gradient>
				<Text color="cyan">
					{'\n'} This site and software are currently a work in progress.
				</Text>
				<Text color="cyan">
					{' '}
					Please check back later and follow my progress at
					https://github.com/ThomasTheFourth/gemini-bbs
				</Text>
				<Text color="cyan">{'\n'}</Text>
			</Box>
		</>
	);
}
