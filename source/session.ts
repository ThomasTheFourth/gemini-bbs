import {authenticateUser, createUser, getUser} from './db.js';
import {VERSION} from './version.js';
import {getConfig} from './config.js';
import type {Connection} from './types.js';
import type {Writable} from 'node:stream';

// ANSI helpers
const CLEAR = '\x1b[2J\x1b[H';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const RED = '\x1b[91m';       // bright red
const GREEN = '\x1b[92m';     // bright green
const YELLOW = '\x1b[93m';    // bright yellow
const MAGENTA = '\x1b[95m';   // bright magenta
const CYAN = '\x1b[96m';      // bright cyan
const WHITE = '\x1b[97m';     // bright white

// Font type
type FontMap = Record<string, string[]>;

// ── Block: solid filled characters ──
const FONT_BLOCK: FontMap = {
  A: ['  █  ', ' █ █ ', '█████', '█   █', '█   █'],
  B: ['████ ', '█   █', '████ ', '█   █', '████ '],
  C: [' ████', '█    ', '█    ', '█    ', ' ████'],
  D: ['████ ', '█   █', '█   █', '█   █', '████ '],
  E: ['█████', '█    ', '████ ', '█    ', '█████'],
  F: ['█████', '█    ', '████ ', '█    ', '█    '],
  G: [' ████', '█    ', '█  ██', '█   █', ' ████'],
  H: ['█   █', '█   █', '█████', '█   █', '█   █'],
  I: ['█████', '  █  ', '  █  ', '  █  ', '█████'],
  J: ['█████', '   █ ', '   █ ', '█  █ ', ' ██  '],
  K: ['█   █', '█  █ ', '███  ', '█  █ ', '█   █'],
  L: ['█    ', '█    ', '█    ', '█    ', '█████'],
  M: ['█   █', '██ ██', '█ █ █', '█   █', '█   █'],
  N: ['█   █', '██  █', '█ █ █', '█  ██', '█   █'],
  O: [' ███ ', '█   █', '█   █', '█   █', ' ███ '],
  P: ['████ ', '█   █', '████ ', '█    ', '█    '],
  Q: [' ███ ', '█   █', '█ █ █', '█  █ ', ' ██ █'],
  R: ['████ ', '█   █', '████ ', '█  █ ', '█   █'],
  S: [' ████', '█    ', ' ███ ', '    █', '████ '],
  T: ['█████', '  █  ', '  █  ', '  █  ', '  █  '],
  U: ['█   █', '█   █', '█   █', '█   █', ' ███ '],
  V: ['█   █', '█   █', '█   █', ' █ █ ', '  █  '],
  W: ['█   █', '█   █', '█ █ █', '██ ██', '█   █'],
  X: ['█   █', ' █ █ ', '  █  ', ' █ █ ', '█   █'],
  Y: ['█   █', ' █ █ ', '  █  ', '  █  ', '  █  '],
  Z: ['█████', '   █ ', '  █  ', ' █   ', '█████'],
  ' ': ['     ', '     ', '     ', '     ', '     '],
};

// ── Shadow: block with shadow effect ──
const FONT_SHADOW: FontMap = {
  A: ['  ▄  ', ' █▀█ ', '█▀▀█▌', '█  █▌', '▀  ▀ '],
  B: ['▄▄▄ ', '█▀▀█▌', '█▀▀█▌', '█▄▄█▌', ' ▀▀▀ '],
  C: [' ▄▄▄', '█▀   ', '█    ', '█▄   ', ' ▀▀▀ '],
  D: ['▄▄▄ ', '█▀▀█▌', '█  █▌', '█▄▄█▌', ' ▀▀▀ '],
  E: ['▄▄▄▄', '█▀   ', '█▀▀  ', '█▄▄▄', ' ▀▀▀ '],
  F: ['▄▄▄▄', '█▀   ', '█▀▀  ', '█    ', '▀    '],
  G: [' ▄▄▄', '█▀   ', '█ ▀█▌', '█▄▄█▌', ' ▀▀▀ '],
  H: ['▄  ▄', '█  █▌', '█▀▀█▌', '█  █▌', '▀  ▀ '],
  I: ['▄▄▄▄', ' █▌  ', ' █▌  ', ' █▌  ', '▀▀▀▀ '],
  J: ['▄▄▄▄', '  █▌ ', '  █▌ ', '█▄█▌ ', ' ▀▀  '],
  K: ['▄  ▄', '█ █▌ ', '██▌  ', '█ █▌ ', '▀  ▀ '],
  L: ['▄    ', '█    ', '█    ', '█▄▄▄', ' ▀▀▀ '],
  M: ['▄   ▄', '██▄██', '█ █ █', '█   █', '▀   ▀'],
  N: ['▄   ▄', '██  █', '█ █ █', '█  ██', '▀   ▀'],
  O: [' ▄▄ ', '█▀▀█▌', '█  █▌', '█▄▄█▌', ' ▀▀  '],
  P: ['▄▄▄ ', '█▀▀█▌', '█▀▀▀ ', '█    ', '▀    '],
  Q: [' ▄▄ ', '█▀▀█▌', '█ █▌ ', '█▄▀█▌', ' ▀▀▀ '],
  R: ['▄▄▄ ', '█▀▀█▌', '█▀▀█▌', '█  █▌', '▀  ▀ '],
  S: [' ▄▄▄', '█▀   ', ' ▀▀▄ ', '  ▄█▌', '▀▀▀  '],
  T: ['▄▄▄▄', ' █▌  ', ' █▌  ', ' █▌  ', ' ▀   '],
  U: ['▄  ▄', '█  █▌', '█  █▌', '█▄▄█▌', ' ▀▀  '],
  V: ['▄  ▄', '█  █▌', '█  █▌', ' █▌█ ', ' ▀▀  '],
  W: ['▄   ▄', '█   █', '█ █ █', '██▀██', '▀   ▀'],
  X: ['▄  ▄', ' █▌█ ', ' ██  ', ' █▌█ ', '▀  ▀ '],
  Y: ['▄  ▄', ' █▌█ ', ' ██  ', ' █▌  ', ' ▀   '],
  Z: ['▄▄▄▄', '  █▌ ', ' █▌  ', '█▌   ', '▀▀▀▀ '],
  ' ': ['     ', '     ', '     ', '     ', '     '],
};

// ── Outline: hollow box-drawing characters ──
const FONT_OUTLINE: FontMap = {
  A: ['  ╱╲  ', ' ╱  ╲ ', '╱────╲', '│    │', '╵    ╵'],
  B: ['┌──┐ ', '│  │ ', '├──┤ ', '│  │ ', '└──┘ '],
  C: ['┌───┐', '│    ', '│    ', '│    ', '└───┘'],
  D: ['┌──┐ ', '│  │ ', '│  │ ', '│  │ ', '└──┘ '],
  E: ['┌────', '│    ', '├──  ', '│    ', '└────'],
  F: ['┌────', '│    ', '├──  ', '│    ', '╵    '],
  G: ['┌───┐', '│    ', '│ ┌─┐', '│ └─┤', '└───┘'],
  H: ['╷   ╷', '│   │', '├───┤', '│   │', '╵   ╵'],
  I: ['┬───┬', '  │  ', '  │  ', '  │  ', '┴───┴'],
  J: ['┬───┬', '   │ ', '   │ ', '└──┘ ', '     '],
  K: ['╷  ╷ ', '│ ╱  ', '├╱   ', '│╲   ', '╵  ╲ '],
  L: ['╷    ', '│    ', '│    ', '│    ', '└────'],
  M: ['╷   ╷', '├╲ ╱┤', '│ ╳ │', '│   │', '╵   ╵'],
  N: ['╷   ╷', '├╲  │', '│ ╲ │', '│  ╲│', '╵   ╵'],
  O: ['┌───┐', '│   │', '│   │', '│   │', '└───┘'],
  P: ['┌──┐ ', '│  │ ', '├──┘ ', '│    ', '╵    '],
  Q: ['┌───┐', '│   │', '│ ╲ │', '│  ╲│', '└───╲'],
  R: ['┌──┐ ', '│  │ ', '├──┘ ', '│ ╲  ', '╵  ╲ '],
  S: ['┌───┐', '│    ', '└──┐ ', '   │ ', '└──┘ '],
  T: ['┬───┬', '  │  ', '  │  ', '  │  ', '  ╵  '],
  U: ['╷   ╷', '│   │', '│   │', '│   │', '└───┘'],
  V: ['╷   ╷', '│   │', '│   │', ' ╲ ╱ ', '  V  '],
  W: ['╷   ╷', '│   │', '│ ╱ │', '├╱ ╲┤', '╵   ╵'],
  X: ['╲   ╱', ' ╲ ╱ ', '  X  ', ' ╱ ╲ ', '╱   ╲'],
  Y: ['╲   ╱', ' ╲ ╱ ', '  │  ', '  │  ', '  ╵  '],
  Z: ['┌───┐', '   ╱ ', '  ╱  ', ' ╱   ', '└───┘'],
  ' ': ['     ', '     ', '     ', '     ', '     '],
};

// ── Slant: forward-leaning style ──
const FONT_SLANT: FontMap = {
  A: ['    __ ', '   /  |', '  / --|', ' / /| |', '/_/ |_|'],
  B: [' ____ ', '|  _ \\', '| |_) |', '|  _ <', '|_| \\_\\'],
  C: ['  ___ ', ' / __|', '| (__ ', ' \\ __|', '  |_| '],
  D: [' ____ ', '|  _ \\', '| | | |', '| |_| |', '|____/'],
  E: [' ____ ', '| ___|', '| _|_ ', '| |__ ', '|____|'],
  F: [' ____ ', '| ___|', '| _|  ', '| |   ', '|_|   '],
  G: ['  ___ ', ' / __|', '| |_  ', '| |_| |', ' \\___/'],
  H: [' _  _ ', '| || |', '| __ |', '| || |', '|_||_|'],
  I: [' ___ ', '|_ _|', ' | | ', ' | | ', '|___|'],
  J: ['   __ ', '  |_ |', '   | |', '|__| |', '|___|'],
  K: [' _  __', '| |/ /', '| . / ', '| |\\ \\', '|_| \\_\\'],
  L: [' _    ', '| |   ', '| |   ', '| |__ ', '|____|'],
  M: [' __  __', '|  \\/  |', '| |\\/| |', '| |  | |', '|_|  |_|'],
  N: [' _  _ ', '| \\| |', '| .` |', '| |\\ |', '|_| \\|'],
  O: ['  ___  ', ' / _ \\ ', '| | | |', '| |_| |', ' \\___/ '],
  P: [' ____ ', '|  _ \\', '| |_) |', '|  __/', '|_|   '],
  Q: ['  ___  ', ' / _ \\ ', '| | | |', '| |_| |', ' \\__\\_\\'],
  R: [' ____ ', '|  _ \\', '| |_) |', '|  _ <', '|_| \\_\\'],
  S: ['  ___ ', ' / __|', ' \\__ \\', ' |__) |', ' |___/'],
  T: [' _____ ', '|_   _|', '  | |  ', '  | |  ', '  |_|  '],
  U: [' _   _ ', '| | | |', '| | | |', '| |_| |', ' \\___/ '],
  V: ['__   __', '\\ \\ / /', ' \\ V / ', '  \\ /  ', '  |_|  '],
  W: ['__      __', '\\ \\    / /', ' \\ \\/\\/ / ', '  \\    /  ', '   \\__/   '],
  X: ['__  __', '\\ \\/ /', ' >  < ', '/ /\\ \\', '/_/\\_\\'],
  Y: ['__   __', '\\ \\ / /', ' \\ V / ', '  | |  ', '  |_|  '],
  Z: [' _____', '|__  /', '  / / ', ' / /_ ', '/____| '],
  ' ': ['     ', '     ', '     ', '     ', '     '],
};

// ── Double: double-line box style ──
const FONT_DOUBLE: FontMap = {
  A: ['  ╔╗  ', ' ╔╝╚╗ ', '╔╩══╩╗', '║    ║', '╩    ╩'],
  B: ['╔══╗ ', '║  ║ ', '╠══╣ ', '║  ║ ', '╚══╝ '],
  C: ['╔════', '║    ', '║    ', '║    ', '╚════'],
  D: ['╔══╗ ', '║  ║ ', '║  ║ ', '║  ║ ', '╚══╝ '],
  E: ['╔════', '║    ', '╠══  ', '║    ', '╚════'],
  F: ['╔════', '║    ', '╠══  ', '║    ', '╩    '],
  G: ['╔════', '║    ', '║ ╔═╗', '║ ╚═╣', '╚═══╝'],
  H: ['╦   ╦', '║   ║', '╠═══╣', '║   ║', '╩   ╩'],
  I: ['╔═══╗', '  ║  ', '  ║  ', '  ║  ', '╚═══╝'],
  J: ['╔═══╗', '   ║ ', '   ║ ', '╚══╝ ', '     '],
  K: ['╦  ╦ ', '║ ╔╝ ', '╠═╝  ', '║ ╚╗ ', '╩  ╚╗'],
  L: ['╦    ', '║    ', '║    ', '║    ', '╚════'],
  M: ['╦   ╦', '║╗ ╔║', '║ ╬ ║', '║   ║', '╩   ╩'],
  N: ['╦   ╦', '║╗  ║', '║ ╗ ║', '║  ╗║', '╩   ╩'],
  O: ['╔═══╗', '║   ║', '║   ║', '║   ║', '╚═══╝'],
  P: ['╔══╗ ', '║  ║ ', '╠══╝ ', '║    ', '╩    '],
  Q: ['╔═══╗', '║   ║', '║ ╗ ║', '║  ╚╗', '╚═══╝'],
  R: ['╔══╗ ', '║  ║ ', '╠══╝ ', '║ ╚╗ ', '╩  ╚╗'],
  S: ['╔════', '║    ', '╚══╗ ', '   ║ ', '═══╝ '],
  T: ['╔═══╗', '  ║  ', '  ║  ', '  ║  ', '  ╩  '],
  U: ['╦   ╦', '║   ║', '║   ║', '║   ║', '╚═══╝'],
  V: ['╦   ╦', '║   ║', '║   ║', ' ╚ ╔ ', '  ╩  '],
  W: ['╦   ╦', '║   ║', '║ ║ ║', '║╗ ╔║', '╩   ╩'],
  X: ['╲   ╱', ' ╲ ╱ ', '  ╬  ', ' ╱ ╲ ', '╱   ╲'],
  Y: ['╲   ╱', ' ╲ ╱ ', '  ║  ', '  ║  ', '  ╩  '],
  Z: ['╔═══╗', '   ╔╝', '  ╔╝ ', ' ╔╝  ', '╚════'],
  ' ': ['     ', '     ', '     ', '     ', '     '],
};

const FONTS: Record<string, FontMap> = {
  block: FONT_BLOCK,
  shadow: FONT_SHADOW,
  outline: FONT_OUTLINE,
  slant: FONT_SLANT,
  double: FONT_DOUBLE,
};

function renderBlockText(text: string, style: string): string[] {
  const font = FONTS[style] ?? FONT_BLOCK;
  const chars = text.toUpperCase().split('');
  const rows: string[] = ['', '', '', '', ''];
  for (const ch of chars) {
    const glyph = font[ch] ?? font[' '] ?? ['     ', '     ', '     ', '     ', '     '];
    for (let r = 0; r < 5; r++) {
      rows[r] += glyph[r] + ' ';
    }
  }
  return rows;
}

// Rainbow colors cycling per row
const RAINBOW = [RED, YELLOW, GREEN, CYAN, MAGENTA];

type ScreenState = 'welcome' | 'login' | 'register' | 'menu' | 'who-online' | 'message-rooms' | 'profile';
type LoginStep = 'username' | 'password' | 'error';
type RegisterStep = 'username' | 'password' | 'confirm' | 'error';

export type SessionCallbacks = {
  onLogin: (username: string) => void;
  onDisconnect: () => void;
  getConnections: () => Connection[];
};

export function createSession(
  stream: Writable,
  callbacks: SessionCallbacks,
): (data: Buffer) => void {
  let screen: ScreenState = 'welcome';
  let inputBuffer = '';

  // Login state
  let loginStep: LoginStep = 'username';
  let loginUsername = '';
  let loginError = '';

  // Register state
  let registerStep: RegisterStep = 'username';
  let registerUsername = '';
  let registerPassword = '';
  let registerError = '';

  // Authenticated user
  let username = '';

  function write(text: string): void {
    stream.write(text);
  }

  function writeln(text: string = ''): void {
    stream.write(text + '\r\n');
  }

  function clearAndDraw(): void {
    if (getConfig().clearOnNavigate) {
      write(CLEAR);
    } else {
      writeln();
    }
    drawScreen();
  }

  function drawScreen(): void {
    switch (screen) {
      case 'welcome': {
        drawWelcome();
        break;
      }
      case 'login': {
        drawLogin();
        break;
      }
      case 'register': {
        drawRegister();
        break;
      }
      case 'menu': {
        drawMenu();
        break;
      }
      case 'who-online': {
        drawWhoOnline();
        break;
      }
      case 'message-rooms': {
        drawMessageRooms();
        break;
      }
      case 'profile': {
        drawProfile();
        break;
      }
    }
  }

  function drawWelcome(): void {
    const cfg = getConfig();
    const blockLines = renderBlockText(cfg.siteName, cfg.bannerStyle);

    writeln();
    writeln(`${CYAN}${'═'.repeat(80)}${RESET}`);
    writeln(`${GREEN}  Gemini BBS v${VERSION}${RESET}`);
    writeln(`${CYAN}${'═'.repeat(80)}${RESET}`);
    writeln();
    writeln(`${WHITE}${BOLD} Welcome to...${RESET}`);
    writeln();
    for (let i = 0; i < blockLines.length; i++) {
      writeln(` ${RAINBOW[i % RAINBOW.length]}${BOLD}${blockLines[i]}${RESET}`);
    }
    writeln();
    writeln(`${YELLOW}  Sysop: ${WHITE}${BOLD}${cfg.sysopName}${RESET}`);
    writeln(`${YELLOW}  Location: ${WHITE}${BOLD}${cfg.location}${RESET}`);
    writeln();
    writeln(`${CYAN}${'═'.repeat(80)}${RESET}`);
    writeln();
    write(`${BOLD}${CYAN}L${RESET}${DIM}ogin or ${RESET}${BOLD}${GREEN}R${RESET}${DIM}egister? ${RESET}`);
  }

  function drawLogin(): void {
    if (loginStep === 'error') {
      writeln(`${RED}${loginError}${RESET}`);
      writeln();
      write(`${DIM}Press any key to try again...${RESET}`);
    } else if (loginStep === 'username') {
      write(`${DIM}Username: ${RESET}${CYAN}`);
    } else if (loginStep === 'password') {
      write(`${DIM}Password: ${RESET}${CYAN}`);
    }
  }

  function drawRegister(): void {
    if (registerStep === 'error') {
      writeln(`${RED}${registerError}${RESET}`);
      writeln();
      write(`${DIM}Press any key to try again...${RESET}`);
    } else if (registerStep === 'username') {
      write(`${DIM}Username: ${RESET}${GREEN}`);
    } else if (registerStep === 'password') {
      write(`${DIM}Password: ${RESET}${GREEN}`);
    } else if (registerStep === 'confirm') {
      write(`${DIM}Confirm:  ${RESET}${GREEN}`);
    }
  }

  function drawMenu(): void {
    const W = 78; // inner width between │ borders (80 - 2 for borders)
    const hr = '─'.repeat(W);
    const pad = (text: string, len: number) => {
      // pad plain text to len, ignoring ANSI codes for length calc
      const plain = text.replace(/\x1b\[[0-9;]*m/g, '');
      const needed = len - plain.length;
      return needed > 0 ? text + ' '.repeat(needed) : text;
    };
    const row = (content: string) => {
      writeln(`${CYAN}│${RESET}${pad(content, W)}${CYAN}│${RESET}`);
    };

    writeln(`${CYAN}┌${hr}┐${RESET}`);
    row(`  ${BOLD}${YELLOW}${getConfig().siteName}${RESET}  ${DIM}::${RESET}  ${BOLD}Main Menu${RESET}`);
    writeln(`${CYAN}├${hr}┤${RESET}`);
    row('');
    row(`   ${BOLD}${YELLOW}[${RESET}${BOLD}W${YELLOW}]${RESET} Who's Online`);
    row(`   ${BOLD}${YELLOW}[${RESET}${BOLD}M${YELLOW}]${RESET} Message Rooms`);
    row(`   ${BOLD}${YELLOW}[${RESET}${BOLD}P${YELLOW}]${RESET} User Profile`);
    row(`   ${BOLD}${YELLOW}[${RESET}${BOLD}G${YELLOW}]${RESET} Goodbye (Logoff)`);
    row('');
    writeln(`${CYAN}├${hr}┤${RESET}`);
    row(`  ${DIM}User: ${RESET}${BOLD}${CYAN}${username}${RESET}`)
    writeln(`${CYAN}└${hr}┘${RESET}`);
    writeln();
    write(` ${DIM}Command: ${RESET}`);
  }

  function drawWhoOnline(): void {
    const conns = callbacks.getConnections();
    writeln(`${BOLD}${CYAN}━━━ Who's Online ━━━${RESET}`);
    writeln();
    if (conns.length === 0) {
      writeln(`${DIM}No one is online.${RESET}`);
    } else {
      writeln(`${BOLD}${YELLOW}${'Username'.padEnd(20)}${'IP Address'.padEnd(22)}${RESET}`);
      for (const conn of conns) {
        const name = conn.username ?? '(logging in)';
        writeln(`${name.padEnd(20)}${DIM}${conn.remoteAddress.padEnd(22)}${RESET}`);
      }
    }
    writeln();
    write(`${DIM}Press any key to return to menu...${RESET}`);
  }

  function drawMessageRooms(): void {
    writeln(`${BOLD}${MAGENTA}━━━ Message Rooms ━━━${RESET}`);
    writeln();
    writeln(`${DIM}Coming soon! This feature is under development.${RESET}`);
    writeln();
    write(`${DIM}Press any key to return to menu...${RESET}`);
  }

  function drawProfile(): void {
    const user = getUser(username);
    writeln(`${BOLD}${YELLOW}━━━ User Profile ━━━${RESET}`);
    writeln();
    if (user) {
      writeln(`${DIM}Username:     ${RESET}${BOLD}${CYAN}${user.username}${RESET}`);
      writeln(`${DIM}Member since: ${RESET}${user.createdAt}`);
      writeln(`${DIM}Last login:   ${RESET}${user.lastLogin ?? 'First time!'}`);
    } else {
      writeln(`${RED}Could not load profile.${RESET}`);
    }
    writeln();
    write(`${DIM}Press any key to return to menu...${RESET}`);
  }

  function redrawInputLine(masked: boolean): void {
    // \r moves to start of line, \x1b[K clears to end of line
    const display = masked ? '*'.repeat(inputBuffer.length) : inputBuffer;
    if (screen === 'login') {
      if (loginStep === 'username') {
        write(`\r${DIM}Username: ${RESET}${CYAN}${display}\x1b[K`);
      } else if (loginStep === 'password') {
        write(`\r${DIM}Password: ${RESET}${CYAN}${display}\x1b[K`);
      }
    } else if (screen === 'register') {
      if (registerStep === 'username') {
        write(`\r${DIM}Username: ${RESET}${GREEN}${display}\x1b[K`);
      } else if (registerStep === 'password') {
        write(`\r${DIM}Password: ${RESET}${GREEN}${display}\x1b[K`);
      } else if (registerStep === 'confirm') {
        write(`\r${DIM}Confirm:  ${RESET}${GREEN}${display}\x1b[K`);
      }
    }
  }

  function isPasswordField(): boolean {
    return (
      (screen === 'login' && loginStep === 'password') ||
      (screen === 'register' && (registerStep === 'password' || registerStep === 'confirm'))
    );
  }

  // Input handler
  function handleInput(data: Buffer): void {
    for (const byte of data) {
      // Ignore LF (telnet sends \r\n)
      if (byte === 0x0a) continue;

      // Ctrl+C — disconnect
      if (byte === 0x03) {
        callbacks.onDisconnect();
        return;
      }

      // Enter
      if (byte === 0x0d) {
        handleSubmit();
        continue;
      }

      // Backspace
      if (byte === 0x7f || byte === 0x08) {
        if (inputBuffer.length > 0) {
          inputBuffer = inputBuffer.slice(0, -1);
          redrawInputLine(isPasswordField());
        }
        continue;
      }

      // Printable characters
      if (byte >= 0x20 && byte <= 0x7e) {
        const char = String.fromCharCode(byte);

        // Single-key screens
        if (screen === 'welcome') {
          if (char === 'l' || char === 'L') {
            screen = 'login';
            loginStep = 'username';
            loginUsername = '';
            loginError = '';
            inputBuffer = '';
            clearAndDraw();
          } else if (char === 'r' || char === 'R') {
            screen = 'register';
            registerStep = 'username';
            registerUsername = '';
            registerPassword = '';
            registerError = '';
            inputBuffer = '';
            clearAndDraw();
          }
          continue;
        }

        if (screen === 'menu') {
          const key = char.toLowerCase();
          if (key === 'w') {
            screen = 'who-online';
            clearAndDraw();
          } else if (key === 'm') {
            screen = 'message-rooms';
            clearAndDraw();
          } else if (key === 'p') {
            screen = 'profile';
            clearAndDraw();
          } else if (key === 'g') {
            callbacks.onDisconnect();
          }
          continue;
        }

        // "Press any key" screens
        if (screen === 'who-online' || screen === 'message-rooms' || screen === 'profile') {
          screen = 'menu';
          clearAndDraw();
          continue;
        }

        // Buffer input
        inputBuffer += char;
        redrawInputLine(isPasswordField());
      }
    }
  }

  function handleSubmit(): void {
    const value = inputBuffer.trim();

    if (screen === 'login') {
      if (loginStep === 'username') {
        if (value.length === 0) return;
        loginUsername = value;
        loginStep = 'password';
        inputBuffer = '';
        writeln();
        drawLogin();
      } else if (loginStep === 'password') {
        const result = authenticateUser(loginUsername, value);
        inputBuffer = '';
        if (result.success) {
          username = loginUsername;
          callbacks.onLogin(loginUsername);
          screen = 'menu';
          clearAndDraw();
        } else {
          writeln();
          writeln(`${RED}${result.error ?? 'Login failed'}${RESET}`);
          writeln();
          screen = 'welcome';
          drawWelcome();
          return;
        }
      }
    }

    if (screen === 'register') {
      if (registerStep === 'username') {
        if (value.length === 0) return;
        registerUsername = value;
        registerStep = 'password';
        inputBuffer = '';
        writeln();
        drawRegister();
      } else if (registerStep === 'password') {
        if (value.length < 4) {
          inputBuffer = '';
          writeln();
          writeln(`${RED}Password must be at least 4 characters${RESET}`);
          writeln();
          screen = 'welcome';
          drawWelcome();
          return;
        }
        registerPassword = value;
        registerStep = 'confirm';
        inputBuffer = '';
        writeln();
        drawRegister();
      } else if (registerStep === 'confirm') {
        inputBuffer = '';
        if (value !== registerPassword) {
          writeln();
          writeln(`${RED}Passwords do not match${RESET}`);
          writeln();
          screen = 'welcome';
          drawWelcome();
          return;
        }
        const result = createUser(registerUsername, value);
        if (result.success) {
          username = registerUsername;
          callbacks.onLogin(registerUsername);
          screen = 'menu';
          clearAndDraw();
        } else {
          writeln();
          writeln(`${RED}${result.error ?? 'Registration failed'}${RESET}`);
          writeln();
          screen = 'welcome';
          drawWelcome();
        }
      }
    }
  }

  // Draw initial screen
  clearAndDraw();

  return handleInput;
}
