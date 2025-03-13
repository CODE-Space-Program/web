import dotenv from "dotenv";

dotenv.config();

const assertEnvString = (name: string): string => {
  const value = process.env[name];

  if (!value) throw new Error("Missing string value process.env." + name);

  return value;
};

const assertEnvInteger = (name: string): number => {
  try {
    const value = parseInt(process.env[name]!);

    return value;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (err) {
    throw new Error("Missing integer value process.env." + name);
  }
};

export const env = {
  publicUrl: assertEnvString("PUBLIC_URL"),
  port: assertEnvInteger("PORT"),
  corsOrigins: assertEnvString("CORS_ORIGINS").split(","),

  mongodb: {
    uri: assertEnvString("MONGO_URI"),
  },
};
