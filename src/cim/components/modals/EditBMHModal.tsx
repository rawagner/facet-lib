import * as React from 'react';
import { Modal, ModalVariant } from '@patternfly/react-core';
import { BMCFormProps } from '../Agent/types';
import { BMCForm } from '../Agent';

type EditBMHModalProps = Pick<
  BMCFormProps,
  'onClose' | 'infraEnv' | 'nmState' | 'bmh' | 'secret'
> & {
  isOpen: boolean;
  onEdit: BMCFormProps['onCreate'];
};

const EditBMHModal: React.FC<EditBMHModalProps> = ({
  isOpen,
  onClose,
  onEdit,
  infraEnv,
  ...rest
}) => {
  const hasDHCP = infraEnv.metadata?.labels?.networkType !== 'static';
  return (
    <Modal
      aria-label="Edit BMH dialog"
      title="Edit BMH"
      isOpen={isOpen}
      onClose={onClose}
      variant={ModalVariant.small}
      hasNoBodyWrapper
      id="edit-bmh-modal"
    >
      <BMCForm
        isEdit
        onCreate={onEdit}
        onClose={onClose}
        hasDHCP={hasDHCP}
        infraEnv={infraEnv}
        {...rest}
      />
    </Modal>
  );
};

export default EditBMHModal;
