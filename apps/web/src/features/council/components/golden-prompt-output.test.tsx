import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GoldenPromptOutput } from '@/components/council/golden-prompt-output';

// Mock clipboard API - create a fresh mock for this test file
const mockWriteText = vi.fn().mockResolvedValue(undefined);
const mockClipboard = {
  writeText: mockWriteText,
};

// Set up navigator.clipboard before any tests run
if (typeof navigator !== 'undefined') {
  // Try to define the clipboard property
  // This may fail if the property is read-only, which is expected in some test environments
  const defineClipboard = () => {
    try {
      Object.defineProperty(navigator, 'clipboard', {
        value: mockClipboard,
        writable: true,
        configurable: true,
      });
      return true;
    } catch {
      return false;
    }
  };

  if (!defineClipboard()) {
    // If direct definition fails, try deleting first (may not work if property is read-only)
    try {
      delete (navigator as any).clipboard;
      defineClipboard();
    } catch (error_) {
      // If all methods fail, the test will fail when trying to use clipboard
      // This indicates a test environment configuration issue
      console.warn('Failed to mock navigator.clipboard:', error_);
    }
  }
}

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
    // Reset clipboard mock - ensure it's always set up
    mockWriteText.mockClear();
    mockWriteText.mockResolvedValue(undefined);
    // Re-ensure navigator.clipboard is set up
    if (typeof navigator !== 'undefined') {
      try {
        Object.defineProperty(navigator, 'clipboard', {
          value: mockClipboard,
          writable: true,
          configurable: true,
        });
      } catch (error) {
        // Ignore if already set up or read-only - this is expected in test environments
        // Log a warning if it's an unexpected error type
        if (error instanceof Error) {
          const isExpectedError = 
            error.message.includes('clipboard') || 
            error.message.includes('getter') ||
            error.message.includes('Cannot set property');
          if (!isExpectedError) {
            console.warn('Unexpected error setting up clipboard mock:', error);
          }
        }
      }
    }
  });

  afterEach(() => {
    // Don't restore navigator.clipboard - keep our mock
    // Only restore document.createElement spies if they exist
    // We'll restore them manually in tests that use them
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
    // Ensure clipboard mock is set up
    mockWriteText.mockClear();
    mockWriteText.mockResolvedValue(undefined);
    
    render(<GoldenPromptOutput prompt={mockPrompt} />);

    const copyButton = screen.getByRole('button', { name: /copy/i });
    fireEvent.click(copyButton);

    // Wait for the async clipboard call
    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalledWith(mockPrompt);
    }, { timeout: 3000 });
  });

  it('should export as .cursorrules', async () => {
    const user = userEvent.setup();
    // Render first to avoid React rendering issues
    render(<GoldenPromptOutput prompt={mockPrompt} />);

    const mockAnchor = {
      href: '',
      download: '',
      click: vi.fn(),
    };
    // Get the original createElement before spying
    const originalCreateElement = document.createElement.bind(document);
    const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      if (tagName === 'a') {
        return mockAnchor as any;
      }
      return originalCreateElement(tagName);
    });
    const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockAnchor as any);
    const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockAnchor as any);

    const exportButton = screen.getByRole('button', { name: /\.cursorrules/i });
    await user.click(exportButton);

    expect(createElementSpy).toHaveBeenCalledWith('a');
    expect(mockAnchor.download).toBe('.cursorrules');
    expect(mockAnchor.click).toHaveBeenCalled();

    // Restore mocks
    createElementSpy.mockRestore();
    appendChildSpy.mockRestore();
    removeChildSpy.mockRestore();
  });
});

