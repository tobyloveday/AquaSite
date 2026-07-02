import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function getPhotosBucket() {
  const { env } = await getCloudflareContext({ async: true });
  return env.PHOTOS;
}
