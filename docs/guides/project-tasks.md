# Consilium Development Tasks

> **Complete task breakdown for launching Consilium as an open source project**
>
> **Timeline:** 8 weeks to MVP → 12 weeks to public launch
>
> **Target:** Open source multi-model debate platform with community-driven development

---

## 📋 Task Legend

- 🎯 **Critical Path** - Blocks other tasks
- 🔧 **Technical** - Development work
- 🎨 **Design** - UI/UX work
- 📝 **Content** - Marketing/copy
- ✅ **Testing** - QA/validation
- 🚀 **Launch** - Go-to-market

---

# PHASE 1: Concierge MVP & Validation (Weeks 1-2)

**Goal:** Validate demand and model quality differentiation before building

**Success Metrics:**
- 50+ waitlist signups
- 10+ manual debate sessions completed
- Users can distinguish single-model vs multi-model debate quality
- Strong community interest and GitHub stars

---

## 1.1 Landing Page & Waitlist (Week 1, Days 1-3)

### 🎨 Design Tasks

- [ ] **Task 1.1.1:** Design landing page hero section
  - Create headline: "Don't let Cursor guess. Tell it exactly what to build."
  - Design subheadline explaining multi-model debate concept
  - Include visual of debate flow (3 models → debate → Golden Prompt)
  - Add email capture form above the fold

- [ ] **Task 1.1.2:** Design "How It Works" section
  - Create 3-step visual flow: Input → Debate → Golden Prompt
  - Design icons for debate modes (single-model, 3-agent, 5-agent)
  - Show example of single model vs multi-model output side-by-side

- [ ] **Task 1.1.3:** Design social proof section
  - Plan testimonial card layout (will populate later)
  - Design GitHub stars counter
  - Create "As seen on" placeholder for ProductHunt, Reddit

- [ ] **Task 1.1.4:** Design footer
  - Links: Docs, Twitter, GitHub, Discord
  - Add Anthropic/OpenAI/Google logos with "Powered by" disclaimer
  - Include privacy policy and terms placeholder links

### 🔧 Technical Tasks

- [ ] **Task 1.1.5:** Set up Next.js 15 project
  - Initialize with TypeScript and App Router
  - Configure Tailwind CSS 4.0
  - Set up shadcn/ui components
  - Configure path aliases (@/components, @/lib, etc.)

- [ ] **Task 1.1.6:** Build landing page components
  - Create HeroSection component with email capture
  - Build HowItWorks component with flow visualization
  - Create FeaturesSection highlighting open source benefits
  - Create Footer component

- [ ] **Task 1.1.7:** Set up email collection
  - Choose email service (Loops, Resend, or ConvertKit)
  - Create API route for waitlist signup
  - Implement form validation with Zod
  - Add success/error toast notifications

- [ ] **Task 1.1.8:** Set up analytics
  - Install Vercel Analytics or Plausible
  - Track waitlist signup conversion rate
  - Track page engagement and scroll depth
  - Set up goal tracking for "Request Access" button

- [ ] **Task 1.1.9:** Deploy to Vercel
  - Connect GitHub repository
  - Configure environment variables
  - Set up custom domain (myconsilium.xyz)
  - Configure SSL and DNS

### 📝 Content Tasks

- [ ] **Task 1.1.10:** Write landing page copy
  - Craft hero headline and subheadline
  - Write "Problem" section (66% of devs spend more time fixing AI code)
  - Create "Solution" section (multi-model debate → Golden Prompts)
  - Highlight open source benefits (self-host, bring your own keys)
  - Write FAQ section (5-7 common questions)

- [ ] **Task 1.1.11:** Write email sequences
  - Welcome email: Thank you for joining the community
  - Email 2 (day 3): Show debate example (single model vs multi-model)
  - Email 3 (day 7): Launch announcement template
  - Email 4 (day 14): Early access invite + GitHub star request

---

## 1.2 Manual Debate Service (Week 1, Days 4-7)

### 🔧 Technical Tasks

- [ ] **Task 1.2.1:** Set up local Python environment
  - Install Python 3.11+
  - Install OpenAI, Anthropic, Google AI Python SDKs
  - Create virtual environment
  - Install Jupyter notebook for interactive testing

- [ ] **Task 1.2.2:** Build single-model prompt script
  - Create script that takes user input
  - Call GPT-4o-mini, Claude Haiku, OR Gemini Flash
  - Save output to text file
  - Track token usage and cost

- [ ] **Task 1.2.3:** Build 3-agent budget debate script
  - Create script for Round 1: 3 agents generate responses
  - Implement Round 2: Each agent critiques others
  - Add synthesis step with budget model (GPT-4o-mini or Haiku)
  - Save all outputs to structured format (JSON or Markdown)
  - Track total cost per debate

- [ ] **Task 1.2.4:** Build 3-agent premium debate script
  - Same as budget but use: Claude Sonnet, GPT-4o, Gemini Pro
  - Use premium synthesis (Claude Sonnet or GPT-4o)
  - Track cost difference vs budget debate

- [ ] **Task 1.2.5:** Create Typeform for intake
  - Question 1: What feature do you want to build?
  - Question 2: Which coding tool do you use? (Cursor, Copilot, etc.)
  - Question 3: What's your biggest frustration with AI coding?
  - Question 4: Email address
  - Add consent checkbox for participation in beta

- [ ] **Task 1.2.6:** Build email delivery system
  - Create email template for Golden Prompt delivery
  - Include: Original prompt, debate summary, final Golden Prompt
  - Add footer: "Did this help? Reply with feedback"
  - Set up automated sending via Resend or SendGrid

### ✅ Testing Tasks

- [ ] **Task 1.2.7:** Test model quality differences
  - Run 5 identical prompts through single-model mode
  - Run same 5 prompts through 3-agent budget debate
  - Run same 5 prompts through 3-agent premium debate
  - Compare outputs for quality, completeness, edge case handling

- [ ] **Task 1.2.8:** Document API costs
  - Record actual API costs for 10 single-model sessions
  - Record actual API costs for 10 3-agent budget debates
  - Record actual API costs for 10 3-agent premium debates
  - Document costs in README for self-hosting users

### 📝 Content Tasks

- [ ] **Task 1.2.9:** Create manual debate workflow doc
  - Write step-by-step process for running debates manually
  - Document how to format output for users
  - Create template for feedback collection
  - Set response time expectation (24-48 hours)

- [ ] **Task 1.2.10:** Prepare debate examples
  - Save 3-5 high-quality debate examples
  - Annotate: Single-model vs 3-agent vs 5-agent quality differences
  - Prepare for sharing on Twitter/Reddit
  - Create visual comparison images

---

## 1.3 Validation & Feedback (Week 2)

### 📝 Content & Marketing Tasks

- [ ] **Task 1.3.1:** Create "Building in Public" content
  - Write Twitter thread: "I'm building a multi-model debate tool..."
  - Share landing page link
  - Post daily updates on progress
  - Engage with replies and questions

- [ ] **Task 1.3.2:** Post to Reddit (strategically)
  - r/SideProject: "Show: Multi-LLM debate tool for better coding prompts"
  - Include: Problem statement, solution approach, link to waitlist
  - r/LocalLLaMA: "Experiment: Does multi-model debate reduce hallucinations?"
  - Share actual debate examples with cost breakdown

- [ ] **Task 1.3.3:** Create model comparison content
  - Write blog post: "I tested GPT-4o-mini vs Claude Sonnet for code planning"
  - Show side-by-side outputs
  - Explain why premium models catch edge cases
  - Share on Dev.to, Medium, Hashnode

- [ ] **Task 1.3.4:** Engage with developer communities
  - Comment on Cursor/Copilot discussions
  - Share insights about prompt engineering
  - Mention Consilium in signature (don't spam)
  - Respond to questions about AI coding tools

### ✅ Testing & Validation Tasks

- [ ] **Task 1.3.5:** Run 20 manual debate sessions
  - Complete 20+ sessions for real users
  - Track: How many actually used the Golden Prompt?
  - Measure: Did it improve their results? (collect feedback)
  - Calculate: Net Promoter Score (would they recommend?)

- [ ] **Task 1.3.6:** Interview 5-10 beta users
  - Ask: What problem were you trying to solve?
  - Probe: Did the Golden Prompt actually help?
  - Explore: Would you contribute to open source development?
  - Document: Feature requests and pain points

- [ ] **Task 1.3.7:** Analyze kill criteria
  - Check: Did we get 50+ waitlist signups?
  - Validate: Can users distinguish single-model vs multi-model quality?
  - Measure: Is there strong community interest?
  - Decision: Proceed to Phase 2 or pivot?

---

# PHASE 2: Technical MVP (Weeks 3-6)

**Goal:** Build functional debate platform with all features available to all users

**Success Metrics:**
- 3-agent and 5-agent debate workflows functional
- All models accessible (users bring their own API keys)
- SSE streaming working
- 10 end-to-end tests passing
- Docker Compose setup working for self-hosting

---

## 2.1 Infrastructure Setup (Week 3, Days 1-2)

### 🔧 Infrastructure Tasks

- [ ] **Task 2.1.1:** Set up Neon PostgreSQL
  - Create Neon account
  - Provision Free tier database
  - Configure connection pooling
  - Save connection string to .env

- [ ] **Task 2.1.2:** Set up Upstash Redis
  - Create Upstash account
  - Provision Free tier Redis instance
  - Get connection URL and token
  - Save to .env

- [ ] **Task 2.1.3:** Set up Clerk authentication
  - Create Clerk account
  - Configure application in dashboard
  - Set up OAuth providers (Google, GitHub)
  - Get publishable and secret keys
  - Configure allowed redirect URLs

- [ ] **Task 2.1.4:** Set up LLM provider accounts
  - OpenAI: Create account, get API key, set up billing
  - Anthropic: Create account, get API key, set up billing
  - Google AI: Create account, get API key, set up billing
  - Set spending limits on all accounts ($100/month max)

- [ ] **Task 2.1.5:** Set up development environment
  - Clone monorepo structure (apps/web, apps/api, apps/agents)
  - Install Node.js 20+, pnpm 9+, Python 3.11+
  - Configure VSCode with recommended extensions
  - Set up ESLint, Prettier, TypeScript configs

- [ ] **Task 2.1.6:** Create .env files for all services
  - apps/web/.env.local (frontend)
  - apps/api/.env (backend)
  - apps/agents/.env (AI workers)
  - Document all required environment variables
  - Create .env.example files

---

## 2.2 Database Schema & Prisma Setup (Week 3, Days 2-3)

### 🔧 Backend Tasks

- [ ] **Task 2.2.1:** Initialize Prisma in backend
  - Install Prisma CLI and client
  - Run prisma init
  - Configure datasource to point to Neon
  - Set up Prisma schema file

- [ ] **Task 2.2.2:** Define User model
  - Create users table with id, clerkId, email
  - Add createdAt, updatedAt timestamps
  - Set up unique constraint on clerkId
  - Add preferences field (JSONB) for user settings

- [ ] **Task 2.2.3:** Define DebateSession model
  - Create debate_sessions table
  - Fields: id, userId, topic, debateMode, status
  - Add debateMode enum: SINGLE, THREE_AGENT, FIVE_AGENT
  - Add modelsUsed (JSONB) to track which models were used
  - Add totalCost (Decimal) to track session cost
  - Add goldenPrompt (Text) for final output
  - Add createdAt timestamp

- [ ] **Task 2.2.4:** Define DebateRound model
  - Create debate_rounds table
  - Fields: id, sessionId, roundNumber, status
  - Relation to debate_sessions

- [ ] **Task 2.2.5:** Define AgentMessage model
  - Create agent_messages table
  - Fields: id, roundId, agentId, content, modelUsed
  - Add promptTokens, completionTokens, cost, latencyMs
  - Relation to debate_rounds

- [ ] **Task 2.2.6:** Create database indexes
  - Index on users.clerkId (for fast auth lookup)
  - Index on debate_sessions(userId, createdAt) for usage tracking
  - Index on debate_sessions.debateMode for analytics

- [ ] **Task 2.2.7:** Run initial migration
  - Generate Prisma migration
  - Apply to development database
  - Verify tables created correctly
  - Generate Prisma Client

- [ ] **Task 2.2.8:** Create seed script
  - Seed 3 test users with different preferences
  - Create sample debate sessions (single, 3-agent, 5-agent)
  - Add sample agent messages
  - Document how to run seed script

---

## 2.3 Authentication & Security Infrastructure (Week 3, Days 3-5)

### 🔐 Clerk Authentication Setup

- [ ] **Task 2.3.1:** Configure Clerk application settings
  - Set up OAuth providers (Google, GitHub)
  - Configure session duration (15 min access, 30 day refresh)
  - Enable email verification
  - Set up redirect URLs for all environments
  - Configure webhook endpoints

- [ ] **Task 2.3.2:** Implement Clerk middleware in Next.js
  - Install @clerk/nextjs package
  - Create middleware.ts with route protection
  - Set up public vs protected route matchers
  - Implement session refresh logic (auto-refresh at 5 min remaining)
  - Configure cookie settings (httpOnly, secure, sameSite)

- [ ] **Task 2.3.3:** Create authentication pages
  - Build sign-in page using Clerk components
  - Build sign-up page using Clerk components
  - Add social OAuth buttons (Google, GitHub)
  - Style auth pages to match brand
  - Add password reset flow

- [ ] **Task 2.3.4:** Set up Clerk webhooks handler
  - Create /api/webhooks/clerk route
  - Handle user.created event (create user in database)
  - Handle user.updated event (sync user data)
  - Handle user.deleted event (cleanup user data)
  - Handle session.created and session.ended events
  - Verify webhook signatures

### 🔒 Backend Authentication Guards

- [ ] **Task 2.3.5:** Create ClerkAuthGuard for NestJS
  - Implement CanActivate interface
  - Extract JWT from Authorization header or cookie
  - Verify token with Clerk
  - Check token blacklist in Redis
  - Validate session status with Clerk API
  - Load user from database by clerkId
  - Attach user and session to request object

- [ ] **Task 2.3.6:** Create CurrentUser decorator
  - Extract user from request object
  - Type-safe user object
  - Use in controllers for easy access

- [ ] **Task 2.3.7:** Implement session revocation service
  - Create revokeSession() method
  - Revoke session in Clerk
  - Add token to Redis blacklist (until expiry)
  - Log revocation event
  - Create revokeAllUserSessions() for security events

### 🍪 Session Management Implementation

- [ ] **Task 2.3.8:** Configure session duration settings
  - Access token: 15 minutes
  - Refresh token: 30 days
  - Remember Me: 90 days (optional)
  - Idle timeout: 30 minutes
  - Document session lifecycle

- [ ] **Task 2.3.9:** Implement cookie configuration
  - Set httpOnly: true (prevent XSS)
  - Set secure: true (HTTPS only)
  - Set sameSite: 'lax' for access tokens
  - Set sameSite: 'strict' for refresh tokens
  - Configure domain for subdomains

- [ ] **Task 2.3.10:** Create idle timeout tracking (frontend)
  - Build useIdleTimeout hook
  - Track user activity events (mouse, keyboard, scroll)
  - Show warning at 25 minutes of idle
  - Auto-logout at 30 minutes of idle
  - Reset timer on any user activity

- [ ] **Task 2.3.11:** Implement automatic token refresh
  - Check token expiry on each request
  - Trigger refresh when < 5 minutes remaining
  - Seamless refresh in background
  - Handle refresh failures gracefully

### 🛡️ Security Features Implementation

- [ ] **Task 2.3.12:** Set up Multi-Factor Authentication (MFA)
  - Enable MFA in Clerk dashboard
  - Configure TOTP and SMS methods
  - Make MFA optional for regular users
  - Require MFA for admin roles (future)
  - Add MFA enrollment grace period (7 days)

- [ ] **Task 2.3.13:** Implement rate limiting with Upstash
  - Install @upstash/ratelimit package
  - Create rate limiters for different endpoints
  - Login: 5 attempts per 15 minutes
  - API: 100 requests per minute
  - Debate creation: 10 per hour
  - Create RateLimitGuard for NestJS
  - Add rate limit headers to responses

- [ ] **Task 2.3.14:** Implement IP allowlisting/geo-restrictions (optional)
  - Create GeoRestrictionGuard
  - Read geo-location from Cloudflare headers
  - Check user's IP allowlist settings
  - Check blocked countries settings
  - Log security events for blocked access

- [ ] **Task 2.3.15:** Set up token blacklisting in Redis
  - Store revoked tokens with TTL (until natural expiry)
  - Check blacklist on every authenticated request
  - Automatic cleanup when tokens expire
  - Track blacklist size for monitoring

### 📊 Audit Logging & Monitoring

- [ ] **Task 2.3.16:** Create AuthLog database model
  - Add fields: userId, event, ip, userAgent, metadata, severity, timestamp
  - Create indexes on userId, event, timestamp
  - Create indexes on severity for security monitoring

- [ ] **Task 2.3.17:** Create UserSettings database model
  - Add fields for user preferences
  - Add fields for API keys (encrypted with AES-256-GCM)
  - Add sessionTimeout preference
  - Add mfaEnabled flag

- [ ] **Task 2.3.18:** Create SessionRevocation database model (optional)
  - Track revoked sessions and tokens
  - Store reason (manual, password_change, suspicious_activity)
  - Store expiry time for cleanup

- [ ] **Task 2.3.19:** Implement AuthLoggerService
  - Log all authentication events
  - Log: login_success, login_failed, logout
  - Log: session_created, session_refreshed, session_revoked
  - Log: password_changed, email_changed
  - Log: mfa_enabled, mfa_disabled
  - Log: ip_blocked, geo_blocked, suspicious_activity
  - Categorize by severity (low, medium, high, critical)

- [ ] **Task 2.3.20:** Set up security event alerts
  - Alert on multiple failed login attempts (> 5 in 15 min)
  - Alert on IP blocking events
  - Alert on suspicious activity patterns
  - Send critical events to Sentry

### 🔧 API Key Management (User LLM Keys)

- [ ] **Task 2.3.21:** Create API key storage system
  - Encrypt user API keys before database storage
  - Use AES-256-GCM encryption
  - Store encryption key in environment variables
  - Never log or expose raw API keys

- [ ] **Task 2.3.22:** Build API key management UI
  - Create settings page for API keys
  - Input fields for OpenAI, Anthropic, Google keys
  - Mask keys after entry (show last 4 chars only)
  - Add "Test Connection" button per provider
  - Show which models are available based on configured keys

- [ ] **Task 2.3.23:** Implement API key validation
  - Test OpenAI key with simple API call
  - Test Anthropic key with simple API call  
  - Test Google AI key with simple API call
  - Show success/error feedback to user
  - Cache validation results (5 minutes)

### ✅ Security Testing

- [ ] **Task 2.3.24:** Test authentication flows
  - Test OAuth login (Google, GitHub)
  - Test email/password login (if enabled)
  - Test password reset flow
  - Test session refresh
  - Test logout and token revocation

- [ ] **Task 2.3.25:** Test session security
  - Verify httpOnly cookies prevent XSS
  - Test CSRF protection with sameSite
  - Test token expiry and auto-refresh
  - Test idle timeout functionality
  - Test concurrent session handling

- [ ] **Task 2.3.26:** Test rate limiting
  - Simulate brute force login attempts
  - Verify rate limit headers in responses
  - Test different rate limits per endpoint
  - Test rate limit reset behavior

- [ ] **Task 2.3.27:** Security penetration testing
  - Test for XSS vulnerabilities
  - Test for CSRF vulnerabilities
  - Test for SQL injection (Prisma parameterizes queries)
  - Test session hijacking resistance
  - Test token theft scenarios

- [ ] **Task 2.3.28:** Test audit logging
  - Verify all auth events are logged
  - Check log data completeness
  - Test log queries and filtering
  - Verify sensitive data is not logged (passwords, raw tokens)

---

## 2.4 Python AI Workers - Core Debate Engine (Week 3-4)

### 🔧 AI Workers Tasks

- [ ] **Task 2.4.1:** Initialize FastAPI project
  - Create apps/agents directory structure
  - Set up Poetry for dependency management
  - Add dependencies: FastAPI, LangGraph, OpenAI, Anthropic, Google AI
  - Create main.py entry point

- [ ] **Task 2.4.2:** Create base configuration
  - Create settings.py with Pydantic BaseSettings
  - Load API keys from environment variables
  - Configure logging
  - Set up CORS for local development

- [ ] **Task 2.4.3:** Implement debate mode configuration
  - Create debate_config.py with DEBATE_MODE_CONFIG dictionary
  - Define model options per debate mode (single, 3-agent, 5-agent)
  - Define synthesis model options
  - Allow users to select any available model

- [ ] **Task 2.4.4:** Create base Agent class
  - Define abstract base class with generate_response() method
  - Add stream_response() method for SSE
  - Include token counting and cost calculation
  - Add error handling and retry logic

- [ ] **Task 2.4.5:** Implement GPT-4o-mini Agent
  - Subclass BaseAgent
  - Implement OpenAI API integration
  - Add streaming support
  - Track tokens and calculate cost

- [ ] **Task 2.4.6:** Implement Claude Haiku Agent
  - Subclass BaseAgent
  - Implement Anthropic API integration
  - Add streaming support
  - Track tokens and calculate cost

- [ ] **Task 2.4.7:** Implement Gemini Flash Agent
  - Subclass BaseAgent
  - Implement Google AI API integration
  - Add streaming support
  - Track tokens and calculate cost

- [ ] **Task 2.4.8:** Implement Claude Sonnet Agent (Premium)
  - Subclass BaseAgent
  - Same as Haiku but with Sonnet model
  - Higher cost tracking

- [ ] **Task 2.4.9:** Implement GPT-4o Agent (Premium)
  - Subclass BaseAgent
  - Same as GPT-4o-mini but with GPT-4o model
  - Higher cost tracking

- [ ] **Task 2.4.10:** Create agent registry
  - Build agent_registry.py
  - Map model IDs to agent classes
  - Implement get_agent(model_id) factory function
  - Check user's configured API keys for model availability

### 🔧 LangGraph Workflow Tasks

- [ ] **Task 2.4.11:** Define DebateState TypedDict
  - Fields: topic, debateMode, selectedModels, roundNumber
  - Add agentResponses (dict), critiques (dict)
  - Add synthesisContext, goldenPrompt
  - Add errorCount, modelsUsed, totalCost

- [ ] **Task 2.4.12:** Create single-model workflow
  - Define node for single agent response
  - No debate rounds
  - Direct output as Golden Prompt
  - Track cost

- [ ] **Task 2.4.13:** Create 3-agent debate workflow
  - Define Round 1 node: 3 agents in parallel
  - Define critique aggregation node
  - Define Round 2 node: 3 agents refine responses
  - Define synthesis node (user-selected model)
  - Connect nodes with conditional edges

- [ ] **Task 2.4.14:** Create 5-agent debate workflow
  - Extend to 5 agents in parallel
  - Allow any available models (user's choice)
  - User-selected synthesis model

- [ ] **Task 2.4.15:** Implement error handling
  - Add circuit breaker for runaway loops (max 3 retries)
  - Exponential backoff for rate limits
  - Track errors in state.errorCount
  - Graceful degradation if 1 agent fails

- [ ] **Task 2.4.16:** Add cost tracking throughout workflow
  - Calculate cost after each agent response
  - Aggregate total cost in state
  - Return cost with final output

### 🔧 FastAPI Endpoints

- [ ] **Task 2.4.17:** Create /health endpoint
  - Return 200 OK with service status
  - Check connectivity to all LLM providers
  - Include in response: available models

- [ ] **Task 2.4.18:** Create POST /api/v1/debates/start
  - Accept: topic, debateMode, selectedModels, userApiKeys
  - Validate user has configured required API keys
  - Start debate workflow
  - Return: debateId, status

- [ ] **Task 2.4.19:** Create POST /api/v1/debates/stream
  - Accept: topic, debateMode, selectedModels
  - Stream debate progress via Server-Sent Events
  - Emit events: round_start, agent_response, round_complete, synthesis, complete
  - Return final Golden Prompt

- [ ] **Task 2.4.20:** Create GET /api/v1/debates/:id/status
  - Return current status of debate
  - Include: roundNumber, currentAgent, percentComplete

---

## 2.5 NestJS Backend API (Week 4-5)

### 🔧 Backend Tasks

- [ ] **Task 2.5.1:** Initialize NestJS project
  - Use NestJS CLI to generate new project
  - Configure Fastify adapter (faster than Express)
  - Set up module structure (features-based)
  - Configure global pipes and filters

- [ ] **Task 2.5.2:** Set up Prisma module
  - Create PrismaModule and PrismaService
  - Inject Prisma client globally
  - Add connection lifecycle hooks
  - Export for use in other modules

- [ ] **Task 2.5.3:** Create Auth module
  - Install @clerk/nextjs for server-side auth
  - Create ClerkAuthGuard
  - Create CurrentUser decorator
  - Protect routes with guard

- [ ] **Task 2.5.4:** Create Users module
  - Create UsersController with GET /users/me
  - Create UsersService with findByClerkId, create, update
  - Add GET /users/settings for user preferences
  - Return: configuredApiKeys, preferences

- [ ] **Task 2.5.5:** Create Debates module
  - Create DebatesController
  - POST /debates - Start new debate (calls AI workers)
  - GET /debates - List user's debates
  - GET /debates/:id - Get specific debate
  - Validate user has required API keys configured

- [ ] **Task 2.5.6:** Integrate with AI workers
  - Create AI workers HTTP client
  - POST to FastAPI /debates/start endpoint
  - Handle response and save to database
  - Return debate ID to frontend

- [ ] **Task 2.5.7:** Implement SSE proxy
  - Create SSE endpoint in NestJS
  - Proxy streaming events from FastAPI
  - Forward to frontend clients
  - Handle disconnections gracefully

- [ ] **Task 2.5.8:** Set up BullMQ job queue
  - Install BullMQ and configure Redis connection
  - Create debate-jobs queue
  - Add job processor for long-running debates
  - Implement retry logic with exponential backoff

### 🔧 API Documentation

- [ ] **Task 2.5.9:** Set up Swagger/OpenAPI
  - Install @nestjs/swagger
  - Add Swagger decorators to controllers
  - Configure Swagger UI at /api/docs
  - Document all endpoints with examples

- [ ] **Task 2.5.10:** Create API response DTOs
  - Define response types for all endpoints
  - Use class-validator for validation
  - Export types for frontend consumption

---

## 2.6 Next.js Frontend - Core UI (Week 5-6)

### 🎨 Design Tasks

- [ ] **Task 2.6.1:** Design component system
  - Install shadcn/ui components needed
  - Customize theme colors (brand purple/blue)
  - Set up typography scale
  - Define spacing and sizing tokens

- [ ] **Task 2.6.2:** Design debate interface mockups
  - Sketch layout: Input at top, 3 agent cards below
  - Design agent card: Model name, streaming text, status indicator
  - Create consensus view: Side-by-side comparison
  - Design Golden Prompt output card

- [ ] **Task 2.6.3:** Design model availability UI
  - Create "API key required" indicator for unconfigured models
  - Design API key setup prompt
  - Create model availability indicator component

### 🔧 Frontend Tasks

- [ ] **Task 2.6.4:** Set up frontend project structure
  - Organize by features (debate, auth, analytics, etc.)
  - Create shared components directory
  - Set up lib/utils and constants
  - Configure TypeScript strict mode

- [ ] **Task 2.6.5:** Set up Clerk authentication
  - Install @clerk/nextjs
  - Create sign-in and sign-up pages
  - Wrap app with ClerkProvider
  - Create protected route middleware

- [ ] **Task 2.6.6:** Create layout components
  - Build Sidebar component with navigation
  - Create Navbar with user menu
  - Design Footer
  - Create responsive layout wrapper

- [ ] **Task 2.6.7:** Build debate input component
  - Create textarea for topic input
  - Add character counter (max 500 chars)
  - Create model selector dropdown (filtered by configured API keys)
  - Add debate mode selector (single, 3-agent, 5-agent)
  - Add "Start Debate" button

- [ ] **Task 2.6.8:** Build streaming debate UI
  - Create AgentCard component
  - Implement SSE client to receive events
  - Stream tokens into agent cards in real-time
  - Show loading spinner during debate
  - Display round indicators

- [ ] **Task 2.6.9:** Build Golden Prompt output
  - Create GoldenPromptCard component
  - Display final synthesized prompt
  - Add copy-to-clipboard button
  - Add export options (Markdown, .cursorrules)
  - Show cost breakdown

- [ ] **Task 2.6.10:** Create model selector
  - Build ModelSelector component
  - Show all models, grey out unconfigured ones
  - Show which API keys are required per model
  - Clicking unconfigured model shows API key setup prompt

- [ ] **Task 2.6.11:** Create debate history page
  - List past debates in reverse chronological order
  - Show: Topic, date, models used, cost
  - Add filter by date range
  - Add search by topic
  - Clicking debate shows full details

- [ ] **Task 2.6.12:** Build analytics dashboard (basic)
  - Show total debates this month
  - Show total API cost this month
  - Create simple bar chart of debates by day
  - Show most-used models and debate modes

- [ ] **Task 2.6.13:** Create settings page
  - Display user info (email, preferences)
  - Manage API keys (OpenAI, Anthropic, Google)
  - Configure default debate mode and models

### 🔧 State Management

- [ ] **Task 2.6.14:** Set up Zustand stores
  - Create userStore (user data, preferences, configured API keys)
  - Create debateStore (current debate state)
  - Create modelsStore (available models, costs)

- [ ] **Task 2.6.15:** Set up TanStack Query
  - Configure QueryClient
  - Create queries for debates, user data
  - Implement caching strategy
  - Add optimistic updates

### 🔧 API Integration

- [ ] **Task 2.6.16:** Create API client
  - Build axios instance with base URL
  - Add auth interceptor (Clerk token)
  - Add error interceptor
  - Create typed API functions

- [ ] **Task 2.6.17:** Implement SSE client
  - Create useStreaming hook
  - Connect to backend SSE endpoint
  - Parse events and update UI
  - Handle reconnection on disconnect

---

## 2.7 Testing & Quality Assurance (Week 6)

### ✅ Unit Testing

- [ ] **Task 2.7.1:** Write AI workers unit tests
  - Test each agent class independently
  - Mock LLM API responses
  - Verify cost calculations
  - Test error handling

- [ ] **Task 2.7.2:** Write backend unit tests
  - Test services with mocked Prisma
  - Test guards and decorators
  - Test API key validation logic
  - Test DTOs validation

- [ ] **Task 2.7.3:** Write frontend unit tests
  - Test components in isolation
  - Test hooks with React Testing Library
  - Test utility functions
  - Test state management

### ✅ Integration Testing

- [ ] **Task 2.7.4:** Test end-to-end debate flow
  - Single-model mode → output
  - 3-agent debate → synthesis
  - 5-agent debate → synthesis
  - Verify costs match expectations

- [ ] **Task 2.7.5:** Test API key validation
  - Attempt debate without configured API keys (should show setup prompt)
  - Attempt debate with invalid API key (should show error)
  - Verify model availability reflects configured keys

- [ ] **Task 2.7.6:** Test SSE streaming
  - Verify events arrive in correct order
  - Test reconnection on disconnect
  - Test concurrent debates (2+ at once)

### ✅ Performance Testing

- [ ] **Task 2.7.7:** Test debate latency
  - Measure time for single-model debate (target: <10s)
  - Measure time for 3-agent debate (target: <30s)
  - Measure time for 5-agent debate (target: <60s)
  - Identify bottlenecks

- [ ] **Task 2.7.8:** Load testing
  - Simulate 10 concurrent debates
  - Check if backend/AI workers handle load
  - Monitor database connection pool
  - Verify no memory leaks

### ✅ Manual QA

- [ ] **Task 2.7.9:** Create QA checklist
  - Test all user flows (signup → API setup → debate → view history)
  - Test on multiple browsers (Chrome, Firefox, Safari)
  - Test responsive design (mobile, tablet, desktop)
  - Test error states (API down, network issues)

- [ ] **Task 2.7.10:** Test Golden Prompt quality
  - Run 10 real-world prompts through each debate mode
  - Compare outputs to manual debates from Phase 1
  - Verify quality matches or exceeds expectations
  - Document any quality regressions

---

# PHASE 3: Launch-Ready (Weeks 7-8)

**Goal:** Add open source infrastructure, polish UX, deploy to production

**Success Metrics:**
- GitHub repository properly set up with CI/CD
- Docker Compose working for self-hosting
- <5% error rate
- <30s average debate time
- Ready for open source launch

---

## 3.1 Open Source Setup (Week 7, Days 1-3)

### 📝 Repository Documentation

- [ ] **Task 3.1.1:** Create comprehensive README.md
  - Project overview and features
  - Screenshots and demo GIF
  - Quick start guide (local development)
  - Docker Compose quick start
  - Tech stack badges
  - Link to documentation

- [ ] **Task 3.1.2:** Add LICENSE file
  - Choose license (MIT or Apache 2.0)
  - Include copyright notice
  - Document in README

- [ ] **Task 3.1.3:** Create CONTRIBUTING.md
  - How to report bugs
  - How to suggest features
  - Pull request guidelines
  - Code style requirements
  - Development setup instructions

- [ ] **Task 3.1.4:** Create SECURITY.md
  - Vulnerability reporting process
  - Security contact email
  - Supported versions
  - Disclosure policy

### 🔧 GitHub Setup

- [ ] **Task 3.1.5:** Set up GitHub Actions CI/CD
  - Create workflow for linting and testing
  - Create workflow for building Docker images
  - Set up automated releases
  - Add status badges to README

- [ ] **Task 3.1.6:** Create issue templates
  - Bug report template
  - Feature request template
  - Question/discussion template

- [ ] **Task 3.1.7:** Create PR template
  - Description section
  - Related issues
  - Testing checklist
  - Screenshots (if UI changes)

- [ ] **Task 3.1.8:** Set up branch protection
  - Require PR reviews
  - Require CI checks to pass
  - Protect main branch
  - Document branching strategy

### 🐳 Self-Hosting Infrastructure

- [ ] **Task 3.1.9:** Create Docker Compose setup
  - Service definitions for web, api, agents
  - PostgreSQL and Redis containers
  - Volume configuration for persistence
  - Environment variable templates

- [ ] **Task 3.1.10:** Write self-hosting documentation
  - System requirements
  - Environment variables reference
  - API keys setup guide
  - Deployment options (Docker, VPS, cloud)

- [ ] **Task 3.1.11:** Create production deployment guide
  - Nginx/Caddy reverse proxy setup
  - SSL/HTTPS configuration
  - Database backup strategies
  - Monitoring recommendations

### 👥 Community Setup

- [ ] **Task 3.1.12:** Set up Discord server
  - Create channels (general, help, showcase, dev)
  - Set up roles and permissions
  - Add community guidelines
  - Configure moderation bots

- [ ] **Task 3.1.13:** Set up GitHub Discussions
  - Enable Discussions on repo
  - Create discussion categories
  - Pin getting started discussion
  - Create Q&A section

- [ ] **Task 3.1.14:** Create public roadmap
  - Use GitHub Projects or similar
  - Document planned features
  - Allow community voting
  - Link from README

---

## 3.2 Polish & UX Improvements (Week 7, Days 4-7)

### 🎨 Design & UX Tasks

- [ ] **Task 3.2.1:** Design loading states
  - Create skeleton loaders for debate cards
  - Add progress indicators during streaming
  - Design empty states (no debates yet)
  - Add success animations on completion

- [ ] **Task 3.2.2:** Design error states
  - Create error message components
  - Design 404 page
  - Create 500 error page
  - Add inline validation errors

- [ ] **Task 3.2.3:** Improve debate UI feedback
  - Add typing indicators for each agent
  - Show token count in real-time
  - Add cost estimate before starting
  - Highlight consensus points in output

- [ ] **Task 3.2.4:** Improve mobile responsiveness
  - Stack agent cards vertically on mobile
  - Make navigation collapsible
  - Optimize touch targets
  - Test on iOS and Android

- [ ] **Task 3.2.5:** Add micro-interactions
  - Button hover effects
  - Card entrance animations
  - Smooth transitions between states
  - Toast notifications for actions

### 🔧 Frontend Tasks

- [ ] **Task 3.2.6:** Add error boundary
  - Wrap app in ErrorBoundary component
  - Catch React errors gracefully
  - Show user-friendly error message
  - Log errors to Sentry (if configured)

- [ ] **Task 3.2.7:** Implement toast notifications
  - Install sonner or react-hot-toast
  - Show success toasts (debate completed, copied to clipboard)
  - Show error toasts (API failures, missing keys)
  - Show info toasts (helpful tips)

- [ ] **Task 3.2.8:** Add keyboard shortcuts
  - Cmd/Ctrl+K to open debate input
  - Cmd/Ctrl+C to copy Golden Prompt
  - ESC to close modals
  - Document shortcuts in help menu

- [ ] **Task 3.2.9:** Improve accessibility
  - Add ARIA labels to all interactive elements
  - Ensure keyboard navigation works
  - Test with screen reader
  - Fix color contrast issues

- [ ] **Task 3.2.10:** Add tooltips and help text
  - Add tooltips to model badges
  - Explain debate mode features in tooltips
  - Add help icon with explanations
  - Create onboarding tooltips for first-time users

### 🔧 Performance Optimization

- [ ] **Task 3.2.11:** Optimize bundle size
  - Code-split large components
  - Lazy load pages
  - Tree-shake unused code
  - Minimize third-party libraries

- [ ] **Task 3.2.12:** Optimize images
  - Use Next.js Image component
  - Convert to WebP format
  - Add lazy loading
  - Set up responsive images

- [ ] **Task 3.2.13:** Add caching
  - Cache debate list queries
  - Implement stale-while-revalidate
  - Cache user data
  - Invalidate on mutations

---

## 3.3 Deployment & Infrastructure (Week 8)

### 🔧 Backend Deployment

- [ ] **Task 3.3.1:** Set up Railway account
  - Create Railway account
  - Connect GitHub repository
  - Configure auto-deploy on push to main

- [ ] **Task 3.3.2:** Deploy NestJS backend
  - Create Railway service for backend
  - Configure build command: pnpm build
  - Configure start command: pnpm start:prod
  - Add environment variables
  - Set up health check endpoint

- [ ] **Task 3.3.3:** Deploy Python AI workers
  - Create separate Railway service for AI workers
  - Configure build: poetry install
  - Configure start: uvicorn src.main:app
  - Add environment variables
  - Verify can communicate with backend

- [ ] **Task 3.3.4:** Configure Railway networking
  - Set up internal URLs for service-to-service communication
  - Configure external URL for backend API
  - Set up custom domain (api.myconsilium.xyz)

- [ ] **Task 3.3.5:** Set up Neon PostgreSQL production
  - Upgrade to Launch tier ($19/mo)
  - Configure connection pooling
  - Run production migrations
  - Set up automated backups

- [ ] **Task 3.3.6:** Configure Upstash Redis production
  - Upgrade if needed (or stay on Free)
  - Configure eviction policy
  - Set up persistence
  - Monitor memory usage

### 🔧 Frontend Deployment

- [ ] **Task 3.3.7:** Deploy to Vercel
  - Connect GitHub repository to Vercel
  - Configure environment variables
  - Set up custom domain (myconsilium.xyz)
  - Enable Vercel Analytics

- [ ] **Task 3.3.8:** Configure production build
  - Enable production optimizations
  - Verify sourcemaps disabled
  - Set up proper caching headers
  - Configure CORS for API

### 🔧 Monitoring & Observability

- [ ] **Task 3.3.9:** Set up Sentry (optional)
  - Create Sentry account
  - Install Sentry SDK in frontend, backend, AI workers
  - Configure error tracking
  - Set up alerts for critical errors

- [ ] **Task 3.3.10:** Set up logging
  - Configure structured logging in backend
  - Log all API requests with timing
  - Log debate sessions with metadata
  - Set up log retention policy

- [ ] **Task 3.3.11:** Set up uptime monitoring
  - Use UptimeRobot or similar
  - Monitor frontend URL
  - Monitor backend /health endpoint
  - Set up alerts via email/SMS

- [ ] **Task 3.3.12:** Create monitoring dashboard
  - Railway: Monitor CPU, memory, network
  - Neon: Monitor database connections, query performance
  - Upstash: Monitor Redis commands, memory
  - Create alerts for thresholds

### ✅ Production Testing

- [ ] **Task 3.3.13:** Run production smoke tests
  - Test signup flow end-to-end
  - Test all debate modes (single, 3-agent, 5-agent)
  - Test API key configuration flow
  - Test SSE streaming in production

- [ ] **Task 3.3.14:** Load testing
  - Simulate 50 concurrent users
  - Run 100 debates in 10 minutes
  - Monitor infrastructure performance
  - Identify breaking points

- [ ] **Task 3.3.15:** Security audit
  - Verify all secrets in environment variables
  - Check for exposed API keys
  - Test CORS configuration
  - Verify HTTPS everywhere
  - Test Clerk auth edge cases

---

## 3.4 Documentation & Support (Week 8)

### 📝 Documentation Tasks

- [ ] **Task 3.4.1:** Write user documentation
  - Create "Getting Started" guide
  - Document how to configure API keys
  - Document how to start a debate
  - Document export formats

- [ ] **Task 3.4.2:** Create API documentation
  - Document REST API endpoints
  - Add request/response examples
  - Document error codes
  - Create Postman collection

- [ ] **Task 3.4.3:** Write FAQ
  - What is a Golden Prompt?
  - How does multi-model debate work?
  - What's the difference between debate modes?
  - How do I configure my API keys?
  - How do I self-host Consilium?
  - How can I contribute to the project?

- [ ] **Task 3.4.4:** Create video tutorials
  - Record: How to create your first debate
  - Record: Understanding model differences
  - Record: Exporting to Cursor/Copilot
  - Upload to YouTube

- [ ] **Task 3.4.5:** Write privacy policy
  - Disclose data collection
  - Explain how prompts are stored
  - Detail data retention policy
  - Add GDPR compliance info

- [ ] **Task 3.4.6:** Write terms of service
  - Fair use policy
  - Acceptable use policy
  - Disclaimer about AI-generated content
  - Open source license implications

### 🔧 Support Setup

- [ ] **Task 3.4.7:** Set up support email
  - Create support@myconsilium.xyz
  - Set up auto-responder
  - Create email templates for common issues
  - Forward to personal email

- [ ] **Task 3.4.8:** Set up community support
  - Discord server for community help
  - GitHub Discussions for Q&A
  - Document support expectations (community-driven)
  - Create FAQ for common issues

- [ ] **Task 3.4.9:** Set up feedback collection
  - Add feedback form in app
  - Use GitHub Issues for feature requests
  - Allow community voting via reactions
  - Respond to top requests

---

# PHASE 4: Open Source Launch (Week 9-12)

**Goal:** Launch publicly and build active community

**Success Metrics:**
- ProductHunt top 5 product of the day
- 500+ GitHub stars in first week
- 200+ signups on launch day
- 50+ Discord community members
- 10+ contributors within month 1

---

## 4.1 Pre-Launch Marketing (Weeks 9-10)

### 📝 Content Creation

- [ ] **Task 4.1.1:** Create ProductHunt listing
  - Write tagline (160 chars max)
  - Write description (detailed explanation)
  - Upload screenshots (5-6 high-quality)
  - Record demo video (60-90 seconds)
  - Add first comment with more details

- [ ] **Task 4.1.2:** Record demo video
  - Show problem: AI code quality issues
  - Demo single-model vs 3-agent debate
  - Show quality difference in outputs
  - Show Golden Prompt copy to Cursor
  - Show successful code generation
  - Highlight open source and self-hosting

- [ ] **Task 4.1.3:** Create launch assets
  - Design ProductHunt thumbnail (240x240)
  - Create social media images (Twitter, LinkedIn)
  - Design email header for announcement
  - Create Reddit post templates

- [ ] **Task 4.1.4:** Build in public content series
  - Week 9: "Building the debate engine" thread
  - Week 10: "Cost optimization strategies" thread
  - Week 11: "We're launching on ProductHunt" thread
  - Week 12: "Launch day results" thread

- [ ] **Task 4.1.5:** Create case studies
  - Document 3-5 successful debates
  - Show before/after (without vs with Golden Prompt)
  - Include testimonials from beta users
  - Create visual comparison charts

### 📝 Community Building

- [ ] **Task 4.1.6:** Engage with ProductHunt community
  - Comment on other launches
  - Build relationships with hunters
  - Identify potential hunter for our launch
  - Request upvotes from network

- [ ] **Task 4.1.7:** Build Twitter following
  - Post daily updates on progress
  - Share technical insights
  - Engage with AI coding community
  - Use hashtags: #buildinpublic #AIcoding

- [ ] **Task 4.1.8:** Engage on Reddit
  - Comment in r/webdev, r/programming
  - Share helpful insights (no spam)
  - Build karma and reputation
  - Prepare launch posts

- [ ] **Task 4.1.9:** Email waitlist nurture
  - Send update: "We're launching soon"
  - Tease ProductHunt launch date
  - Ask for support (upvote and GitHub star)
  - Invite to Discord community

---

## 4.2 Launch Week (Week 11)

### 🚀 Launch Day Preparation

- [ ] **Task 4.2.1:** Schedule ProductHunt launch
  - Choose Tuesday, Wednesday, or Thursday
  - Submit at 12:01 AM Pacific Time
  - Ensure hunter is ready
  - Prepare team for launch day

- [ ] **Task 4.2.2:** Prepare launch day responses
  - Draft responses to common questions
  - Prepare technical explanations
  - Create FAQ responses
  - Assign team member to monitor comments

- [ ] **Task 4.2.3:** Set up analytics tracking
  - Track ProductHunt referral traffic
  - Set up conversion funnels
  - Monitor signup rate
  - Track GitHub stars and forks

- [ ] **Task 4.2.4:** Prepare infrastructure for traffic spike
  - Scale Railway resources if needed
  - Increase rate limits temporarily
  - Monitor error rates
  - Prepare rollback plan

### 🚀 Launch Day Execution

- [ ] **Task 4.2.5:** Submit to ProductHunt (12:01 AM PT)
  - Launch with hunter
  - Post first comment with details
  - Share on all social media
  - Email waitlist with launch link

- [ ] **Task 4.2.6:** Respond to all comments within 1 hour
  - Answer questions thoroughly
  - Thank people for feedback
  - Address concerns
  - Be genuine and transparent

- [ ] **Task 4.2.7:** Share on social media
  - Twitter: "We're live on ProductHunt!"
  - LinkedIn: Professional announcement
  - Reddit: r/SideProject launch post
  - HackerNews: Submit if appropriate

- [ ] **Task 4.2.8:** Monitor and respond all day
  - Check ProductHunt every 30 minutes
  - Respond to new comments immediately
  - Thank upvoters
  - Engage in discussions

- [ ] **Task 4.2.9:** Email campaign
  - Send to waitlist: "We're live!"
  - Include ProductHunt link
  - Ask for upvote and comment
  - Offer limited-time discount (optional)

### 🚀 Post-Launch (Days 2-7)

- [ ] **Task 4.2.10:** Share results
  - Tweet about launch results
  - Share metrics: upvotes, signups, conversions
  - Thank supporters publicly
  - Write launch retrospective blog post

- [ ] **Task 4.2.11:** Convert ProductHunt traffic
  - Email new signups
  - Offer onboarding call to first 50 users
  - Collect feedback
  - Identify power users

- [ ] **Task 4.2.12:** Create follow-up content
  - "We launched on ProductHunt, here's what we learned"
  - Share detailed metrics
  - Discuss what worked/didn't work
  - Build credibility

---

## 4.3 Growth & Optimization (Weeks 11-12)

### 📊 Analytics & Metrics

- [ ] **Task 4.3.1:** Set up analytics dashboards
  - Track daily signups and GitHub stars
  - Track debate mode distribution
  - Track debate completion rate
  - Track time-to-first-debate

- [ ] **Task 4.3.2:** Monitor engagement funnel
  - Signup → API key setup
  - API setup → First debate
  - First debate → Second debate
  - Star → Contribute

- [ ] **Task 4.3.3:** Track retention metrics
  - Daily active users
  - Weekly active users
  - Return rate
  - Re-engagement rate

- [ ] **Task 4.3.4:** Analyze quality metrics
  - Average debate time by mode
  - Model usage distribution
  - Golden Prompt copy rate
  - User satisfaction (NPS)

### 🔧 Optimization Tasks

- [ ] **Task 4.3.5:** Optimize onboarding
  - Reduce steps to first debate
  - Add tutorial tooltips
  - Create sample prompts to try
  - Show example outputs

- [ ] **Task 4.3.6:** Optimize landing page
  - A/B test headlines
  - Test CTA copy for GitHub stars
  - Test demo video placement
  - Measure star conversion rates

- [ ] **Task 4.3.7:** Optimize debate UX
  - Reduce perceived wait time
  - Improve streaming visualization
  - Add progress estimates
  - Highlight quality differences

- [ ] **Task 4.3.8:** Encourage contributions
  - Create "good first issue" labels
  - Write contribution tutorials
  - Highlight contributors in README
  - Create contributor rewards program

### 📝 Content Marketing

- [ ] **Task 4.3.9:** Publish case studies
  - "How Consilium reduced AI debugging by 70%"
  - "Multi-model debate vs single model: Quality comparison"
  - Interview power users
  - Share on Dev.to, Medium, Hashnode

- [ ] **Task 4.3.10:** Create SEO content
  - Blog: "Best practices for AI coding prompts"
  - Blog: "GPT-4 vs Claude vs Gemini for code generation"
  - Blog: "How to use Golden Prompts with Cursor"
  - Optimize for keywords: "AI coding prompts", "Cursor alternatives"

- [ ] **Task 4.3.11:** Build educational content
  - Video: "Prompt engineering for developers"
  - Guide: "Cursor .cursorrules best practices"
  - Template library: Common Golden Prompts
  - Newsletter: Weekly prompt engineering tips

---

# PHASE 5: Post-Launch Iteration (Months 2-3)

**Goal:** Grow community to 1000+ stars and iterate based on feedback

---

## 5.1 Feature Priorities (Based on Community Feedback)

- [ ] **Task 5.1.1:** Custom agent personas
  - Allow users to define agent perspectives
  - Save custom personas
  - Share personas with community

- [ ] **Task 5.1.2:** Public API
  - Create API authentication
  - Document API endpoints
  - Create SDKs (TypeScript, Python)
  - Publish to npm and PyPI

- [ ] **Task 5.1.3:** VS Code extension
  - Create basic extension
  - Right-click → "Debate with Consilium"
  - Insert Golden Prompt into file
  - Show debate in sidebar

- [ ] **Task 5.1.4:** Improve consensus visualization
  - Show where models agree/disagree
  - Highlight unique insights from each model
  - Create diff view
  - Add confidence scores

- [ ] **Task 5.1.5:** GitHub repo indexing
  - Allow users to upload repo
  - Extract codebase context
  - Include in debate for architecture-aware prompts
  - Cache repo analysis

---

## 5.2 Sponsorship Setup (Months 2-3)

### 💰 GitHub Sponsors

- [ ] **Task 5.2.1:** Set up GitHub Sponsors profile
  - Write compelling sponsor description
  - Define project goals and funding needs
  - Add profile picture and banner

- [ ] **Task 5.2.2:** Create sponsor tiers
  - $5/month: Supporter (name in README)
  - $25/month: Backer (logo in README, Discord role)
  - $100/month: Sponsor (logo on website, priority support)
  - $500/month: Gold Sponsor (featured placement, roadmap input)

- [ ] **Task 5.2.3:** Set up sponsor perks
  - Monthly sponsor newsletter
  - Early access to new features
  - Private Discord channel
  - Priority issue response

### 🌐 Open Collective (Optional)

- [ ] **Task 5.2.4:** Create Open Collective page
  - Set up transparent expense tracking
  - Define how funds will be used
  - Link from README and website

- [ ] **Task 5.2.5:** Document funding goals
  - Infrastructure costs breakdown
  - Development time allocation
  - Community building activities
  - Long-term sustainability plan

---

## 5.3 Advanced Features (Months 3-6)

- [ ] **Task 5.3.1:** Kubernetes deployment support
  - Create Helm charts
  - Document Kubernetes installation
  - Add horizontal scaling guide
  - Create monitoring dashboards

- [ ] **Task 5.3.2:** Plugin system
  - Design plugin architecture
  - Allow custom model integrations
  - Enable workflow customization
  - Create plugin marketplace

- [ ] **Task 5.3.3:** Team features (community request)
  - Shared debate history
  - Team workspaces
  - Role-based permissions
  - Usage analytics per member

- [ ] **Task 5.3.4:** Enterprise features (community request)
  - SSO/SAML support
  - Audit logging
  - Advanced security options
  - Priority support for sponsors

---

# APPENDIX: Ongoing Tasks

## A.1 Weekly Maintenance

- [ ] **Monitor infrastructure costs**
  - Check Railway usage
  - Check Neon database size
  - Check Upstash Redis usage
  - Optimize if approaching limits

- [ ] **Review error logs**
  - Check Sentry for new errors
  - Investigate high-frequency errors
  - Fix critical bugs
  - Deploy patches

- [ ] **Community engagement**
  - Respond to GitHub issues within 48 hours
  - Answer Discord questions daily
  - Review and merge PRs weekly
  - Thank contributors publicly

- [ ] **Content creation**
  - Publish 1 blog post per week
  - Post 3-5 tweets per week
  - Share 1 case study per month
  - Create 1 tutorial per month

## A.2 Monthly Tasks

- [ ] **Review metrics**
  - Analyze GitHub stars and forks
  - Review debate mode distribution
  - Track active users and retention
  - Monitor community growth

- [ ] **Financial review**
  - Review sponsorship income
  - Review infrastructure costs
  - Calculate runway
  - Evaluate sustainability

- [ ] **User interviews**
  - Interview 5-10 users per month
  - Collect feature requests
  - Understand pain points
  - Validate roadmap priorities

- [ ] **Update documentation**
  - Keep docs in sync with product
  - Add new features to guides
  - Update screenshots
  - Fix broken links

---

# END OF TASKS.md

**Total estimated tasks:** 300+
**Timeline:** 8 weeks to MVP → 12 weeks to open source launch → Ongoing community growth

**Note:** This is a living document. Tasks will be added, removed, or reprioritized based on community feedback and contributions.