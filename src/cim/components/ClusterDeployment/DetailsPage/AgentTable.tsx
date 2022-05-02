import * as React from 'react';
import { AgentClusterInstallK8sResource, AgentK8sResource } from '../../../types';
import { AgentTableActions } from '../types';
import DefaultEmptyState from '../../../../common/components/ui/uiState/EmptyState';
import { ConnectedIcon } from '@patternfly/react-icons';
import { infraEnvColumn, agentStatusColumn, useAgentsTable } from '../../Agent/tableUtils';
import {
  cpuCoresColumn,
  disksColumn,
  hostnameColumn,
  memoryColumn,
  roleColumn,
} from '../../../../common/components/hosts/tableUtils';
import HostsTable, { DefaultExpandComponent } from '../../../../common/components/hosts/HostsTable';
import { usePagination } from '../../../../common/components/hosts/usePagination';

export const getAgentId = (agent: AgentK8sResource) => agent.metadata?.uid as string;

export const AgentTableEmptyState = () => (
  <DefaultEmptyState
    icon={ConnectedIcon}
    title="Waiting for hosts..."
    content="Hosts may take a few minutes to appear here after booting."
  />
);

export type AgentTableProps = Pick<AgentTableActions, 'onUnbindHost'> & {
  agents: AgentK8sResource[];
  agentClusterInstall: AgentClusterInstallK8sResource;
  className?: string;
};

const AgentTable: React.FC<AgentTableProps> = ({
  agents,
  agentClusterInstall,
  className,
  onUnbindHost,
}) => {
  const agentClusterInstalls = React.useMemo(() => [agentClusterInstall], [agentClusterInstall]);
  const [hosts, hostActions, actionResolver] = useAgentsTable(
    { agents, agentClusterInstalls },
    {
      onUnbindHost,
    },
  );
  const content = React.useMemo(
    () => [
      hostnameColumn(hostActions.onEditHost),
      roleColumn(),
      agentStatusColumn({
        agents,
      }),
      infraEnvColumn(agents),
      cpuCoresColumn,
      memoryColumn,
      disksColumn,
    ],
    [agents, hostActions],
  );

  const paginationProps = usePagination(agents.length);
  return (
    <HostsTable
      hosts={hosts}
      content={content}
      actionResolver={actionResolver}
      className={className}
      ExpandComponent={DefaultExpandComponent}
      {...paginationProps}
    >
      <AgentTableEmptyState />
    </HostsTable>
  );
};

export default AgentTable;
