import { z } from 'zod';
import { loadConfig } from './config';

export interface Decision {
  category: string;
  statement: string;
  confidence: 'high' | 'medium' | 'low';
  source: string;
  debateIndex: number;
  status: 'decided' | 'tentative' | 'open' | 'superseded';
  resolvedBy?: number;
  supportingModels?: string[];
}

export interface SemanticExtractionResult {
  decisions: Array<{
    decision: string;
    confidence: number;
    supporting_models: string[];
    category: string;
  }>;
  action_items: string[];
  key_disagreements: string[];
  consensus_level: number;
}

const SemanticExtractionSchema = z.object({
  decisions: z.array(z.object({
    decision: z.string(),
    confidence: z.number().min(0).max(1),
    supporting_models: z.array(z.string()),
    category: z.string(),
  })),
  action_items: z.array(z.string()),
  key_disagreements: z.array(z.string()),
  consensus_level: z.number().min(0).max(1),
});

const EXTRACTION_PROMPT = `You are a structured data extractor. Given debate synthesis text, extract:

1. decisions: Each decision with:
   - decision: The specific decision or recommendation (concise statement)
   - confidence: 0.0-1.0 how confident/agreed-upon this decision is
   - supporting_models: Which AI models supported this (extract model names from text, or use ["unknown"] if unclear)
   - category: One of AUTH, DATABASE, API, ARCHITECTURE, TESTING, DEPLOYMENT, SECURITY, PERFORMANCE, RATE_LIMITING, UI, STATE, or GENERAL

2. action_items: Concrete next steps or things to implement

3. key_disagreements: Points where models disagreed

4. consensus_level: 0.0-1.0 overall agreement level across all decisions

Respond with ONLY valid JSON matching this schema. No markdown, no explanation.`;

const extractionCache = new Map<string, { result: SemanticExtractionResult; timestamp: number }>();
const CACHE_TTL_MS = 30 * 60 * 1000;

function hashText(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return String(hash);
}

function getCachedResult(text: string): SemanticExtractionResult | null {
  const key = hashText(text);
  const cached = extractionCache.get(key);
  if (!cached) return null;
  if (Date.now() - cached.timestamp > CACHE_TTL_MS) {
    extractionCache.delete(key);
    return null;
  }
  return cached.result;
}

function setCachedResult(text: string, result: SemanticExtractionResult): void {
  const key = hashText(text);
  extractionCache.set(key, { result, timestamp: Date.now() });
}

async function callLLMForExtraction(text: string): Promise<SemanticExtractionResult> {
  const config = loadConfig();
  const apiUrl = config.apiUrl || 'http://localhost:4000';
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (config.apiKey) {
    headers['Authorization'] = `Bearer ${config.apiKey}`;
  }

  const debate = await fetch(`${apiUrl}/api/v1/debates`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      topic: `${EXTRACTION_PROMPT}\n\n--- DEBATE SYNTHESIS ---\n${text}`,
      models: ['claude-haiku-4-5-20251001'],
      mode: 'quick',
    }),
    signal: AbortSignal.timeout(15000),
  });

  if (!debate.ok) {
    throw new Error(`Extraction API call failed: HTTP ${debate.status}`);
  }

  const { id } = (await debate.json()) as { id: string };

  let fullText = '';
  const streamUrl = `${apiUrl}/api/v1/debates/${id}/stream`;
  const EventSourceModule = await import('eventsource');
  const EventSource = EventSourceModule.default;

  const init: { headers?: Record<string, string> } = {};
  if (config.apiKey) {
    init.headers = { Authorization: `Bearer ${config.apiKey}` };
  }

  await new Promise<void>((resolve, reject) => {
    const es = new EventSource(streamUrl, init);

    es.onmessage = (event: any) => {
      try {
        const data = JSON.parse(event.data);
        const eventType = data.event ?? 'message';

        if (data.chunk) fullText += data.chunk;
        if (data.consensus || data.golden_prompt || data.goldenPrompt) {
          fullText = data.consensus || data.golden_prompt || data.goldenPrompt;
        }
        if (data.response || data.content) {
          fullText = data.response || data.content;
        }

        if (eventType === 'done') { es.close(); resolve(); }
        if (eventType === 'error') { es.close(); reject(new Error(data.error || 'Stream error')); }
      } catch {
        es.close();
        reject(new Error('Failed to parse extraction stream'));
      }
    };

    es.onerror = () => { es.close(); reject(new Error('Extraction stream failed')); };
    setTimeout(() => { es.close(); reject(new Error('Extraction stream timeout')); }, 30000);
  });

  const jsonMatch = fullText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in extraction response');
  }

  const parsed = JSON.parse(jsonMatch[0]);
  return SemanticExtractionSchema.parse(parsed);
}

export async function extractDecisionsSemantic(
  text: string,
  topic: string,
  debateIndex: number
): Promise<{ decisions: Decision[]; extraction: SemanticExtractionResult }> {
  const cached = getCachedResult(text);
  if (cached) {
    return { decisions: mapSemanticToDecisions(cached, topic, debateIndex), extraction: cached };
  }

  try {
    const result = await callLLMForExtraction(text);
    setCachedResult(text, result);
    return { decisions: mapSemanticToDecisions(result, topic, debateIndex), extraction: result };
  } catch {
    const decisions = extractDecisionsFromText(text, topic, debateIndex);
    const fallbackExtraction: SemanticExtractionResult = {
      decisions: decisions.map((d) => ({
        decision: d.statement,
        confidence: d.confidence === 'high' ? 0.9 : d.confidence === 'medium' ? 0.6 : 0.3,
        supporting_models: [],
        category: d.category,
      })),
      action_items: [],
      key_disagreements: [],
      consensus_level: 0.5,
    };
    return { decisions, extraction: fallbackExtraction };
  }
}

function confidenceToLevel(confidence: number): 'high' | 'medium' | 'low' {
  if (confidence >= 0.7) return 'high';
  if (confidence >= 0.4) return 'medium';
  return 'low';
}

function confidenceToStatus(confidence: number): 'decided' | 'tentative' | 'open' {
  if (confidence >= 0.7) return 'decided';
  if (confidence >= 0.4) return 'tentative';
  return 'open';
}

function mapSemanticToDecisions(
  result: SemanticExtractionResult,
  topic: string,
  debateIndex: number
): Decision[] {
  return result.decisions.map((d) => ({
    category: d.category,
    statement: d.decision,
    confidence: confidenceToLevel(d.confidence),
    source: topic,
    debateIndex,
    status: confidenceToStatus(d.confidence),
    supportingModels: d.supporting_models,
  }));
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
  lastExtraction: SemanticExtractionResult | null = null;

  async addFromSynthesis(synthesis: string, debateTopic: string, debateIndex: number): Promise<void> {
    const { decisions, extraction } = await extractDecisionsSemantic(synthesis, debateTopic, debateIndex);
    this.decisions.push(...decisions);
    this.lastExtraction = extraction;
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

    if (this.lastExtraction) {
      if (this.lastExtraction.action_items.length > 0) {
        const actionLine = `ACTION ITEMS: ${this.lastExtraction.action_items.join('; ')}`;
        if (totalChars + actionLine.length + 1 <= charBudget) {
          lines.push(actionLine);
          totalChars += actionLine.length + 1;
        }
      }
      if (this.lastExtraction.key_disagreements.length > 0) {
        const disagreementLine = `KEY DISAGREEMENTS: ${this.lastExtraction.key_disagreements.join('; ')}`;
        if (totalChars + disagreementLine.length + 1 <= charBudget) {
          lines.push(disagreementLine);
          totalChars += disagreementLine.length + 1;
        }
      }
      const consensusLine = `CONSENSUS LEVEL: ${(this.lastExtraction.consensus_level * 100).toFixed(0)}%`;
      if (totalChars + consensusLine.length + 1 <= charBudget) {
        lines.push(consensusLine);
        totalChars += consensusLine.length + 1;
      }
    }

    for (const group of groups) {
      for (const d of group.items) {
        let line = `- ${d.category}: ${d.statement} (Debate ${d.debateIndex}) [${d.status.toUpperCase()}]`;
        if (d.supportingModels?.length) {
          line += ` {${d.supportingModels.join(', ')}}`;
        }
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
    return {
      decisions: this.decisions,
      lastExtraction: this.lastExtraction,
    };
  }

  static fromJSON(data: object): DecisionLog {
    const log = new DecisionLog();
    const raw = data as { decisions?: Decision[]; lastExtraction?: SemanticExtractionResult | null };
    if (raw.decisions && Array.isArray(raw.decisions)) {
      log.decisions = raw.decisions;
    }
    if (raw.lastExtraction) {
      log.lastExtraction = raw.lastExtraction;
    }
    return log;
  }
}
