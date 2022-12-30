import { FileBlockProps } from '@githubnext/blocks';
import { Box } from '@primer/react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import styled from 'styled-components';
import './Block.css';
import { useFS, useFetchOrCloneRepo, useFile } from '../../hooks/useGitRepo';
import { useBundler } from '../../hooks/useBundler';

export function TestBlock(props: FileBlockProps) {
  const {
    context: { owner, repo, sha, path }
  } = props;

  const url = `https://github.com/${owner}/${repo}`;
  const dir = `/git/${owner}/${repo}`;

  const fs = useFS();
  const { isLoading } = useFetchOrCloneRepo(url, dir, sha);
  const { data: fileContents } = useFile(`${dir}/${path}`, { enabled: !isLoading });
  const { data: bundlerOutput, error } = useBundler(
    { fs, baseDir: dir, code: fileContents ?? '' },
    { enabled: !!fileContents }
  );

  return (
    <Container height="100%">
      <PanelGroup autoSaveId="example" direction="horizontal">
        <Panel>{fileContents}</Panel>
        <PanelResizeHandle />
        <Panel>{bundlerOutput ?? JSON.stringify(error, null, 4)}</Panel>
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
