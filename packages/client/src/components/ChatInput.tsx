import type { KeyboardEvent } from 'react';
import { ArrowUp } from 'lucide-react';
import type { UseFormHandleSubmit, UseFormRegister } from 'react-hook-form';

import type { ChatFormData } from './chat.types';

type ChatInputProps = {
   handleSubmit: UseFormHandleSubmit<ChatFormData>;
   isSubmittingMessage: boolean;
   isValid: boolean;
   onSubmit: (data: ChatFormData) => Promise<void>;
   register: UseFormRegister<ChatFormData>;
};

const ChatInput = ({
   handleSubmit,
   isSubmittingMessage,
   isValid,
   onSubmit,
   register,
}: ChatInputProps) => {
   const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === 'Enter' && !event.shiftKey && !isSubmittingMessage) {
         event.preventDefault();
         void handleSubmit(onSubmit)();
      }
   };

   return (
      <form
         onSubmit={handleSubmit(onSubmit)}
         className="rounded-3xl border border-border bg-background p-4 shadow-sm"
      >
         <textarea
            {...register('message', {
               validate: (value) => value.trim().length > 0,
            })}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="min-h-32 w-full resize-none border-0 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
         />
         <div className="mt-3 flex justify-end">
            <button
               type="submit"
               aria-label="Send message"
               disabled={!isValid || isSubmittingMessage}
               className="flex h-11 w-11 items-center justify-center rounded-full bg-black text-white transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:bg-black/30"
            >
               <ArrowUp className="h-5 w-5" strokeWidth={2.5} />
            </button>
         </div>
      </form>
   );
};

export default ChatInput;
