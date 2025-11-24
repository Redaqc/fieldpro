# Analyse des Modules Manquants - FieldPro FSM

## 📊 Résumé Exécutif

**Date:** 24 Novembre 2025
**Modules Frontend:** 42 pages
**Modèles Backend:** 40 modèles
**Tables Database:** 41 tables

### Modules Manquants Identifiés: **9 entités critiques**

---

## ❌ Modules Manquants (Frontend → Backend)

### 1. **Alert** ⚠️ **CRITIQUE**
- **Usage Frontend:** Utilisé dans plusieurs composants
- **Modèle Backend:** ❌ Manquant
- **Table Database:** ❌ Manquante
- **Impact:** Système d'alertes et notifications urgentes non fonctionnel

**Fonctionnalité:**
- Alertes système critiques
- Notifications d'urgence
- Alertes de service
- Alertes de maintenance

### 2. **Bundle** 📦 **IMPORTANT**
- **Usage Frontend:** Utilisé pour regroupements de services/produits
- **Modèle Backend:** ❌ Manquant
- **Table Database:** ❌ Manquante
- **Impact:** Impossible de créer des forfaits de services

**Fonctionnalité:**
- Bundles de services (packages)
- Tarification groupée
- Offres combinées
- Kits de matériaux

### 3. **DashboardConfig** 📊 **IMPORTANT**
- **Usage Frontend:** Configuration des tableaux de bord personnalisés
- **Modèle Backend:** ❌ Manquant
- **Table Database:** ❌ Manquante
- **Impact:** Utilisateurs ne peuvent pas personnaliser leur dashboard

**Fonctionnalité:**
- Configuration widgets dashboard
- Préférences d'affichage
- Layouts personnalisés
- Métriques favorites

### 4. **Integration** 🔌 **CRITIQUE**
- **Usage Frontend:** Gestion des intégrations tierces
- **Modèle Backend:** ❌ Manquant (mais IntegrationSettings dans routes)
- **Table Database:** ❌ Manquante
- **Impact:** Impossible de gérer les connexions QuickBooks/Zoho/etc.

**Fonctionnalité:**
- Enregistrement des intégrations actives
- Tokens OAuth
- État de synchronisation
- Historique de sync

### 5. **IntegrationSettings** ⚙️ **CRITIQUE**
- **Usage Frontend:** ✅ Utilisé 5 fois
- **Modèle Backend:** ❌ Manquant
- **Table Database:** ❌ Manquante
- **Impact:** Configuration des intégrations impossible

**Fonctionnalité:**
- Paramètres QuickBooks
- Paramètres Zoho
- Paramètres Google Calendar
- Credentials API stockés

### 6. **LanguageSettings** 🌍 **IMPORTANT**
- **Usage Frontend:** ✅ Utilisé 4 fois
- **Modèle Backend:** ❌ Manquant
- **Table Database:** ❌ Manquante
- **Impact:** Multi-langue non fonctionnel

**Fonctionnalité:**
- Préférences de langue par utilisateur
- Paramètres régionaux
- Format de date/heure
- Devise

### 7. **MaintenanceSchedule** 🔧 **IMPORTANT**
- **Usage Frontend:** Planification de maintenance préventive
- **Modèle Backend:** ❌ Manquant
- **Table Database:** ❌ Manquante
- **Impact:** Maintenance préventive des équipements impossible

**Fonctionnalité:**
- Calendrier de maintenance
- Rappels préventifs
- Historique de maintenance
- Planification récurrente

### 8. **Role** 👥 **CRITIQUE**
- **Usage Frontend:** Gestion des rôles et permissions
- **Modèle Backend:** ❌ Manquant
- **Table Database:** ❌ Manquante
- **Impact:** Système de permissions non fonctionnel

**Fonctionnalité:**
- Définition des rôles (Admin, Manager, Dispatcher, Technician)
- Permissions granulaires
- Contrôle d'accès
- Rôles personnalisés

### 9. **SyncLog** 📝 **MOYEN**
- **Usage Frontend:** Historique des synchronisations
- **Modèle Backend:** ❌ Manquant
- **Table Database:** ❌ Manquante
- **Impact:** Impossible de débugger les problèmes de sync

**Fonctionnalité:**
- Log des synchronisations
- Erreurs de sync
- Audit trail
- Statistiques de sync

---

## ✅ Modules Existants mais Non Utilisés

### Tables Database sans Référence Frontend Apparente

1. **InvoiceLineItems** ✅ Existe (table relationnelle)
2. **QuotationLineItems** ✅ Existe (table relationnelle)
3. **JobMaterials** ✅ Existe (table relationnelle)
4. **PriceListItems** ✅ Existe (table relationnelle)
5. **SequentialCounters** ✅ Existe (utilitaire interne)

Ces tables sont **normales** - ce sont des tables de jonction ou des tables système.

---

## 📊 Comparaison Backend ↔ Frontend

### Entités Utilisées par le Frontend

```javascript
// Référencées dans src/**/*.jsx
Alert              ❌ Manquant backend
AppSettings        ✅ Existe
Asset              ✅ Existe
Automation         ✅ Existe
Bundle             ❌ Manquant backend
ChecklistTemplate  ✅ Existe
CompanyInfo        ✅ Existe
CustomField        ✅ Existe
Customer           ✅ Existe
DashboardConfig    ❌ Manquant backend
Document           ✅ Existe
FormAutomation     ✅ Existe
FormSubmission     ✅ Existe
FormTemplate       ✅ Existe
GPSTracking        ✅ Existe
GPSZone            ✅ Existe
Integration        ❌ Manquant backend
IntegrationSettings ❌ Manquant backend
Invoice            ✅ Existe
Job                ✅ Existe
LanguageSettings   ❌ Manquant backend
MaintenanceSchedule ❌ Manquant backend
Material           ✅ Existe
NotificationTemplate ✅ Existe
Payment            ✅ Existe
PriceList          ✅ Existe
ProfitabilityRecord ✅ Existe
Quotation          ✅ Existe
RecurringJob       ✅ Existe
Role               ❌ Manquant backend
ServiceCall        ✅ Existe
SupplierInvoice    ✅ Existe
SyncLog            ❌ Manquant backend
TaxSettings        ✅ Existe
TeamMessage        ❌ Manquant backend (Chat?)
Technician         ✅ Existe
TimeEntry          ✅ Existe
Webhook            ✅ Existe
WorkType           ✅ Existe
```

---

## 🔍 Analyse Détaillée par Priorité

### Priorité 1 - CRITIQUE (Bloquer des fonctionnalités majeures)

#### Role - Système de Permissions
```sql
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  permissions JSONB DEFAULT '{}',
  is_system_role BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Permissions manquantes:**
- Gestion granulaire des droits
- Rôles personnalisés
- Contrôle d'accès aux modules

#### IntegrationSettings - Configuration Intégrations
```sql
CREATE TABLE IF NOT EXISTS integration_settings (
  id SERIAL PRIMARY KEY,
  integration_type VARCHAR(50) NOT NULL, -- quickbooks, zoho, google, stripe
  user_id INTEGER REFERENCES users(id),
  company_id INTEGER,
  settings JSONB DEFAULT '{}',
  credentials_encrypted TEXT,
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Fonctionnalités bloquées:**
- QuickBooks sync settings
- Zoho credentials
- Google Calendar config
- Stripe webhooks

#### Alert - Système d'Alertes
```sql
CREATE TABLE IF NOT EXISTS alerts (
  id SERIAL PRIMARY KEY,
  type VARCHAR(50) NOT NULL, -- critical, warning, info
  title VARCHAR(255) NOT NULL,
  message TEXT,
  entity_type VARCHAR(50),
  entity_id INTEGER,
  user_id INTEGER REFERENCES users(id),
  is_read BOOLEAN DEFAULT false,
  is_dismissed BOOLEAN DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);
```

**Fonctionnalités bloquées:**
- Alertes critiques (SLA breach)
- Notifications système
- Alertes de maintenance

### Priorité 2 - IMPORTANT (Impactent l'expérience utilisateur)

#### DashboardConfig - Personnalisation Dashboard
```sql
CREATE TABLE IF NOT EXISTS dashboard_configs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) UNIQUE,
  role_id INTEGER,
  layout JSONB DEFAULT '[]',
  widgets JSONB DEFAULT '[]',
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### LanguageSettings - Multi-langue
```sql
CREATE TABLE IF NOT EXISTS language_settings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  language_code VARCHAR(10) DEFAULT 'en',
  locale VARCHAR(20) DEFAULT 'en-US',
  timezone VARCHAR(50) DEFAULT 'UTC',
  date_format VARCHAR(20) DEFAULT 'MM/DD/YYYY',
  time_format VARCHAR(20) DEFAULT 'hh:mm A',
  currency VARCHAR(10) DEFAULT 'USD',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### MaintenanceSchedule - Maintenance Préventive
```sql
CREATE TABLE IF NOT EXISTS maintenance_schedules (
  id SERIAL PRIMARY KEY,
  asset_id INTEGER REFERENCES assets(id),
  schedule_type VARCHAR(50), -- preventive, corrective, predictive
  frequency VARCHAR(50), -- daily, weekly, monthly, yearly
  interval_value INTEGER,
  next_maintenance_date DATE,
  last_maintenance_date DATE,
  assigned_technician_id INTEGER REFERENCES technicians(id),
  estimated_duration INTEGER, -- minutes
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Bundle - Forfaits de Services
```sql
CREATE TABLE IF NOT EXISTS bundles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  bundle_type VARCHAR(50), -- service, material, mixed
  items JSONB DEFAULT '[]', -- [{type: 'service/material', id: 123, quantity: 2}]
  base_price DECIMAL(10,2),
  discounted_price DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Priorité 3 - MOYEN (Nice to have)

#### SyncLog - Audit Trail
```sql
CREATE TABLE IF NOT EXISTS sync_logs (
  id SERIAL PRIMARY KEY,
  integration_type VARCHAR(50) NOT NULL,
  sync_type VARCHAR(50), -- full, incremental, manual
  status VARCHAR(20), -- success, failed, partial
  records_synced INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### TeamMessage - Chat (Apparemment référencé)
```sql
CREATE TABLE IF NOT EXISTS team_messages (
  id SERIAL PRIMARY KEY,
  conversation_id VARCHAR(100),
  sender_id INTEGER REFERENCES users(id),
  message TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  is_read BOOLEAN DEFAULT false,
  parent_message_id INTEGER REFERENCES team_messages(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🎯 Plan d'Action Recommandé

### Phase 1 - CRITIQUE (Immédiat)
1. ✅ Créer modèle **Role** + table
2. ✅ Créer modèle **IntegrationSettings** + table
3. ✅ Créer modèle **Alert** + table
4. ✅ Créer modèle **Integration** + table
5. ✅ Ajouter aux routes API
6. ✅ Tester avec frontend

### Phase 2 - IMPORTANT (Cette semaine)
1. ✅ Créer modèle **DashboardConfig** + table
2. ✅ Créer modèle **LanguageSettings** + table
3. ✅ Créer modèle **MaintenanceSchedule** + table
4. ✅ Créer modèle **Bundle** + table
5. ✅ Ajouter aux routes API

### Phase 3 - MOYEN (Optionnel)
1. ⏳ Créer modèle **SyncLog** + table
2. ⏳ Créer modèle **TeamMessage** + table (si chat requis)
3. ⏳ Tests d'intégration

---

## 📋 Checklist de Migration

### Modèles Backend à Créer
- [ ] server/src/models/Role.js
- [ ] server/src/models/Integration.js
- [ ] server/src/models/IntegrationSettings.js (ou fusionner avec Integration)
- [ ] server/src/models/Alert.js
- [ ] server/src/models/DashboardConfig.js
- [ ] server/src/models/LanguageSettings.js
- [ ] server/src/models/MaintenanceSchedule.js
- [ ] server/src/models/Bundle.js
- [ ] server/src/models/SyncLog.js
- [ ] server/src/models/TeamMessage.js

### Tables Database à Ajouter
- [ ] roles
- [ ] integrations
- [ ] integration_settings (ou fusionner)
- [ ] alerts
- [ ] dashboard_configs
- [ ] language_settings
- [ ] maintenance_schedules
- [ ] bundles
- [ ] bundle_items (table de jonction si needed)
- [ ] sync_logs
- [ ] team_messages

### Routes API à Mettre à Jour
- [ ] Ajouter entités dans `server/src/routes/entities.js`
- [ ] Créer routes spécifiques si logique complexe
- [ ] Ajouter dans le mapping `entityModels`

### Tests à Créer
- [ ] Tests E2E pour Role
- [ ] Tests E2E pour IntegrationSettings
- [ ] Tests E2E pour Alert
- [ ] Tests pour autres modules

---

## 💡 Recommandations

### 1. Fusionner Certaines Entités
- **Integration + IntegrationSettings** → Une seule table `integrations` avec champ `settings JSONB`
- **Alert + Notification** → Vérifier si pas déjà couvert par Notification

### 2. Utiliser JSONB pour Flexibilité
- Permissions dans Role (JSONB)
- Settings dans IntegrationSettings (JSONB)
- Layout dans DashboardConfig (JSONB)
- Items dans Bundle (JSONB)

### 3. Relations à Établir
- Role → User (many-to-many via user_roles)
- IntegrationSettings → User
- MaintenanceSchedule → Asset
- DashboardConfig → User/Role

---

## 🔥 Impact si Non Résolu

### Fonctionnalités Bloquées
- ❌ **Gestion des permissions** (Role)
- ❌ **Configuration des intégrations** (IntegrationSettings)
- ❌ **Alertes critiques** (Alert)
- ❌ **Personnalisation dashboard** (DashboardConfig)
- ❌ **Multi-langue** (LanguageSettings)
- ❌ **Maintenance préventive** (MaintenanceSchedule)
- ❌ **Forfaits de services** (Bundle)

### Pages Frontend Affectées
- Settings → Integrations
- Settings → Language
- Settings → Role Management
- Dashboard (personnalisation)
- Maintenance Tracker
- Price Lists (bundles)

---

## ✅ Conclusion

**9 modules critiques/importants manquent** pour avoir une parité 100% avec Base44:

**CRITIQUE (3):**
1. Role
2. IntegrationSettings
3. Alert

**IMPORTANT (4):**
4. DashboardConfig
5. LanguageSettings
6. MaintenanceSchedule
7. Bundle

**MOYEN (2):**
8. SyncLog
9. TeamMessage

**Action immédiate recommandée:** Créer au minimum les 3 modules critiques pour restaurer les fonctionnalités essentielles.
