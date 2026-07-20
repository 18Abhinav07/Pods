import Link from "next/link";

export type CreatorFundingParticipant = {
  id: string;
  label: string;
  admissionLabel: string;
  statusLabel: string;
  statusDetail: string;
};

export type CreatorFundingOverviewProps = {
  podId: string;
  name: string;
  podState: string;
  cutoffAt: string;
  minParticipants: number;
  maxParticipants: number;
  confirmedParticipants: number;
  participants: CreatorFundingParticipant[];
};

export function CreatorFundingOverview(props: CreatorFundingOverviewProps) {
  return (
    <>
      <section className="today-hero entrance entrance-hero">
        <p className="eyebrow">Funding overview</p>
        <h1>{props.name}</h1>
        <p className="screen-copy">See who has reached each enrollment stage. Sensitive payment details remain private.</p>
      </section>
      <section className="creator-funding-summary entrance entrance-status">
        <div><span>Confirmed</span><strong>{props.confirmedParticipants} of {props.maxParticipants} confirmed</strong></div>
        <div><span>Minimum</span><strong>{props.minParticipants} required</strong></div>
        <div><span>Pod stage</span><strong>{props.podState.replaceAll("_", " ")}</strong></div>
        <div><span>Cutoff</span><strong>{new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(props.cutoffAt))}</strong></div>
      </section>
      <section className="creator-funding-list" aria-label="Participant funding stages">
        <div className="section-heading"><span>Participants</span><strong>{props.participants.length}</strong></div>
        {props.participants.length === 0 ? (
          <div className="neutral-empty"><span>No participants yet</span><p>Accepted applications and invitations will appear here without exposing payment identity.</p></div>
        ) : props.participants.map((participant) => (
          <article key={participant.id}>
            <span className="participant-index" aria-hidden="true">{participant.label.slice(-2)}</span>
            <div><strong>{participant.label}</strong><small>{participant.admissionLabel}</small></div>
            <div className="participant-funding-state"><strong>{participant.statusLabel}</strong><small>{participant.statusDetail}</small></div>
          </article>
        ))}
      </section>
      <Link className="secondary-action full-action" href={`/pods/${props.podId}/admin`}>Back to creator controls</Link>
    </>
  );
}
