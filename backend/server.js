const express = require("express");
const { exec } = require("child_process");
const path = require("path");
const { customAlphabet } = require("nanoid");
const cors = require("cors");
const helmet = require("helmet");

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

const DOMAIN_SUFFIX = process.env.DOMAIN_SUFFIX || "localhost";
const PROTOCOL = process.env.PROTOCOL || "http";

const execPromise = (cmd) =>
  new Promise((resolve, reject) => {
    exec(cmd, { maxBuffer: 2 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) reject({ err, stdout, stderr });
      else resolve(stdout.trim());
    });
  });

const safeId = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 10);
const normalizeStoreName = (name) => {
  const fallback = "My Store";
  if (typeof name !== "string") return fallback;
  const trimmed = name.trim();
  if (!trimmed) return fallback;
  return trimmed.replace(/[^a-zA-Z0-9 .-]/g, "").slice(0, 60) || fallback;
};
const normalizeAdminUsername = (username) => {
  if (typeof username !== "string") return "";
  const trimmed = username.trim().toLowerCase();
  return /^[a-z0-9._-]{3,32}$/.test(trimmed) ? trimmed : "";
};
const normalizeAdminPassword = (password) => {
  if (typeof password !== "string") return "";
  const trimmed = password.trim();
  return /^[A-Za-z0-9@#%+=:_-]{8,64}$/.test(trimmed) ? trimmed : "";
};

app.get("/api/stores", async (req, res) => {
  try {
    const stdout = await execPromise("helm ls --all-namespaces -o json");
    const releases = JSON.parse(stdout);
    const stores = releases
      .filter((r) => r.name.startsWith("store-"))
      .map((r) => ({
        id: r.name.slice(6),
        status:
          r.status === "deployed"
            ? "Ready"
            : r.status === "failed"
              ? "Failed"
              : "Provisioning",
        createdAt: new Date().toLocaleString(),
        storefrontUrl: `${PROTOCOL}://${r.name}.${DOMAIN_SUFFIX}`,
        adminUrl: `${PROTOCOL}://${r.name}.${DOMAIN_SUFFIX}/wp-admin`,
      }));
    res.json(stores);
  } catch (e) {
    res.status(500).json({ error: "Failed to list stores" });
  }
});

app.post("/api/stores", async (req, res) => {
  const { name, adminUsername, adminPassword } = req.body;
  const safeStoreName = normalizeStoreName(name);
  const safeAdminUsername = normalizeAdminUsername(adminUsername);
  const safeAdminPassword = normalizeAdminPassword(adminPassword);
  const id = safeId();
  const releaseName = `store-${id}`;
  const ns = releaseName;
  const domain = `${releaseName}.${DOMAIN_SUFFIX}`;

  if (!safeAdminUsername || !safeAdminPassword) {
    return res.status(400).json({
      error:
        "Invalid credentials. Username: 3-32 chars [a-z0-9._-], Password: 8-64 chars [A-Za-z0-9@#%+=:_-]",
    });
  }

  try {
    await execPromise(
      `kubectl create ns ${ns} --dry-run=client -o yaml | kubectl apply -f -`,
    );

    const helmCmd = [
      `helm install ${releaseName} oci://registry-1.docker.io/bitnamicharts/wordpress`,
      `--namespace ${ns}`,
      `--set wordpressUsername=${safeAdminUsername}`,
      `--set wordpressPassword=${safeAdminPassword}`,
      `--set wordpressBlogName="${safeStoreName}"`,
      `--set wordpressEmail=admin@${domain}`,
      `--set resourcesPreset=micro`,
      `--set mariadb.resourcesPreset=micro`,
      `--set volumePermissions.enabled=false`,
      `--set metrics.enabled=false`,
      `--set ingress.enabled=true`,
      `--set ingress.hostname=${domain}`,
      `--set ingress.tls=false`,
      `--set ingress.ingressClassName=nginx`,
      `--set persistence.enabled=true`,
    ].join(" ");

    console.log("Running Helm:", helmCmd);
    await execPromise(helmCmd);


    try {
      await execPromise(
        `kubectl create resourcequota store-quota ` +
          `--hard=cpu=600m,memory=1.2Gi,pods=8,persistentvolumeclaims=2 ` +
          `-n ${ns} --dry-run=client -o yaml | kubectl apply -f -`,
      );
    } catch (quotaErr) {
      const quotaMsg =
        quotaErr.stderr || quotaErr.stdout || quotaErr.message || String(quotaErr);
      console.warn(`Quota apply failed for ${ns}:`, quotaMsg);
    }

    res.json({
      id,
      storefrontUrl: `${PROTOCOL}://${domain}`,
      adminUrl: `${PROTOCOL}://${domain}/wp-admin`,
      adminUsername: safeAdminUsername,
      adminPassword: safeAdminPassword,
      note: "Use these credentials to log in to wp-admin.",
    });
  } catch (e) {
    await execPromise(`helm uninstall ${releaseName} -n ${ns} || true`);
    await execPromise(`kubectl delete ns ${ns} || true`);
    const errorMsg = e.stderr || e.stdout || e.message || String(e);
    console.error("Error:", errorMsg);
    res.status(500).json({
      error: "Failed – check pod logs",
      details: errorMsg.substring(0, 1500),
    });
  }
});

app.delete("/api/stores/:id", async (req, res) => {
  const id = req.params.id;
  const releaseName = `store-${id}`;
  const ns = releaseName;
  try {
    await execPromise(`helm uninstall ${releaseName} -n ${ns} || true`);
    await execPromise(`kubectl delete ns ${ns} || true`);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Delete failed" });
  }
});

app.use(express.static(path.join(__dirname, "public")));
app.get("*", (req, res) =>
  res.sendFile(path.join(__dirname, "public/index.html")),
);

app.listen(3000, () => console.log("Backend running on port 3000"));
