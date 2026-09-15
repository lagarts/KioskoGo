import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      navigate('/');
    } catch {
      setError('Email o contraseña incorrectos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-kiosko-600 flex items-center justify-center mx-auto mb-4">
            <ShoppingCart size={32} className="text-black" />
          </div>
          <h1 className="text-3xl font-bold text-kiosko-500">KioskoGo</h1>
          <p className="text-surface-400 mt-2">Sistema de gestión y punto de venta</p>
        </div>

        {/* Form */}
        <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6 md:p-8">
          <h2 className="text-xl font-semibold text-white mb-6">Iniciar sesión</h2>

          {error && (
            <div className="bg-red-900/30 border border-red-800 text-red-400 text-sm px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="tu@email.com"
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
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[38px] text-surface-500 hover:text-white"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-surface-600 bg-surface-800 text-kiosko-600 focus:ring-kiosko-500" />
                <span className="text-sm text-surface-400">Recordarme</span>
              </label>
              <button type="button" className="text-sm text-kiosko-500 hover:text-kiosko-400">
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <Button type="submit" fullWidth size="lg" disabled={loading}>
              {loading ? 'Ingresando...' : 'Iniciar sesión'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-surface-500">
              ¿No tenés cuenta?{' '}
              <button className="text-kiosko-500 hover:text-kiosko-400 font-medium">
                Registrate gratis
              </button>
            </p>
          </div>
        </div>

        {/* Demo access */}
        <div className="mt-4 text-center">
          <button
            onClick={async () => {
              setEmail('admin@kioskogo.com');
              setPassword('demo123');
              await signIn('admin@kioskogo.com', 'demo123');
              navigate('/');
            }}
            className="text-sm text-surface-500 hover:text-kiosko-500 transition-colors"
          >
            Acceso demo →
          </button>
        </div>
      </div>
    </div>
  );
}
