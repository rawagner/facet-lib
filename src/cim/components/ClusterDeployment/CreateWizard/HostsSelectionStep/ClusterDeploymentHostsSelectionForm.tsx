import React from 'react';
import { useFormikContext } from 'formik';
import { Grid, GridItem, TextContent, Form, Alert, AlertVariant } from '@patternfly/react-core';
import { ClusterWizardStepHeader, SwitchField } from '../../../../../common';
import {
  AgentTableActions,
  ClusterDeploymentHostSelectionStepProps,
  ClusterDeploymentHostsSelectionValues,
} from '../../types';
import ClusterDeploymentHostsSelectionBasic from './ClusterDeploymentHostsSelectionBasic';
import ClusterDeploymentHostsSelectionAdvanced from './ClusterDeploymentHostsSelectionAdvanced';
import { getAgentsForSelection, getIsSNOCluster, getWizardStepAgentStatus } from '../../../helpers';
import MinimalHWRequirements from '../../../Agent/MinimalHWRequirements';
import NoAgentsAlert from './NoAgentsAlert';
import { AgentK8sResource } from '../../../../types';
import ClusterDeploymentWizardContext from '../ClusterDeploymentWizardContext';
import { canNextFromHostSelectionStep } from '../wizardTransition';
import ClusterDeploymentWizardFooter from '../ClusterDeploymentWizardFooter';
import ClusterDeploymentWizardStep from '../ClusterDeploymentWizardStep';

const getSelectedAgents = (
  agents: AgentK8sResource[],
  values: ClusterDeploymentHostsSelectionValues,
) => {
  const selectedHostIds = values.autoSelectHosts
    ? values.autoSelectedHostIds
    : values.selectedHostIds;
  return agents.filter((agent) => selectedHostIds.includes(agent.metadata?.uid || ''));
};

type ClusterDeploymentHostsSelectionFormProps = {
  agents: ClusterDeploymentHostSelectionStepProps['agents'];
  agentClusterInstall: ClusterDeploymentHostSelectionStepProps['agentClusterInstall'];
  onClose: ClusterDeploymentHostSelectionStepProps['onClose'];
  clusterDeployment: ClusterDeploymentHostSelectionStepProps['clusterDeployment'];
  aiConfigMap?: ClusterDeploymentHostSelectionStepProps['aiConfigMap'];
  onEditRole: AgentTableActions['onEditRole'];
};

const ClusterDeploymentHostsSelectionForm: React.FC<ClusterDeploymentHostsSelectionFormProps> = ({
  agents,
  agentClusterInstall,
  onClose,
  clusterDeployment,
  aiConfigMap,
  onEditRole: onEditRoleInit,
}) => {
  const { setCurrentStepId } = React.useContext(ClusterDeploymentWizardContext);
  const [showClusterErrors, setShowClusterErrors] = React.useState(false);
  const {
    values,
    isValid,
    isValidating,
    isSubmitting,
    touched,
    errors,
    validateForm,
    setTouched,
    submitForm,
    setSubmitting,
  } = useFormikContext<ClusterDeploymentHostsSelectionValues>();
  const [nextRequested, setNextRequested] = React.useState(false);
  const [showFormErrors, setShowFormErrors] = React.useState(false);
  const selectedAgents = getSelectedAgents(agents, values);
  const isSNOCluster = getIsSNOCluster(agentClusterInstall);

  const cdName = clusterDeployment?.metadata?.name;
  const cdNamespace = clusterDeployment?.metadata?.namespace;

  const availableAgents = React.useMemo(
    () =>
      getAgentsForSelection(agents).filter(
        (agent) =>
          (agent.spec.clusterDeploymentName?.name === cdName &&
            agent.spec.clusterDeploymentName?.namespace === cdNamespace) ||
          (!agent.spec.clusterDeploymentName?.name && !agent.spec.clusterDeploymentName?.namespace),
      ),
    [agents, cdNamespace, cdName],
  );

  const onEditRole = React.useCallback(
    async (agent, role) => {
      setNextRequested(false);
      setShowClusterErrors(false);
      setSubmitting(true);
      const response = await onEditRoleInit?.(agent, role);
      setSubmitting(false);
      return response;
    },
    [onEditRoleInit, setSubmitting],
  );

  const onAutoSelectChange = React.useCallback(() => {
    setNextRequested(false);
    setShowClusterErrors(false);
    setShowFormErrors(false);
  }, []);

  const onHostSelect = React.useCallback(() => {
    setNextRequested(false);
    setShowClusterErrors(false);
  }, []);

  const onNext = async () => {
    if (!showFormErrors) {
      setShowFormErrors(true);
      const errors = await validateForm();
      setTouched(
        Object.keys(errors).reduce((acc, curr) => {
          acc[curr] = true;
          return acc;
        }, {}),
      );
      if (Object.keys(errors).length) {
        return;
      }
    }
    submitForm();
    setNextRequested(true);
  };

  React.useEffect(() => {
    if (nextRequested && !isSubmitting) {
      const agentStatuses = selectedAgents.map(
        (agent) => getWizardStepAgentStatus(agent, 'hosts-selection').status.key,
      );
      if (
        agentStatuses.some((status) =>
          ['disconnected', 'disabled', 'error', 'insufficient', 'cancelled'].includes(status),
        )
      ) {
        setNextRequested(false);
      } else if (
        !!selectedAgents.length &&
        selectedAgents.every(
          (agent) => getWizardStepAgentStatus(agent, 'hosts-selection').status.key === 'known',
        )
      ) {
        setShowClusterErrors(true);
        if (canNextFromHostSelectionStep(agentClusterInstall, selectedAgents)) {
          setCurrentStepId('networking');
        }
      }
    }
  }, [nextRequested, selectedAgents, agentClusterInstall, setCurrentStepId, isSubmitting]);

  let submittingText: string | undefined = undefined;

  if (isSubmitting) {
    submittingText = 'Saving changes...';
  } else if (nextRequested && !showClusterErrors) {
    submittingText = 'Binding hosts...';
  }

  const onSyncError = React.useCallback(() => setNextRequested(false), []);

  const footer = (
    <ClusterDeploymentWizardFooter
      agentClusterInstall={agentClusterInstall}
      agents={selectedAgents}
      isSubmitting={!!submittingText}
      submittingText={submittingText}
      isNextDisabled={
        nextRequested || isSubmitting || (showFormErrors ? !isValid || isValidating : false)
      }
      onNext={onNext}
      onBack={() => setCurrentStepId('cluster-details')}
      onCancel={onClose}
      showClusterErrors={showClusterErrors}
      onSyncError={onSyncError}
    >
      {showFormErrors && errors.selectedHostIds && touched.selectedHostIds && (
        <Alert
          variant={AlertVariant.danger}
          title="Provided cluster configuration is not valid"
          isInline
        >
          {errors.selectedHostIds}
        </Alert>
      )}
    </ClusterDeploymentWizardFooter>
  );

  return (
    <ClusterDeploymentWizardStep footer={footer}>
      <Grid hasGutter>
        <GridItem>
          <ClusterWizardStepHeader>Cluster hosts</ClusterWizardStepHeader>
        </GridItem>
        <GridItem>
          <Grid hasGutter>
            <GridItem>
              <TextContent>
                {isSNOCluster
                  ? 'Exactly 1 host is required, capable of functioning both as control plane and worker node.'
                  : 'At least 3 hosts are required, capable of functioning as control plane nodes.'}
              </TextContent>
            </GridItem>
            {aiConfigMap && (
              <GridItem>
                <MinimalHWRequirements aiConfigMap={aiConfigMap} isSNOCluster={isSNOCluster} />
              </GridItem>
            )}

            <GridItem>
              {availableAgents.length ? (
                <Form>
                  <SwitchField
                    name="autoSelectHosts"
                    label="Auto-select hosts"
                    onChange={onAutoSelectChange}
                  />

                  {values.autoSelectHosts && (
                    <ClusterDeploymentHostsSelectionBasic
                      availableAgents={availableAgents}
                      isSNOCluster={isSNOCluster}
                    />
                  )}

                  {!values.autoSelectHosts && (
                    <ClusterDeploymentHostsSelectionAdvanced<ClusterDeploymentHostsSelectionValues>
                      availableAgents={availableAgents}
                      onEditRole={onEditRole}
                      onHostSelect={onHostSelect}
                    />
                  )}
                </Form>
              ) : (
                <NoAgentsAlert />
              )}
            </GridItem>
          </Grid>
        </GridItem>
      </Grid>
    </ClusterDeploymentWizardStep>
  );
};

export default ClusterDeploymentHostsSelectionForm;
