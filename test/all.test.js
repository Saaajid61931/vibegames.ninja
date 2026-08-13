/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const Module = require('node:module')
const ts = require('typescript')

const tests = []

function test(name, fn) {
  tests.push({ name, fn })
}

const projectRoot = path.resolve(__dirname, '..')
const srcRoot = path.join(projectRoot, 'src')
const originalResolveFilename = Module._resolveFilename
const fileExtensions = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json']

function tryResolveFile(basePath) {
  if (fs.existsSync(basePath) && fs.statSync(basePath).isFile()) {
    return basePath
  }

  for (const extension of fileExtensions) {
    const candidate = `${basePath}${extension}`
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate
    }
  }

  if (fs.existsSync(basePath) && fs.statSync(basePath).isDirectory()) {
    for (const extension of fileExtensions) {
      const candidate = path.join(basePath, `index${extension}`)
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        return candidate
      }
    }
  }

  return null
}

function resolveTypeScriptAwarePath(request, parent) {
  if (request.startsWith('@/')) {
    return tryResolveFile(path.join(srcRoot, request.slice(2)))
  }

  if (request.startsWith('./') || request.startsWith('../')) {
    const parentDir = parent?.filename ? path.dirname(parent.filename) : projectRoot
    return tryResolveFile(path.resolve(parentDir, request))
  }

  if (path.isAbsolute(request)) {
    return tryResolveFile(request)
  }

  return null
}

Module._resolveFilename = function resolveFilename(request, parent, ...rest) {
  const resolved = resolveTypeScriptAwarePath(request, parent)
  if (resolved) {
    return resolved
  }

  return originalResolveFilename.call(this, request, parent, ...rest)
}

function registerTypeScriptExtension(extension) {
  require.extensions[extension] = function compileTypeScript(module, filename) {
    const source = fs.readFileSync(filename, 'utf8')
    const { outputText } = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        resolveJsonModule: true,
      },
      fileName: filename,
    })

    module._compile(outputText, filename)
  }
}

registerTypeScriptExtension('.ts')
registerTypeScriptExtension('.tsx')

const { createAdminActionSuccessResponse } = require('@/lib/admin-actions')
const {
  buildStructuredFeedbackNotificationMessage,
  shouldNotifyStructuredFeedback,
} = require('@/lib/structured-feedback-notification')
const { getCronAuthProblem } = require('@/lib/cron-auth-core')
const {
  findDailyGameAnalytics,
  getLiveJamStatus,
  secondsUntilNextUtcDay,
  startOfUtcDay,
  syncJamStatuses,
  upsertDailyGameAnalytics,
  utcDayKey,
} = require('@/lib/game-analytics')
const { countUniqueCreators } = require('@/lib/home-stats')
const { groupJamsByLiveStatus } = require('@/lib/jam-page-data')
const { markNotificationsRead } = require('@/lib/notifications')
const { createRateLimitResponse, enforceRateLimit, getRateLimitIdentity } = require('@/lib/rate-limit')
const { MemoryRateLimiter, RATE_LIMIT_POLICIES } = require('@/lib/rate-limit-core')
const {
  gameUploadSchema,
  ghostRunSchema,
  levelInputSchema,
  loginSchema,
  MAX_GHOST_REPLAY_BYTES,
  registerSchema,
} = require('@/lib/validations')
const {
  MAX_DISCOVERY_PAGE,
  MAX_DISCOVERY_PAGE_SIZE,
  MAX_DISCOVERY_SEARCH_LENGTH,
  normalizeDiscoveryFilters,
  normalizeDiscoveryPage,
  normalizeDiscoveryPageSize,
} = require('@/lib/discovery-query')

test('admin action helper returns a JSON success response without redirect metadata', async () => {
  const response = createAdminActionSuccessResponse()

  assert.equal(response.status, 200)
  assert.equal(response.headers.get('location'), null)
  assert.equal(response.headers.get('content-type')?.includes('application/json'), true)
  assert.deepEqual(await response.json(), { success: true })
})

test('cron auth fails closed outside development when CRON_SECRET is missing', () => {
  const request = {
    headers: new Headers(),
  }

  assert.deepEqual(
    getCronAuthProblem(request, { cronSecret: '', nodeEnv: 'production' }),
    {
      error: 'CRON_SECRET_MISSING',
      status: 503,
    }
  )
})

test('cron auth allows development without a CRON_SECRET but rejects bad tokens when configured', () => {
  const requestWithoutSecret = {
    headers: new Headers(),
  }
  const requestWithWrongSecret = {
    headers: new Headers({ authorization: 'Bearer wrong-token' }),
  }
  const requestWithCorrectSecret = {
    headers: new Headers({ authorization: 'Bearer expected-token' }),
  }

  assert.equal(getCronAuthProblem(requestWithoutSecret, { cronSecret: '', nodeEnv: 'development' }), null)
  assert.deepEqual(
    getCronAuthProblem(requestWithWrongSecret, { cronSecret: 'expected-token', nodeEnv: 'production' }),
    {
      error: 'UNAUTHORIZED',
      status: 401,
    }
  )
  assert.equal(
    getCronAuthProblem(requestWithCorrectSecret, { cronSecret: 'expected-token', nodeEnv: 'production' }),
    null
  )
})

test('structured feedback notifications are only sent for first-time feedback from non-creators', () => {
  assert.equal(
    shouldNotifyStructuredFeedback({ existingFeedback: false, creatorId: 'creator-1', actorId: 'player-1' }),
    true
  )
  assert.equal(
    shouldNotifyStructuredFeedback({ existingFeedback: true, creatorId: 'creator-1', actorId: 'player-1' }),
    false
  )
  assert.equal(
    shouldNotifyStructuredFeedback({ existingFeedback: false, creatorId: 'player-1', actorId: 'player-1' }),
    false
  )
})

test('structured feedback notification message prefers the comment when present', () => {
  const message = buildStructuredFeedbackNotificationMessage({
    gameTitle: 'Neon Loop',
    actorLabel: 'A player',
    feedback: {
      fun: false,
      confusing: true,
      tooHard: false,
      buggy: false,
      comment: '  Great hook, but the first boss is unclear.  ',
    },
  })

  assert.equal(message, 'A player left quick feedback on Neon Loop: Great hook, but the first boss is unclear.')
})

test('structured feedback notification message summarizes signals when no note is left', () => {
  const message = buildStructuredFeedbackNotificationMessage({
    gameTitle: 'Neon Loop',
    actorLabel: 'A player',
    feedback: {
      fun: true,
      confusing: false,
      tooHard: true,
      buggy: false,
      comment: '',
    },
  })

  assert.match(message, /^A player marked Neon Loop as /)
})

test('daily analytics helpers normalize dates and reuse the composite unique key', async () => {
  const date = new Date('2026-03-18T15:45:30.000Z')
  const dayStart = startOfUtcDay(date)

  assert.equal(dayStart.toISOString(), '2026-03-18T00:00:00.000Z')
  assert.equal(utcDayKey(date), '2026-03-18')
  assert.equal(secondsUntilNextUtcDay(date) >= 60, true)

  let capturedArgs
  const fakeDb = {
    gameAnalytics: {
      upsert: async (args) => {
        capturedArgs = args
        return { id: 'row-1' }
      },
      findUnique: async (args) => {
        capturedArgs = { findUnique: args }
        return null
      },
    },
  }

  await upsertDailyGameAnalytics(
    fakeDb,
    'game-1',
    date,
    { plays: 1, uniquePlayers: 0 },
    { plays: { increment: 1 }, uniquePlayers: { increment: 0 } }
  )

  assert.equal(capturedArgs.where.gameId_date.gameId, 'game-1')
  assert.equal(capturedArgs.where.gameId_date.date.toISOString(), '2026-03-18T00:00:00.000Z')
  assert.equal(capturedArgs.create.gameId, 'game-1')
  assert.equal(capturedArgs.create.date.toISOString(), '2026-03-18T00:00:00.000Z')
  assert.deepEqual(capturedArgs.update, { plays: { increment: 1 }, uniquePlayers: { increment: 0 } })

  const existing = await findDailyGameAnalytics(fakeDb, 'game-1', date)
  assert.equal(existing, null)
  assert.equal(capturedArgs.findUnique.where.gameId_date.date.toISOString(), '2026-03-18T00:00:00.000Z')
})

test('syncJamStatuses promotes jam states in order', async () => {
  const calls = []
  const fakeDb = {
    gameJam: {
      updateMany: async (args) => {
        calls.push(args)
        if (args.data.status === 'ACTIVE') {
          return { count: 2 }
        }
        if (args.data.status === 'VOTING') {
          return { count: 3 }
        }
        return { count: 4 }
      },
    },
  }

  const result = await syncJamStatuses(new Date('2026-03-18T12:00:00.000Z'), fakeDb)

  assert.deepEqual(result, {
    upcomingToActive: 2,
    activeToVoting: 3,
    votingToCompleted: 4,
    totalUpdated: 9,
  })
  assert.equal(calls.length, 3)
  assert.equal(calls[0].where.status, 'UPCOMING')
  assert.equal(calls[1].where.status, 'ACTIVE')
  assert.equal(calls[2].where.status, 'VOTING')
})

test('getLiveJamStatus follows the current time window', () => {
  const originalNow = Date.now
  const now = new Date('2026-03-18T12:00:00.000Z').getTime()
  Date.now = () => now

  try {
    assert.equal(
      getLiveJamStatus({
        startDate: '2026-03-18T11:00:00.000Z',
        endDate: '2026-03-18T13:00:00.000Z',
        votingEndDate: '2026-03-18T14:00:00.000Z',
      }),
      'ACTIVE'
    )
    assert.equal(
      getLiveJamStatus({
        startDate: '2026-03-18T08:00:00.000Z',
        endDate: '2026-03-18T11:00:00.000Z',
        votingEndDate: '2026-03-18T13:00:00.000Z',
      }),
      'VOTING'
    )
    assert.equal(
      getLiveJamStatus({
        startDate: '2026-03-18T08:00:00.000Z',
        endDate: '2026-03-18T10:00:00.000Z',
        votingEndDate: '2026-03-18T11:30:00.000Z',
      }),
      'COMPLETED'
    )
    assert.equal(
      getLiveJamStatus({
        startDate: '2026-03-18T13:00:00.000Z',
        endDate: '2026-03-18T14:00:00.000Z',
        votingEndDate: '2026-03-18T15:00:00.000Z',
      }),
      'UPCOMING'
    )
  } finally {
    Date.now = originalNow
  }
})

test('groupJamsByLiveStatus uses live dates instead of persisted status when grouping jam pages', () => {
  const originalNow = Date.now
  Date.now = () => new Date('2026-03-18T12:00:00.000Z').getTime()

  try {
    const groups = groupJamsByLiveStatus([
      {
        id: 'jam-1',
        title: 'Active Jam',
        slug: 'active-jam',
        description: 'Active right now',
        theme: null,
        bannerImage: null,
        status: 'UPCOMING',
        startDate: new Date('2026-03-18T11:00:00.000Z'),
        endDate: new Date('2026-03-18T13:00:00.000Z'),
        votingEndDate: new Date('2026-03-18T14:00:00.000Z'),
        _count: { entries: 3 },
      },
      {
        id: 'jam-2',
        title: 'Voting Jam',
        slug: 'voting-jam',
        description: 'Voting right now',
        theme: null,
        bannerImage: null,
        status: 'ACTIVE',
        startDate: new Date('2026-03-18T08:00:00.000Z'),
        endDate: new Date('2026-03-18T11:00:00.000Z'),
        votingEndDate: new Date('2026-03-18T13:00:00.000Z'),
        _count: { entries: 8 },
      },
      {
        id: 'jam-3',
        title: 'Completed Jam',
        slug: 'completed-jam',
        description: 'Already done',
        theme: null,
        bannerImage: null,
        status: 'ACTIVE',
        startDate: new Date('2026-03-17T08:00:00.000Z'),
        endDate: new Date('2026-03-17T10:00:00.000Z'),
        votingEndDate: new Date('2026-03-18T11:00:00.000Z'),
        _count: { entries: 5 },
      },
    ])

    assert.equal(groups.active.length, 1)
    assert.equal(groups.active[0].slug, 'active-jam')
    assert.equal(groups.active[0].status, 'ACTIVE')
    assert.equal(groups.voting.length, 1)
    assert.equal(groups.voting[0].slug, 'voting-jam')
    assert.equal(groups.voting[0].status, 'VOTING')
    assert.equal(groups.completed.length, 1)
    assert.equal(groups.completed[0].slug, 'completed-jam')
    assert.equal(groups.completed[0].status, 'COMPLETED')
  } finally {
    Date.now = originalNow
  }
})

test('rate limiting keys authenticated users by user id and prefers Cloudflare IPs for anonymous users', () => {
  const request = {
    headers: new Headers({
      'x-forwarded-for': '203.0.113.10, 198.51.100.2',
      'cf-connecting-ip': '198.51.100.7',
    }),
  }

  assert.equal(getRateLimitIdentity(request, 'user-123'), 'user:user-123')
  assert.equal(getRateLimitIdentity(request, null), 'ip:198.51.100.7')
})

test('memory rate limiter blocks requests after the policy limit and reports retry metadata', () => {
  const limiter = new MemoryRateLimiter({ buckets: new Map() })
  const now = new Date('2026-03-18T12:00:00.000Z').getTime()
  const key = 'comments:user:user-1'

  const first = limiter.consume(key, RATE_LIMIT_POLICIES.comments, now)
  for (let count = 0; count < RATE_LIMIT_POLICIES.comments.limit - 1; count += 1) {
    limiter.consume(key, RATE_LIMIT_POLICIES.comments, now + count + 1)
  }
  const blocked = limiter.consume(key, RATE_LIMIT_POLICIES.comments, now + 20)

  assert.equal(first.allowed, true)
  assert.equal(first.remaining, RATE_LIMIT_POLICIES.comments.limit - 1)
  assert.equal(blocked.allowed, false)
  assert.equal(blocked.remaining, 0)
  assert.equal(blocked.retryAfterSeconds > 0, true)
})

test('memory rate limiter periodically removes expired buckets without removing live ones', () => {
  const now = new Date('2026-03-18T12:00:00.000Z').getTime()
  const buckets = new Map([
    ['expired', { count: 1, resetAt: now - 1 }],
    ['live', { count: 1, resetAt: now + 60_000 }],
  ])
  const limiter = new MemoryRateLimiter({ buckets })
  const policy = { name: 'sweep-test', limit: 500, windowMs: 60_000 }

  for (let index = 0; index < 250; index += 1) {
    limiter.consume(`key-${index}`, policy, now)
  }

  assert.equal(buckets.has('expired'), false)
  assert.equal(buckets.has('live'), true)
})

test('rating and password-change policies use the requested shared limits', () => {
  assert.deepEqual(RATE_LIMIT_POLICIES.ratings, {
    name: 'ratings',
    limit: 20,
    windowMs: 60 * 1000,
  })
  assert.deepEqual(RATE_LIMIT_POLICIES.passwordChanges, {
    name: 'password-changes',
    limit: 5,
    windowMs: 15 * 60 * 1000,
  })
})

test('enforceRateLimit and createRateLimitResponse produce a stable 429 payload', async () => {
  const limiter = new MemoryRateLimiter({ buckets: new Map() })
  const request = {
    headers: new Headers({ 'x-forwarded-for': '203.0.113.77' }),
  }

  for (let count = 0; count < RATE_LIMIT_POLICIES.likes.limit; count += 1) {
    const result = enforceRateLimit({
      request,
      policy: RATE_LIMIT_POLICIES.likes,
      limiter,
    })
    assert.equal(result.allowed, true)
  }

  const blocked = enforceRateLimit({
    request,
    policy: RATE_LIMIT_POLICIES.likes,
    limiter,
  })

  assert.equal(blocked.allowed, false)

  const response = createRateLimitResponse(blocked)
  assert.equal(response.status, 429)
  assert.equal(response.headers.get('Retry-After'), String(blocked.retryAfterSeconds))
  assert.deepEqual(await response.json(), {
    error: 'RATE_LIMITED',
    message: 'Too many requests. Please wait and try again.',
    retryAfterSeconds: blocked.retryAfterSeconds,
  })
})

test('markNotificationsRead targets only unread notifications for the selected user', async () => {
  let capturedArgs
  const fakeDb = {
    notification: {
      updateMany: async (args) => {
        capturedArgs = args
        return { count: 2 }
      },
    },
  }

  const result = await markNotificationsRead(fakeDb, 'user-1', ['n-1', 'n-2'])

  assert.deepEqual(capturedArgs, {
    where: {
      userId: 'user-1',
      id: { in: ['n-1', 'n-2'] },
      read: false,
    },
    data: { read: true },
  })
  assert.deepEqual(result, {
    updatedCount: 2,
    unreadCount: 0,
  })
})

test('countUniqueCreators deduplicates overlapping creator buckets', () => {
  assert.equal(countUniqueCreators(['user-1', 'user-2', 'user-3'], ['user-2', 'studio-1', 'studio-2']), 5)
})

test('discovery query normalization bounds pagination and safely normalizes filters', () => {
  assert.equal(normalizeDiscoveryPage('999999'), MAX_DISCOVERY_PAGE)
  assert.equal(normalizeDiscoveryPage('0'), 1)
  assert.equal(normalizeDiscoveryPage('not-a-number'), 1)
  assert.equal(normalizeDiscoveryPageSize('999999'), MAX_DISCOVERY_PAGE_SIZE)
  assert.equal(normalizeDiscoveryPageSize('0'), 20)

  const normalized = normalizeDiscoveryFilters({
    category: 'not-a-category',
    sort: 'not-a-sort',
    search: `  ${'a'.repeat(MAX_DISCOVERY_SEARCH_LENGTH + 5)}  `,
    mobile: 'true',
    editor: true,
  })

  assert.deepEqual(normalized, {
    category: 'all',
    sort: 'trending',
    search: 'a'.repeat(MAX_DISCOVERY_SEARCH_LENGTH),
    supportsMobile: true,
    hasLevelEditor: true,
  })
})

test('discovery query normalization preserves valid categories and sorts', () => {
  assert.deepEqual(
    normalizeDiscoveryFilters({
      category: '  arcade  ',
      sort: 'top',
      search: '  neon race  ',
      mobile: 'false',
      editor: 'false',
    }),
    {
      category: 'arcade',
      sort: 'top',
      search: 'neon race',
      supportsMobile: false,
      hasLevelEditor: false,
    }
  )
})

test('registration and login schemas trim and lowercase email addresses', () => {
  const register = registerSchema.safeParse({
    name: '  Arcade Player  ',
    username: '  Arcade_Player  ',
    email: '  PLAYER@EXAMPLE.COM  ',
    password: 'password123',
  })
  const login = loginSchema.safeParse({
    email: '  PLAYER@EXAMPLE.COM  ',
    password: 'password123',
  })

  assert.equal(register.success, true)
  assert.equal(login.success, true)
  if (!register.success || !login.success) {
    throw new Error('Expected valid normalized credentials')
  }

  assert.equal(register.data.name, 'Arcade Player')
  assert.equal(register.data.username, 'arcade_player')
  assert.equal(register.data.email, 'player@example.com')
  assert.equal(login.data.email, 'player@example.com')
})

test('level data accepts exactly 5MB of JSON and rejects larger JSON payloads', () => {
  const maxLevelDataBytes = 5 * 1024 * 1024
  const overhead = Buffer.byteLength(JSON.stringify({ payload: '' }), 'utf8')
  const shared = {
    name: 'Boundary Level',
    data: { payload: 'x'.repeat(maxLevelDataBytes - overhead) },
  }

  assert.equal(levelInputSchema.safeParse(shared).success, true)
  assert.equal(
    levelInputSchema.safeParse({
      ...shared,
      data: { payload: 'x'.repeat(maxLevelDataBytes - overhead + 1) },
    }).success,
    false
  )
})

test('ghost replay data accepts the 512KB boundary and rejects a larger JSON replay', () => {
  const accepted = ghostRunSchema.safeParse({
    durationMs: 1000,
    replayData: 'x'.repeat(MAX_GHOST_REPLAY_BYTES - 2),
  })
  const rejected = ghostRunSchema.safeParse({
    durationMs: 1000,
    replayData: 'x'.repeat(MAX_GHOST_REPLAY_BYTES - 1),
  })

  assert.equal(accepted.success, true)
  assert.equal(rejected.success, false)
})

test('gameUploadSchema accepts curated values and rejects unknown ones', () => {
  const valid = {
    title: 'Arcade Blast',
    description: 'A fast neon arcade game with a simple control scheme.',
    instructions: 'Use the arrow keys to move.',
    category: 'arcade',
    tags: 'arcade,fast,neon',
    isAIGenerated: true,
    aiTool: 'Claude',
    aiModel: 'GPT-4o',
    supportsMobile: true,
    mobileOrientation: 'BOTH',
    hasLevelEditor: false,
    hasGhostSharing: false,
    seekingFeedback: false,
    latestUpdateNote: 'Fresh launch build',
    isPremium: false,
    price: 4.99,
    hasAds: true,
  }

  const parsed = gameUploadSchema.safeParse(valid)
  assert.equal(parsed.success, true)
  if (!parsed.success) {
    throw parsed.error
  }

  assert.equal(parsed.data.category, 'ARCADE')
  assert.equal(parsed.data.aiTool, 'claude')
  assert.equal(parsed.data.aiModel, 'gpt-4o')

  const invalid = gameUploadSchema.safeParse({
    ...valid,
    category: 'SHOOTER',
    aiTool: 'NotARealTool',
    aiModel: 'made-up-model',
  })

  assert.equal(invalid.success, false)
})

async function run() {
  let failed = 0

  for (const { name, fn } of tests) {
    try {
      await fn()
      console.log(`PASS ${name}`)
    } catch (error) {
      failed += 1
      console.error(`FAIL ${name}`)
      console.error(error)
    }
  }

  if (failed > 0) {
    process.exitCode = 1
  }
}

void run()
