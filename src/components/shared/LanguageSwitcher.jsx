import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe } from "lucide-react";

export default function LanguageSwitcher() {
  const queryClient = useQueryClient();

  const { data: languageSettings } = useQuery({
    queryKey: ['languageSettings'],
    queryFn: async () => {
      const settings = await base44.entities.LanguageSettings.list();
      return settings[0] || { language: 'fr' };
    },
  });

  const updateLanguageMutation = useMutation({
    mutationFn: async (language) => {
      if (languageSettings?.id) {
        return base44.entities.LanguageSettings.update(languageSettings.id, { language });
      } else {
        return base44.entities.LanguageSettings.create({ language });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['languageSettings'] });
      window.location.reload(); // Reload to apply new language
    },
  });

  const languages = {
    en: { label: 'English', flag: '🇬🇧' },
    fr: { label: 'Français', flag: '🇫🇷' },
    es: { label: 'Español', flag: '🇪🇸' }
  };

  return (
    <div className="flex items-center gap-2">
      <Globe className="w-4 h-4 text-slate-600" />
      <Select 
        value={languageSettings?.language || 'fr'} 
        onValueChange={(v) => updateLanguageMutation.mutate(v)}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(languages).map(([code, { label, flag }]) => (
            <SelectItem key={code} value={code}>
              {flag} {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}