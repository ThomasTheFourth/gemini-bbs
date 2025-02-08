# Gemini BBS

**Gemini BBS** is a simple Bulletin Board System (BBS) built with modern languages and tool like Node.js and [React Ink](https://github.com/vadimdemedes/ink). It is a work-in-progress and not yet ready for prime time. Check back for progress.

## Prerequisites

- [Node.js](https://nodejs.org/en/) (v12 or later)
- [Yarn](https://yarnpkg.com/) package manager

## Getting Started

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/yourusername/gemini-bbs.git
   cd gemini-bbs
   ```

2. **Install dependencies:**

   ```bash
   yarn install
   ```

### Development

Gemini BBS uses a development setup that simultaneously compiles TypeScript and runs a server watcher that reloads when changes are detected.

To start the development environment, run:

```bash
yarn dev
```

This command does the following:
- **`tsc --watch`:** Compiles your TypeScript files in watch mode.
- **`dev-watch.js`:** Watches for changes in `server.js` and reloads the server process automatically.

### Building the Project

To compile the TypeScript code to JavaScript, run:

```bash
yarn build
```

### Running the user interface

To run the user interface locally, run:

```bash
telnet localhost
```

## License

This project is licensed under the [MIT License](LICENSE).