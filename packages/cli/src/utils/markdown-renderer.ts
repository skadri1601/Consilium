import chalk from 'chalk';
import { terminal } from './terminal-capabilities';
import { highlightCode, detectLanguage, formatCodeBlock } from './syntax-highlighter';

export function renderMarkdown(markdown: string): string {
  const lines = markdown.split('\n');
  const out: string[] = [];
  let inCodeBlock = false;
  let codeLines: string[] = [];
  let codeLang = '';

  for (const line of lines) {
    if (inCodeBlock) {
      if (/^```\s*$/.test(line)) {
        inCodeBlock = false;
        out.push(formatCodeBlock(codeLines.join('\n'), codeLang || undefined));
        codeLines = [];
        codeLang = '';
      } else {
        codeLines.push(line);
      }
      continue;
    }

    const codeFenceMatch = line.match(/^```(\w*)\s*$/);
    if (codeFenceMatch) {
      inCodeBlock = true;
      codeLang = codeFenceMatch[1];
      continue;
    }

    if (/^###\s+/.test(line)) {
      out.push(chalk.bold.dim(line.replace(/^###\s+/, '')));
      continue;
    }
    if (/^##\s+/.test(line)) {
      out.push(chalk.bold(line.replace(/^##\s+/, '')));
      continue;
    }
    if (/^#\s+/.test(line)) {
      out.push(chalk.bold.underline(line.replace(/^#\s+/, '')));
      continue;
    }

    if (/^---\s*$/.test(line) || /^\*\*\*\s*$/.test(line) || /^___\s*$/.test(line)) {
      out.push(chalk.dim('─'.repeat(terminal.width)));
      continue;
    }

    if (/^>\s?/.test(line)) {
      const content = line.replace(/^>\s?/, '');
      out.push(chalk.dim(`  │ ${content}`));
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const content = line.replace(/^[-*]\s+/, '');
      out.push(`  • ${applyInlineStyles(content)}`);
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      out.push(applyInlineStyles(line));
      continue;
    }

    if (line.trim() === '') {
      out.push('');
      continue;
    }

    out.push(applyInlineStyles(line));
  }

  if (inCodeBlock && codeLines.length) {
    out.push(formatCodeBlock(codeLines.join('\n'), codeLang || undefined));
  }

  return out.join('\n');
}

function applyInlineStyles(text: string): string {
  let result = text;
  result = result.replace(/`([^`]+)`/g, (_, code) => chalk.bgGray.white(` ${code} `));
  result = result.replace(/\*\*([^*]+)\*\*/g, (_, bold) => chalk.bold(bold));
  result = result.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, (_, it) => chalk.italic(it));
  result = result.replace(/(?<!_)_([^_]+)_(?!_)/g, (_, it) => chalk.italic(it));
  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, url) => `${label} ${chalk.dim(`(${url})`)}`);
  return result;
}

export function stripMarkdown(markdown: string): string {
  const lines = markdown.split('\n');
  const out: string[] = [];
  let inCodeBlock = false;

  for (const line of lines) {
    if (inCodeBlock) {
      if (/^```\s*$/.test(line)) {
        inCodeBlock = false;
      } else {
        out.push(line);
      }
      continue;
    }
    if (/^```/.test(line)) {
      inCodeBlock = true;
      continue;
    }

    let cleaned = line;
    cleaned = cleaned.replace(/^#{1,6}\s+/, '');
    cleaned = cleaned.replace(/^>\s?/, '');
    cleaned = cleaned.replace(/^[-*]\s+/, '- ');
    cleaned = cleaned.replace(/^(---|\*\*\*|___)\s*$/, '---');
    cleaned = cleaned.replace(/`([^`]+)`/g, '$1');
    cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '$1');
    cleaned = cleaned.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '$1');
    cleaned = cleaned.replace(/(?<!_)_([^_]+)_(?!_)/g, '$1');
    cleaned = cleaned.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)');
    out.push(cleaned);
  }

  return out.join('\n');
}
