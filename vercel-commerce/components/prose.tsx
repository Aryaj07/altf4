import clsx from 'clsx';
import type { FunctionComponent } from 'react';

interface TextProps {
  html: string;
  className?: string;
}

const Prose: FunctionComponent<TextProps> = ({ html, className }) => {
  // Function to convert plain text to HTML AND sanitize
  const processHtml = (text: string): string => {
    let processedHtml = text;

    // If it doesn't contain HTML tags, convert plain text to HTML
    if (!text.includes('<') || !text.includes('>')) {
      processedHtml = text
        .split('\n\n') // Split by double line breaks (paragraphs)
        .filter(paragraph => paragraph.trim()) // Remove empty paragraphs
        .map(paragraph => `<p>${paragraph.trim().replace(/\n/g, '<br>')}</p>`) // Convert single line breaks to <br> and wrap in <p>
        .join('');
    }

    // Now sanitize the HTML (whether it was converted or original)
    return sanitizeHtml(processedHtml);
  };

  const sanitizeHtml = (htmlString: string): string => {
    // Remove script tags and other dangerous content first
    let cleanHtml = htmlString
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+="[^"]*"/gi, '');

    // Define allowed tags pattern
    const allowedTags = /^(?:p|br|strong|b|em|i|u|h[1-6]|ul|ol|li|a|span|div)$/i;
    
    // Remove any tags that aren't in our allowed list
    cleanHtml = cleanHtml.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/gi, (match, tagName) => {
      if (allowedTags.test(tagName)) {
        return match; // Keep allowed tags
      }
      return ''; // Remove disallowed tags
    });
    
    return cleanHtml;
  };

  const processedHtml = processHtml(html || '');

  return (
    <div
      className={clsx(
        'prose mx-auto max-w-6xl text-base leading-7 text-black prose-headings:mt-8 prose-headings:font-semibold prose-headings:tracking-wide prose-headings:text-black prose-h1:text-5xl prose-h2:text-4xl prose-h3:text-3xl prose-h4:text-2xl prose-h5:text-xl prose-h6:text-lg prose-a:text-black prose-a:underline hover:prose-a:text-neutral-300 prose-strong:text-black prose-ol:mt-8 prose-ol:list-decimal prose-ol:pl-6 prose-ul:mt-8 prose-ul:list-disc prose-ul:pl-6 prose-p:mb-6 prose-p:leading-relaxed dark:text-white dark:prose-headings:text-white dark:prose-a:text-white dark:prose-strong:text-white',
        className
      )}
      dangerouslySetInnerHTML={{ __html: processedHtml }}
    />
  );
};

export default Prose;