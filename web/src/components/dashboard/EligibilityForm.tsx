// Citizen profile form — results update live as fields change.
import type { Dict } from '../../lib/i18n';
import { INDIAN_STATES } from '../../lib/i18n';
import type { ProfileForm } from '../../hooks/useSahayak';
import { Card, CardHeader, Field, Select, TextInput } from '../ui';
import { UserIcon } from '../icons';

interface Props {
  t: Dict;
  profile: ProfileForm;
  setField: (field: keyof ProfileForm, value: string) => void;
}

export function EligibilityForm({ t, profile, setField }: Props) {
  return (
    <Card>
      <CardHeader
        icon={<UserIcon className="h-4.5 w-4.5" />}
        title={t.eligibilityProfile}
      />
      <div className="space-y-4 p-5">
        <p className="text-xs text-muted">{t.profileHint}</p>

        <div className="grid grid-cols-2 gap-3">
          <Field label={t.age} htmlFor="age">
            <TextInput
              id="age"
              type="number"
              min="0"
              value={profile.age}
              onChange={(e) => setField('age', e.target.value)}
            />
          </Field>
          <Field label={t.state} htmlFor="state">
            <Select
              id="state"
              value={profile.state}
              onChange={(e) => setField('state', e.target.value)}
            >
              {INDIAN_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label={t.gender} htmlFor="gender">
            <Select
              id="gender"
              value={profile.gender}
              onChange={(e) => setField('gender', e.target.value)}
            >
              <option value="Female">{t.female}</option>
              <option value="Male">{t.male}</option>
              <option value="Other">{t.other}</option>
            </Select>
          </Field>
          <Field label={t.caste} htmlFor="caste">
            <Select
              id="caste"
              value={profile.caste}
              onChange={(e) => setField('caste', e.target.value)}
            >
              <option value="General">{t.general}</option>
              <option value="OBC">{t.obc}</option>
              <option value="SC">{t.sc}</option>
              <option value="ST">{t.st}</option>
            </Select>
          </Field>
        </div>

        <Field label={t.income} htmlFor="income">
          <TextInput
            id="income"
            type="number"
            min="0"
            placeholder="e.g. 180000"
            value={profile.income}
            onChange={(e) => setField('income', e.target.value)}
          />
        </Field>

        <Field label={t.landholding} htmlFor="land">
          <TextInput
            id="land"
            type="number"
            step="0.1"
            min="0"
            placeholder="e.g. 2.5"
            value={profile.landholding}
            onChange={(e) => setField('landholding', e.target.value)}
          />
        </Field>
      </div>
    </Card>
  );
}
