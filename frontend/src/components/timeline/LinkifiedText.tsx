// frontend/src/components/timeline/LinkifiedText.tsx
import React from 'react';

interface LinkifiedTextProps {
  text: string;
  className?: string;
}

export const LinkifiedText: React.FC<LinkifiedTextProps> = ({ text, className }) => {
  // Regex para detectar URLs
  const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/g;
  
  // Função para processar o texto e criar links
  const processText = () => {
    const parts = text.split(urlRegex);
    
    return parts.map((part, index) => {
      if (!part) return null;
      
      // Verifica se é uma URL
      if (part.match(urlRegex)) {
        let href = part;
        // Adiciona https:// se começar com www.
        if (part.startsWith('www.')) {
          href = 'https://' + part;
        }
        
        return (
          <a
            key={index}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#e60909] hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        );
      }
      
      // Retorna o texto normal
      return <span key={index}>{part}</span>;
    });
  };
  
  return <span className={className}>{processText()}</span>;
};