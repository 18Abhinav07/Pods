import { CreatorShell } from "../../../../components/creator-shell";
import { TemplatePicker } from "../../../../components/template-picker";
import { requireSession } from "../../../../lib/session";

export default async function TemplateStepPage() {
  await requireSession("/pods/create/template");
  return <CreatorShell activeStep={0} eyebrow="Step 1 of 5" title="Choose the activity shape." copy="Each template has its own evidence contract. The engine is shared, but the experience is not generic."><TemplatePicker /></CreatorShell>;
}
