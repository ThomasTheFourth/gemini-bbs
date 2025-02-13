#!/usr/bin/env node
import React from 'react';
import {render} from 'ink';
import meow from 'meow';
import App from './app.js';

meow(
	`
	Usage
	  $ gemini-bbs

	Examples
	  $ gemini-bbs
`,
	{
		importMeta: import.meta,
		flags: {},
	},
);

render(<App />);
