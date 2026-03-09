const TypingIndicator = () => {
   return (
      <div className="flex justify-start">
         <div className="flex items-center gap-1 rounded-2xl bg-muted px-4 py-3 text-foreground">
            <span className="h-2 w-2 animate-bounce rounded-full bg-current [animation-delay:-0.3s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-current [animation-delay:-0.15s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-current" />
         </div>
      </div>
   );
};

export default TypingIndicator;
