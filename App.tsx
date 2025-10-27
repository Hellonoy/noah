import React, { useState, useCallback, useEffect } from 'react';
import { DESIGN_STYLES } from './constants';
import { ChatMessage, ImageData } from './types';
import { generateStyledImage, processUserRequest } from './services/geminiService';
import ImageUploader from './components/ImageUploader';
import StyleSelector from './components/StyleSelector';
import ImageComparator from './components/ImageComparator';
import ChatInterface from './components/ChatInterface';
import { SparklesIcon } from './components/icons/SparklesIcon';

const loadingMessages = [
    "Reimagining your space...",
    "Brewing up some design magic...",
    "Consulting with our AI muse...",
    "Painting with pixels...",
    "Arranging the virtual furniture...",
];

const App: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<ImageData | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);

  useEffect(() => {
    let interval: number | undefined;
    if (isLoading) {
      setLoadingMessage(loadingMessages[Math.floor(Math.random() * loadingMessages.length)]);
      
      interval = setInterval(() => {
        setLoadingMessage(prev => {
          const filteredMessages = loadingMessages.filter(msg => msg !== prev);
          if (filteredMessages.length === 0) return prev; 
          const nextIndex = Math.floor(Math.random() * filteredMessages.length);
          return filteredMessages[nextIndex];
        });
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [isLoading]);


  const handleImageUpload = (imageData: ImageData) => {
    setOriginalImage(imageData);
    setGeneratedImage(null);
    setChatHistory([]);
    setError(null);
    setSuggestedQuestions([]);
  };

  const handleStyleSelect = useCallback(async (style: string) => {
    if (!originalImage) return;

    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);
    setChatHistory([]);
    setSuggestedQuestions([]);

    try {
      const newImage = await generateStyledImage(originalImage, style);
      setGeneratedImage(newImage);
      setChatHistory([{
          id: Date.now().toString(),
          text: `Here is your room reimagined in the ${style} style! You can use the chat below to make further changes or ask questions.`,
          sender: 'system'
      }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [originalImage]);

  const handleSendMessage = async (prompt: string) => {
      if (!generatedImage || !originalImage) return;
      
      const newUserMessage: ChatMessage = { id: Date.now().toString(), text: prompt, sender: 'user'};
      setChatHistory(prev => [...prev, newUserMessage]);
      setIsChatLoading(true);
      setError(null);
      setSuggestedQuestions([]);
      
      try {
          const generatedImageData: ImageData = {
              base64: generatedImage.split(',')[1],
              mimeType: generatedImage.split(';')[0].split(':')[1],
          };

          const result = await processUserRequest(prompt, generatedImageData, chatHistory);

          if (result.type === 'image') {
              setGeneratedImage(result.data);
              const systemMessage: ChatMessage = {
                  id: (Date.now() + 1).toString(),
                  text: "I've updated the design based on your request.",
                  sender: 'system'
              };
              setChatHistory(prev => [...prev, systemMessage]);
              setSuggestedQuestions([
                "What do you think of the change?",
                "Suggest another style.",
                "Give me shopping links for this look."
              ]);
          } else {
              const aiMessage: ChatMessage = {
                  id: (Date.now() + 1).toString(),
                  text: result.data.answer,
                  sender: 'ai'
              };
              setChatHistory(prev => [...prev, aiMessage]);
              setSuggestedQuestions(result.data.suggestions);
          }
      } catch (e) {
          const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
          setError(errorMessage);
          const systemErrorMessage: ChatMessage = {
              id: (Date.now() + 1).toString(),
              text: `Sorry, I couldn't process that. ${errorMessage}`,
              sender: 'system'
          };
          setChatHistory(prev => [...prev, systemErrorMessage]);
      } finally {
          setIsChatLoading(false);
      }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center gap-3">
            <SparklesIcon />
            AI Interior Design Consultant
          </h1>
          <p className="mt-2 text-lg text-stone-500">Transform your space with the power of AI.</p>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 flex flex-col gap-8">
            {!originalImage && <ImageUploader onImageUpload={handleImageUpload} />}
            
            {originalImage && (
              <div className="bg-white/80 backdrop-blur-sm border border-stone-200 p-6 rounded-2xl shadow-sm">
                <h2 className="text-2xl font-semibold mb-4 text-stone-700 text-center">1. Select a Style</h2>
                <StyleSelector styles={DESIGN_STYLES} onSelect={handleStyleSelect} isLoading={isLoading} />
              </div>
            )}

            {isLoading && (
              <div className="flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm border border-stone-200 p-8 rounded-2xl shadow-sm min-h-[400px]">
                <div className="relative h-20 w-20">
                    <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20"></div>
                    <div className="absolute inset-0 rounded-full border-t-4 border-emerald-500 animate-spin"></div>
                </div>
                <p className="mt-6 text-lg text-stone-600 transition-opacity duration-500">{loadingMessage}</p>
              </div>
            )}

            {error && <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">{error}</div>}
            
            {originalImage && generatedImage && !isLoading && (
              <ImageComparator originalSrc={`data:${originalImage.mimeType};base64,${originalImage.base64}`} generatedSrc={generatedImage} />
            )}
          </div>

          <div className="lg:col-span-2">
            {originalImage && generatedImage && !isLoading && (
              <ChatInterface
                chatHistory={chatHistory}
                onSendMessage={handleSendMessage}
                isLoading={isChatLoading}
                suggestedQuestions={suggestedQuestions}
              />
            )}
            {originalImage && !generatedImage && !isLoading && (
                 <div className="flex items-center justify-center text-center h-full bg-white/50 border-2 border-dashed border-stone-300 rounded-2xl p-8">
                    <p className="text-stone-500">Select a design style to begin generating your new room and to activate the design assistant.</p>
                </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;