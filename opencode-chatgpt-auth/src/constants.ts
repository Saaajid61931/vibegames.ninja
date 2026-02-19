// ChatGPT Backend API Constants

export const CHATGPT_PROVIDER_ID = "openai";

// Endpoints
export const CHATGPT_BASE_URL = "https://chatgpt.com";
export const CHATGPT_SESSION_URL = `${CHATGPT_BASE_URL}/api/auth/session`;
export const CHATGPT_CONVERSATION_URL = `${CHATGPT_BASE_URL}/backend-api/conversation`;
export const CHATGPT_REQUIREMENTS_URL = `${CHATGPT_BASE_URL}/backend-api/sentinel/chat-requirements`;
export const CHATGPT_MODELS_URL = `${CHATGPT_BASE_URL}/backend-api/models`;

// OpenAI API URL pattern to intercept
export const OPENAI_API_HOST = "api.openai.com";
export const OPENAI_CHAT_COMPLETIONS_PATH = "/v1/chat/completions";

// Headers sent to ChatGPT backend
export const CHATGPT_HEADERS = {
  "Content-Type": "application/json",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  Accept: "text/event-stream",
  "Accept-Language": "en-US,en;q=0.9",
  "oai-language": "en-US",
  Origin: CHATGPT_BASE_URL,
  Referer: `${CHATGPT_BASE_URL}/`,
} as const;

// Model name mapping: what the user configures in opencode.json -> what ChatGPT backend expects
// Most models use the same name, but some may differ
export const MODEL_NAME_MAP: Record<string, string> = {
  // Codex
  "codex-mini": "codex-mini",

  // GPT-4o family
  "gpt-4o": "gpt-4o",
  "gpt-4o-mini": "gpt-4o-mini",

  // o-series reasoning models
  o1: "o1",
  "o1-mini": "o1-mini",
  "o1-pro": "o1-pro",
  o3: "o3",
  "o3-mini": "o3-mini",
  "o3-mini-high": "o3-mini-high",
  "o4-mini": "o4-mini",

  // GPT-4.5
  "gpt-4.5": "gpt-4.5",
};

// Default model limits (context window + max output tokens)
export const MODEL_LIMITS: Record<
  string,
  { context: number; output: number }
> = {
  "codex-mini": { context: 192000, output: 16384 },
  "gpt-4o": { context: 128000, output: 16384 },
  "gpt-4o-mini": { context: 128000, output: 16384 },
  o1: { context: 200000, output: 100000 },
  "o1-mini": { context: 128000, output: 65536 },
  "o1-pro": { context: 200000, output: 100000 },
  o3: { context: 200000, output: 100000 },
  "o3-mini": { context: 200000, output: 100000 },
  "o4-mini": { context: 200000, output: 100000 },
  "gpt-4.5": { context: 128000, output: 16384 },
};

// Storage paths (relative to opencode config dir)
export const ACCOUNTS_FILENAME = "chatgpt-accounts.json";
export const CONFIG_FILENAME = "chatgpt.json";
export const DEBUG_LOG_DIR = "chatgpt-logs";
