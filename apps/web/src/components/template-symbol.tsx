import type { TemplateId } from "@pods/domain";

export function TemplateSymbol({ templateId }: { templateId: TemplateId }) {
  return (
    <span
      aria-hidden="true"
      className={`template-symbol template-${templateId}`}
      data-template={templateId}
    >
      <svg viewBox="0 0 24 24" fill="none">
        {templateId === "fitness" ? (
          <>
            <path d="M5 12h3l2-4 4 8 2-4h3" />
            <circle cx="12" cy="12" r="9" />
          </>
        ) : null}
        {templateId === "reading" ? (
          <>
            <path d="M4 5.5c3.2-.5 5.8.2 8 2v11c-2.2-1.8-4.8-2.5-8-2z" />
            <path d="M20 5.5c-3.2-.5-5.8.2-8 2v11c2.2-1.8 4.8-2.5 8-2z" />
          </>
        ) : null}
        {templateId === "study" ? (
          <>
            <path d="M8 4H5a1 1 0 0 0-1 1v3M16 4h3a1 1 0 0 1 1 1v3M8 20H5a1 1 0 0 1-1-1v-3M16 20h3a1 1 0 0 0 1-1v-3" />
            <circle cx="12" cy="12" r="2.5" />
          </>
        ) : null}
        {templateId === "build" ? (
          <>
            <circle cx="7" cy="5" r="2" />
            <circle cx="17" cy="12" r="2" />
            <circle cx="7" cy="19" r="2" />
            <path d="M7 7v10M9 7c1 3 2.5 5 6 5" />
          </>
        ) : null}
        {templateId === "create" ? (
          <>
            <path d="m6 18 1.2-4.2L16 5l3 3-8.8 8.8z" />
            <path d="m14.5 6.5 3 3M5 20h14" />
          </>
        ) : null}
      </svg>
    </span>
  );
}
