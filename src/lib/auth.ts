import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { nextCookies } from "better-auth/next-js";
import { MongoClient } from "mongodb";

// Create auth instance immediately with error handling
let authInstance: ReturnType<typeof betterAuth> | null = null;

const trustedOrigins = [
  "https://chattimeai.com",
  "https://www.chattimeai.com",
  "http://localhost:3000",
  ...(process.env.BETTER_AUTH_TRUSTED_ORIGINS
    ? process.env.BETTER_AUTH_TRUSTED_ORIGINS.split(",")
    : []),
];

function createAuth() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.warn(
        "MONGODB_URI environment variable is not set, using memory adapter",
      );
      // Return a basic auth instance without database for development
      return betterAuth({
        baseURL:
          process.env.NEXT_PUBLIC_AUTH_BASE_URL || "http://localhost:3000",
        secret:
          process.env.BETTER_AUTH_SECRET ||
          "development-secret-change-in-production",
        trustedOrigins,
        plugins: [nextCookies()],
        emailAndPassword: {
          enabled: true,
        },
        socialProviders: {
          ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
            ? {
                google: {
                  clientId: process.env.GOOGLE_CLIENT_ID,
                  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                },
              }
            : {}),
        },
        session: {
          expiresIn: 60 * 60 * 24 * 7, // 7 days
        },
      });
    }

    const client = new MongoClient(uri);
    const db = client.db();

    return betterAuth({
      baseURL: process.env.NEXT_PUBLIC_AUTH_BASE_URL || "http://localhost:3000",
      secret:
        process.env.BETTER_AUTH_SECRET ||
        "development-secret-change-in-production",
      trustedOrigins,
      database: mongodbAdapter(db, {
        client,
      }),
      plugins: [nextCookies()],

      emailAndPassword: {
        enabled: true,
      },
      socialProviders: {
        ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
          ? {
              google: {
                clientId: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
              },
            }
          : {}),
        ...(process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET
          ? {
              apple: {
                clientId: process.env.APPLE_CLIENT_ID,
                clientSecret: process.env.APPLE_CLIENT_SECRET,
              },
            }
          : {}),
        ...(process.env.TWITTER_CLIENT_ID && process.env.TWITTER_CLIENT_SECRET
          ? {
              twitter: {
                clientId: process.env.TWITTER_CLIENT_ID,
                clientSecret: process.env.TWITTER_CLIENT_SECRET,
              },
            }
          : {}),
        ...(process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET
          ? {
              facebook: {
                clientId: process.env.FACEBOOK_CLIENT_ID,
                clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
              },
            }
          : {}),
      },

      session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
      },
    });
  } catch (error) {
    console.error("Error creating auth instance:", error);
    // Return a minimal auth instance for development
    return betterAuth({
      baseURL: process.env.NEXT_PUBLIC_AUTH_BASE_URL || "http://localhost:3000",
      secret:
        process.env.BETTER_AUTH_SECRET ||
        "development-secret-change-in-production",
      trustedOrigins,
      plugins: [nextCookies()],
      emailAndPassword: {
        enabled: true,
      },
      session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
      },
    });
  }
}

// Initialize auth immediately
try {
  authInstance = createAuth();
} catch (error) {
  console.error("Failed to initialize auth:", error);
}

export const auth = authInstance || createAuth();
