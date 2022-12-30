import './loadProcess';

import { UseQueryOptions, useQuery } from '@tanstack/react-query';
import { Plugin, build, initialize } from 'esbuild-wasm';
import { Path } from './path';
import { FS } from './fs';

import packageJson from '../../package.json';

type UseBundlerOptions = {
  fs: FS;
  code: string;
  baseDir?: string;
};

const virtualFs = ({
  fs,
  baseDir = '/',
  files = {}
}: {
  fs: FS;
  baseDir?: string;
  files?: Record<string, string>;
}): Plugin => ({
  name: 'virtual-fs',
  setup: (build) => {
    console.log('setup', { baseDir, files });
    const vfs = new Map(
      Object.entries(files).map(([path, contents]) => [normalizeName(Path.join(baseDir, path)), contents])
    );

    build.onResolve({ filter: /.*/ }, (args) => {
      console.log('onResolve', args);

      switch (args.kind) {
        case 'entry-point': {
          const path = Path.join(baseDir, normalizeName(entryPoint));

          return { path };
        }
        case 'import-statement': {
          const dirname = Path.dirname(args.importer);
          const path = Path.join(dirname, args.path);

          return { path };
        }
      }

      throw new Error(`Unknown resolve kind: ${args.kind}`);
    });

    // TODO: Add CDN loading, fully test relative imports in fs
    build.onLoad({ filter: /.*/ }, async (args) => {
      console.log('onLoad', args);

      const extensions = Path.extname(args.path) ? [Path.extname(args.path)] : ['.ts', '.tsx', '.js', '.jsx'];

      for (const ext of extensions) {
        const absPathWithExt = stripExt(args.path) + ext;
        const loader = getLoader(ext);

        try {
          const file = vfs.get(absPathWithExt) ?? (await readFile(fs, absPathWithExt));
          if (file) return { contents: file, loader };
        } catch (e) {}
      }
    });
  }
});

function readFile(fs: FS, path: string) {
  return new Promise<string>((resolve, reject) => {
    // @ts-ignore
    fs.readFile(path, (err, data) => {
      if (err) reject(err);
      else resolve(data.toString());
    });
  });
}

const getLoader = (ext: string) =>
  ext === '.ts' ? 'ts' : ext === '.tsx' ? 'tsx' : ext === '.js' ? 'js' : ext === '.jsx' ? 'jsx' : 'default';

function normalizeName(path: string) {
  return '/' + path.replace(/^[\/]*/g, '');
}

function stripExt(path: string) {
  const i = path.lastIndexOf('.');
  return i !== -1 ? path.slice(0, i) : path;
}

const entryPoint = '__entry.ts';
let initialized = false;

export function useBundler({ fs, baseDir, code }: UseBundlerOptions, queryOptions?: UseQueryOptions) {
  return useQuery(
    ['bundle', code],
    async () => {
      if (!initialized) {
        initialized = true;

        const wasmVersion = packageJson.dependencies['esbuild-wasm'];

        await initialize({
          worker: true,
          wasmURL: `https://www.unpkg.com/esbuild-wasm@${wasmVersion}/esbuild.wasm`
        });
      }

      const result = await build({
        entryPoints: [entryPoint],
        bundle: true,
        write: false,
        plugins: [virtualFs({ fs, baseDir, files: { [entryPoint]: code } })]
      });

      return result.outputFiles[0].text;
    },
    queryOptions as any
  );
}
