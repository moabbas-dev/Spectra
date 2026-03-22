export type OpenApiVersion = '2.0' | '3.0' | '3.1';

export function blankOpenApiDocument(
  version: OpenApiVersion,
  title: string,
): string {
  const safeTitle = title.replace(/"/g, '\\"');
  if (version === '2.0') {
    return `swagger: "2.0"
info:
  title: "${safeTitle}"
  version: 0.0.1
host: localhost
basePath: /
schemes:
  - http
paths: {}
`;
  }
  if (version === '3.0') {
    return `openapi: 3.0.3
info:
  title: "${safeTitle}"
  version: 0.0.1
paths: {}
`;
  }
  return `openapi: 3.1.0
info:
  title: "${safeTitle}"
  version: 0.0.1
paths: {}
`;
}
