/**
 * Innate Identity contracts.
 *
 * Local password auth is the default provider today. OIDC (e.g. Authentik)
 * should implement the same Principal + IdentityProvider surfaces so BFF
 * session, catalog, runtime, and agent code only depend on Principal.
 */

export type MembershipRole = "owner" | "admin" | "author" | "learner";

export type IdentityProviderId = "local" | "oidc";

/** Stable subject derived from an IdP; for local this is the user UUID. */
export interface IdentitySubject {
  issuer: string;
  subject: string;
}

export interface Principal {
  userId: string;
  tenantId: string;
  role: MembershipRole;
  email: string;
  displayName: string;
  /** Which IdP authenticated this principal. */
  provider: IdentityProviderId;
  /** IdP subject pair — used for linking OIDC accounts later. */
  identity: IdentitySubject;
}

export interface RegisterLocalInput {
  email: string;
  password: string;
  displayName?: string;
}

export interface LoginLocalInput {
  email: string;
  password: string;
}

/**
 * Provider port. Local implements register + authenticateWithPassword.
 * Future OidcProvider implements authenticateWithExternalSubject (and skips
 * local password APIs).
 */
export interface IdentityProvider {
  readonly id: IdentityProviderId;

  registerLocal?(input: RegisterLocalInput): Promise<Principal>;
  authenticateWithPassword?(input: LoginLocalInput): Promise<Principal>;

  /**
   * Upsert/link a user from an external IdP (OIDC) and return a Principal.
   * Local provider does not implement this.
   */
  authenticateWithExternalSubject?(input: {
    identity: IdentitySubject;
    email: string;
    displayName?: string;
  }): Promise<Principal>;
}

export class IdentityError extends Error {
  constructor(
    message: string,
    readonly code:
      | "INVALID_CREDENTIALS"
      | "EMAIL_TAKEN"
      | "VALIDATION"
      | "UNSUPPORTED"
      | "UNAUTHORIZED"
      | "SESSION_EXPIRED",
  ) {
    super(message);
    this.name = "IdentityError";
  }
}
