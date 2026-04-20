import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';
import {join, dirname} from 'node:path';

export type BannerStyle = 'block' | 'shadow' | 'outline' | 'slant' | 'double';

export type BbsConfig = {
  siteName: string;
  sysopName: string;
  location: string;
  port: number;
  maxNodes: number;
  clearOnNavigate: boolean;
  bannerStyle: BannerStyle;
};

const CONFIG_PATH = join(process.cwd(), 'data', 'config.json');

const DEFAULT_CONFIG: BbsConfig = {
  siteName: 'Terminus Station',
  sysopName: 'Sysop',
  location: 'The Internet',
  port: 23,
  maxNodes: 10,
  clearOnNavigate: false,
  bannerStyle: 'block' as BannerStyle,
};

let config: BbsConfig = {...DEFAULT_CONFIG};

export function loadConfig(): BbsConfig {
  try {
    const raw = readFileSync(CONFIG_PATH, 'utf8');
    config = {...DEFAULT_CONFIG, ...JSON.parse(raw) as Partial<BbsConfig>};
  } catch {
    config = {...DEFAULT_CONFIG};
    saveConfig();
  }
  return config;
}

export function saveConfig(): void {
  mkdirSync(dirname(CONFIG_PATH), {recursive: true});
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2) + '\n');
}

export function getConfig(): BbsConfig {
  return config;
}

export function updateConfig(updates: Partial<BbsConfig>): BbsConfig {
  config = {...config, ...updates};
  saveConfig();
  return config;
}
