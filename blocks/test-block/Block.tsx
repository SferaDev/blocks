import { FileBlockProps } from '@githubnext/blocks';
import { Box } from '@primer/react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import styled from 'styled-components';
import './Block.css';

export function TestBlock(props: FileBlockProps) {
  const { context, originalContent } = props;
  const { owner, repo, sha } = context;

  const url = `https://github.com/${owner}/${repo}`;
  const dir = `/git/${owner}/${repo}`;

  return (
    <Container height="100%">
      <PanelGroup autoSaveId="example" direction="horizontal">
        <Panel defaultSize={25}></Panel>
        <PanelResizeHandle />
        <Panel></Panel>
        <PanelResizeHandle />
        <Panel defaultSize={25}>{originalContent}</Panel>
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
