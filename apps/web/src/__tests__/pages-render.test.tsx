import { render, screen, within } from "@testing-library/react";

vi.mock("framer-motion", () => {
  const React = require("react");
  return {
    motion: new Proxy(
      {},
      {
        get: (_target: unknown, prop: string) =>
          React.forwardRef((props: Record<string, unknown>, ref: unknown) =>
            React.createElement(prop, { ...props, ref }),
          ),
      },
    ),
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
    useScroll: () => ({ scrollY: { getPrevious: () => 0 } }),
    useMotionValueEvent: vi.fn(),
  };
});

vi.mock("@clerk/nextjs", () => ({
  useUser: () => ({ user: null, isLoaded: true }),
  useAuth: () => ({ userId: null, isLoaded: true }),
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
  SignIn: () => <div data-testid="clerk-sign-in">Sign In</div>,
  SignUp: () => <div data-testid="clerk-sign-up">Sign Up</div>,
}));

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => <img {...props} />,
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...rest
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("recharts", () => {
  const React = require("react");
  return {
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container">{children}</div>
    ),
    BarChart: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="bar-chart">{children}</div>
    ),
    Bar: () => <div data-testid="bar" />,
    XAxis: () => <div />,
    YAxis: () => <div />,
    CartesianGrid: () => <div />,
    Tooltip: () => <div />,
    Cell: () => <div />,
    PieChart: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="pie-chart">{children}</div>
    ),
    Pie: () => <div />,
    LineChart: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="line-chart">{children}</div>
    ),
    Line: () => <div />,
    Legend: () => <div />,
  };
});

import LandingPage from "@/app/(marketing)/page";
import AboutPage from "@/app/(marketing)/about/page";
import BlogPage from "@/app/(marketing)/blog/page";
import PricingPage from "@/app/(marketing)/pricing/page";
import DocsPage from "@/app/(marketing)/docs/page";
import ApiDocsPage from "@/app/(marketing)/docs/api/page";
import CliDocsPage from "@/app/(marketing)/docs/cli/page";
import ContactPage from "@/app/(marketing)/contact/page";
import UseCasesPage from "@/app/(marketing)/use-cases/page";
import ResearchPage from "@/app/(marketing)/research/page";
import PrivacyPage from "@/app/(marketing)/privacy/page";
import TermsPage from "@/app/(marketing)/terms/page";
import FAQPage from "@/app/(marketing)/faq/page";
import SignInPage from "@/app/(auth)/sign-in/[[...sign-in]]/page";
import SignUpPage from "@/app/(auth)/sign-up/[[...sign-up]]/page";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { MarketingFooter } from "@/components/layout/marketing-footer";
import { Logo } from "@/components/shared/logo";
import { DebateTimeline } from "@/features/council/components/debate-timeline";
import { VoteVisualization } from "@/features/council/components/vote-visualization";
import { DissentReport } from "@/features/debates/components/dissent-report";
import { SplitPaneComparison } from "@/features/debates/components/split-pane-comparison";
import { CostDashboard } from "@/features/analytics/components/cost-dashboard";

function assertLinksHaveHref(container: HTMLElement) {
  const links = container.querySelectorAll("a");
  links.forEach((link) => {
    expect(link).toHaveAttribute("href");
    expect(link.getAttribute("href")).not.toBe("");
  });
}

describe("Marketing Pages", () => {
  describe("Landing Page (/)", () => {
    it("renders without throwing", () => {
      expect(() => render(<LandingPage />)).not.toThrow();
    });

    it("renders h1 heading", () => {
      render(<LandingPage />);
      expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    });

    it("renders video hero", () => {
      const { container } = render(<LandingPage />);
      expect(container.querySelector("video")).toBeInTheDocument();
    });

    it("renders 8 deliberation modes", () => {
      render(<LandingPage />);
      expect(screen.getByText("Quick")).toBeInTheDocument();
      expect(screen.getByText("Council")).toBeInTheDocument();
      expect(screen.getByText("Deep")).toBeInTheDocument();
      expect(screen.getByText("Blind")).toBeInTheDocument();
      expect(screen.getByText("Red Team")).toBeInTheDocument();
      expect(screen.getByText("Jury")).toBeInTheDocument();
      expect(screen.getByText("Market")).toBeInTheDocument();
      expect(screen.getByText("Auto")).toBeInTheDocument();
    });

    it("renders SDK code examples", () => {
      render(<LandingPage />);
      expect(screen.getByText("SDK Examples")).toBeInTheDocument();
      expect(screen.getByText("Python")).toBeInTheDocument();
      expect(screen.getByText("TypeScript")).toBeInTheDocument();
      expect(screen.getByText("CLI")).toBeInTheDocument();
    });

    it("has valid links", () => {
      const { container } = render(<LandingPage />);
      assertLinksHaveHref(container);
    });
  });

  describe("About Page (/about)", () => {
    it("renders without throwing", () => {
      expect(() => render(<AboutPage />)).not.toThrow();
    });

    it("renders h1 heading", () => {
      render(<AboutPage />);
      expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    });

    it("renders video hero", () => {
      const { container } = render(<AboutPage />);
      expect(container.querySelector("video")).toBeInTheDocument();
    });

    it("renders What Makes Consilium Different section", () => {
      render(<AboutPage />);
      expect(
        screen.getByText("What Makes Consilium Different"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("True Deliberation, Not Orchestration"),
      ).toBeInTheDocument();
      expect(screen.getByText("Formal Voting Theory")).toBeInTheDocument();
      expect(
        screen.getByText("Mathematical Convergence Detection"),
      ).toBeInTheDocument();
    });

    it("has valid links", () => {
      const { container } = render(<AboutPage />);
      assertLinksHaveHref(container);
    });
  });

  describe("Blog Page (/blog)", () => {
    it("renders without throwing", () => {
      expect(() => render(<BlogPage />)).not.toThrow();
    });

    it("renders h1 heading", () => {
      render(<BlogPage />);
      expect(
        screen.getByRole("heading", { level: 1, name: /blog/i }),
      ).toBeInTheDocument();
    });

    it("renders category filters", () => {
      render(<BlogPage />);
      const filterSection = screen.getByText("All").parentElement!;
      expect(within(filterSection).getByText("All")).toBeInTheDocument();
      expect(within(filterSection).getByText("Benchmarks")).toBeInTheDocument();
      expect(
        within(filterSection).getByText("Engineering"),
      ).toBeInTheDocument();
      expect(within(filterSection).getByText("Research")).toBeInTheDocument();
    });

    it("renders blog post entries", () => {
      render(<BlogPage />);
      expect(
        screen.getAllByText(/Council Deliberation vs Single Models/i).length,
      ).toBeGreaterThan(0);
    });

    it("has valid links", () => {
      const { container } = render(<BlogPage />);
      assertLinksHaveHref(container);
    });
  });

  describe("Pricing Page (/pricing)", () => {
    it("renders without throwing", () => {
      expect(() => render(<PricingPage />)).not.toThrow();
    });

    it("renders h1 heading", () => {
      render(<PricingPage />);
      expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    });

    it("renders pricing tiers", () => {
      render(<PricingPage />);
      expect(screen.getAllByText("Free").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Pro").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Max").length).toBeGreaterThan(0);
    });

    it("renders prices", () => {
      render(<PricingPage />);
      expect(screen.getByText("$0")).toBeInTheDocument();
      expect(screen.getByText("$29")).toBeInTheDocument();
      expect(screen.getByText("$99")).toBeInTheDocument();
    });

    it("has valid links", () => {
      const { container } = render(<PricingPage />);
      assertLinksHaveHref(container);
    });
  });

  describe("Docs Page (/docs)", () => {
    it("renders without throwing", () => {
      expect(() => render(<DocsPage />)).not.toThrow();
    });

    it("renders h1 heading", () => {
      render(<DocsPage />);
      expect(
        screen.getByRole("heading", { level: 1, name: /documentation/i }),
      ).toBeInTheDocument();
    });

    it("renders doc sections", () => {
      render(<DocsPage />);
      expect(screen.getAllByText("Getting Started").length).toBeGreaterThan(0);
      expect(screen.getAllByText("API Reference").length).toBeGreaterThan(0);
      expect(
        screen.getAllByText(/CLI Reference|Getting Started - CLI/).length,
      ).toBeGreaterThan(0);
      expect(
        screen.getAllByText(/Python SDK|Getting Started - Python SDK/).length,
      ).toBeGreaterThan(0);
      expect(
        screen.getAllByText(/TypeScript SDK|Getting Started - TypeScript SDK/)
          .length,
      ).toBeGreaterThan(0);
    });

    it("has valid links", () => {
      const { container } = render(<DocsPage />);
      assertLinksHaveHref(container);
    });
  });

  describe("API Docs Page (/docs/api)", () => {
    it("renders without throwing", () => {
      expect(() => render(<ApiDocsPage />)).not.toThrow();
    });

    it("renders h1 heading", () => {
      render(<ApiDocsPage />);
      expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    });

    it("renders API endpoints", () => {
      render(<ApiDocsPage />);
      expect(screen.getAllByText("/debates").length).toBeGreaterThan(0);
      expect(
        screen.getAllByText("/deliberation/create").length,
      ).toBeGreaterThan(0);
    });

    it("has valid links", () => {
      const { container } = render(<ApiDocsPage />);
      assertLinksHaveHref(container);
    });
  });

  describe("CLI Docs Page (/docs/cli)", () => {
    it("renders without throwing", () => {
      expect(() => render(<CliDocsPage />)).not.toThrow();
    });

    it("renders h1 heading", () => {
      render(<CliDocsPage />);
      expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    });

    it("renders CLI commands", () => {
      render(<CliDocsPage />);
      expect(screen.getByText("debate <topic>")).toBeInTheDocument();
      expect(screen.getByText("ask <topic>")).toBeInTheDocument();
      expect(screen.getByText("chat")).toBeInTheDocument();
    });

    it("has valid links", () => {
      const { container } = render(<CliDocsPage />);
      assertLinksHaveHref(container);
    });
  });

  describe("Contact Page (/contact)", () => {
    it("renders without throwing", () => {
      expect(() => render(<ContactPage />)).not.toThrow();
    });

    it("renders h1 heading", () => {
      render(<ContactPage />);
      expect(
        screen.getByRole("heading", { level: 1, name: /contact/i }),
      ).toBeInTheDocument();
    });

    it("renders contact channels", () => {
      render(<ContactPage />);
      expect(screen.getByText("Email")).toBeInTheDocument();
      expect(screen.getByText("LinkedIn")).toBeInTheDocument();
    });

    it("has valid links", () => {
      const { container } = render(<ContactPage />);
      assertLinksHaveHref(container);
    });
  });

  describe("Use Cases Page (/use-cases)", () => {
    it("renders without throwing", () => {
      expect(() => render(<UseCasesPage />)).not.toThrow();
    });

    it("renders h1 heading", () => {
      render(<UseCasesPage />);
      expect(
        screen.getByRole("heading", { level: 1, name: /use cases/i }),
      ).toBeInTheDocument();
    });

    it("renders use case cards", () => {
      render(<UseCasesPage />);
      expect(screen.getByText("Code Review")).toBeInTheDocument();
      expect(screen.getByText("Research Synthesis")).toBeInTheDocument();
      expect(screen.getByText("Risk Assessment")).toBeInTheDocument();
      expect(
        screen.getByText("Healthcare Decision Support"),
      ).toBeInTheDocument();
      expect(screen.getByText("Legal Analysis")).toBeInTheDocument();
      expect(screen.getByText("Financial Analysis")).toBeInTheDocument();
    });
  });

  describe("Research Page (/research)", () => {
    it("renders without throwing", () => {
      expect(() => render(<ResearchPage />)).not.toThrow();
    });

    it("renders h1 heading", () => {
      render(<ResearchPage />);
      expect(
        screen.getByRole("heading", { level: 1, name: /research/i }),
      ).toBeInTheDocument();
    });

    it("renders research papers", () => {
      render(<ResearchPage />);
      expect(
        screen.getByText(/Improving Factuality and Reasoning/i),
      ).toBeInTheDocument();
      expect(screen.getByText(/AI Safety via Debate/i)).toBeInTheDocument();
    });

    it("has valid links", () => {
      const { container } = render(<ResearchPage />);
      assertLinksHaveHref(container);
    });
  });

  describe("Privacy Page (/privacy)", () => {
    it("renders without throwing", () => {
      expect(() => render(<PrivacyPage />)).not.toThrow();
    });

    it("renders h1 heading", () => {
      render(<PrivacyPage />);
      expect(
        screen.getByRole("heading", { level: 1, name: /privacy policy/i }),
      ).toBeInTheDocument();
    });
  });

  describe("Terms Page (/terms)", () => {
    it("renders without throwing", () => {
      expect(() => render(<TermsPage />)).not.toThrow();
    });

    it("renders h1 heading", () => {
      render(<TermsPage />);
      expect(
        screen.getByRole("heading", { level: 1, name: /terms of service/i }),
      ).toBeInTheDocument();
    });
  });

  describe("FAQ Page (/faq)", () => {
    it("renders without throwing", () => {
      expect(() => render(<FAQPage />)).not.toThrow();
    });

    it("renders h1 heading", () => {
      render(<FAQPage />);
      expect(
        screen.getByRole("heading", {
          level: 1,
          name: /frequently asked questions/i,
        }),
      ).toBeInTheDocument();
    });

    it("renders FAQ items", () => {
      render(<FAQPage />);
      expect(screen.getByText("What is Consilium?")).toBeInTheDocument();
      expect(
        screen.getByText("Do I need all 5 provider API keys?"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("How much does a typical deliberation cost?"),
      ).toBeInTheDocument();
    });
  });

  describe("Sign In Page (/sign-in)", () => {
    it("renders without throwing", () => {
      expect(() => render(<SignInPage />)).not.toThrow();
    });

    it("renders Clerk sign-in component", () => {
      render(<SignInPage />);
      expect(screen.getByTestId("clerk-sign-in")).toBeInTheDocument();
    });
  });

  describe("Sign Up Page (/sign-up)", () => {
    it("renders without throwing", () => {
      expect(() => render(<SignUpPage />)).not.toThrow();
    });

    it("renders Clerk sign-up component", () => {
      render(<SignUpPage />);
      expect(screen.getByTestId("clerk-sign-up")).toBeInTheDocument();
    });
  });
});

describe("Layout Components", () => {
  const navItems = [
    { title: "How It Works", href: "/#how-it-works" },
    { title: "Modes", href: "/#modes" },
    { title: "Blog", href: "/blog" },
    { title: "GitHub", href: "https://github.com/test", external: true },
  ];

  describe("MarketingHeader", () => {
    it("renders without throwing", () => {
      expect(() => render(<MarketingHeader items={navItems} />)).not.toThrow();
    });

    it("renders nav items", () => {
      render(<MarketingHeader items={navItems} />);
      expect(screen.getByText("How It Works")).toBeInTheDocument();
      expect(screen.getByText("Modes")).toBeInTheDocument();
      expect(screen.getByText("Blog")).toBeInTheDocument();
    });

    it("renders logo link", () => {
      const { container } = render(<MarketingHeader items={navItems} />);
      const homeLink = container.querySelector('a[href="/"]');
      expect(homeLink).toBeInTheDocument();
    });

    it("renders sign in and get started links", () => {
      render(<MarketingHeader items={navItems} />);
      expect(screen.getAllByText("Sign In").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Get Started").length).toBeGreaterThan(0);
    });

    it("has valid links", () => {
      const { container } = render(<MarketingHeader items={navItems} />);
      assertLinksHaveHref(container);
    });
  });

  describe("MarketingFooter", () => {
    const footerProps = {
      builtBy: "Test User",
      builtByLink: "https://test.dev",
      githubLink: "https://github.com/test",
      twitterLink: "https://twitter.com/test",
      linkedinLink: "https://linkedin.com/in/test",
    };

    it("renders without throwing", () => {
      expect(() => render(<MarketingFooter {...footerProps} />)).not.toThrow();
    });

    it("renders all link columns", () => {
      render(<MarketingFooter {...footerProps} />);
      expect(screen.getByText("Products")).toBeInTheDocument();
      expect(screen.getByText("Navigation")).toBeInTheDocument();
      expect(screen.getByText("Resources")).toBeInTheDocument();
      expect(screen.getByText("Contact")).toBeInTheDocument();
    });

    it("renders subscribe form", () => {
      render(<MarketingFooter {...footerProps} />);
      expect(
        screen.getByPlaceholderText("youremail@domain.com"),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /subscribe/i }),
      ).toBeInTheDocument();
    });

    it("renders footer links in each column", () => {
      render(<MarketingFooter {...footerProps} />);
      expect(screen.getByText("Features")).toBeInTheDocument();
      expect(screen.getAllByText("Pricing").length).toBeGreaterThan(0);
      expect(screen.getByText("Documentation")).toBeInTheDocument();
      expect(screen.getByText("API Reference")).toBeInTheDocument();
      expect(screen.getByText("Blog")).toBeInTheDocument();
      expect(screen.getByText("About")).toBeInTheDocument();
      expect(screen.getAllByText("Privacy").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Terms").length).toBeGreaterThan(0);
    });

    it("has valid links", () => {
      const { container } = render(<MarketingFooter {...footerProps} />);
      assertLinksHaveHref(container);
    });
  });

  describe("Logo", () => {
    it("renders without throwing", () => {
      expect(() => render(<Logo />)).not.toThrow();
    });

    it("renders icon image", () => {
      const { container } = render(<Logo />);
      const img = container.querySelector("img");
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute("src", "/brand/consilium-icon.svg");
    });

    it("renders text by default", () => {
      render(<Logo />);
      expect(screen.getByText("Consilium")).toBeInTheDocument();
    });

    it("hides text when iconOnly", () => {
      render(<Logo iconOnly />);
      expect(screen.queryByText("Consilium")).not.toBeInTheDocument();
    });

    it("links to home by default", () => {
      const { container } = render(<Logo />);
      expect(container.querySelector('a[href="/"]')).toBeInTheDocument();
    });

    it("uses custom link", () => {
      const { container } = render(<Logo link="/dashboard" />);
      expect(
        container.querySelector('a[href="/dashboard"]'),
      ).toBeInTheDocument();
    });
  });
});

describe("Feature Components", () => {
  describe("DebateTimeline", () => {
    const defaultProps = {
      phases: [
        { name: "Proposal", status: "complete" as const },
        {
          name: "Cross-Examination",
          status: "active" as const,
          models: [
            { id: "claude-sonnet-4-6", status: "thinking" as const },
            { id: "gpt-5.4", status: "complete" as const },
          ],
        },
        { name: "Synthesis", status: "pending" as const },
      ],
      currentRound: 2,
      maxRounds: 3,
      totalCost: 0.0042,
      mode: "council",
    };

    it("renders without throwing", () => {
      expect(() => render(<DebateTimeline {...defaultProps} />)).not.toThrow();
    });

    it("renders phase names", () => {
      render(<DebateTimeline {...defaultProps} />);
      expect(screen.getByText("Proposal")).toBeInTheDocument();
      expect(screen.getByText("Cross-Examination")).toBeInTheDocument();
      expect(screen.getByText("Synthesis")).toBeInTheDocument();
    });

    it("renders round info", () => {
      render(<DebateTimeline {...defaultProps} />);
      expect(screen.getByText(/round 2/i)).toBeInTheDocument();
    });
  });

  describe("VoteVisualization", () => {
    const defaultProps = {
      votes: [
        {
          modelId: "claude-sonnet-4-6",
          bordaScore: 8,
          rankings: [1, 2, 1],
          confidence: 0.92,
          isCondorcetWinner: true,
        },
        {
          modelId: "gpt-5.4",
          bordaScore: 6,
          rankings: [2, 1, 2],
          confidence: 0.85,
        },
      ],
      winnerId: "claude-sonnet-4-6",
    };

    it("renders without throwing", () => {
      expect(() =>
        render(<VoteVisualization {...defaultProps} />),
      ).not.toThrow();
    });

    it("renders with empty votes", () => {
      const { container } = render(<VoteVisualization votes={[]} />);
      expect(container.innerHTML).toBe("");
    });
  });

  describe("DissentReport", () => {
    const defaultProps = {
      report: {
        type: "dissent" as const,
        majority: {
          models: ["claude-sonnet-4-6", "gpt-5.4"],
          positionSummary: "Majority agrees on approach A",
          keyArguments: ["Strong evidence", "Well documented"],
        },
        minority: [
          {
            models: ["gemini-3-flash-preview"],
            positionSummary: "Alternative approach B",
            keyArguments: ["Different perspective"],
          },
        ],
      },
      totalModels: 3,
    };

    it("renders without throwing", () => {
      expect(() => render(<DissentReport {...defaultProps} />)).not.toThrow();
    });

    it("renders majority position", () => {
      render(<DissentReport {...defaultProps} />);
      expect(
        screen.getByText("Majority agrees on approach A"),
      ).toBeInTheDocument();
    });

    it("renders minority position", () => {
      render(<DissentReport {...defaultProps} />);
      expect(screen.getByText("Alternative approach B")).toBeInTheDocument();
    });
  });

  describe("SplitPaneComparison", () => {
    const defaultProps = {
      phases: [
        {
          phase: "proposal" as const,
          label: "Proposal",
          outputs: [
            {
              modelId: "claude-sonnet-4-6",
              modelName: "Claude Sonnet",
              provider: "anthropic",
              content: "Claude's proposal content here.",
            },
            {
              modelId: "gpt-5.4",
              modelName: "GPT-5.4",
              provider: "openai",
              content: "GPT-5.4's proposal content here.",
            },
          ],
        },
        {
          phase: "rebuttal" as const,
          label: "Rebuttal",
          outputs: [
            {
              modelId: "claude-sonnet-4-6",
              modelName: "Claude Sonnet",
              provider: "anthropic",
              content: "Claude's rebuttal.",
            },
          ],
        },
      ],
    };

    it("renders without throwing", () => {
      expect(() =>
        render(<SplitPaneComparison {...defaultProps} />),
      ).not.toThrow();
    });

    it("renders phase tabs", () => {
      render(<SplitPaneComparison {...defaultProps} />);
      expect(screen.getByText("Proposal")).toBeInTheDocument();
      expect(screen.getByText("Rebuttal")).toBeInTheDocument();
    });

    it("renders model outputs", () => {
      render(<SplitPaneComparison {...defaultProps} />);
      expect(
        screen.getByText("Claude's proposal content here."),
      ).toBeInTheDocument();
    });
  });

  describe("CostDashboard", () => {
    const defaultProps = {
      data: {
        totalCost: 0.0125,
        totalInputTokens: 5000,
        totalOutputTokens: 2000,
        modelCosts: [
          {
            modelId: "claude-sonnet-4-6",
            modelName: "Claude Sonnet",
            provider: "anthropic",
            inputTokens: 3000,
            outputTokens: 1200,
            cost: 0.008,
          },
          {
            modelId: "gpt-5.4",
            modelName: "GPT-5.4",
            provider: "openai",
            inputTokens: 2000,
            outputTokens: 800,
            cost: 0.0045,
          },
        ],
        roundCosts: [
          {
            round: 1,
            totalCost: 0.005,
            models: { "claude-sonnet-4-6": 0.003, "gpt-5.4": 0.002 },
          },
          {
            round: 2,
            totalCost: 0.0075,
            models: { "claude-sonnet-4-6": 0.005, "gpt-5.4": 0.0025 },
          },
        ],
        cumulativeCosts: [
          { timestamp: "2026-04-01T10:00:00Z", cost: 0.005, round: 1 },
          { timestamp: "2026-04-01T10:01:00Z", cost: 0.0125, round: 2 },
        ],
        isActive: false,
      },
      debateId: "test-debate-123",
    };

    it("renders without throwing", () => {
      expect(() => render(<CostDashboard {...defaultProps} />)).not.toThrow();
    });

    it("renders total cost", () => {
      render(<CostDashboard {...defaultProps} />);
      expect(screen.getByText(/\$0\.01/)).toBeInTheDocument();
    });
  });
});
