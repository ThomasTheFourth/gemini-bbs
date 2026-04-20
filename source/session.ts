import {authenticateUser, createUser, getUser} from './db.js';
import {VERSION} from './version.js';
import type {Connection} from './types.js';
import type {Writable} from 'node:stream';

// ANSI helpers
const CLEAR = '\x1b[2J\x1b[H';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const MAGENTA = '\x1b[35m';
const CYAN = '\x1b[36m';

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
    write(CLEAR);
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
    writeln();
    writeln(`${CYAN} ---------------------------------------------------${RESET}`);
    writeln(`${GREEN} Gemini BBS software version ${MAGENTA}${VERSION}${RESET}`);
    writeln(`${CYAN} ---------------------------------------------------${RESET}`);
    writeln();
    writeln(`${CYAN} Welcome to...${RESET}`);
    writeln();
    writeln(`${RED}  _____ _____ ____  __  __ ___ _   _ _   _ ____${RESET}`);
    writeln(`${YELLOW} |_   _| ____|  _ \\|  \\/  |_ _| \\ | | | / ___|${RESET}`);
    writeln(`${GREEN}   | | |  _| | |_) | |\\/| || ||  \\| | | \\___ \\${RESET}`);
    writeln(`${CYAN}   | | | |___|  _ <| |  | || || |\\  | |_| |__) |${RESET}`);
    writeln(`${BLUE}   |_| |_____|_| \\_\\_|  |_|___|_| \\_|\\___/____/${RESET}`);
    writeln(`${MAGENTA}  ____ _____  _  _____ ___ ___  _   _${RESET}`);
    writeln(`${RED} / ___|_   _|/ \\|_   _|_ _/ _ \\| \\ | |${RESET}`);
    writeln(`${YELLOW} \\___ \\ | | / _ \\ | |  | | | | ||  \\| |${RESET}`);
    writeln(`${GREEN}  ___) || |/ ___ \\| |  | | |_| || |\\  |${RESET}`);
    writeln(`${CYAN} |____/ |_/_/   \\_\\_| |___\\___/|_| \\_|${RESET}`);
    writeln();
    writeln(`${CYAN} This site and software are currently a work in progress.${RESET}`);
    writeln(`${CYAN} Please check back later and follow progress at${RESET}`);
    writeln(`${CYAN} https://github.com/ThomasTheFourth/gemini-bbs${RESET}`);
    writeln();
    write(`${DIM} ${BOLD}${CYAN}L${RESET}${DIM}ogin or ${BOLD}${GREEN}R${RESET}${DIM}egister? ${RESET}`);
  }

  function drawLogin(): void {
    writeln(`${BOLD}${CYAN}━━━ Login ━━━${RESET}`);
    writeln();
    if (loginStep === 'error') {
      writeln(`${RED}${loginError}${RESET}`);
      writeln();
      write(`${DIM}Press any key to try again...${RESET}`);
    } else if (loginStep === 'username') {
      write(`${DIM}Username: ${RESET}${CYAN}`);
    } else if (loginStep === 'password') {
      writeln(`${DIM}Username: ${RESET}${loginUsername}`);
      write(`${DIM}Password: ${RESET}${CYAN}`);
    }
  }

  function drawRegister(): void {
    writeln(`${BOLD}${GREEN}━━━ Register New Account ━━━${RESET}`);
    writeln();
    if (registerStep === 'error') {
      writeln(`${RED}${registerError}${RESET}`);
      writeln();
      write(`${DIM}Press any key to try again...${RESET}`);
    } else if (registerStep === 'username') {
      write(`${DIM}Username: ${RESET}${GREEN}`);
    } else if (registerStep === 'password') {
      writeln(`${DIM}Username: ${RESET}${registerUsername}`);
      write(`${DIM}Password: ${RESET}${GREEN}`);
    } else if (registerStep === 'confirm') {
      writeln(`${DIM}Username: ${RESET}${registerUsername}`);
      writeln(`${DIM}Password: ${RESET}${'*'.repeat(registerPassword.length)}`);
      write(`${DIM}Confirm:  ${RESET}${GREEN}`);
    }
  }

  function drawMenu(): void {
    writeln(`${BOLD}${YELLOW}━━━ Main Menu ━━━${RESET}`);
    writeln();
    writeln(`${DIM}Welcome, ${BOLD}${CYAN}${username}${RESET}${DIM}!${RESET}`);
    writeln();
    writeln(`  ${BOLD}${YELLOW}1${RESET} ─ Who's Online`);
    writeln(`  ${BOLD}${YELLOW}2${RESET} ─ Message Rooms`);
    writeln(`  ${BOLD}${YELLOW}3${RESET} ─ User Profile`);
    writeln(`  ${BOLD}${YELLOW}4${RESET} ─ Logout`);
    writeln();
    write(`${DIM}Choose an option: ${RESET}`);
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
          if (char === '1') {
            screen = 'who-online';
            clearAndDraw();
          } else if (char === '2') {
            screen = 'message-rooms';
            clearAndDraw();
          } else if (char === '3') {
            screen = 'profile';
            clearAndDraw();
          } else if (char === '4') {
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

        // Error states
        if (screen === 'login' && loginStep === 'error') {
          screen = 'login';
          loginStep = 'username';
          loginUsername = '';
          loginError = '';
          inputBuffer = '';
          clearAndDraw();
          continue;
        }

        if (screen === 'register' && registerStep === 'error') {
          screen = 'register';
          registerStep = 'username';
          registerUsername = '';
          registerPassword = '';
          registerError = '';
          inputBuffer = '';
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
        clearAndDraw();
      } else if (loginStep === 'password') {
        const result = authenticateUser(loginUsername, value);
        inputBuffer = '';
        if (result.success) {
          username = loginUsername;
          callbacks.onLogin(loginUsername);
          screen = 'menu';
          clearAndDraw();
        } else {
          loginError = result.error ?? 'Login failed';
          loginStep = 'error';
          clearAndDraw();
        }
      }
    }

    if (screen === 'register') {
      if (registerStep === 'username') {
        if (value.length === 0) return;
        registerUsername = value;
        registerStep = 'password';
        inputBuffer = '';
        clearAndDraw();
      } else if (registerStep === 'password') {
        if (value.length < 4) {
          registerError = 'Password must be at least 4 characters';
          registerStep = 'error';
          inputBuffer = '';
          clearAndDraw();
          return;
        }
        registerPassword = value;
        registerStep = 'confirm';
        inputBuffer = '';
        clearAndDraw();
      } else if (registerStep === 'confirm') {
        inputBuffer = '';
        if (value !== registerPassword) {
          registerError = 'Passwords do not match';
          registerStep = 'error';
          clearAndDraw();
          return;
        }
        const result = createUser(registerUsername, value);
        if (result.success) {
          username = registerUsername;
          callbacks.onLogin(registerUsername);
          screen = 'menu';
          clearAndDraw();
        } else {
          registerError = result.error ?? 'Registration failed';
          registerStep = 'error';
          clearAndDraw();
        }
      }
    }
  }

  // Draw initial screen
  clearAndDraw();

  return handleInput;
}
