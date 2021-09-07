import * as React from 'react';
import { sortable } from '@patternfly/react-table';
import { Host, HostsTableActions } from '../../../common';
import { AgentK8sResource, InfraEnvK8sResource, SecretKind } from '../../types';
import AgentStatus from './AgentStatus';
import { Link } from 'react-router-dom';
import { ActionsResolver, TableRow } from '../../../common/components/hosts/AITable';
import { ClusterDeploymentHostsTablePropsActions } from '../ClusterDeployment/types';
import { hostActionResolver } from '../../../common/components/hosts/tableUtils';
import { getAIHosts } from '../helpers';
import { INFRAENV_AGENTINSTALL_LABEL_KEY } from '../common';
import { BareMetalHostK8sResource } from '../../types/k8s/bare-metal-host';
import { NMStateK8sResource } from '../../types/k8s/nm-state';

export const discoveryTypeColumn = (
  agents: AgentK8sResource[],
  bareMetalHosts: BareMetalHostK8sResource[],
): TableRow<Host> => ({
  header: { title: 'Discovery type', transforms: [sortable] },
  cell: (host) => {
    const agent = agents.find((a) => a.metadata?.uid === host.id);
    let discoveryType = 'Unknown';
    if (agent) {
      discoveryType = agent?.metadata?.labels?.hasOwnProperty('agent-install.openshift.io/bmh')
        ? 'BMC'
        : 'Discovery ISO';
    } else {
      const bmh = bareMetalHosts.find((bmh) => bmh.metadata?.uid === host.id);
      if (bmh) {
        discoveryType = 'BMC';
      }
    }
    return {
      title: discoveryType,
      props: { 'data-testid': 'discovery-type' },
      sortableValue: discoveryType,
    };
  },
});

export const statusColumn = (
  agents: AgentK8sResource[],
  onEditHostname?: ClusterDeploymentHostsTablePropsActions['onEditHost'],
  onApprove?: ClusterDeploymentHostsTablePropsActions['onApprove'],
): TableRow<Host> => {
  return {
    header: { title: 'Status' },
    cell: (host) => {
      const agent = agents.find((a) => a.metadata?.uid === host.id);
      let title: React.ReactNode = '--';
      if (agent) {
        const editHostname = onEditHostname ? () => onEditHostname(agent) : undefined;
        title = <AgentStatus agent={agent} onApprove={onApprove} onEditHostname={editHostname} />;
      }

      return {
        title,
        props: { 'data-testid': 'host-status' },
      };
    },
  };
};

export const clusterColumn = (
  agents: AgentK8sResource[],
  getClusterDeploymentLink: (cd: { name: string; namespace: string }) => string,
): TableRow<Host> => {
  return {
    header: { title: 'Cluster', transforms: [sortable] },
    cell: (host) => {
      const agent = agents.find((a) => a.metadata?.uid === host.id);
      const cluster = '--';
      let title: React.ReactNode = cluster;
      if (agent?.spec?.clusterDeploymentName) {
        title = (
          <Link to={getClusterDeploymentLink(agent.spec.clusterDeploymentName)}>
            {agent.spec.clusterDeploymentName.name}
          </Link>
        );
      }
      return {
        title,
        props: { 'data-testid': 'cluster' },
        sortableValue: cluster,
      };
    },
  };
};

export const infraEnvColumn = (agents: AgentK8sResource[]): TableRow<Host> => {
  return {
    header: { title: 'Infrastructure env', transforms: [sortable] },
    cell: (host) => {
      const agent = agents.find((a) => a.metadata?.uid === host.id) as AgentK8sResource;
      const infraEnvName = agent.metadata?.labels?.[INFRAENV_AGENTINSTALL_LABEL_KEY] || 'N/A';

      return {
        title: infraEnvName,
        props: { 'data-testid': 'infra-env' },
        sortableValue: infraEnvName,
      };
    },
  };
};

type AgentsTableResources = {
  agents: AgentK8sResource[];
  bmhs?: BareMetalHostK8sResource[];
  secrets?: SecretKind[];
  nmStates?: NMStateK8sResource[];
  infraEnv?: InfraEnvK8sResource;
};

export const useAgentsTable = (
  {
    onEditHost,
    canEditHost,
    onDeleteHost,
    canDelete,
    onEditRole,
    canEditRole,
    onSelect,
    onEditBMH,
  }: ClusterDeploymentHostsTablePropsActions,
  { agents, bmhs, secrets, nmStates, infraEnv }: AgentsTableResources,
): [Host[], HostsTableActions, ActionsResolver<Host>] => {
  const [hosts, actions] = React.useMemo(
    () => [
      getAIHosts(agents, bmhs, infraEnv),
      {
        onEditHost: onEditHost
          ? (host: Host) => {
              const agent = agents.find((a) => a.metadata?.uid === host.id) as AgentK8sResource;
              return onEditHost(agent);
            }
          : undefined,
        canEditHost: canEditHost
          ? (host: Host) => {
              const agent = agents.find((a) => a.metadata?.uid === host.id) as AgentK8sResource;
              return canEditHost(agent);
            }
          : undefined,
        onDeleteHost: onDeleteHost
          ? (host: Host) => {
              const agent = agents.find((a) => a.metadata?.uid === host.id) as AgentK8sResource;
              return onDeleteHost(agent);
            }
          : undefined,
        canDelete: canDelete
          ? (host: Host) => {
              const agent = agents.find((a) => a.metadata?.uid === host.id) as AgentK8sResource;
              return canDelete(agent);
            }
          : undefined,
        onEditRole: onEditRole
          ? (host: Host, role: string | undefined) => {
              const agent = agents.find((a) => a.metadata?.uid === host.id) as AgentK8sResource;
              return onEditRole(agent, role);
            }
          : undefined,
        canEditRole: canEditRole
          ? (host: Host) => {
              const agent = agents.find((a) => a.metadata?.uid === host.id) as AgentK8sResource;
              return canEditRole(agent);
            }
          : undefined,
        onSelect: onSelect
          ? (host: Host, selected: boolean) => {
              const agent = agents.find((a) => a.metadata?.uid === host.id) as AgentK8sResource;
              return onSelect(agent, selected);
            }
          : undefined,
        onEditBMH: onEditBMH
          ? (host: Host) => {
              const bmh = bmhs?.find(
                (h) => h.metadata?.uid === host.id,
              ) as BareMetalHostK8sResource;
              const secret = secrets?.find(
                ({ metadata }) => metadata?.name === bmh.spec?.bmc?.credentialsName,
              ) as SecretKind;
              const nmState = nmStates?.find(
                ({ metadata }) =>
                  metadata?.namespace === bmh.metadata?.namespace &&
                  metadata?.labels?.['bmh-name'] === bmh.metadata?.name,
              ) as NMStateK8sResource;
              return onEditBMH(bmh, secret, nmState);
            }
          : undefined,
        canEditBMH: (host: Host) => !!bmhs?.find((h) => h.metadata?.uid === host.id),
      },
    ],
    [
      onEditHost,
      canEditHost,
      onDeleteHost,
      canDelete,
      onEditRole,
      canEditRole,
      agents,
      onSelect,
      onEditBMH,
      bmhs,
      secrets,
      nmStates,
      infraEnv,
    ],
  );
  const actionResolver = React.useMemo(() => hostActionResolver(actions), [actions]);
  return [hosts, actions, actionResolver];
};
