import { DOMExtractor } from '@/core/extraction/DOMExtractor';
import { HTMLToMarkdown } from '@/core/extraction/HTMLToMarkdown';

// Listen for messages from popup or background
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.type === 'get-page-content') {
    try {
      const extractor = new DOMExtractor();
      const html = extractor.extract(document);
      const markdown = new HTMLToMarkdown().convert(html);
      
      sendResponse({ success: true, markdown, url: window.location.href, title: document.title });
    } catch (err: unknown) {
      sendResponse({ success: false, error: String(err) });
    }
  }
  return true; // async response
});