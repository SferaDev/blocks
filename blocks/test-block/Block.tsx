import { FileBlockProps } from '@githubnext/blocks';
import { Box } from '@primer/react';
import styled from 'styled-components';
import './Block.css';
import { useGitRepo } from '../utils/useGitRepo';

export function TestBlock(props: FileBlockProps) {
  const { context, originalContent } = props;
  const { owner, repo, path, sha } = context;
  const url = `https://github.com/${owner}/${repo}`;

  const { isLoading: cloning } = useGitRepo('clone', { url, dir: `/git/${owner}/${repo}` });

  return <Container height="100%"></Container>;
}

const Container = styled(Box)`
  display: flex;
  flex-direction: column;
  width: 100%;
  position: absolute;
`;
