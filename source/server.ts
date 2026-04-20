import * as net from 'node:net';
import type {Connection} from './types.js';

const IAC = 255;
const DONT = 254;
const DO = 253;
const WONT = 252;
const WILL = 251;
const SB = 250;
const SE = 240;

// Telnet option codes
const ECHO = 1;
const SUPPRESS_GO_AHEAD = 3;

export function stripTelnetCommands(data: Buffer): Buffer {
  const result: number[] = [];
  let i = 0;
  while (i < data.length) {
    if (data[i] === IAC) {
      if (i + 1 < data.length) {
        const cmd = data[i + 1]!;
        if (cmd === WILL || cmd === WONT || cmd === DO || cmd === DONT) {
          i += 3;
          continue;
        }
        if (cmd === SB) {
          i += 2;
          while (i < data.length) {
            if (data[i] === IAC && i + 1 < data.length && data[i + 1] === SE) {
              i += 2;
              break;
            }
            i++;
          }
          continue;
        }
        i += 2;
        continue;
      } else {
        break;
      }
    }
    result.push(data[i]!);
    i++;
  }
  return Buffer.from(result);
}

type ServerCallbacks = {
  onConnect: (connection: Connection, socket: net.Socket) => void;
  onDisconnect: (connection: Connection) => void;
  onData: (connection: Connection, data: Buffer) => void;
};

export function createBBSServer(callbacks: ServerCallbacks): net.Server {
  let nextId = 1;

  const server = net.createServer((socket) => {
    const connection: Connection = {
      id: nextId++,
      remoteAddress: socket.remoteAddress ?? 'unknown',
      connectedAt: new Date(),
    };

    // Negotiate character-at-a-time mode:
    // WILL ECHO — server will handle echoing (client should not echo locally)
    // WILL SUPPRESS-GO-AHEAD — no GA signals needed
    // DO SUPPRESS-GO-AHEAD — client should suppress GA too (enables char mode)
    socket.write(Buffer.from([
      IAC, WILL, ECHO,
      IAC, WILL, SUPPRESS_GO_AHEAD,
      IAC, DO, SUPPRESS_GO_AHEAD,
    ]));

    callbacks.onConnect(connection, socket);

    socket.on('data', (rawData: Buffer) => {
      const cleaned = stripTelnetCommands(rawData);
      if (cleaned.length > 0) {
        callbacks.onData(connection, cleaned);
      }
    });

    socket.on('close', () => {
      callbacks.onDisconnect(connection);
    });

    socket.on('error', () => {
      callbacks.onDisconnect(connection);
    });
  });

  return server;
}
