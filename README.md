# ArgoCD Extension Metrics

The project introduces the ArgoCD extension to enable Metrics on Resource tab.
![](./docs/images/screenshot.png)

This extension is composed by 2 components:
- `argocd-metrics-server` is a backend service that queries and expose
  prometheus metrics to the UI extension
- UI extension render graphs based on metrics returned by the `argocd-metrics-server`

## Prerequisites

- Argo CD version 2.6+
- Prometheus

## Quick Start

### Install `argocd-metrics-server`

The `manifests` folder in this repo contains an example of how the
`argocd-metrics-server` can be installed.

```sh
git clone https://github.com/argoproj-labs/argocd-extension-metrics.git
cd argocd-extension-metrics
kustomize build ./manifests | kubectl apply -f -
```

All graphs are configured in the `argocd-metrics-server-configmap`.
The example configmap provided in the `manifests` defines how to
extract and query Prometheus to display the golden signal metrics in
Argo CD UI. This configmap must be changed depending on the metrics
available in your Prometheus instance.


### Install UI extension

The UI extension needs to be installed by mounting the React component
in Argo CD API server. This process can be automated by using the
[argocd-extension-installer][1]. This installation method will run an
init container that will download, extract and place the file in the
correct location.




## Contributing

TODO

[1]: https://github.com/argoproj-labs/argocd-extension-installer
