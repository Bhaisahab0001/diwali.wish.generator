import React, { useState } from 'react';
import { X, Copy, Check, Terminal, Shield, Database, Cloud, BookOpen, ExternalLink } from 'lucide-react';

interface CloudflareGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CloudflareGuideModal: React.FC<CloudflareGuideModalProps> = ({ isOpen, onClose }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyCode = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[88vh] overflow-y-auto p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-[0_25px_60px_rgba(0,0,0,0.9)] text-slate-200 space-y-6">
        {/* Modal Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
            <Cloud className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-display font-bold text-slate-100">
              Cloudflare Architecture & Deployment Guide
            </h3>
            <p className="text-xs text-slate-400">
              100% Free-Tier Cloudflare Workers + D1 SQLite + Cloudflare Pages
            </p>
          </div>
        </div>

        {/* Architecture Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase">
              <Database className="w-4 h-4" />
              <span>D1 SQLite Database</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Zero-latency distributed SQLite with ACID transactions and schema migrations.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <div className="flex items-center gap-2 text-purple-400 text-xs font-semibold uppercase">
              <Shield className="w-4 h-4" />
              <span>Web Crypto Security</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              PBKDF2-SHA256 (100k rounds), constant-time compare, server rate-limiting.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase">
              <Cloud className="w-4 h-4" />
              <span>Free Tier 100%</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              No MongoDB, no paid add-ons, 100k free requests/day on Cloudflare Workers.
            </p>
          </div>
        </div>

        {/* Step-by-Step Instructions */}
        <div className="space-y-5 text-xs sm:text-sm">
          {/* Step 1 */}
          <div className="space-y-2">
            <h4 className="font-semibold text-slate-100 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 text-xs flex items-center justify-center font-bold">
                1
              </span>
              <span>Install Wrangler & Authenticate Cloudflare</span>
            </h4>
            <p className="text-slate-400 text-xs pl-7">
              Login to your free Cloudflare account using the Cloudflare CLI:
            </p>
            <div className="ml-7 relative p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-amber-300">
              <code>npx wrangler login</code>
              <button
                type="button"
                onClick={() => copyCode('login', 'npx wrangler login')}
                className="absolute top-2 right-2 p-1 text-slate-400 hover:text-slate-200"
              >
                {copiedKey === 'login' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Step 2 */}
          <div className="space-y-2">
            <h4 className="font-semibold text-slate-100 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 text-xs flex items-center justify-center font-bold">
                2
              </span>
              <span>Create Your Production Cloudflare D1 Database</span>
            </h4>
            <p className="text-slate-400 text-xs pl-7">
              Run this command to create the D1 database and copy the generated <code>database_id</code> into <code>wrangler.jsonc</code>:
            </p>
            <div className="ml-7 relative p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-amber-300">
              <code>npx wrangler d1 create diwaliverse_secrets_db</code>
              <button
                type="button"
                onClick={() => copyCode('d1-create', 'npx wrangler d1 create diwaliverse_secrets_db')}
                className="absolute top-2 right-2 p-1 text-slate-400 hover:text-slate-200"
              >
                {copiedKey === 'd1-create' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Step 3 */}
          <div className="space-y-2">
            <h4 className="font-semibold text-slate-100 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 text-xs flex items-center justify-center font-bold">
                3
              </span>
              <span>Apply SQL Migrations (Local & Remote)</span>
            </h4>
            <p className="text-slate-400 text-xs pl-7">
              Initialize the schema tables (<code>owners</code>, <code>sessions</code>, <code>secret_messages</code>, <code>unlock_attempts</code>, <code>message_assets</code>):
            </p>
            <div className="ml-7 relative p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-amber-300">
              <code>npx wrangler d1 migrations apply DB --remote</code>
              <button
                type="button"
                onClick={() => copyCode('d1-migrate', 'npx wrangler d1 migrations apply DB --remote')}
                className="absolute top-2 right-2 p-1 text-slate-400 hover:text-slate-200"
              >
                {copiedKey === 'd1-migrate' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Step 4 */}
          <div className="space-y-2">
            <h4 className="font-semibold text-slate-100 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 text-xs flex items-center justify-center font-bold">
                4
              </span>
              <span>Build & Deploy Single-Page App with Cloudflare Workers</span>
            </h4>
            <div className="ml-7 relative p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-amber-300 space-y-1">
              <div>npm run build</div>
              <div>npx wrangler deploy</div>
              <button
                type="button"
                onClick={() => copyCode('deploy', 'npm run build && npx wrangler deploy')}
                className="absolute top-2 right-2 p-1 text-slate-400 hover:text-slate-200"
              >
                {copiedKey === 'deploy' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Step 5 */}
          <div className="space-y-2">
            <h4 className="font-semibold text-slate-100 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 text-xs flex items-center justify-center font-bold">
                5
              </span>
              <span>GitHub Continuous Deployment (Cloudflare Pages)</span>
            </h4>
            <p className="text-slate-400 text-xs pl-7">
              To deploy automatically on every Git commit:
              <br />1. Push this repository to GitHub.
              <br />2. Go to Cloudflare Dashboard &gt; Workers &amp; Pages &gt; Create Application &gt; Pages &gt; Connect to Git.
              <br />3. Build command: <code className="text-amber-300">npm run build</code>, Build output directory: <code className="text-amber-300">dist</code>.
              <br />4. Under Settings &gt; Functions &gt; D1 database bindings, add binding variable <code className="text-amber-300">DB</code> connected to <code className="text-amber-300">diwaliverse_secrets_db</code>.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Files in repo: <code className="text-amber-300">wrangler.jsonc</code>, <code className="text-amber-300">migrations/0001_initial.sql</code>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-950 bg-amber-400 hover:bg-amber-300 transition-colors"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
