import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

type Mode = 'login' | 'signup';

export function Login() {
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const friendlyError = (message: string) => {
    if (message.includes('Invalid login credentials')) return 'Usuario o contraseña incorrectos';
    if (message.includes('Email not confirmed')) return 'Confirmá tu email antes de ingresar';
    if (message.includes('User already registered')) return 'Ese email ya está registrado';
    if (message.includes('Password should be')) return 'La contraseña debe tener al menos 6 caracteres';
    if (message.includes('rate limit') || message.includes('Too many')) return 'Demasiados intentos, esperá unos minutos';
    return message;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await signIn(email, password);
        navigate('/');
      } else {
        if (password !== confirmPassword) {
          setError('Las contraseñas no coinciden');
          return;
        }
        const result = await signUp(email, password, name);
        if (result.needsConfirmation) {
          setInfo('Te enviamos un email para confirmar tu cuenta. Revisá tu bandeja de entrada.');
        } else {
          navigate('/');
        }
      }
    } catch (err) {
      setError(friendlyError(err instanceof Error ? err.message : 'Error inesperado'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <img
            src="/logo.png"
            alt="KioskoGo"
            className="w-24 h-24 object-contain mb-5 drop-shadow-2xl"
          />
          <h1 className="text-4xl font-extrabold text-kiosko-500 tracking-tight">KioskoGo</h1>
          <p className="text-surface-400 mt-2 text-sm">Sistema de gestión y punto de venta</p>
        </div>

        <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6 shadow-xl">
          <h2 className="text-lg font-semibold text-white mb-5">
            {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
          </h2>

          {error && (
            <div className="bg-red-900/30 border border-red-800 text-red-400 text-sm px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {info && (
            <div className="bg-green-900/30 border border-green-800 text-green-400 text-sm px-4 py-3 rounded-lg mb-4">
              {info}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <Input
                label="Nombre"
                type="text"
                placeholder="Tu nombre"
                value={name}
                onChange={(e) => setName(e.target.value)}
                icon={<UserIcon size={16} />}
                required
              />
            )}

            <Input
              label={mode === 'login' ? 'Email o usuario' : 'Email'}
              type={mode === 'login' ? 'text' : 'email'}
              placeholder={mode === 'login' ? 'usuario o tu@email.com' : 'tu@email.com'}
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail size={16} />}
              required
            />

            <div className="relative">
              <Input
                label="Contraseña"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock size={16} />}
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[38px] text-surface-500 hover:text-white"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {mode === 'signup' && (
              <div className="relative">
                <Input
                  label="Confirmar contraseña"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  icon={<Lock size={16} />}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-[38px] text-surface-500 hover:text-white"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            )}

            <Button type="submit" fullWidth size="lg" disabled={loading}>
              {loading
                ? mode === 'login'
                  ? 'Ingresando...'
                  : 'Creando cuenta...'
                : mode === 'login'
                  ? 'Iniciar sesión'
                  : 'Crear cuenta'}
            </Button>
          </form>

          <div className="mt-5 pt-4 border-t border-surface-800 text-center">
            <p className="text-sm text-surface-500">
              {mode === 'login' ? '¿No tenés cuenta?' : '¿Ya tenés cuenta?'}{' '}
              <button
                onClick={() => {
                  setMode(mode === 'login' ? 'signup' : 'login');
                  setError('');
                  setInfo('');
                  setConfirmPassword('');
                }}
                className="text-kiosko-500 hover:text-kiosko-400 font-medium"
              >
                {mode === 'login' ? 'Registrate gratis' : 'Iniciar sesión'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
