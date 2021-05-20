import * as React from 'react';
import { useField } from 'formik';

import { UploadField } from '../ui';
import { SshPublicKeyHelperText } from './ClusterSshKeyFields';
import { trimSshPublicKey } from '../ui/formik/utils';

const UploadSSH: React.FC = () => {
  const [{ name, value }, meta, { setValue }] = useField('sshPublicKey');

  return (
    <UploadField
      label="SSH public key"
      name={name}
      helperText={<SshPublicKeyHelperText />}
      idPostfix="discovery"
      onBlur={() => value && setValue(trimSshPublicKey(value))}
      dropzoneProps={{
        accept: '.pub',
        maxSize: 2048,
        onDropRejected: ({ setError }) => () => setError('File not supported.'),
      }}
      isRequired
    />
  );
};

export default UploadSSH;
