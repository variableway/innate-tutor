import { LocalIdentityProvider } from "./local-provider";
import type { IdentityProvider, IdentityProviderId } from "./types";
import { IdentityError } from "./types";
import { getServerEnv } from "../env";

/**
 * Resolve the active IdentityProvider.
 * Today: `local`. Tomorrow: `oidc` → Authentik/OIDC adapter implementing
 * authenticateWithExternalSubject, then the same session cookie layer.
 */
export function getIdentityProvider(): IdentityProvider {
  const id = getServerEnv().identityProvider;
  switch (id) {
    case "local":
      return new LocalIdentityProvider();
    case "oidc":
      throw new IdentityError(
        "OIDC IdentityProvider is not wired yet; keep IDENTITY_PROVIDER=local",
        "UNSUPPORTED",
      );
    default:
      throw new IdentityError(`Unknown IDENTITY_PROVIDER: ${id}`, "UNSUPPORTED");
  }
}

export function getConfiguredIdentityProviderId(): IdentityProviderId {
  return getServerEnv().identityProvider;
}
