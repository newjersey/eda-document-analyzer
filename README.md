# Document Analyzer Web Application

This repository is a web application currently used for testing and demonstration of the Document Analyzer project and [Document Validation API](https://github.com/newjersey/document-validation-api) (internal). The application allows users to upload documents and get feedback from the API on how well their document adheres to formatting and form-validation expectations.

## Contributions

Public contributions are welcome! Please see our [contribution guidelines](./CONTRIBUTING.md) for details on how best to contribute code.

## Bug Reporting and Security Disclosures

We welcome bugs and responsible disclosures. Please see our [security guidelines](./SECURITY.md) for details.

## Tech Stack
This is a [TypeScript](https://www.typescriptlang.org/)- and [Next.js](https://nextjs.org/)-based full-stack web application. It uses [Tailwind](https://tailwindcss.com/) for CSS styling. Additional dependencies can be found in the [`package.json`](./package.json) file.

## Development

### Installation

Download the repository and run `npm i` to install dependencies.

### Local Development

Run `npm run dev` to build and run the application in development mode.

### Testing

Run `npm run test` to run unit tests with [Vitest](https://vitest.dev/). When running this process, Vitest uses a 'watch' process that automatically reruns relevant tests when a file is saved.

### Coding Agents

Coding agents and LLMs should read the development principles in the [`AGENTS.md`](./AGENTS.md) file for coding guidelines for this project.

### Git Hooks

This repository uses [husky](https://typicode.github.io/husky/) to run git hook scripts. Currently this runs formatting using the [lint-staged](https://github.com/lint-staged/lint-staged) tool on the pre-commit hook, which runs [Biome](https://biomejs.dev/) to performing linting and formatting checks.

## CI/CD

This project runs the following processes via Github Actions:

### Pull-Requests

- File formatting and linting via [Biome](https://biomejs.dev/)
- Unit Tests via [Vitest](https://vitest.dev/)
- End-to-End Tests via [Playwright](https://playwright.dev/)

### Dependency Management

- Dependency updates are handling via [Renovate](https://docs.renovatebot.com/)
