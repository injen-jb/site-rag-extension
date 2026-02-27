/**
 * Content script: extracts page content and sends to background on request.
 * Injected into every page via manifest content_scripts.
 */

import { DOMExtractor } from '@/core/extraction/DOMExtractor';
import { HTMLToMarkdown } from '@/core/extraction/HTMLToMarkdown';

const extractor = new DOMExtractor();
const markdownConverter = new HTMLToMarkdown();

/** Extract the current page's main content as markdown. */
function extractPageContent(): { markdown: string; title: string; url: string } {
  const rawHTML = document.body.innerHTML;
  const cleanedHTML = extractor.extract(rawHTML);
  const markdown = markdownConverter.convert(cleanedHTML);

  return {
    markdown,
    title: document.title,
    url: window.location.href,
  };
}

/** Listen for extraction requests from the background/popup. */
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'extract-content') {
    const content = extractPageContent();
    sendResponse(content);
    return true;
  }
  return false;
});

console.log('[Converse With This Site] Content script loaded.');
