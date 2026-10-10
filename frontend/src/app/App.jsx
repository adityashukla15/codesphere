
import "./App.css";
import { Editor } from "@monaco-editor/react";
import { MonacoBinding } from "y-monaco";
import { useRef, useMemo, useState, useEffect } from "react";
import * as Y from "yjs";
import { SocketIOProvider } from "y-socket.io";

function App() {
  const editorRef = useRef(null);
  const bindingRef = useRef(null);
  const providerRef = useRef(null);

  const [username, setUsername] = useState(
    () => new URLSearchParams(window.location.search).get("username")?.trim() || ""
  );
  const [users, setUsers] = useState([]);

  const ydoc = useMemo(() => new Y.Doc(), []);
  const yText = useMemo(() => ydoc.getText("monaco"), [ydoc]);

  const handleMount = (editor) => {
    editorRef.current = editor;

    const model = editor.getModel();
    if (!model) return;

    bindingRef.current?.destroy();

    bindingRef.current = new MonacoBinding(
      yText,
      model,
      new Set([editor]),
      providerRef.current?.awareness
    );
  };

  const handleJoin = (e) => {
    e.preventDefault();

    const formUsername = new FormData(e.currentTarget)
      .get("username")
      ?.toString()
      .trim();

    if (!formUsername) return;

    const params = new URLSearchParams(window.location.search);
    params.set("username", formUsername);

    window.history.pushState(
      {},
      "",
      `${window.location.pathname}?${params.toString()}`
    );

    setUsername(formUsername);
  };

  useEffect(() => {
    if (!username) return;

    const provider = new SocketIOProvider("/", "monaco", ydoc, {
      autoConnect: true,
    });

    providerRef.current = provider;
    provider.awareness.setLocalStateField("user", { username });

    const updateUsers = () => {
      const states = Array.from(provider.awareness.getStates().values());

      const activeUsers = states
        .filter((state) => state.user?.username)
        .map((state) => state.user);

      setUsers(activeUsers);
    };

    provider.awareness.on("change", updateUsers);
    updateUsers();

    const handleBeforeUnload = () => {
      provider.awareness.setLocalStateField("user", null);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      provider.awareness.off("change", updateUsers);
      window.removeEventListener("beforeunload", handleBeforeUnload);

      bindingRef.current?.destroy();
      bindingRef.current = null;

      provider.awareness.setLocalStateField("user", null);
      provider.disconnect();

      if (providerRef.current === provider) {
        providerRef.current = null;
      }

      setUsers([]);
    };
  }, [username, ydoc]);

  if (!username) {
    return (
      <main className="min-h-screen bg-[#090d18] flex items-center justify-center p-5 text-white">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#111827] p-8 shadow-2xl">
          <div className="mb-7 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-600 text-2xl font-bold">
              {"</>"}
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                CodeTogether
              </h1>
              <p className="text-sm text-gray-400">
                Code. Collaborate. Create.
              </p>
            </div>
          </div>

          <h2 className="mb-2 text-xl font-semibold">Welcome, developer!</h2>
          <p className="mb-6 text-sm leading-6 text-gray-400">
            Enter your username to join the collaborative coding workspace.
          </p>

          <form onSubmit={handleJoin} className="flex flex-col gap-4">
            <label htmlFor="username" className="text-sm font-medium text-gray-300">
              Your username
            </label>

            <input
              id="username"
              type="text"
              placeholder="e.g. aditya_dev"
              className="rounded-xl border border-white/10 bg-[#090d18] px-4 py-3 text-white outline-none transition placeholder:text-gray-600 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
              name="username"
              maxLength={30}
              autoComplete="nickname"
              required
            />

            <button
              type="submit"
              className="rounded-xl bg-violet-600 px-4 py-3 font-semibold transition hover:bg-violet-500 active:scale-[0.98]"
            >
              Enter Workspace →
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-gray-500">
            Powered by React, Monaco Editor &amp; Yjs
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-[#090d18] p-3 text-white sm:p-4">
      {/* Top navigation */}
      <header className="mb-3 flex shrink-0 items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#111827] px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-600 font-bold">
            {"</>"}
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold tracking-tight">
              CodeTogether
            </h1>
            <p className="text-xs text-gray-400">Collaborative workspace</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-400">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <span className="hidden sm:inline">Workspace</span>
        </div>
      </header>

      {/* Main workspace */}
      <div className="flex min-h-0 flex-1 flex-col gap-3 md:flex-row">
        <aside className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-white/10 bg-[#111827] md:w-64 md:shrink-0">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
            <div>
              <h2 className="text-sm font-semibold">Collaborators</h2>
              <p className="mt-1 text-xs text-gray-500">
                People in this room
              </p>
            </div>
            <span className="rounded-lg bg-violet-500/15 px-2.5 py-1 text-xs font-semibold text-violet-300">
              {users.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {users.length === 0 ? (
              <p className="px-2 py-4 text-sm text-gray-500">
                Waiting for collaborators...
              </p>
            ) : (
              <ul className="space-y-2">
                {users.map((user, index) => (
                  <li
                    key={`${user.username}-${index}`}
                    className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-3 transition hover:bg-white/[0.06]"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-sm font-bold uppercase">
                      {user.username.charAt(0)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {user.username}
                      </p>
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        Active
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border-t border-white/10 p-3">
            <div className="flex items-center gap-3 rounded-xl bg-white/[0.03] p-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-700 text-sm font-bold uppercase">
                {username.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{username}</p>
                <p className="text-xs text-gray-500">Your profile</p>
              </div>
            </div>
          </div>
        </aside>

        <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-white/10 bg-[#111827]">
          {/* Editor toolbar */}
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-[#151c2b] px-4 py-3">
            <div className="flex min-w-0 items-center gap-2">
              <span className="text-base">JS</span>
              <span className="truncate text-sm font-medium text-gray-200">
                main.js
              </span>
              <span className="hidden rounded-md bg-white/5 px-2 py-1 text-[10px] text-gray-400 sm:inline">
                JAVASCRIPT
              </span>
            </div>

            <div className="flex shrink-0 items-center gap-2 text-xs text-gray-400">
              <span className="h-2 w-2 rounded-full bg-violet-400" />
              Yjs
            </div>
          </div>

          {/* Monaco editor */}
          <div className="min-h-0 flex-1">
            <Editor
              height="100%"
              defaultLanguage="javascript"
              theme="vs-dark"
              onMount={handleMount}
              options={{
                fontSize: 14,
                fontFamily: "'Fira Code', Consolas, monospace",
                fontLigatures: true,
                minimap: { enabled: false },
                padding: { top: 16, bottom: 16 },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                wordWrap: "on",
                lineNumbers: "on",
                renderLineHighlight: "all",
                smoothScrolling: true,
                cursorBlinking: "smooth",
                bracketPairColorization: { enabled: true },
              }}
            />
          </div>

          {/* Status bar */}
          <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-white/10 bg-[#151c2b] px-4 py-2 text-[11px] text-gray-400">
            <span className="truncate">JavaScript · UTF-8</span>
            <span className="shrink-0">Collaborative Editor</span>
          </footer>
        </section>
      </div>
    </main>
  );
}

export default App;
