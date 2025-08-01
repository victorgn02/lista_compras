import React, { useState } from 'react';
import { Share2, Copy, Check } from 'lucide-react';

interface ShareButtonProps {
  listId: string;
}

export function ShareButton({ listId }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const shareUrl = `${window.location.origin}/list/${listId}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Lista de Compras Compartilhada',
          text: 'Acesse nossa lista de compras compartilhada',
          url: shareUrl
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          copyToClipboard();
        }
      }
    } else {
      copyToClipboard();
    }
  };

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-2 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
    >
      {copied ? (
        <>
          <Check size={16} />
          <span>Copiado!</span>
        </>
      ) : (
        <>
          <Share2 size={16} />
          <span>Compartilhar</span>
        </>
      )}
    </button>
  );
}