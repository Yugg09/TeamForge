import type { Participant } from "@/api/types";
import {
  AMBITION_OPTIONS,
  CANONICAL_SKILLS,
  DAY_OPTIONS,
  proficiencyDisplay,
  ROLE_OPTIONS,
  SYNC_PREF_OPTIONS,
  WORK_STYLE_OPTIONS,
} from "@/lib/participant-constants";
import {
  minutesToTimeLabel,
  utcMinutesToLocal,
} from "@/lib/participant-form";

type ParticipantProfileViewProps = {
  participant: Participant;
};

function labelForSkill(id: string): string {
  return CANONICAL_SKILLS.find((skill) => skill.id === id)?.label ?? id;
}

function labelForRole(role: string): string {
  return ROLE_OPTIONS.find((entry) => entry.value === role)?.label ?? role;
}

function labelForAmbition(value: string): string {
  return AMBITION_OPTIONS.find((entry) => entry.value === value)?.label ?? value;
}

function labelForWorkStyle(value: string): string {
  return WORK_STYLE_OPTIONS.find((entry) => entry.value === value)?.label ?? value;
}

function labelForSyncPref(value: string): string {
  return SYNC_PREF_OPTIONS.find((entry) => entry.value === value)?.label ?? value;
}

function labelForDay(day: number): string {
  return DAY_OPTIONS.find((entry) => entry.value === day)?.label ?? String(day);
}

export function ParticipantProfileView({
  participant,
}: ParticipantProfileViewProps) {
  const timezone = participant.timezone_offset_min ?? 0;

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold">Overview</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Name
            </dt>
            <dd className="mt-1 font-medium">{participant.name}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Timezone offset (minutes from UTC)
            </dt>
            <dd className="mt-1 font-medium">{timezone}</dd>
          </div>
        </dl>
        {participant.bio ? (
          <div className="mt-4">
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Experience & background
            </dt>
            <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {participant.bio}
            </dd>
          </div>
        ) : null}
      </section>

      <section className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold">Skills</h2>
        {participant.skills && participant.skills.length > 0 ? (
          <ul className="mt-4 space-y-2">
            {participant.skills.map((skill) => (
              <li
                key={skill.id}
                className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm"
              >
                <span className="font-medium">{labelForSkill(skill.id)}</span>
                <span className="text-muted-foreground">
                  {proficiencyDisplay(skill.proficiency)}
                  {skill.verified ? " · verified" : ""}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">No skills listed.</p>
        )}
      </section>

      <section className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold">Roles & interests</h2>
        <div className="mt-4 space-y-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Preferred roles
            </p>
            {participant.preferred_roles && participant.preferred_roles.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {participant.preferred_roles.map((role) => (
                  <span
                    key={role}
                    className="rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-sm text-primary"
                  >
                    {labelForRole(role)}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">None specified.</p>
            )}
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Interests
            </p>
            {participant.interests && participant.interests.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {participant.interests.map((interest) => (
                  <span
                    key={interest}
                    className="rounded-full border border-border bg-muted/40 px-2.5 py-1 text-sm"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">None specified.</p>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold">Availability</h2>
        {participant.availability && participant.availability.length > 0 ? (
          <ul className="mt-4 space-y-2">
            {participant.availability.map((window, index) => {
              const startLocal = utcMinutesToLocal(window.start_utc, timezone);
              const endLocal = utcMinutesToLocal(window.end_utc, timezone);
              return (
                <li
                  key={`${window.day}-${index}`}
                  className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm"
                >
                  <span className="font-medium">{labelForDay(window.day)}</span>
                  <span className="text-muted-foreground">
                    {" "}
                    · Local {minutesToTimeLabel(startLocal)}–
                    {minutesToTimeLabel(endLocal)} · UTC{" "}
                    {minutesToTimeLabel(window.start_utc)}–
                    {minutesToTimeLabel(window.end_utc)}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            No availability windows listed.
          </p>
        )}
      </section>

      <section className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold">Working style & goals</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Ambition
            </dt>
            <dd className="mt-1 font-medium">
              {labelForAmbition(participant.ambition ?? "ship")}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Work style
            </dt>
            <dd className="mt-1 font-medium">
              {labelForWorkStyle(participant.work_style ?? "planner")}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Collaboration
            </dt>
            <dd className="mt-1 font-medium">
              {labelForSyncPref(participant.sync_pref ?? "sync")}
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
