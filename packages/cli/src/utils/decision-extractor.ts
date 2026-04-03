export interface Decision {
  category: string;
  statement: string;
  confidence: 'high' | 'medium' | 'low';
  source: string;
  debateIndex: number;
  status: 'decided' | 'tentative' | 'open' | 'superseded';
  resolvedBy?: number;
}

const DECIDED_PATTERNS = [
  /(?:should|must|will)\s+use\s+(.+)/i,
  /(?:decided|chosen|selected|agreed)\s+(?:to\s+|on\s+)?(.+)/i,
  /(?:recommend(?:s|ed)?|recommending)\s+(.+)/i,
  /(?:the\s+(?:best|recommended|chosen)\s+(?:approach|solution|option)\s+is)\s+(.+)/i,
  /(?:go\s+with|choose|pick)\s+(.+)/i,
];

const TENTATIVE_PATTERNS = [
  /(?:could|might|may)\s+(?:use|consider|try)\s+(.+)/i,
  /(?:leaning\s+toward(?:s)?|prefer(?:s)?)\s+(.+)/i,
  /(?:likely|probably)\s+(.+)/i,
];

const OPEN_PATTERNS = [
  /(?:need(?:s)?\s+to\s+(?:decide|determine|evaluate|investigate))\s+(.+)/i,
  /(?:what|which|how|whether)\s+(.+)\?/i,
  /(?:open\s+question|unresolved|unclear|tbd)[:\s]+(.+)/i,
  /(?:requires?\s+(?:further|more)\s+(?:discussion|analysis|investigation))\s+(.+)/i,
];

function inferCategory(statement: string): string {
  const lower = statement.toLowerCase();
  const categoryMap: Record<string, string[]> = {
    AUTH: ['auth', 'jwt', 'token', 'oauth', 'login', 'session', 'password', 'credential'],
    DATABASE: ['database', 'db', 'sql', 'postgres', 'mysql', 'mongo', 'redis', 'migration', 'schema'],
    API: ['api', 'endpoint', 'rest', 'graphql', 'grpc', 'route', 'middleware'],
    ARCHITECTURE: ['architecture', 'microservice', 'monolith', 'pattern', 'structure', 'layer'],
    TESTING: ['test', 'spec', 'jest', 'mocha', 'coverage', 'e2e', 'unit test'],
    DEPLOYMENT: ['deploy', 'ci/cd', 'docker', 'kubernetes', 'pipeline', 'hosting'],
    SECURITY: ['security', 'encrypt', 'ssl', 'tls', 'cors', 'csrf', 'xss', 'vulnerability'],
    PERFORMANCE: ['performance', 'cache', 'caching', 'optimize', 'speed', 'latency', 'throughput'],
    RATE_LIMITING: ['rate limit', 'throttl', 'sliding window'],
    UI: ['ui', 'frontend', 'component', 'react', 'css', 'layout', 'design'],
    STATE: ['state', 'redux', 'store', 'context', 'zustand'],
  };

  for (const [category, keywords] of Object.entries(categoryMap)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return category;
    }
  }

  return 'GENERAL';
}

function inferConfidence(text: string, status: Decision['status']): Decision['confidence'] {
  if (status === 'open') return 'low';
  if (status === 'tentative') return 'medium';

  const lower = text.toLowerCase();
  if (/\b(strongly|clearly|definitely|must|unanimously)\b/.test(lower)) return 'high';
  if (/\b(probably|likely|should|recommend)\b/.test(lower)) return 'medium';

  return 'high';
}

export function extractDecisionsFromText(
  text: string,
  topic: string,
  debateIndex: number
): Decision[] {
  const decisions: Decision[] = [];
  const sentences = text.split(/[.!]\s+/).map((s) => s.trim()).filter(Boolean);

  for (const sentence of sentences) {
    let matched = false;

    for (const pattern of DECIDED_PATTERNS) {
      const match = sentence.match(pattern);
      if (match) {
        const statement = match[1] || match[0];
        decisions.push({
          category: inferCategory(statement),
          statement: statement.replace(/[.!]+$/, '').trim(),
          confidence: inferConfidence(sentence, 'decided'),
          source: topic,
          debateIndex,
          status: 'decided',
        });
        matched = true;
        break;
      }
    }

    if (matched) continue;

    for (const pattern of TENTATIVE_PATTERNS) {
      const match = sentence.match(pattern);
      if (match) {
        const statement = match[1] || match[0];
        decisions.push({
          category: inferCategory(statement),
          statement: statement.replace(/[.!]+$/, '').trim(),
          confidence: inferConfidence(sentence, 'tentative'),
          source: topic,
          debateIndex,
          status: 'tentative',
        });
        matched = true;
        break;
      }
    }

    if (matched) continue;

    for (const pattern of OPEN_PATTERNS) {
      const match = sentence.match(pattern);
      if (match) {
        const statement = match[1] || match[0];
        decisions.push({
          category: inferCategory(statement),
          statement: statement.replace(/[?]+$/, '').trim(),
          confidence: 'low',
          source: topic,
          debateIndex,
          status: 'open',
        });
        break;
      }
    }
  }

  return decisions;
}

export class DecisionLog {
  decisions: Decision[] = [];

  addFromSynthesis(synthesis: string, debateTopic: string, debateIndex: number): void {
    const extracted = extractDecisionsFromText(synthesis, debateTopic, debateIndex);
    this.decisions.push(...extracted);
  }

  resolveDecision(category: string, resolution: string, debateIndex: number): void {
    for (const d of this.decisions) {
      if (d.category === category && (d.status === 'open' || d.status === 'tentative')) {
        d.status = 'superseded';
        d.resolvedBy = debateIndex;
      }
    }

    this.decisions.push({
      category,
      statement: resolution,
      confidence: 'high',
      source: `Resolution from debate ${debateIndex}`,
      debateIndex,
      status: 'decided',
    });
  }

  getContext(tokenBudget: number = 3000): string {
    const charBudget = tokenBudget * 4;
    const lines: string[] = ['PREVIOUS CONTEXT (extracted decisions):'];

    const decided = this.decisions.filter((d) => d.status === 'decided');
    const open = this.decisions.filter((d) => d.status === 'open');
    const tentative = this.decisions.filter((d) => d.status === 'tentative');
    const superseded = this.decisions.filter((d) => d.status === 'superseded');

    const groups: { items: Decision[]; label: string }[] = [
      { items: decided, label: 'DECIDED' },
      { items: open, label: 'OPEN' },
      { items: tentative, label: 'TENTATIVE' },
      { items: superseded, label: 'SUPERSEDED' },
    ];

    let totalChars = lines[0].length;

    for (const group of groups) {
      for (const d of group.items) {
        let line = `- ${d.category}: ${d.statement} (Debate ${d.debateIndex}) [${d.status.toUpperCase()}]`;
        if (d.resolvedBy !== undefined) {
          line += ` -> resolved in Debate ${d.resolvedBy}`;
        }

        if (totalChars + line.length + 1 > charBudget) {
          return lines.join('\n');
        }

        lines.push(line);
        totalChars += line.length + 1;
      }
    }

    return lines.join('\n');
  }

  toJSON(): object {
    return { decisions: this.decisions };
  }

  static fromJSON(data: object): DecisionLog {
    const log = new DecisionLog();
    const raw = data as { decisions?: Decision[] };
    if (raw.decisions && Array.isArray(raw.decisions)) {
      log.decisions = raw.decisions;
    }
    return log;
  }
}
