import React, {useState, useEffect} from 'react';
import {Box, Text, useStdout, useInput} from 'ink';
import Gradient from 'ink-gradient';
import BigText from 'ink-big-text';
import type {BbsConfig} from './config.js';
import {getConfig, updateConfig} from './config.js';
import type {Connection, LogEntry} from './types.js';

type AdminMode = 'dashboard' | 'config';

type AdminProps = {
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

// --- Config Screen ---

type ConfigField = {
  key: keyof BbsConfig;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'cycle';
  options?: string[];
};

const CONFIG_FIELDS: ConfigField[] = [
  {key: 'siteName', label: 'Site Name', type: 'string'},
  {key: 'sysopName', label: 'Sysop Name', type: 'string'},
  {key: 'location', label: 'Location', type: 'string'},
  {key: 'port', label: 'Telnet Port', type: 'number'},
  {key: 'maxNodes', label: 'Max Nodes', type: 'number'},
  {key: 'clearOnNavigate', label: 'Clear Screen', type: 'boolean'},
  {key: 'bannerStyle', label: 'Banner Style', type: 'cycle', options: ['block', 'shadow', 'outline', 'slant', 'double']},
];

type ConfigScreenProps = {
  onClose: () => void;
};

function ConfigScreen({onClose}: ConfigScreenProps) {
  const {columns, rows} = useTerminalSize();
  const [selectedField, setSelectedField] = useState(0);
  const [editing, setEditing] = useState(false);
  const [editBuffer, setEditBuffer] = useState('');
  const [config, setConfig] = useState<BbsConfig>(getConfig());
  const [saved, setSaved] = useState(false);

  useInput((input, key) => {
    if (editing) {
      if (key.escape) {
        setEditing(false);
        setEditBuffer('');
      } else if (key.return) {
        const field = CONFIG_FIELDS[selectedField]!;
        if (editBuffer.length > 0) {
          const value = field.type === 'number' ? Number(editBuffer) : editBuffer;
          if (field.type === 'number' && isNaN(value as number)) {
            // invalid number, ignore
          } else {
            const updated = updateConfig({[field.key]: value});
            setConfig(updated);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
          }
        }
        setEditing(false);
        setEditBuffer('');
      } else if (key.backspace || key.delete) {
        setEditBuffer((b) => b.slice(0, -1));
      } else if (input && !key.ctrl && !key.meta) {
        setEditBuffer((b) => b + input);
      }
    } else {
      if (key.escape) {
        onClose();
      } else if (key.upArrow) {
        setSelectedField((i) => Math.max(0, i - 1));
      } else if (key.downArrow) {
        setSelectedField((i) => Math.min(CONFIG_FIELDS.length - 1, i + 1));
      } else if (key.return) {
        const field = CONFIG_FIELDS[selectedField]!;
        if (field.type === 'boolean') {
          const updated = updateConfig({[field.key]: !config[field.key]});
          setConfig(updated);
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        } else if (field.type === 'cycle' && field.options) {
          const current = String(config[field.key]);
          const idx = field.options.indexOf(current);
          const next = field.options[(idx + 1) % field.options.length]!;
          const updated = updateConfig({[field.key]: next});
          setConfig(updated);
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        } else {
          setEditing(true);
          setEditBuffer(String(config[field.key]));
        }
      }
    }
  });

  return (
    <Box flexDirection="column" width={columns} height={rows}>
      {/* Header */}
      <Box
        borderStyle="double"
        borderColor="#ff8844"
        justifyContent="center"
        paddingX={1}
      >
        <Text bold color="#ff8844">⚙  BBS Configuration</Text>
      </Box>

      {/* Config Fields */}
      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor="#ff8844"
        paddingX={2}
        paddingY={1}
        flexGrow={1}
      >
        {CONFIG_FIELDS.map((field, index) => {
          const selected = index === selectedField;
          const currentValue = String(config[field.key]);
          const isEditing = selected && editing;

          return (
            <Box key={field.key} marginBottom={1}>
              <Box width={16}>
                <Text bold={selected} color={selected ? '#ff8844' : '#667788'}>
                  {selected ? '▸ ' : '  '}{field.label}:
                </Text>
              </Box>
              <Box>
                {isEditing ? (
                  <Text color="#ffcc00">{editBuffer}<Text color="#ffcc00">▌</Text></Text>
                ) : field.type === 'boolean' ? (
                  <Text color={config[field.key] ? '#00ff88' : '#ff4444'}>
                    {config[field.key] ? '● ON' : '○ OFF'}
                    {selected ? <Text dimColor> (Enter to toggle)</Text> : ''}
                  </Text>
                ) : field.type === 'cycle' ? (
                  <Text color="#ffcc00">
                    {currentValue}
                    {selected ? <Text dimColor> (Enter to cycle)</Text> : ''}
                  </Text>
                ) : (
                  <Text color={selected ? '#ffffff' : '#aabbcc'}>{currentValue}</Text>
                )}
              </Box>
            </Box>
          );
        })}

        {saved && (
          <Box marginTop={1}>
            <Text bold color="#00ff88">✓ Configuration saved!</Text>
          </Box>
        )}

        <Box marginTop={1}>
          <Text color="#555566" dimColor>
            Note: Port changes require a server restart to take effect.
          </Text>
        </Box>
      </Box>

      {/* Footer */}
      <Box paddingX={1} justifyContent="center">
        <Text color="#445566">↑↓ Select  </Text>
        <Text color="#ff8844">Enter</Text>
        <Text color="#445566">: Edit field  </Text>
        <Text color="#cc4488">ESC</Text>
        <Text color="#445566">{editing ? ': Cancel edit' : ': Back to dashboard'}</Text>
      </Box>
    </Box>
  );
}

// --- Main Admin ---

export default function Admin({connections, log, onSpyConnection}: AdminProps) {
  const {columns, rows} = useTerminalSize();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mode, setMode] = useState<AdminMode>('dashboard');
  const config = getConfig();

  useEffect(() => {
    if (connections.length === 0) {
      setSelectedIndex(0);
    } else if (selectedIndex >= connections.length) {
      setSelectedIndex(connections.length - 1);
    }
  }, [connections.length, selectedIndex]);

  useInput((_input, key) => {
    if (mode !== 'dashboard') return;

    if (_input === 'c' || _input === 'C') {
      setMode('config');
      return;
    }

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

  if (mode === 'config') {
    return <ConfigScreen onClose={() => setMode('dashboard')} />;
  }

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
          <Text bold color="#ffcc00">{config.port}</Text>
        </Box>
        <Box>
          <Text color="#667788">Nodes: </Text>
          <Text bold color="#ffcc00">{connections.length}/{config.maxNodes}</Text>
        </Box>
        <Box>
          <Text color="#667788">Sysop: </Text>
          <Text bold color="#00ddff">{config.sysopName}</Text>
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
        <Text color="#445566">: Spy  </Text>
        <Text color="#ff8844">C</Text>
        <Text color="#445566">: Config  </Text>
        <Text color="#cc4488">ESC</Text>
        <Text color="#445566">: Exit spy</Text>
      </Box>
    </Box>
  );
}
