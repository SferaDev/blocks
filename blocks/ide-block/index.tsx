import { FileBlockProps } from '@githubnext/blocks';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { IDEBlock } from './Block';

const queryClient = new QueryClient();

export default function (props: FileBlockProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <IDEBlock {...props} />
    </QueryClientProvider>
  );
}
