# AgentAway Project Description

AgentAway is a full-stack GitHub App and web workbench for supervised coding-agent runs. The core idea is simple: a maintainer should be able to ask an AI agent to inspect a GitHub issue, propose a plan, revise that plan, and attempt a small implementation, while keeping all risky decisions visible and reviewable. The app is designed around a conservative workflow. It never merges code, never pushes directly to the default branch, and treats generated patches as draft pull requests that a human must review before accepting.

The project began as a Pocket Maintainer MVP and has grown into a public GitHub agent prototype. It is larger than a simple model wrapper. The interesting engineering work is the system around the model: account auth, GitHub App installation linking, webhook verification, run persistence, encrypted bring-your-own-key provider credentials, queue-backed worker execution, safety checks before writing generated files, test detection, audit logs, and a mobile-friendly workbench for monitoring activity. The repository is a Dockerized monorepo with a FastAPI backend, Celery worker, Redis queue, PostgreSQL database, and Next.js frontend. Excluding generated dependencies, build output, and lock files, the project is over 10,000 lines across application code, tests, styles, docs, and configuration.

## Product Concept

AgentAway is built for developers who want the speed of AI coding tools without giving them unsupervised control over a repository. The user signs in, links a GitHub App installation, chooses accessible repositories, stores an encrypted provider API key, and then triggers work from either GitHub issue comments or the web UI. The supported commands are currently `/plan`, `/fixplan`, `/proceed`, and `/fix`. A maintainer can post `/plan` on an issue to ask the agent for an implementation plan. If the plan needs changes, `/fixplan` asks the agent to revise the latest completed plan. If the plan looks good, `/proceed` attempts to implement that prior plan. `/fix` skips the two-step flow and asks the agent to attempt a small fix directly.

The workbench mirrors this GitHub-native flow in a web interface. It lists linked repositories, displays issues, lets the user create new issues, posts command comments, and shows recent agent runs. This makes the product usable even when the user is not inside GitHub. The UI is intentionally operational rather than flashy: it shows setup warnings, linked installations, recent runs, issue state, command shortcuts, run details, plan summaries, generated diff summaries, test results, and errors.

## Architecture

The backend is a FastAPI service responsible for authentication, account setup, GitHub App linking, webhook ingestion, external API access, provider-key management, run listing, and workbench endpoints. It stores data in PostgreSQL through SQLAlchemy models. Important tables include user accounts, GitHub installations, repositories, repository access grants, webhook deliveries, agent runs, run events, provider credentials, API token grants, refresh tokens, and audit logs. This gives the product a durable record of who triggered a run, which repository and issue it targeted, what command was parsed, which provider and model were used, what status the run reached, and what artifacts or errors were produced.

Redis is used for two roles: Celery broker and backend for background tasks, and lightweight rate limiting for sensitive actions. The worker process consumes named Celery tasks. The core task names are `pocket_maintainer.runs.create_plan` for planning and `pocket_maintainer.runs.implement_patch` for implementation attempts. A health task proves that the worker can execute jobs, and webhook handling tasks mark stored webhook events as processed. This split keeps the HTTP API responsive while slow work, such as model calls, repository cloning, running tests, committing, pushing, and opening draft PRs, happens asynchronously.

The frontend is a Next.js app. It includes a setup surface for provider keys and GitHub installations, a repository workbench, issue views, command composer controls, a run inbox, and run detail screens. It uses authenticated fetch helpers so browser calls can pass Clerk session tokens when production auth is configured. In local development, the API can fall back to a deterministic dev user when Clerk is not configured, which makes the project easier to run and test without cloud setup.

## GitHub Integration

AgentAway integrates with GitHub through a GitHub App rather than a personal access token. The app installation provides repository-scoped permissions for metadata, contents, issues, and pull requests. Installation and repository events are synced into the database so each user sees only the repositories they have linked. The webhook route requires the `X-Hub-Signature-256` HMAC signature and a configured webhook secret. Duplicate GitHub delivery IDs are detected and accepted without creating duplicate runs.

Issue comments are parsed deterministically. The parser supports short commands like `/plan` and also `/agent plan` style commands. It extracts conservative modifiers such as maximum file count, whether tests were requested, frontend-only constraints, and forbidden paths. Commands from bot accounts are ignored to avoid feedback loops. When a valid command appears on an issue comment, the API persists the raw webhook payload, creates a user-scoped AgentRun, and enqueues the appropriate Celery task.

For implementation runs, the worker creates a GitHub App installation token, checks that the triggering actor has sufficient repository permission when the run originated from GitHub, clones the repository, creates a branch named for the issue and run, applies generated file content, detects a likely test command, runs it with a timeout, commits the result, pushes the branch, opens a draft pull request, and comments back on the original issue. The draft PR wording makes it clear that the output is agent-generated and should be reviewed before merging.

## AI Provider Model

AgentAway is provider-agnostic at the application level. It supports OpenAI, Anthropic, and DeepSeek style chat completion APIs, with per-user provider credentials stored in encrypted form. The user can choose a default provider and model. Provider keys are never returned raw after storage. The app only displays metadata such as provider, model, base URL, key hint, status, and last-tested timestamp.

The planning task asks the model to return structured JSON with a summary, steps, likely files, tests, and risks. The worker parses the JSON and posts it back to GitHub as a readable issue comment. The implementation task asks for a minimal safe file plan with a summary, files, and commit message. It then validates the model output before writing to disk. This is important because the product treats the model as an untrusted planner and code generator. The model can suggest work, but the system still validates path rules, max file count, branch behavior, and execution boundaries.

## Security And Safety

Security is one of the strongest parts of the project. The API has Clerk-compatible authentication for production and local dev fallback only when Clerk is unconfigured. It includes scoped first-party API access tokens for external clients. Access tokens are short-lived JWTs. Refresh tokens are opaque, hashed at rest, one-time-use, rotated on refresh, and family-revoked if reuse is detected. Token grants have explicit scopes such as account read, repository read, issue read, issue write, command write, run read, and run write. Audit events are recorded for sensitive actions like provider-key changes, token lifecycle events, and workbench commands.

The worker also has safety boundaries. Generated paths are checked before file writes. Default forbidden paths include GitHub workflows, environment files, PEM and key files, SSH keys, secrets folders, and production infrastructure. Absolute paths and parent-directory traversal are rejected. The command parser can cap the number of files touched, and the implementation prompt asks for small complete file changes. The system is intentionally conservative: it does not merge, does not write directly to the default branch, and opens only draft PRs.

The error handling also avoids leaking secrets. Worker error messages redact GitHub access tokens and common token patterns before storing them in run events. This matters because run details are user-visible and could otherwise expose credentials during failed clone, push, or provider-call operations.

## Why It Is Resume-Worthy

AgentAway is strong resume material because it combines full-stack product engineering with AI infrastructure, security, and platform integration. It is more impressive than a small isolated machine-learning script because it shows how to build an actual AI-enabled developer product. The project demonstrates backend architecture, asynchronous job processing, webhook systems, API design, authentication, encryption, token security, GitHub App permissions, database modeling, frontend workbench design, and safe use of LLM outputs.

The best way to present it is not as "an AI app that writes code." The stronger framing is "a supervised coding-agent platform for GitHub issues." That wording emphasizes the engineering judgment behind the project: agents should produce plans and draft PRs, but humans remain in the review loop. It also signals that you understand the hard parts around AI products are often orchestration, permissioning, traceability, and failure handling, not only prompt writing.

## Resume Bullets

- Built AgentAway, a Dockerized GitHub App and web workbench for supervised coding-agent runs using FastAPI, Next.js, Celery, Redis, PostgreSQL, and GitHub App APIs.
- Implemented HMAC-verified GitHub webhooks, deterministic issue-command parsing, delivery deduplication, user-scoped run persistence, and Celery workflows for `/plan`, `/fixplan`, `/proceed`, and `/fix` commands.
- Designed security controls for encrypted BYOK provider keys, Clerk-compatible auth, scoped JWT access tokens, one-time refresh-token rotation, reuse detection, audit logs, rate limits, and permission checks.
- Built conservative patch automation that clones repositories, creates issue-scoped branches, validates generated file paths, runs detected tests, pushes changes, opens draft PRs, and avoids default-branch writes.

## Resume Project Strategy

Use three projects on the resume if space is tight. Replace Sentiment Analysis with Naive Bayes with AgentAway. Naive Bayes is a good learning project, but AgentAway is larger, more recent, more relevant to current AI developer tooling, and shows much broader engineering depth. Keep UBC Course and Room Explorer because it reinforces TypeScript, Node.js, API design, testing, and backend fundamentals. Keep Interval Timer App if you want to show mobile breadth, or keep Formula 1 DBMS instead if targeting database-heavy roles. For most full-stack or backend roles, the strongest three are AgentAway, UBC Course and Room Explorer, and Interval Timer App.

Add the repository link on the resume if the repo is public and clean enough for employers to inspect. A GitHub link is especially valuable for AgentAway because the architecture is the evidence. If the repository contains placeholder files, old names such as Pocket Maintainer, or setup rough edges, that is acceptable as long as the README clearly explains what is implemented, how to run it, and what remains future work.

## Technical Skills To Add

Add TypeScript to languages if it is not already listed. Add FastAPI, Next.js, PostgreSQL, Redis, Celery, Docker, GitHub Apps, GitHub Webhooks, Clerk, JWT, and SQLAlchemy if you have room. If the resume is crowded, remove or de-emphasize JSP/JSTL and Haskell unless a specific job asks for them. Java Swing can move out of the main skills section unless you keep Formula 1 DBMS and want that project to be searchable. The highest-signal additions from AgentAway are FastAPI, Next.js, Docker, PostgreSQL, Redis, Celery, GitHub Apps, Webhooks, JWT, and LLM API integration.
