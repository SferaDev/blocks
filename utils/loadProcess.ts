// @ts-expect-error mocking some node apis
globalThis.process = { env: {}, argv: [], stdout: { write: () => {} }, platform: 'browser' };
// @ts-expect-error mocking some node apis
globalThis.global = globalThis;

export {};
