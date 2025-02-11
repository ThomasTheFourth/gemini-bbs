#!/usr/bin/env node

import * as net from 'net';
import pty from 'node-pty';

const PORT = 23; // or change to 8021 for testing

const server = net.createServer(socket => {
	console.log(
		`Client connected from ${socket.remoteAddress}:${socket.remotePort}`,
	);

	// Set up environment variables, including terminal dimensions.
	const env = {
		...process.env,
		FORCE_COLOR: '1',
		COLUMNS: '80',
		LINES: '30',
	};

	// Spawn the cli.js process using node-pty.
	// Using node-pty gives our process a pseudo terminal, which properly
	// sets properties like process.stdout.columns and handles ANSI codes.
	const shell = 'node';
	const args = ['dist/cli.js', '--color=always'];
	const ptyProcess = pty.spawn(shell, args, {
		name: 'xterm-color',
		cols: Number(env.COLUMNS) || 120,
		rows: Number(env.LINES) || 30,
		cwd: process.cwd(),
		env,
	});

	// Relay data between the socket and the pty process.
	// When data comes in from the socket, write it to the pty.
	socket.on('data', data => {
		ptyProcess.write(data);
	});

	// When the pty emits data, send it out to the socket.
	ptyProcess.on('data', data => {
		socket.write(data);
	});

	// Handle process exit.
	ptyProcess.on('exit', (code, signal) => {
		console.log(`cli.js exited with code ${code}, signal ${signal}`);
		socket.end();
	});

	// Clean up when the socket closes.
	socket.on('close', () => {
		console.log('Socket closed. Killing cli.js process.');
		ptyProcess.kill();
	});

	socket.on('error', err => {
		console.error('Socket error:', err);
		ptyProcess.kill();
	});
});

// Listen on all interfaces. If you’re testing IPv4, you might specify '0.0.0.0'
server.listen(PORT, '0.0.0.0', () => {
	console.log(`Server listening on port ${PORT}`);
});

server.on('error', err => {
	console.error('Server error:', err);
});
