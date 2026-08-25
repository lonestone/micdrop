# @micdrop/demo-server

A demo server implementation showcasing [Micdrop](../../README.md) server-side capabilities using [@micdrop/server](../server/README.md) with Fastify and TypeScript.

## Development

First, copy the example environment file and fill in your API keys:

```bash
cp .env.example .env
```

Then, install dependencies and start the development server with hot reload:

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

The server runs on port 8081 by default.

## Choosing providers

The agent, the transcription and the voice are picked from the selects at the
top of the [demo client](../demo-client), not from the code. The server
exposes what it can run on `GET /providers`, the client sends back what was
picked when a call starts, and a provider whose key is missing or whose binary
is not installed appears greyed out rather than failing mid-call.

Providers live in `src/providers`, one file per part of a call. Adding one means
adding one entry to the matching registry, and it shows up in the client on the
next page load.

The agent prompts `autoEndCall`, `autoSemanticTurn` and `autoIgnoreUserNoise`
are ticked in the client too, rather than set in `src/providers/agents.ts`. The
client sends them with the call and the server logs the ones left off.

## Running locally

The local providers need no API key and keep everything on the machine. Whisper
and Kokoro download their weights on first use, so the first call is slower than
the ones after it.

For the agent, install [Ollama](https://ollama.com) and pull a model:

```bash
brew services start ollama
ollama pull qwen3:4b-instruct
```

Pulling a model talks to the Ollama daemon, so the daemon has to be up first.
Running `ollama serve` works too, in a terminal of its own, since it holds the
one it runs in.

For a voice in another language than English, install Piper and download a voice
into `examples/demo-server/voices`, where the demo looks for them:

```bash
pip install piper-tts
mkdir -p voices && cd voices
BASE=https://huggingface.co/rhasspy/piper-voices/resolve/main/fr/fr_FR/siwis/medium
curl -LO $BASE/fr_FR-siwis-medium.onnx
curl -LO $BASE/fr_FR-siwis-medium.onnx.json
```

Every voice of the [samples page](https://rhasspy.github.io/piper-samples/) is
downloaded the same way, with its own path in the repository.

The [local models guide](https://micdrop.dev/docs/ai-integration/local-models)
covers the models worth picking and what they cost in latency and memory.

## Dependencies

- Fastify for server implementation
- TypeScript for type safety
- @micdrop/server for AI integration

## License

MIT

## Author

[Godefroy de Compreignac](https://github.com/Godefroy)
