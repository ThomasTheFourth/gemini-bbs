#!/usr/bin/env node
import React from 'react';
import {render, type Instance} from 'ink';
import Admin from './admin.js';
import {createSession} from './session.js';
import {createBBSServer} from './server.js';
import {TeeStream} from './tee-stream.js';
import {initDb} from './db.js';
import {loadConfig, getConfig} from './config.js';
import type {Connection, LogEntry} from './types.js';

// Load config before anything else
const config = loadConfig();
const PORT = config.port;

// --- Module-level state (survives Ink unmount/remount) ---

let connections: Connection[] = [];
let log: LogEntry[] = [];
let spyingOn: Connection | null = null;

const teeStreams = new Map<number, TeeStream>();
const dataCallbacks = new Map<number, (data: Buffer) => void>();

let adminInstance: Instance | null = null;
let spyCleanup: ((data: Buffer) => void) | null = null;

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

  // Wait for Ink to fully release stdin, then take over
  setTimeout(() => {
    process.stdout.write('\x1b[2J\x1b[H');
    process.stdout.write(
      `\x1b[7m[Spying on #${connection.id} — ${connection.username ?? connection.remoteAddress} — Press Q to return]\x1b[0m\n\n`,
    );

    teeStream.startSpy(process.stdout);

    // Remove Ink's data listeners so we can take over stdin
    for (const listener of process.stdin.listeners('data')) {
      process.stdin.removeListener('data', listener as (...args: unknown[]) => void);
    }
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.ref();

    spyCleanup = (data: Buffer) => {
      const ch = data[0];
      // Ctrl+C — exit process cleanly
      if (ch === 0x03) {
        exitSpyMode();
        server.close();
        process.exit(0);
      }
      // 'q', 'Q', or Escape (0x1b) — return to admin
      if (ch === 0x71 || ch === 0x51 || ch === 0x1b) {
        exitSpyMode();
      }
    };
    process.stdin.on('data', spyCleanup);
  }, 100);
}

function exitSpyMode(): void {
  if (!spyingOn) return;

  const teeStream = teeStreams.get(spyingOn.id);
  if (teeStream) {
    teeStream.stopSpy();
  }

  spyingOn = null;

  if (spyCleanup) {
    process.stdin.removeListener('data', spyCleanup);
    spyCleanup = null;
  }
  process.stdin.setRawMode(false);
  process.stdin.pause();

  process.stdout.write('\x1b[2J\x1b[H');
  adminInstance = render(React.createElement(AdminWrapper));
}

// --- Admin wrapper ---

function AdminWrapper() {
  return React.createElement(Admin, {
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
    // Enforce max nodes
    if (connections.length >= getConfig().maxNodes) {
      socket.write('\r\nSorry, all nodes are busy. Please try again later.\r\n');
      socket.end();
      addLog(`Rejected connection from ${connection.remoteAddress} (max nodes reached)`);
      return;
    }

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
  if (err.code === 'EADDRINUSE') {
    console.error(`Error: Port ${PORT} is already in use. Is another instance running?`);
    process.exit(1);
  } else if (err.code === 'EACCES') {
    console.error(`Error: Port ${PORT} requires elevated privileges. Try running with sudo.`);
    process.exit(1);
  } else {
    addLog(`Server error: ${err.message}`);
  }
});

// Clean shutdown on signals
function shutdown() {
  server.close();
  if (adminInstance) {
    adminInstance.unmount();
  }
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// --- Initial render ---

adminInstance = render(React.createElement(AdminWrapper));
