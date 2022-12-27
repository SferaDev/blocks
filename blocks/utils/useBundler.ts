import './loadProcess';

import { rollup, Plugin } from '@rollup/browser';
import { UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { CallbackFsClient } from 'isomorphic-git';
import { importCdn } from 'rollup-plugin-import-cdn';
import { build, initialize } from 'esbuild-wasm';

const SEARCH_EXTENSIONS = ['/index.tsx', '/index.ts', '/index.js', '.tsx', '.ts', '.json', '.js'];

function searchFile(vfs: Map<string, string>, filepath: string, extensions: string[]) {
  for (const ext of ['', ...extensions]) {
    if (vfs.has(filepath + ext)) {
      return filepath + ext;
    }
  }
}

const isFileSchema = (id: string) => id.startsWith('file://') || id.startsWith('/');

const isRelativePath = (id: string) => stripSchema(id).startsWith('.');
const stripSchema = (id: string) => id.replace(/^file\\:(\/\/)?/, '');

const fileSystem = ({
  fs,
  files,
  extensions = SEARCH_EXTENSIONS
}: {
  fs: CallbackFsClient;
  files: Record<string, string>;
  extensions?: string[];
}) => {
  const vfs = new Map(Object.entries(files));

  return {
    name: 'virtual-fs',
    resolveId(id: string, importer: string | null) {
      const normalized = stripSchema(id);

      // entry point
      if (isFileSchema(id) && importer == null) {
        return searchFile(vfs, normalized, extensions);
      }

      // relative filepath
      if (importer && isFileSchema(importer) && isRelativePath(id)) {
        const fullpath = id;
        const reslovedWithExt = searchFile(vfs, fullpath, extensions);
        if (reslovedWithExt) return reslovedWithExt;
        console.warn('[rollup-plugin-virtual-fs] can not resolve id: ' + fullpath);
      }
    },
    load(id: string) {
      const real = stripSchema(id);
      const ret = vfs.get(real);
      if (ret) return ret;

      // load file from fs
      const file = fs.readFile(real);
      if (file) return file;
    }
  };
};

type UseBundlerOptions = {
  fs: CallbackFsClient;
  code: string;
};

let myPlugin = {
  name: 'example',
  setup(build: any) {
    build.onResolve({ filter: /.*/ }, (args: any) => {
      // here i just replace the prefix './' with '/',
      // but normally you have to implement the resolver correctly
      return { path: '/' + args.path.replace(/^\.\//, '') };
    });
    build.onLoad({ filter: /.*/ }, (args: any) => {
      return { contents: 'console.log("M")', loader: 'default' };
    });
  }
};

let initialized = false;

export function useBundler({ fs, code }: UseBundlerOptions, queryOptions?: UseQueryOptions) {
  return useQuery(
    ['bundle', code],
    async () => {
      const input = 'index.ts';

      /**const bundle = await rollup({
        input,
        plugins: [
          importCdn({ fetchImpl: fetch }),
          fileSystem({ fs, files: { [input]: code } }),
          typescript()
        ] as Plugin[]
      });

      const { output } = await bundle.generate({ format: 'esm' });

      return output;**/

      if (!initialized) {
        initialized = true;
        await initialize({
          worker: true,
          wasmURL: 'https://www.unpkg.com/esbuild-wasm@0.16.11/esbuild.wasm'
        });
      }

      const result = await build({
        entryPoints: [input],
        bundle: true,
        write: false,
        plugins: [myPlugin]
      });

      return result.outputFiles[0].text;
    },
    queryOptions as any
  );
}
