/**
 * Shared code snippets for the MCPs Explained post. Pre-rendered through
 * `<CodeBlock>` in `page.tsx` (Shiki, dual-theme) and threaded into widgets
 * via `codeSlot` props (RSC pattern — keeps client bundles small).
 */

/** §0 — the article's opening hook. The canonical `initialize` request. */
export const INITIALIZE_REQUEST_SNIPPET = `// Client → Server, on every new MCP session
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "protocolVersion": "2025-06-18",
    "capabilities": {
      "roots": { "listChanged": true },
      "sampling": {},
      "elicitation": {}
    },
    "clientInfo": {
      "name": "ExampleClient",
      "version": "1.0.0"
    }
  }
}`;

/** §3 — the `initialize` response. */
export const INITIALIZE_RESPONSE_SNIPPET = `// Server → Client, in reply
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "protocolVersion": "2025-06-18",
    "capabilities": {
      "tools": { "listChanged": true },
      "resources": { "subscribe": true, "listChanged": true },
      "prompts": { "listChanged": true },
      "logging": {}
    },
    "serverInfo": {
      "name": "FilesystemServer",
      "version": "0.4.2"
    },
    "instructions": "Files are exposed under the configured roots."
  }
}`;

/** §3 — the fire-and-forget `initialized` notification. */
export const INITIALIZED_NOTIFICATION_SNIPPET = `// Client → Server, no id, no response
{
  "jsonrpc": "2.0",
  "method": "notifications/initialized"
}`;

/** §6 — same `initialize` over stdio (newline-delimited). */
export const TRANSPORT_STDIO_SNIPPET = `# Server launched as a subprocess; one JSON message per line.
# stdin  = client → server   ·   stdout = server → client
# stderr = server logs (free-form, never the protocol)

# Client writes (one line, no embedded newlines):
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"Cli","version":"1.0.0"}}}

# Server replies (one line back on stdout):
{"jsonrpc":"2.0","id":1,"result":{"protocolVersion":"2025-06-18","capabilities":{"tools":{}},"serverInfo":{"name":"fs","version":"0.4.2"}}}

# Client confirms (notification — no id, no response expected):
{"jsonrpc":"2.0","method":"notifications/initialized"}`;

/** §6 — same `initialize` over Streamable HTTP. */
export const TRANSPORT_HTTP_SNIPPET = `# One endpoint, both directions multiplexed.
# Header set on every post-init request (added 2025-06-18):
#   MCP-Protocol-Version: 2025-06-18

POST /mcp HTTP/1.1
Host: example.com
Content-Type: application/json
Accept: application/json, text/event-stream

{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"WebClient","version":"1.0.0"}}}

# Server response, with a session id assigned by the server:
HTTP/1.1 200 OK
Mcp-Session-Id: 1868a90c-f7b6-4a6d-9c55-7c2a8e08e4b1
Content-Type: application/json

{"jsonrpc":"2.0","id":1,"result":{"protocolVersion":"2025-06-18","capabilities":{"tools":{}},"serverInfo":{"name":"fs","version":"0.4.2"}}}

# All later requests echo the session id; lose it, get a 404.`;
