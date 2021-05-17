import * as React from 'react';
import {
  DescriptionList,
  GridItem,
  Grid,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Title,
  TitleSizes,
} from '@patternfly/react-core';
import { useFormikContext } from 'formik';
import { EnvironmentStepFormValues } from '../InfraWizard';
import { CheckCircleIcon, CrossIcon } from '@patternfly/react-icons';

import { global_palette_green_500 as okColor } from '@patternfly/react-tokens/dist/js/global_palette_green_500';
import { global_warning_color_100 as warningColor } from '@patternfly/react-tokens/dist/js/global_warning_color_100';

type ReviewStepProps = {
  created: boolean;
  creating: boolean;
  error: string | undefined;
  provisioner: 'bm' | 'generic' | undefined;
};

const ReviewStep: React.FC<ReviewStepProps> = ({ created, creating, error, provisioner }) => {
  const { values } = useFormikContext<EnvironmentStepFormValues>();
  const createStatus = error ? 'Error' : creating ? 'Loading' : created ? 'Done!' : false;
  return (
    <Grid hasGutter>
      <GridItem span={12}>
        <Title headingLevel="h1" size={TitleSizes.lg}>
          Review and create
        </Title>
      </GridItem>
      <GridItem span={6}>
        <DescriptionList>
          <DescriptionListGroup>
            <DescriptionListTerm>Type</DescriptionListTerm>
            <DescriptionListDescription>
              {provisioner === 'bm' ? 'BareMetal' : 'Generic'}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Infrastructure Environment name</DescriptionListTerm>
            <DescriptionListDescription>{values.name}</DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Base domain</DescriptionListTerm>
            <DescriptionListDescription>{values.baseDomain}</DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      </GridItem>
      <GridItem span={6}>
        <DescriptionList>
          {values.enableProxy && (
            <>
              <DescriptionListGroup>
                <DescriptionListTerm>HTTP Proxy URL</DescriptionListTerm>
                <DescriptionListDescription>{values.httpProxy}</DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>HTTPS Proxy URL</DescriptionListTerm>
                <DescriptionListDescription>{values.httpsProxy}</DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>No proxy domains</DescriptionListTerm>
                <DescriptionListDescription>{values.noProxy}</DescriptionListDescription>
              </DescriptionListGroup>
            </>
          )}
          <DescriptionListGroup>
            <DescriptionListTerm>Secret and keys</DescriptionListTerm>
            <DescriptionListDescription>
              <>
                <div>
                  {values.pullSecret ? (
                    <CheckCircleIcon color={okColor.value} />
                  ) : (
                    <CrossIcon color={warningColor.value} />
                  )}
                  &nbsp;Pull Secret
                </div>
                <div>
                  {values.sshPublicKey ? (
                    <CheckCircleIcon color={okColor.value} />
                  ) : (
                    <CrossIcon color={warningColor.value} />
                  )}
                  &nbsp;Public SSH Key
                </div>
              </>
            </DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      </GridItem>
      <GridItem span={12}>
        <div>{createStatus}</div>
      </GridItem>
    </Grid>
  );
};

export default ReviewStep;
