import { Form } from '@patternfly/react-core';
import { useFormikContext } from 'formik';
import * as React from 'react';
import {
  BaseDnsHelperText,
  InputField,
  OpenShiftVersionSelect,
  PullSecret,
} from '../../../../../common';
import { useTranslation } from '../../../../../common/hooks/use-translation-wrapper';
import { getErrorMessage } from '../../../../../common/utils';
import { getOCPVersions } from '../../../helpers';
import { useTemptiflySync } from '../../hooks/useTemptiflySync';
import { DetailsFormProps, DetailsFormValues } from './types';

const DetailsForm: React.FC<DetailsFormProps> = ({
  onValuesChanged,
  extensionAfter,
  clusterImages,
  supportedVersionsCM,
}) => {
  const { values } = useFormikContext<DetailsFormValues>();
  useTemptiflySync({ values, onValuesChanged });

  const nameInputRef = React.useRef<HTMLInputElement>();
  React.useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  let ocpVersions = React.useMemo(() => getOCPVersions(clusterImages), [clusterImages]);

  if (supportedVersionsCM?.data?.versions) {
    try {
      const versions = JSON.parse(supportedVersionsCM.data.versions) as string[];
      ocpVersions = ocpVersions.filter((v) => versions.find((sv) => v.version.startsWith(sv)));
    } catch (err) {
      console.error('Could not parse supported versions config map value.', getErrorMessage(err));
    }
  }

  const { t } = useTranslation();
  return (
    <Form>
      <InputField
        ref={nameInputRef}
        label={t('ai:Cluster name')}
        name="name"
        placeholder={t('ai:Enter cluster name')}
        isRequired
      />
      {extensionAfter?.['name'] && extensionAfter['name']}
      <InputField
        label={t('ai:Base domain')}
        name="baseDnsDomain"
        helperText={<BaseDnsHelperText name={values.name} baseDnsDomain={values.baseDnsDomain} />}
        placeholder="example.com"
        isRequired
      />
      <OpenShiftVersionSelect versions={ocpVersions} />
      <PullSecret isOcm={false} />
    </Form>
  );
};

export default DetailsForm;
