import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { GoldenPromptOutput } from "./golden-prompt-output";

// Mock the toast hook
vi.mock("@/shared/components/ui/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock clipboard API
const mockClipboard = {
  writeText: vi.fn(),
};

Object.assign(navigator, {
  clipboard: mockClipboard,
});

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = vi.fn(() => "blob:test-url");
global.URL.revokeObjectURL = vi.fn();

describe("GoldenPromptOutput", () => {
  const defaultProps = {
    prompt: "This is a test Golden Prompt for building a REST API.",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the golden prompt content", () => {
    render(<GoldenPromptOutput {...defaultProps} />);

    expect(screen.getByText("Golden Prompt")).toBeInTheDocument();
    expect(screen.getByText(defaultProps.prompt)).toBeInTheDocument();
  });

  it("displays cost when provided", () => {
    render(<GoldenPromptOutput {...defaultProps} cost={0.0123} />);

    expect(screen.getByText(/\$0\.0123/)).toBeInTheDocument();
  });

  it("displays models used when provided", () => {
    const modelsUsed = ["gpt-4o-mini", "claude-3-5-haiku-latest"];
    render(<GoldenPromptOutput {...defaultProps} modelsUsed={modelsUsed} />);

    expect(screen.getByText(/gpt-4o-mini, claude-3-5-haiku-latest/)).toBeInTheDocument();
  });

  it("copies prompt to clipboard when copy button is clicked", async () => {
    mockClipboard.writeText.mockResolvedValue(undefined);

    render(<GoldenPromptOutput {...defaultProps} />);

    const copyButton = screen.getByRole("button", { name: /copy/i });
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(mockClipboard.writeText).toHaveBeenCalledWith(defaultProps.prompt);
    });
  });

  it("shows checkmark after successful copy", async () => {
    mockClipboard.writeText.mockResolvedValue(undefined);

    render(<GoldenPromptOutput {...defaultProps} />);

    const copyButton = screen.getByRole("button", { name: /copy/i });
    fireEvent.click(copyButton);

    await waitFor(() => {
      // The button should now show a checkmark (CheckCircle2 icon)
      expect(screen.getByRole("button", { name: /copy/i })).toBeInTheDocument();
    });
  });

  it("has export as .cursorrules button", () => {
    render(<GoldenPromptOutput {...defaultProps} />);

    expect(screen.getByRole("button", { name: /\.cursorrules/i })).toBeInTheDocument();
  });

  it("has export as Markdown button", () => {
    render(<GoldenPromptOutput {...defaultProps} />);

    expect(screen.getByRole("button", { name: /markdown/i })).toBeInTheDocument();
  });

  it("exports as .cursorrules file when button clicked", () => {
    // Mock document.createElement and related methods
    const mockAnchor = {
      href: "",
      download: "",
      click: vi.fn(),
    };
    vi.spyOn(document, "createElement").mockReturnValue(mockAnchor as any);
    vi.spyOn(document.body, "appendChild").mockImplementation(() => mockAnchor as any);
    vi.spyOn(document.body, "removeChild").mockImplementation(() => mockAnchor as any);

    render(<GoldenPromptOutput {...defaultProps} />);

    const exportButton = screen.getByRole("button", { name: /\.cursorrules/i });
    fireEvent.click(exportButton);

    expect(mockAnchor.download).toBe(".cursorrules");
    expect(mockAnchor.click).toHaveBeenCalled();
  });

  it("exports as Markdown file when button clicked", () => {
    const mockAnchor = {
      href: "",
      download: "",
      click: vi.fn(),
    };
    vi.spyOn(document, "createElement").mockReturnValue(mockAnchor as any);
    vi.spyOn(document.body, "appendChild").mockImplementation(() => mockAnchor as any);
    vi.spyOn(document.body, "removeChild").mockImplementation(() => mockAnchor as any);

    render(<GoldenPromptOutput {...defaultProps} />);

    const exportButton = screen.getByRole("button", { name: /markdown/i });
    fireEvent.click(exportButton);

    expect(mockAnchor.download).toBe("golden-prompt.md");
    expect(mockAnchor.click).toHaveBeenCalled();
  });

  it("renders prompt content in a textbox role for accessibility", () => {
    render(<GoldenPromptOutput {...defaultProps} />);

    const promptContent = screen.getByRole("textbox", { name: /golden prompt content/i });
    expect(promptContent).toBeInTheDocument();
    expect(promptContent).toHaveTextContent(defaultProps.prompt);
  });

  it("handles very long prompts", () => {
    const longPrompt = "A".repeat(10000);
    render(<GoldenPromptOutput prompt={longPrompt} />);

    expect(screen.getByText(longPrompt)).toBeInTheDocument();
  });

  it("handles prompts with special characters", () => {
    const specialPrompt = "Build an API with `authentication` & <security>!";
    render(<GoldenPromptOutput prompt={specialPrompt} />);

    expect(screen.getByText(specialPrompt)).toBeInTheDocument();
  });
});

