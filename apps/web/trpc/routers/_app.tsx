import { router } from "../trpc";
import { aiRouter } from "./aiRouter";
import { articlesRouter } from "./articlesRouter"; // Import the new router
import { authRouter } from "./authRouter";
import { ghostIntegrationsRouter } from "./ghostIntegrationsRouter";
import { githubIntegrationsRouter } from "./githubIntegrationsRouter";
import { googleSearchIntegrationsRouter } from "./googleSearchIntegrationRouter";
import { keywordsRouter } from "./keywordsRouter";
import { usersRouter } from "./usersRouter";
import { websitesRouter } from "./websitesRouter";

export const appRouter = router({
  googleSearch: googleSearchIntegrationsRouter,
  github: githubIntegrationsRouter,
  ghost: ghostIntegrationsRouter,
  websites: websitesRouter,
  articles: articlesRouter,
  keywords: keywordsRouter,
  users: usersRouter,
  auth: authRouter,
  ai: aiRouter,
});

export type AppRouter = typeof appRouter;
