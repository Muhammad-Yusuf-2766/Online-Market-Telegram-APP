import {
  Button,
  Center,
  Loader,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLoginMutation, useGetMeQuery } from '../app/parfumApi';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { setCredentials } from '../features/auth/authSlice';
import { performLogout } from '../features/auth/logout';

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const token = useAppSelector((s) => s.auth.accessToken);
  const profile = useAppSelector((s) => s.auth.profile);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [login, { isLoading: isLoggingIn }] = useLoginMutation();

  const from =
    (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ??
    '/welcome';

  const { isError: meError, isFetching: meFetching } = useGetMeQuery(undefined, {
    skip: !token,
    refetchOnMountOrArgChange: true,
  });

  useEffect(() => {
    if (profile) {
      navigate(from, { replace: true });
    }
  }, [profile, from, navigate]);

  useEffect(() => {
    if (token && meError && !profile) {
      performLogout(dispatch);
    }
  }, [token, meError, profile, dispatch]);

  const bootstrapping = Boolean(token) && !profile;

  if (bootstrapping) {
    return (
      <Center mih="100dvh" bg="gray.0">
        <Loader color="parfum" size="lg" />
      </Center>
    );
  }

  return (
    <Stack align="center" justify="center" mih="100dvh" p="md" bg="gray.0">
      <Paper shadow="md" p="xl" radius="md" maw={420} w="100%">
        <Title order={2} mb="xs" c="parfum.8">
          {t('login.title')}
        </Title>
        <Text size="sm" c="dimmed" mb="lg">
          {t('login.subtitle')}
        </Text>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            try {
              const res = await login({ email: email.trim(), password }).unwrap();
              dispatch(setCredentials({ accessToken: res.accessToken }));
            } catch {
              setError(t('login.invalidCredentials'));
            }
          }}
        >
          <Stack gap="md">
            <TextInput
              label={t('login.email')}
              placeholder={t('login.emailPlaceholder')}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(ev) => setEmail(ev.currentTarget.value)}
              required
            />
            <PasswordInput
              label={t('login.password')}
              placeholder="••••••••"
              autoComplete="current-password"
              value={password}
              onChange={(ev) => setPassword(ev.currentTarget.value)}
              required
            />
            {error ? (
              <Text size="sm" c="red">
                {error}
              </Text>
            ) : null}
            <Button
              fullWidth
              type="submit"
              loading={isLoggingIn || (Boolean(token) && meFetching && !profile)}
              color="parfum"
            >
              {t('login.continue')}
            </Button>
          </Stack>
        </form>
      </Paper>
    </Stack>
  );
}
