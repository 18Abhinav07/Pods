import { GET as getLive } from "../../api/health/live/route";

export const dynamic = "force-dynamic";

export async function GET() {
  return getLive();
}
