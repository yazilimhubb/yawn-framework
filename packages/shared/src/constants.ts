export const YAWN_VERSION = '0.1.0';

/** Attribute used by the runtime to mark hydration roots. */
export const HYDRATION_ATTR = 'data-yawn-root';

/** Custom element prefix used in .yawn templates. */
export const COMPONENT_PREFIX = 'con:';

/** Placeholder pattern in .yawn templates: {{propName}} */
export const PLACEHOLDER_RE = /\{\{([^}]+)\}\}/g;
