import React from 'react';
import { Cluster } from '../../api/types';
import { getClusterDownloadsImageUrl } from '../../api/clusters';
import DownloadISO from './DownloadIso';

type DiscoveryImageSummaryProps = {
  cluster: Cluster;
  imageInfo: Cluster['imageInfo'];
  onClose: () => void;
  onReset?: () => void;
};

const DiscoveryImageSummary: React.FC<DiscoveryImageSummaryProps> = ({
  cluster,
  imageInfo,
  ...restProps
}) => {
  const isoPath = getClusterDownloadsImageUrl(cluster.id);
  const isoUrl = `${window.location.origin}${isoPath}`;
  const downloadUrl = imageInfo.downloadUrl || isoUrl;

  return (
    <DownloadISO
      fileName={`discovery_image_${cluster.name}.iso`}
      downloadUrl={downloadUrl}
      {...restProps}
    />
  );
};

export default DiscoveryImageSummary;
