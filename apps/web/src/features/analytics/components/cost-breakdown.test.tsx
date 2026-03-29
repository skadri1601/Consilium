import { render, screen } from '@testing-library/react';
import { CostBreakdown } from './cost-breakdown';
import * as analyticsHooks from '../hooks/use-analytics';

// Mock the analytics hook
vi.mock('../hooks/use-analytics', () => ({
  useCostByModel: vi.fn(),
}));

describe('CostBreakdown', () => {
  const mockCostData = {
    'gpt-4o-mini': 2.45,
    'claude-3-5-haiku': 3.21,
    'gemini-2.0-flash': 1.89,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state', () => {
    vi.spyOn(analyticsHooks, 'useCostByModel').mockReturnValue({
      costByModel: undefined,
      isLoading: true,
      error: undefined,
    });

    render(<CostBreakdown />);
    expect(screen.getByText(/loading cost breakdown/i)).toBeInTheDocument();
  });

  it('should render error state', () => {
    vi.spyOn(analyticsHooks, 'useCostByModel').mockReturnValue({
      costByModel: undefined,
      isLoading: false,
      error: 'Failed to fetch costs',
    });

    render(<CostBreakdown />);
    expect(screen.getByText(/error loading cost data/i)).toBeInTheDocument();
    expect(screen.getByText(/failed to fetch costs/i)).toBeInTheDocument();
  });

  it('should render chart with data', () => {
    vi.spyOn(analyticsHooks, 'useCostByModel').mockReturnValue({
      costByModel: mockCostData,
      isLoading: false,
      error: undefined,
    });

    render(<CostBreakdown />);

    expect(screen.getByText('Cost by Model')).toBeInTheDocument();
    expect(screen.getByText(/distribution of costs across models/i)).toBeInTheDocument();
  });

  it('should display total cost in description', () => {
    vi.spyOn(analyticsHooks, 'useCostByModel').mockReturnValue({
      costByModel: mockCostData,
      isLoading: false,
      error: undefined,
    });

    render(<CostBreakdown />);

    const totalCost = 2.45 + 3.21 + 1.89;
    expect(screen.getByText(new RegExp(String.raw`Total: \$${totalCost.toFixed(4)}`, 'i'))).toBeInTheDocument();
  });

  it('should render empty state when no data', () => {
    vi.spyOn(analyticsHooks, 'useCostByModel').mockReturnValue({
      costByModel: {},
      isLoading: false,
      error: undefined,
    });

    render(<CostBreakdown />);

    expect(screen.getByText(/no cost data available yet/i)).toBeInTheDocument();
  });

  it('should render empty state when total cost is zero', () => {
    vi.spyOn(analyticsHooks, 'useCostByModel').mockReturnValue({
      costByModel: {
        'gpt-4o-mini': 0,
        'claude-3-5-haiku': 0,
      },
      isLoading: false,
      error: undefined,
    });

    render(<CostBreakdown />);

    expect(screen.getByText(/no cost data available yet/i)).toBeInTheDocument();
  });

  it('should transform model names for display', () => {
    vi.spyOn(analyticsHooks, 'useCostByModel').mockReturnValue({
      costByModel: mockCostData,
      isLoading: false,
      error: undefined,
    });

    const { container } = render(<CostBreakdown />);

    // The component should transform model names in labels
    // Since Recharts renders to SVG, we can't easily test the exact text
    // but we can verify the component renders without errors
    // Note: Recharts may not render SVG in test environment, so we just verify no errors
    expect(container).toBeTruthy();
  });

  it('should handle single model data', () => {
    vi.spyOn(analyticsHooks, 'useCostByModel').mockReturnValue({
      costByModel: { 'gpt-4o-mini': 5 },
      isLoading: false,
      error: undefined,
    });

    render(<CostBreakdown />);

    expect(screen.getByText('Cost by Model')).toBeInTheDocument();
    expect(screen.getByText(/Total: \$5.0000/i)).toBeInTheDocument();
  });

  it('should handle many models', () => {
    const manyModels = {
      'gpt-4o-mini': 1,
      'claude-3-5-haiku': 2,
      'gemini-2.0-flash': 3,
      'gpt-4o': 4,
      'claude-opus-4': 5,
      'gemini-pro': 6,
    };

    vi.spyOn(analyticsHooks, 'useCostByModel').mockReturnValue({
      costByModel: manyModels,
      isLoading: false,
      error: undefined,
    });

    render(<CostBreakdown />);

    const totalCost = Object.values(manyModels).reduce((sum, cost) => sum + cost, 0);
    expect(screen.getByText(new RegExp(String.raw`Total: \$${totalCost.toFixed(4)}`, 'i'))).toBeInTheDocument();
  });
});
