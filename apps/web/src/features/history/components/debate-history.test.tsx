import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { DebateHistory } from "./debate-history";

// Mock fetch
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

// Mock next/link
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

describe("DebateHistory", () => {
  const mockDebates = [
    {
      id: "debate-1",
      topic: "Build a REST API with authentication",
      status: "completed",
      modelsUsed: ["gpt-5.4-mini", "claude-haiku-4-5-20251001"],
      totalCost: 0.0123,
      goldenPrompt: "Generated prompt here",
      createdAt: new Date().toISOString(),
    },
    {
      id: "debate-2",
      topic: "Create a React dashboard",
      status: "pending",
      modelsUsed: ["gpt-5.4"],
      totalCost: 0.0456,
      goldenPrompt: null,
      createdAt: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    },
    {
      id: "debate-3",
      topic: "Design a database schema",
      status: "completed",
      modelsUsed: ["claude-sonnet-4-6"],
      totalCost: 0.0789,
      goldenPrompt: "Schema prompt",
      createdAt: new Date(Date.now() - 604800000).toISOString(), // 7 days ago
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockDebates,
    });
  });

  it("renders loading state initially", () => {
    mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<DebateHistory />);

    // Should show skeletons while loading
    expect(document.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("fetches and displays debates", async () => {
    render(<DebateHistory />);

    await waitFor(() => {
      expect(
        screen.getByText("Build a REST API with authentication"),
      ).toBeInTheDocument();
      expect(screen.getByText("Create a React dashboard")).toBeInTheDocument();
      expect(screen.getByText("Design a database schema")).toBeInTheDocument();
    });

    expect(mockFetch).toHaveBeenCalledWith("/api/debates?limit=50&offset=0");
  });

  it("displays debate metadata", async () => {
    render(<DebateHistory />);

    await waitFor(() => {
      expect(
        screen.getByText(/gpt-5\.4-mini, claude-haiku-4-5-20251001/),
      ).toBeInTheDocument();
      expect(screen.getByText(/\$0\.0123/)).toBeInTheDocument();
    });

    // Check for Synthesis indicators (there may be multiple)
    const synthesisIndicators = screen.getAllByText("Synthesis");
    expect(synthesisIndicators.length).toBeGreaterThan(0);
  });

  it("shows empty state when no debates exist", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [],
    });

    render(<DebateHistory />);

    await waitFor(() => {
      expect(screen.getByText(/no debates yet/i)).toBeInTheDocument();
      expect(screen.getByText(/start debate/i)).toBeInTheDocument();
    });
  });

  it("filters debates by search query", async () => {
    render(<DebateHistory />);

    await waitFor(() => {
      expect(
        screen.getByText("Build a REST API with authentication"),
      ).toBeInTheDocument();
    });

    // Mock fetch to return only the matching debate for the search query
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [mockDebates[1]], // Only "Create a React dashboard"
    });

    const searchInput = screen.getByPlaceholderText(/search debates/i);
    fireEvent.change(searchInput, { target: { value: "React" } });

    // Wait for debounce and re-fetch
    await waitFor(() => {
      expect(
        screen.queryByText("Build a REST API with authentication"),
      ).not.toBeInTheDocument();
      expect(screen.getByText("Create a React dashboard")).toBeInTheDocument();
      expect(
        screen.queryByText("Design a database schema"),
      ).not.toBeInTheDocument();
    });
  });

  it("filters debates by date - today", async () => {
    render(<DebateHistory />);

    await waitFor(() => {
      expect(screen.getAllByRole("link", { name: /view/i })).toHaveLength(3);
    });

    const todayButton = screen.getByRole("button", { name: /today/i });
    fireEvent.click(todayButton);

    // Only today's debate should be visible
    await waitFor(() => {
      expect(
        screen.getByText("Build a REST API with authentication"),
      ).toBeInTheDocument();
      expect(
        screen.queryByText("Design a database schema"),
      ).not.toBeInTheDocument();
    });
  });

  it("filters debates by date - this week", async () => {
    render(<DebateHistory />);

    await waitFor(() => {
      expect(screen.getAllByRole("link", { name: /view/i })).toHaveLength(3);
    });

    const weekButton = screen.getByRole("button", { name: /this week/i });
    fireEvent.click(weekButton);

    // Today and yesterday's debates should be visible
    await waitFor(() => {
      expect(
        screen.getByText("Build a REST API with authentication"),
      ).toBeInTheDocument();
      expect(screen.getByText("Create a React dashboard")).toBeInTheDocument();
    });
  });

  it("resets to all debates when 'All' filter is clicked", async () => {
    render(<DebateHistory />);

    await waitFor(() => {
      expect(screen.getAllByRole("link", { name: /view/i })).toHaveLength(3);
    });

    // First filter to today
    const todayButton = screen.getByRole("button", { name: /today/i });
    fireEvent.click(todayButton);

    // Then reset to all
    const allButton = screen.getByRole("button", { name: /^all$/i });
    fireEvent.click(allButton);

    await waitFor(() => {
      expect(screen.getAllByRole("link", { name: /view/i })).toHaveLength(3);
    });
  });

  it("shows no results message when search has no matches", async () => {
    render(<DebateHistory />);

    await waitFor(() => {
      expect(
        screen.getByText("Build a REST API with authentication"),
      ).toBeInTheDocument();
    });

    // Mock fetch to return empty results for the search query
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [],
    });

    const searchInput = screen.getByPlaceholderText(/search debates/i);
    fireEvent.change(searchInput, {
      target: { value: "nonexistent query xyz" },
    });

    // Wait for debounce and re-fetch to complete
    await waitFor(() => {
      expect(
        screen.getByText(/no debates match your search/i),
      ).toBeInTheDocument();
    });
  });

  it("handles fetch error gracefully", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));

    render(<DebateHistory />);

    // Should not crash and should show empty state after loading
    await waitFor(() => {
      expect(screen.queryByText("Loading")).not.toBeInTheDocument();
    });
  });

  it("links to individual debate pages", async () => {
    render(<DebateHistory />);

    await waitFor(() => {
      const viewLinks = screen.getAllByRole("link", { name: /view/i });
      expect(viewLinks[0]).toHaveAttribute("href", "/debates/debate-1");
    });
  });
});
