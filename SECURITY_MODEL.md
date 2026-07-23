# VibeGames.Ninja — Security Model & Trust Architecture

## 1. Security Philosophy & Threat Model

Every game build published or created on VibeGames is treated as **untrusted executable code**.

### Primary Threat Vectors & Countermeasures
1. **Malicious Script Injection / Cross-Site Scripting (XSS)**:
   - Threat: Untrusted JS executing in the parent application context attempting to access session tokens (`next-auth` cookies, localStorage) or impersonate users.
   - Mitigation: Strict iframe sandboxing with cross-origin isolation. Game assets are served from a dedicated domain or Cloudflare R2 bucket (`assets.vibegames.ninja`).
2. **Resource Exhaustion & Browser Freezes**:
   - Threat: Infinite loops, canvas memory leaks, or unconstrained worker spawning.
   - Mitigation: Hardware acceleration and memory quotas monitored via `PlaySession` telemetry and browser crash hooks.
3. **Secret Exfiltration**:
   - Threat: AI generator prompts exposing environment variables or API keys into generated game HTML/JS files.
   - Mitigation: Strict build-time AST inspection and automated `SecurityAgent` scanning before publishing.
4. **Data Tampering & Vote Manipulation**:
   - Threat: Automated bots faking play metrics, ratings, or jam votes.
   - Mitigation: Token-bucket rate limiting, CSRF tokens, and session interaction verification for score submission.

---

## 2. Technical Sandboxing Rules

```html
<iframe
  src="https://assets.vibegames.ninja/games/{game-id}/index.html"
  title="{game-title}"
  sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-forms"
  allow="fullscreen; gamepad; accelerometer; gyroscope"
  allowfullscreen
  loading="lazy"
/>
```

### Content Security Policy (CSP) Directives for Game Assets:
```http
Content-Security-Policy: default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; connect-src 'self' blob:; frame-ancestors 'self' https://vibegames.ninja;
```

---

## 3. Automated Security Agent Inspection

Before a Game Capsule is marked as `PUBLISHED`:
1. **Archive Scanner**: Ensures ZIP files do not contain `.exe`, `.bat`, `.sh`, or suspicious binaries.
2. **Static AST Analysis**: Scans JS code for references to `window.parent.document`, `document.cookie`, `localStorage.getItem("next-auth")`, or hardcoded API secret patterns (`sk-`, `key-`).
3. **Network Isolation Filter**: Flags attempts to open unauthorized WebSocket connections to unknown third-party IPs.
