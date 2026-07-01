import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { db } from "../db";

export const createContext = ({ req, res }: CreateExpressContextOptions) => ({
  db,
  req,
  res,
});

export type Context = typeof createContext extends (
  ...args: any[]
) => infer T
  ? T
  : never;
