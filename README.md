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

The yaml file below is an example of how to define a kustomize patch
to install this UI extension:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: argocd-server
spec:
  template:
    spec:
      initContainers:
        - name: extension-metrics
          image: quay.io/argoprojlabs/argocd-extension-installer:v0.0.1
          env:
          - name: EXTENSION_URL
            value: https://github.com/argoproj-labs/argocd-extension-metrics/releases/download/v1.0.0/extension.tar.gz
          - name: EXTENSION_CHECKSUM_URL
            value: https://github.com/argoproj-labs/argocd-extension-metrics/releases/download/v1.0.0/extension_checksums.txt
          volumeMounts:
            - name: extensions
              mountPath: /tmp/extensions/
          securityContext:
            runAsUser: 1000
            allowPrivilegeEscalation: false
      containers:
        - name: argocd-server
          volumeMounts:
            - name: extensions
              mountPath: /tmp/extensions/
      volumes:
        - name: extensions
          emptyDir: {}
```

### Enabling the Metrics extension in Argo CD

Argo CD needs to have the proxy extension feature enabled for the
metrics extension to work. In order to do so add the following entry
in the `argocd-cmd-params-cm`:

```
server.enable.proxy.extension: "true"
```

The metrics extension needs to be authorized in Argo CD API server. To
enable it for all users add the following entry in `argocd-rbac-cm`:

```
policy.csv: |-
  p, role:readonly, extensions, invoke, metrics, allow
```

**Note**: make sure to assign a proper role to the extension policy if you
want to restrict users.

Finally Argo CD needs to be configured so it knows how to reach the
metrics server. In order to do so, add the following section in the
`argocd-cm`.

```
extension.config: |-
  extensions:
    - name: metrics
      backend:
        services:
          - url: <METRICS_SERVER_URL>
```

**Attention**: Make sure to change the `METRICS_SERVER_URL` to the URL
where argocd-metrics-server is configured. The metrics server URL
needs to be reacheable by the Argo CD API server.

## Contributing

TODO

[1]: https://github.com/argoproj-labs/argocd-extension-installer
