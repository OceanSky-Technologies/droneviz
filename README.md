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

## Build and test

To build the project for production with `vite` use:

```bash
pnpm build
```

Run tests with:

```bash
pnpm test
pnpm test-e2e
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
pnpm up
```

For tauri dependencies run

```bash
cd src-tauri
cargo update
```

## Test overview

To show the `vitest` dashboard run

```bash
pnpm vitest --ui
```

Alternatively, the `vscode` configuration comes with the `Testing` tab fully set up from where tests can also be run.

## Development

Icons: Use svgs (material outline rounded) from <https://icones.js.org/collection/material-symbols>.

`mavproxy.exe --out=udp:127.0.0.1:14550`
