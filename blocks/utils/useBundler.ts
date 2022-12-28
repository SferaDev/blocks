import './loadProcess';

import { UseQueryOptions, useQuery } from '@tanstack/react-query';
import { Plugin, build, initialize } from 'esbuild-wasm';
import type { CallbackFsClient } from 'isomorphic-git';

type UseBundlerOptions = {
  fs: CallbackFsClient;
  code: string;
};

const virtualFs = ({ fs, files = {} }: { fs: CallbackFsClient; files?: Record<string, string> }): Plugin => ({
  name: 'virtual-fs',
  setup: (build) => {
    const vfs = new Map(Object.entries(files));

    // TODO: Add proper resolve logic
    build.onResolve({ filter: /.*/ }, (args) => {
      return { path: args.path };
    });

    // TODO: Add CDN loading, fully test relative imports in fs
    build.onLoad({ filter: /.*/ }, (args) => {
      const file = vfs.get(args.path) ?? fs.readFile(args.path);
      if (file) return { contents: file, loader: 'default' };
    });
  }
});

const entryPoint = '/__entry.ts';
let initialized = false;

export function useBundler({ fs, code }: UseBundlerOptions, queryOptions?: UseQueryOptions) {
  return useQuery(
    ['bundle', code],
    async () => {
      if (!initialized) {
        initialized = true;
        await initialize({
          worker: true,
          wasmURL: 'https://www.unpkg.com/esbuild-wasm@0.16.11/esbuild.wasm'
        });
      }

      const result = await build({
        entryPoints: [entryPoint],
        bundle: true,
        write: false,
        plugins: [virtualFs({ fs, files: { [entryPoint]: code } })]
      });

      return result.outputFiles[0].text;
    },
    queryOptions as any
  );
}
