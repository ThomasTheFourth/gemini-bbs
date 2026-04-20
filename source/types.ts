export type Connection = {
  id: number;
  remoteAddress: string;
  connectedAt: Date;
  username?: string;
};

export type LogEntry = {
  timestamp: Date;
  message: string;
};

export type User = {
  id: number;
  username: string;
  createdAt: string;
  lastLogin: string | null;
};

export type ScreenState =
  | 'welcome'
  | 'login'
  | 'register'
  | 'menu'
  | 'who-online'
  | 'message-rooms'
  | 'profile';
