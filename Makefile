# RF Academy — local dev shortcuts.

.PHONY: help
help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
	  awk 'BEGIN{FS=":.*?## "}{printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

.PHONY: bootstrap
bootstrap: ## Bootstrap a Pi 5 node (k3s + ArgoCD + app-of-apps + WiFi AP)
	sudo ./clusters/rf-academy/bootstrap-pi.sh

.PHONY: root-app
root-app: ## Apply the app-of-apps root Application
	kubectl apply -f clusters/rf-academy/root-app.yaml

.PHONY: web
web: ## Build the React UI (type-check + bundle)
	cd web && npm install && npm run build

.PHONY: dev
dev: web ## Run the all-Rust backend locally (HackRF auto-detected; else simulator)
	cd server && STATIC_DIR=../web/dist cargo run --release

.PHONY: check
check: ## Type-check the Rust backend (needs libsoapysdr-dev pkg-config clang)
	cd server && cargo check

.PHONY: image
image: ## Build the single container image locally
	docker build -t rf-academy:dev .

.PHONY: lint
lint: ## Validate the kustomize build
	kubectl kustomize apps/rf-academy >/dev/null && echo "rf-academy OK"

.PHONY: validate
validate: ## Dry-run the ArgoCD Applications against the API server
	kubectl apply --dry-run=server -R -f clusters/rf-academy/apps/
