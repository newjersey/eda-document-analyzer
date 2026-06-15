# Welcome!
This repository contains issue templates you can use on your ResX Projects.

## Issue Templates

Currently, we have issue templates for the following:
* Task
* User Story
* Bug
* Feature

You can clone this repo to create your own `[project]-pm` repository, with these templates as a starting point. Feel free to modify for your project as needed.

If you are interested in adding an additional template for everyone's use, or have suggestions for improving the existing templates, reach out to Amani or feel free to submit a PR!

## Development

This repository uses [husky](https://typicode.github.io/husky/) to run git hook scripts. Currently this runs formatting using the [lint-staged](https://github.com/lint-staged/lint-staged) tool on the pre-commit hook.

## CI/CD

This project runs the following processes via Github Actions:

### Pull-Requests

- File formatting via [Biome](https://biomejs.dev/)
- Unit Tests via [Vitest](https://vitest.dev/)
- End-to-End Tests via [Playwright](https://playwright.dev/)
