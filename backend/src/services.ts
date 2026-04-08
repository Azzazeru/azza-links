import type { Url } from '@prisma/client';
import { promises } from 'dns';
import { prisma } from './db';

const MAX_URL_LENGTH = 2048;
const ALLOWED_PROTOCOLS = ['http:', 'https:'];

//* Services to Controllers

export const createShortURLService = async (url: string): Promise<Url> => {
  try {
    if (!url || url.length > MAX_URL_LENGTH) { throw new Error('Url debe ser menor a 2048 caracteres'); }

    const normalizedUrl = ensureHttpProtocol(url);

    if (!ALLOWED_PROTOCOLS.some(p => normalizedUrl.startsWith(p))) {
      throw new Error('URL debe comenzar con http:// o https://');
    }

    const existingRecord = await existingUrlRecord(normalizedUrl);
    if (existingRecord) return existingRecord;

    const { hostname } = new URL(normalizedUrl);
    await promises.resolveSoa(hostname);

    const code = generateRandomString();
    const result = await prisma.url.create({
      data: {
        originalUrl: normalizedUrl,
        shortCode: code
      }
    })

    return result;
  } catch (error) {
    throw new Error(`Error al crear URL corta: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const retrieveOriginalURLService = async (shortCode: string): Promise<string> => {
  const urlRecord: Url = await getUrlRecord(shortCode);
  await prisma.url.update({
    where: { id: urlRecord.id },
    data: { accessCount: { increment: 1 } },
  });

  return urlRecord.originalUrl;
};

export const updateShortURLService = async (shortCode: string, newUrl: string): Promise<Url> => {
  await existingUrlRecord(newUrl);
  const urlRecord: Url = await getUrlRecord(shortCode);

  return await prisma.url.update({
    where: { id: urlRecord.id },
    data: { originalUrl: newUrl },
  });
};

export const deleteShortURLService = async (shortCode: string): Promise<void> => {
  const urlRecord: Url = await getUrlRecord(shortCode);
  await prisma.url.delete({ where: { id: urlRecord.id } });

  return;
};

export const getURLStatisticsService = async (shortCode: string): Promise<Url> => {
  return await getUrlRecord(shortCode);
};

export const getAllURLsService = async (): Promise<Url[]> => {
  try {
    const urls = await prisma.url.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return urls;
  } catch (error) {
    throw new Error(`Error al obtener URLs: ${error instanceof Error ? error.message : String(error)}`);
  }
};

//? Some Functions to Services

const existingUrlRecord = async (url: string): Promise<Url | null> => {
  const existingUrl = await prisma.url.findFirst({ where: { originalUrl: url } });
  if (existingUrl) throw new Error('URL Already Exists');

  return existingUrl;
};

const generateRandomString = (): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

const getUrlRecord = async (shortCode: string): Promise<Url> => {
  const urlRecord = await prisma.url.findFirst({ where: { shortCode } });
  if (!urlRecord) throw new Error('Short URL Not Found');

  return urlRecord;
};

const ensureHttpProtocol = (url: string): string => {
  if (!url.startsWith('http://') && !url.startsWith('https://')) return 'http://' + url;
  return url;
}