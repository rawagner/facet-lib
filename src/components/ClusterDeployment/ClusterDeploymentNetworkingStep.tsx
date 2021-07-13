import React from 'react';
import { Formik } from 'formik';

import { Cluster, ClusterDefaultConfig } from '../../api';
import { useAlerts } from '../AlertsContextProvider';

import {
  ClusterDeploymentDetailsNetworkingProps,
  ClusterDeploymentNetworkingValues,
} from './types';
import ClusterDeploymentNetworking from './ClusterDeploymentNetworking';
import {
  getNetworkConfigurationValidationSchema,
  getNetworkInitialValues,
} from '../clusterConfiguration/networkConfigurationValidation';
import { HostSubnets, NetworkConfigurationValues } from '../../types/clusters';
import { CLUSTER_DEFAULT_NETWORK_SETTINGS_IPV4 } from '../../config';
import { getHostSubnets } from '../clusterConfiguration/utils';

const getInitialValues = ({
  cluster,
  defaultNetworkSettings,
}: {
  cluster: Cluster;
  defaultNetworkSettings: ClusterDefaultConfig;
}): ClusterDeploymentNetworkingValues => getNetworkInitialValues(cluster, defaultNetworkSettings);

const getValidationSchema = (initialValues: NetworkConfigurationValues, hostSubnets: HostSubnets) =>
  getNetworkConfigurationValidationSchema(initialValues, hostSubnets);

const ClusterDeploymentNetworkingStep: React.FC<
  ClusterDeploymentDetailsNetworkingProps & {
    onValuesChange: (v: ClusterDeploymentNetworkingValues) => void;
  }
> = ({ cluster, onSaveNetworking, ...rest }) => {
  const { addAlert } = useAlerts();
  // TODO(mlibra) - see bellow const { setCurrentStepId } = React.useContext(ClusterDeploymentWizardContext);

  // TODO(mlibra): So far a constant. Should be queried from somewhere.
  const defaultNetworkSettings: ClusterDefaultConfig = CLUSTER_DEFAULT_NETWORK_SETTINGS_IPV4;

  const hostSubnets = React.useMemo(() => getHostSubnets(cluster), [cluster]);

  const initialValues = React.useMemo(
    () => getInitialValues({ cluster, defaultNetworkSettings }),
    [], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const validationSchema = React.useMemo(() => getValidationSchema(initialValues, hostSubnets), [
    initialValues,
    hostSubnets,
  ]);

  const handleSubmit = async (values: ClusterDeploymentNetworkingValues) => {
    try {
      await onSaveNetworking(values);
    } catch (error) {
      addAlert({
        title: 'Failed to save ClusterDeployment',
        message: error,
      });
    }
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
    >
      {(formikProps) => {
        return (
          <ClusterDeploymentNetworking
            cluster={cluster}
            hostSubnets={hostSubnets}
            defaultNetworkSettings={defaultNetworkSettings}
            {...rest}
            {...formikProps}
          />
        );
      }}
    </Formik>
  );
};

export default ClusterDeploymentNetworkingStep;
