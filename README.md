# droneviz

First, install `yarn` using these commands:

```bash
nvm install stable
nvm use stable

corepack enable
yarn set version 4.1.1
yarn install
```

To build the project use turbo:

```bash
yarn turbo build
yarn turbo test
```

To run it with auto-refreshing use

```bash
yarn turbo dev
```

Turbo uses vite.

Alternatively, you can also run every command without turbo and only use vite:

```bash
yarn build
yarn test
yarn dev
yarn preview
```

## Update dependencies

Run this command to update all dependencies to their latest version:

```bash
yarn up "*" "@*/*"
```

## Vitest dashboard

Run

```bash
yarn vitest --ui
```

## Deployment

Use `gulp` similar to [this project](https://github.com/blheli-configurator/blheli-configurator/blob/master/gulpfile.js).

Alternative: Install `nginx`/`litespeed` server and serve the contents of the `dist` folder.

**Don't waste time on electron, vue and whatever... it's way too complicated and doesn't work properly.**

In future use [Turbopack](https://turbo.build/pack/docs).
