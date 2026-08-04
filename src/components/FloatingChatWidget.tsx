'use client';

import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { Bot, MessageSquareText, Send, X } from 'lucide-react';
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
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'bot',
      text: `Halo! Ada yang bisa saya bantu terkait produk${store?.name ? ` di ${store.name}` : ''}?`,
    },
  ]);
  const [inputText, setInputText] = useState('');

  const appendBotReply = (payload: Pick<ChatReply, 'reply' | 'whatsappNumber' | 'whatsappMessage' | 'sources'>, product?: Product | null) => {
    const whatsappNumber = payload.whatsappNumber?.trim() || product?.whatsappNumber?.trim() || store?.whatsappNumber?.trim();
    const whatsappMessage = payload.whatsappMessage
      || (product
        ? `Halo, saya ingin bertanya tentang produk ${product.name}.`
        : `Halo ${store?.name ?? 'penjual'}, saya ingin bertanya tentang produk Anda.`);
    const whatsappUrl = whatsappNumber ? getWhatsAppUrl(whatsappNumber, whatsappMessage) : undefined;

    setMessages((previous) => [...previous, { sender: 'bot', text: payload.reply, whatsappUrl, sources: payload.sources }]);
  };

  const requestBotReply = async (userMessage: string, product = contextProduct) => {
    const productContext = product ? toChatProduct(product) : undefined;
    const storeContext = toChatStore(store);
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
        }),
      });
      const payload = await response.json().catch(() => ({})) as Partial<ChatApiResponse>;
      if (!response.ok || typeof payload.reply !== 'string') {
        throw new Error(payload.error || 'Asisten chat belum dapat menjawab.');
      }
      appendBotReply({
        reply: payload.reply,
        whatsappNumber: payload.whatsappNumber,
        whatsappMessage: payload.whatsappMessage,
        sources: payload.sources,
      }, product);
    } catch {
      const fallback = buildFallbackChatReply(userMessage, productContext, storeContext);
      appendBotReply(fallback, product);
    } finally {
      setIsReplying(false);
    }
  };

  useImperativeHandle(ref, () => ({
    openChat: () => setIsOpen(true),
    askAboutProduct: (product: Product) => {
      setContextProduct(product);
      setIsOpen(true);
      void requestBotReply(`Tolong jelaskan produk "${product.name}".`, product);
    },
  }));

  const handleSend = (event: React.FormEvent) => {
    event.preventDefault();
    const userMessage = inputText.trim();
    if (!userMessage || isReplying) return;

    setInputText('');
    void requestBotReply(userMessage);
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50">
      {isOpen && (
        <div role="dialog" aria-modal="false" aria-label="Asisten UMKM Bot" className="fixed bottom-20 right-4 left-4 z-50 flex h-[440px] max-h-[75vh] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl sm:absolute sm:bottom-16 sm:right-0 sm:left-auto sm:h-[460px] sm:w-96">
          <div className="flex items-center justify-between bg-[#963E1B] p-4 text-white">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20"><Bot className="h-5 w-5" /></div>
              <div><h4 className="text-sm font-bold">Asisten UMKM Bot</h4><p className="flex items-center gap-1 text-[11px] text-amber-100"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Online</p></div>
            </div>
            <button onClick={() => setIsOpen(false)} className="rounded-lg p-1 text-white transition-colors hover:bg-white/20" aria-label="Tutup chat"><X className="h-5 w-5" /></button>
          </div>

          <div aria-live="polite" className="flex-1 space-y-3 overflow-y-auto bg-gray-50/50 p-4">
            {messages.map((message, index) => (
              <div key={`${message.sender}-${index}`} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] sm:max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${message.sender === 'user' ? 'rounded-br-none bg-[#0F2C23] text-white' : 'rounded-bl-none border border-gray-200 bg-white text-gray-800 shadow-sm'}`}>
                  <p>{message.text}</p>
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-2 border-t border-gray-100 pt-2 text-[10px]">
                      <p className="mb-1 font-semibold text-gray-500">Sumber web:</p>
                      <div className="space-y-1">
                        {message.sources.map((source) => (
                          <a key={source.url} href={source.url} target="_blank" rel="noreferrer" title={source.url} className="block truncate text-[#963E1B] underline hover:text-[#803214]">
                            {source.title}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  {message.whatsappUrl && <a href={message.whatsappUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex rounded-lg bg-[#25D366] px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-[#1ebe5d]">Chat penjual di WhatsApp</a>}
                </div>
              </div>
            ))}
            {isReplying && <div className="flex justify-start"><div className="rounded-2xl rounded-bl-none border border-gray-200 bg-white px-3.5 py-2.5 text-xs text-gray-500 shadow-sm">Asisten sedang menyiapkan jawaban...</div></div>}
          </div>

          <form onSubmit={handleSend} className="flex gap-2 border-t border-gray-100 bg-white p-3">
            <input aria-label="Pesan untuk asisten UMKM" type="text" value={inputText} onChange={(event) => setInputText(event.target.value)} placeholder={isReplying ? "Menyiapkan jawaban..." : "Tulis pesan..."} disabled={isReplying} className="flex-1 rounded-xl bg-gray-100 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#963E1B] disabled:cursor-not-allowed disabled:opacity-60" />
            <button type="submit" disabled={isReplying} className="rounded-xl bg-[#963E1B] p-2.5 text-white transition-colors hover:bg-[#803214] disabled:cursor-not-allowed disabled:opacity-60" aria-label="Kirim pesan"><Send className="h-4 w-4" /></button>
          </form>
        </div>
      )}

      <button onClick={() => setIsOpen((open) => !open)} className="group flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-[#963E1B] text-white shadow-xl transition-all hover:bg-[#803214] active:scale-95" aria-label={isOpen ? 'Tutup chat' : 'Buka chat'}>
        {isOpen ? <X className="h-5 w-5 sm:h-6 sm:w-6" /> : <MessageSquareText className="h-5 w-5 sm:h-6 sm:w-6 transition-transform group-hover:scale-110" />}
      </button>
    </div>
  );
});

FloatingChatWidget.displayName = 'FloatingChatWidget';
