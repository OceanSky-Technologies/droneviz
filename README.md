# droneviz

Youtube demo:

[![demo video](http://img.youtube.com/vi/9HVz24XpJFk/0.jpg)](https://www.youtube.com/watch?v=9HVz24XpJFk)

## Setup

Use [nvm](https://github.com/nvm-sh/nvm) to install the latest `node` LTS version:

```bash
# Linux:
nvm install --lts
nvm use --lts

# Windows:
nvm install lts
nvm use lts
```

Also install [pnpm](https://pnpm.io/installation).

Then install all dependencies with

```bash
pnpm install
```

## Build and test

Dev mode:

```bash
pnpm dev # browser-based
pnpm tauri dev # with tauri window
```

Production build:

```bash
pnpm build # browser-based
pnpm tauri build # with tauri window
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

Icons: Use Material icons from <https://icon-sets.iconify.design/>.

`mavproxy.exe --out=udp:127.0.0.1:14550`

## Reference system

GPS altitude (Mavlink's `alt`) = MSL = Geoid
Cesium (terrain) = WGS84 ellipsoid (Mavlink's `alt_ellipsoid`)

Cesium (3D tiles) is also according to WGS84 but the values differ compared to cesium and Mavlink! Requires compensating the difference.

Cesium to MSL / Geoid:
`egm96.ellipsoidToEgm96()`

MSL / Geoid to Cesium:
`egm96.egm96ToEllipsoid()`

https://support.virtual-surveyor.com/support/solutions/articles/1000261349-the-difference-between-ellipsoidal-geoid-and-orthometric-elevations-
