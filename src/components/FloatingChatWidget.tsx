'use client';

import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Send, X } from 'lucide-react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import {
  buildFallbackChatReply,
  type ChatProductContext,
  type ChatReply,
  type ChatSource,
  type ChatStoreContext,
} from '@/lib/chat';
import type { CatalogStore } from '@/lib/products';
import type { Product } from '@/types/product';

interface ChatMessage {
  sender: 'bot' | 'user';
  text: string;
  whatsappUrl?: string;
  sources?: ChatSource[];
}

interface ChatApiResponse extends ChatReply {
  error?: string;
  retryAfterSeconds?: unknown;
}

interface FloatingChatWidgetProps {
  store?: CatalogStore | null;
}

export interface FloatingChatWidgetRef {
  askAboutProduct: (product: Product) => void;
  openChat: () => void;
}

function getWhatsAppUrl(number: string, message: string) {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

function isSafeHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function toChatProduct(product: Product): ChatProductContext {
  return {
    id: product.id,
    name: product.name,
    merchantName: product.merchantName,
    description: product.description,
    price: product.price,
    isAvailable: product.isAvailable !== false,
    whatsappNumber: product.whatsappNumber,
  };
}

function toChatStore(store?: CatalogStore | null): ChatStoreContext | undefined {
  if (!store) return undefined;
  return {
    name: store.name,
    sellerName: store.sellerName,
    description: store.description,
    whatsappNumber: store.whatsappNumber,
  };
}

export const FloatingChatWidget = forwardRef<FloatingChatWidgetRef, FloatingChatWidgetProps>(({ store }, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [contextProduct, setContextProduct] = useState<Product | null>(null);
  const [isReplying, setIsReplying] = useState(false);
  const [retryAfterSeconds, setRetryAfterSeconds] = useState(0);
  const requestIdRef = useRef(0);
  const requestControllerRef = useRef<AbortController | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'bot',
      text: `Halo! Ada yang bisa saya bantu terkait produk${store?.name ? ` di ${store.name}` : ''}?`,
    },
  ]);
  const [inputText, setInputText] = useState('');

  useEffect(() => {
    if (retryAfterSeconds <= 0) return;

    const timer = window.setTimeout(() => {
      setRetryAfterSeconds((current) => Math.max(0, current - 1));
    }, 1_000);

    return () => window.clearTimeout(timer);
  }, [retryAfterSeconds]);

  const appendBotReply = (payload: Pick<ChatReply, 'reply' | 'sources' | 'whatsappNumber' | 'whatsappMessage'>) => {
    // The API decides whether a reply is actionable. Do not infer a seller CTA
    // merely because the conversation still has a product context; knowledge
    // and off-topic replies should not look like purchase recommendations.
    const whatsappNumber = payload.whatsappNumber?.trim();
    const whatsappMessage = payload.whatsappMessage
      || `Halo ${store?.name ?? 'penjual'}, saya ingin bertanya tentang produk Anda.`;
    const whatsappUrl = whatsappNumber ? getWhatsAppUrl(whatsappNumber, whatsappMessage) : undefined;

    const sources = payload.sources?.filter((source) => isSafeHttpUrl(source.url)).slice(0, 5);
    setMessages((previous) => [...previous, { sender: 'bot', text: payload.reply, whatsappUrl, sources }]);
  };

  const requestBotReply = async (userMessage: string, product = contextProduct) => {
    const productContext = product ? toChatProduct(product) : undefined;
    const storeContext = toChatStore(store);
    const requestId = ++requestIdRef.current;
    requestControllerRef.current?.abort();
    const controller = new AbortController();
    requestControllerRef.current = controller;
    setMessages((previous) => [...previous, { sender: 'user', text: userMessage }]);
    setIsReplying(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          product_id: product?.id,
          product: productContext,
          store: storeContext,
          history: messages.slice(-8),
        }),
        signal: controller.signal,
      });
      const payload = await response.json().catch(() => ({})) as Partial<ChatApiResponse>;
      if (!response.ok) {
        if (requestId === requestIdRef.current) {
          const retrySeconds = response.status === 429 && typeof payload.retryAfterSeconds === 'number'
            && Number.isFinite(payload.retryAfterSeconds)
            ? Math.max(1, Math.ceil(payload.retryAfterSeconds))
            : 0;
          setRetryAfterSeconds(retrySeconds);
          appendBotReply({
            reply: `${typeof payload.error === 'string' ? payload.error : 'Asisten chat belum dapat menjawab saat ini.'}${retrySeconds > 0 ? ` Coba lagi dalam ${retrySeconds} detik.` : ''}`,
          });
        }
        return;
      }
      if (typeof payload.reply !== 'string') {
        throw new Error('Format jawaban asisten tidak valid.');
      }
      if (requestId !== requestIdRef.current) return;
      appendBotReply({
        reply: payload.reply,
        sources: payload.sources,
        whatsappNumber: payload.whatsappNumber,
        whatsappMessage: payload.whatsappMessage,
      });
    } catch (error) {
      if (requestId !== requestIdRef.current || (error instanceof DOMException && error.name === 'AbortError')) return;
      const fallback = buildFallbackChatReply(userMessage, productContext, storeContext);
      appendBotReply(fallback);
    } finally {
      if (requestId === requestIdRef.current) {
        requestControllerRef.current = null;
        setIsReplying(false);
      }
    }
  };

  useImperativeHandle(ref, () => ({
    openChat: () => {
      setContextProduct(null);
      setMessages([{ sender: 'bot', text: 'Halo! Ada yang bisa saya bantu terkait produk?' }]);
      setIsOpen(true);
    },
    askAboutProduct: (product: Product) => {
      setContextProduct(product);
      setIsOpen(true);
      void requestBotReply(`Tolong jelaskan produk "${product.name}".`, product);
    },
  }));

  const handleSend = (event: React.FormEvent) => {
    event.preventDefault();
    const userMessage = inputText.trim();
    if (!userMessage || isReplying || retryAfterSeconds > 0) return;

    setInputText('');
    void requestBotReply(userMessage);
  };

  const toggleGlobalChat = () => {
    if (isOpen) {
      setIsOpen(false);
      return;
    }
    setContextProduct(null);
    setMessages([{ sender: 'bot', text: 'Halo! Ada yang bisa saya bantu terkait produk?' }]);
    setIsOpen(true);
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50">
      {isOpen && (
        <div role="dialog" aria-modal="false" aria-label="Asisten UMKM Bot" className="fixed bottom-20 right-4 left-4 z-50 flex h-[440px] max-h-[75vh] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl sm:absolute sm:bottom-16 sm:right-0 sm:left-auto sm:h-[460px] sm:w-96">
          <div className="flex items-center justify-between bg-[#963E1B] p-4 text-white">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center overflow-hidden"><DotLottieReact src="https://lottie.host/c0ff9600-dd79-4a92-91d2-da4986399c36/rc8EdQGXyJ.json" loop autoplay className="h-9 w-9 object-contain" /></div>
              <div><h4 className="text-sm font-bold">Asisten UMKM Bot</h4><p className="flex items-center gap-1 text-[11px] text-amber-100"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Online</p></div>
            </div>
            <button onClick={() => setIsOpen(false)} className="rounded-lg p-1 text-white transition-colors hover:bg-white/20" aria-label="Tutup chat"><X className="h-5 w-5" /></button>
          </div>

          <div aria-live="polite" className="flex-1 space-y-3 overflow-y-auto bg-gray-50/50 p-4">
            {messages.map((message, index) => (
              <div key={`${message.sender}-${index}`} className={`flex items-start gap-2 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                {message.sender === 'bot' && (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden mt-0.5">
                    <DotLottieReact src="https://lottie.host/c0ff9600-dd79-4a92-91d2-da4986399c36/rc8EdQGXyJ.json" loop autoplay className="h-8 w-8 object-contain" />
                  </div>
                )}
                <div className={`max-w-[85%] sm:max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${message.sender === 'user' ? 'rounded-br-none bg-[#0F2C23] text-white' : 'rounded-bl-none border border-gray-200 bg-white text-gray-800 shadow-sm'}`}>
                  <p>{message.text}</p>
                  {message.whatsappUrl && <a href={message.whatsappUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex rounded-lg bg-[#25D366] px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-[#1ebe5d]">Chat penjual di WhatsApp</a>}
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-2 border-t border-gray-100 pt-2">
                      <p className="mb-1 text-[10px] font-semibold text-gray-500">Sumber web</p>
                      <ul className="space-y-1">
                        {message.sources.map((source) => (
                          <li key={source.url}>
                            <a href={source.url} target="_blank" rel="noreferrer" className="text-[10px] text-[#963E1B] underline hover:text-[#803214]">
                              {source.title}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isReplying && (
              <div className="flex items-start gap-2 justify-start">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden mt-0.5">
                  <DotLottieReact src="https://lottie.host/c0ff9600-dd79-4a92-91d2-da4986399c36/rc8EdQGXyJ.json" loop autoplay className="h-8 w-8 object-contain" />
                </div>
                <div className="rounded-2xl rounded-bl-none border border-gray-200 bg-white px-3.5 py-2.5 text-xs text-gray-500 shadow-sm">Asisten sedang menyiapkan jawaban...</div>
              </div>
            )}
          </div>

          <form onSubmit={handleSend} className="flex gap-2 border-t border-gray-100 bg-white p-3">
            <input aria-label="Pesan untuk asisten UMKM" type="text" value={inputText} onChange={(event) => setInputText(event.target.value)} placeholder={isReplying ? "Menyiapkan jawaban..." : retryAfterSeconds > 0 ? `Coba lagi dalam ${retryAfterSeconds} detik...` : "Tulis pesan..."} disabled={isReplying || retryAfterSeconds > 0} className="flex-1 rounded-xl bg-gray-100 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#963E1B] disabled:cursor-not-allowed disabled:opacity-60" />
            <button type="submit" disabled={isReplying || retryAfterSeconds > 0} className="rounded-xl bg-[#963E1B] p-2.5 text-white transition-colors hover:bg-[#803214] disabled:cursor-not-allowed disabled:opacity-60" aria-label="Kirim pesan"><Send className="h-4 w-4" /></button>
          </form>
        </div>
      )}

      <button
        onClick={toggleGlobalChat}
        className="relative group flex h-14 w-14 items-center justify-center bg-transparent border-0 outline-none transition-transform duration-300 hover:scale-110 active:scale-95 cursor-pointer overflow-visible"
        aria-label={isOpen ? 'Tutup chat' : 'Buka chat'}
      >
        {/* Icon State Terbuka (Sesudah Diklik: Ukuran 56px + Border + Latar Kaca) */}
        <div
          className={`absolute inset-0 flex items-center justify-center rounded-full border-2 border-[#963E1B] bg-white/90 shadow-lg backdrop-blur-sm p-1 transition-all duration-300 ease-in-out ${
            isOpen
              ? 'opacity-100 scale-100 rotate-0'
              : 'opacity-0 scale-75 -rotate-45 pointer-events-none'
          }`}
        >
          <DotLottieReact
            src="https://lottie.host/92e7e97e-6040-4a57-9fd3-a4ea67089d69/POemVQfC1f.json"
            loop
            autoplay
            className="w-full h-full object-contain"
          />
        </div>

        {/* Icon State Tertutup (Sebelum Diklik: Ukuran Super Besar 140px Tanpa Border, Pusat Presisi Sama) */}
        <div
          className={`absolute flex items-center justify-center transition-all duration-300 ease-in-out ${
            !isOpen
              ? 'opacity-100 scale-100 rotate-0'
              : 'opacity-0 scale-75 rotate-45 pointer-events-none'
          }`}
          style={{
            width: '140px',
            height: '140px',
            minWidth: '140px',
            minHeight: '140px',
            left: '50%',
            top: '50%',
            transform: !isOpen ? 'translate(-50%, -50%) scale(1) rotate(0deg)' : 'translate(-50%, -50%) scale(0.75) rotate(45deg)',
          }}
        >
          <DotLottieReact
            src="https://lottie.host/d7de6955-bb66-47ca-92c8-0e44941d9e45/rs7fNH9m6e.json"
            loop
            autoplay
            style={{ width: '140px', height: '140px', minWidth: '140px', minHeight: '140px' }}
            className="drop-shadow-md w-full h-full object-contain"
          />
        </div>
      </button>
    </div>
  );
});

FloatingChatWidget.displayName = 'FloatingChatWidget';
