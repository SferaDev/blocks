import { FileBlockProps } from '@githubnext/blocks';
import { Box } from '@primer/react';
import styled from 'styled-components';
import './Block.css';
import { useFS, useGitRepo } from '../utils/useGitRepo';
import { useBundler } from '../utils/useBundler';

export function TestBlock(props: FileBlockProps) {
  const { context, originalContent } = props;
  const { owner, repo, path, sha } = context;

  const url = `https://github.com/${owner}/${repo}`;
  const dir = `/git/${owner}/${repo}`;

  const fs = useFS();
  const { isLoading: cloning } = useGitRepo('clone', { url, dir, singleBranch: true, depth: 1, ref: sha });

  const { data } = useBundler({ fs, code: originalContent });

  console.log({ cloning, data, originalContent });

  return <Container height="100%"></Container>;
}

const Container = styled(Box)`
  display: flex;
  flex-direction: column;
  width: 100%;
  position: absolute;
`;
