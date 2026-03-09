import './App.css';
import ChatBot from './components/chatBot';

function App() {
   return (
      <div className="flex min-h-screen items-end bg-background p-4 text-foreground">
         <ChatBot />
      </div>
   );
}

export default App;
