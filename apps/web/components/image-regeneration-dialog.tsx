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
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/trpc/client";
import { useAtom } from "jotai";
import { useEffect, useState } from "react"; // Added useEffect
import { Carousel, CarouselContent, CarouselItem } from "./ui/carousel";

interface ImageRegenerationDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  imageUrl: string | null;
  onReplaceImage: (url: string) => void;
}

export function ImageRegenerationDialog({
  isOpen,
  onOpenChange,
  imageUrl, // This is the initial image from the parent
  onReplaceImage,
}: ImageRegenerationDialogProps) {
  const [prompt, setPrompt] = useState("");
  const [history, setHistory] = useAtom(imageHistoryAtom);
  const [activeImageUrl, setActiveImageUrl] = useState<string | null>(null);

  useEffect(() => {
    setActiveImageUrl(imageUrl);
    // Reset prompt when the main image context changes
    if (imageUrl) {
      // Only reset prompt if there's a new image to work on
      setPrompt("");
    }
  }, [imageUrl]);

  const createImageMutation = trpc.ai.createImage.useMutation();

  const handleGenerate = async () => {
    if (!activeImageUrl || !prompt.trim()) {
      return;
    }

    try {
      const newUrl = await createImageMutation.mutateAsync({ prompt });
      if (newUrl) {
        setHistory((prev) =>
          [newUrl, ...prev.filter((url) => url !== newUrl)].slice(0, 10)
        ); // Add to history, limit size, ensure unique
        setActiveImageUrl(newUrl); // Set the newly generated image as the active one
        onReplaceImage(newUrl); // Inform the parent component
      }
    } catch (error) {
      // Error handling can be added here if needed (e.g., toast notification)
    }
  };

  if (!imageUrl) {
    // Initial guard based on prop: if no image, dialog shouldn't be open/useful
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
          <img
            src={activeImageUrl || ""} // Use activeImageUrl for the main display
            alt="Selected image"
            className="rounded-md w-full object-contain"
          />
          <Textarea
            placeholder="Enter new prompt for the image..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
          />
          {history.length > 0 && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2">History</h4>
              <Carousel>
                <CarouselContent>
                  {history.map((imgUrl, index) => (
                    <CarouselItem
                      key={`${imgUrl}-${index}`}
                      className="basis-1/3"
                    >
                      <img
                        src={imgUrl}
                        alt={`History image ${index + 1}`}
                        className={`rounded-md w-full object-contain cursor-pointer ${
                          activeImageUrl === imgUrl
                            ? "border-2 border-black"
                            : "" // Compare with activeImageUrl
                        }`}
                        onClick={() => setActiveImageUrl(imgUrl)} // Update local activeImageUrl
                      />
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
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
