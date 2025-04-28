import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Buffer } from "buffer"; // Import Buffer

const s3Client = new S3Client({
  region: "us-east-1",
  endpoint: "https://s3.filebase.com",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
  },
  forcePathStyle: true,
});
const S3_BUCKET_NAME = "bloggy";

async function getCID(s3Key: string): Promise<string | undefined> {
  try {
    const response = await fetch(
      `https://api.filebase.io/v1/ipfs/pins?name=${s3Key}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.FILEBASE_PIN_API_KEY}`,
        },
      }
    );
    if (!response.ok) {
      console.error(`Failed to fetch CID: ${response.statusText}`);
      return undefined;
    }
    const ipfsData = await response.json();
    // @ts-ignore - Assuming the structure is correct, add proper typing if possible
    const cid = ipfsData?.results?.[0]?.pin?.cid;
    return cid;
  } catch (error) {
    console.error("Error fetching CID:", error);
    return undefined;
  }
}

export async function uploadFileToS3(
  fileBuffer: Buffer,
  s3Key: string,
  contentType: string
): Promise<string> {
  const putCommand = new PutObjectCommand({
    Bucket: S3_BUCKET_NAME,
    Key: s3Key,
    Body: fileBuffer,
    ContentType: contentType,
  });
  await s3Client.send(putCommand);
  const cid = await getCID(s3Key);
  if (!cid) {
    throw new Error(`Failed to get CID for S3 key: ${s3Key}`);
  }
  return `https://ipfs.io/ipfs/${cid}`;
}

// Removed the default export of getCID as it's now a local helper function
