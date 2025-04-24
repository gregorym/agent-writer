"use client";
// ^-- to make sure we can mount the Provider from a server component
import type { QueryClient } from "@tanstack/react-query";
import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "./routers/_app";

export const trpc = createTRPCReact<AppRouter>();
let clientQueryClientSingleton: QueryClient;
