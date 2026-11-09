import { createAuthClient } from "better-auth/client";

const authClient = createAuthClient();

const signIn = async (callbackURL: string = "/dashboard") => {
  return await authClient.signIn.social({
    provider: "google",
    callbackURL,
    newUserCallbackURL: callbackURL,
  });
};

const signUp = async (
  email: string,
  password: string,
  name: string,
  callbackURL: string = "/dashboard"
) => {
  return await authClient.signUp.email({
    email,
    password,
    name,
    callbackURL,
  });
};

const signInWithEmail = async (
  email: string,
  password: string,
  callbackURL: string = "/dashboard"
) => {
  return await authClient.signIn.email({
    email,
    password,
    callbackURL,
  });
};

const signOut = async () => {
  return await authClient.signOut();
};

const getSession = async () => {
  return await authClient.getSession();
};

export default authClient;
export { signIn, signUp, signInWithEmail, signOut, getSession };
