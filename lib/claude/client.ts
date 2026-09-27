import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import { assertEnv } from '@/lib/utils/assertEnv';

let _client: Anthropic | undefined;

export function getClaudeClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic({ apiKey: assertEnv('ANTHROPIC_API_KEY') });
  }
  return _client;
}
