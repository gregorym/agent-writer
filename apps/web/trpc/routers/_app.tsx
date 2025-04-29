import { router } from "../trpc";
import { articlesRouter } from "./articlesRouter"; // Import the new router
import { authRouter } from "./authRouter";
import { ghostIntegrationsRouter } from "./ghostIntegrationsRouter";
import { githubIntegrationsRouter } from "./githubIntegrationsRouter";
import { usersRouter } from "./usersRouter";
import { websitesRouter } from "./websitesRouter";

export const appRouter = router({
  ghost: ghostIntegrationsRouter,
  github: githubIntegrationsRouter,
  websites: websitesRouter,
  articles: articlesRouter,
  users: usersRouter,
  auth: authRouter,
});

export type AppRouter = typeof appRouter;
