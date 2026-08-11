export {
  assembleTrustedContext,
  buildTrustedPrompt,
  promptContainsForgedBody,
  TutorContextError,
} from "./assemble-context.js";
export {
  DEFAULT_TOOL_ALLOWLIST,
  HIGH_RISK_TOOLS,
  enforceToolAllowlist,
} from "./tools.js";
export {
  normalizeDeepTutorMessage,
  resetSeqForTests,
  tutorUnavailableEvent,
} from "./normalize.js";
export {
  checkDeepTutorHealth,
  reconnectTutorTurn,
  startTrustedTutorTurn,
  type DeepTutorWsOptions,
  type TutorTurnHandle,
} from "./ws-client.js";
export { openPlayerIndependently, type OpenPlayerResult } from "./player-degrade.js";
