# Field cluster — survey on the laptop

Same GitOps repo, a **local k3s** on the survey laptop. The HackRF plugs into the
laptop; ArgoCD pulls this repo and runs the lean survey stack
(mosquitto + edge agent + gateway + web). Open the UI at **http://localhost:30920**
(localhost is a secure context, so the browser GPS works).

## 1. k3s on the laptop

**Linux laptop:**
```bash
curl -sfL https://get.k3s.io | sh -
export KUBECONFIG=/etc/rancher/k3s/k3s.yaml
```

**Windows laptop (WSL2):** run everything inside a WSL2 Ubuntu, then install k3s
as above. Two WSL specifics:
- enable systemd in `/etc/wsl.conf` (`[boot] systemd=true`) so k3s runs as a service;
- pass the HackRF USB into WSL with **usbipd-win** on the Windows side:
  ```powershell
  usbipd list
  usbipd bind --busid <hackrf-busid>
  usbipd attach --wsl --busid <hackrf-busid>
  ```

## 2. ArgoCD + the field app-of-apps

```bash
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
kubectl -n argocd rollout status deploy/argocd-server

kubectl apply -f clusters/field/root-app.yaml
```

## 3. Tell the agent where the HackRF is

```bash
hackrf_info                                   # confirm the HackRF is seen
kubectl label node "$(hostname)" spectra.io/hackrf=true
```

ArgoCD now runs the survey stack. Open **http://localhost:30920**, allow location,
press *Démarrer le relevé*, and walk/drive the commune.

> The HackRF is less sensitive than your Multitech concentrator — the map is
> indicative (if the HackRF hears it, the gateway will; not necessarily the reverse).
> Use it to spot noisy/quiet zones and the best gateway location.
