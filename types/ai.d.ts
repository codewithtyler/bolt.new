declare module 'ai' {
  export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
  }
}

declare module 'ai/react' {
  import type { Message } from 'ai';
  
  export interface UseChat {
    messages: Message[];
    isLoading: boolean;
    input: string;
    handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    setInput: (input: string) => void;
    stop: () => void;
    append: (message: Message) => void;
  }

  export function useChat(config: { 
    api: string;
    onError: (error: unknown) => void;
    onFinish?: () => void;
    initialMessages?: Message[];
  }): UseChat;
} 