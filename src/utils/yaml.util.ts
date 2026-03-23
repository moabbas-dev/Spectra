import * as yaml from 'js-yaml';
import type { OpenApiDoc } from '../types/openapi.types';

/**
 * Parse a YAML (or JSON) string into an OpenApiDoc.
 * Returns null if parsing fails.
 */
export function parseOpenApiYaml(content: string): OpenApiDoc | null {
  try {
    const doc = yaml.load(content) as OpenApiDoc | undefined;
    if (!doc || typeof doc !== 'object') return null;
    return doc;
  } catch {
    return null;
  }
}

/**
 * Serialize an OpenApiDoc back to YAML.
 * Uses block style for readability, 2-space indent.
 */
export function serializeOpenApiYaml(doc: OpenApiDoc): string {
  return yaml.dump(doc, {
    indent: 2,
    lineWidth: 120,
    noRefs: true,
    quotingType: '"',
    forceQuotes: false,
    sortKeys: false,
  });
}

/** Check if the document is OpenAPI 3.x */
export function isOpenApi3x(doc: OpenApiDoc): boolean {
  return typeof doc.openapi === 'string' && doc.openapi.startsWith('3.');
}

/** Check if the document is Swagger 2.0 */
export function isSwagger2(doc: OpenApiDoc): boolean {
  return doc.swagger === '2.0';
}
