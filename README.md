# droneviz

## Setup

Clone this repository and update the [mavlink-ts](https://github.com/OceanSky-Technologies/mavlink-ts) submodule:

```bash
git submodule update --init --recursive
```

Use [nvm](https://github.com/nvm-sh/nvm) to install the latest `node` LTS version:

```bash
# Linux:
nvm install --lts
nvm use --lts

# Windows:
nvm install lts
nvm use lts
```

Also install [pnpm](https://pnpm.io/installation) or [npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm).
Then run

```bash
pnpm install
```

Also install playwright:

```bash
pnpm exec playwright install
```

## Build and test

To build the project for production with `vite` use:

```bash
pnpm build
```

Run tests with:

```bash
pnpm test
```

In addition the following commands are supported to lint the project:

```bash
pnpm lint
pnpm depcheck
pnpm format-check
```

## Update dependencies

Dependabot is set up to automatically update library dependencies. This can also be done manually using

```bash
pnpm up "*" "@*/*"
```

## Test overview

To show the `vitest` dashboard run

```bash
pnpm vitest --ui
```

Alternatively, the `vscode` configuration comes with the `Testing` tab fully set up from where tests can also be run.

## Deployment

VitePWA is used to create standalone apps. It is set up using a service worker and caching of all requests for offline usage (and to reduce API quota usage).
See [this page](https://wildermuth.com/2023/02/09/vite-plugin-for-progressive-web-apps/) for more information.

In addition, [tauri](https://tauri.app/) is used to create cross-platform bundles with installers.

In future add [action-gh-release](https://github.com/softprops/action-gh-release) for release artifact creation.

## MAVLINK communication

The [MAVSDK-JavaScript](https://github.com/mavlink/MAVSDK-JavaScript) library is not used because it's using an architecture that's very difficult to
ship with releases to customers. It's based on envoy and mavsdk-server and requires `podman` running aside to host envoy and mavsdk-server.
Also this library is highly incomplete and therefore not a long-term solution.
