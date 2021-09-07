import { InfraEnvK8sResource, SecretKind } from '../../types';

export const getBareMetalHostCredentialsSecret = (
  values: {
    username: string;
    password: string;
    hostname: string;
  },
  namespace: string,
) => ({
  apiVersion: 'v1',
  kind: 'Secret',
  stringData: {
    username: btoa(values.username),
    password: btoa(values.password),
  },
  metadata: {
    generateName: `bmc-${values.hostname.split('.').shift()}-`,
    namespace,
  },
  type: 'Opaque',
});

export const getBareMetalHost = (
  values: {
    hostname: string;
    bmcAddress: string;
    disableCertificateVerification: boolean;
    bootMACAddress: string;
    online: boolean;
  },
  infraEnv: InfraEnvK8sResource,
  secret: SecretKind,
) => ({
  apiVersion: 'metal3.io/v1alpha1',
  kind: 'BareMetalHost',
  metadata: {
    name: values.hostname,
    namespace: infraEnv.metadata?.namespace,
    labels: {
      'infraenvs.agent-install.openshift.io': infraEnv.metadata?.name,
    },
    annotations: {
      'inspect.metal3.io': 'disabled',
    },
  },
  spec: {
    bmc: {
      address: values.bmcAddress,
      credentialsName: secret.metadata?.name,
      disableCertificateVerification: !!values.disableCertificateVerification,
    },
    bootMACAddress: values.bootMACAddress,
    description: '', // TODO(mlibra)
    online: !!values.online,
    automatedCleaningMode: 'disabled',
  },
});
