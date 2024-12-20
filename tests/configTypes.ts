import { Browser, Page } from 'playwright';

import fs from 'fs';
import toml from 'toml';
const config = toml.parse(fs.readFileSync('./config.toml', 'utf-8'));

declare global {
  const page: Page;
  const browser: Browser;
  const browserName: string;
}

export default {
  email: config.email ?? '',
  password: config.password ?? '',
};
