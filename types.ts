export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai' | 'system';
}

export interface ImageData {
  base64: string;
  mimeType: string;
}

export interface AiChatResponse {
  answer: string;
  suggestions: string[];
}
