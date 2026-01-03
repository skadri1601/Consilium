import { auth, currentUser } from "@clerk/nextjs/server";

export async function getSession() {
  const { userId, sessionId, getToken } = await auth();

  if (!userId) {
    return null;
  }

  const token = await getToken();

  return {
    userId,
    sessionId,
    token,
  };
}

export async function getCurrentUser() {
  const user = await currentUser();

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.emailAddresses[0]?.emailAddress,
    firstName: user.firstName,
    lastName: user.lastName,
    imageUrl: user.imageUrl,
  };
}
