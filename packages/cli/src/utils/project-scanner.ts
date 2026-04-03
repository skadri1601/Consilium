import fs from 'fs';
import path from 'path';
import { PermissionManager, PermissionLevel } from './permission-manager';

export interface ScannedFile {
  path: string;
  content: string;
  category: 'manifest' | 'source' | 'config' | 'doc';
}

export interface ProjectScanResult {
  files: ScannedFile[];
  summary: string;
}

const SKIP_DIRS = new Set([
  'node_modules', 'dist', '.git', '__pycache__', '.next',
  'vendor', '.venv', 'build', 'coverage',
]);

const ALLOWED_EXTS = new Set([
  '.ts', '.tsx', '.js', '.py', '.go', '.rs', '.java',
  '.css', '.html', '.sql', '.yaml', '.yml', '.json',
  '.md', '.prisma',
]);

const ALLOWED_BASENAMES = new Set([
  'Dockerfile', 'Makefile',
]);

const BINARY_EXTS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.ico', '.svg', '.webp',
  '.pdf', '.docx', '.doc', '.xlsx', '.xls', '.pptx',
  '.mp3', '.mp4', '.avi', '.mov', '.wmv', '.flv', '.wav', '.ogg',
  '.zip', '.tar', '.gz', '.rar', '.7z', '.bz2',
  '.woff', '.woff2', '.ttf', '.otf', '.eot',
  '.lock',
]);

const SECRET_PATTERNS = [
  /^\.env/i,
  /\.key$/i,
  /\.pem$/i,
  /^credentials/i,
  /^secret/i,
  /^\.npmrc$/i,
];

const MANIFEST_NAMES = new Set([
  'package.json', 'Cargo.toml', 'pyproject.toml', 'go.mod',
  'pom.xml', 'build.gradle', 'setup.py', 'setup.cfg',
  'requirements.txt', 'Gemfile',
]);

const MAX_FILES = 200;
const MAX_FILE_SIZE = 50 * 1024;
const MAX_TOTAL_SIZE = 2 * 1024 * 1024;

let permissionManagerInstance: PermissionManager | null = null;

function getPermissionManager(): PermissionManager {
  if (!permissionManagerInstance) {
    permissionManagerInstance = new PermissionManager();
  }
  return permissionManagerInstance;
}

function isSecretFile(basename: string): boolean {
  return SECRET_PATTERNS.some((p) => p.test(basename));
}

function isBinaryExt(ext: string): boolean {
  return BINARY_EXTS.has(ext.toLowerCase());
}

function isAllowedFile(basename: string, ext: string): boolean {
  if (isSecretFile(basename)) return false;
  if (isBinaryExt(ext)) return false;
  if (ALLOWED_BASENAMES.has(basename)) return true;
  if (ALLOWED_EXTS.has(ext.toLowerCase())) {
    if (ext === '.json' && basename.endsWith('-lock.json')) return false;
    if (ext === '.json' && basename === 'package-lock.json') return false;
    return true;
  }
  return false;
}

function categorizeFile(basename: string, ext: string): ScannedFile['category'] {
  if (MANIFEST_NAMES.has(basename)) return 'manifest';
  if (ext === '.md' || ext === '.txt' || ext === '.rst') return 'doc';
  if (ext === '.json' || ext === '.yaml' || ext === '.yml' || ext === '.prisma' ||
      basename === 'Dockerfile' || basename === 'Makefile') return 'config';
  return 'source';
}

interface DiscoveredFile {
  relativePath: string;
  size: number;
  category: ScannedFile['category'];
  depth: number;
}

function discoverFiles(projectPath: string): DiscoveredFile[] {
  const results: DiscoveredFile[] = [];

  function walk(dir: string, depth: number): void {
    if (depth > 10) return;
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name)) continue;
        if (entry.name.startsWith('.') && entry.name !== '.github') continue;
        walk(path.join(dir, entry.name), depth + 1);
        continue;
      }

      if (!entry.isFile()) continue;

      const ext = path.extname(entry.name).toLowerCase();
      if (!isAllowedFile(entry.name, ext)) continue;

      const fullPath = path.join(dir, entry.name);
      try {
        const stat = fs.statSync(fullPath);
        if (stat.size > MAX_FILE_SIZE) continue;
        if (stat.size === 0) continue;

        const relativePath = path.relative(projectPath, fullPath).replace(/\\/g, '/');
        results.push({
          relativePath,
          size: stat.size,
          category: categorizeFile(entry.name, ext),
          depth,
        });
      } catch {
        continue;
      }
    }
  }

  walk(projectPath, 0);
  return results;
}

function prioritizeFiles(files: DiscoveredFile[]): DiscoveredFile[] {
  const manifests = files.filter((f) => f.category === 'manifest');
  const source = files.filter((f) => f.category === 'source');
  const config = files.filter((f) => f.category === 'config');
  const docs = files.filter((f) => f.category === 'doc');

  source.sort((a, b) => a.depth - b.depth);

  return [...manifests, ...source, ...config, ...docs].slice(0, MAX_FILES);
}

function readFileContents(projectPath: string, files: DiscoveredFile[]): ScannedFile[] {
  const result: ScannedFile[] = [];
  let totalSize = 0;
  let totalLines = 0;

  for (const file of files) {
    if (totalSize >= MAX_TOTAL_SIZE) break;

    const fullPath = path.join(projectPath, file.relativePath);
    try {
      const buffer = fs.readFileSync(fullPath);
      if (buffer.includes(0)) continue;

      const remaining = MAX_TOTAL_SIZE - totalSize;
      if (buffer.length > remaining) continue;

      const content = buffer.toString('utf-8');
      totalSize += buffer.length;
      totalLines += content.split('\n').length;

      result.push({
        path: file.relativePath,
        content,
        category: file.category,
      });
    } catch {
      continue;
    }
  }

  return result;
}

export async function scanProject(projectPath?: string): Promise<ProjectScanResult | null> {
  const cwd = path.resolve(projectPath || process.cwd());
  const pm = getPermissionManager();
  const permission = await pm.requestPermission(cwd);

  if (permission === 'deny') {
    return null;
  }

  const discovered = discoverFiles(cwd);
  const prioritized = prioritizeFiles(discovered);
  const files = readFileContents(cwd, prioritized);

  const totalLines = files.reduce((sum, f) => sum + f.content.split('\n').length, 0);
  const summary = `${files.length} files, ${totalLines} lines`;

  return { files, summary };
}

export function hasProjectPermission(projectPath?: string): PermissionLevel {
  const cwd = path.resolve(projectPath || process.cwd());
  const pm = getPermissionManager();
  return pm.checkPermission(cwd);
}
