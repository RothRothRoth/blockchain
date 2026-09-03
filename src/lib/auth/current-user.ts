import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifySessionToken } from "./session";
import { getUserById, AuthUser } from "../db/users";
import { getOrganizationById, Organization } from "../db/organizations";

export interface CurrentUser {
  user: AuthUser;
  organization: Organization;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = verifySessionToken(token);
  if (!session) return null;

  const [user, organization] = await Promise.all([
    getUserById(session.userId),
    getOrganizationById(session.organizationId),
  ]);
  if (!user || !organization) return null;

  return { user, organization };
}
