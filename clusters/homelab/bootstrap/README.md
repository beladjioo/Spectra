# Bootstrap — central homelab cluster

One-time setup to get GitOps running. After this, everything flows through git.

## 1. Install ArgoCD

```bash
kubectl create namespace argocd
kubectl apply -n argocd \
  -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
kubectl -n argocd rollout status deploy/argocd-server
```

Get the initial admin password:

```bash
kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath='{.data.password}' | base64 -d; echo
```

Port-forward the UI:

```bash
kubectl -n argocd port-forward svc/argocd-server 8080:443
# https://localhost:8080  (user: admin)
```

## 2. Apply the app-of-apps root

```bash
kubectl apply -f clusters/homelab/root-app.yaml
```

ArgoCD now self-manages every component in `clusters/homelab/apps/`.

## 3. Secrets

Real secrets never live in git. For the homelab, the quickest safe path is
[sealed-secrets](https://github.com/bitnami-labs/sealed-secrets) or
[SOPS + age](https://github.com/getsops/sops). Placeholders to replace:

- `spectra-grafana-admin` (Grafana admin password)
- `spectra-mqtt-creds` (per-sensor MQTT users — also needed on the edge)
