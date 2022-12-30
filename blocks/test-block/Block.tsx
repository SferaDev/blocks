import { FileBlockProps } from '@githubnext/blocks';
import { Box } from '@primer/react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import styled from 'styled-components';
import './Block.css';
import { useFetchOrCloneRepo, useFile } from '../../utils/useGitRepo';

export function TestBlock(props: FileBlockProps) {
  const {
    context: { owner, repo, sha, path }
  } = props;

  const url = `https://github.com/${owner}/${repo}`;
  const dir = `/git/${owner}/${repo}`;

  const { isLoading } = useFetchOrCloneRepo(url, dir, sha);
  const { data } = useFile(`${dir}/${path}`, { enabled: !isLoading });

  console.log('data', data, `${dir}/${path}`);

  return (
    <Container height="100%">
      <PanelGroup autoSaveId="example" direction="horizontal">
        <Panel defaultSize={25}></Panel>
        <PanelResizeHandle />
        <Panel></Panel>
        <PanelResizeHandle />
        <Panel defaultSize={25}>{data}</Panel>
      </PanelGroup>
    </Container>
  );
}

const Container = styled(Box)`
  display: flex;
  flex-direction: column;
  width: 100%;
  position: absolute;
`;
