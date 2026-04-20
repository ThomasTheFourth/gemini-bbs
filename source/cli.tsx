#!/usr/bin/env node
import React from 'react';
import {render, type Instance} from 'ink';
import Admin from './admin.js';
import {createSession} from './session.js';
import {createBBSServer} from './server.js';
import {TeeStream} from './tee-stream.js';
import {initDb} from './db.js';
import type {Connection, LogEntry} from './types.js';

const PORT = 23;

// --- Module-level state (survives Ink unmount/remount) ---

let connections: Connection[] = [];
let log: LogEntry[] = [];
let spyingOn: Connection | null = null;

const teeStreams = new Map<number, TeeStream>();
const dataCallbacks = new Map<number, (data: Buffer) => void>();

let adminInstance: Instance | null = null;
let stdinListener: ((data: Buffer) => void) | null = null;

// --- State update + re-render ---

function addLog(message: string): void {
  log = [...log, {timestamp: new Date(), message}];
  renderAdmin();
}

function updateConnection(id: number, updates: Partial<Connection>): void {
  connections = connections.map((c) =>
    c.id === id ? {...c, ...updates} : c,
  );
  renderAdmin();
}

function renderAdmin(): void {
  if (spyingOn) return;

  if (adminInstance) {
    adminInstance.rerender(React.createElement(AdminWrapper));
  }
}

// --- Spy mode ---

function enterSpyMode(connection: Connection): void {
  const teeStream = teeStreams.get(connection.id);
  if (!teeStream) return;

  spyingOn = connection;

  if (adminInstance) {
    adminInstance.unmount();
    adminInstance = null;
  }

  // Defer stdin setup to next tick so Ink's deferred cleanup runs first
  setTimeout(() => {
    process.stdout.write('\x1b[2J\x1b[H');
    process.stdout.write(
      `\x1b[7m[Spying on #${connection.id} — ${connection.username ?? connection.remoteAddress} — Press ESC to return]\x1b[0m\n\n`,
    );

    teeStream.startSpy(process.stdout);

    // Take over stdin for escape key detection
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.ref();
    stdinListener = (data: Buffer) => {
      // Escape key — 0x1b standalone
      if (data[0] === 0x1b && data.length === 1) {
        exitSpyMode();
      }
    };
    process.stdin.on('data', stdinListener);
  }, 50);
}

function exitSpyMode(): void {
  if (!spyingOn) return;

  const teeStream = teeStreams.get(spyingOn.id);
  if (teeStream) {
    teeStream.stopSpy();
  }

  spyingOn = null;

  if (stdinListener) {
    process.stdin.removeListener('data', stdinListener);
    stdinListener = null;
  }
  if (typeof process.stdin.setRawMode === 'function') {
    process.stdin.setRawMode(false);
  }
  process.stdin.pause();

  process.stdout.write('\x1b[2J\x1b[H');
  adminInstance = render(React.createElement(AdminWrapper));
}

// --- Admin wrapper ---

function AdminWrapper() {
  return React.createElement(Admin, {
    port: PORT,
    connections,
    log,
    onSpyConnection: enterSpyMode,
  });
}

// --- Initialize database ---

initDb();

// --- Server setup ---

const server = createBBSServer({
  onConnect(connection, socket) {
    connections = [...connections, connection];

    const teeStream = new TeeStream();
    teeStream.pipe(socket);
    teeStreams.set(connection.id, teeStream);

    // Create session — writes directly to teeStream, no Ink
    const handleInput = createSession(teeStream, {
      onLogin: (username: string) => {
        updateConnection(connection.id, {username});
        addLog(`${username} logged in from ${connection.remoteAddress}`);
      },
      onDisconnect: () => {
        socket.end();
      },
      getConnections: () => connections,
    });
    dataCallbacks.set(connection.id, handleInput);

    addLog(`Connection from ${connection.remoteAddress}`);
  },
  onData(connection, data) {
    const callback = dataCallbacks.get(connection.id);
    if (callback) {
      callback(data);
    }
  },
  onDisconnect(connection) {
    const username = connections.find((c) => c.id === connection.id)?.username;
    connections = connections.filter((c) => c.id !== connection.id);

    dataCallbacks.delete(connection.id);

    const teeStream = teeStreams.get(connection.id);
    if (teeStream) {
      teeStream.stopSpy();
      teeStream.unpipe();
      teeStream.destroy();
      teeStreams.delete(connection.id);
    }

    if (spyingOn && spyingOn.id === connection.id) {
      exitSpyMode();
    }

    addLog(`Disconnected: ${username ?? connection.remoteAddress}`);
  },
});

server.listen(PORT, '0.0.0.0', () => {
  addLog(`Server started on port ${PORT}`);
});

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EACCES') {
    addLog(`Error: Port ${PORT} requires elevated privileges. Try running with sudo.`);
  } else {
    addLog(`Server error: ${err.message}`);
  }
});

// --- Initial render ---

adminInstance = render(React.createElement(AdminWrapper));
