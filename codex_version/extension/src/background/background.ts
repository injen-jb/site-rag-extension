import {
  MessageRouter,
  type PortMessage,
  type QueryMessage,
  type RuntimePort,
} from '@/background/MessageRouter';
import { SiteRAGService } from '@/background/SiteRAGService';
import { Chunker } from '@/core/rag/Chunker';
import { PromptBuilder } from '@/core/rag/PromptBuilder';
import { FallbackEmbeddingProvider } from '@/providers/embedding/FallbackEmbeddingProvider';
import { TransformersEmbeddingProvider } from '@/providers/embedding/TransformersEmbeddingProvider';
import { SitemapCrawler } from '@/providers/crawler/SitemapCrawler';
import { FallbackLLMProvider } from '@/providers/llm/FallbackLLMProvider';
import { LFM2WebGPUProvider } from '@/providers/llm/LFM2WebGPUProvider';
import { IndexedDBVectorStore } from '@/providers/vectorstore/IndexedDBVectorStore';

interface ExtractPageContextResponse {
  readonly title: string;
  readonly url: string;
  readonly markdown: string;
}

interface ClearCacheMessage {
  readonly type: 'clear-cache';
}

const promptBuilder = new PromptBuilder();
const llmProvider = await createRuntimeLLMProvider();
const embeddingProvider = await createRuntimeEmbeddingProvider();
const siteRagService = new SiteRAGService(
  new SitemapCrawler({ maxPages: 50, maxDepth: 3 }),
  embeddingProvider,
  new IndexedDBVectorStore({ dbName: 'converse-with-site', storeName: 'chunks' }),
  new Chunker({ chunkSize: 512, overlap: 64 }),
  promptBuilder,
);
const messageRouter = new MessageRouter(llmProvider, {
  resolvePrompt: async (query) => resolvePrompt(query),
});

if (typeof chrome !== 'undefined' && chrome.runtime?.onConnect) {
  chrome.runtime.onConnect.addListener((port) => {
    if (port.name !== 'llm-stream') {
      return;
    }

    messageRouter.attachPort(wrapChromePort(port));
  });
}

if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
    if (!isClearCacheMessage(message)) {
      return;
    }

    void siteRagService.clearCache().then(() => {
      sendResponse({ ok: true });
    });
    return true;
  });
}

async function createRuntimeLLMProvider(): Promise<LFM2WebGPUProvider | FallbackLLMProvider> {
  const webGpuProvider = new LFM2WebGPUProvider({
    modelId: 'LiquidAI/LFM2-1.2B',
    dtype: 'q4',
  });

  const available = await webGpuProvider.isAvailable();
  if (available) {
    return webGpuProvider;
  }

  return new FallbackLLMProvider();
}

async function createRuntimeEmbeddingProvider(): Promise<
  TransformersEmbeddingProvider | FallbackEmbeddingProvider
> {
  const transformerProvider = new TransformersEmbeddingProvider({
    modelId: 'Xenova/all-MiniLM-L6-v2',
    dimensions: 384,
    dtype: 'q8',
  });

  const available = await transformerProvider.isAvailable();
  if (available) {
    return transformerProvider;
  }

  return new FallbackEmbeddingProvider();
}

async function resolvePrompt(query: QueryMessage): Promise<string> {
  if (query.prompt) {
    return query.prompt;
  }

  if (query.mode === 'page') {
    try {
      const pageContext = await getActivePageContext();
      return promptBuilder.buildPagePrompt(pageContext.markdown, query.question);
    } catch {
      return query.question;
    }
  }

  try {
    const activeTabUrl = await getActiveTabUrl();
    return await siteRagService.buildPrompt(query.question, activeTabUrl);
  } catch {
    return query.question;
  }
}

async function getActivePageContext(): Promise<ExtractPageContextResponse> {
  const activeTabId = await getActiveTabId();

  const response = await chrome.tabs.sendMessage(activeTabId, {
    type: 'extract-page-context',
  });

  return response as ExtractPageContextResponse;
}

async function getActiveTabId(): Promise<number> {
  const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  const firstTab = tabs[0];
  if (!firstTab?.id) {
    throw new Error('No active tab found for context extraction.');
  }

  return firstTab.id;
}

async function getActiveTabUrl(): Promise<string> {
  const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  const firstTab = tabs[0];
  if (!firstTab?.url) {
    throw new Error('No active tab URL found.');
  }

  return firstTab.url;
}

function wrapChromePort(port: chrome.runtime.Port): RuntimePort {
  return {
    name: port.name,
    addMessageListener(listener: (message: PortMessage) => void): void {
      port.onMessage.addListener((message: unknown) => {
        if (isPortMessage(message)) {
          listener(message);
        }
      });
    },
    postMessage(message: PortMessage): void {
      port.postMessage(message);
    },
  };
}

function isPortMessage(message: unknown): message is PortMessage {
  if (typeof message !== 'object' || message === null) {
    return false;
  }

  const possibleType = (message as { readonly type?: unknown }).type;
  return (
    possibleType === 'query' ||
    possibleType === 'token' ||
    possibleType === 'status' ||
    possibleType === 'done' ||
    possibleType === 'error'
  );
}

function isClearCacheMessage(message: unknown): message is ClearCacheMessage {
  if (typeof message !== 'object' || message === null) {
    return false;
  }

  return (message as { readonly type?: unknown }).type === 'clear-cache';
}
