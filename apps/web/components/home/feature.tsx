export default function Features() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-24">
      <div className="flex flex-col gap-2 w-full">
        <span className="flex gap-1.5 hover:opacity-80 transition-opacity items-center font-semibold text-blue-500">
          Sourcing
        </span>
        <h4 className="font-bold text-2xl md:text-5xl tracking-tight">
          Find Your Content Goldmine
        </h4>
        <p className="text-pretty text-lg">
          Stop searching endlessly for video ideas. Connect your favorite
          YouTube channels, and we'll automatically surface the most relevant
          and engaging clips for you to react to. Find viral moments, insightful
          podcast snippets, or trending opinions in your niche effortlessly.
        </p>
        <p className="text-pretty text-lg">
          Spend less time hunting and more time creating content that positions
          you as the expert.
        </p>
      </div>

      <div className="flex flex-col gap-2 w-full">
        <span className="flex gap-1.5 hover:opacity-80 transition-opacity items-center font-semibold text-blue-500">
          Video Editor
        </span>
        <h4 className="font-bold text-2xl md:text-5xl tracking-tight">
          Effortless Reaction Videos
        </h4>
        <p className="text-pretty text-lg">
          Forget complex editing software. Our intuitive editor makes creating
          reaction Shorts a breeze. Simply record your reaction alongside the
          source video. We handle the layout, captions, and rendering, so you
          can focus purely on sharing your valuable perspective.
        </p>
        <p className="text-pretty text-lg">
          Go from idea to published Short in minutes, not hours. It's never been
          easier to produce high-quality content consistently.
        </p>
      </div>
    </div>
  );
}
