# ArgoCD Extension Metrics
The project introduces the ArgoCD extension to enable Metrics on Resource tab.
![](./docs/images/screenshot.png)
# Quick Start

- Install Argo CD and Argo CD Extensions Controller: https://github.com/argoproj-labs/argocd-extensions
- Create `argocd-metrics-server` deployment in `argocd` namespace
```sh
kubectl apply -n argocd \
    -f https://raw.githubusercontent.com/argoproj-labs/argocd-extension-metrics/main/manifests/install.yaml

```
- Create `argocd-extension-metrics` extension in `argocd` namespace
```
kubectl apply -n argocd \
    -f https://raw.githubusercontent.com/argoproj-labs/argocd-extension-metrics/main/manifests/extension.yaml
```