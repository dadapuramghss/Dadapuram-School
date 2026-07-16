import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Loader2, Sparkles, Mic, MicOff, Volume2 } from 'lucide-react';
import { api } from '../lib/api';

export function AiDashboard() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! I am your Data Analyst AI. Ask me anything about the school records and Student\'s Detail' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef(null);

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Your browser does not support voice input.");
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };
    recognition.start();
  };

  const speakText = (text) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.replace(/\*/g, '').replace(/#/g, ''));
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userQuery = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userQuery }]);
    setIsLoading(true);

    try {
      const response = await api.askAI(userQuery);
      setMessages(prev => [...prev, { role: 'assistant', content: response.answer }]);
    } catch (error) {
      console.error("AI Error:", error);
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error occurred.';
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `Error: ${errorMessage}. (Please check your backend Render logs for more details)` 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] md:h-[calc(100vh-3rem)] w-full max-w-full overflow-hidden">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <Bot className="w-8 h-8 text-indigo-600" />
          AI Data Analyst
        </h2>
        <p className="text-slate-500 dark:text-slate-400">
          Ask questions about student performance, rankings, and analytics.
        </p>
      </div>

      {/* Chat Container */}
      <div className="flex-1 bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl flex flex-col overflow-hidden">
        
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-slate-50 dark:bg-slate-900/50">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[90%] md:max-w-[75%] rounded-3xl p-4 shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-sm' 
                  : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-sm'
              }`}>
                <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                {msg.role === 'assistant' && (
                  <div className="mt-3 flex justify-end">
                    <button 
                      onClick={() => speakText(msg.content)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-slate-500 hover:text-indigo-600 bg-slate-100 dark:bg-slate-700/50 rounded-lg transition-colors"
                      title="Read aloud"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      Read Aloud
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl rounded-bl-sm p-4 shadow-sm flex items-center gap-3 text-slate-500">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                <span>Analyzing database...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-3 md:p-4 bg-white dark:bg-[#0B0F19] border-t border-slate-100 dark:border-slate-800">
          <form onSubmit={handleSubmit} className="flex gap-2 md:gap-3 items-center max-w-4xl mx-auto w-full">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything..."
              className="flex-1 min-w-0 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl md:rounded-2xl px-4 py-3 md:px-6 md:py-4 text-sm md:text-base focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:text-white transition-all shadow-sm"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={startListening}
              className={`p-3 md:p-4 shrink-0 rounded-xl md:rounded-2xl transition-all shadow-sm ${isListening ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
              title="Speak"
            >
              {isListening ? <MicOff className="w-5 h-5 md:w-6 md:h-6" /> : <Mic className="w-5 h-5 md:w-6 md:h-6" />}
            </button>
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-3 md:p-4 shrink-0 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl md:rounded-2xl transition-all shadow-md hover:shadow-lg"
              title="Send Message"
            >
              <Send className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
