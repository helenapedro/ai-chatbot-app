import { useState } from 'react';
import * as Sentry from '@sentry/react';
import axios from 'axios';
import { AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';

import ChatInput from './ChatInput';
import ChatMessages from './ChatMessages';
import type { ChatFormData, ChatResponse, Message } from './chat.types';

const getRequestErrorMessage = (error: unknown) => {
   if (!axios.isAxiosError(error)) {
      return 'Something went wrong. Please try again.';
   }

   if (!error.response) {
      return 'Network error. Check your connection and try again.';
   }

   if (error.response.status >= 500) {
      return 'The server had a problem generating a response. Please try again.';
   }

   if (error.response.status >= 400) {
      return 'Your message could not be sent. Please review it and try again.';
   }

   return 'Something went wrong. Please try again.';
};

const ChatBot = () => {
   const [conversationId] = useState(() => crypto.randomUUID());
   const [isSubmittingMessage, setIsSubmittingMessage] = useState(false);
   const [messages, setMessages] = useState<Message[]>([]);
   const [errorMessage, setErrorMessage] = useState('');

   const {
      register,
      handleSubmit,
      reset,
      formState: { isValid },
   } = useForm<ChatFormData>({
      mode: 'onChange',
      defaultValues: {
         message: '',
      },
   });

   const onSubmit = async ({ message }: ChatFormData) => {
      const trimmedMessage = message.trim();

      setMessages((currentMessages) => [
         ...currentMessages,
         { content: trimmedMessage, role: 'user' },
      ]);
      setIsSubmittingMessage(true);
      setErrorMessage('');

      try {
         const { data } = await axios.post<ChatResponse>('/api/chat', {
            prompt: trimmedMessage,
            conversationId,
         });

         setMessages((currentMessages) => [
            ...currentMessages,
            { content: data.message, role: 'bot' },
         ]);
         reset();
      } catch (error) {
         Sentry.captureException(error, {
            tags: {
               feature: 'chat',
               operation: 'send_message',
            },
            extra: {
               conversationId,
               promptLength: trimmedMessage.length,
            },
         });
         setErrorMessage(getRequestErrorMessage(error));
      } finally {
         setIsSubmittingMessage(false);
      }
   };

   return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-3">
         <ChatMessages
            messages={messages}
            isSubmittingMessage={isSubmittingMessage}
         />
         <ChatInput
            handleSubmit={handleSubmit}
            isSubmittingMessage={isSubmittingMessage}
            isValid={isValid}
            onSubmit={onSubmit}
            register={register}
         />
         {errorMessage ? (
            <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
               <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
               <p>{errorMessage}</p>
            </div>
         ) : null}
      </div>
   );
};

export default ChatBot;
