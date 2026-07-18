/**
 * Render a mustache-subset template against a data context. Browser-safe.
 * Supports {{key}}, {{{raw}}}, {{#section}}, {{^empty}}, dotted access.
 */
export function render(template: string, data: Record<string, unknown>): string
