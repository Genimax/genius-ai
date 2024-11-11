"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Cpu, Send, Zap, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

const task = process.env.NEXT_PUBLIC_TASK;

export default function CyberpunkChat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { role: "user", content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);
    await handleBotResponse(updatedMessages);
    setIsLoading(false);
  };

  const handleBotResponse = async (updatedMessages) => {
    try {
      const response = await fetch("/api/completion/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [{ role: "system", content: task }, ...updatedMessages],
        }),
      });
      if (!response.body) {
        throw new Error("ReadableStream not supported");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let done = false;
      let botMessageContent = "";
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        const decodedValue = decoder.decode(value, { stream: true });

        const lines = decodedValue.split("\n");
        for (let line of lines) {
          if (line.startsWith("data: ")) {
            line = line.replace("data: ", "").trim();
            if (line !== "[DONE]") {
              try {
                const parsed = JSON.parse(line);
                const delta = parsed.choices[0]?.delta?.content || "";
                botMessageContent += delta;

                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    role: "assistant",
                    content: botMessageContent.trim(),
                  };
                  return updated;
                });
              } catch (e) {
                console.error("Could not parse line:", line, e);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const clearContext = () => {
    setMessages([]);
  };

  return (
    <div className="min-h-screen bg-black text-yellow-400 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-full h-full bg-gray-900 bg-opacity-80 p-4 sm:p-6 rounded-lg shadow-2xl border-2 border-yellow-500 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-yellow-500 flex items-center mb-4 sm:mb-0">
            <Cpu className="mr-2 text-yellow-400" /> CyberChat 2077
          </h1>
          <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="flex items-center">
              <Zap className="text-yellow-400 mr-2" />
              <span className="text-yellow-400 font-mono">CONNECTED</span>
            </div>
            <Button
              onClick={clearContext}
              className="bg-yellow-600 hover:bg-yellow-700 p-2 rounded-lg text-black flex items-center justify-center border border-yellow-500"
              aria-label="Clear context"
            >
              <Trash2 className="mr-2" /> Clear Context
            </Button>
          </div>
        </div>
        <div className="h-[60vh] xl:h-[75vh] overflow-y-auto mb-4 pr-4 custom-scrollbar">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`mb-4 p-3 rounded-lg ${
                message.role === "user"
                  ? "bg-yellow-900 bg-opacity-30 text-yellow-200 ml-auto"
                  : "bg-gray-800 bg-opacity-50 text-yellow-200"
              } max-w-[90%] ${message.role === "user" ? "ml-auto" : "mr-auto"} shadow-md border border-yellow-500`}
            >
              <div className="font-bold mb-1 flex items-center">
                {message.role === "user" ? (
                  <>
                    Я <Zap className="ml-2 h-4 w-4 text-yellow-400" />
                  </>
                ) : (
                  <>
                    Genius <Cpu className="ml-2 h-4 w-4 text-yellow-400" />
                  </>
                )}
              </div>
              <div className="font-mono markdown-content">
                {message.role === "assistant" ? (
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                ) : (
                  message.content
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2">
          <Input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                sendMessage();
              }
            }}
            className="flex-1 bg-gray-800 bg-opacity-50 p-3 rounded-lg border border-yellow-500 text-yellow-100 focus:outline-none focus:ring-2 focus:ring-yellow-400 placeholder-yellow-600"
            placeholder="Enter your message, choomba..."
          />
          <Button
            onClick={sendMessage}
            className="w-full sm:w-auto bg-yellow-600 hover:bg-yellow-700 p-3 rounded-lg text-black flex items-center justify-center border border-yellow-500"
          >
            <Send className="mr-2" /> Jack In
          </Button>
        </div>
      </div>
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 0, 0.1);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 0, 0.5);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 0, 0.7);
        }
        .markdown-content {
          color: inherit;
        }
        .markdown-content h1,
        .markdown-content h2,
        .markdown-content h3 {
          color: #ff0;
          margin-top: 1em;
          margin-bottom: 0.5em;
        }
        .markdown-content p {
          margin-bottom: 0.5em;
        }
        .markdown-content ul,
        .markdown-content ol {
          margin-left: 1.5em;
          margin-bottom: 0.5em;
        }
        .markdown-content code {
          background-color: rgba(255, 255, 0, 0.2);
          padding: 0.2em 0.4em;
          border-radius: 3px;
          font-family: monospace;
        }
        .markdown-content pre {
          background-color: rgba(0, 0, 0, 0.3);
          padding: 1em;
          border-radius: 5px;
          overflow-x: auto;
          margin-bottom: 0.5em;
        }
        .markdown-content a {
          color: #ff0;
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
