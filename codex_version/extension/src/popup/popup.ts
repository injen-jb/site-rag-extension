import type { PortMessage } from '@/background/MessageRouter';
import { PopupController, type PopupMode } from './PopupController';

interface PortLike {
  postMessage(message: unknown): void;
  onMessage: {
    addListener(listener: (message: unknown) => void): void;
  };
}

const appElement = document.getElementById('app');
if (!appElement) {
  throw new Error('Popup root element was not found.');
}

const port =
  typeof chrome !== 'undefined' && chrome.runtime?.connect
    ? (chrome.runtime.connect({ name: 'llm-stream' }) as unknown as PortLike)
    : null;

const controller = new PopupController({
  postMessage: (message) => {
    port?.postMessage(message);
  },
});

appElement.innerHTML = `
  <main class="popup-shell">
    <h1>Converse With This Site</h1>
    <div class="mode-row">
      <button id="mode-page" type="button">Page</button>
      <button id="mode-site" type="button">Site</button>
    </div>
    <label for="question-input">Ask a question</label>
    <textarea id="question-input" rows="4"></textarea>
    <button id="send-button" type="button">Send</button>
    <div class="status-row">
      <span id="status-label"></span>
      <span id="status-progress"></span>
    </div>
    <progress id="status-bar" max="100" value="0"></progress>
    <p id="error" role="alert"></p>
    <div class="response">
      <div class="response-body" id="response-body"></div>
    </div>
  </main>
`;

const questionInput = getElement<HTMLTextAreaElement>('question-input');
const sendButton = getElement<HTMLButtonElement>('send-button');
const modePageButton = getElement<HTMLButtonElement>('mode-page');
const modeSiteButton = getElement<HTMLButtonElement>('mode-site');
const responseBody = getElement<HTMLDivElement>('response-body');
const errorElement = getElement<HTMLParagraphElement>('error');
const statusLabelElement = getElement<HTMLSpanElement>('status-label');
const statusProgressElement = getElement<HTMLSpanElement>('status-progress');
const statusBarElement = getElement<HTMLProgressElement>('status-bar');

questionInput.addEventListener('input', () => {
  controller.setQuestion(questionInput.value);
  render();
});

sendButton.addEventListener('click', () => {
  controller.ask();
  render();
});

modePageButton.addEventListener('click', () => {
  setMode('page');
});

modeSiteButton.addEventListener('click', () => {
  setMode('site');
});

if (port) {
  port.onMessage.addListener((message: unknown) => {
    if (!isPortMessage(message)) {
      return;
    }

    controller.handleIncoming(message);
    render();
  });
}

render();

function setMode(mode: PopupMode): void {
  controller.setMode(mode);
  render();
}

function render(): void {
  questionInput.value = controller.question;
  sendButton.disabled = controller.streaming || controller.question.trim().length === 0;
  sendButton.textContent = controller.streaming ? 'Streaming…' : 'Send';

  responseBody.textContent = controller.streaming ? `${controller.response}▋` : controller.response;
  errorElement.textContent = controller.errorMessage;
  statusLabelElement.textContent = controller.statusLabel;
  statusProgressElement.textContent = `${controller.progress}%`;
  statusBarElement.value = controller.progress;

  modePageButton.classList.toggle('active', controller.mode === 'page');
  modeSiteButton.classList.toggle('active', controller.mode === 'site');
}

function getElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Expected element with id "${id}"`);
  }

  return element as T;
}

function isPortMessage(message: unknown): message is PortMessage {
  if (typeof message !== 'object' || message === null) {
    return false;
  }

  const type = (message as { readonly type?: unknown }).type;
  return (
    type === 'token' ||
    type === 'status' ||
    type === 'done' ||
    type === 'error' ||
    type === 'query'
  );
}
