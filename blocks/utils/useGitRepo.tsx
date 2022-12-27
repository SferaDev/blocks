import './loadBuffer';

import { UseQueryOptions, UseQueryResult, useQuery } from '@tanstack/react-query';
import { BFSRequire, configure } from 'browserfs';
import git, { CallbackFsClient } from 'isomorphic-git';
import http from 'isomorphic-git/http/web';
import { createContext, useContext, useEffect, useState } from 'react';
import { Values } from './types';

const GitContext = createContext<GitContextState | null>(null);

type GitContextOptions = { corsProxy?: string };

type GitContextState = {
  fs: CallbackFsClient;
  options?: GitContextOptions;
};

type GitMethod = Values<{
  [K in keyof typeof git]: typeof git[K] extends (args: any) => Promise<any> ? K : never;
}>;

type GitArgs<Method extends GitMethod> = typeof git[Method] extends (args: infer Args) => Promise<any>
  ? Omit<Args, 'fs' | 'http'>
  : never;

type GitResult<Method extends GitMethod> = typeof git[Method] extends (args: any) => Promise<infer Result>
  ? Result extends void
    ? null
    : Result
  : never;

export const useGitRepo = <Method extends GitMethod>(
  method: Method,
  args: GitArgs<Method>,
  queryOptions?: UseQueryOptions<GitResult<Method>>
): UseQueryResult<GitResult<Method>> => {
  const context = useContext(GitContext);
  if (!context) {
    throw new Error('useGitRepo must be used within a GitRepoProvider');
  }

  const { fs, options } = context;

  return useQuery(
    ['git', method, args],
    async () => {
      const result = await git[method]({ ...options, ...args, fs, http } as any);

      return result ?? null;
    },
    {
      enabled: !!fs,
      ...(queryOptions as any)
    }
  );
};

export const GitRepoProvider = ({ children, ...options }: { children: React.ReactNode } & GitContextOptions) => {
  const [fs, setFs] = useState<CallbackFsClient>();

  useEffect(() => {
    configure({ fs: 'IndexedDB', options: {} }, (e) => {
      if (e) throw e;
      setFs(BFSRequire('fs'));
    });
  }, []);

  if (!fs) return null;

  return <GitContext.Provider value={{ fs, options }}>{children}</GitContext.Provider>;
};

export function useFS() {
  const context = useContext(GitContext);
  if (!context) {
    throw new Error('useFS must be used within a GitRepoProvider');
  }

  return context.fs;
}
