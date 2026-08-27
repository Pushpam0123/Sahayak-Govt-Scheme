'use client';

import { useLang } from '../../../../lib/theme';
import { TRANSLATIONS } from '../../../../lib/i18n';
import { AdminConsoleView } from '../../../../components/admin/AdminConsoleView';

export default function AdminRulesPage() {
  const { lang } = useLang();
  const t = TRANSLATIONS[lang];

  return <AdminConsoleView t={t} />;
}
