import { DOMExtractor } from '@/core/extraction/DOMExtractor';
import { HTMLToMarkdown } from '@/core/extraction/HTMLToMarkdown';

/** Request payload sent by background to content script for page extraction. */
interface ExtractPageContextRequest {
  /** Discriminator for extraction request. */
  readonly type: 'extract-page-context';
}

/** Response payload with extracted markdown and metadata. */
interface ExtractPageContextResponse {
  /** Page title at extraction time. */
  readonly title: string;
  /** Page URL at extraction time. */
  readonly url: string;
  /** Extracted markdown content. */
  readonly markdown: string;
}

const extractor = new DOMExtractor();
const markdownConverter = new HTMLToMarkdown();

if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
    if (!isExtractRequest(message)) {
      return;
    }

    const html = extractor.extract(document);
    const markdown = markdownConverter.convert(html);
    const response: ExtractPageContextResponse = {
      title: document.title,
      url: window.location.href,
      markdown,
    };
    sendResponse(response);
  });
}

function isExtractRequest(message: unknown): message is ExtractPageContextRequest {
  if (typeof message !== 'object' || message === null) {
    return false;
  }

  return (message as { readonly type?: unknown }).type === 'extract-page-context';
}

export type { ExtractPageContextRequest, ExtractPageContextResponse };
