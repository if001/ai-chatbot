import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";
// import { gateway } from '@ai-sdk/gateway';
// import { isTestEnvironment } from '../constants';

import { createOllama } from "ollama-ai-provider-v2";

const ollama = createOllama({
  baseURL: "http://localhost:11434/api",
});

export const myProvider = customProvider({
  languageModels: {
    "chat-model": ollama("qwen3:0.6b"),
    "chat-model-reasoning": wrapLanguageModel({
      model: ollama("qwen3:0.6b"),
      middleware: extractReasoningMiddleware({ tagName: "think" }),
    }),
    "title-model": ollama("qwen3:0.6b"),
    "artifact-model": ollama("qwen3:0.6b"),
  },
});

// export const myProvider = isTestEnvironment
//   ? (() => {
//       const {
//         artifactModel,
//         chatModel,
//         reasoningModel,
//         titleModel,
//       } = require('./models.mock');
//       return customProvider({
//         languageModels: {
//           'chat-model': chatModel,
//           'chat-model-reasoning': reasoningModel,
//           'title-model': titleModel,
//           'artifact-model': artifactModel,
//         },
//       });
//     })()
//   : customProvider({
//       languageModels: {
//         'chat-model': gateway.languageModel('xai/grok-2-vision-1212'),
//         'chat-model-reasoning': wrapLanguageModel({
//           model: gateway.languageModel('xai/grok-3-mini'),
//           middleware: extractReasoningMiddleware({ tagName: 'think' }),
//         }),
//         'title-model': gateway.languageModel('xai/grok-2-1212'),
//         'artifact-model': gateway.languageModel('xai/grok-2-1212'),
//       },
//     });
