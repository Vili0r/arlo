import KeysClient from "./keys-client";
import { getAllKeys, getUserProjects } from "./actions";

export default async function KeysPage() {
  const [keys, projects] = await Promise.all([
    getAllKeys(),
    getUserProjects(),
  ]);
  
  const serializedKeys = keys.map(k => ({
    ...k,
    createdAt: k.createdAt.toISOString(),
    lastUsedAt: k.lastUsedAt?.toISOString() ?? null,
  }));

  return <KeysClient keys={serializedKeys} projects={projects} />;
}