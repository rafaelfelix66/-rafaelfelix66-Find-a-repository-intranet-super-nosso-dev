
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Image, MessageSquare, HelpCircle } from "lucide-react";
import { Link } from "react-router-dom";

interface QuickAccessItemProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  to: string;
  color: string;
  bgColor: string;
}

function QuickAccessItem({ title, description, icon, to, color, bgColor }: QuickAccessItemProps) {
  return (
    <Link to={to} className="w-full">
      <Card className="hover-lift border-t-4 h-full" style={{ borderTopColor: color }}>
        <CardHeader className="pb-2">
          <div className="w-12 h-12 rounded-full flex items-center justify-center mb-2" style={{ backgroundColor: bgColor }}>
            {icon}
          </div>
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}

export function QuickAccess() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 py-6">
      <QuickAccessItem
        title="Arquivos"
        description="Armazene e gerencie documentos"
        icon={<FileText size={24} className="text-supernosso-red" />}
        to="/arquivos"
        color="#EA384C"
        bgColor="#FDE1D3"
      />
      <QuickAccessItem
        title="Timeline"
        description="Compartilhe eventos e momentos"
        icon={<Image size={24} className="text-supernosso-red" />}
        to="/timeline"
        color="#EA384C"
        bgColor="#FDE1D3"
      />
      <QuickAccessItem
        title="ChatBot"
        description="Posso ajudar?"
        icon={<MessageSquare size={24} className="text-supernosso-red" />}
        to="/chat"
        color="#EA384C"
        bgColor="#FDE1D3"
      />
      <QuickAccessItem
        title="Base de Conhecimento"
        description="Encontre respostas para suas dúvidas"
        icon={<HelpCircle size={24} className="text-supernosso-red" />}
        to="/base-conhecimento"
        color="#EA384C"
        bgColor="#FDE1D3"
      />
    </div>
  );
}
