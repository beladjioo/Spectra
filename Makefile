# Spectra — local dev shortcuts. Override REGISTRY/IMAGE to push to your own registry.
REGISTRY ?= ghcr.io/CHANGEME
IMAGE    ?= $(REGISTRY)/spectra-edge-agent
TAG      ?= dev
PLATFORMS ?= linux/amd64,linux/arm64

.PHONY: help
help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
	  awk 'BEGIN{FS=":.*?## "}{printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'

.PHONY: bootstrap
bootstrap: ## Install ArgoCD on the homelab cluster
	kubectl create namespace argocd --dry-run=client -o yaml | kubectl apply -f -
	kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
	kubectl -n argocd rollout status deploy/argocd-server

.PHONY: root-app
root-app: ## Apply the app-of-apps root Application
	kubectl apply -f clusters/homelab/root-app.yaml

.PHONY: edge-build
edge-build: ## Build the edge agent image (multi-arch)
	docker buildx build --platform $(PLATFORMS) -t $(IMAGE):$(TAG) edge/agent

.PHONY: edge-push
edge-push: ## Build and push the edge agent image
	docker buildx build --push --platform $(PLATFORMS) -t $(IMAGE):$(TAG) edge/agent

.PHONY: agent-run
agent-run: ## Run the agent locally against a local config.yaml (needs a HackRF)
	cd edge/agent && python3 agent.py

.PHONY: lint
lint: ## Validate kustomize builds and YAML
	kustomize build apps/mosquitto >/dev/null && echo "mosquitto OK"
	kustomize build apps/alerting   >/dev/null && echo "alerting OK"
	kustomize build apps/grafana    >/dev/null && echo "grafana OK"
	kustomize build edge/flux       >/dev/null && echo "edge OK"

.PHONY: validate
validate: ## Dry-run all ArgoCD Applications against the API server
	kubectl apply --dry-run=server -R -f clusters/homelab/apps/
