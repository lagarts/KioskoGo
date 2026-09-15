import { Construction } from 'lucide-react';
import { Card } from '../components/ui/Card';

interface PlaceholderPageProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
}

export function PlaceholderPage({ title, description, icon }: PlaceholderPageProps) {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="w-10 h-10 rounded-xl bg-kiosko-600/15 flex items-center justify-center text-kiosko-500">
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          {description && <p className="text-sm text-surface-400">{description}</p>}
        </div>
      </div>

      <Card>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-surface-800 flex items-center justify-center mb-4">
            <Construction size={32} className="text-kiosko-500" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Próximamente</h2>
          <p className="text-sm text-surface-400 max-w-md">
            Este módulo está en desarrollo. Estamos trabajando para ofrecerte la mejor experiencia.
          </p>
        </div>
      </Card>
    </div>
  );
}
