import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SynthesisOutput } from "@/components/council/synthesis-output";

const mockWriteText = vi.fn().mockResolvedValue(undefined);
const mockClipboard = {
  writeText: mockWriteText,
};

if (typeof navigator !== "undefined") {
  try {
    Object.defineProperty(navigator, "clipboard", {
      value: mockClipboard,
      writable: true,
      configurable: true,
    });
  } catch {
    try {
      delete (navigator as { clipboard?: unknown }).clipboard;
      Object.defineProperty(navigator, "clipboard", {
        value: mockClipboard,
        writable: true,
        configurable: true,
      });
    } catch (error_) {
      console.warn("Failed to mock navigator.clipboard:", error_);
    }
  }
}

vi.mock("@/shared/components/ui/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

vi.mock("@/hooks/use-keyboard-shortcuts", () => ({
  useKeyboardShortcuts: vi.fn(),
}));

describe("SynthesisOutput", () => {
  const mockPrompt = "This is a test golden prompt";

  beforeEach(() => {
    vi.clearAllMocks();
    mockWriteText.mockClear();
    mockWriteText.mockResolvedValue(undefined);
    if (typeof navigator !== "undefined") {
      try {
        Object.defineProperty(navigator, "clipboard", {
          value: mockClipboard,
          writable: true,
          configurable: true,
        });
      } catch {}
    }
  });

  it("should render the prompt", () => {
    render(<SynthesisOutput prompt={mockPrompt} />);
    expect(screen.getByText(mockPrompt)).toBeInTheDocument();
  });

  it("should display cost and models when provided", () => {
    render(
      <SynthesisOutput
        prompt={mockPrompt}
        cost={0.05}
        modelsUsed={["gpt-5.4-mini", "claude-haiku-4-5-20251001"]}
      />,
    );

    expect(screen.getByText(/0.05/)).toBeInTheDocument();
    expect(screen.getByText(/gpt-5.4-mini/)).toBeInTheDocument();
  });

  it("should copy to clipboard when copy button is clicked", async () => {
    mockWriteText.mockClear();
    mockWriteText.mockResolvedValue(undefined);

    render(<SynthesisOutput prompt={mockPrompt} />);

    const copyButton = screen.getByRole("button", { name: /copy/i });
    fireEvent.click(copyButton);

    await waitFor(
      () => {
        expect(mockWriteText).toHaveBeenCalledWith(mockPrompt);
      },
      { timeout: 3000 },
    );
  });

  it("should export as .cursorrules", async () => {
    const user = userEvent.setup();
    render(<SynthesisOutput prompt={mockPrompt} />);

    const mockAnchor = {
      href: "",
      download: "",
      click: vi.fn(),
    };
    const mockAnchorElement = mockAnchor as unknown as HTMLAnchorElement;
    const originalCreateElement = document.createElement.bind(document);
    const createElementSpy = vi
      .spyOn(document, "createElement")
      .mockImplementation((tagName) => {
        if (tagName === "a") {
          return mockAnchorElement;
        }
        return originalCreateElement(tagName);
      });
    const appendChildSpy = vi
      .spyOn(document.body, "appendChild")
      .mockImplementation(() => mockAnchorElement);
    const removeChildSpy = vi
      .spyOn(document.body, "removeChild")
      .mockImplementation(() => mockAnchorElement);

    const exportButton = screen.getByRole("button", { name: /\.cursorrules/i });
    await user.click(exportButton);

    expect(createElementSpy).toHaveBeenCalledWith("a");
    expect(mockAnchor.download).toBe(".cursorrules");
    expect(mockAnchor.click).toHaveBeenCalled();

    createElementSpy.mockRestore();
    appendChildSpy.mockRestore();
    removeChildSpy.mockRestore();
  });
});
