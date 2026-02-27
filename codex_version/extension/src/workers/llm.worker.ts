import { LFM2WebGPUProvider } from '@/providers/llm/LFM2WebGPUProvider';

interface WorkerQueryMessage {
  readonly type: 'query';
  readonly prompt: string;
}

interface WorkerTokenMessage {
  readonly type: 'token';
  readonly token: string;
}

interface WorkerDoneMessage {
  readonly type: 'done';
}

interface WorkerErrorMessage {
  readonly type: 'error';
  readonly message: string;
}

type WorkerInboundMessage = WorkerQueryMessage;
type WorkerOutboundMessage = WorkerTokenMessage | WorkerDoneMessage | WorkerErrorMessage;

const provider = new LFM2WebGPUProvider({
  modelId: 'LiquidAI/LFM2-1.2B',
  dtype: 'q4',
});

self.onmessage = async (event: MessageEvent<WorkerInboundMessage>): Promise<void> => {
  if (event.data.type !== 'query') {
    return;
  }

  try {
    await provider.initialize();
    await provider.stream(event.data.prompt, (token) => {
      postMessage({ type: 'token', token } satisfies WorkerOutboundMessage);
    });
    postMessage({ type: 'done' } satisfies WorkerOutboundMessage);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown worker error.';
    postMessage({ type: 'error', message } satisfies WorkerOutboundMessage);
  }
};
