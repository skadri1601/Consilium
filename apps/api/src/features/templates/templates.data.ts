export interface DebateTemplate {
  id: string;
  name: string;
  description: string;
  category: 'engineering' | 'product' | 'research' | 'business' | 'ethics';
  mode: string;
  suggestedModels: string[];
  systemPromptPrefix: string;
  topicPlaceholder: string;
  estimatedCostCents: number;
  icon: string;
}

export const DEBATE_TEMPLATES: DebateTemplate[] = [
  {
    id: 'bug-triage',
    name: 'Bug Triage',
    description: 'Multi-model analysis of a bug: root cause, severity, fix approach, regression risk',
    category: 'engineering',
    mode: 'council',
    suggestedModels: ['claude-sonnet-4-6', 'gpt-4o', 'gemini-2.0-flash'],
    systemPromptPrefix: 'You are a senior software engineer. Analyze the following bug report thoroughly.',
    topicPlaceholder: 'Paste your bug report, error stack trace, or describe the issue...',
    estimatedCostCents: 8,
    icon: 'bug',
  },
  {
    id: 'architecture-decision',
    name: 'Architecture Decision Record',
    description: 'Debate competing architectural approaches with trade-offs, scalability, and maintenance analysis',
    category: 'engineering',
    mode: 'council',
    suggestedModels: ['claude-opus-4-6', 'gpt-4o', 'gemini-2.5-pro'],
    systemPromptPrefix: 'You are a principal engineer evaluating architectural decisions.',
    topicPlaceholder: 'Describe the architectural decision you need to make...',
    estimatedCostCents: 25,
    icon: 'layers',
  },
  {
    id: 'code-review',
    name: 'Code Review Panel',
    description: 'Three reviewers debate your code: correctness, performance, security, and maintainability',
    category: 'engineering',
    mode: 'council',
    suggestedModels: ['claude-sonnet-4-6', 'gpt-4o', 'claude-haiku-4-5-20251001'],
    systemPromptPrefix: 'You are a code reviewer. Evaluate the code for bugs, performance, security vulnerabilities, and maintainability.',
    topicPlaceholder: 'Paste your code and describe what it should do...',
    estimatedCostCents: 12,
    icon: 'code',
  },
  {
    id: 'feature-prioritization',
    name: 'Feature Prioritization',
    description: 'Product debate: impact vs effort, user value, strategic alignment for competing features',
    category: 'product',
    mode: 'council',
    suggestedModels: ['claude-sonnet-4-6', 'gpt-4o-mini', 'gemini-2.0-flash'],
    systemPromptPrefix: 'You are a product manager evaluating feature requests for strategic fit and user impact.',
    topicPlaceholder: 'List the features you are considering prioritizing...',
    estimatedCostCents: 6,
    icon: 'list',
  },
  {
    id: 'risk-assessment',
    name: 'Risk Assessment',
    description: 'Red team analysis: adversarial models find failure modes, attack vectors, and edge cases',
    category: 'business',
    mode: 'adversarial',
    suggestedModels: ['claude-opus-4-6', 'gpt-4o', 'gemini-2.5-pro'],
    systemPromptPrefix: 'You are a risk analyst. Identify potential failures, risks, and mitigation strategies.',
    topicPlaceholder: 'Describe the plan, system, or decision you want to stress-test...',
    estimatedCostCents: 30,
    icon: 'shield',
  },
  {
    id: 'market-analysis',
    name: 'Market Analysis',
    description: 'Business debate: competitive landscape, positioning, opportunities and threats (SWOT)',
    category: 'business',
    mode: 'council',
    suggestedModels: ['claude-sonnet-4-6', 'gpt-4o', 'grok-2-1212'],
    systemPromptPrefix: 'You are a market analyst. Evaluate market conditions, competition, and business opportunities.',
    topicPlaceholder: 'Describe your business, product, or market you want to analyze...',
    estimatedCostCents: 15,
    icon: 'trending-up',
  },
  {
    id: 'research-direction',
    name: 'Research Direction',
    description: 'Academic-style debate on research hypotheses, methodology, and significance',
    category: 'research',
    mode: 'dialectical',
    suggestedModels: ['claude-opus-4-6', 'gemini-2.5-pro', 'gpt-4o'],
    systemPromptPrefix: 'You are a research scientist. Evaluate research questions for novelty, feasibility, and impact.',
    topicPlaceholder: 'Describe your research question or hypothesis...',
    estimatedCostCents: 35,
    icon: 'flask',
  },
  {
    id: 'ethical-dilemma',
    name: 'Ethical Dilemma',
    description: 'Multi-framework ethics debate: utilitarian, deontological, virtue ethics perspectives',
    category: 'ethics',
    mode: 'dialectical',
    suggestedModels: ['claude-opus-4-6', 'gpt-4o', 'gemini-2.5-pro'],
    systemPromptPrefix: 'You are an ethics expert. Analyze this situation from multiple ethical frameworks including utilitarian, deontological, and virtue ethics.',
    topicPlaceholder: 'Describe the ethical dilemma or decision you are facing...',
    estimatedCostCents: 28,
    icon: 'scale',
  },
];
