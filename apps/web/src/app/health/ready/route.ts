import { GET as getReady } from "../../api/health/ready/route";

export const dynamic = "force-dynamic";

export async function GET() {
  return getReady();
}
