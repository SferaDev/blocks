import { init, parse } from 'es-module-lexer';
import url from 'url';

export type AvailableCDNs = 'skypack';

export type ResolveOptions = {
  priority?: Array<AvailableCDNs | ((key: string) => string)>;
  versions?: Record<string, string>;
  fetchImpl: FetchImpl;
};

export interface Dependency {
  name: string;
  url: string;
  main: string;
}

export type FetchImpl = (
  url: string,
  init?: { body?: string; headers?: Record<string, string>; method?: string }
) => Promise<{
  ok: boolean;
  text(): Promise<any>;
  url: string;
}>;

const isUrl = (value: string) => /^(http(s){0,1}:){0,1}\/\//.test(value);

const parseCDN: Record<AvailableCDNs, (key: string, version?: string) => string> = {
  skypack: (key, version) => {
    const versionTag = version ? `@${version}` : '';
    return `https://cdn.skypack.dev/${key}${versionTag}`;
  }
};

function resolveDependencyUrls(key: string, options: ResolveOptions): string[] {
  if (key.startsWith('/') || key.startsWith('file://') || key.startsWith('.')) return [];

  if (isUrl(key)) return [key];

  const priorities = options.priority ?? ['skypack'];
  const version = options.versions?.[key];

  return priorities.map((cdn) => {
    if (typeof cdn === 'string') return parseCDN[cdn](key, version);

    return cdn(key);
  });
}

async function resolveDependency(name: string, options: ResolveOptions): Promise<Dependency | null> {
  const urls = resolveDependencyUrls(name, options);
  if (urls.length === 0) return null;

  const { fetchImpl } = options;

  for await (const url of urls) {
    try {
      const response = await fetchImpl(url);
      const main = await response.text();

      return { name, url: response.url, main };
    } catch (error) {
      console.debug(`Error fetching ${name}`, error);
      continue;
    }
  }

  console.warn(`[rollup-plugin-import-cdn] Could not resolve dependency ${name}`);

  return null;
}

export async function getDependency(key: string, options: ResolveOptions) {
  const dependency = await resolveDependency(key, options);
  if (!dependency) return;

  await init;

  const [imports] = parse(dependency.main);

  let position = 0;

  return imports
    .map(({ s, e }) => {
      const string = dependency.main.slice(s, e);

      // We don't support dynamic imports on variables, ignore them
      const variable = dependency.main.slice(s - 1, e + 1);
      if (variable.startsWith('(') && variable.endsWith(')')) {
        return undefined;
      }

      return !isUrl(string) ? { string, start: s, end: e } : undefined;
    })
    .reduce((code, data) => {
      if (!data) return code;

      const resolvedUrl = url.resolve(dependency.url, data.string);

      const s = data.start + position;
      const e = data.end + position;
      const str = resolvedUrl.split('');
      const before = code.slice(0, s);
      const middle = code.slice(s, e);
      const after = code.slice(e);
      const lMiddle = middle.length;
      const lStr = str.length;
      position += lStr - lMiddle;
      return [...before, ...str, ...after];
    }, dependency.main.split(''))
    .join('');
}
