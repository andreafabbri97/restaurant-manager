import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, User, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Inserisci username e password');
      return;
    }

    setIsLoading(true);

    try {
      const success = await login(username, password);
      if (success) {
        navigate('/');
      } else {
        setError('Credenziali non valide o account disattivato');
      }
    } catch {
      setError('Errore durante il login');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-500/30">
            <span className="text-4xl">🥙</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Kebab Manager</h1>
          <p className="text-dark-400 mt-2">Accedi al tuo account</p>
        </div>

        {/* Login Form */}
        <div className="bg-dark-800 rounded-2xl border border-dark-700 p-8 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Inserisci username"
                  className="input pl-12 py-3"
                  autoComplete="username"
                  autoFocus
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Inserisci password"
                  className="input pl-12 py-3"
                  autoComplete="current-password"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-3 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-dark-900 border-t-transparent rounded-full animate-spin" />
                  Accesso in corso...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <LogIn className="w-5 h-5" />
                  Accedi
                </div>
              )}
            </button>
          </form>

        </div>

        {/* Footer */}
        <p className="text-center text-dark-500 text-sm mt-6">
          Kebab Manager v2.0 - Sistema Gestionale
        </p>
      </div>
    </div>
  );
}
