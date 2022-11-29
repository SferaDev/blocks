import { FileBlockProps } from '@githubnext/blocks';
import { DiffBlock } from './Block';
import { ContextWrapper } from './components/ContextWrapper';

export default function (props: FileBlockProps) {
  return (
    <ContextWrapper>
      <DiffBlock {...props} />
    </ContextWrapper>
  );
}
