//Wrapper for fetch
export const apiCall = (url: string, headers: Record<string, string>) => {
  return fetch(url, { headers })
    .then((res) => res.json())
    .then((res) => res)
    .catch((err) => {
      throw err;
    });
};

//Fetches the configuration needed for rendering charts based on resource kind from configmap.yaml present in the manifests directory of argocd-extension-metrics.
export function getDashBoard({
  applicationName,
  namespace,
  resourceType,
  project,
}: {
  applicationName: string;
  namespace: string;
  resourceType: string;
  project: string;
}) {
  const url = `/extensions/metrics/api/applications/${applicationName}/groupkinds/${resourceType.toLowerCase()}/dashboards`;
  return apiCall(url, getHeaders({ applicationName, namespace, project }))
    .then((response) => {
      if (response.status > 399) {
        throw new Error("No metrics");
      }
      return response.json();
    })
    .then((data: any) => {
      return data;
    })
    .catch((err) => {
      throw err;
    });
}

//Creates and returns the custom headers needed for the argocd-extension-metrics
export function getHeaders({
  applicationName,
  namespace,
  project,
}: {
  applicationName: string;
  namespace: string;
  project: string;
}) {
  const argocdApplicationName = `${namespace}:${applicationName}`;
  return {
    "Argocd-Application-Name": `${argocdApplicationName}`,
    "Argocd-Project-Name": `${project}`,
  };
}
