import OSS from "ali-oss";

let client: OSS | null = null;

function getClient(): OSS {
  if (client) return client;

  const bucket = process.env.ALIBABA_OSS_BUCKET;
  const accessKeyId = process.env.ALIBABA_ACCESS_KEY_ID;
  const accessKeySecret = process.env.ALIBABA_ACCESS_KEY_SECRET;

  if (!bucket || !accessKeyId || !accessKeySecret) {
    throw new Error("Missing OSS configuration env vars");
  }

  client = new OSS({
    region: "oss-cn-shanghai",
    accessKeyId,
    accessKeySecret,
    bucket,
  });

  return client;
}

/**
 * Upload a base64-encoded image to OSS and return the public HTTPS URL.
 */
export async function uploadImageToOSS(
  imageBase64: string,
): Promise<string> {
  const oss = getClient();
  const buffer = Buffer.from(imageBase64, "base64");

  const filename = `ocr/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;

  const result = await oss.put(filename, buffer, {
    mime: "image/jpeg",
  });

  return result.url;
}
