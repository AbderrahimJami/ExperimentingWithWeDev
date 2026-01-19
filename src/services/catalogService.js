import { generateClient } from "aws-amplify/api";
import { getUrl } from "aws-amplify/storage";

export const isCatalogConfigured = Boolean(import.meta.env.VITE_APPSYNC_ENDPOINT);

const storageConfigured = Boolean(
  import.meta.env.VITE_STORAGE_BUCKET &&
    import.meta.env.VITE_STORAGE_REGION &&
    import.meta.env.VITE_IDENTITY_POOL_ID
);

const client = generateClient();

const listExperiencesForUserQuery = /* GraphQL */ `
  query ListExperiencesForUser {
    listExperiencesForUser {
      id
      title
      description
      imagePath
      avgTimeMinutes
      minUsers
      maxUsers
      hardware
      tags
      status
      hasAccess
      lockReason
      statusLabel
    }
  }
`;

const resolveImageUrl = async (path) => {
  if (!path) {
    return "";
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  if (!storageConfigured) {
    return "";
  }

  try {
    const result = await getUrl({
      path,
      options: {
        accessLevel: "public",
      },
    });
    return result.url.toString();
  } catch (error) {
    return "";
  }
};

export async function fetchExperiencesForUser() {
  if (!isCatalogConfigured) {
    return [];
  }

  const { data } = await client.graphql({ query: listExperiencesForUserQuery });
  const items = data?.listExperiencesForUser || [];

  return Promise.all(
    items.map(async (item) => {
      const imageUrl = await resolveImageUrl(item.imagePath);
      return {
        ...item,
        imageUrl,
      };
    })
  );
}
