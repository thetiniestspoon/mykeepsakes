import { render, screen, fireEvent } from '@testing-library/react';
import { TagChips } from '@/components/reflection/TagChips';

describe('TagChips', () => {
  it('renders all 5 tags', () => {
    render(<TagChips selected={[]} onToggle={() => {}} />);
    expect(screen.getByText('Insight')).toBeInTheDocument();
    expect(screen.getByText('Quote')).toBeInTheDocument();
    expect(screen.getByText('Training Seed')).toBeInTheDocument();
    expect(screen.getByText('Personal')).toBeInTheDocument();
    expect(screen.getByText('Logistics')).toBeInTheDocument();
  });

  it('calls onToggle when a tag is tapped', () => {
    const onToggle = vi.fn();
    render(<TagChips selected={[]} onToggle={onToggle} />);
    fireEvent.click(screen.getByText('Insight'));
    expect(onToggle).toHaveBeenCalledWith('insight');
  });

  it('shows selected state for active tags', () => {
    render(<TagChips selected={['insight', 'quote']} onToggle={() => {}} />);
    const insightChip = screen.getByText('Insight').closest('button');
    expect(insightChip).toHaveClass('bg-blue-100');
  });
});
