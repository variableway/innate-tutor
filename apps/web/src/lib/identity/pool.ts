import pg from "pg";
import { getServerEnv } from "../env";
import { ensureIdentitySchema } from "./schema";

const { Pool } = pg;

declare global {
  // eslint-disable-next-line no-var
  var __innateIdentityPool: pg.Pool | undefined;
}

export function getIdentityPool(): pg.Pool {
  if (!global.__innateIdentityPool) {
    global.__innateIdentityPool = new Pool({
      connectionString: getServerEnv().databaseUrl,
    });
  }
  return global.__innateIdentityPool;
}

export async function withIdentityDb<T>(fn: (pool: pg.Pool) => Promise<T>): Promise<T> {
  const pool = getIdentityPool();
  await ensureIdentitySchema(pool);
  return fn(pool);
}
