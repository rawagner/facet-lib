import {
  Tile,
  Split,
  SplitItem,
  StackItem,
  Stack,
  TitleSizes,
  Title,
} from '@patternfly/react-core';
import { BellIcon } from '@patternfly/react-icons';
import * as React from 'react';

type ProvisionerStepProps = {
  onSelect: (provisioner: 'bm' | 'generic') => void;
};

const ProvisionerStep: React.FC<ProvisionerStepProps> = ({ onSelect }) => {
  return (
    <Stack hasGutter>
      <StackItem>
        <Title headingLevel="h1" size={TitleSizes.lg}>
          Select a provisioner
        </Title>
      </StackItem>
      <StackItem>Where would you like to run this infrastrucure environment ?</StackItem>
      <StackItem>
        <Split hasGutter>
          <SplitItem>
            <Tile title="BareMetal" icon={<BellIcon />} onSelect={() => onSelect('bm')}>
              Deploy on your own infrastructure
            </Tile>
          </SplitItem>
          <SplitItem>
            <Tile title="Generic" icon={<BellIcon />} onSelect={() => onSelect('generic')}>
              Generic options with nothing predetermined
            </Tile>
          </SplitItem>
        </Split>
      </StackItem>
    </Stack>
  );
};

export default ProvisionerStep;
