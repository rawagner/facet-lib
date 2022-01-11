import * as React from 'react';
import { Host } from '../../../common/api/types';
import {
  discoveryTypeColumn,
  infraEnvStatusColumn,
  clusterColumn,
  useAgentsTable,
} from '../Agent/tableUtils';
import HostsTable, {
  DefaultExpandComponent,
  HostsTableEmptyState,
} from '../../../common/components/hosts/HostsTable';
import {
  cpuCoresColumn,
  discoveredAtColumn,
  disksColumn,
  hostnameColumn,
  memoryColumn,
} from '../../../common/components/hosts/tableUtils';
import { DiscoveryTroubleshootingModal } from '../../../common';
import { TableRow } from '../../../common/components/hosts/AITable';
import { InfraEnvAgentTableProps } from '../ClusterDeployment/types';
import { AgentK8sResource } from '../../types/';
import InfraEnvAgentTableToolbar from './InfraEnvAgentTableToolbar';

const InfraEnvAgentTable: React.FC<InfraEnvAgentTableProps> = ({
  agents,
  className,
  getClusterDeploymentLink,
  bareMetalHosts,
  infraEnv,
  hideClusterColumn,
  onApprove,
  onChangeHostname,
  ...actions
}) => {
  const [isDiscoveryHintModalOpen, setDiscoveryHintModalOpen] = React.useState(false);
  const [selectedAgents, setSelectedAgents] = React.useState<string[]>([]);
  const onSelect = (obj: AgentK8sResource, isSelected: boolean) => {
    if (isSelected) {
      setSelectedAgents([...selectedAgents, obj.metadata?.uid || '']);
    } else {
      setSelectedAgents(selectedAgents.filter((sa) => sa !== obj.metadata?.uid));
    }
  };

  const [hosts, hostActions, actionResolver] = useAgentsTable(actions, {
    agents,
    bmhs: bareMetalHosts,
    infraEnv,
  });
  const content = React.useMemo(
    () =>
      [
        hostnameColumn(hostActions.onEditHost),
        discoveryTypeColumn(agents, bareMetalHosts),
        infraEnvStatusColumn({
          agents,
          bareMetalHosts,
          onEditHostname: actions.onEditHost,
          onApprove: actions.onApprove,
        }),
        (!hideClusterColumn && clusterColumn(agents, getClusterDeploymentLink)) as TableRow<Host>,
        discoveredAtColumn,
        cpuCoresColumn,
        memoryColumn,
        disksColumn,
      ].filter(Boolean),
    [agents, actions, getClusterDeploymentLink, hostActions, bareMetalHosts, hideClusterColumn],
  );
  return (
    <>
      <InfraEnvAgentTableToolbar
        agents={agents}
        selectedAgents={selectedAgents}
        onSelectAll={() => setSelectedAgents(agents.map((ia) => ia.metadata?.uid || ''))}
        onSelectNone={() => setSelectedAgents([])}
        onApprove={onApprove}
        onChangeHostname={onChangeHostname}
      />
      <HostsTable
        hosts={hosts}
        content={content}
        actionResolver={actionResolver}
        className={className}
        selectedIDs={selectedAgents}
        onSelect={
          onSelect
            ? (obj, isSelected) => {
                const agent = agents.find((a) => a.metadata?.uid === obj.id);
                if (agent) {
                  onSelect(agent, isSelected);
                }
              }
            : undefined
        }
        ExpandComponent={DefaultExpandComponent}
      >
        <HostsTableEmptyState setDiscoveryHintModalOpen={setDiscoveryHintModalOpen} />
      </HostsTable>
      <DiscoveryTroubleshootingModal
        isOpen={isDiscoveryHintModalOpen}
        setDiscoveryHintModalOpen={setDiscoveryHintModalOpen}
      />
    </>
  );
};

export default InfraEnvAgentTable;
