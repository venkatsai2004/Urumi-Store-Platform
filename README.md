#  I’ll now generate a complete [README.md](https://file+.vscode-resource.vscode-cdn.net/c%3A/Users/venka/.vscode/extensions/openai.chatgpt-0.4.73-win32-x64/webview/#) + update [system-design.md](https://file+.vscode-resource.vscode-cdn.net/c%3A/Users/venka/.vscode/extensions/openai.chatgpt-0.4.73-win32-x64/webview/#) to match current behavior.

 \n Urumi Store Provisioning Platform (Round 1)

WooCommerce-focused store provisioning platform on Kubernetes, designed to run locally and on VPS/k3s with Helm values changes only.

## Scope

* Implemented engine: `WooCommerce` (WordPress + MariaDB via Bitnami chart)
* Medusa: not implemented in Round 1 (intentionally out of scope)
* Multi-store: supported
* Isolation model: one namespace per store

This is valid for Round 1 because the assignment allows fully implementing either WooCommerce or Medusa, with the other left as stub/extension.

## Architecture

* Dashboard: React UI for create/list/delete stores
* API/Orchestrator: Node.js service that runs `helm` and `kubectl`
* Per-store deployment: Helm install of Bitnami WordPress chart into dedicated namespace
* Networking: Ingress host per store (`store-<id>.<domainSuffix>`)
* Persistence: PVC-backed WordPress/MariaDB from chart defaults
* Cleanup: `helm uninstall` + namespace delete

## Repository Layout

* `frontend/`: React dashboard
* `backend/`: Node API + orchestration logic
* `charts/platform/`: Helm chart for platform deployment
* `charts/platform/values-local.yaml`: local overrides
* `charts/platform/values-prod.yaml`: production-like overrides
* `system-design.md`: design notes and tradeoffs

## Prerequisites

* Docker Desktop with Kubernetes enabled (or Kind/k3d/Minikube)
* `kubectl`
* `helm` (v3+)
* Local ingress controller (Nginx ingress for Docker Desktop Kubernetes)

## Local Setup


1. Build backend image (includes frontend build):

```bat
cd d:\urumi-store-platform
docker build -t urumi-backend:v11 -f backend/Dockerfile .
```


2. Set image tag in `charts/platform/values.yaml`:

* `image.repository: urumi-backend`
* `image.tag: v11`
* `image.pullPolicy: IfNotPresent`


3. Deploy chart:

```bat
helm upgrade urumi ./charts/platform -f ./charts/platform/values.yaml -f ./charts/platform/values-local.yaml
kubectl rollout restart deployment/urumi-platform
kubectl rollout status deployment/urumi-platform
kubectl get pods
```


4. Open dashboard:

* `http://dashboard.localhost`

## VPS / Production-like Setup (k3s)

Use the same chart, changing values only.


1. Build and push image to registry:

```bash
docker build -t <registry>/urumi-backend:v11 -f backend/Dockerfile .
docker push <registry>/urumi-backend:v11
```


2. Update `charts/platform/values-prod.yaml`:

* `domainSuffix: <your-domain>`
* `image.repository: <registry>/urumi-backend`
* `image.tag: v11`
* ingress class / TLS / cert-manager annotations as needed
* storageClass overrides if required by VPS cluster


3. Deploy:

```bash
helm upgrade --install urumi ./charts/platform -f ./charts/platform/values.yaml -f ./charts/platform/values-prod.yaml
kubectl rollout status deployment/urumi-platform
```

## User Flow


1. Open `http://dashboard.localhost`
2. Enter:

* Store name (optional)
* Admin username
* Admin password


3. Click `Create WooCommerce Store`
4. Wait until status is `Ready`
5. Open `Storefront` or `Admin`
6. Delete from dashboard when done

## Definition of Done Validation (WooCommerce)

Run this flow for at least one created store:


1. Open storefront from dashboard (`Open` link)
2. Add product to cart (use default or create one in admin first)
3. Checkout with a test-friendly method (for demo: COD/dummy/manual method)
4. Confirm order exists in WooCommerce admin (`wp-admin`)

Note: payment provider integration is not required for Round 1; test/dummy checkout path is sufficient.

## Current Status vs Assignment

* Implemented: dashboard create/list/delete, provisioning, namespace isolation, ingress URLs, cleanup, local/prod values split
* Implemented: WooCommerce path end-to-end
* Not implemented: Medusa engine (out of scope for this submission)
* To provide during submission: demo video link and form submission confirmation

## Reliability and Failure Handling

* Store ID format is RFC1123-safe for namespace naming
* Quota creation is best-effort; store provisioning can still succeed
* Frontend API timeout increased for long Kubernetes operations
* Error messages surfaced to UI for create/delete failures

## Security Notes

* No hardcoded store admin credentials in source; user provides them at creation time
* Per-store namespace isolation
* Platform API protected by default container/network boundaries only (no auth layer yet)

## Known Gaps / Future Work

* Add engine selector (`woocommerce` vs `medusa`) and Medusa provisioning path
* Add readiness/liveness probes to platform deployment
* Add RBAC-scoped service account for least privilege
* Add activity/audit logs and basic metrics
* Add rate limiting and per-user quotas

## Demo and Submission

* Demo video: add your final link here
* GitHub repo: add your final link here
* Form URL (given in assignment): `https://dashboard.urumi.ai/s/roundoneform2026sde`


