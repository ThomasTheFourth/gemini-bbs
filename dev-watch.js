#!/usr/bin/env node

import { spawn } from 'child_process';
import chokidar from 'chokidar';

let serverProcess = null;

// Function to start the server
function startServer() {
	serverProcess = spawn('node', ['server.js'], {
		stdio: 'inherit',
		env: {
			...process.env
			// Add other environment variables here if needed
		}
	});

	serverProcess.on('exit', (code, signal) => {
		if (code !== null) {
			console.log(`server.js exited with code ${code}`);
		} else {
			console.log(`server.js was terminated by signal ${signal}`);
		}
	});
}

// Function to restart the server when changes occur
function restartServer() {
	if (serverProcess) {
		console.log('Restarting server.js...');
		serverProcess.kill();
	}
	startServer();
}

// Watch for changes in server.js (ignoring the initial add events)
chokidar.watch('server.js', { ignoreInitial: true }).on('change', path => {
	console.log(`${path} changed. Reloading server...`);
	restartServer();
});

// Start the server for the first time
startServer();
