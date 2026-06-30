import { FormField, Input } from '../design-system/components';
import { useI18n } from '../i18n/context';

type Props = {
  value: string;
  onChange: (value: string) => void;
  hint?: string;
};

export default function UserIdField({ value, onChange, hint }: Props) {
  const { t } = useI18n();

  return (
    <FormField label={t('forms.userId')} hint={hint ?? t('app.userIdHint')}>
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t('forms.userIdPlaceholder')}
        autoComplete="username"
        style={{ maxWidth: '220px' }}
      />
    </FormField>
  );
}
