import {getMessages, getTranslations} from 'next-intl/server';
import {ReactNode} from 'react';
import LocaleLayoutClient from './LocaleLayoutClient';

export async function generateMetadata({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: 'site'});
  return {
    title: `${t('name')} | ${t('tagline')}`,
    description: t('tagline')
  };
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: ReactNode;
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  const messages = await getMessages();

  return (
    <LocaleLayoutClient locale={locale} messages={messages}>
      {children}
    </LocaleLayoutClient>
  );
}
