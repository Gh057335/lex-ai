// Model registry. Centralises model-id choice so swapping models is a one-line
// change and never leaks into business logic.
export const MODELS = {
  chat: 'claude-sonnet-4-6',
  draft: 'claude-opus-4-7',
} as const;
