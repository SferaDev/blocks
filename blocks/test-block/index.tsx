import { FileBlockProps } from '@githubnext/blocks';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TestBlock } from './Block';
import { GitRepoProvider } from '../utils/useGitRepo';

const queryClient = new QueryClient();

export default function (props: FileBlockProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <GitRepoProvider corsProxy="https://dev.eyeseetea.com/cors/">
        <TestBlock {...props} />
      </GitRepoProvider>
    </QueryClientProvider>
  );
}
