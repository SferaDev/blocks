import { CommonBlockProps } from '@githubnext/blocks';
import { useQuery, UseQueryOptions } from '@tanstack/react-query';

export function useGitHubData<
  Path extends string,
  Parameters extends Record<string, any>,
  Response extends GitHubApiResponse<Path>
>(
  { onRequestGitHubData }: Pick<CommonBlockProps, 'onRequestGitHubData'>,
  path: Path,
  params?: Parameters,
  options?: UseQueryOptions<Response, Error>
) {
  return useQuery<Response, Error>([path, params], () => onRequestGitHubData(path, params), options);
}

type GitHubApiResponse<Path extends string> = Path extends `/repos/${string}/${string}/contents/${string}`
  ? {
      type: string;
      size: number;
      name: string;
      path: string;
      sha: string;
      url: string;
      git_url: string | null;
      html_url: string | null;
      download_url: string | null;
      content: string;
      encoding: 'base64';
      _links: {
        self: string;
        git: string;
        html: string;
      };
    }
  : Path extends `/repos/${string}/${string}/commits/${string}`
  ? {
      url: string;
      sha: string;
      node_id: string;
      html_url: string;
      comments_url: string;
      parents: {
        url: string;
        sha: string;
      }[];
    }
  : any;
