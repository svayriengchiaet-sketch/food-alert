import { FoodItem } from './types';
import { promises as fs } from 'fs';
import path from 'path';

const KV_KEY = 'food-items';
const LOCAL_DATA_DIR = path.join(process.cwd(), '.data');
const LOCAL_DATA_FILE = path.join(LOCAL_DATA_DIR, 'items.json');

// Check if Upstash Redis is configured
function isKVConfigured(): boolean {
  return !!(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  );
}

async function getRedis() {
  const { Redis } = await import('@upstash/redis');
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
}

async function readLocalData(): Promise<FoodItem[]> {
  try {
    await fs.mkdir(LOCAL_DATA_DIR, { recursive: true });
    const data = await fs.readFile(LOCAL_DATA_FILE, 'utf-8');
    return JSON.parse(data) as FoodItem[];
  } catch {
    return [];
  }
}

async function writeLocalData(items: FoodItem[]): Promise<void> {
  await fs.mkdir(LOCAL_DATA_DIR, { recursive: true });
  await fs.writeFile(LOCAL_DATA_FILE, JSON.stringify(items, null, 2));
}

export async function getItems(): Promise<FoodItem[]> {
  if (isKVConfigured()) {
    const redis = await getRedis();
    const items = await redis.get<FoodItem[]>(KV_KEY);
    return items || [];
  }
  return readLocalData();
}

export async function saveItems(items: FoodItem[]): Promise<void> {
  if (isKVConfigured()) {
    const redis = await getRedis();
    await redis.set(KV_KEY, items);
    return;
  }
  await writeLocalData(items);
}
