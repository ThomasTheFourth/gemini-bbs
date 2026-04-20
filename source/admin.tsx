import React, {useState, useEffect} from 'react';
import {Box, Text, useStdout, useInput} from 'ink';
import Gradient from 'ink-gradient';
import BigText from 'ink-big-text';
import type {Connection, LogEntry} from './types.js';

type AdminProps = {
  port: number;
  connections: Connection[];
  log: LogEntry[];
  onSpyConnection: (connection: Connection) => void;
};

function formatDuration(from: Date): string {
  const seconds = Math.floor((Date.now() - from.getTime()) / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {hour12: false});
}

function useTerminalSize() {
  const {stdout} = useStdout();
  const [size, setSize] = useState({
    columns: stdout?.columns ?? 80,
    rows: stdout?.rows ?? 24,
  });

  useEffect(() => {
    if (!stdout) return;
    const onResize = () => {
      setSize({columns: stdout.columns, rows: stdout.rows});
    };
    stdout.on('resize', onResize);
    return () => {
      stdout.off('resize', onResize);
    };
  }, [stdout]);

  return size;
}

type ConnectionTableProps = {
  connections: Connection[];
  selectedIndex: number;
};

function ConnectionTable({connections, selectedIndex}: ConnectionTableProps) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);
    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor="#00aacc"
      paddingX={1}
      flexGrow={1}
    >
      <Box marginBottom={1}>
        <Text bold color="#00ddff">◆ Connections</Text>
        <Text color="#557788"> ({connections.length} active)</Text>
      </Box>
      {connections.length === 0 ? (
        <Text color="#445566">  No active connections</Text>
      ) : (
        <>
          <Box>
            <Box width={6}>
              <Text bold color="#ffcc00">ID</Text>
            </Box>
            <Box width={22}>
              <Text bold color="#ffcc00">IP Address</Text>
            </Box>
            <Box width={12}>
              <Text bold color="#ffcc00">Duration</Text>
            </Box>
          </Box>
          {connections.map((conn, index) => {
            const selected = index === selectedIndex;
            return (
              <Box key={conn.id}>
                <Box width={6}>
                  <Text inverse={selected} color={selected ? '#00ddff' : '#aabbcc'}>
                    {selected ? '▸' : ' '}{conn.id}
                  </Text>
                </Box>
                <Box width={22}>
                  <Text inverse={selected} color={selected ? '#00ddff' : '#aabbcc'}>
                    {conn.remoteAddress}
                  </Text>
                </Box>
                <Box width={12}>
                  <Text inverse={selected} color={selected ? '#00ddff' : '#aabbcc'}>
                    {formatDuration(conn.connectedAt)}
                  </Text>
                </Box>
              </Box>
            );
          })}
        </>
      )}
    </Box>
  );
}

function EventLog({log}: {log: LogEntry[]}) {
  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor="#6644aa"
      paddingX={1}
      flexGrow={1}
    >
      <Box marginBottom={1}>
        <Text bold color="#aa66ff">◆ Event Log</Text>
      </Box>
      {log.length === 0 ? (
        <Text color="#445566">  Waiting for connections...</Text>
      ) : (
        log.slice(-15).map((entry, i) => (
          <Text key={i}>
            <Text color="#555577">[{formatTime(entry.timestamp)}]</Text>{' '}
            <Text color="#9999bb">{entry.message}</Text>
          </Text>
        ))
      )}
    </Box>
  );
}

export default function Admin({port, connections, log, onSpyConnection}: AdminProps) {
  const {columns, rows} = useTerminalSize();
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (connections.length === 0) {
      setSelectedIndex(0);
    } else if (selectedIndex >= connections.length) {
      setSelectedIndex(connections.length - 1);
    }
  }, [connections.length, selectedIndex]);

  useInput((_input, key) => {
    if (connections.length === 0) return;

    if (key.upArrow) {
      setSelectedIndex((i) => Math.max(0, i - 1));
    } else if (key.downArrow) {
      setSelectedIndex((i) => Math.min(connections.length - 1, i + 1));
    } else if (key.return) {
      const connection = connections[selectedIndex];
      if (connection) {
        onSpyConnection(connection);
      }
    }
  });

  return (
    <Box
      flexDirection="column"
      width={columns}
      height={rows}
    >
      {/* Header */}
      <Box
        borderStyle="double"
        borderColor="#00cc66"
        justifyContent="center"
        paddingX={1}
      >
        <Gradient name="pastel">
          <BigText text="GEMINI BBS" font="tiny" />
        </Gradient>
      </Box>

      {/* Status Bar */}
      <Box
        borderStyle="single"
        borderColor="#334455"
        paddingX={1}
        justifyContent="space-between"
      >
        <Box>
          <Text color="#667788">Status: </Text>
          <Text bold color="#00ff88">● ONLINE</Text>
        </Box>
        <Box>
          <Text color="#667788">Port: </Text>
          <Text bold color="#ffcc00">{port}</Text>
        </Box>
        <Box>
          <Text color="#667788">Connections: </Text>
          <Text bold color="#ffcc00">{connections.length}</Text>
        </Box>
      </Box>

      {/* Main content area */}
      <Box flexGrow={1} flexDirection="column">
        <ConnectionTable connections={connections} selectedIndex={selectedIndex} />
        <EventLog log={log} />
      </Box>

      {/* Footer */}
      <Box paddingX={1} justifyContent="center">
        <Text color="#445566">↑↓ Navigate  </Text>
        <Text color="#00bbdd">Enter</Text>
        <Text color="#445566">: Spy on connection  </Text>
        <Text color="#cc4488">ESC</Text>
        <Text color="#445566">: Exit spy mode</Text>
      </Box>
    </Box>
  );
}
