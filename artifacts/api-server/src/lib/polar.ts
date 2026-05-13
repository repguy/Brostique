import { Polar } from "@polar-sh/sdk";
import { logger } from "./logger";

export function getPolarClient(): Polar | null {
  const token = process.env.POLAR_ACCESS_TOKEN;
  if (!token) {
    logger.warn("POLAR_ACCESS_TOKEN not set — billing disabled");
    return null;
  }
  return new Polar({ accessToken: token });
}
