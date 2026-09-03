"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { getUserByEmail, createUser } from "../db/users";
import { getOrganizationByEmail, createOrganization } from "../db/organizations";
import { createSessionToken, SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "./session";

async function startSession(userId: string, organizationId: string): Promise<void> {
  const token = createSessionToken(userId, organizationId);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export interface LoginState {
  error?: string;
}

export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  const user = await getUserByEmail(email);
  if (!user) {
    return { error: "Invalid email or password." };
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return { error: "Invalid email or password." };
  }

  await startSession(user.userId, user.organizationId);
  redirect("/dashboard");
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  redirect("/login");
}

export interface RegisterState {
  error?: string;
}

/**
 * Creates a new organization (or adds a user to an existing one, if the
 * organization email already exists) and signs the new user in. Not linked
 * from any public nav — see src/app/register/page.tsx for why.
 */
export async function registerOrganization(
  _prevState: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const organizationName = String(formData.get("organizationName") ?? "").trim();
  const organizationEmail = String(formData.get("organizationEmail") ?? "")
    .trim()
    .toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!organizationName || !organizationEmail || !name || !email || !password) {
    return { error: "Please fill in all fields." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    return { error: `An account with email "${email}" already exists.` };
  }

  let organization = await getOrganizationByEmail(organizationEmail);
  if (!organization) {
    organization = await createOrganization(organizationName, organizationEmail);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await createUser(organization.organizationId, name, email, passwordHash);

  await startSession(user.userId, user.organizationId);
  redirect("/dashboard");
}
