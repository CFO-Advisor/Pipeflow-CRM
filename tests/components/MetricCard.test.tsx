import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { Users, DollarSign } from 'lucide-react'

describe('MetricCard', () => {
  it('renders the label', () => {
    render(<MetricCard label="Total de Leads" value={42} icon={Users} />)
    expect(screen.getByText('Total de Leads')).toBeInTheDocument()
  })

  it('renders a numeric value', () => {
    render(<MetricCard label="Leads" value={99} icon={Users} />)
    expect(screen.getByText('99')).toBeInTheDocument()
  })

  it('renders a string value', () => {
    render(<MetricCard label="Conversão" value="30%" icon={Users} />)
    expect(screen.getByText('30%')).toBeInTheDocument()
  })

  it('renders description when provided', () => {
    render(
      <MetricCard label="Conversão" value="30%" icon={Users} description="10 de 33 negócios" />
    )
    expect(screen.getByText('10 de 33 negócios')).toBeInTheDocument()
  })

  it('does not render description when not provided', () => {
    render(<MetricCard label="Leads" value={5} icon={Users} />)
    expect(screen.queryByText(/de \d+ negócios/)).toBeNull()
  })

  it('renders with custom iconBg and iconColor classes', () => {
    const { container } = render(
      <MetricCard
        label="Pipeline"
        value="R$ 50.000"
        icon={DollarSign}
        iconBg="bg-green-100 dark:bg-green-900/30"
        iconColor="text-green-600 dark:text-green-400"
      />
    )
    expect(container.querySelector('.bg-green-100')).toBeTruthy()
  })
})
