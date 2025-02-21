# 🧪 Development

### Development Commands

```bash
# Start all development servers
npm run dev

# Build all packages
npm run build

# Type-check all packages
npm run typecheck
```

### Package-specific Development

Each package can be developed independently:

```bash
# Client development
cd packages/client
npm run dev

# Server development
cd packages/server
npm run dev

# Demo client
cd packages/demo-client
npm run dev

# Demo server
cd packages/demo-server
npm run dev
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
