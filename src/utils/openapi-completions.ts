/**
 * OpenAPI IntelliSense completion data for Monaco editor.
 * Provides context-aware keyword suggestions when editing YAML.
 */

import type { languages, Position, editor } from 'monaco-editor';

/* ── Completion item kinds (Monaco enum values) ── */
const KIND_KEYWORD = 14;   // languages.CompletionItemKind.Keyword
const KIND_PROPERTY = 9;   // languages.CompletionItemKind.Property
const KIND_VALUE = 11;     // languages.CompletionItemKind.Value
const KIND_REFERENCE = 17; // languages.CompletionItemKind.Reference
const KIND_ENUM = 15;      // languages.CompletionItemKind.Enum

/* ── Helper: build a completion item ── */
function item(
  label: string,
  kind: number,
  insertText: string,
  detail?: string,
  documentation?: string,
): Omit<languages.CompletionItem, 'range'> {
  return {
    label,
    kind,
    insertText,
    insertTextRules: insertText.includes('$') ? 4 : 0, // InsertAsSnippet
    detail,
    documentation: documentation ? { value: documentation, isTrusted: true } : undefined,
  } as Omit<languages.CompletionItem, 'range'>;
}

/* ── Top-level OpenAPI keys ── */
const ROOT_KEYS = [
  item('openapi', KIND_KEYWORD, "openapi: '3.0.3'", 'OpenAPI version', 'The OpenAPI specification version (e.g. 3.0.3, 3.1.0)'),
  item('info', KIND_KEYWORD, 'info:\n  title: ${1:API Title}\n  version: ${2:1.0.0}\n  description: ${3:API description}', 'API metadata', 'Required. Provides metadata about the API.'),
  item('servers', KIND_KEYWORD, 'servers:\n  - url: ${1:https://api.example.com}\n    description: ${2:Production}', 'Server list', 'An array of Server Objects.'),
  item('paths', KIND_KEYWORD, 'paths:\n  ${1:/resource}:\n    get:\n      summary: ${2:Get resource}\n      responses:\n        \'200\':\n          description: ${3:Success}', 'API paths', 'Required. The available paths and operations.'),
  item('components', KIND_KEYWORD, 'components:\n  schemas:\n    ${1:ModelName}:\n      type: object\n      properties:\n        ${2:id}:\n          type: ${3:string}', 'Reusable components', 'Holds reusable schemas, responses, parameters, etc.'),
  item('security', KIND_KEYWORD, 'security:\n  - ${1:bearerAuth}: []', 'Security requirements', 'Global security requirements.'),
  item('tags', KIND_KEYWORD, 'tags:\n  - name: ${1:TagName}\n    description: ${2:Tag description}', 'API tags', 'Tags for logical grouping of operations.'),
  item('externalDocs', KIND_KEYWORD, 'externalDocs:\n  url: ${1:https://docs.example.com}\n  description: ${2:External documentation}', 'External docs', 'Additional external documentation.'),
];

/* ── Info object keys ── */
const INFO_KEYS = [
  item('title', KIND_PROPERTY, 'title: ${1:API Title}', 'API title (required)'),
  item('version', KIND_PROPERTY, 'version: ${1:1.0.0}', 'API version (required)'),
  item('description', KIND_PROPERTY, 'description: ${1:Description}', 'API description'),
  item('termsOfService', KIND_PROPERTY, 'termsOfService: ${1:https://example.com/terms}', 'Terms of service URL'),
  item('contact', KIND_PROPERTY, 'contact:\n  name: ${1:API Support}\n  email: ${2:support@example.com}\n  url: ${3:https://example.com}', 'Contact info'),
  item('license', KIND_PROPERTY, 'license:\n  name: ${1:MIT}\n  url: ${2:https://opensource.org/licenses/MIT}', 'License info'),
];

/* ── HTTP methods ── */
const HTTP_METHOD_KEYS = [
  item('get', KIND_KEYWORD, 'get:\n  summary: ${1:Summary}\n  operationId: ${2:operationId}\n  responses:\n    \'200\':\n      description: ${3:Success}', 'GET operation'),
  item('post', KIND_KEYWORD, 'post:\n  summary: ${1:Summary}\n  operationId: ${2:operationId}\n  requestBody:\n    required: true\n    content:\n      application/json:\n        schema:\n          type: object\n  responses:\n    \'201\':\n      description: ${3:Created}', 'POST operation'),
  item('put', KIND_KEYWORD, 'put:\n  summary: ${1:Summary}\n  operationId: ${2:operationId}\n  responses:\n    \'200\':\n      description: ${3:Success}', 'PUT operation'),
  item('patch', KIND_KEYWORD, 'patch:\n  summary: ${1:Summary}\n  operationId: ${2:operationId}\n  responses:\n    \'200\':\n      description: ${3:Success}', 'PATCH operation'),
  item('delete', KIND_KEYWORD, 'delete:\n  summary: ${1:Summary}\n  operationId: ${2:operationId}\n  responses:\n    \'204\':\n      description: ${3:No Content}', 'DELETE operation'),
  item('head', KIND_KEYWORD, 'head:\n  summary: ${1:Summary}\n  operationId: ${2:operationId}\n  responses:\n    \'200\':\n      description: ${3:Success}', 'HEAD operation'),
  item('options', KIND_KEYWORD, 'options:\n  summary: ${1:Summary}\n  operationId: ${2:operationId}\n  responses:\n    \'200\':\n      description: ${3:Success}', 'OPTIONS operation'),
  item('trace', KIND_KEYWORD, 'trace:\n  summary: ${1:Summary}\n  operationId: ${2:operationId}\n  responses:\n    \'200\':\n      description: ${3:Success}', 'TRACE operation'),
];

/* ── Operation-level keys ── */
const OPERATION_KEYS = [
  item('summary', KIND_PROPERTY, 'summary: ${1:Operation summary}', 'Operation summary'),
  item('description', KIND_PROPERTY, 'description: ${1:Detailed description}', 'Operation description'),
  item('operationId', KIND_PROPERTY, 'operationId: ${1:uniqueOperationId}', 'Unique operation identifier'),
  item('tags', KIND_PROPERTY, 'tags:\n  - ${1:TagName}', 'Operation tags'),
  item('deprecated', KIND_PROPERTY, 'deprecated: true', 'Mark as deprecated'),
  item('parameters', KIND_PROPERTY, 'parameters:\n  - name: ${1:paramName}\n    in: ${2|query,path,header,cookie|}\n    required: ${3|true,false|}\n    schema:\n      type: ${4|string,integer,number,boolean|}', 'Operation parameters'),
  item('requestBody', KIND_PROPERTY, 'requestBody:\n  required: ${1|true,false|}\n  content:\n    application/json:\n      schema:\n        type: object\n        properties:\n          ${2:fieldName}:\n            type: ${3:string}', 'Request body'),
  item('responses', KIND_PROPERTY, "responses:\n  '${1:200}':\n    description: ${2:Success}", 'Response definitions'),
  item('security', KIND_PROPERTY, 'security:\n  - ${1:bearerAuth}: []', 'Operation security'),
];

/* ── Schema type values ── */
const SCHEMA_TYPES = [
  item('string', KIND_VALUE, 'string', 'String type'),
  item('integer', KIND_VALUE, 'integer', 'Integer type'),
  item('number', KIND_VALUE, 'number', 'Number type'),
  item('boolean', KIND_VALUE, 'boolean', 'Boolean type'),
  item('array', KIND_VALUE, 'array', 'Array type'),
  item('object', KIND_VALUE, 'object', 'Object type'),
];

/* ── Parameter "in" values ── */
const PARAM_IN_VALUES = [
  item('query', KIND_ENUM, 'query', 'Query parameter'),
  item('path', KIND_ENUM, 'path', 'Path parameter'),
  item('header', KIND_ENUM, 'header', 'Header parameter'),
  item('cookie', KIND_ENUM, 'cookie', 'Cookie parameter'),
];

/* ── HTTP status codes ── */
const STATUS_CODES = [
  item("'200'", KIND_VALUE, "'200':\n  description: ${1:OK}", '200 OK'),
  item("'201'", KIND_VALUE, "'201':\n  description: ${1:Created}", '201 Created'),
  item("'204'", KIND_VALUE, "'204':\n  description: ${1:No Content}", '204 No Content'),
  item("'400'", KIND_VALUE, "'400':\n  description: ${1:Bad Request}", '400 Bad Request'),
  item("'401'", KIND_VALUE, "'401':\n  description: ${1:Unauthorized}", '401 Unauthorized'),
  item("'403'", KIND_VALUE, "'403':\n  description: ${1:Forbidden}", '403 Forbidden'),
  item("'404'", KIND_VALUE, "'404':\n  description: ${1:Not Found}", '404 Not Found'),
  item("'409'", KIND_VALUE, "'409':\n  description: ${1:Conflict}", '409 Conflict'),
  item("'422'", KIND_VALUE, "'422':\n  description: ${1:Unprocessable Entity}", '422 Unprocessable Entity'),
  item("'500'", KIND_VALUE, "'500':\n  description: ${1:Internal Server Error}", '500 Internal Server Error'),
];

/* ── Schema-level keys ── */
const SCHEMA_KEYS = [
  item('type', KIND_PROPERTY, 'type: ${1|string,integer,number,boolean,array,object|}', 'Schema type'),
  item('format', KIND_PROPERTY, 'format: ${1|date-time,date,email,uri,uuid,int32,int64,float,double,byte,binary,password|}', 'Schema format'),
  item('description', KIND_PROPERTY, 'description: ${1:Description}', 'Schema description'),
  item('properties', KIND_PROPERTY, 'properties:\n  ${1:fieldName}:\n    type: ${2:string}', 'Object properties'),
  item('items', KIND_PROPERTY, 'items:\n  type: ${1:string}', 'Array item schema'),
  item('required', KIND_PROPERTY, 'required:\n  - ${1:fieldName}', 'Required fields'),
  item('enum', KIND_PROPERTY, 'enum:\n  - ${1:value1}\n  - ${2:value2}', 'Allowed values'),
  item('default', KIND_PROPERTY, 'default: ${1:defaultValue}', 'Default value'),
  item('example', KIND_PROPERTY, 'example: ${1:exampleValue}', 'Example value'),
  item('nullable', KIND_PROPERTY, 'nullable: true', 'Allow null'),
  item('$ref', KIND_REFERENCE, "\\$ref: '#/components/schemas/${1:ModelName}'", 'Schema reference'),
  item('allOf', KIND_KEYWORD, 'allOf:\n  - ${1}', 'Combine schemas (AND)'),
  item('anyOf', KIND_KEYWORD, 'anyOf:\n  - ${1}', 'Combine schemas (OR)'),
  item('oneOf', KIND_KEYWORD, 'oneOf:\n  - ${1}', 'Combine schemas (XOR)'),
];

/* ── Components section keys ── */
const COMPONENTS_KEYS = [
  item('schemas', KIND_PROPERTY, 'schemas:\n  ${1:ModelName}:\n    type: object\n    properties:\n      ${2:id}:\n        type: string', 'Component schemas'),
  item('responses', KIND_PROPERTY, 'responses:\n  ${1:NotFound}:\n    description: ${2:Resource not found}', 'Component responses'),
  item('parameters', KIND_PROPERTY, 'parameters:\n  ${1:ParamName}:\n    name: ${2:paramName}\n    in: query\n    schema:\n      type: string', 'Component parameters'),
  item('requestBodies', KIND_PROPERTY, 'requestBodies:\n  ${1:BodyName}:\n    content:\n      application/json:\n        schema:\n          type: object', 'Component request bodies'),
  item('securitySchemes', KIND_PROPERTY, 'securitySchemes:\n  bearerAuth:\n    type: http\n    scheme: bearer\n    bearerFormat: JWT', 'Security scheme definitions'),
  item('headers', KIND_PROPERTY, 'headers:\n  ${1:HeaderName}:\n    schema:\n      type: string', 'Component headers'),
  item('examples', KIND_PROPERTY, 'examples:\n  ${1:ExampleName}:\n    summary: ${2:Example summary}\n    value: ${3}', 'Component examples'),
];

/* ── Context detection from lines above cursor ── */

interface YamlContext {
  indent: number;
  parentKeys: string[];
}

function getYamlContext(model: editor.ITextModel, position: Position): YamlContext {
  const lineContent = model.getLineContent(position.lineNumber);
  const indent = lineContent.search(/\S/);
  const currentIndent = indent < 0 ? 0 : indent;

  const parentKeys: string[] = [];
  let searchIndent = currentIndent;

  for (let i = position.lineNumber - 1; i >= 1 && parentKeys.length < 8; i--) {
    const line = model.getLineContent(i);
    const lineIndent = line.search(/\S/);
    if (lineIndent < 0) continue; // skip blank lines

    if (lineIndent < searchIndent) {
      const match = line.match(/^\s*([a-zA-Z0-9_$/'"-]+)\s*:/);
      if (match && match[1]) {
        parentKeys.unshift(match[1].replace(/['"]/g, ''));
        searchIndent = lineIndent;
      }
    }
  }

  return { indent: currentIndent, parentKeys };
}

/**
 * Extract schema names from the current document content
 * for $ref autocomplete suggestions.
 */
function extractSchemaNames(model: editor.ITextModel): string[] {
  const text = model.getValue();
  const names: string[] = [];

  // Look for keys under components.schemas
  const schemasMatch = text.match(/components:\s*\n\s+schemas:\s*\n([\s\S]*?)(?=\n\S|\n\s{0,3}\S|$)/);
  if (schemasMatch && schemasMatch[1]) {
    const schemaBlock = schemasMatch[1];
    const baseIndentMatch = schemaBlock.match(/^(\s+)/);
    if (baseIndentMatch && baseIndentMatch[1]) {
      const baseIndent = baseIndentMatch[1].length;
      const regex = new RegExp(`^\\s{${baseIndent}}([a-zA-Z_][a-zA-Z0-9_]*)\\s*:`, 'gm');
      let m: RegExpExecArray | null;
      while ((m = regex.exec(schemaBlock)) !== null) {
        const name = m[1];
        if (name) names.push(name);
      }
    }
  }

  return names;
}

/**
 * Return completion items based on the current YAML context.
 */
function getCompletionsForContext(
  ctx: YamlContext,
  model: editor.ITextModel,
): Omit<languages.CompletionItem, 'range'>[] {
  const depth = ctx.parentKeys.length;
  const parentKey: string = depth > 0 ? (ctx.parentKeys[depth - 1] ?? '') : '';
  const grandParentKey: string = depth > 1 ? (ctx.parentKeys[depth - 2] ?? '') : '';

  // Root level (indent 0 or no parents)
  if (depth === 0) {
    return ROOT_KEYS;
  }

  // Under 'info'
  if (parentKey === 'info') {
    return INFO_KEYS;
  }

  // Under 'paths' → path template level → HTTP methods
  if (parentKey === 'paths' || (grandParentKey === 'paths' && depth === 2)) {
    return HTTP_METHOD_KEYS;
  }

  // Under an HTTP method → operation keys
  const httpMethods = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'trace'];
  if (httpMethods.includes(parentKey)) {
    return OPERATION_KEYS;
  }

  // Under 'responses' → status codes
  if (parentKey === 'responses') {
    return STATUS_CODES;
  }

  // Under 'components'
  if (parentKey === 'components') {
    return COMPONENTS_KEYS;
  }

  // Under 'schema', 'properties' sub-key, or 'items'
  if (parentKey === 'schema' || parentKey === 'items') {
    return SCHEMA_KEYS;
  }

  // Under 'schemas' in components → individual schema definition
  if (grandParentKey === 'schemas' || parentKey === 'schemas') {
    return SCHEMA_KEYS;
  }

  // Under 'properties' → offer schema keys for each property
  if (parentKey === 'properties') {
    return SCHEMA_KEYS;
  }

  // Under 'parameters' with 'in' → param in values
  if (parentKey === 'parameters') {
    return OPERATION_KEYS.filter(
      (k) => typeof k.label === 'string' && ['name', 'description'].includes(k.label),
    ).concat([
      item('name', KIND_PROPERTY, 'name: ${1:paramName}', 'Parameter name'),
      item('in', KIND_PROPERTY, 'in: ${1|query,path,header,cookie|}', 'Parameter location'),
      item('required', KIND_PROPERTY, 'required: ${1|true,false|}', 'Required flag'),
      item('schema', KIND_PROPERTY, 'schema:\n  type: ${1:string}', 'Parameter schema'),
    ]);
  }

  // Type value context
  if (parentKey === 'type') {
    return SCHEMA_TYPES;
  }

  // In context → param in values
  if (parentKey === 'in') {
    return PARAM_IN_VALUES;
  }

  // $ref context — offer schema references
  if (parentKey === '$ref') {
    const schemas = extractSchemaNames(model);
    return schemas.map((name) =>
      item(
        `#/components/schemas/${name}`,
        KIND_REFERENCE,
        `'#/components/schemas/${name}'`,
        `Reference to ${name}`,
      ),
    );
  }

  // Fallback: offer a mix of common keys
  return [
    ...OPERATION_KEYS.slice(0, 4),
    ...SCHEMA_KEYS.slice(0, 5),
  ];
}

/**
 * Register the OpenAPI completion provider for YAML in Monaco.
 * Call this once in beforeMount.
 */
export function registerOpenApiCompletionProvider(
  monaco: typeof import('monaco-editor'),
): void {
  monaco.languages.registerCompletionItemProvider('yaml', {
    triggerCharacters: [' ', ':', '\n', "'", '"', '/'],
    provideCompletionItems(model, position) {
      const ctx = getYamlContext(model, position);
      const raw = getCompletionsForContext(ctx, model);

      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endLineNumber: position.lineNumber,
        endColumn: word.endColumn,
      };

      const suggestions = raw.map((r) => ({
        ...r,
        range,
      })) as languages.CompletionItem[];

      return { suggestions };
    },
  });
}
