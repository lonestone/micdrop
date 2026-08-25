# @micdrop/demo-client

A demo web application showcasing [Micdrop](../../README.md) browser-side capabilities using [@micdrop/client](../client/README.md) with React and TypeScript.

## Development

```bash
# Install dependencies
npm install

# Start development server with hot reload
npm run dev

# Build the project
npm run build

# Start the production server
npm run start
```

The development server runs on port 8080 by default.

➡️ http://localhost:8080

## Choosing providers

The selects at the top of the page pick the agent, the transcription and the
voice for the next call. The list comes from the [demo server](../demo-server),
which reports what it can actually run, so a provider whose key is missing or
whose model is not installed appears greyed out. The selection is kept in the
browser storage, so it survives a reload.

The checkboxes under them turn the agent prompts on and off for the next call:
ending the call on its own, waiting on an unfinished sentence, and skipping an
answer when the transcript carries no speech. Each one costs the model a tool
call on every turn, and a small model handles them less reliably than a hosted
one, so unticking them one at a time shows which one a model mishandles. Hover
a label for what it does.

## Dependencies

- React for UI components
- Vite for development and building
- TypeScript for type safety
- @micdrop/client for voice conversation handling

## License

MIT

## Author

[Godefroy de Compreignac](https://github.com/Godefroy)
