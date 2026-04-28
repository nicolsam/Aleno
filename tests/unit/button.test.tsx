import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Button, buttonVariants } from '@/components/ui/button'

describe('buttonVariants', () => {
  it('uses default variant and size classes when no options are provided', () => {
    const className = buttonVariants()

    expect(className).toContain('bg-primary')
    expect(className).toContain('text-primary-foreground')
    expect(className).toContain('h-9')
    expect(className).toContain('px-4')
  })

  it('applies selected variant, selected size, and custom classes', () => {
    const className = buttonVariants({
      variant: 'outline',
      size: 'icon-sm',
      className: 'custom-class',
    })

    expect(className).toContain('border')
    expect(className).toContain('bg-background')
    expect(className).toContain('size-8')
    expect(className).toContain('custom-class')
  })
})

describe('Button', () => {
  it('renders a native button with data attributes and merged classes', () => {
    const markup = renderToStaticMarkup(
      <Button variant="secondary" size="sm" className="extra-class">
        Save
      </Button>
    )

    expect(markup).toContain('<button')
    expect(markup).toContain('data-slot="button"')
    expect(markup).toContain('data-variant="secondary"')
    expect(markup).toContain('data-size="sm"')
    expect(markup).toContain('extra-class')
    expect(markup).toContain('Save')
  })

  it('renders through Slot when asChild is enabled', () => {
    const markup = renderToStaticMarkup(
      <Button asChild variant="link" size="lg">
        <a href="/dashboard">Dashboard</a>
      </Button>
    )

    expect(markup).toContain('<a')
    expect(markup).toContain('href="/dashboard"')
    expect(markup).toContain('data-slot="button"')
    expect(markup).toContain('data-variant="link"')
    expect(markup).toContain('data-size="lg"')
    expect(markup).toContain('Dashboard')
  })
})
