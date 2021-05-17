import * as React from 'react';
import { Form, Grid, GridItem, Title, TitleSizes } from '@patternfly/react-core';

import ProxyFields from '../../clusterConfiguration/ProxyFields';
import UploadSSH from '../../clusterConfiguration/UploadSSH';
import { InputField, TextAreaField } from '../../ui';

const EnvironmentStep: React.FC = () => {
  return (
    <Grid hasGutter span={8}>
      <GridItem>
        <Title headingLevel="h1" size={TitleSizes.lg}>
          Configure environment
        </Title>
      </GridItem>
      <GridItem>The text in design is tiny so I cannot read it!</GridItem>
      <GridItem>
        <Form>
          <InputField label="Name" name="name" />
          <InputField label="Base domain" name="baseDomain" />
          <TextAreaField label="Pull secret" name="pullSecret" />
          <UploadSSH />
          <ProxyFields />
        </Form>
      </GridItem>
    </Grid>
  );
};

export default EnvironmentStep;
