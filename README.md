# Argo CD Extension Metrics

The project introduces the Argo CD extension to enable Metrics on Resource tab.

![Argo CD resource tab showing metrics for the selected Pod.](./docs/images/screenshot.png)

## Quick Start

### Prerequisites

* Install `yq`
* Build the extension image: `make image`

### Setup

Set up a local cluster. These instructions were tested with kind v0.17.0 on OSX.

```shell
kind create cluster
```

If using `kind`, load the metrics service image.

```shell
kind load docker-image docker.io/argoproj/argocd-metrics-server:latest
```

Then install the quick-start manifests. This includes:
* Argo CD
* Argo CD Extensions controller
* This UI extension
* kube-prometheus-stack

```sh
# Create namespaces for dependencies.
kubectl create ns argocd
kubectl create ns monitoring

# Install CRDs first.
kustomize build manifests/quick-start/ --enable-helm | yq 'select(.kind == "CustomResourceDefinition")' | kubectl apply --server-side -f -

# Install everything else.
kustomize build manifests/quick-start/ --enable-helm | yq 'select(.kind != "CustomResourceDefinition")' | kubectl apply --server-side -f -
```

In two different terminals:

```shell
kubectl port-forward svc/argocd-server -n argocd 8080:443
```

```shell
kubectl port-forward svc/argocd-metrics-server -n argocd 8081:9003
```

Log in to the [local Argo CD UI](https://localhost:8080/applications/argocd/bootstrap?view=tree&resource=) with username/password `admin`/`password`.

Visit the [port-forwarded metrics service](https://localhost:8081/api/extension/metrics/applications/test/groupkinds/pod/dashboards) and override the certificate warning.
This will allow the Argo CD UI to load metrics from that endpoint.

Finally, click any Pod in the UI and then click the Metrics tab.

# Enable the Argo UI to access the Argo CD Metrics Server.

## Argo CD < v2.5

Argo CD version less than v2.5 doesn't support the `Backend Proxy`. You have to configure the Ingress to deviate the API calls between Argo CD server and Argo CD metrics Server
```yaml
spec:
  rules:
  - http:
      paths:
      - backend:
          service:
            name: argocd-o11y-server
            port:
              number: 9003
        path: /api/extension/metrics
        pathType: Prefix
      - backend:
          service:
            name: argocd-server
            port:
              number: 80
        path: /
        pathType: Prefix
```

## Argo CD > v2.6

Argo CD Team is working to implemented backend proxy [proposal](https://github.com/argoproj/argo-cd/blob/master/docs/proposals/proxy-extensions.md)

## Developing the UI extension

1. Follow the [quick start instructions](#quick-start) above to set
2. Fork this repo and clone it (for examples, we'll assume your user name is `EXAMPLE-USER`)
3. Create a new branch (for examples, we'll use the name `NEW-FEATURE`)
4. Edit the [extension install manifest](manifests/extension/extension.yaml) to point to your user and branch:

    ```yaml
    apiVersion: argoproj.io/v1alpha1
    kind: ArgoCDExtension
    spec:
      sources:
        - web:
            url: https://github.com/EXAMPLE-USER/argocd-extension-metrics/raw/NEW-FEATURE/extensions/resource-metrics/resource-metrics-extention/ui/dist/extension.tar
    ```

5. Make changes to [extension source code](extensions/resource-metrics/resource-metrics-extention/ui)
6. `cd` to `extensions/resource-metrics/resource-metrics-extention/ui`
7. Build the modified extension code with `make build`
8. `git add . && git commit -m "my message" && git push` to push the new build
9. `kubectl delete argocdextension argocd-metrix-ext -n argocd`
10. Wait a few seconds for Argo CD to notice the missing resource and re-create it - this will install the new version of
    the extension in the API server
11. Refresh the Argo CD UI to load the new extension code

## Developing the metrics service

1. Follow the [quick start instructions](#quick-start) above to set
2. Make changes to the metrics service code
3. Run `make image` to build the service
4. Run `kind load docker-image docker.io/argoproj/argocd-metrics-server:latest` (or the equivalent for your local cluster)
5. Run `kubectl rollout restart deployment/argocd-metrics-server -n argocd` to restart the metrics server and load the new image
6. Run `kubectl port-forward svc/argocd-metrics-server -n argocd 8081:9003` to restart the port-forward to the metrics service
7. Visit the [metrics service](https://localhost:8081/api/extension/metrics/applications/test/groupkinds/pod/dashboards) in your browser and override the cert warning
8. Refresh the Argo CD UI to start loading data from the new service code
