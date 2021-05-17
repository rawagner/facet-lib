import * as Yup from 'yup';
import * as React from 'react';
import {
  Alert,
  AlertActionCloseButton,
  AlertVariant,
  Button,
  Wizard,
  WizardContextConsumer,
  WizardFooter,
} from '@patternfly/react-core';
import { Formik, useFormikContext } from 'formik';
import EnvironmentStep from './EnvironmentStep/EnvironmentStep';
import ProvisionerStep from './ProvisionerStep/ProvisionerStep';
import {
  httpProxyValidationSchema,
  noProxyValidationSchema,
  sshPublicKeyValidationSchema,
} from '../ui/formik/validationSchemas';
import ReviewStep from './ReviewStep/ReviewStep';

export type EnvironmentStepFormValues = {
  name: string;
  baseDomain: string;
  pullSecret: string;
  sshPublicKey: string;
  httpProxy: string;
  httpsProxy: string;
  noProxy: string;
  enableProxy: boolean;
};

const validationSchema = Yup.lazy<EnvironmentStepFormValues>((values) =>
  Yup.object<EnvironmentStepFormValues>().shape({
    sshPublicKey: sshPublicKeyValidationSchema.required(
      'An SSH key is required to debug hosts as they register.',
    ),
    httpProxy: httpProxyValidationSchema(values, 'httpsProxy'),
    httpsProxy: httpProxyValidationSchema(values, 'httpProxy'), // share the schema, httpS is currently not supported
    noProxy: noProxyValidationSchema,
  }),
);

const initialValues: EnvironmentStepFormValues = {
  name: '',
  baseDomain: '',
  pullSecret: '',
  sshPublicKey: '',
  httpProxy: '',
  httpsProxy: '',
  noProxy: '',
  enableProxy: false,
};

type FooterProps = {
  error: any;
  cleanError: () => void;
  created: boolean;
  onFinish: () => void;
};

const Footer: React.FC<FooterProps> = ({ error, cleanError, created, onFinish }) => {
  const { submitForm } = useFormikContext<EnvironmentStepFormValues>();
  return (
    <>
      {error && (
        <Alert
          className="kv-create-vm__error"
          variant={AlertVariant.danger}
          actionClose={<AlertActionCloseButton onClose={cleanError} />}
          title="Error creating InfraEnv"
        >
          {error}
        </Alert>
      )}
      <WizardFooter>
        <WizardContextConsumer>
          {({ onNext, onBack, onClose, activeStep }) => (
            <>
              <Button
                variant="primary"
                type="submit"
                onClick={activeStep.id === 'create' ? (created ? onFinish : submitForm) : onNext}
              >
                {activeStep.id === 'create' ? (created ? 'View InfraEnv' : 'Create') : 'Next'}
              </Button>
              <Button
                variant="secondary"
                onClick={onBack}
                isDisabled={activeStep.id === 'provisioner' || created}
              >
                Back
              </Button>
              <Button variant="link" onClick={onClose} isDisabled={created}>
                Cancel
              </Button>
            </>
          )}
        </WizardContextConsumer>
      </WizardFooter>
    </>
  );
};

type InfraWizardProps = {
  onSubmit: (values: EnvironmentStepFormValues) => Promise<any>;
  onFinish: () => void;
};

const InfraWizard: React.FC<InfraWizardProps> = ({ onSubmit, onFinish }) => {
  const [creating, setCreating] = React.useState<boolean>(false);
  const [created, setCreated] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | undefined>();
  const [provisioner, setProvisioner] = React.useState<'bm' | 'generic'>();
  const steps = [
    {
      id: 'provisioner',
      name: 'Select a provisioner',
      component: <ProvisionerStep onSelect={setProvisioner} />,
    },
    {
      id: 'env',
      name: 'Configure environment',
      component: <EnvironmentStep />,
    },
    {
      id: 'create',
      name: 'Review and create',
      component: (
        <ReviewStep creating={creating} created={created} error={error} provisioner={provisioner} />
      ),
    },
  ];
  return (
    <Formik
      initialValues={initialValues}
      initialStatus={{ error: null }}
      validationSchema={validationSchema}
      onSubmit={async (values) => {
        try {
          setCreating(true);
          await onSubmit(values);
          setCreated(true);
        } catch (e) {
          setCreated(false);
          setError(e?.message ?? 'An error occured');
        } finally {
          setCreating(false);
        }
      }}
    >
      <Wizard
        navAriaLabel="New infrastructure environment steps"
        mainAriaLabel="New infrastructure environment content"
        steps={steps}
        footer={
          <Footer
            error={error}
            cleanError={() => setError(undefined)}
            created={created}
            onFinish={onFinish}
          />
        }
      />
    </Formik>
  );
};

export default InfraWizard;
