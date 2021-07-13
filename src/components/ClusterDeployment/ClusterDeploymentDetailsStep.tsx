import React from 'react';
import { Formik } from 'formik';

import {
  getClusterDetailsInitialValues,
  getClusterDetailsValidationSchema,
} from '../clusterWizard/utils';
import { Cluster } from '../../api';
import { OpenshiftVersionOptionType } from '../../types';
import { useAlerts } from '../AlertsContextProvider';

import ClusterDeploymentDetails from './ClusterDeploymentDetails';
import { ClusterDeploymentDetailsStepProps, ClusterDeploymentDetailsValues } from './types';

const getInitialValues = ({
  cluster,
  ocpVersions,
  defaultPullSecret: pullSecret,
}: {
  cluster?: Cluster;
  ocpVersions: OpenshiftVersionOptionType[];
  defaultPullSecret?: string;
}): ClusterDeploymentDetailsValues =>
  getClusterDetailsInitialValues({
    managedDomains: [], // not supported
    cluster,
    pullSecret,
    ocpVersions,
  });

const getValidationSchema = (usedClusterNames: string[], cluster?: Cluster) =>
  getClusterDetailsValidationSchema(usedClusterNames, cluster);

const ClusterDeploymentDetailsStep: React.FC<ClusterDeploymentDetailsStepProps> = ({
  defaultPullSecret,
  ocpVersions,
  cluster,
  usedClusterNames,
  onSaveDetails,
  onValuesChange,
}) => {
  const { addAlert } = useAlerts();

  const initialValues = React.useMemo(
    () => getInitialValues({ cluster, ocpVersions, defaultPullSecret }),
    [], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const validationSchema = React.useMemo(() => getValidationSchema(usedClusterNames, cluster), [
    usedClusterNames,
    cluster,
  ]);

  const handleSubmit = async (values: ClusterDeploymentDetailsValues) => {
    try {
      await onSaveDetails(values);
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
          <ClusterDeploymentDetails
            onValuesChange={onValuesChange}
            ocpVersions={ocpVersions}
            defaultPullSecret={defaultPullSecret}
            cluster={cluster}
            {...formikProps}
          />
        );
      }}
    </Formik>
  );
};

export default ClusterDeploymentDetailsStep;
