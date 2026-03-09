import * as Sentry from '@sentry/react';
import { Check, Copy } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';

import type { Message } from './chat.types';
import TypingIndicator from './TypingIndicator';

type ChatMessagesProps = {
   isSubmittingMessage: boolean;
   messages: Message[];
};

const ChatMessages = ({ isSubmittingMessage, messages }: ChatMessagesProps) => {
   const messagesEndRef = useRef<HTMLDivElement | null>(null);
   const [copiedMessageKey, setCopiedMessageKey] = useState<string | null>(null);

   useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
   }, [messages, isSubmittingMessage]);

   const copyMessage = async (content: string, key: string) => {
      try {
         await navigator.clipboard.writeText(content);
         setCopiedMessageKey(key);
         window.setTimeout(() => {
            setCopiedMessageKey((currentKey) => (currentKey === key ? null : currentKey));
         }, 1500);
      } catch (error) {
         Sentry.captureException(error, {
            tags: {
               feature: 'chat',
               operation: 'copy_message',
            },
            extra: {
               messageLength: content.length,
            },
         });
      }
   };

   if (messages.length === 0 && !isSubmittingMessage) {
      return null;
   }

   return (
      <div className="max-h-[60vh] overflow-y-auto pr-1">
         <div className="flex flex-col gap-2">
            {messages.map((message, index) => {
               const messageKey = `${index}-${message.role}-${message.content}`;

               return (
                  <div
                     key={messageKey}
                     className={`flex ${
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                     }`}
                  >
                     <div
                        className={`max-w-[80%] select-text rounded-2xl px-4 py-3 text-sm ${
                           message.role === 'user'
                              ? 'bg-blue-600 text-white'
                              : 'bg-muted text-foreground'
                        }`}
                     >
                        <div className="mb-2 flex justify-end">
                           <button
                              type="button"
                              aria-label="Copy message"
                              onClick={() => void copyMessage(message.content, messageKey)}
                              className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors ${
                                 message.role === 'user'
                                    ? 'bg-white/15 text-white hover:bg-white/25'
                                    : 'bg-black/5 text-foreground hover:bg-black/10'
                              }`}
                           >
                              {copiedMessageKey === messageKey ? (
                                 <>
                                    <Check className="h-3.5 w-3.5" />
                                    Copied
                                 </>
                              ) : (
                                 <>
                                    <Copy className="h-3.5 w-3.5" />
                                    Copy
                                 </>
                              )}
                           </button>
                        </div>
                        {message.role === 'user' ? (
                           <p className="whitespace-pre-wrap break-words">{message.content}</p>
                        ) : (
                           <ReactMarkdown
                              components={{
                                 p: ({ children }) => (
                                    <p className="mb-3 whitespace-pre-wrap break-words last:mb-0">
                                       {children}
                                    </p>
                                 ),
                                 ul: ({ children }) => (
                                    <ul className="mb-3 ml-5 list-disc last:mb-0">
                                       {children}
                                    </ul>
                                 ),
                                 ol: ({ children }) => (
                                    <ol className="mb-3 ml-5 list-decimal last:mb-0">
                                       {children}
                                    </ol>
                                 ),
                                 li: ({ children }) => <li className="mb-1">{children}</li>,
                                 code: ({ children }) => (
                                    <code className="rounded bg-black/10 px-1.5 py-0.5 font-mono text-[0.85em] select-text">
                                       {children}
                                    </code>
                                 ),
                                 pre: ({ children }) => (
                                    <pre className="mb-3 overflow-x-auto rounded-xl bg-black px-4 py-3 text-white select-text last:mb-0">
                                       {children}
                                    </pre>
                                 ),
                                 strong: ({ children }) => (
                                    <strong className="font-semibold">{children}</strong>
                                 ),
                              }}
                           >
                              {message.content}
                           </ReactMarkdown>
                        )}
                     </div>
                  </div>
               );
            })}
            {isSubmittingMessage ? <TypingIndicator /> : null}
            <div ref={messagesEndRef} />
         </div>
      </div>
   );
};

export default ChatMessages;
