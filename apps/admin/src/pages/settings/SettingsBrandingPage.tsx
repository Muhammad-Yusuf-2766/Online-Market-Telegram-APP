import {
  Button,
  FileInput,
  Group,
  Paper,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconUpload } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useGetMarketBrandingQuery,
  useUpdateMarketBrandingMutation,
  useUploadBrandingLogoMutation,
} from '../../app/parfumApi';

export function SettingsBrandingPage() {
  const { t } = useTranslation();
  const { data, isLoading } = useGetMarketBrandingQuery();
  const [updateBranding, { isLoading: saving }] = useUpdateMarketBrandingMutation();
  const [uploadLogo, { isLoading: uploading }] = useUploadBrandingLogoMutation();
  const [marketName, setMarketName] = useState('Ansor Market');
  const [marketSlogan, setMarketSlogan] = useState('Koreadagi halal mahsulotlar');
  const [marketLogoUrl, setMarketLogoUrl] = useState('');

  useEffect(() => {
    if (!data) return;
    setMarketName(data.marketName);
    setMarketSlogan(data.marketSlogan);
    setMarketLogoUrl(data.marketLogoUrl ?? '');
  }, [data]);

  async function submit() {
    try {
      await updateBranding({
        marketName,
        marketSlogan,
        marketLogoUrl: marketLogoUrl.trim() || null,
      }).unwrap();
      notifications.show({ color: 'green', message: t('branding.saved') });
    } catch {
      notifications.show({ color: 'red', message: t('branding.saveError') });
    }
  }

  async function upload(file: File | null) {
    if (!file) return;
    try {
      const result = await uploadLogo(file).unwrap();
      setMarketLogoUrl(result.url);
      notifications.show({ color: 'green', message: t('branding.logoUploaded') });
    } catch {
      notifications.show({ color: 'red', message: t('branding.logoUploadError') });
    }
  }

  return (
    <Stack gap="md">
      <Stack gap={4}>
        <Title order={2}>{t('branding.title')}</Title>
        <Text size="sm" c="dimmed">
          {t('branding.subtitle')}
        </Text>
      </Stack>

      <Paper withBorder radius="md" p="md">
        <Stack gap="md">
          <TextInput
            label={t('branding.marketName')}
            value={marketName}
            disabled={isLoading}
            onChange={(event) => setMarketName(event.currentTarget.value)}
          />
          <TextInput
            label={t('branding.marketSlogan')}
            value={marketSlogan}
            disabled={isLoading}
            onChange={(event) => setMarketSlogan(event.currentTarget.value)}
          />
          <TextInput
            label={t('branding.marketLogoUrl')}
            value={marketLogoUrl}
            disabled={isLoading}
            onChange={(event) => setMarketLogoUrl(event.currentTarget.value)}
          />
          <FileInput
            label={t('branding.uploadLogo')}
            placeholder={t('branding.uploadLogoPlaceholder')}
            accept="image/png,image/jpeg,image/webp,image/gif"
            leftSection={<IconUpload size={16} />}
            clearable
            disabled={uploading}
            onChange={(file) => void upload(file)}
          />
          {marketLogoUrl ? (
            <Group gap="sm">
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 12,
                  border: '1px solid var(--mantine-color-gray-3)',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--mantine-color-gray-0)',
                }}
              >
                <img
                  src={marketLogoUrl}
                  alt=""
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                />
              </div>
              <Text size="sm" c="dimmed">
                {t('branding.logoPreview')}
              </Text>
            </Group>
          ) : null}
          <Group justify="flex-end">
            <Button color="parfum" loading={saving || uploading} onClick={submit}>
              {t('common.save')}
            </Button>
          </Group>
        </Stack>
      </Paper>
    </Stack>
  );
}
