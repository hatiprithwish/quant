import { useState } from "react";
import { useGlobalStore } from "@/store/globalState";

export default function SettingsPage() {
  const { apiKey } = useGlobalStore();
  const [copied, setCopied] = useState(false);

  function copyKey() {
    if (!apiKey) return;
    navigator.clipboard.writeText(apiKey).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Settings</h2>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Claude Desktop API Key
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            Add this key to your Claude Desktop MCP configuration to log data
            by narrating your day.
          </p>
        </div>

        {apiKey ? (
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-xs font-mono text-gray-800 dark:text-gray-200 break-all">
              {apiKey}
            </code>
            <button
              onClick={copyKey}
              className="flex-shrink-0 px-3 py-2 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        ) : (
          <div className="text-sm text-gray-400 dark:text-gray-500">Loading API key…</div>
        )}

        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-xs text-gray-600 dark:text-gray-400 space-y-2">
          <p className="font-medium text-gray-700 dark:text-gray-300">Claude Desktop config snippet:</p>
          <pre className="overflow-x-auto text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{`{
  "mcpServers": {
    "life-tracker": {
      "url": "${import.meta.env.VITE_API_URL}/mcp",
      "headers": {
        "Authorization": "Bearer ${apiKey ?? "<your-api-key>"}"
      }
    }
  }
}`}</pre>
        </div>
      </div>
    </div>
  );
}
