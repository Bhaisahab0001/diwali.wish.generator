/**
 * Cloudflare Pages Functions adapter for DiwaliVerse Secret Messages
 * Maps all /api/* routes to the unified worker request handler
 */
import workerHandler from '../../src/worker/index.ts';
import type { Env } from '../../src/worker/types.ts';

interface PagesContext {
  request: Request;
  env: Env;
  params: Record<string, string | string[]>;
  waitUntil: (promise: Promise<any>) => void;
  next: (input?: Request | string, init?: RequestInit) => Promise<Response>;
}

export const onRequest = async (context: PagesContext): Promise<Response> => {
  return workerHandler.fetch(context.request, context.env, {
    waitUntil: context.waitUntil,
    passThroughOnException: () => {},
  } as any);
};
