export interface SRTEntry {
  number: string;
  timecode: string;
  subtitles: string[];
}

export function parseSRT(content: string): SRTEntry[] {
  const entries: SRTEntry[] = [];
  const blocks = content.replace(/\r\n/g, "\n").split(/\n\n+/);

  for (let block of blocks) {
    const trimmedBlock = block.trim();
    if (!trimmedBlock) continue;

    const lines = trimmedBlock.split("\n");
    if (lines.length < 2) continue;

    const number = lines[0];
    const timecode = lines[1];
    const subtitles = lines.slice(2);

    let startIndex = 0;
    while (
      startIndex < subtitles.length &&
      subtitles[startIndex].trim() === ""
    ) {
      startIndex++;
    }

    let endIndex = subtitles.length - 1;
    while (endIndex >= 0 && subtitles[endIndex].trim() === "") {
      endIndex--;
    }

    const filteredSubtitles =
      startIndex <= endIndex ? subtitles.slice(startIndex, endIndex + 1) : [];

    if (filteredSubtitles.length > 0) {
      entries.push({ number, timecode, subtitles: filteredSubtitles });
    }
  }

  return entries;
}

export function dedupeSRT(entries: SRTEntry[]): SRTEntry[] {
  const uniqueSubtitles = new Map<string, string>();

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const normalizedSubs = entry.subtitles
      .map((s) => s.trim())
      .filter((s) => s !== "");

    if (normalizedSubs.length === 1) {
      const subtitle = normalizedSubs[0];
      uniqueSubtitles.set(subtitle, entry.timecode);
    }
  }

  const result: SRTEntry[] = [];
  const seenContent = new Set<string>();

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const normalizedSubs = entry.subtitles
      .map((s) => s.trim())
      .filter((s) => s !== "");

    if (normalizedSubs.length === 0) continue;

    if (normalizedSubs.length === 1) {
      const content = normalizedSubs[0];
      if (!seenContent.has(content)) {
        seenContent.add(content);
        const timecode = uniqueSubtitles.get(content) || entry.timecode;
        result.push({
          number: (result.length + 1).toString(),
          timecode: timecode,
          subtitles: [content],
        });
      }
    } else {
      for (const line of normalizedSubs) {
        if (!seenContent.has(line)) {
          seenContent.add(line);
          const timecode = uniqueSubtitles.get(line) || entry.timecode;
          result.push({
            number: (result.length + 1).toString(),
            timecode: timecode,
            subtitles: [line],
          });
        }
      }
    }
  }

  return result;
}

export function constructSRT(entries: SRTEntry[]): string {
  return (
    entries
      .map(
        ({ number, timecode, subtitles }) =>
          `${number}\n${timecode}\n${subtitles.length > 0 ? subtitles.join("\n") : ""}`
      )
      .join("\n\n") + "\n"
  );
}

export function extractTranscript(entries: SRTEntry[]): string {
  const transcript: string[] = [];
  let lastLine = "";

  for (const entry of entries) {
    for (const line of entry.subtitles) {
      const trimmedLine = line.trim();
      if (trimmedLine && trimmedLine !== lastLine) {
        transcript.push(trimmedLine);
        lastLine = trimmedLine;
      } else if (!trimmedLine && lastLine !== "") {
        lastLine = "";
      }
    }
  }

  return transcript.join("\n");
}

export function cleanAndMergeSRT(entries: SRTEntry[]): SRTEntry[] {
  console.warn(
    "cleanAndMergeSRT may not produce expected results with the modified dedupeSRT logic."
  );

  return dedupeSRT(entries);
}

function hasSameSubtitles(entry1: SRTEntry, entry2: SRTEntry): boolean {
  const subs1 = entry1.subtitles.filter((s) => s.trim() !== "");
  const subs2 = entry2.subtitles.filter((s) => s.trim() !== "");

  if (subs1.length !== subs2.length) return false;

  for (let i = 0; i < subs1.length; i++) {
    if (subs1[i] !== subs2[i]) return false;
  }

  return true;
}

function mergeGroup(group: SRTEntry[]): SRTEntry {
  const firstNonEmpty = group.find((entry) =>
    entry.subtitles.some((s) => s.trim() !== "")
  );

  const startTime = extractStartTime(group[0].timecode);
  const endTime = extractEndTime(group[group.length - 1].timecode);

  return {
    number: group[0].number,
    timecode: `${startTime} --> ${endTime}`,
    subtitles: firstNonEmpty
      ? firstNonEmpty.subtitles.filter((s) => s.trim() !== "")
      : [""],
  };
}

function extractStartTime(timecode: string): string {
  const parts = timecode.split(" --> ");
  return parts[0] || "00:00:00,000";
}

function extractEndTime(timecode: string): string {
  const parts = timecode.split(" --> ");
  return parts[1] || "00:00:00,000";
}

export function parseTimecode(timecode: string): [number, number] {
  const parts = timecode.split(" --> ");
  if (parts.length !== 2) {
    throw new Error(`Invalid timecode format: ${timecode}`);
  }

  return [
    convertTimestampToSeconds(parts[0]),
    convertTimestampToSeconds(parts[1]),
  ];
}

function convertTimestampToSeconds(timestamp: string): number {
  const cleanTimestamp = timestamp.replace(",", ".");

  const parts = cleanTimestamp.split(":");
  if (parts.length !== 3) {
    throw new Error(`Invalid timestamp format: ${timestamp}`);
  }

  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);

  const secondsParts = parts[2].split(".");
  const seconds = parseInt(secondsParts[0], 10);
  const milliseconds =
    secondsParts.length > 1 ? parseInt(secondsParts[1], 10) / 1000 : 0;

  return hours * 3600 + minutes * 60 + seconds + milliseconds;
}

export function splitSrtIntoChunks(
  srtContent: string,
  maxWordsPerChunk: number = 1500
): string[] {
  const entries = parseSRT(srtContent);

  const chunks: SRTEntry[][] = [];
  let currentChunk: SRTEntry[] = [];
  let wordCount = 0;

  for (const entry of entries) {
    const entryText = entry.subtitles.join(" ");
    const entryWordCount = entryText
      .split(/\s+/)
      .filter((word) => word.length > 0).length;

    if (
      wordCount + entryWordCount > maxWordsPerChunk &&
      currentChunk.length > 0
    ) {
      chunks.push([...currentChunk]);
      currentChunk = [];
      wordCount = 0;
    }

    currentChunk.push(entry);
    wordCount += entryWordCount;
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  return chunks.map((chunk) => {
    const renumberedChunk = chunk.map((entry, index) => ({
      ...entry,
      number: String(index + 1),
    }));

    return constructSRT(renumberedChunk);
  });
}
