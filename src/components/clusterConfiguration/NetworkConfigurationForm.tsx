import React from 'react';
import { useDispatch } from 'react-redux';
import { Formik, FormikConfig, FormikProps } from 'formik';
import _ from 'lodash';
import {
  Cluster,
  ClusterUpdateParams,
  getErrorMessage,
  handleApiError,
  patchCluster,
} from '../../api';
import { Grid, GridItem, Text, TextContent } from '@patternfly/react-core';

import { useAlerts } from '../AlertsContextProvider';
import ClusterWizardStep from '../clusterWizard/ClusterWizardStep';
import { NetworkConfigurationValues } from '../../types/clusters';
import { updateCluster } from '../../reducers/clusters/currentClusterSlice';
import { canNextNetwork } from '../clusterWizard/wizardTransition';
import ClusterWizardContext from '../clusterWizard/ClusterWizardContext';
import { getHostSubnets } from './utils';
import { useDefaultConfiguration } from './ClusterDefaultConfigurationContext';
import NetworkingHostsTable from '../hosts/NetworkingHostsTable';
import FormikAutoSave from '../ui/formik/FormikAutoSave';
import { isSingleNodeCluster } from '../clusters/utils';
import ClusterWizardStepHeader from '../clusterWizard/ClusterWizardStepHeader';
import ClusterWizardFooter from '../clusterWizard/ClusterWizardFooter';
import { getFormikErrorFields } from '../ui/formik/utils';
import ClusterWizardNavigation from '../clusterWizard/ClusterWizardNavigation';
import NetworkConfigurationFormFields from './NetworkConfigurationFormFields';
import {
  getNetworkConfigurationValidationSchema,
  getNetworkInitialValues,
} from './networkConfigurationValidation';
import { ClusterHostsTable } from '../hosts';

const NetworkConfigurationForm: React.FC<{
  cluster: Cluster;
}> = ({ cluster }) => {
  const defaultNetworkSettings = useDefaultConfiguration([
    'clusterNetworkCidr',
    'serviceNetworkCidr',
    'clusterNetworkHostPrefix',
  ]);
  const { addAlert, clearAlerts } = useAlerts();
  const { setCurrentStepId } = React.useContext(ClusterWizardContext);
  const dispatch = useDispatch();
  const hostSubnets = React.useMemo(() => getHostSubnets(cluster), [cluster]);
  const initialValues = React.useMemo(
    () => getNetworkInitialValues(cluster, defaultNetworkSettings),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [], // just once, Formik does not reinitialize
  );

  const memoizedValidationSchema = React.useMemo(
    () => getNetworkConfigurationValidationSchema(initialValues, hostSubnets),
    [hostSubnets, initialValues],
  );

  const handleSubmit: FormikConfig<NetworkConfigurationValues>['onSubmit'] = async (
    values,
    actions,
  ) => {
    clearAlerts();

    // update the cluster configuration
    try {
      const isMultiNodeCluster = !isSingleNodeCluster(cluster);
      const isUserManagedNetworking = values.networkingType === 'userManaged';
      const params = _.omit(values, ['hostSubnet', 'useRedHatDnsService', 'networkingType']);
      params.userManagedNetworking = isUserManagedNetworking;
      params.machineNetworkCidr = hostSubnets.find(
        (hn) => hn.humanized === values.hostSubnet,
      )?.subnet;

      if (isUserManagedNetworking) {
        if (isMultiNodeCluster) {
          delete params.machineNetworkCidr;
        }

        delete params.apiVip;
        delete params.ingressVip;
      } else {
        // cluster-managed can't be chosen in SNO, so this must be a multi-node cluster
        if (values.vipDhcpAllocation) {
          delete params.apiVip;
          delete params.ingressVip;
        } else {
          delete params.machineNetworkCidr;
        }
      }

      const { data } = await patchCluster(cluster.id, params);
      dispatch(updateCluster(data));
      actions.resetForm({ values: getNetworkInitialValues(data, defaultNetworkSettings) });
    } catch (e) {
      handleApiError<ClusterUpdateParams>(e, () =>
        addAlert({ title: 'Failed to update the cluster', message: getErrorMessage(e) }),
      );
    }
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={memoizedValidationSchema}
      onSubmit={handleSubmit}
      initialTouched={_.mapValues(initialValues, () => true)}
      validateOnMount
    >
      {({ isSubmitting, dirty, errors, touched }: FormikProps<NetworkConfigurationValues>) => {
        const errorFields = getFormikErrorFields(errors, touched);
        const form = (
          <>
            <Grid hasGutter>
              <GridItem>
                <ClusterWizardStepHeader cluster={cluster}>Networking</ClusterWizardStepHeader>
              </GridItem>
              <GridItem span={12} lg={10} xl={9} xl2={7}>
                <NetworkConfigurationFormFields
                  cluster={cluster}
                  hostSubnets={hostSubnets}
                  defaultNetworkSettings={defaultNetworkSettings}
                />
              </GridItem>
              <GridItem>
                <TextContent>
                  <Text component="h2">Host inventory</Text>
                </TextContent>
                <NetworkingHostsTable cluster={cluster} TableComponent={ClusterHostsTable} />
              </GridItem>
            </Grid>
            <FormikAutoSave />
          </>
        );

        const footer = (
          <ClusterWizardFooter
            cluster={cluster}
            errorFields={errorFields}
            isSubmitting={isSubmitting}
            isNextDisabled={dirty || !canNextNetwork({ cluster })}
            onNext={() => setCurrentStepId('review')}
            onBack={() => setCurrentStepId('host-discovery')}
          />
        );
        return (
          <ClusterWizardStep
            navigation={<ClusterWizardNavigation cluster={cluster} />}
            footer={footer}
          >
            {form}
          </ClusterWizardStep>
        );
      }}
    </Formik>
  );
};

export default NetworkConfigurationForm;
