export interface ConfigInfo {
  buildSystem: string;
  testFramework: string;
  envVars: string[];
  hasDocker: boolean;
  hasCI: boolean;
  configFiles: string[];
}

function detectBuildSystem(files: Map<string, string>, fileList: string[]): string {
  if (fileList.some((f) => f.includes("webpack"))) return "webpack";
  if (fileList.some((f) => f.includes("vite.config"))) return "vite";
  if (fileList.some((f) => f.includes("rollup.config"))) return "rollup";
  if (fileList.some((f) => f.includes("esbuild"))) return "esbuild";
  if (fileList.some((f) => f.includes("turbo.json"))) return "turborepo";
  if (fileList.some((f) => f.includes("nx.json"))) return "nx";
  if (fileList.some((f) => f.includes("Makefile"))) return "make";
  if (fileList.some((f) => f.includes("CMakeLists"))) return "cmake";
  if (fileList.some((f) => f.includes("build.gradle"))) return "gradle";
  if (fileList.some((f) => f.includes("pom.xml"))) return "maven";

  for (const [name, content] of files) {
    if (name === "package.json") {
      try {
        const pkg = JSON.parse(content);
        if (pkg.scripts?.build) {
          if (pkg.scripts.build.includes("tsc")) return "tsc";
          if (pkg.scripts.build.includes("next")) return "next";
          if (pkg.scripts.build.includes("vite")) return "vite";
        }
      } catch {}
    }
  }

  return "unknown";
}

function detectTestFramework(files: Map<string, string>, fileList: string[]): string {
  for (const [name, content] of files) {
    if (name === "package.json") {
      try {
        const pkg = JSON.parse(content);
        const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
        if (allDeps["vitest"]) return "vitest";
        if (allDeps["jest"]) return "jest";
        if (allDeps["mocha"]) return "mocha";
        if (allDeps["ava"]) return "ava";
        if (allDeps["tape"]) return "tape";
      } catch {}
    }
    if (name === "pyproject.toml" || name === "setup.cfg") {
      if (content.includes("pytest")) return "pytest";
      if (content.includes("unittest")) return "unittest";
    }
  }

  if (fileList.some((f) => f.includes("jest.config"))) return "jest";
  if (fileList.some((f) => f.includes("vitest.config"))) return "vitest";
  if (fileList.some((f) => f.includes(".mocharc"))) return "mocha";
  if (fileList.some((f) => f.includes("pytest.ini") || f.includes("conftest.py"))) return "pytest";

  return "unknown";
}

function detectEnvVars(files: Map<string, string>): string[] {
  const vars = new Set<string>();
  const envRegex = /^([A-Z][A-Z0-9_]+)=/gm;

  for (const [name, content] of files) {
    if (name.includes(".env.example") || name.includes(".env.sample") || name.includes(".env.template")) {
      let match;
      while ((match = envRegex.exec(content)) !== null) {
        vars.add(match[1]);
      }
    }
  }

  return Array.from(vars).sort();
}

function findConfigFiles(fileList: string[]): string[] {
  const configPatterns = [
    "tsconfig", "jsconfig", ".eslintrc", ".prettierrc", "babel.config",
    ".babelrc", "postcss.config", "tailwind.config", ".editorconfig",
    "jest.config", "vitest.config", "webpack.config", "vite.config",
    "rollup.config", "turbo.json", "nx.json", "lerna.json",
    ".dockerignore", "docker-compose", "Dockerfile",
    ".github/workflows", ".gitlab-ci", "Jenkinsfile",
    "pyproject.toml", "setup.cfg", "setup.py", "tox.ini",
    "Cargo.toml", "go.mod", "go.sum",
  ];

  return fileList.filter((f) =>
    configPatterns.some((p) => f.includes(p))
  ).sort();
}

export function analyzeConfig(files: Map<string, string>, fileList: string[]): ConfigInfo {
  return {
    buildSystem: detectBuildSystem(files, fileList),
    testFramework: detectTestFramework(files, fileList),
    envVars: detectEnvVars(files),
    hasDocker: fileList.some((f) => f.includes("Dockerfile") || f.includes("docker-compose")),
    hasCI: fileList.some((f) => f.includes(".github/workflows") || f.includes(".gitlab-ci") || f.includes("Jenkinsfile") || f.includes(".circleci")),
    configFiles: findConfigFiles(fileList),
  };
}
