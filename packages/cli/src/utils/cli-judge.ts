export type JudgePhase = 1 | 2 | 3 | 4 | 5;

export const CLI_JUDGE_CONFIG = {
  source: 'cli' as const,
  priorities: [
    'code_correctness',
    'project_relevance',
    'implementation_feasibility',
    'codebase_compatibility',
    'maintainability',
    'security',
  ],
  phase5Emphasis: 'working code > elegant code',
};

export const CLI_JUDGE_PHASE5_PROMPT = `You are synthesizing a multi-agent debate for a CLI user working on a codebase.

PRIORITIES (in order):
1. CODE CORRECTNESS — Does the code compile/run? Are there bugs?
2. PROJECT RELEVANCE — Does the solution fit THIS specific project's stack, patterns, and conventions?
3. IMPLEMENTATION FEASIBILITY — Can a developer implement this now with the current codebase?
4. CODEBASE COMPATIBILITY — Does it work with existing dependencies, APIs, and architecture?
5. MAINTAINABILITY — Is it maintainable by the team? Clear naming, reasonable complexity?
6. SECURITY — Are there vulnerabilities? SQL injection, XSS, secrets exposure?

RULES:
- Working code > elegant code
- Concrete implementations > abstract advice
- If agents provide code, synthesize the BEST working version
- Include file paths and line numbers when referencing code
- Flag any security concerns explicitly
- If a ProjectContext is provided, ensure recommendations are compatible with the detected stack

{projectContext}

Synthesize the debate into a clear, actionable response.`;

export const WEB_JUDGE_PRIORITIES = [
  'logical_reasoning',
  'evidence_quality',
  'completeness',
  'real_world_applicability',
  'nuance',
] as const;

const WEB_JUDGE_CONFIG = {
  source: 'web' as const,
  priorities: [...WEB_JUDGE_PRIORITIES],
};

export function buildJudgePayload(projectContext?: any): object {
  const phase5Prompt = projectContext
    ? CLI_JUDGE_PHASE5_PROMPT.replace(
        '{projectContext}',
        `ProjectContext:\n${JSON.stringify(projectContext, null, 2)}`
      )
    : CLI_JUDGE_PHASE5_PROMPT.replace('{projectContext}', '');

  return {
    judgeConfig: {
      source: 'cli',
      priorities: [...CLI_JUDGE_CONFIG.priorities],
      phase5Prompt,
    },
  };
}

export function getJudgeConfig(source: 'cli' | 'web'): object {
  if (source === 'cli') {
    return { ...CLI_JUDGE_CONFIG };
  }
  return { ...WEB_JUDGE_CONFIG };
}
