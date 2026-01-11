import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GoldenPromptOutput } from '@/components/council/golden-prompt-output';

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
});

// Mock toast
vi.mock('@/shared/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('GoldenPromptOutput', () => {
  const mockPrompt = 'This is a test golden prompt';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the prompt', () => {
    render(<GoldenPromptOutput prompt={mockPrompt} />);
    expect(screen.getByText(mockPrompt)).toBeInTheDocument();
  });

  it('should display cost and models when provided', () => {
    render(
      <GoldenPromptOutput
        prompt={mockPrompt}
        cost={0.05}
        modelsUsed={['gpt-4o-mini', 'claude-3-5-haiku']}
      />,
    );

    expect(screen.getByText(/0.05/)).toBeInTheDocument();
    expect(screen.getByText(/gpt-4o-mini/)).toBeInTheDocument();
  });

  it('should copy to clipboard when copy button is clicked', async () => {
    const user = userEvent.setup();
    render(<GoldenPromptOutput prompt={mockPrompt} />);

    const copyButton = screen.getByRole('button', { name: /copy/i });
    await user.click(copyButton);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockPrompt);
  });

  it('should export as .cursorrules', async () => {
    const user = userEvent.setup();
    const createElementSpy = vi.spyOn(document, 'createElement');
    const appendChildSpy = vi.spyOn(document.body, 'appendChild');
    const removeChildSpy = vi.spyOn(document.body, 'removeChild');

    render(<GoldenPromptOutput prompt={mockPrompt} />);

    const exportButton = screen.getByRole('button', { name: /\.cursorrules/i });
    await user.click(exportButton);

    expect(createElementSpy).toHaveBeenCalledWith('a');
  });
});

