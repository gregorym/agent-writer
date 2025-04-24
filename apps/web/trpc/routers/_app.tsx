import { router } from "../trpc";
import { articlesRouter } from "./articlesRouter"; // Import the new router
import { authRouter } from "./authRouter";
import { ghostIntegrationsRouter } from "./ghostIntegrationsRouter";
import { usersRouter } from "./usersRouter";
import { websitesRouter } from "./websitesRouter";

export const appRouter = router({
  ghost: ghostIntegrationsRouter,
  websites: websitesRouter,
  articles: articlesRouter,
  users: usersRouter,
  auth: authRouter,
});

export type AppRouter = typeof appRouter;
