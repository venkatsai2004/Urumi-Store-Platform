# System Design and Tradeoffs

## Architecture

* Single platform deployment exposes dashboard UI + backend API
* Backend orchestrates per-store provisioning using `helm` and `kubectl`
* Each store is deployed as WordPress + MariaDB via Bitnami Helm chart
* Each store is isolated in its own namespace (`store-<id>`)

## End-to-End Flow


1. User submits store creation from dashboard
2. Backend validates inputs and generates safe store ID
3. Backend creates namespace
4. Backend installs WordPress chart with store-specific values
5. Backend applies namespace `ResourceQuota` (best-effort)
6. Dashboard polls and shows `Provisioning` -> `Ready` or `Failed`
7. On delete, backend uninstalls Helm release and deletes namespace

## Isolation, Persistence, and URLs

* Isolation: namespace per store
* Resource controls: namespace `ResourceQuota`
* Persistence: PVC-backed state from WordPress chart
* URL pattern:
* Dashboard: `dashboard.<domainSuffix>`
* Storefront: `store-<id>.<domainSuffix>`
* Admin: `store-<id>.<domainSuffix>/wp-admin`

## Idempotency and Failure Handling

* Store names are sanitized and IDs are RFC1123-compatible
* If provisioning fails, backend attempts cleanup with:
* `helm uninstall`
* namespace delete
* Quota apply failure does not force store-create failure
* Frontend timeout increased for long-running Kubernetes operations

## Security Posture

* Credentials are provided at create-time and validated server-side
* No static secrets hardcoded in repository
* Basic HTTP security middleware enabled in backend (`helmet`)
* Current gap: RBAC least-privilege and NetworkPolicy are not yet implemented

## Local-to-Production Story

* Same Helm chart for local and VPS/k3s
* Environment differences handled through values files:
* `values-local.yaml`: localhost domains, local ingress behavior
* `values-prod.yaml`: production domain, TLS/cert-manager annotations

## Tradeoffs

* Chosen depth over breadth: WooCommerce fully implemented; Medusa deferred
* Shell-based orchestration is simple and fast, but a controller/operator model would be more robust at scale
* Current solution prioritizes delivery speed for Round 1 while keeping extension path clear


