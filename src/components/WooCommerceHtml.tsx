import React, { useMemo } from 'react';
import { sanitizeWooCommerceHtml } from '../utils/sanitizeWooCommerceHtml';

interface WooCommerceHtmlProps {
  html: string | null | undefined;
  className?: string;
  fallback?: React.ReactNode;
}

/**
 * Renders WooCommerce HTML safely:
 * - Decodes entities
 * - Strips unsafe tags & scripts
 * - Formats lists and typography
 * - Prevents XSS attacks
 */
export const WooCommerceHtml: React.FC<WooCommerceHtmlProps> = ({
  html,
  className = '',
  fallback = null,
}) => {
  const sanitized = useMemo(() => sanitizeWooCommerceHtml(html), [html]);

  if (!sanitized) {
    return <>{fallback}</>;
  }

  return (
    <div
      className={`woocommerce-html-content ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
};
