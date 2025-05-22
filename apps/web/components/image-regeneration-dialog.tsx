"use client";

import { imageHistoryAtom } from "@/atoms";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/trpc/client";
import { useAtom } from "jotai";
import { Info, RefreshCcw } from "lucide-react";
import { useEffect, useState } from "react"; // Added useEffect
import { Carousel, CarouselContent, CarouselItem } from "./ui/carousel";

interface ImageRegenerationDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  imageUrl: string | null;
  onReplaceImage: (prevUrl: string, newUrl: string) => void;
}

export function ImageRegenerationDialog({
  isOpen,
  onOpenChange,
  imageUrl,
  onReplaceImage,
}: ImageRegenerationDialogProps) {
  const [prompt, setPrompt] = useState("");
  const [history, setHistory] = useAtom(imageHistoryAtom);
  const [activeImageUrl, setActiveImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (imageUrl && !activeImageUrl) {
      setActiveImageUrl(imageUrl);
    }
  }, [activeImageUrl, imageUrl]);

  const createImageMutation = trpc.ai.createImage.useMutation();

  const handleGenerate = async () => {
    if (!activeImageUrl || !prompt.trim()) {
      return;
    }

    try {
      const newUrl = await createImageMutation.mutateAsync({ prompt });
      if (newUrl) {
        setHistory((prev) => [
          { url: newUrl, prompt: prompt },
          ...prev.filter((item) => item.url !== newUrl),
        ]); // Add to history, ensure unique, no limit
        setActiveImageUrl(newUrl); // Set the newly generated image as the active one
      }
    } catch (error) {
      console.error("Error generating image:", error);
    }
  };

  if (!imageUrl) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px]">
        <DialogHeader>
          <DialogTitle>Regenerate Image</DialogTitle>
          <DialogDescription>
            Modify the prompt below to regenerate the image.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="relative">
            <img
              src={activeImageUrl || ""}
              alt="Selected image"
              className="rounded-md w-full object-contain"
            />
            {(() => {
              const activeImageHistoryItem = history.find(
                (item) => item.url === activeImageUrl
              );
              return activeImageUrl && activeImageHistoryItem?.prompt ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="absolute top-1 right-1 h-6 w-6"
                      >
                        <Info className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{activeImageHistoryItem.prompt}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : null;
            })()}
            {imageUrl != activeImageUrl && activeImageUrl && (
              <Button
                variant="secondary"
                className="absolute bottom-2 right-2 flex items-center gap-1"
                onClick={onReplaceImage.bind(null, imageUrl, activeImageUrl)}
              >
                <RefreshCcw className="h-4 w-4" />
                Replace
              </Button>
            )}
          </div>
          <Textarea
            placeholder="Enter new prompt for the image..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
          />
          {history.length > 0 && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2">History</h4>
              <TooltipProvider>
                <Carousel>
                  <CarouselContent>
                    {history.map((imgUrl, index) => (
                      <CarouselItem
                        key={`${imgUrl.url}-${index}`}
                        className="basis-1/3 relative" // Added relative positioning
                      >
                        <img
                          src={imgUrl.url}
                          alt={`History image ${index + 1}`}
                          className={`rounded-md w-full object-contain cursor-pointer ${
                            activeImageUrl === imgUrl.url
                              ? "border-2 border-black"
                              : "" // Compare with activeImageUrl
                          }`}
                          onClick={() =>
                            activeImageUrl === imgUrl.url
                              ? setActiveImageUrl(null)
                              : setActiveImageUrl(imgUrl.url)
                          } // Update local activeImageUrl
                        />
                        {imgUrl.prompt && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="absolute top-1 right-1 h-6 w-6"
                              >
                                <Info className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{imgUrl.prompt}</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                </Carousel>
              </TooltipProvider>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={
              !prompt.trim() || !activeImageUrl || createImageMutation.isPending
            }
          >
            {createImageMutation.isPending ? "Generating..." : "Generate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
