# Development Principles

## Preamble

This document is the development constitution for this project. It codifies the values and practices
that keep the codebase approachable, sustainable, and contributor-friendly across a long time
horizon. The primary reader is a future contributor arriving without context. The secondary reader
is automated tooling: linters, type-checkers, and CI pipelines that enforce these principles
mechanically so humans do not have to enforce them socially.

When principles conflict, the priority order is: **clarity first, then correctness, then
performance.** An unreadable optimization and a readable bug are both failures, but the readable bug
is easier to find and fix. Never sacrifice clarity for cleverness.

## Syntax and Module Conventions

Use ESModule syntax exclusively. All imports use `import` and all exports use `export`; `require`
and `module.exports` are prohibited. This codebase does not mix module systems.

All imports must be static (`import … from '…'` at the top of the file, separated between package
imports and local imports with a blank space). Dynamic `import()` expressions are prohibited except
when loading genuinely static assets (e.g., JSON data files, WASM modules) where a static import is
not possible. Type-only imports must use the `import type` form so they are erased at compile time
and never appear in the emitted output.

Arrow functions are the default form for all function declarations. Named arrow functions assigned
to `const` declarations are preferred over `function` keyword declarations because they are
consistently scoped, compose cleanly, and appear with their assigned name in stack traces when
assigned at module scope.

All asynchronous code uses `async`/`await` syntax. `.then()` and `.catch()` chaining is prohibited
throughout the codebase because it fragments control flow across callbacks, making errors harder to
trace and logic harder to follow. The sole exception is a top-level process entry point where an
immediately-invoked async function expression
`(async () => { try { await main(); } catch (err) { ... } })()` is the idiomatic form; `.then()` and
`.catch()` remain prohibited in all other contexts.

TypeScript source files use the `.ts` extension. The `.js` extension appears only in compiled
output. File extensions must be consistent and unambiguous so that tooling and contributors always
know what they are looking at.

## Function Design

Every function must do exactly one thing. If the honest description of a function requires the word
"and," it is doing too much and must be split. This is not a stylistic preference — it is the
primary mechanism by which this codebase remains navigable as it grows.

Functions must be as short as possible. A function that fits on one screen without scrolling is a
ceiling, not a target. Most functions should be far shorter. When a function grows, the first
instinct must be to extract named helpers, not to scroll past the complexity.

Inline callbacks and anonymous lambdas are prohibited for any callback that contains logic. Every
such function must be extracted to a named, documented arrow function at module scope. Named
functions are independently testable, appear in stack traces with a readable label, carry JSDoc
documentation that surfaces in the IDE, and can be swapped for another function that satisfies the
same interface.

The one acceptable use of an inline lambda is a thin adapter that does nothing but bridge a
library's callback signature to a named function — for example,
`app.event("x", async (args) => namedHandler(args))`. These adapters contain no logic and are
transparent in stack traces. Inline lambdas used for
`new Promise((resolve) => setTimeout(resolve, ms))` are also acceptable because extracting the
resolver adds noise without any benefit.

Functions used as callbacks must conform to a named, exported type alias or interface so that any
compliant implementation can be substituted without modifying the consumer. This is the practical
mechanism for dependency inversion at the function level.

Functions must not accept more than two positional parameters. When a function requires more than
two inputs, those inputs must be collected into a structured parameter object typed as a named
interface. Positional parameter lists longer than two are fragile, hard to read at call sites, and
impossible to extend without breaking callers.

Boolean trap parameters are prohibited. A parameter whose only purpose is to switch a function
between two behaviors is a design smell. Split the function into two named functions with distinct,
descriptive names.

Pure functions — those that produce output solely from their inputs and cause no side effects — are
strongly preferred. When side effects are necessary, they must be explicit, localized to a single
function, and documented.

Idempotent operations are preferred wherever the domain allows. A function that can be called
multiple times with the same input and produce the same result without additional side effects is
dramatically safer to operate, retry, and test than one that accumulates state on each call.

## Type System and Interfaces

Every parameter object must be typed as a named, exported interface — never as an inline object
literal type. Interfaces are reusable across the codebase, appear in IDE documentation, and give
contributors a single place to understand the shape of a value.

Every member of every interface must carry a JSDoc comment that describes its purpose, its
acceptable values, and whether it is optional. This documentation surfaces directly in IDE hover
tooltips at every call site throughout the codebase. It is the primary mechanism for communicating
intent to contributors without requiring them to trace code. Documentation on interface members is
not optional.

All interface members are `readonly` by default. Remove `readonly` only when the interface is
explicitly designed for in-place mutation, and document why with a JSDoc comment on the affected
member. This inversion of default produces safer code with less cognitive overhead — omitting
`readonly` is the intentional act, not adding it.

Use discriminated unions to model values that vary structurally across states. Never use a cluster
of optional properties as a proxy for a variant type — optional properties hide which combinations
are valid and which are impossible, and they prevent TypeScript from exhaustively checking variants.
A discriminated union makes every case explicit and compiler-verified.

Use the most specific type available. When a value is constrained to a bounded set of strings or
numbers, use a string literal union type or an enum rather than the primitive `string` or `number`.
Specific types surface invalid values at compile time rather than at runtime.

Never use `any`. When the type of a value is genuinely unknown — at a system boundary, for example —
use `unknown` and narrow it explicitly with type guards before use. `any` silently disables the type
checker for everything it touches.

Export every type and interface that crosses a module boundary. Consumers must never need to
reconstruct a type from inference or copy it from another module. A type that is used outside its
module of origin belongs in the public surface of that module.

## Async Programming

All asynchronous code uses `async`/`await` throughout. This is not a preference — it is a hard rule.
`await` makes asynchronous control flow read linearly, keeps error handling inside standard
`try`/`catch` blocks, and produces stack traces that reflect the actual call sequence. `.then()`
chaining produces none of these properties.

When multiple asynchronous operations are independent of each other — when one does not depend on
the result of another — they must be initiated concurrently and resolved together. Use `Promise.all`
when every operation must succeed for the combined result to be useful. Use `Promise.allSettled`
when partial failure is acceptable and each result must be inspected individually. Never `await`
independent operations sequentially; that imposes unnecessary latency.

Never `await` inside a loop when the iterations are independent. Collect the promises from the loop
body and resolve them together with `Promise.all` or `Promise.allSettled`. The exception is when
serialization is operationally required — for example, when delivering messages to an external API
that enforces a strict rate limit. In that case, `await` inside a loop is acceptable, and the
function must carry a JSDoc comment that explains the constraint and names the external system
imposing it.

Fire-and-forget is prohibited. Every `async` function invocation must be awaited or its returned
promise must be explicitly handled. Unhandled promise rejections disappear silently and are among
the most difficult bugs to diagnose.

## Error Handling

No error may be silently discarded. Every `catch` block must do one of three things: log the error
with sufficient context and rethrow it, rethrow it directly, or transform it into a typed error
value that the calling code explicitly handles. An empty `catch` block or one that logs and then
continues as if nothing happened is a defect.

Every error that is caught and logged or rethrown must carry enough context to diagnose the failure
without access to the original runtime state: the operation that was attempted, the input or
identifier involved, and the original error message and stack. Stripped or decontextualized errors
waste debugging time.

Domain errors — errors that represent known failure conditions in the application's logic — must be
represented as typed error classes with a stable, programmatically-readable error code property.
Control flow must never branch on error message strings; they are for humans, not machines, and they
change.

Errors at system boundaries — incoming user input, responses from external APIs, values read from
the environment — must be caught and handled explicitly at the point of entry. Business logic must
not be responsible for defending against malformed external data; that responsibility belongs to the
layer that accepts the data.

Configuration errors must cause immediate, loud failure at startup. A missing or malformed
configuration value that produces a silent fallback is worse than a crash because it produces
incorrect behavior that may not be noticed for a long time.

## Logging

Logging is a first-class engineering concern. The ability to reconstruct what a running system did
is not a debugging luxury — it is a correctness and reliability requirement. Logging must be
designed in, not added later.

Every structured log entry must include a severity level, a human-readable message, the name of the
module or function emitting the entry, and any relevant contextual values as named key-value pairs.
Log entries that consist only of a message string are insufficient for diagnosis in production.

Logging must be performed through an injected logger interface, never by calling `console` methods
directly in business logic. Depending directly on `console` couples every module to a specific
logging implementation, makes log behavior impossible to control from a single point, and prevents
the logger from being replaced or silenced in tests. The logger interface is injected as a
dependency.

Log at the points where significant work occurs: before and after calls to external systems, when a
decision branches based on configuration or input, and at the entry and exit of major operations.
Logs that capture only errors are insufficient for understanding normal system behavior.

Respect log levels. Use `debug` for internal state that is useful when investigating a specific
problem. Use `info` for milestones that confirm the system is operating normally. Use `warn` for
anomalies that are recoverable but worth attention. Use `error` for failures that affect correctness
or availability. Emitting everything at `info` or `error` defeats the purpose of levels.

Sensitive data — authentication tokens, credentials, API keys, personally identifiable information —
must never appear in log output at any level, including `debug`. Assume that logs are stored,
transmitted, and occasionally leaked.

## Configuration and Environment

All configuration must be declared in a single, documented configuration interface. No module may
read from the environment directly at an arbitrary point in its logic. Environment variables are
read once, validated completely, and resolved into a typed configuration object at startup.
Everything else receives that object.

Configuration must be validated before any business logic runs. If a required value is absent,
malformed, or out of range, the application must fail immediately with a message that names the
specific problem. A startup failure that describes its cause is infinitely preferable to an
application that starts successfully and then behaves incorrectly because a value was missing.

No string value that a human operator, deployer, or translator might reasonably need to change may
be hard-coded inside logic. User-facing text — messages, labels, error descriptions — belongs in a
dedicated constants or locale module, not inline in functions.

Distinguish between two categories of non-inline values. **Operator configuration** belongs in
`Config` and is sourced from the environment: values that legitimately differ across deployments or
operators (API keys, ports, paths, feature flags). **Named engineering constants** belong as
module-level `const` declarations with JSDoc explaining the choice: values that are fixed
engineering decisions not intended for operator tuning (retry delays, pagination limits,
algorithm-specific thresholds). Putting engineering constants into `Config` exposes them as env vars
that operators can misconfigure; leaving them as unnamed literals obscures the reasoning. A
well-named constant with a JSDoc comment is the correct form for an engineering decision.

Secret material — API keys, tokens, signing secrets, credentials — must never appear in source
files, committed configuration files, or documentation. Secrets are sourced from environment
variables or a secrets manager at runtime. A `.env.example` file (or equivalent documented
enumeration) must list every required environment variable with a description of its purpose and
expected format. The application must fail at startup if any required variable is absent.

## Idempotence and Data Safety

Operations that write state must be safe to retry. Calling a write operation multiple times with the
same input must not produce duplicate records, trigger duplicate side effects, or corrupt existing
data. Design writes to be idempotent from the start; retrofitting idempotence into stateful
operations is difficult and error-prone.

Destructive operations — deletes, overwrites, truncations — must be explicitly guarded. Before
executing a destructive operation, validate that the preconditions are met and that the data being
affected is what was intended. Prefer soft deletes and versioned writes over hard deletes and
in-place overwrites wherever the domain allows. The ability to recover from an unintended operation
is worth the additional complexity.

Data loss prevention is an architectural concern, not an operational one. A design that makes data
loss possible is a defective design. Prefer append-only and versioned data models. Never overwrite a
record without preserving a recovery path. Treat the absence of a rollback mechanism as a risk, not
a simplification.

Validate preconditions for external state changes before initiating the operation, not after. An
operation that fails partway through because a precondition was not checked upfront can leave data
in an inconsistent state.

## Code Organization and Architecture

Every module has one clear responsibility, and its filename names that responsibility. A contributor
reading the directory listing must be able to predict what a module contains without opening it.

Modules must depend on interfaces, not concrete implementations. Concrete implementations are
composed and injected at the application's entry point. This is dependency inversion, and it is not
optional. A module that directly instantiates its dependencies cannot be tested in isolation, cannot
have its dependencies replaced without modification, and cannot be reasoned about without
understanding everything it depends on. Dependency injection through interfaces eliminates all three
problems.

When depending on a large external SDK (e.g. a Slack or GitHub client), prefer a narrow structural
interface that covers only the methods the module actually uses. This is a "facade type" — it
enables test substitution without tracking the full SDK surface. A broad type alias to the SDK class
(`type SlackClient = WebClient`) is acceptable only as a transitional step; the goal is always a
minimal structural interface that makes the module's real dependencies explicit and mockable.

Co-locate related concerns. A module and its type definitions belong in the same directory. Unit
tests for a pure module should be co-located with that module as `module.test.ts`. Integration and
contract tests — which by nature span multiple modules and cannot be attributed to a single source
file — live in `tests/integration/` and `tests/contract/` respectively. This structure is
intentional: co-location applies where the test has a single obvious owner; a separate tree applies
where it does not.

Circular dependencies between modules are prohibited. If two modules each require something from the
other, the shared concern belongs in a third module that both can import. Circular dependencies
create tight coupling that makes refactoring, testing, and understanding each module in isolation
impossible.

Keep files small. A file approaching 300 lines is a signal that it has taken on more than one
responsibility and should be split. Smaller files are faster to read, easier to review, and easier
to test.

Entry-point files — files named `index.ts` or equivalent — must only compose, configure, and export.
They must contain no business logic. The entry point is the wiring diagram; the modules it imports
are the components.

## Security

All external input is untrusted until proven otherwise. Input arriving from users, external APIs,
environment variables, files, and any other source outside the application's own logic must be
validated for shape, type, and range before it is used. The validation layer is the boundary;
nothing untrusted crosses it.

External content must be sanitized before it is rendered, stored, forwarded to another system, or
included in a query. Passing raw external input directly into a downstream operation — a database
query, a shell command, an HTML template — is among the most common and most serious classes of
security vulnerability.

Follow the principle of least privilege. A component must request only the permissions and access
scopes it genuinely requires to perform its function. Over-permissioned components expand the blast
radius of any compromise.

Secrets, credentials, private keys, and tokens must never be committed to version control. This rule
has no exceptions and no grace period. Pre-commit hooks and CI checks must be configured to detect
and block accidental secret commits. If a secret is committed, treat it as compromised immediately
and rotate it.

Dependencies must be kept current and audited for known vulnerabilities. A dependency with a
critical CVE is a blocker that must be addressed before new work proceeds, not a backlog item. The
attack surface of a dependency is the attack surface of this application.

Authentication and authorization checks belong at the boundary where a request enters the system.
Business logic must not be responsible for determining whether a caller is permitted to perform an
action. Scattering authorization checks throughout the codebase creates gaps.

## Accessibility

User-facing output — whether CLI messages, web interfaces, generated documents, or API error
responses — must be structured for accessibility from the first line of code. Retrofitting
accessibility is expensive and incomplete; it must be designed in.

Error messages and prompts must be specific, clear, and actionable. A message that tells the user
something went wrong without describing what or what to do about it is an accessibility failure.
Every person interacting with output from this software deserves enough information to understand
and respond to it.

Never rely solely on color, position, or visual appearance to convey meaning. Every visual signal
must be paired with a textual or structural equivalent — a label, an ARIA attribute, an icon with a
text alternative — so that the information is accessible to people who cannot perceive the visual
signal.

Any HTML generated or produced by this codebase must use semantic elements. Interactive elements
must be keyboard-navigable. Structure must communicate hierarchy and meaning, not just visual
arrangement.

Documentation, changelogs, error messages, and all other written output must use plain language.
Jargon, acronyms, and domain-specific shorthand exclude readers who are new to the project or the
domain. Prefer plain terms; define technical terms the first time they are used.

## Developer Experience

A new contributor must be able to clone the repository, install dependencies, and run the full test
suite to a green result without asking anyone for help. If that is not possible, it is a defect in
the project, not a gap in the contributor's knowledge.

IDE integration is a primary deliverable, not a side effect of good typing. Exported interfaces with
documented members, named functions, and specific types are what power autocomplete, hover
documentation, and go-to-definition. Every time a member is added to an interface without a JSDoc
comment, or a type is left as `any`, a contributor loses IDE assistance at every point where that
value is used. Treat IDE experience as something that is actively built and maintained.

Stack traces are a debugging tool. Named functions appear in stack traces with their assigned name;
anonymous functions do not. This is one of the reasons named arrow function declarations are
required. A stack trace that names every frame is dramatically more useful than one full of
`anonymous` entries.

Format-on-save and lint-on-commit must be configured, committed to the repository, and enforced in
CI. Style consistency must not depend on contributors remembering to run a formatter or on reviewers
catching style issues in code review. Machines are better at this than humans and should be
responsible for it.

Prefer descriptive identifiers. An abbreviation saves a few keystrokes at the moment of writing and
costs comprehension at every subsequent reading. Variables, functions, and types should be named for
what they represent, not for what they can be abbreviated to.

## Testing

Tests describe observable behavior, not implementation details. A test that breaks when internal
structure is reorganized but the behavior visible to callers remains unchanged is a fragile test
that impedes refactoring without providing safety. Test what the function or module does, not how it
does it.

Every test must read as a specification: given these inputs and this context, this outcome is
expected. A reader must be able to understand what is being verified from the test itself, without
reading the implementation. Tests are documentation; treat them as such.

Tests are the canonical specification of intended behavior. When behavior changes, the tests must
change to match. Tests that describe superseded behavior provide false confidence and cause
confusion.

Unit tests cover pure functions and isolated modules. Integration tests cover composed behavior at
the boundaries between subsystems. Both are necessary; neither substitutes for the other.

Dependency injection through interfaces is what makes unit testing tractable. When a module receives
its dependencies as injected interfaces, tests can substitute controlled implementations without
modifying the module under test or monkey-patching imported modules.

Tests must be deterministic. A test whose outcome depends on timing, network availability, execution
order, or any source of non-determinism is an unreliable test. Unreliable tests erode confidence in
the test suite. Fix or quarantine non-deterministic tests; do not tolerate them.

## Dependencies

Every dependency added to this project is a long-term commitment. Before adding a dependency,
evaluate: Is it actively maintained? Does its license permit our use? Has it had security
vulnerabilities, and were they addressed promptly? How large is its transitive dependency footprint?
What is the cost of removing it later? A dependency that cannot be justified on all of these
dimensions should not be added.

Prefer solutions available in the standard library or the language runtime before reaching for a
third-party package. A native solution has no license cost, no additional attack surface, and no
risk of abandonment.

Pin all dependency versions explicitly. Commit the lockfile to version control. Reproducible builds
are not possible without pinned, committed dependency versions, and reproducibility is essential for
debugging, security auditing, and reliable CI.

Distinguish runtime dependencies from development dependencies. Both categories must be minimized
independently. A development dependency that migrates into the runtime bundle increases attack
surface and deployment size without necessity.

## Documentation

Every exported symbol — every function, type, interface, constant, and class that crosses a module
boundary — must have a JSDoc comment. The JSDoc comment is not a formality; it is the mechanism by
which the IDE surfaces information to contributors at every point of use. A symbol without a JSDoc
comment is undocumented at every call site in the codebase.

Private module-level constants and helper functions that are non-trivial must also carry JSDoc.
"Non-trivial" means: the name alone does not fully explain the value or the reasoning behind it. A
constant whose value is a specific number, regex, or array of thresholds is non-trivial — the JSDoc
must explain what the value means and why that specific value was chosen. A simple re-export or a
one-liner that reads as plainly as its name does not require JSDoc.

Architecture Decision Records must be written for every significant structural or dependency choice.
An ADR documents the problem being solved, the options considered, and the reasoning behind the
chosen approach. The "why" behind a decision decays faster than the decision itself; record it at
the time it is made.

The README is the authoritative entry point for every contributor. It must describe what the project
does, how to set up a development environment, how to run tests, and how to contribute. A README
that is incomplete or out of date is a broken onboarding experience.

A CONTRIBUTING guide must describe the code review process, the commit message convention, branch
naming, and how the development environment is configured. Contributors must not need to ask
questions whose answers belong in a document.

Inline comments inside function bodies are a code smell. The urge to write a comment that labels or
explains a section of a function — "// validate input", "// build the request", "// handle the
response" — is a signal that the function is doing too much. Those sections are unnamed functions
waiting to be extracted. Extract them, name them, and document them with JSDoc. The name
communicates intent at every call site; the JSDoc surfaces in the IDE; and the logic becomes
independently testable. A well-named function eliminates the need for the comment entirely and
improves the codebase in every direction simultaneously.

The only inline comments that are not a smell are those that explain a genuine non-obviousness that
cannot be resolved by renaming or restructuring: a known quirk of an external API, a
counterintuitive edge case with a documented reason, or a reference to an external specification.
These are rare. When you find yourself reaching for a comment, first ask whether a better name or a
function extraction would make it unnecessary.

## Code Review

Pull requests must be small enough to review in one sitting. A pull request that touches dozens of
files across unrelated concerns is not reviewable in a meaningful way. Large changes must be
decomposed into a sequence of focused, independently-mergeable increments.

Commit messages explain the why, not the what. The diff already shows what changed. The commit
message must explain the motivation: what problem was being solved, what constraint was being
respected, or what decision was made and why. A commit message that merely restates the diff title
adds no information.

Reviewers check for adherence to these principles, behavioral correctness, completeness of error
handling, presence of tests that cover the changed behavior, and absence of security concerns.
Reviewers do not check for style issues that automated tooling is configured to catch and enforce.
Human review time is too valuable to spend on issues that machines handle better.

Every review comment must be actionable. It must propose a specific alternative, identify a concrete
problem, or ask a clarifying question. A comment that expresses a preference without a rationale or
a suggestion for improvement does not help the author.

Automated checks — type-checking, linting, formatting, and the full test suite — must pass before a
pull request is submitted for human review. A reviewer must not encounter issues that CI would have
caught. Reviewers have the right to return a pull request without review if automated checks have
not been run and passed.
