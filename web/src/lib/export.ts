import type { SchemeDetail } from './types';

export function shareSchemeOnWhatsApp(scheme: SchemeDetail): void {
  const lines: string[] = [
    `🏛️ *${scheme.name}*`,
    `💰 *Benefit:* ${scheme.benefit_amount || 'Financial Assistance'}`,
    `📂 *Category:* ${scheme.category} (${scheme.state})`,
    '',
    '📋 *Required Documents:*',
  ];

  if (scheme.required_documents && scheme.required_documents.length > 0) {
    scheme.required_documents.forEach((doc) => {
      lines.push(`  • ${doc}`);
    });
  } else {
    lines.push('  • Identity and residency proofs');
  }

  lines.push('');
  if (scheme.application_url) {
    lines.push(`🌐 *Apply here:* ${scheme.application_url}`);
  }
  if (scheme.helpline) {
    lines.push(`📞 *Helpline:* ${scheme.helpline}`);
  }
  lines.push('');
  lines.push('🔍 Verified with *Sahayak* - Official Government Scheme Assistant.');

  const encoded = encodeURIComponent(lines.join('\n'));
  window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
}

export function triggerPrint(): void {
  window.print();
}
