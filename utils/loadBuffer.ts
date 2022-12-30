import { Buffer as BufferPolyfill } from 'buffer';

declare global {
  var Buffer: typeof BufferPolyfill;
}

globalThis.Buffer = BufferPolyfill;
