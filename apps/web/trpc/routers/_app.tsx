import { router } from "../trpc";
import { authRouter } from "./authRouter";
import { ghostIntegrationsRouter } from "./ghostIntegrationsRouter"; // Add this import
import { usersRouter } from "./usersRouter";
import { websitesRouter } from "./websitesRouter";

export const appRouter = router({
  auth: authRouter,
  users: usersRouter,
  websites: websitesRouter,
  ghost: ghostIntegrationsRouter, // Add the ghost integrations router here
});
export type AppRouter = typeof appRouter;
