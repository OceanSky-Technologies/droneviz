# droneviz

First, install `yarn` using these commands:

```bash
corepack enable
yarn set version stable
yarn install
```

Then go to the `apps/droneviz` folder and build the webpack project:

```bash
yarn build
yarn start

# or
yarn start:built
```

To refresh automatically when a source code file changed run this command in a new terminal:

```bash
yarn watch
```

## Update dependencies

Run this command to update all dependencies to their latest version:

```bash
yarn up "*" "@*/*"
```
