import { Button as PrimerButton } from '@primer/react';
import styled from 'styled-components';

export const Button = styled(PrimerButton)<{ selected: boolean }>`
  background-color: ${(props) => (props.selected ? 'hsla(220,14%,94%,1)' : 'inherit')};
  box-shadow: ${(props) => (props.selected ? 'inset 0 1px 0 rgba(208,215,222,0.2)' : 'none')};
`;
