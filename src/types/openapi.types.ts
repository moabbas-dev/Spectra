/* ── OpenAPI Types for Form Editor ──
 * Subset of OpenAPI 3.0/3.1 structures that the form editor supports.
 * Not exhaustive — advanced constructs are handled via code view.
 */

export interface OpenApiDoc {
  openapi?: string;      // '3.0.x' or '3.1.x'
  swagger?: string;      // '2.0'
  info: InfoObject;
  servers?: ServerObject[];
  paths: Record<string, PathItemObject>;
  components?: ComponentsObject;
  security?: SecurityRequirementObject[];
  tags?: TagObject[];
  externalDocs?: ExternalDocObject;
  [key: `x-${string}`]: unknown;
}

export interface InfoObject {
  title: string;
  version: string;
  description?: string;
  termsOfService?: string;
  contact?: ContactObject;
  license?: LicenseObject;
}

export interface ContactObject {
  name?: string;
  email?: string;
  url?: string;
}

export interface LicenseObject {
  name: string;
  url?: string;
}

export interface ServerObject {
  url: string;
  description?: string;
  variables?: Record<string, ServerVariableObject>;
}

export interface ServerVariableObject {
  default: string;
  enum?: string[];
  description?: string;
}

export interface PathItemObject {
  summary?: string;
  description?: string;
  get?: OperationObject;
  post?: OperationObject;
  put?: OperationObject;
  patch?: OperationObject;
  delete?: OperationObject;
  head?: OperationObject;
  options?: OperationObject;
  trace?: OperationObject;
  parameters?: ParameterObject[];
}

export const HTTP_METHODS = [
  'get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'trace',
] as const;
export type HttpMethod = (typeof HTTP_METHODS)[number];

export interface OperationObject {
  summary?: string;
  description?: string;
  operationId?: string;
  tags?: string[];
  deprecated?: boolean;
  parameters?: ParameterObject[];
  requestBody?: RequestBodyObject;
  responses?: Record<string, ResponseObject>;
  security?: SecurityRequirementObject[];
}

export interface ParameterObject {
  name: string;
  in: 'path' | 'query' | 'header' | 'cookie';
  description?: string;
  required?: boolean;
  deprecated?: boolean;
  schema?: SchemaObject;
}

export interface RequestBodyObject {
  description?: string;
  required?: boolean;
  content?: Record<string, MediaTypeObject>;
}

export interface ResponseObject {
  description: string;
  content?: Record<string, MediaTypeObject>;
  headers?: Record<string, HeaderObject>;
}

export interface MediaTypeObject {
  schema?: SchemaObject;
  example?: unknown;
}

export interface HeaderObject {
  description?: string;
  required?: boolean;
  schema?: SchemaObject;
}

export interface SchemaObject {
  type?: string;
  format?: string;
  description?: string;
  properties?: Record<string, SchemaObject>;
  items?: SchemaObject;
  required?: string[];
  enum?: unknown[];
  default?: unknown;
  example?: unknown;
  $ref?: string;
  allOf?: SchemaObject[];
  anyOf?: SchemaObject[];
  oneOf?: SchemaObject[];
  not?: SchemaObject;
  nullable?: boolean;
  [key: string]: unknown;
}

export interface ComponentsObject {
  schemas?: Record<string, SchemaObject>;
  responses?: Record<string, ResponseObject>;
  parameters?: Record<string, ParameterObject>;
  examples?: Record<string, unknown>;
  requestBodies?: Record<string, RequestBodyObject>;
  headers?: Record<string, HeaderObject>;
  securitySchemes?: Record<string, unknown>;
  [key: string]: unknown;
}

export type SecurityRequirementObject = Record<string, string[]>;

export interface TagObject {
  name: string;
  description?: string;
  externalDocs?: ExternalDocObject;
}

export interface ExternalDocObject {
  url: string;
  description?: string;
}
