import React from 'react';
import * as Yup from 'yup';
import { TestOptionsMessage } from 'yup';
import { Formik, FormikConfig } from 'formik';
import { useAlerts } from '../../../../../common';
import {
  AgentClusterInstallK8sResource,
  AgentK8sResource,
  ClusterDeploymentK8sResource,
} from '../../../../types';
import {
  ClusterDeploymentHostSelectionStepProps,
  ClusterDeploymentHostsSelectionValues,
} from '../../types';
import { hostCountValidationSchema } from './validationSchemas';
import { getAgentSelectorFieldsFromAnnotations, getIsSNOCluster } from '../../../helpers';
import ClusterDeploymentHostsSelectionForm from './ClusterDeploymentHostsSelectionForm';

const getInitialValues = ({
  agents,
  clusterDeployment,
  agentClusterInstall,
}: {
  agents: AgentK8sResource[];
  clusterDeployment: ClusterDeploymentK8sResource;
  agentClusterInstall: AgentClusterInstallK8sResource;
}): ClusterDeploymentHostsSelectionValues => {
  const isSNOCluster = getIsSNOCluster(agentClusterInstall);
  const cdName = clusterDeployment?.metadata?.name;
  const cdNamespace = clusterDeployment?.metadata?.namespace;

  let hostCount =
    (agentClusterInstall?.spec?.provisionRequirements?.controlPlaneAgents || 0) +
    (agentClusterInstall?.spec?.provisionRequirements?.workerAgents || 0);
  if (isSNOCluster) {
    hostCount = 1;
  } else if (hostCount === 2 || hostCount === 0) {
    hostCount = 3;
  } else if (hostCount === 4) {
    hostCount = 5;
  }

  const agentSelector = getAgentSelectorFieldsFromAnnotations(
    clusterDeployment?.metadata?.annotations,
  );

  const selectedIds = agents
    .filter(
      (agent) =>
        agent.spec?.clusterDeploymentName?.name === cdName &&
        agent.spec?.clusterDeploymentName?.namespace === cdNamespace,
    )
    .map((agent) => agent.metadata?.uid as string);
  const autoSelectHosts = agentSelector.autoSelect;

  return {
    autoSelectHosts,
    hostCount,
    useMastersAsWorkers: hostCount === 1 || hostCount === 3, // TODO: Recently not supported - https://issues.redhat.com/browse/MGMT-7677
    agentLabels: agentSelector?.labels || [],
    locations: agentSelector?.locations || [],
    selectedHostIds: selectedIds,
    autoSelectedHostIds: selectedIds,
  };
};

const getMinHostsCount = (selectedHostsCount: number) => (selectedHostsCount === 4 ? 5 : 3);

const getValidationSchema = (agentClusterInstall: AgentClusterInstallK8sResource) => {
  const isSNOCluster = getIsSNOCluster(agentClusterInstall);
  const getMinMessage: TestOptionsMessage<{ min: number }> = ({ min }) => {
    const message = `Please select at least ${min} hosts for the cluster`;
    if (min === 5) {
      return message + ' or select just 3 hosts instead.';
    }
    return `${message}.`;
  };

  return Yup.lazy<ClusterDeploymentHostsSelectionValues>((values) => {
    return Yup.object<ClusterDeploymentHostsSelectionValues>().shape({
      hostCount: isSNOCluster ? Yup.number() : hostCountValidationSchema,
      useMastersAsWorkers: Yup.boolean().required(),
      autoSelectedHostIds: values.autoSelectHosts
        ? Yup.array<string>().min(values.hostCount).max(values.hostCount)
        : Yup.array<string>(),
      selectedHostIds: values.autoSelectHosts
        ? Yup.array<string>()
        : isSNOCluster
        ? Yup.array<string>()
            .min(1, 'Please select one host for the cluster.')
            .max(1, 'Please select one host for the cluster.') // TODO(jtomasek): replace this with Yup.array().length() after updating Yup
        : Yup.array<string>().min(getMinHostsCount(values.selectedHostIds.length), getMinMessage),
    });
  });
};

type UseHostsSelectionFormikArgs = {
  agents: AgentK8sResource[];
  clusterDeployment: ClusterDeploymentK8sResource;
  agentClusterInstall: AgentClusterInstallK8sResource;
};

export const useHostsSelectionFormik = ({
  agents,
  clusterDeployment,
  agentClusterInstall,
}: UseHostsSelectionFormikArgs): [ClusterDeploymentHostsSelectionValues, Yup.Lazy] => {
  const initialValues = React.useMemo(
    () => getInitialValues({ agents, clusterDeployment, agentClusterInstall }),
    [agentClusterInstall, agents, clusterDeployment],
  );

  const validationSchema = React.useMemo(() => getValidationSchema(agentClusterInstall), [
    agentClusterInstall,
  ]);

  return [initialValues, validationSchema];
};

const ClusterDeploymentHostSelectionStep: React.FC<ClusterDeploymentHostSelectionStepProps> = ({
  onSaveHostsSelection,
  ...rest
}) => {
  const { addAlert } = useAlerts();

  const { agents, clusterDeployment, agentClusterInstall } = rest;

  const [initialValues, validationSchema] = useHostsSelectionFormik({
    agents,
    clusterDeployment,
    agentClusterInstall,
  });

  const handleSubmit: FormikConfig<ClusterDeploymentHostsSelectionValues>['onSubmit'] = async (
    values,
    { setSubmitting },
  ) => {
    try {
      await onSaveHostsSelection(values);
    } catch (error) {
      addAlert({
        title: 'Failed to save host selection.',
        message: error.message as string,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
    >
      <ClusterDeploymentHostsSelectionForm {...rest} />
    </Formik>
  );
};

export default ClusterDeploymentHostSelectionStep;
