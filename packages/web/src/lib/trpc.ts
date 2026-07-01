import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@smart-dictation/server/src/routers";
import type { TRPCLink } from "@trpc/client";
import type { AnyTRPCRouter } from "@trpc/server";

function createTypedTRPC<TRouter extends AnyTRPCRouter>() {
  return createTRPCReact<TRouter>();
}

export const trpc = createTypedTRPC<AppRouter>();
