// frontend/src/components/home/CarouselBanner.tsx
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { api } from "@/services/api";
import { useToast } from "@/components/ui/use-toast";
import { BannerItem } from "./BannerItem";

interface Slide {
  _id: string;
  title: string;
  description: string;
  imageUrl: string;
  link?: string;
}

// Slides de fallback em caso de erro
const fallbackSlides: Slide[] = [
  {
    _id: "fallback1",
    title: "Bem-vindo à Intranet Super Nosso",
    description: "Seu portal de comunicação e colaboração",
    imageUrl: "/placeholder.svg",
    link: "#"
  }
];

export function CarouselBanner() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const { toast } = useToast();
  
  // Função para buscar os banners
  const fetchBanners = async () => {
    setIsLoading(true);
    setHasError(false);
    
    try {
      const response = await api.get('/banners');
      if (response && Array.isArray(response) && response.length > 0) {
        setSlides(response);
      } else {
        // Se não houver banners, usar os fallback
        setSlides(fallbackSlides);
      }
    } catch (error) {
      console.error('Erro ao carregar banners:', error);
      setHasError(true);
      setSlides(fallbackSlides);
      toast({
        title: "Erro ao carregar banners",
        description: "Utilizando banners padrão. Tente novamente mais tarde.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchBanners();
  }, []);
  
  const nextSlide = () => {
    if (slides.length <= 1) return;
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };
  
  const prevSlide = () => {
    if (slides.length <= 1) return;
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };
  
  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };
  
  // Efeito para mostrar que a imagem foi carregada
  useEffect(() => {
    const timer = setTimeout(() => {
      if (slides.length > 0) {
        setIsLoading(false);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [slides]);
  
  // Rotação automática
  useEffect(() => {
    if (slides.length <= 1) return; // Não rotacionar se houver apenas 1 slide
    
    const interval = setInterval(() => {
      nextSlide();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [slides.length, currentSlide]);
  
  // Se não houver slides, mostrar um placeholder
  if (slides.length === 0 && !isLoading) {
    return (
      <div className="relative w-full h-[300px] sm:h-[400px] overflow-hidden rounded-xl shadow-md bg-gray-100 flex items-center justify-center">
        <div className="text-center p-4">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-2" />
          <h3 className="text-lg font-medium">Nenhum banner disponível</h3>
          <p className="text-sm text-gray-500">Adicione banners para personalizar sua página inicial</p>
          <Button 
            className="mt-4 bg-[#e60909] hover:bg-[#e60909]/90 text-white"
            onClick={fetchBanners}
          >
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="relative w-full h-[300px] sm:h-[400px] overflow-hidden rounded-xl shadow-md">
      {slides.map((slide, index) => (
        <div 
          key={slide._id}
          className={cn(
            "absolute inset-0 w-full h-full transition-all duration-500 ease-in-out",
            index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"
          )}
        >
          <div className="relative w-full h-full">
            <div className={cn(
              "absolute inset-0 bg-black/40 z-10 transition-opacity",
              isLoading ? "opacity-100" : "opacity-40"
            )} />
            
            {/* Utilizando o componente BannerItem para rastrear os cliques */}
            <div className="absolute inset-0 z-20">
              <BannerItem
                id={slide._id}
                imageUrl={slide.imageUrl}
                link={slide.link}
                title={slide.title}
                description={slide.description}
              />
            </div>
            
            <div className="absolute bottom-0 left-0 right-0 z-30 p-4 sm:p-8 text-white pointer-events-none">
              <h3 className="text-xl sm:text-2xl font-bold mb-2 animate-fade-in">{slide.title}</h3>
              <p className="text-sm sm:text-base mb-4 max-w-md animate-fade-in opacity-90">{slide.description}</p>
              {slide.link && (
                <Button 
                  variant="outline" 
                  className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 hover:border-white/30 animate-fade-in pointer-events-auto"
                  onClick={(e) => {
                    e.stopPropagation(); // Evitar duplo clique
                    window.open(slide.link || "#", "_blank", "noopener,noreferrer");
                    // Também podemos registrar o clique direto por aqui, mas o BannerItem já faz isso
                    api.get(`/banners/${slide._id}/click`).catch(err => 
                      console.error("Erro ao registrar clique adicional:", err)
                    );
                  }}
                >
                  Saiba mais
                </Button>
              )}
            </div>
          </div>
        </div>
      ))}
      
      {slides.length > 1 && (
        <>
          <Button 
            variant="outline" 
            size="icon" 
            className="absolute left-4 top-1/2 -translate-y-1/2 z-40 bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 text-white rounded-full"
            onClick={prevSlide}
          >
            <ChevronLeft size={20} />
          </Button>
          
          <Button 
            variant="outline" 
            size="icon" 
            className="absolute right-4 top-1/2 -translate-y-1/2 z-40 bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 text-white rounded-full"
            onClick={nextSlide}
          >
            <ChevronRight size={20} />
          </Button>
          
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 flex space-x-2">
            {slides.map((_, index) => (
              <button
                key={index}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  index === currentSlide 
                    ? "bg-white w-6" 
                    : "bg-white/50 hover:bg-white/70"
                )}
                onClick={() => goToSlide(index)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}