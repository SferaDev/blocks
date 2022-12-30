import { FileBlockProps } from '@githubnext/blocks';
import { Box } from '@primer/react';
import styled from 'styled-components';
import { useBundler } from '../../utils/useBundler';
import { useFS, useFetchOrCloneRepo } from '../../utils/useGitRepo';
import './Block.css';

export function TestBlock(props: FileBlockProps) {
  const { context, originalContent } = props;
  const { owner, repo, sha } = context;

  const url = `https://github.com/${owner}/${repo}`;
  const dir = `/git/${owner}/${repo}`;

  const fs = useFS();
  const { isLoading: cloning } = useFetchOrCloneRepo(url, dir, sha);

  const { data } = useBundler({ fs, baseDir: dir, code: originalContent }, { enabled: !cloning });

  console.log({ cloning, data, originalContent });

  return <Container height="100%"></Container>;
}

const Container = styled(Box)`
  display: flex;
  flex-direction: column;
  width: 100%;
  position: absolute;
`;
