# droneviz

## Setup

First, install `yarn` using these commands:

```bash
nvm install stable
nvm use stable

corepack enable
yarn set version 4.1.1
yarn install
```

## Build and test

To build the project use turbo:

```bash
yarn turbo build
yarn turbo test
```

To run a live web application with auto-refreshing use

```bash
yarn turbo dev
```

Turbo is configured to use `vite`. To run vite commands only you can also use

```bash
yarn build
yarn test
```

In addition the following commands are supported to lint the project:

```bash
yarn lint
yarn depcheck
yarn format-check
```

## Update dependencies

Dependabot is set up to automatically update library dependencies. This can also be done manually using

```bash
yarn up "*" "@*/*"
```

## Test overview

To show the `vitest` dashboard run

```bash
yarn vitest --ui
```

Alternatively, the `vscode` configuration comes with the `Testing` tab fully set up from where tests can also be run.

## Deployment

VitePWA is used to create standalone apps. It is set up using a service worker and caching of all requests for offline usage (and to reduce API quota usage).
See [this page](https://wildermuth.com/2023/02/09/vite-plugin-for-progressive-web-apps/) for more information.

In future add [action-gh-release](https://github.com/softprops/action-gh-release) for release artifact creation.
