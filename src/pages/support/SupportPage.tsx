import { useState } from 'react';
import { HelpCircle, Mail, Send, Copy, Check, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../contexts/AuthContext';

const SUPPORT_EMAIL = 'covacapp1@gmail.com';
const FORM_ENDPOINT = `https://formsubmit.co/ajax/${SUPPORT_EMAIL}`;

export function SupportPage() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendError, setSendError] = useState('');

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(SUPPORT_EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert(SUPPORT_EMAIL);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sending) return;
    setSending(true);
    setSendError('');
    try {
      const body = [
        message.trim(),
        '',
        '---',
        `Cuenta KioskoGo: ${user?.email ?? 'sin sesión'}`,
        email.trim() ? `Mail del usuario: ${email.trim()}` : '',
      ]
        .filter(Boolean)
        .join('\n');

      const res = await fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          name: name.trim() || 'Sin nombre',
          email: email.trim(),
          _replyto: email.trim(),
          _subject: `[KioskoGo] ${subject.trim() || 'Consulta de soporte'}`,
          message: body,
        }),
      });
      const data = (await res.json().catch(() => null)) as
        | { success?: boolean | string; message?: string }
        | null;
      if (!res.ok || !data || (data.success !== true && data.success !== 'true')) {
        throw new Error(data?.message || 'No se pudo enviar el mensaje');
      }
      setSent(true);
      setMessage('');
      setSubject('');
    } catch (err) {
      setSendError(
        err instanceof Error && err.message
          ? err.message
          : 'No se pudo enviar. Intentá de nuevo o escribinos directo a ' + SUPPORT_EMAIL
      );
    } finally {
      setSending(false);
    }
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
        {sent ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-14 h-14 rounded-full bg-green-600/15 flex items-center justify-center mx-auto">
              <CheckCircle2 size={28} className="text-green-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Mensaje enviado</h2>
              <p className="text-sm text-surface-400 mt-1">
                Recibimos tu consulta y te respondemos a la brevedad.
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={() => setSent(false)}
            >
              Enviar otro mensaje
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSend} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Tu nombre"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre y apellido"
              />
              <Input
                label="Tu mail (para responderte)"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tucorreo@ejemplo.com"
              />
            </div>
            <Input
              label="Asunto"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ej.: Problema al cobrar"
              maxLength={80}
            />
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

            {sendError && (
              <div className="flex items-start gap-2 bg-red-900/30 border border-red-800 rounded-lg p-3">
                <AlertCircle size={15} className="text-red-400 shrink-0 mt-0.5" />
                <p className="text-xs text-red-400">{sendError}</p>
              </div>
            )}

            <Button type="submit" fullWidth size="lg" disabled={sending || !message.trim()}>
              {sending ? (
                'Enviando...'
              ) : (
                <>
                  <Send size={16} />
                  Enviar mensaje
                </>
              )}
            </Button>
            <p className="text-xs text-surface-500 text-center">
              Se envía directo a {SUPPORT_EMAIL} sin salir de la app
            </p>
          </form>
        )}
      </Card>
    </div>
  );
}
