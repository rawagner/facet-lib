import * as React from 'react';
import {
  AgentK8sResource,
  BareMetalHostK8sResource,
  InfraEnvK8sResource,
  NMStateK8sResource,
  SecretKind,
} from '../../types';
import { ClusterDeploymentHostsTablePropsActions } from '../ClusterDeployment/types';
import {
  discoveryTypeColumn,
  statusColumn,
  clusterColumn,
  useAgentsTable,
} from '../Agent/tableUtils';
import { AgentTableEmptyState } from '../Agent/AgentTable';
import HostsTable from '../../../common/components/hosts/HostsTable';
import {
  cpuCoresColumn,
  discoveredAtColumn,
  disksColumn,
  hostnameColumn,
  memoryColumn,
} from '../../../common/components/hosts/tableUtils';

type InfraEnvAgentTable = ClusterDeploymentHostsTablePropsActions & {
  agents: AgentK8sResource[];
  bareMetalHosts: BareMetalHostK8sResource[];
  nmStates: NMStateK8sResource[];
  secrets: SecretKind[];
  infraEnv: InfraEnvK8sResource;
  getClusterDeploymentLink: (cd: { name: string; namespace: string }) => string;
  className?: string;
};

const InfraEnvAgentTable: React.FC<InfraEnvAgentTable> = ({
  agents,
  className,
  getClusterDeploymentLink,
  nmStates,
  bareMetalHosts,
  secrets,
  infraEnv,
  ...actions
}) => {
  const [hosts, hostActions, actionResolver] = useAgentsTable(actions, {
    agents,
    nmStates,
    bmhs: bareMetalHosts,
    secrets,
    infraEnv,
  });
  const content = React.useMemo(
    () => [
      hostnameColumn(hostActions.onEditHost),
      discoveryTypeColumn(agents, bareMetalHosts),
      statusColumn(agents, actions.onEditHost, actions.onApprove),
      clusterColumn(agents, getClusterDeploymentLink),
      discoveredAtColumn,
      cpuCoresColumn,
      memoryColumn,
      disksColumn,
    ],
    [agents, actions, getClusterDeploymentLink, hostActions, bareMetalHosts],
  );
  return (
    <HostsTable
      hosts={hosts}
      content={content}
      actionResolver={actionResolver}
      className={className}
    >
      <AgentTableEmptyState />
    </HostsTable>
  );
};

export default InfraEnvAgentTable;
