export type ChatFormData = {
   message: string;
};

export type ChatResponse = {
   message: string;
};

export type Message = {
   content: string;
   role: 'user' | 'bot';
};
