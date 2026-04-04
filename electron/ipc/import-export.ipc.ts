import type { IpcMainInvokeEvent } from 'electron';
import { dialog, BrowserWindow } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

interface ImportResult {
  fileName: string;
  content: string;
  openapiVersion: string;
  format: 'yaml' | 'json';
}

/** Detect OpenAPI version from parsed document */
function detectVersion(doc: Record<string, unknown>): string {
  if (typeof doc.openapi === 'string') return doc.openapi;
  if (typeof doc.swagger === 'string') return doc.swagger;
  return '3.0.0';
}

/** Detect if content is JSON or YAML */
function detectFormat(content: string): 'yaml' | 'json' {
  const trimmed = content.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) return 'json';
  return 'yaml';
}

export function registerImportExportIpc(
  handle: (
    channel: string,
    listener: (
      event: IpcMainInvokeEvent,
      ...args: unknown[]
    ) => unknown | Promise<unknown>,
  ) => void,
  IPC: Record<string, string>,
): void {
  const SPEC_IMPORT = IPC.SPEC_IMPORT ?? 'spec:import';
  const SPEC_EXPORT = IPC.SPEC_EXPORT ?? 'spec:export';
  const PROJECT_EXPORT_ZIP = IPC.PROJECT_EXPORT_ZIP ?? 'project:export-zip';

  /**
   * SPEC_IMPORT — Open file dialog, read YAML/JSON, detect version.
   * Returns ImportResult or null if cancelled.
   */
  handle(SPEC_IMPORT, async (e) => {
    const win = BrowserWindow.fromWebContents(e.sender);
    const result = await dialog.showOpenDialog(win!, {
      title: 'Import OpenAPI Spec',
      filters: [
        { name: 'OpenAPI Spec', extensions: ['yaml', 'yml', 'json'] },
        { name: 'All Files', extensions: ['*'] },
      ],
      properties: ['openFile'],
    });

    if (result.canceled || result.filePaths.length === 0) return null;

    const filePath = result.filePaths[0]!;
    const content = fs.readFileSync(filePath, 'utf-8');
    const format = detectFormat(content);

    let openapiVersion = '3.0.0';
    try {
      const doc = format === 'json'
        ? JSON.parse(content)
        : yaml.load(content);
      if (doc && typeof doc === 'object') {
        openapiVersion = detectVersion(doc as Record<string, unknown>);
      }
    } catch {
      // If parsing fails, use defaults — the validator will catch errors later
    }

    const baseName = path.basename(filePath, path.extname(filePath));

    return {
      fileName: baseName,
      content,
      openapiVersion,
      format,
    } satisfies ImportResult;
  });

  /**
   * SPEC_EXPORT — Save a spec file to disk as YAML or JSON.
   * Args: { content: string, defaultName: string, format: 'yaml' | 'json' }
   */
  handle(SPEC_EXPORT, async (e, payload: unknown) => {
    const { content, defaultName, format } = payload as {
      content: string;
      defaultName: string;
      format: 'yaml' | 'json';
    };

    const win = BrowserWindow.fromWebContents(e.sender);
    const ext = format === 'json' ? 'json' : 'yaml';
    const result = await dialog.showSaveDialog(win!, {
      title: 'Export Spec',
      defaultPath: `${defaultName}.${ext}`,
      filters: [
        { name: format === 'json' ? 'JSON' : 'YAML', extensions: [ext] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });

    if (result.canceled || !result.filePath) return { success: false };

    let outputContent = content;
    if (format === 'json') {
      try {
        const doc = yaml.load(content);
        outputContent = JSON.stringify(doc, null, 2);
      } catch {
        outputContent = content;
      }
    }

    fs.writeFileSync(result.filePath, outputContent, 'utf-8');
    return { success: true, filePath: result.filePath };
  });

  /**
   * PROJECT_EXPORT_ZIP — Export all spec files in a project as a zip.
   * Args: { projectId: string, files: { name: string, content: string }[] }
   */
  handle(PROJECT_EXPORT_ZIP, async (e, payload: unknown) => {
    const { files, projectName } = payload as {
      projectName: string;
      files: { relativePath: string; content: string }[];
    };

    const win = BrowserWindow.fromWebContents(e.sender);
    const result = await dialog.showSaveDialog(win!, {
      title: 'Export Project',
      defaultPath: `${projectName}-export`,
      properties: ['createDirectory'],
    });

    if (result.canceled || !result.filePath) return { success: false };

    // Create folder and write files
    const exportDir = result.filePath;
    fs.mkdirSync(exportDir, { recursive: true });

    for (const file of files) {
      const targetPath = path.join(exportDir, file.relativePath);
      fs.mkdirSync(path.dirname(targetPath), { recursive: true });
      fs.writeFileSync(targetPath, file.content, 'utf-8');
    }

    return { success: true, exportPath: exportDir, fileCount: files.length };
  });
}
