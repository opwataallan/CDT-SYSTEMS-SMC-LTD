import DOMPurify from 'dompurify';

/**
 * Reusable utility to safely sanitize WooCommerce HTML descriptions and short descriptions.
 * - Preserves safe presentation tags (p, br, strong, b, em, ul, ol, li, h2, h3, etc.)
 * - Strips unsafe elements (script, style, iframe, object, embed, unsafe event handlers/attributes)
 * - Decodes HTML entities properly
 * - Strips empty paragraphs & empty trailing whitespace
 * - Preserves bullet lists and paragraph spacing
 * - Prevents XSS attacks
 * - Produces clean, responsive HTML
 */

// Helper to safely decode HTML entities
function decodeHtmlEntities(raw: string): string {
  if (!raw) return '';

  // Check if string contains encoded entities like &lt; or &amp; or &#...
  if (!/&[#a-zA-Z0-9]+;/.test(raw)) {
    return raw;
  }

  // Use DOMParser if available in browser environment
  if (typeof window !== 'undefined' && typeof DOMParser !== 'undefined') {
    try {
      const parser = new DOMParser();
      // Decode once
      const doc = parser.parseFromString(raw, 'text/html');
      let decoded = doc.body.textContent || '';
      // If it still contains encoded HTML tags like &lt;p or &lt;div, decode one more time
      if (/&lt;[a-zA-Z/][^&gt;]*&gt;/.test(decoded)) {
        const secondDoc = parser.parseFromString(decoded, 'text/html');
        decoded = secondDoc.body.textContent || decoded;
      }
      // If the decoded content looks like HTML tags, return it;
      // otherwise, if the original already had tags and decode stripped them, keep raw
      if (/<[a-z/][\s\S]*>/i.test(decoded)) {
        return decoded;
      }
    } catch {
      // Fallback below
    }
  }

  // Fallback entity replacement for common WooCommerce entities
  return raw
    .replace(/&amp;lt;/g, '<')
    .replace(/&amp;gt;/g, '>')
    .replace(/&amp;quot;/g, '"')
    .replace(/&amp;#39;/g, "'")
    .replace(/&amp;amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');
}

/**
 * Clean and remove empty paragraphs and breaks
 */
function removeEmptyParagraphs(html: string): string {
  let cleaned = html;
  // Match empty tags like <p></p>, <p><br></p>, <p>&nbsp;</p>, <p>  </p>
  const emptyParagraphRegex = /<p[^>]*>\s*(?:<br\s*\/?>|&nbsp;|\u00a0)*\s*<\/p>/gi;
  let previous = '';
  while (previous !== cleaned) {
    previous = cleaned;
    cleaned = cleaned.replace(emptyParagraphRegex, '');
  }
  return cleaned.trim();
}

/**
 * Format plain-text strings that have newlines or bullet points but no HTML tags
 */
function formatPlainTextToHtml(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return '';

  // Check if string contains bullet points or pipes
  const lines = trimmed.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

  // If text has pipe separated specs (common in initial products)
  if (lines.length === 1 && trimmed.includes(' | ')) {
    const items = trimmed.split(' | ').map((i) => i.trim()).filter(Boolean);
    if (items.length > 1) {
      return `<ul class="woo-list">${items.map((it) => `<li>${it}</li>`).join('')}</ul>`;
    }
  }

  // If text contains lines starting with bullets like -, *, •
  const isBulletList = lines.every((l) => /^[-*•]\s+/.test(l));
  if (isBulletList && lines.length > 0) {
    return `<ul class="woo-list">${lines
      .map((l) => `<li>${l.replace(/^[-*•]\s+/, '')}</li>`)
      .join('')}</ul>`;
  }

  // Otherwise convert paragraphs
  return lines.map((l) => `<p>${l}</p>`).join('');
}

/**
 * Primary sanitizer function for WooCommerce HTML fields
 */
export function sanitizeWooCommerceHtml(rawHtml: string | null | undefined): string {
  if (!rawHtml || typeof rawHtml !== 'string') {
    return '';
  }

  let content = rawHtml.trim();
  if (!content) return '';

  // 1. If string is entity-encoded HTML (e.g. &lt;p&gt; or &lt;ul&gt;), decode it first
  if (/&lt;[a-zA-Z/][\s\S]*&gt;/.test(content) || /&amp;lt;/.test(content)) {
    content = decodeHtmlEntities(content);
  }

  // 2. Check if content has actual HTML tags
  const hasHtmlTags = /<[a-z/][\s\S]*>/i.test(content);
  if (!hasHtmlTags) {
    // If it's plain text, format it safely into semantic HTML
    content = formatPlainTextToHtml(content);
  }

  // 3. Run industrial-strength DOMPurify sanitization
  const sanitized = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: [
      'p',
      'br',
      'strong',
      'b',
      'em',
      'i',
      'u',
      's',
      'strike',
      'ul',
      'ol',
      'li',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'blockquote',
      'code',
      'pre',
      'hr',
      'table',
      'thead',
      'tbody',
      'tfoot',
      'tr',
      'th',
      'td',
      'span',
      'div',
      'a',
      'small',
      'sub',
      'sup',
      'mark',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'title', 'class', 'id', 'colspan', 'rowspan'],
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'svg', 'canvas'],
    FORBID_ATTR: ['style', 'onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ['target'],
  });

  // Ensure external links have safe attributes
  let processed = sanitized.replace(/<a\s+href=/gi, '<a target="_blank" rel="noopener noreferrer" href=');

  // 4. Remove empty paragraphs and redundant empty tags
  processed = removeEmptyParagraphs(processed);

  return processed;
}

/**
 * Utility to get clean plain text from HTML (e.g. for meta tags, card previews, or short summaries)
 */
export function stripHtmlToPlainText(rawHtml: string | null | undefined): string {
  if (!rawHtml) return '';
  const sanitized = sanitizeWooCommerceHtml(rawHtml);
  if (typeof window !== 'undefined' && typeof DOMParser !== 'undefined') {
    const doc = new DOMParser().parseFromString(sanitized, 'text/html');
    return doc.body.textContent?.trim().replace(/\s+/g, ' ') || '';
  }
  return sanitized.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}
