#!/usr/bin/env node

import * as net from 'net';
import pty from 'node-pty';

// Telnet negotiation codes
const IAC = 255; // "Interpret as Command"
const DONT = 254;
const DO = 253;
const WONT = 252;
const WILL = 251;
const SB = 250; // subnegotiation begin
const SE = 240; // subnegotiation end

/**
 * Strip Telnet negotiation sequences from incoming data.
 * This is a simple parser that discards bytes that are part of Telnet commands.
 *
 * @param {Buffer} data - The incoming data buffer from the socket.
 * @returns {Buffer} - A new Buffer with Telnet commands removed.
 */
function stripTelnetCommands(data) {
	let result = [];
	let i = 0;
	while (i < data.length) {
		if (data[i] === IAC) {
			// If there's at least one more byte...
			if (i + 1 < data.length) {
				const cmd = data[i + 1];
				// For WILL, WONT, DO, DONT, skip 3 bytes total.
				if (cmd === WILL || cmd === WONT || cmd === DO || cmd === DONT) {
					i += 3;
					continue;
				}
				// For SB (subnegotiation), skip until we find IAC SE.
				if (cmd === SB) {
					i += 2; // Skip IAC and SB.
					// Skip until we see IAC followed by SE.
					while (i < data.length) {
						if (data[i] === IAC && i + 1 < data.length && data[i + 1] === SE) {
							i += 2;
							break;
						}
						i++;
					}
					continue;
				}
				// For any other command, skip 2 bytes.
				i += 2;
				continue;
			} else {
				break;
			}
		}
		result.push(data[i]);
		i++;
	}
	return Buffer.from(result);
}

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
	// node-pty gives our process a pseudo terminal which properly handles ANSI codes.
	const shell = 'node';
	const args = ['dist/cli.js', '--color=always'];
	const ptyProcess = pty.spawn(shell, args, {
		name: 'xterm-color',
		cols: Number(env.COLUMNS) || 120,
		rows: Number(env.LINES) || 30,
		cwd: process.cwd(),
		env,
	});

	// When data comes in from the socket, filter out Telnet commands and write to the pty.
	socket.on('data', data => {
		const filteredData = stripTelnetCommands(data);
		if (filteredData.length > 0) {
			ptyProcess.write(filteredData.toString('utf8'));
		}
	});

	// Relay data from the pty back to the socket.
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

// Listen on all interfaces (or specify a particular interface).
server.listen(PORT, '0.0.0.0', () => {
	console.log(`Server listening on port ${PORT}`);
});

server.on('error', err => {
	console.error('Server error:', err);
});
