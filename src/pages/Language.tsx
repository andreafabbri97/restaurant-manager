import { Globe, Check } from 'lucide-react';
import { useLanguage, type Language as LanguageType } from '../context/LanguageContext';
import { showToast } from '../components/ui/Toast';

export function Language() {
  const { language, setLanguage, t } = useLanguage();

  function handleLanguageChange(lang: LanguageType) {
    setLanguage(lang);
    showToast(t('settings.saved'), 'success');
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">{t('settings.languageSection')}</h1>
        <p className="text-dark-400 mt-1 text-sm sm:text-base">{t('settings.selectLanguage')}</p>
      </div>

      {/* Language Selection */}
      <div className="card">
        <div className="card-header flex items-center gap-2">
          <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
          <h2 className="font-semibold text-white text-sm sm:text-base">{t('settings.language')}</h2>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Italian */}
            <button
              onClick={() => handleLanguageChange('it')}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                language === 'it'
                  ? 'border-primary-500 bg-primary-500/10'
                  : 'border-dark-700 bg-dark-800 hover:border-dark-600'
              }`}
            >
              <div className="w-10 h-10 rounded-lg bg-dark-700 flex items-center justify-center text-2xl">
                🇮🇹
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-white">{t('settings.italian')}</p>
                <p className="text-xs text-dark-400">Italiano</p>
              </div>
              {language === 'it' && (
                <Check className="w-5 h-5 text-primary-400" />
              )}
            </button>

            {/* English */}
            <button
              onClick={() => handleLanguageChange('en')}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                language === 'en'
                  ? 'border-primary-500 bg-primary-500/10'
                  : 'border-dark-700 bg-dark-800 hover:border-dark-600'
              }`}
            >
              <div className="w-10 h-10 rounded-lg bg-dark-700 flex items-center justify-center text-2xl">
                🇬🇧
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-white">{t('settings.english')}</p>
                <p className="text-xs text-dark-400">English</p>
              </div>
              {language === 'en' && (
                <Check className="w-5 h-5 text-primary-400" />
              )}
            </button>
          </div>

          <p className="text-xs text-dark-500 mt-4">
            {language === 'it'
              ? 'La lingua selezionata verrà applicata immediatamente a tutta l\'interfaccia.'
              : 'The selected language will be applied immediately to the entire interface.'}
          </p>
        </div>
      </div>
    </div>
  );
}
