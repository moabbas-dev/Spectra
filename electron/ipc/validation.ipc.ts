import type { IpcMainInvokeEvent } from 'electron';
import * as yaml from 'js-yaml';

interface ValidationIssue {
  severity: 'error' | 'warning' | 'info';
  line?: number;
  code: string;
  message: string;
}

export function registerValidationIpc(
  handle: (
    channel: string,
    listener: (
      event: IpcMainInvokeEvent,
      ...args: unknown[]
    ) => unknown | Promise<unknown>,
  ) => void,
  IPC: Record<string, string>,
): void {
  const VALIDATE_SPEC_CHANNEL = IPC.VALIDATE_SPEC ?? 'validate:spec';
  const VALIDATE_REALTIME_CHANNEL = IPC.VALIDATE_REALTIME ?? 'validate:realtime';

  /**
   * VALIDATE_SPEC — Parse and validate an OpenAPI YAML/JSON string.
   * Returns ValidationIssue[] with detected problems.
   */
  handle(VALIDATE_SPEC_CHANNEL, (_e, content: unknown) => {
    const raw = content as string;
    if (!raw || typeof raw !== 'string') {
      return [
        {
          severity: 'error' as const,
          code: 'empty-content',
          message: 'No content to validate',
        },
      ];
    }

    const issues: ValidationIssue[] = [];

    // Step 1: Parse YAML
    let doc: Record<string, unknown>;
    try {
      const parsed = yaml.load(raw);
      if (!parsed || typeof parsed !== 'object') {
        return [
          {
            severity: 'error' as const,
            code: 'invalid-yaml',
            message: 'Document is not a valid YAML object',
          },
        ];
      }
      doc = parsed as Record<string, unknown>;
    } catch (err) {
      const yamlErr = err as { mark?: { line?: number }; message?: string };
      return [
        {
          severity: 'error' as const,
          line: yamlErr.mark?.line ? yamlErr.mark.line + 1 : undefined,
          code: 'yaml-syntax',
          message: `YAML syntax error: ${yamlErr.message ?? 'Unknown error'}`,
        },
      ];
    }

    // Step 2: Check OpenAPI version
    const openapi = doc.openapi as string | undefined;
    const swagger = doc.swagger as string | undefined;

    if (!openapi && !swagger) {
      issues.push({
        severity: 'error',
        code: 'missing-version',
        message: 'Missing "openapi" or "swagger" version field',
      });
    } else if (openapi) {
      if (!/^3\.\d+\.\d+$/.test(openapi)) {
        issues.push({
          severity: 'warning',
          code: 'invalid-openapi-version',
          message: `OpenAPI version "${openapi}" may not be valid. Expected format: 3.x.x`,
        });
      }
    } else if (swagger) {
      if (swagger !== '2.0') {
        issues.push({
          severity: 'warning',
          code: 'invalid-swagger-version',
          message: `Swagger version "${swagger}" is unexpected. Expected: 2.0`,
        });
      }
    }

    // Step 3: Check required fields
    const info = doc.info as Record<string, unknown> | undefined;
    if (!info) {
      issues.push({
        severity: 'error',
        code: 'missing-info',
        message: 'Missing required "info" object',
      });
    } else {
      if (!info.title) {
        issues.push({
          severity: 'error',
          code: 'missing-info-title',
          message: 'Missing required "info.title" field',
        });
      }
      if (!info.version) {
        issues.push({
          severity: 'error',
          code: 'missing-info-version',
          message: 'Missing required "info.version" field',
        });
      }
    }

    // Step 4: Check paths
    const paths = doc.paths as Record<string, unknown> | undefined;
    if (!paths) {
      issues.push({
        severity: 'warning',
        code: 'missing-paths',
        message: 'No "paths" defined. API has no endpoints.',
      });
    } else {
      const httpMethods = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'trace'];
      const operationIds = new Set<string>();

      for (const [pathKey, pathItem] of Object.entries(paths)) {
        if (!pathKey.startsWith('/')) {
          issues.push({
            severity: 'warning',
            code: 'invalid-path',
            message: `Path "${pathKey}" should start with /`,
          });
        }

        if (!pathItem || typeof pathItem !== 'object') continue;
        const pathObj = pathItem as Record<string, unknown>;

        for (const method of httpMethods) {
          const op = pathObj[method] as Record<string, unknown> | undefined;
          if (!op) continue;

          // Check operationId uniqueness
          const opId = op.operationId as string | undefined;
          if (opId) {
            if (operationIds.has(opId)) {
              issues.push({
                severity: 'error',
                code: 'duplicate-operation-id',
                message: `Duplicate operationId "${opId}" in ${method.toUpperCase()} ${pathKey}`,
              });
            }
            operationIds.add(opId);
          } else {
            issues.push({
              severity: 'info',
              code: 'missing-operation-id',
              message: `Missing operationId in ${method.toUpperCase()} ${pathKey}`,
            });
          }

          // Check responses
          if (!op.responses) {
            issues.push({
              severity: 'warning',
              code: 'missing-responses',
              message: `Missing "responses" in ${method.toUpperCase()} ${pathKey}`,
            });
          }

          // Check for missing description/summary
          if (!op.summary && !op.description) {
            issues.push({
              severity: 'info',
              code: 'missing-description',
              message: `No summary or description in ${method.toUpperCase()} ${pathKey}`,
            });
          }
        }
      }
    }

    // Step 5: Check components for unused schemas
    const components = doc.components as Record<string, unknown> | undefined;
    if (components) {
      const schemas = components.schemas as Record<string, unknown> | undefined;
      if (schemas) {
        const schemaNames = Object.keys(schemas);
        const rawContent = raw;
        for (const name of schemaNames) {
          const refPattern = `#/components/schemas/${name}`;
          // Count references (excluding the definition itself)
          const refs = rawContent.split(refPattern).length - 1;
          if (refs === 0) {
            issues.push({
              severity: 'info',
              code: 'unused-schema',
              message: `Schema "${name}" is defined but never referenced`,
            });
          }
        }
      }
    }

    // If no issues found, return a positive result
    if (issues.length === 0) {
      return [];
    }

    return issues;
  });

  /**
   * VALIDATE_REALTIME — lightweight real-time validation (YAML parse only).
   */
  handle(VALIDATE_REALTIME_CHANNEL, (_e, content: unknown) => {
    const raw = content as string;
    if (!raw || typeof raw !== 'string') return [];

    try {
      yaml.load(raw);
      return [];
    } catch (err) {
      const yamlErr = err as { mark?: { line?: number }; message?: string };
      return [
        {
          severity: 'error' as const,
          line: yamlErr.mark?.line ? yamlErr.mark.line + 1 : undefined,
          code: 'yaml-syntax',
          message: `YAML syntax error: ${yamlErr.message ?? 'Unknown error'}`,
        },
      ];
    }
  });
}

