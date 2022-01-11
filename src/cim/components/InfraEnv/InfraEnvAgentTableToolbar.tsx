import * as React from 'react';
import {
  ActionList,
  ActionListItem,
  Dropdown,
  DropdownItem,
  DropdownToggle,
  DropdownToggleCheckbox,
} from '@patternfly/react-core';
import { CaretDownIcon } from '@patternfly/react-icons';
import { AgentK8sResource } from '../../types';
import { MassApproveAgentModal, MassChangeHostnameModal } from '../modals';

type InfraEnvAgentTableToolbarProps = {
  agents: AgentK8sResource[];
  selectedAgents: string[];
  onSelectAll: VoidFunction;
  onSelectNone: VoidFunction;
  onChangeHostname: (agent: AgentK8sResource, hostname: string) => Promise<AgentK8sResource>;
  onApprove: (agent: AgentK8sResource) => Promise<AgentK8sResource>;
};

// TODO BMH
const InfraEnvAgentTableToolbar: React.FC<InfraEnvAgentTableToolbarProps> = ({
  agents,
  selectedAgents,
  onSelectAll,
  onSelectNone,
  onApprove,
  onChangeHostname,
}) => {
  const [actionsOpen, setActionsOpen] = React.useState(false);
  const [selectOpen, setSelectOpen] = React.useState(false);
  const [isMassApproveOpen, setMassApproveOpen] = React.useState(false);
  const [isMassChangeHostOpen, setMassChangeHostOpen] = React.useState(false);
  const onActionsToggle = () => setActionsOpen(!actionsOpen);
  const onSelectToggle = () => setSelectOpen(!selectOpen);

  let isChecked: boolean | null = false;
  if (selectedAgents.length) {
    isChecked =
      selectedAgents.length === agents.length &&
      agents.every((a) => selectedAgents.includes(a.metadata?.uid || ''))
        ? true
        : null;
  }

  const isDisabled = isChecked === false;

  return (
    <>
      <ActionList>
        <ActionListItem>
          <Dropdown
            onSelect={onSelectToggle}
            toggle={
              <DropdownToggle
                splitButtonItems={[
                  <DropdownToggleCheckbox
                    id="select-checkbox"
                    key="select-checkbox"
                    aria-label="Select all"
                    onChange={(checked) => (checked ? onSelectAll() : onSelectNone())}
                    isChecked={isChecked}
                  >
                    {selectedAgents.length} selected
                  </DropdownToggleCheckbox>,
                ]}
                onToggle={onSelectToggle}
              />
            }
            isOpen={selectOpen}
            dropdownItems={[
              <DropdownItem key="select-all" onClick={onSelectAll}>
                Select all
              </DropdownItem>,
              <DropdownItem key="select-none" onClick={onSelectNone}>
                Select none
              </DropdownItem>,
            ]}
          />
        </ActionListItem>
        <ActionListItem>
          <Dropdown
            onSelect={onActionsToggle}
            toggle={
              <DropdownToggle onToggle={onActionsToggle} toggleIndicator={CaretDownIcon} isPrimary>
                Actions
              </DropdownToggle>
            }
            isOpen={actionsOpen}
            dropdownItems={[
              <DropdownItem
                key="approve"
                onClick={() => setMassApproveOpen(true)}
                isDisabled={isDisabled}
                tooltip={isDisabled ? 'Select one or more hosts to approve' : undefined}
              >
                Approve
              </DropdownItem>,
              <DropdownItem
                key="hostname"
                onClick={() => setMassChangeHostOpen(true)}
                isDisabled={isDisabled}
                tooltip={isDisabled ? 'Select one or more hosts to change hostname' : undefined}
              >
                Change hostname
              </DropdownItem>,
            ]}
          />
        </ActionListItem>
      </ActionList>
      <MassApproveAgentModal
        isOpen={isMassApproveOpen}
        agents={agents.filter((a) => selectedAgents.includes(a.metadata?.uid || ''))}
        onApprove={onApprove}
        onClose={() => setMassApproveOpen(false)}
      />
      <MassChangeHostnameModal
        isOpen={isMassChangeHostOpen}
        agents={agents}
        selectedAgents={agents.filter((a) => selectedAgents.includes(a.metadata?.uid || ''))}
        onChangeHostname={onChangeHostname}
        onClose={() => setMassChangeHostOpen(false)}
      />
    </>
  );
};

export default InfraEnvAgentTableToolbar;
