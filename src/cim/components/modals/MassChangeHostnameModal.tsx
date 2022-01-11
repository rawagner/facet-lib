import * as React from 'react';
import {
  Alert,
  AlertVariant,
  Button,
  ButtonType,
  ButtonVariant,
  Form,
  HelperText,
  HelperTextItem,
  Modal,
  ModalBoxBody,
  ModalBoxFooter,
  Progress,
  ProgressMeasureLocation,
  Split,
  SplitItem,
  Stack,
  StackItem,
} from '@patternfly/react-core';
import { Formik, useFormikContext } from 'formik';
import * as Yup from 'yup';

import { AgentK8sResource } from '../../types';
import {
  getRichTextValidation,
  hostnameValidationSchema,
  HOSTNAME_VALIDATION_MESSAGES,
  RichInputField,
} from '../../../common';

import './MassChangeHostnameModal.css';

const getHostnameTemplateAndCount = (values: EditHostFormValues) => {
  const numberTemplate = values.hostname.match(/{{n+}}/) || [];
  const numberCount = numberTemplate[0]?.match(/n/g)?.length || 0;
  return { numberTemplate, numberCount };
};

const templateToHostname = (
  index: number,
  values: EditHostFormValues,
  numberTemplate: RegExpMatchArray,
  numberCount: number,
) => values.hostname.replace(numberTemplate[0], `${index + 1}`.padStart(numberCount, '0'));

const getNewHostnames = (values: EditHostFormValues, selectedAgents: AgentK8sResource[]) => {
  const { numberTemplate, numberCount } = getHostnameTemplateAndCount(values);
  return selectedAgents.map((a, index) =>
    templateToHostname(index, values, numberTemplate, numberCount),
  );
};

type EditHostFormValues = {
  hostname: string;
};

const initialValues = {
  hostname: '',
};

const validationSchema = (initialValues: EditHostFormValues, usedHostnames: string[]) =>
  Yup.object().shape({
    hostname: hostnameValidationSchema(initialValues.hostname, usedHostnames),
  });

const withTemplate = (
  selectedAgents: AgentK8sResource[],
  agents: AgentK8sResource[],
  schema: ReturnType<typeof validationSchema>,
) => async (values: EditHostFormValues) => {
  const newHostnames = getNewHostnames(values, selectedAgents);

  const usedHostnames = agents.reduce<string[]>((acc, agent) => {
    if (!selectedAgents.find((a) => a.metadata?.uid === agent.metadata?.uid)) {
      acc.push(agent.spec.hostname || agent.status?.inventory.hostname || '');
    }
    return acc;
  }, []);
  let validationResult = await getRichTextValidation(schema)({
    ...values,
    hostname: newHostnames[0],
  });
  if (newHostnames.some((h) => usedHostnames.includes(h))) {
    validationResult = {
      ...(validationResult || {}),
      hostname: (validationResult?.hostname || []).concat(HOSTNAME_VALIDATION_MESSAGES.NOT_UNIQUE),
    };
  }
  return validationResult;
};

type MassChangeHostnameFormProps = {
  selectedAgents: AgentK8sResource[];
  isOpen: boolean;
  onClose: VoidFunction;
  patchingAgent: number;
};

const MassChangeHostnameForm: React.FC<MassChangeHostnameFormProps> = ({
  selectedAgents: initAgents,
  isOpen,
  patchingAgent,
  onClose,
}) => {
  const { values, handleSubmit, isSubmitting, status, isValid } = useFormikContext<
    EditHostFormValues
  >();

  const hostnameInputRef = React.useRef<HTMLInputElement>();
  const ref = React.useRef<AgentK8sResource[]>(initAgents);

  React.useEffect(() => {
    isOpen && hostnameInputRef.current?.focus();
  }, [isOpen]);

  React.useCallback(() => {
    if (!isSubmitting) {
      ref.current = initAgents;
    }
  }, [initAgents, isSubmitting]);

  const selectedAgents = ref.current;

  const newHostnames = getNewHostnames(values, selectedAgents);

  return (
    <Form onSubmit={handleSubmit}>
      <div>
        <ModalBoxBody>
          <Stack hasGutter>
            <StackItem>
              <div>To rename hostnames use custom template:</div>
              <div>
                use <b>{`{{nnn}}`}</b> for 001
              </div>
            </StackItem>
            <StackItem>
              <RichInputField
                name="hostname"
                ref={hostnameInputRef}
                isRequired
                richValidationMessages={HOSTNAME_VALIDATION_MESSAGES}
              />
              <HelperText>
                <HelperTextItem variant="indeterminate">{`For example: host-{{nnn}}`}</HelperTextItem>
              </HelperText>
            </StackItem>
            <StackItem>
              Preview
              <Split hasGutter className="hostname-preview">
                <SplitItem className="hostname-column">
                  {selectedAgents.map((a, index) => (
                    <div key={a.metadata?.uid || index} className="hostname-column__text">
                      <b>{`${a.spec.hostname || a.status?.inventory.hostname}`}</b>
                    </div>
                  ))}
                </SplitItem>
                <SplitItem>
                  {selectedAgents.map((a, index) => (
                    <div key={a.metadata?.uid || index}>
                      <b>{'  >  '}</b>
                    </div>
                  ))}
                </SplitItem>
                <SplitItem isFilled>
                  {selectedAgents.map((a, index) => (
                    <div key={a.metadata?.uid || index}>
                      {newHostnames[index] || 'New hostname will appear here...'}
                    </div>
                  ))}
                </SplitItem>
              </Split>
            </StackItem>
            {status?.error && (
              <StackItem>
                <Alert variant={AlertVariant.danger} title={status.error.title} isInline>
                  {status.error.message}
                </Alert>
              </StackItem>
            )}
            {isSubmitting && (
              <StackItem>
                <Progress
                  value={(100 * (patchingAgent + 1)) / selectedAgents.length}
                  measureLocation={ProgressMeasureLocation.outside}
                  aria-label="Patching progress"
                />
              </StackItem>
            )}
          </Stack>
        </ModalBoxBody>
        <ModalBoxFooter>
          <Button key="submit" type={ButtonType.submit} isDisabled={isSubmitting || !isValid}>
            Change hostnames
          </Button>
          <Button onClick={onClose} variant={ButtonVariant.secondary} isDisabled={isSubmitting}>
            Cancel
          </Button>
        </ModalBoxFooter>
      </div>
    </Form>
  );
};

type MassChangeHostnameModalProps = {
  agents: AgentK8sResource[];
  selectedAgents: AgentK8sResource[];
  isOpen: boolean;
  onClose: VoidFunction;
  onChangeHostname: (agent: AgentK8sResource, hostname: string) => Promise<AgentK8sResource>;
};

const MassChangeHostnameModal: React.FC<MassChangeHostnameModalProps> = ({
  isOpen,
  onClose,
  selectedAgents,
  agents,
  onChangeHostname,
}) => {
  const [patchingAgent, setPatchingAgent] = React.useState<number>(0);

  return (
    <Modal
      aria-label="Change hostname dialog"
      title="Change hostname"
      isOpen={isOpen}
      onClose={onClose}
      hasNoBodyWrapper
      id="mass-change-hostname-modal"
      variant="small"
    >
      <Formik
        initialValues={initialValues}
        initialStatus={{ error: null }}
        validate={withTemplate(selectedAgents, agents, validationSchema(initialValues, []))}
        onSubmit={async (values, formikActions) => {
          const { numberTemplate, numberCount } = getHostnameTemplateAndCount(values);

          let i = 0;
          try {
            for (const agent of selectedAgents) {
              setPatchingAgent(i);
              const newHostname = templateToHostname(i, values, numberTemplate, numberCount);
              await onChangeHostname(agent, newHostname);
              i++;
            }
            onClose();
          } catch (e) {
            formikActions.setStatus({
              error: {
                title: 'Failed to update host',
                message: e.message || 'Hostname update failed.',
              },
            });
          }
        }}
      >
        <MassChangeHostnameForm
          isOpen={isOpen}
          selectedAgents={selectedAgents}
          patchingAgent={patchingAgent}
          onClose={onClose}
        />
      </Formik>
    </Modal>
  );
};

export default MassChangeHostnameModal;
