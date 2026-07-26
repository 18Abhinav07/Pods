import type { Metadata } from "next";

import { NativeMomentumPrototype } from "../../components/design-preview/native-momentum-prototype";
import { loadNativeMomentumPreviewData } from "../../lib/design-preview-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pods Native Momentum UI Review",
  description: "A read-only, role-by-role visual prototype for the Pods mobile experience."
};

export default async function DesignPreviewPage() {
  const data = await loadNativeMomentumPreviewData();
  return <NativeMomentumPrototype data={data} />;
}
