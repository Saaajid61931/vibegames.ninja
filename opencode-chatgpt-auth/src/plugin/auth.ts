// Account storage and token management

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";
import { ACCOUNTS_FILENAME } from "../constants.js";

export interface ChatGPTAccount {
  /** User-provided session token from browser cookie */
  sessionToken: string;
  /** JWT access token obtained from /api/auth/session */
  accessToken?: string;
  /** When the access token expires (epoch ms) */
  accessTokenExpiresAt?: number;
  /** Email associated with the account (if known) */
  email?: string;
  /** When this account was added */
  addedAt: number;
  /** Device ID for this account */
  deviceId: string;
  /** Whether this account is enabled */
  enabled: boolean;
}

export interface AccountsFile {
  version: number;
  accounts: ChatGPTAccount[];
  activeIndex: number;
}

function getConfigDir(): string {
  const customDir = process.env.OPENCODE_CONFIG_DIR;
  if (customDir) return customDir;
  return join(homedir(), ".config", "opencode");
}

function getAccountsPath(): string {
  return join(getConfigDir(), ACCOUNTS_FILENAME);
}

export async function loadAccounts(): Promise<AccountsFile | null> {
  try {
    const data = await readFile(getAccountsPath(), "utf-8");
    return JSON.parse(data) as AccountsFile;
  } catch {
    return null;
  }
}

export async function saveAccounts(accounts: AccountsFile): Promise<void> {
  const configDir = getConfigDir();
  await mkdir(configDir, { recursive: true });
  await writeFile(
    getAccountsPath(),
    JSON.stringify(accounts, null, 2),
    "utf-8",
  );
}

export async function clearAccounts(): Promise<void> {
  try {
    const { unlink } = await import("node:fs/promises");
    await unlink(getAccountsPath());
  } catch {
    // ignore
  }
}

/**
 * Check if an access token JWT is expired (with 60s buffer).
 */
export function isAccessTokenExpired(account: ChatGPTAccount): boolean {
  if (!account.accessToken || !account.accessTokenExpiresAt) return true;
  return Date.now() >= account.accessTokenExpiresAt - 60_000;
}

/**
 * Parse JWT payload to get expiration time.
 */
export function parseJwtExpiry(jwt: string): number | null {
  try {
    const parts = jwt.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(
      Buffer.from(parts[1]!, "base64url").toString("utf-8"),
    );
    if (typeof payload.exp === "number") {
      return payload.exp * 1000; // convert to ms
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Parse JWT payload to extract email.
 */
export function parseJwtEmail(jwt: string): string | null {
  try {
    const parts = jwt.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(
      Buffer.from(parts[1]!, "base64url").toString("utf-8"),
    );
    if (typeof payload.email === "string") {
      return payload.email;
    }
    // ChatGPT tokens sometimes use a different claim
    if (
      typeof payload["https://api.openai.com/auth"] === "object" &&
      typeof payload["https://api.openai.com/auth"].user_id === "string"
    ) {
      return payload["https://api.openai.com/auth"].user_id;
    }
    return null;
  } catch {
    return null;
  }
}
