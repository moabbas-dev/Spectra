import type { OpenApiDoc } from '../types/openapi.types';

/**
 * List of advanced YAML constructs that the form editor cannot fully represent.
 * Returns an array of human-readable descriptions of unsupported constructs found.
 * An empty array means the form editor can handle the document fully.
 */
export function detectAdvancedYamlConstructs(doc: OpenApiDoc): string[] {
  const issues: string[] = [];

  // Check for x- extensions at root level
  for (const key of Object.keys(doc)) {
    if (key.startsWith('x-')) {
      issues.push(`Root-level extension: ${key}`);
    }
  }

  // Check for callbacks in operations
  if (doc.paths) {
    for (const [pathKey, pathItem] of Object.entries(doc.paths)) {
      if (!pathItem || typeof pathItem !== 'object') continue;

      for (const key of Object.keys(pathItem)) {
        if (key.startsWith('x-')) {
          issues.push(`Extension on path ${pathKey}: ${key}`);
        }
      }

      const methods = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'trace'] as const;
      for (const method of methods) {
        const op = pathItem[method];
        if (!op) continue;

        // Check for callbacks
        if ('callbacks' in op && (op as Record<string, unknown>).callbacks) {
          issues.push(`Callbacks in ${method.toUpperCase()} ${pathKey}`);
        }

        // Check for x- extensions on operations
        for (const opKey of Object.keys(op)) {
          if (opKey.startsWith('x-')) {
            issues.push(`Extension on ${method.toUpperCase()} ${pathKey}: ${opKey}`);
          }
        }

        // Check for links in responses
        if (op.responses) {
          for (const [statusCode, response] of Object.entries(op.responses)) {
            if (response && typeof response === 'object' && 'links' in response) {
              issues.push(`Links in response ${statusCode} of ${method.toUpperCase()} ${pathKey}`);
            }
          }
        }
      }
    }
  }

  // Check for complex schema composition at path item level
  if (doc.paths) {
    for (const [pathKey, pathItem] of Object.entries(doc.paths)) {
      if (!pathItem) continue;
      if ('allOf' in pathItem || 'anyOf' in pathItem || 'oneOf' in pathItem) {
        issues.push(`Schema composition (allOf/anyOf/oneOf) on path ${pathKey}`);
      }
    }
  }

  // Check for components sections the form doesn't support yet
  if (doc.components) {
    const unsupportedComponentSections = ['links', 'callbacks'] as const;
    for (const section of unsupportedComponentSections) {
      if (section in doc.components && (doc.components as Record<string, unknown>)[section]) {
        issues.push(`Components section: ${section}`);
      }
    }
  }

  // Check for webhooks (OpenAPI 3.1)
  if ('webhooks' in doc && (doc as Record<string, unknown>).webhooks) {
    issues.push('Webhooks (OpenAPI 3.1)');
  }

  // Check for jsonSchemaDialect (OpenAPI 3.1)
  if ('jsonSchemaDialect' in doc && (doc as Record<string, unknown>).jsonSchemaDialect) {
    issues.push('JSON Schema dialect (OpenAPI 3.1)');
  }

  return issues;
}
