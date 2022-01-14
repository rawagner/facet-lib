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
import InfraEnvAgentTableToolbar from './InfraEnvAgentTableToolbar';
import { Stack, StackItem } from '@patternfly/react-core';

const InfraEnvAgentTable: React.FC<InfraEnvAgentTableProps> = ({
  agents,
  className,
  getClusterDeploymentLink,
  bareMetalHosts,
  infraEnv,
  hideClusterColumn,
  onChangeHostname,
  ...actions
}) => {
  const [isDiscoveryHintModalOpen, setDiscoveryHintModalOpen] = React.useState(false);
  const [selectedAgents, setSelectedAgents] = React.useState<string[]>([]);
  const onSelect = (obj: Host, isSelected: boolean) => {
    if (isSelected) {
      setSelectedAgents([...selectedAgents, obj.id]);
    } else {
      setSelectedAgents(selectedAgents.filter((sa) => sa !== obj.id));
    }
  };

  React.useEffect(() => {
    const agentsToRemove: string[] = [];
    selectedAgents.forEach((uid) => {
      const matchedAgent = [...agents, ...bareMetalHosts].find((a) => a.metadata?.uid === uid);
      if (!matchedAgent) {
        agentsToRemove.push(uid);
      }
    });
    if (agentsToRemove.length) {
      setSelectedAgents(selectedAgents.filter((sa) => !agentsToRemove.includes(sa)));
    }
  }, [bareMetalHosts, agents, selectedAgents]);

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
      <Stack hasGutter>
        <StackItem>
          <InfraEnvAgentTableToolbar
            agents={agents}
            selectedAgents={selectedAgents}
            onSelectAll={() => setSelectedAgents(hosts.map((ia) => ia.id || ''))}
            onSelectNone={() => setSelectedAgents([])}
            onApprove={actions.onApprove}
            onChangeHostname={onChangeHostname}
          />
        </StackItem>
        <StackItem>
          <HostsTable
            hosts={hosts}
            content={content}
            actionResolver={actionResolver}
            className={className}
            selectedIDs={selectedAgents}
            onSelect={onSelect}
            ExpandComponent={DefaultExpandComponent}
          >
            <HostsTableEmptyState setDiscoveryHintModalOpen={setDiscoveryHintModalOpen} />
          </HostsTable>
        </StackItem>
      </Stack>
      <DiscoveryTroubleshootingModal
        isOpen={isDiscoveryHintModalOpen}
        setDiscoveryHintModalOpen={setDiscoveryHintModalOpen}
      />
    </>
  );
};

export default InfraEnvAgentTable;
