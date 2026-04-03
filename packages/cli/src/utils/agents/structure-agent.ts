import * as path from "path";

export interface ProjectStructure {
  projectType: string;
  language: string;
  framework: string;
  entryPoints: string[];
  directories: string[];
  manifestFiles: string[];
}

export interface FileInfo {
  relativePath: string;
  content?: string;
  size: number;
}

const FRAMEWORK_DETECTORS: Record<string, (deps: Record<string, string>) => string> = {
  node: (deps) => {
    if (deps["next"]) return "nextjs";
    if (deps["express"]) return "express";
    if (deps["@nestjs/core"]) return "nestjs";
    if (deps["fastify"]) return "fastify";
    if (deps["koa"]) return "koa";
    if (deps["react"]) return "react";
    if (deps["vue"]) return "vue";
    if (deps["@angular/core"]) return "angular";
    if (deps["svelte"]) return "svelte";
    return "node";
  },
  python: (deps) => {
    if (deps["django"] || deps["Django"]) return "django";
    if (deps["flask"] || deps["Flask"]) return "flask";
    if (deps["fastapi"]) return "fastapi";
    if (deps["starlette"]) return "starlette";
    return "python";
  },
};

function detectNodeFramework(manifest: string): { framework: string; language: string } {
  try {
    const pkg = JSON.parse(manifest);
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
    const framework = FRAMEWORK_DETECTORS.node(allDeps);
    const language = allDeps["typescript"] || allDeps["ts-node"] ? "typescript" : "javascript";
    return { framework, language };
  } catch {
    return { framework: "node", language: "javascript" };
  }
}

function detectPythonFramework(manifest: string): string {
  const lower = manifest.toLowerCase();
  if (lower.includes("django")) return "django";
  if (lower.includes("flask")) return "flask";
  if (lower.includes("fastapi")) return "fastapi";
  if (lower.includes("starlette")) return "starlette";
  return "python";
}

function findEntryPoints(files: FileInfo[], projectType: string): string[] {
  const entries: string[] = [];
  const names = files.map((f) => f.relativePath);

  if (projectType === "node") {
    for (const name of ["index.ts", "index.js", "src/index.ts", "src/index.js", "src/main.ts", "src/main.js", "app.ts", "app.js", "server.ts", "server.js"]) {
      if (names.includes(name)) entries.push(name);
    }
  } else if (projectType === "python") {
    for (const name of ["main.py", "app.py", "manage.py", "src/main.py", "wsgi.py", "asgi.py"]) {
      if (names.includes(name)) entries.push(name);
    }
  } else if (projectType === "rust") {
    for (const name of ["src/main.rs", "src/lib.rs"]) {
      if (names.includes(name)) entries.push(name);
    }
  } else if (projectType === "go") {
    for (const name of names) {
      if (name === "main.go" || name.endsWith("/main.go")) entries.push(name);
    }
  } else if (projectType === "java") {
    for (const name of names) {
      if (name.includes("Application.java") || name.includes("Main.java")) entries.push(name);
    }
  }

  return entries;
}

function extractDirectories(files: FileInfo[]): string[] {
  const dirs = new Set<string>();
  for (const f of files) {
    const dir = path.dirname(f.relativePath);
    if (dir && dir !== ".") {
      dirs.add(dir.split(path.sep)[0]);
    }
  }
  return Array.from(dirs).sort();
}

export function analyzeStructure(files: FileInfo[], manifests: Map<string, string>): ProjectStructure {
  let projectType = "unknown";
  let language = "unknown";
  let framework = "unknown";
  const manifestFiles = Array.from(manifests.keys());

  if (manifests.has("package.json")) {
    projectType = "node";
    const result = detectNodeFramework(manifests.get("package.json")!);
    language = result.language;
    framework = result.framework;
  } else if (manifests.has("pyproject.toml") || manifests.has("setup.py")) {
    projectType = "python";
    language = "python";
    const content = manifests.get("pyproject.toml") || manifests.get("setup.py") || "";
    framework = detectPythonFramework(content);
  } else if (manifests.has("Cargo.toml")) {
    projectType = "rust";
    language = "rust";
    framework = "rust";
  } else if (manifests.has("go.mod")) {
    projectType = "go";
    language = "go";
    framework = "go";
  } else if (manifests.has("pom.xml") || manifests.has("build.gradle")) {
    projectType = "java";
    language = "java";
    framework = manifests.has("pom.xml") ? "maven" : "gradle";
  }

  return {
    projectType,
    language,
    framework,
    entryPoints: findEntryPoints(files, projectType),
    directories: extractDirectories(files),
    manifestFiles,
  };
}
