import { createOpenMaicAdapter } from "@innate/openmaic-adapter";
import { getServerEnv } from "./env";

export function getOpenMaicAdapter() {
  const env = getServerEnv();
  return createOpenMaicAdapter({
    baseUrl: env.openmaicBaseUrl,
    publicBaseUrl: env.openmaicPublicUrl,
  });
}
