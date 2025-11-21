import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

/**
 * Hook pour calculer les taxes selon la configuration Settings
 * @param {number} subtotal - Montant avant taxes
 * @param {string} province - Code de province (optionnel, utilise la première taxe si non spécifié)
 * @returns {Object} { taxes: Array, total: number, isLoading: boolean }
 */
export function useTaxCalculation(subtotal = 0, province = null) {
  const { data: taxSettings, isLoading } = useQuery({
    queryKey: ['taxSettings'],
    queryFn: async () => {
      const settings = await base44.entities.TaxSettings.list();
      return settings[0] || { taxes: [] };
    },
    staleTime: 5 * 60 * 1000, // Cache 5 minutes
  });

  // Calculer les taxes applicables
  const calculateTaxes = () => {
    if (!taxSettings?.taxes || taxSettings.taxes.length === 0) {
      return {
        taxes: [],
        subtotal: subtotal || 0,
        total: subtotal || 0,
        taxTotal: 0
      };
    }

    let applicableTaxes = taxSettings.taxes;

    // Filtrer par province si spécifié et multi-province activé
    if (province && taxSettings.multi_province) {
      const provinceTaxes = taxSettings.taxes.filter(
        t => t.province?.toUpperCase() === province.toUpperCase()
      );
      if (provinceTaxes.length > 0) {
        applicableTaxes = provinceTaxes;
      }
    } else if (!province && taxSettings.taxes.length > 0) {
      // Utiliser les taxes de la première province si aucune province spécifiée
      const firstProvince = taxSettings.taxes[0]?.province;
      if (firstProvince) {
        applicableTaxes = taxSettings.taxes.filter(
          t => t.province === firstProvince
        );
      }
    }

    // Calculer chaque taxe
    const calculatedTaxes = applicableTaxes.map(tax => {
      const rate = parseFloat(tax.rate) || 0;
      const amount = (subtotal * rate) / 100;
      return {
        name: tax.tax_name || 'Taxe',
        rate: rate,
        amount: amount,
        province: tax.province,
        tax_number: tax.tax_number
      };
    });

    const taxTotal = calculatedTaxes.reduce((sum, tax) => sum + tax.amount, 0);
    const total = subtotal + taxTotal;

    return {
      taxes: calculatedTaxes,
      subtotal: subtotal || 0,
      total: total,
      taxTotal: taxTotal
    };
  };

  return {
    ...calculateTaxes(),
    isLoading,
    showTaxesInQuotes: taxSettings?.show_taxes_in_quotes ?? true,
    multiProvince: taxSettings?.multi_province ?? false
  };
}

/**
 * Fonction helper pour formater l'affichage des taxes
 */
export function formatTaxLine(tax) {
  return `${tax.name} (${tax.rate}%)`;
}

/**
 * Fonction helper pour obtenir toutes les provinces configurées
 */
export async function getConfiguredProvinces() {
  const settings = await base44.entities.TaxSettings.list();
  if (!settings[0]?.taxes) return [];
  
  const provinces = [...new Set(settings[0].taxes.map(t => t.province))];
  return provinces.filter(Boolean);
}