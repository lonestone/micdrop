# 🧪 Development

### Development Commands

Build all packages

```bash
pnpm build
```

Run (watch) the client and server

```bash
pnpm dev:main
```

Run (watch) the basic example

```bash
pnpm dev:basic
```

Run (watch) the advanced demo, client and server together

```bash
pnpm dev:advanced
```

Run the React Native example, its server and the Metro bundler. Building the app
on a device or a simulator is a separate step, see
[its README](examples/react-native/README.md).

```bash
pnpm dev:react-native
```

Run (watch) the website and its documentation

```bash
pnpm dev:website
```

Run (watch) a specific package

```bash
pnpm --filter <package-name> dev
```

### Tests

`@micdrop/client` has a test suite that runs in Node, from the audio helpers up
to a whole call against a real `MicdropServer`. It covers the code both the
browser and React Native run.

```bash
pnpm --filter @micdrop/client test
```

### Publishing to npm

#### Prerequisites

1. Create an npm account at [npmjs.com](https://npmjs.com)
2. Log in to npm in your terminal:

```bash
npm login
```

3. If you're using a scoped package (@micdrop), you'll need to:
   - Create an organization on npm (if not already done)
   - Ensure you have the right permissions in the organization

#### Publishing Steps

1. Go to the package directory:

```bash
cd packages/client
```

2. Update version number:

```bash
npm version patch  # For bug fixes (0.0.x)
npm version minor  # For new features (0.x.0)
npm version major  # For breaking changes (x.0.0)
```

3. Publish the package:

```bash
npm publish
```
