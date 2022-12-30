import { FileBlockProps } from '@githubnext/blocks';
import { ActionList, ActionMenu, Box, ButtonGroup, Text } from '@primer/react';
import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer';
import styled from 'styled-components';
import './Block.css';
import { Button } from '../../components/Button';
import { decode } from '../../utils/base64';
import { useGitHubData } from '../../utils/useGitHubData';
import { useLocalStorageState } from '../../utils/useLocalStorageState';

export function DiffBlock(props: FileBlockProps) {
  const { context, originalContent } = props;
  const { owner, repo, path, sha } = context;

  const [splitView, setSplitView] = useLocalStorageState('splitView', false);
  const [diffMethod, setDiffMethod] = useLocalStorageState<DiffMethod>('diffMethod', DiffMethod.WORDS);
  const [target, setTarget] = useLocalStorageState<'main' | 'previous'>('target', 'previous');

  const { data: commitInfo, isLoading: commitLoading } = useGitHubData(
    props,
    `GET /repos/{owner}/{repo}/commits/{ref}`,
    { owner, repo, ref: sha }
  );
  const parent = commitInfo?.parents[0]?.sha;

  const { data, isLoading: dataLoading } = useGitHubData(
    props,
    `GET /repos/{owner}/{repo}/contents/{path}`,
    { owner, repo, path, ref: target === 'main' ? undefined : parent },
    { enabled: !!parent }
  );

  const current = data && 'content' in data ? decode(data.content) : '';

  const oldValue = target === 'main' ? originalContent : current;
  const newValue = target === 'main' ? current : originalContent;

  if (commitLoading || (parent && dataLoading)) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
        <Text>Loading...</Text>
      </Box>
    );
  }

  return (
    <Container height="100%">
      <Header>
        <HeaderStrip>
          <HeaderStripText>{path}</HeaderStripText>
        </HeaderStrip>

        <HeaderStrip>
          <ButtonGroup sx={{ display: 'flex', alignItems: 'center' }}>
            <Button size="small" selected={splitView} onClick={() => setSplitView(true)}>
              Split
            </Button>
            <Button size="small" selected={!splitView} onClick={() => setSplitView(false)}>
              Unified
            </Button>
          </ButtonGroup>

          <ActionMenu>
            <ActionMenu.Button size="small">Compare settings</ActionMenu.Button>

            <ActionMenu.Overlay>
              <ActionList>
                <ActionList.Group title="Compare with..." selectionVariant="single">
                  <ActionList.Item selected={target === 'previous'} onClick={() => setTarget('previous')}>
                    Previous commit
                  </ActionList.Item>
                  <ActionList.Item selected={target === 'main'} onClick={() => setTarget('main')}>
                    Main branch
                  </ActionList.Item>
                </ActionList.Group>

                <ActionList.Group title="Compare method" selectionVariant="single">
                  {availableDiffMethods.map(({ label, value }) => (
                    <ActionList.Item
                      key={`diff-method-${value}`}
                      selected={diffMethod === value}
                      onClick={() => setDiffMethod(value)}
                    >
                      {label}
                    </ActionList.Item>
                  ))}
                </ActionList.Group>
              </ActionList>
            </ActionMenu.Overlay>
          </ActionMenu>
        </HeaderStrip>
      </Header>

      {target === 'main' && commitInfo?.sha !== sha ? (
        <Box display="flex" justifyContent="center" alignItems="center" height="100%">
          <Text>This is the latest commit, no differences to compare.</Text>
        </Box>
      ) : (
        <ReactDiffViewer
          oldValue={oldValue}
          newValue={newValue}
          splitView={splitView}
          compareMethod={diffMethod}
          codeFoldMessageRenderer={(totalFoldedLines: number) => (
            <Text
              sx={{
                fontFamily: 'ui-monospace,SFMono-Regular,SF Mono,Menlo,Consolas,Liberation Mono,monospace',
                fontSize: '12px',
                color: '#57606a'
              }}
            >{`Expand ${totalFoldedLines} lines...`}</Text>
          )}
        />
      )}
    </Container>
  );
}

const availableDiffMethods = [
  { label: 'Words', value: DiffMethod.WORDS },
  { label: 'Words with space', value: DiffMethod.WORDS_WITH_SPACE },
  { label: 'Chars', value: DiffMethod.CHARS },
  { label: 'Lines', value: DiffMethod.LINES },
  { label: 'Trimmed lines', value: DiffMethod.TRIMMED_LINES },
  { label: 'Sentences', value: DiffMethod.SENTENCES },
  { label: 'CSS', value: DiffMethod.CSS }
];

const Container = styled(Box)`
  display: flex;
  flex-direction: column;
  width: 100%;
  position: absolute;
`;

const Header = styled(Box)`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 8px;
  background-color: rgb(246, 248, 250);
  border-bottom: 1px solid #d0d7de;
  border-radius: 6px 6px 0px 0px;
  position: sticky;
  top: 0;
  z-index: 1;
`;

const HeaderStrip = styled(Box)`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 16px;
  margin-right: 16px;
`;

const HeaderStripText = styled(Text)`
  font-size: 12px;
  flex: 1 1 auto;
  padding-right: 16px;
  padding-top: 4px;
  color: rgb(87, 96, 106);
  min-width: 0px;
  font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace !important;
`;
