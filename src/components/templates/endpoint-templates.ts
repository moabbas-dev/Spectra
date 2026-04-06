/** Pre-built OpenAPI endpoint templates */

export interface EndpointTemplate {
  id: string;
  name: string;
  description: string;
  category: 'crud' | 'auth' | 'upload' | 'webhook' | 'utility';
  method: 'get' | 'post' | 'put' | 'patch' | 'delete';
  pathSuffix: string;
  yaml: string;
}

export const ENDPOINT_TEMPLATES: EndpointTemplate[] = [
  /* ── CRUD ── */
  {
    id: 'crud-list',
    name: 'List Resources',
    description: 'GET endpoint that returns a paginated list of resources.',
    category: 'crud',
    method: 'get',
    pathSuffix: '/resources',
    yaml: `  get:
    summary: List resources
    operationId: listResources
    tags:
      - Resources
    parameters:
      - name: page
        in: query
        schema:
          type: integer
          default: 1
      - name: limit
        in: query
        schema:
          type: integer
          default: 20
    responses:
      '200':
        description: Successful response
        content:
          application/json:
            schema:
              type: object
              properties:
                data:
                  type: array
                  items:
                    type: object
                total:
                  type: integer
                page:
                  type: integer`,
  },
  {
    id: 'crud-get',
    name: 'Get Resource by ID',
    description: 'GET endpoint that returns a single resource by its ID.',
    category: 'crud',
    method: 'get',
    pathSuffix: '/resources/{id}',
    yaml: `  get:
    summary: Get resource by ID
    operationId: getResourceById
    tags:
      - Resources
    parameters:
      - name: id
        in: path
        required: true
        schema:
          type: string
    responses:
      '200':
        description: Successful response
        content:
          application/json:
            schema:
              type: object
      '404':
        description: Resource not found`,
  },
  {
    id: 'crud-create',
    name: 'Create Resource',
    description: 'POST endpoint to create a new resource.',
    category: 'crud',
    method: 'post',
    pathSuffix: '/resources',
    yaml: `  post:
    summary: Create a new resource
    operationId: createResource
    tags:
      - Resources
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            required:
              - name
            properties:
              name:
                type: string
              description:
                type: string
    responses:
      '201':
        description: Resource created
        content:
          application/json:
            schema:
              type: object
      '400':
        description: Invalid input`,
  },
  {
    id: 'crud-update',
    name: 'Update Resource',
    description: 'PUT endpoint to update an existing resource.',
    category: 'crud',
    method: 'put',
    pathSuffix: '/resources/{id}',
    yaml: `  put:
    summary: Update resource
    operationId: updateResource
    tags:
      - Resources
    parameters:
      - name: id
        in: path
        required: true
        schema:
          type: string
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              name:
                type: string
              description:
                type: string
    responses:
      '200':
        description: Resource updated
      '404':
        description: Resource not found`,
  },
  {
    id: 'crud-delete',
    name: 'Delete Resource',
    description: 'DELETE endpoint to remove a resource.',
    category: 'crud',
    method: 'delete',
    pathSuffix: '/resources/{id}',
    yaml: `  delete:
    summary: Delete resource
    operationId: deleteResource
    tags:
      - Resources
    parameters:
      - name: id
        in: path
        required: true
        schema:
          type: string
    responses:
      '204':
        description: Resource deleted
      '404':
        description: Resource not found`,
  },

  /* ── Auth ── */
  {
    id: 'auth-login',
    name: 'Login',
    description: 'POST endpoint for user authentication with JWT tokens.',
    category: 'auth',
    method: 'post',
    pathSuffix: '/auth/login',
    yaml: `  post:
    summary: User login
    operationId: loginUser
    tags:
      - Authentication
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            required:
              - email
              - password
            properties:
              email:
                type: string
                format: email
              password:
                type: string
                format: password
    responses:
      '200':
        description: Login successful
        content:
          application/json:
            schema:
              type: object
              properties:
                accessToken:
                  type: string
                refreshToken:
                  type: string
                expiresIn:
                  type: integer
      '401':
        description: Invalid credentials`,
  },
  {
    id: 'auth-register',
    name: 'Register',
    description: 'POST endpoint for user registration.',
    category: 'auth',
    method: 'post',
    pathSuffix: '/auth/register',
    yaml: `  post:
    summary: User registration
    operationId: registerUser
    tags:
      - Authentication
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            required:
              - email
              - password
              - name
            properties:
              email:
                type: string
                format: email
              password:
                type: string
                format: password
                minLength: 8
              name:
                type: string
    responses:
      '201':
        description: User created
      '409':
        description: Email already exists`,
  },

  /* ── Upload ── */
  {
    id: 'upload-file',
    name: 'File Upload',
    description: 'POST endpoint for uploading files via multipart form data.',
    category: 'upload',
    method: 'post',
    pathSuffix: '/upload',
    yaml: `  post:
    summary: Upload a file
    operationId: uploadFile
    tags:
      - Files
    requestBody:
      required: true
      content:
        multipart/form-data:
          schema:
            type: object
            required:
              - file
            properties:
              file:
                type: string
                format: binary
              description:
                type: string
    responses:
      '200':
        description: File uploaded
        content:
          application/json:
            schema:
              type: object
              properties:
                fileId:
                  type: string
                url:
                  type: string
                size:
                  type: integer
      '413':
        description: File too large`,
  },

  /* ── Webhook ── */
  {
    id: 'webhook-event',
    name: 'Webhook Receiver',
    description: 'POST endpoint to receive webhook events.',
    category: 'webhook',
    method: 'post',
    pathSuffix: '/webhooks',
    yaml: `  post:
    summary: Receive webhook event
    operationId: receiveWebhook
    tags:
      - Webhooks
    parameters:
      - name: X-Webhook-Signature
        in: header
        required: true
        schema:
          type: string
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            required:
              - event
              - timestamp
            properties:
              event:
                type: string
              timestamp:
                type: string
                format: date-time
              payload:
                type: object
    responses:
      '200':
        description: Webhook received
      '401':
        description: Invalid signature`,
  },

  /* ── Utility ── */
  {
    id: 'health-check',
    name: 'Health Check',
    description: 'GET endpoint for service health monitoring.',
    category: 'utility',
    method: 'get',
    pathSuffix: '/health',
    yaml: `  get:
    summary: Health check
    operationId: healthCheck
    tags:
      - System
    responses:
      '200':
        description: Service is healthy
        content:
          application/json:
            schema:
              type: object
              properties:
                status:
                  type: string
                  enum: [healthy, degraded]
                uptime:
                  type: number
                version:
                  type: string`,
  },
];

export const TEMPLATE_CATEGORIES = [
  { id: 'all' as const, label: 'All' },
  { id: 'crud' as const, label: 'CRUD' },
  { id: 'auth' as const, label: 'Auth' },
  { id: 'upload' as const, label: 'Upload' },
  { id: 'webhook' as const, label: 'Webhook' },
  { id: 'utility' as const, label: 'Utility' },
];
