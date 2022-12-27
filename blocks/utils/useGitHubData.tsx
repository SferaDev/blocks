import { CommonBlockProps } from '@githubnext/blocks';
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { RequestParameters, OctokitResponse, Endpoints } from '@octokit/types';

type FilterConditionally<Source, Condition> = Pick<
  Source,
  {
    [K in keyof Source]: K extends Condition ? K : never;
  }[keyof Source]
>;

type GetEndpoints = FilterConditionally<Endpoints, `GET ${string}`>;
type EndpointResponse<Endpoint extends keyof GetEndpoints> = OctokitResponse<
  Endpoints[Endpoint]
>['data']['response']['data'];

export function useGitHubData<
  Endpoint extends keyof GetEndpoints,
  EndpointParameters extends GetEndpoints[Endpoint]['parameters']
>(
  { onRequestGitHubEndpoint }: Pick<CommonBlockProps, 'onRequestGitHubEndpoint'>,
  path: Endpoint,
  params?: EndpointParameters & RequestParameters,
  options?: UseQueryOptions<EndpointResponse<Endpoint>, Error>
) {
  return useQuery<EndpointResponse<Endpoint>, Error>(
    [path, params],
    () => onRequestGitHubEndpoint(path, params),
    options
  );
}
