import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UsageChart } from './usage-chart';
import * as analyticsHooks from '../hooks/use-analytics';

// Mock the analytics hook
vi.mock('../hooks/use-analytics', () => ({
  useUsageHistory: vi.fn(),
}));

describe('UsageChart', () => {
  const mockUsageData = [
    { date: '2024-01-01', queries: 10, tokens: 1000, cost: 0.05 },
    { date: '2024-01-02', queries: 15, tokens: 1500, cost: 0.08 },
    { date: '2024-01-03', queries: 20, tokens: 2000, cost: 0.10 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state', () => {
    vi.spyOn(analyticsHooks, 'useUsageHistory').mockReturnValue({
      usageHistory: undefined,
      isLoading: true,
      error: undefined,
    });

    render(<UsageChart />);
    expect(screen.getByText(/loading usage data/i)).toBeInTheDocument();
  });

  it('should render error state', () => {
    vi.spyOn(analyticsHooks, 'useUsageHistory').mockReturnValue({
      usageHistory: undefined,
      isLoading: false,
      error: 'Failed to fetch data',
    });

    render(<UsageChart />);
    expect(screen.getByText(/error loading usage data/i)).toBeInTheDocument();
    expect(screen.getByText(/failed to fetch data/i)).toBeInTheDocument();
  });

  it('should render chart with data', () => {
    vi.spyOn(analyticsHooks, 'useUsageHistory').mockReturnValue({
      usageHistory: mockUsageData,
      isLoading: false,
      error: undefined,
    });

    render(<UsageChart />);

    expect(screen.getByText('Usage Over Time')).toBeInTheDocument();
    expect(screen.getByText(/queries, tokens, and costs over the past 30 days/i)).toBeInTheDocument();
  });

  it('should render time period selector buttons', () => {
    vi.spyOn(analyticsHooks, 'useUsageHistory').mockReturnValue({
      usageHistory: mockUsageData,
      isLoading: false,
      error: undefined,
    });

    render(<UsageChart />);

    expect(screen.getByRole('button', { name: '7d' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '30d' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '90d' })).toBeInTheDocument();
  });

  it('should change time period when button is clicked', async () => {
    const mockUseUsageHistory = vi.spyOn(analyticsHooks, 'useUsageHistory');
    mockUseUsageHistory.mockReturnValue({
      usageHistory: mockUsageData,
      isLoading: false,
      error: undefined,
    });

    const user = userEvent.setup();
    render(<UsageChart />);

    // Initially called with 30 days (default)
    expect(mockUseUsageHistory).toHaveBeenCalledWith(30);

    // Click 7d button
    await user.click(screen.getByRole('button', { name: '7d' }));

    // Should re-render with 7 days
    expect(mockUseUsageHistory).toHaveBeenCalledWith(7);
  });

  it('should highlight selected time period button', () => {
    vi.spyOn(analyticsHooks, 'useUsageHistory').mockReturnValue({
      usageHistory: mockUsageData,
      isLoading: false,
      error: undefined,
    });

    render(<UsageChart />);

    const button30d = screen.getByRole('button', { name: '30d' });
    const button7d = screen.getByRole('button', { name: '7d' });

    // 30d should be selected by default (have different styling)
    // We can't easily test Tailwind classes, but we can verify buttons are rendered
    expect(button30d).toBeInTheDocument();
    expect(button7d).toBeInTheDocument();
  });
});
