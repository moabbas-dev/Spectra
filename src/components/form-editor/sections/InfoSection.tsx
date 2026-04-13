import type { InfoObject, ContactObject, LicenseObject } from '../../../types/openapi.types';
import { FormSection } from '../FormSection';
import { FormField, inputClass, textareaClass } from '../FormField';
import { ExtensionsList } from '../ExtensionsList';
import { Info } from 'lucide-react';

interface Props {
  info: InfoObject;
  onChange: (info: InfoObject) => void;
}

export function InfoSection({ info, onChange }: Props) {
  function set<K extends keyof InfoObject>(key: K, value: InfoObject[K]) {
    onChange({ ...info, [key]: value });
  }

  function setContact<K extends keyof ContactObject>(key: K, value: string) {
    onChange({ ...info, contact: { ...info.contact, [key]: value || undefined } });
  }

  function setLicense<K extends keyof LicenseObject>(key: K, value: string) {
    const lic = info.license ?? { name: '' };
    onChange({ ...info, license: { ...lic, [key]: value || undefined } });
  }

  return (
    <FormSection title="Info" icon={<Info className="h-3.5 w-3.5 text-blue-500" />}>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Title" htmlFor="info-title">
          <input
            id="info-title"
            className={inputClass}
            value={info.title ?? ''}
            onChange={(e) => set('title', e.target.value)}
            placeholder="My API"
          />
        </FormField>
        <FormField label="Version" htmlFor="info-version">
          <input
            id="info-version"
            className={inputClass}
            value={info.version ?? ''}
            onChange={(e) => set('version', e.target.value)}
            placeholder="1.0.0"
          />
        </FormField>
      </div>

      <FormField label="Description" htmlFor="info-desc">
        <textarea
          id="info-desc"
          className={textareaClass}
          rows={3}
          value={info.description ?? ''}
          onChange={(e) => set('description', e.target.value || undefined)}
          placeholder="A brief description of the API..."
        />
      </FormField>

      <FormField label="Terms of Service" htmlFor="info-tos">
        <input
          id="info-tos"
          className={inputClass}
          value={info.termsOfService ?? ''}
          onChange={(e) => set('termsOfService', e.target.value || undefined)}
          placeholder="https://example.com/tos"
        />
      </FormField>

      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 pt-2">
        Contact
      </p>
      <div className="grid grid-cols-3 gap-3">
        <FormField label="Name" htmlFor="contact-name">
          <input
            id="contact-name"
            className={inputClass}
            value={info.contact?.name ?? ''}
            onChange={(e) => setContact('name', e.target.value)}
            placeholder="API Support"
          />
        </FormField>
        <FormField label="Email" htmlFor="contact-email">
          <input
            id="contact-email"
            className={inputClass}
            value={info.contact?.email ?? ''}
            onChange={(e) => setContact('email', e.target.value)}
            placeholder="support@example.com"
          />
        </FormField>
        <FormField label="URL" htmlFor="contact-url">
          <input
            id="contact-url"
            className={inputClass}
            value={info.contact?.url ?? ''}
            onChange={(e) => setContact('url', e.target.value)}
            placeholder="https://example.com"
          />
        </FormField>
      </div>

      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 pt-2">
        License
      </p>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Name" htmlFor="license-name">
          <input
            id="license-name"
            className={inputClass}
            value={info.license?.name ?? ''}
            onChange={(e) => setLicense('name', e.target.value)}
            placeholder="MIT"
          />
        </FormField>
        <FormField label="URL" htmlFor="license-url">
          <input
            id="license-url"
            className={inputClass}
            value={info.license?.url ?? ''}
            onChange={(e) => setLicense('url', e.target.value)}
            placeholder="https://opensource.org/licenses/MIT"
          />
        </FormField>
      </div>

      <ExtensionsList
        parentObj={info as any}
        onChange={(key, value) => {
          onChange({ ...info, [key]: value });
        }}
        onRemove={(key) => {
          const next = { ...info };
          delete next[key as keyof InfoObject];
          onChange(next);
        }}
      />
    </FormSection>
  );
}
