import { FileBlockProps } from '@githubnext/blocks';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DiffBlock } from './Block';

const queryClient = new QueryClient();

export default function (props: FileBlockProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <DiffBlock {...props} />
    </QueryClientProvider>
  );
}
