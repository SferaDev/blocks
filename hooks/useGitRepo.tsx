import './loadBuffer';

import {
  UseMutationOptions,
  UseMutationResult,
  UseQueryOptions,
  UseQueryResult,
  useMutation,
  useQuery
} from '@tanstack/react-query';
import { BFSRequire, configure } from 'browserfs';
import git, { CallbackFsClient, FsClient } from 'isomorphic-git';
import http from 'isomorphic-git/http/web';
import { createContext, useContext, useEffect, useState } from 'react';
import { Values } from './types';
import { readFile } from './fs';

const GitContext = createContext<GitContextState | null>(null);

type GitContextOptions = { corsProxy?: string };

type GitContextState = {
  fs: FsClient;
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

export const useGitRepoQuery = <Method extends GitMethod>(
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

export const useGitRepoMutation = <Method extends GitMethod>(
  method: Method,
  queryOptions?: UseMutationOptions<GitResult<Method>>
): UseMutationResult<GitResult<Method>, any, GitArgs<Method>> => {
  const context = useContext(GitContext);
  if (!context) {
    throw new Error('useGitRepo must be used within a GitRepoProvider');
  }

  const { fs, options } = context;

  return useMutation(
    async (args: GitArgs<Method>) => {
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

export function useFile(path: string, queryOptions?: UseQueryOptions<string>) {
  const context = useContext(GitContext);
  if (!context) {
    throw new Error('useFile must be used within a GitRepoProvider');
  }

  const { fs } = context;

  return useQuery(
    ['fs', 'readFile', path],
    async () => {
      try {
        return await readFile(fs, path);
      } catch (e) {
        return null;
      }
    },
    queryOptions as any
  );
}

export function useFetchOrCloneRepo(url: string, dir: string, sha: string) {
  const context = useContext(GitContext);
  if (!context) {
    throw new Error('useFetchOrCloneRepo must be used within a GitRepoProvider');
  }

  const { fs, options } = context;

  return useQuery(['git', 'fetchOrClone'], async () => {
    try {
      await git.listRemotes({ fs, dir });
    } catch (e) {
      await git.clone({ ...options, fs, http, dir, url });
    }

    const { fetchHead } = await git.fetch({
      ...options,
      fs,
      http,
      dir,
      ref: sha,
      depth: 1,
      singleBranch: true,
      tags: false
    });

    await git.checkout({ ...options, fs, dir, ref: fetchHead ?? sha, force: true });

    return await git.resolveRef({ fs, dir, ref: 'HEAD' });
  });
}
