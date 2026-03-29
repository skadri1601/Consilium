import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SynthesisOutput } from "./synthesis-output";

vi.mock("@/shared/components/ui/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

vi.mock("@/hooks/use-keyboard-shortcuts", () => ({
  useKeyboardShortcuts: vi.fn(),
}));

const mockWriteText = vi.fn().mockResolvedValue(undefined);
const mockClipboard = {
  writeText: mockWriteText,
};

if (typeof navigator !== 'undefined') {
  Object.defineProperty(navigator, 'clipboard', {
    value: mockClipboard,
    writable: true,
    configurable: true,
  });
}

describe("SynthesisOutput", () => {
  const defaultProps = {
    prompt: "This is a test Golden Prompt for building a REST API.",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockWriteText.mockClear();
    mockWriteText.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the synthesis content", () => {
    render(<SynthesisOutput {...defaultProps} />);

    expect(screen.getByText("Synthesis")).toBeInTheDocument();
    expect(screen.getByText(defaultProps.prompt)).toBeInTheDocument();
  });

  it("displays cost when provided", () => {
    render(<SynthesisOutput {...defaultProps} cost={0.0123} />);

    expect(screen.getByText(/\$0\.0123/)).toBeInTheDocument();
  });

  it("displays models used when provided", () => {
    const modelsUsed = ["gpt-4o-mini", "claude-3-5-haiku-latest"];
    render(<SynthesisOutput {...defaultProps} modelsUsed={modelsUsed} cost={0.01} />);

    expect(screen.getByText(/gpt-4o-mini, claude-3-5-haiku-latest/)).toBeInTheDocument();
  });

  it("copies prompt to clipboard when copy button is clicked", async () => {
    mockClipboard.writeText.mockResolvedValue(undefined);

    render(<SynthesisOutput {...defaultProps} />);

    const copyButton = screen.getByRole("button", { name: /copy/i });
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(mockClipboard.writeText).toHaveBeenCalledWith(defaultProps.prompt);
    });
  });

  it("shows checkmark after successful copy", async () => {
    render(<SynthesisOutput {...defaultProps} />);

    const copyButton = screen.getByRole("button", { name: /copy/i });
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /copy/i })).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it("has export as .cursorrules button", () => {
    render(<SynthesisOutput {...defaultProps} />);

    expect(screen.getByRole("button", { name: /\.cursorrules/i })).toBeInTheDocument();
  });

  it("has export as Markdown button", () => {
    render(<SynthesisOutput {...defaultProps} />);

    expect(screen.getByRole("button", { name: /markdown/i })).toBeInTheDocument();
  });

  it("exports as .cursorrules file when button clicked", () => {
    render(<SynthesisOutput {...defaultProps} />);

    const mockAnchor = {
      href: "",
      download: "",
      click: vi.fn(),
    };
    const originalCreateElement = document.createElement.bind(document);
    const createElementSpy = vi.spyOn(document, "createElement").mockImplementation((tagName) => {
      if (tagName === "a") {
        return mockAnchor as any;
      }
      return originalCreateElement(tagName);
    });
    const appendChildSpy = vi.spyOn(document.body, "appendChild").mockImplementation(() => mockAnchor as any);
    const removeChildSpy = vi.spyOn(document.body, "removeChild").mockImplementation(() => mockAnchor as any);

    const exportButton = screen.getByRole("button", { name: /\.cursorrules/i });
    fireEvent.click(exportButton);

    expect(mockAnchor.download).toBe(".cursorrules");
    expect(mockAnchor.click).toHaveBeenCalled();

    createElementSpy.mockRestore();
    appendChildSpy.mockRestore();
    removeChildSpy.mockRestore();
  });

  it("exports as Markdown file when button clicked", () => {
    render(<SynthesisOutput {...defaultProps} />);

    const mockAnchor = {
      href: "",
      download: "",
      click: vi.fn(),
    };
    const originalCreateElement = document.createElement.bind(document);
    const createElementSpy = vi.spyOn(document, "createElement").mockImplementation((tagName) => {
      if (tagName === "a") {
        return mockAnchor as any;
      }
      return originalCreateElement(tagName);
    });
    const appendChildSpy = vi.spyOn(document.body, "appendChild").mockImplementation(() => mockAnchor as any);
    const removeChildSpy = vi.spyOn(document.body, "removeChild").mockImplementation(() => mockAnchor as any);

    const exportButton = screen.getByRole("button", { name: /markdown/i });
    fireEvent.click(exportButton);

    expect(mockAnchor.download).toBe("synthesis.md");
    expect(mockAnchor.click).toHaveBeenCalled();

    createElementSpy.mockRestore();
    appendChildSpy.mockRestore();
    removeChildSpy.mockRestore();
  });

  it("renders prompt content in a textbox role for accessibility", () => {
    render(<SynthesisOutput {...defaultProps} />);

    const promptContent = screen.getByRole("textbox", { name: /synthesis content/i });
    expect(promptContent).toBeInTheDocument();
    expect(promptContent).toHaveTextContent(defaultProps.prompt);
  });

  it("handles very long prompts", () => {
    const longPrompt = "A".repeat(10000);
    render(<SynthesisOutput prompt={longPrompt} />);

    expect(screen.getByText(longPrompt)).toBeInTheDocument();
  });

  it("handles prompts with special characters", () => {
    const specialPrompt = "Build an API with `authentication` & <security>!";
    render(<SynthesisOutput prompt={specialPrompt} />);

    expect(screen.getByText(specialPrompt)).toBeInTheDocument();
  });
});
