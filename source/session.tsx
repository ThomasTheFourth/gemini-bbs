import React, {useState, useEffect, useCallback, useRef} from 'react';
import {Box, Text} from 'ink';
import Welcome from './welcome.js';
import Login from './screens/login.js';
import Register from './screens/register.js';
import Menu from './screens/menu.js';
import WhoOnline from './screens/who-online.js';
import MessageRooms from './screens/message-rooms.js';
import Profile from './screens/profile.js';
import {authenticateUser, createUser, getUser} from './db.js';
import type {Connection, ScreenState, User} from './types.js';

type SessionProps = {
  connection: Connection;
  connections: Connection[];
  onData: (callback: (data: Buffer) => void) => void;
  onLogin: (username: string) => void;
  onDisconnect: () => void;
};

type LoginStep = 'username' | 'password' | 'error';
type RegisterStep = 'username' | 'password' | 'confirm' | 'error';

export default function Session({
  connection: _connection,
  connections,
  onData,
  onLogin,
  onDisconnect,
}: SessionProps) {
  const [screen, setScreen] = useState<ScreenState>('welcome');
  const [inputBuffer, setInputBuffer] = useState('');

  // Login state
  const [loginStep, setLoginStep] = useState<LoginStep>('username');
  const [loginUsername, setLoginUsername] = useState('');
  const [loginError, setLoginError] = useState('');

  // Register state
  const [registerStep, setRegisterStep] = useState<RegisterStep>('username');
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerError, setRegisterError] = useState('');

  // Authenticated user
  const [username, setUsername] = useState('');
  const [userProfile, setUserProfile] = useState<User | null>(null);

  // Refs to hold current values for use inside handleInput without stale closures
  const inputBufferRef = useRef('');
  const screenRef = useRef<ScreenState>('welcome');
  const loginStepRef = useRef<LoginStep>('username');
  const loginUsernameRef = useRef('');
  const registerStepRef = useRef<RegisterStep>('username');
  const registerUsernameRef = useRef('');
  const registerPasswordRef = useRef('');
  const usernameRef = useRef('');

  // Keep refs in sync with state
  useEffect(() => {
    inputBufferRef.current = inputBuffer;
  }, [inputBuffer]);

  useEffect(() => {
    screenRef.current = screen;
  }, [screen]);

  useEffect(() => {
    loginStepRef.current = loginStep;
  }, [loginStep]);

  useEffect(() => {
    loginUsernameRef.current = loginUsername;
  }, [loginUsername]);

  useEffect(() => {
    registerStepRef.current = registerStep;
  }, [registerStep]);

  useEffect(() => {
    registerUsernameRef.current = registerUsername;
  }, [registerUsername]);

  useEffect(() => {
    registerPasswordRef.current = registerPassword;
  }, [registerPassword]);

  useEffect(() => {
    usernameRef.current = username;
  }, [username]);

  const handleInput = useCallback(
    (data: Buffer) => {
      for (const byte of data) {
        // Ignore LF after CR (telnet sends \r\n)
        if (byte === 0x0a) {
          return;
        }

        // Enter (CR only)
        if (byte === 0x0d) {
          // handleSubmit inline using refs to avoid stale closure
          const value = inputBufferRef.current.trim();
          const currentScreen = screenRef.current;
          const currentLoginStep = loginStepRef.current;
          const currentRegisterStep = registerStepRef.current;

          if (currentScreen === 'login') {
            if (currentLoginStep === 'username') {
              if (value.length === 0) return;
              loginUsernameRef.current = value;
              setLoginUsername(value);
              loginStepRef.current = 'password';
              setLoginStep('password');
              inputBufferRef.current = '';
              setInputBuffer('');
            } else if (currentLoginStep === 'password') {
              const result = authenticateUser(loginUsernameRef.current, value);
              if (result.success) {
                usernameRef.current = loginUsernameRef.current;
                setUsername(loginUsernameRef.current);
                onLogin(loginUsernameRef.current);
                screenRef.current = 'menu';
                setScreen('menu');
              } else {
                const errMsg = result.error ?? 'Login failed';
                setLoginError(errMsg);
                loginStepRef.current = 'error';
                setLoginStep('error');
              }
              inputBufferRef.current = '';
              setInputBuffer('');
            }
          }

          if (currentScreen === 'register') {
            if (currentRegisterStep === 'username') {
              if (value.length === 0) return;
              registerUsernameRef.current = value;
              setRegisterUsername(value);
              registerStepRef.current = 'password';
              setRegisterStep('password');
              inputBufferRef.current = '';
              setInputBuffer('');
            } else if (currentRegisterStep === 'password') {
              if (value.length < 4) {
                setRegisterError('Password must be at least 4 characters');
                registerStepRef.current = 'error';
                setRegisterStep('error');
                inputBufferRef.current = '';
                setInputBuffer('');
                return;
              }
              registerPasswordRef.current = value;
              setRegisterPassword(value);
              registerStepRef.current = 'confirm';
              setRegisterStep('confirm');
              inputBufferRef.current = '';
              setInputBuffer('');
            } else if (currentRegisterStep === 'confirm') {
              if (value !== registerPasswordRef.current) {
                setRegisterError('Passwords do not match');
                registerStepRef.current = 'error';
                setRegisterStep('error');
                inputBufferRef.current = '';
                setInputBuffer('');
                return;
              }
              const result = createUser(registerUsernameRef.current, value);
              if (result.success) {
                usernameRef.current = registerUsernameRef.current;
                setUsername(registerUsernameRef.current);
                onLogin(registerUsernameRef.current);
                screenRef.current = 'menu';
                setScreen('menu');
              } else {
                const errMsg = result.error ?? 'Registration failed';
                setRegisterError(errMsg);
                registerStepRef.current = 'error';
                setRegisterStep('error');
              }
              inputBufferRef.current = '';
              setInputBuffer('');
            }
          }

          return;
        }

        // Backspace
        if (byte === 0x7f || byte === 0x08) {
          inputBufferRef.current = inputBufferRef.current.slice(0, -1);
          setInputBuffer((prev) => prev.slice(0, -1));
          return;
        }

        // Printable characters
        if (byte >= 0x20 && byte <= 0x7e) {
          const char = String.fromCharCode(byte);
          const currentScreen = screenRef.current;
          const currentLoginStep = loginStepRef.current;
          const currentRegisterStep = registerStepRef.current;

          // Single-character screens — handle immediately
          if (currentScreen === 'welcome') {
            if (char === 'l' || char === 'L') {
              screenRef.current = 'login';
              setScreen('login');
              loginStepRef.current = 'username';
              setLoginStep('username');
              setLoginUsername('');
              loginUsernameRef.current = '';
              setLoginError('');
              inputBufferRef.current = '';
              setInputBuffer('');
            } else if (char === 'r' || char === 'R') {
              screenRef.current = 'register';
              setScreen('register');
              registerStepRef.current = 'username';
              setRegisterStep('username');
              setRegisterUsername('');
              registerUsernameRef.current = '';
              setRegisterPassword('');
              registerPasswordRef.current = '';
              setRegisterError('');
              inputBufferRef.current = '';
              setInputBuffer('');
            }
            return;
          }

          if (currentScreen === 'menu') {
            if (char === '1') {
              screenRef.current = 'who-online';
              setScreen('who-online');
            } else if (char === '2') {
              screenRef.current = 'message-rooms';
              setScreen('message-rooms');
            } else if (char === '3') {
              setUserProfile(getUser(usernameRef.current));
              screenRef.current = 'profile';
              setScreen('profile');
            } else if (char === '4') {
              onDisconnect();
            }
            return;
          }

          // "Press any key" screens
          if (
            currentScreen === 'who-online' ||
            currentScreen === 'message-rooms' ||
            currentScreen === 'profile'
          ) {
            screenRef.current = 'menu';
            setScreen('menu');
            return;
          }

          // Error states — any key returns to retry
          if (currentScreen === 'login' && currentLoginStep === 'error') {
            screenRef.current = 'login';
            setScreen('login');
            loginStepRef.current = 'username';
            setLoginStep('username');
            setLoginUsername('');
            loginUsernameRef.current = '';
            setLoginError('');
            inputBufferRef.current = '';
            setInputBuffer('');
            return;
          }

          if (currentScreen === 'register' && currentRegisterStep === 'error') {
            screenRef.current = 'register';
            setScreen('register');
            registerStepRef.current = 'username';
            setRegisterStep('username');
            setRegisterUsername('');
            registerUsernameRef.current = '';
            setRegisterPassword('');
            registerPasswordRef.current = '';
            setRegisterError('');
            inputBufferRef.current = '';
            setInputBuffer('');
            return;
          }

          // Buffer input for text fields
          inputBufferRef.current = inputBufferRef.current + char;
          setInputBuffer((prev) => prev + char);
        }
      }
    },
    [onLogin, onDisconnect],
  );

  useEffect(() => {
    onData(handleInput);
  }, [onData, handleInput]);

  return (
    <Box flexDirection="column" width={80}>
      {screen === 'welcome' && (
        <>
          <Welcome />
          <Text color="#888899"> <Text bold color="#00ddff">L</Text>ogin or <Text bold color="#00ff88">R</Text>egister? <Text color="#00ddff">▌</Text></Text>
        </>
      )}
      {screen === 'login' && (
        <Login
          step={loginStep}
          username={loginUsername}
          inputBuffer={inputBuffer}
          error={loginError}
        />
      )}
      {screen === 'register' && (
        <Register
          step={registerStep}
          username={registerUsername}
          passwordLength={registerPassword.length}
          inputBuffer={inputBuffer}
          error={registerError}
        />
      )}
      {screen === 'menu' && <Menu username={username} />}
      {screen === 'who-online' && <WhoOnline connections={connections} />}
      {screen === 'message-rooms' && <MessageRooms />}
      {screen === 'profile' && <Profile user={userProfile} />}
    </Box>
  );
}
