import { CreatorShell } from "../../../../components/creator-shell";
import { TemplatePicker } from "../../../../components/template-picker";
import { requireSession } from "../../../../lib/session";

export default async function TemplateStepPage() {
  await requireSession("/pods/create/template");
  return <CreatorShell activeStep={0} eyebrow="Step 1 of 5" title="What kind of momentum are you building?" copy="Choose the activity rhythm. Each option asks for proof that fits the work."><TemplatePicker /></CreatorShell>;
}
