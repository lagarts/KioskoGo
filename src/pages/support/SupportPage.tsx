import { useState } from 'react';
import { HelpCircle, Mail, Send, Copy, Check } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../contexts/AuthContext';

const SUPPORT_EMAIL = 'covacapp1@gmail.com';

export function SupportPage() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(SUPPORT_EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert(SUPPORT_EMAIL);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const mailSubject = `[KioskoGo] ${subject.trim() || 'Consulta de soporte'}`;
    const lines = [
      message.trim(),
      '',
      '---',
      `De: ${name.trim() || 'Sin nombre'}`,
      user?.email ? `Cuenta: ${user.email}` : '',
    ].filter((line) => line !== '');
    const mailto = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
      mailSubject
    )}&body=${encodeURIComponent(lines.join('\n'))}`;
    window.location.href = mailto;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-kiosko-600/15 flex items-center justify-center">
          <HelpCircle size={20} className="text-kiosko-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Soporte</h1>
          <p className="text-sm text-surface-400">Escribinos y te respondemos a la brevedad</p>
        </div>
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-surface-800 border border-surface-700 flex items-center justify-center shrink-0">
              <Mail size={16} className="text-kiosko-500" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-surface-400">Mail de soporte</p>
              <p className="text-sm font-medium text-white truncate">{SUPPORT_EMAIL}</p>
            </div>
          </div>
          <button
            onClick={() => void copyEmail()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-surface-700 bg-surface-800 text-xs text-surface-300 hover:text-white hover:border-surface-600 transition-colors shrink-0"
          >
            {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
            {copied ? 'Copiado' : 'Copiar mail'}
          </button>
        </div>
      </Card>

      <Card>
        <form onSubmit={handleSend} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Tu nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre y apellido"
            />
            <Input
              label="Asunto"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ej.: Problema al cobrar"
              maxLength={80}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">
              Mensaje *
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              required
              placeholder="Contanos qué necesitás..."
              className="w-full bg-surface-800 border border-surface-700 rounded-lg px-4 py-3 text-sm text-white placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-kiosko-500/50 resize-y"
            />
          </div>
          <Button type="submit" fullWidth size="lg" disabled={!message.trim()}>
            <Send size={16} />
            Enviar mail
          </Button>
          <p className="text-xs text-surface-500 text-center">
            Se abrirá tu aplicación de correo con el mensaje listo para enviar a {SUPPORT_EMAIL}
          </p>
        </form>
      </Card>
    </div>
  );
}
