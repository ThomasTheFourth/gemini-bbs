# Gemini BBS

A modern Bulletin Board System (BBS) built with Node.js and TypeScript. Users connect via telnet to register, log in, and interact through a classic BBS-style text interface. The server operator gets a full-screen admin dashboard built with [React Ink](https://github.com/vadimdemedes/ink) featuring live connection monitoring and sysop spy mode.

## Features

- **Telnet server** on port 23 with telnet protocol negotiation (character-at-a-time mode, server-side echo)
- **User registration and login** with bcrypt password hashing and SQLite storage
- **Character-by-character input** with password masking (classic BBS style)
- **Admin dashboard** (React Ink) with:
  - Live connection table with duration tracking
  - Scrolling event log
  - Keyboard navigation (arrow keys to select connections)
  - Sysop spy mode - mirror any user's session in real-time with scrollback history
- **Main menu** with Who's Online, Message Rooms (placeholder), User Profile, and Logout
- **TeeStream architecture** for transparent output mirroring between user sessions and admin spy mode

## Prerequisites

- [Node.js](https://nodejs.org/) v16 or later
- npm (comes with Node.js)
- A telnet client (macOS/Linux have one built in, Windows users can use [PuTTY](https://www.putty.org/))

## Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/ThomasTheFourth/gemini-bbs.git
   cd gemini-bbs
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Build the project:**

   ```bash
   npm run build
   ```

## Running the Server

Port 23 (standard telnet) requires elevated privileges:

```bash
npm run serve
```

This builds the project and starts the server with `sudo`. You will be prompted for your password.

Alternatively, build and run separately:

```bash
npm run build
sudo node dist/cli.js
```

### What You'll See

When the server starts, the **admin dashboard** renders in your terminal:

- A header with the Gemini BBS title
- A status bar showing ONLINE status, port, and connection count
- A connections panel (empty at first)
- An event log showing server activity

## Connecting as a User

From another terminal (or another machine on the network):

```bash
telnet localhost 23
```

You'll see:

1. **Welcome banner** with ASCII art
2. **Login or Register prompt** - press `L` or `R` (no Enter needed)
3. **Registration** - enter a username, password (shown as `*`), and confirm password
4. **Login** - enter your username and password
5. **Main Menu** - press `1`-`4` to navigate:
   - `1` - Who's Online (shows all connected users)
   - `2` - Message Rooms (coming soon)
   - `3` - User Profile (shows your account info)
   - `4` - Logout (disconnects)

## Admin Dashboard Controls

While the server is running, the admin dashboard is interactive:

| Key | Action |
|-----|--------|
| Up/Down arrows | Navigate the connection list |
| Enter | Enter spy mode on selected connection |
| Escape | Exit spy mode and return to dashboard |

### Spy Mode

Select a connection and press Enter to see exactly what that user sees in real-time. The last 50 lines of their session are replayed for context when you enter spy mode. Press Escape to return to the dashboard.

## Project Structure

```
source/
  cli.tsx            # Entry point - wires server, admin, and sessions together
  server.ts          # Telnet server with connection management
  admin.tsx          # Admin dashboard (React Ink)
  session.ts         # User session state machine (direct ANSI output)
  db.ts              # SQLite database module (users, bcrypt auth)
  tee-stream.ts      # PassThrough stream with spy mode mirroring
  version.ts         # Reads version from package.json
  welcome.tsx        # Welcome banner component (React Ink, used by admin)
  types.ts           # Shared TypeScript types
  screens/
    login.tsx        # Login screen component
    register.tsx     # Registration screen component
    menu.tsx         # Main menu component
    who-online.tsx   # Who's Online screen
    message-rooms.tsx # Message Rooms placeholder
    profile.tsx      # User Profile screen
```

## Data Storage

User accounts are stored in a SQLite database at `data/bbs.db`. This file is created automatically on first run. Passwords are hashed with bcrypt (10 rounds).

The database schema:

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  last_login TEXT
);
```

## Development

**Watch mode** (recompiles on file changes):

```bash
npm run dev
```

Then in another terminal, start the server:

```bash
sudo node dist/cli.js
```

**Build only:**

```bash
npm run build
```

## npm Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `build` | `tsc` | Compile TypeScript to JavaScript |
| `dev` | `tsc --watch` | Watch mode compilation |
| `start` | `node dist/cli.js` | Start server (must build first, needs sudo for port 23) |
| `serve` | `tsc && sudo node dist/cli.js` | Build and start server with sudo |

## Architecture

The server runs as a single Node.js process with two rendering paths:

- **Admin side:** React Ink renders the dashboard to the server operator's terminal (stdout). Ink handles layout, colors, and live updates naturally since it's a local terminal.
- **User side:** Direct ANSI escape code output written to a TeeStream that pipes to the telnet socket. This avoids Ink's cursor-repositioning rendering model which doesn't work over telnet. Each screen is drawn once with `\r\n` line endings, and only the current input line is updated in-place.

The TeeStream sits between the session output and the socket, allowing the admin's spy mode to tap into any connection's output stream.

## Version

The version number is read from `package.json` at runtime and displayed in the welcome banner. To update the version:

```bash
npm version patch   # 3.0.0 -> 3.0.1
npm version minor   # 3.0.0 -> 3.1.0
npm version major   # 3.0.0 -> 4.0.0
```

## License

[MIT](LICENSE)
