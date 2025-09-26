import { GoogleGenAI, Chat } from "@google/genai";

const systemInstructions: Record<string, string> = {
    gemini: 'You are a friendly and helpful AI assistant named Gemini. Your responses should be formatted in markdown.',
    chatgpt: 'You are ChatGPT, a helpful assistant from OpenAI. Emulate its style and capabilities. Your responses should be formatted in markdown.',
    deepseek: 'You are DeepSeek, an AI assistant focused on providing deep and insightful answers. Your responses should be formatted in markdown.',
};

export class GeminiChatService {
  private ai: GoogleGenAI;
  private chats: Map<string, Chat>;

  constructor() {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error("API_KEY environment variable not set.");
    }
    this.ai = new GoogleGenAI({ apiKey });
    this.chats = new Map();
  }

  private getChat(modelId: string): Chat {
      if (!this.chats.has(modelId)) {
          const chat = this.ai.chats.create({
              model: 'gemini-2.5-flash',
              config: {
                systemInstruction: systemInstructions[modelId] || systemInstructions.gemini,
              },
            });
          this.chats.set(modelId, chat);
      }
      return this.chats.get(modelId)!;
  }

  public async *sendMessageStream(message: string, modelId: string): AsyncGenerator<string> {
    const chat = this.getChat(modelId);
    try {
      const result = await chat.sendMessageStream({ message });
      for await (const chunk of result) {
        if (chunk.text) {
          yield chunk.text;
        }
      }
    } catch (error) {
      console.error(`Error sending message to ${modelId}:`, error);
      throw new Error(`Failed to get a response from ${modelId}.`);
    }
  }

  public resetChat(modelId: string): void {
    if (this.chats.has(modelId)) {
        this.chats.delete(modelId);
    }
    // The chat will be re-created on the next message
  }
}