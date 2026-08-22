import type {
  AvailabilityWindow,
  ParticipantIn,
  Skill,
} from "@/api/types";

export type SkillFormRow = {
  id: string;
  proficiency: 1 | 2 | 3 | 4 | 5;
  verified: boolean;
};

export type AvailabilityFormRow = {
  day: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  start_local: number;
  end_local: number;
};

export type ParticipantFormValues = {
  name: string;
  bio: string;
  timezone_offset_min: number;
  skills: SkillFormRow[];
  preferred_roles: ParticipantIn["preferred_roles"];
  interests: string[];
  availability: AvailabilityFormRow[];
  ambition: ParticipantIn["ambition"];
  work_style: ParticipantIn["work_style"];
  sync_pref: ParticipantIn["sync_pref"];
};

export const EMPTY_PARTICIPANT_FORM: ParticipantFormValues = {
  name: "",
  bio: "",
  timezone_offset_min: 0,
  skills: [],
  preferred_roles: [],
  interests: [],
  availability: [],
  ambition: "ship",
  work_style: "planner",
  sync_pref: "sync",
};

export type ParticipantFormErrors = Partial<
  Record<"name" | "bio" | "timezone_offset_min" | "skills" | "interests", string>
> & {
  skillRows?: Record<number, { id?: string; proficiency?: string }>;
  availabilityRows?: Record<
    number,
    { day?: string; start_local?: string; end_local?: string }
  >;
};

export function localMinutesToUtc(
  localMinutes: number,
  timezoneOffsetMin: number,
): number {
  let utc = localMinutes - timezoneOffsetMin;
  while (utc < 0) utc += 1440;
  while (utc >= 1440) utc -= 1440;
  return utc;
}

export function utcMinutesToLocal(
  utcMinutes: number,
  timezoneOffsetMin: number,
): number {
  let local = utcMinutes + timezoneOffsetMin;
  while (local < 0) local += 1440;
  while (local >= 1440) local -= 1440;
  return local;
}

export function minutesToTimeLabel(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

export function timeLabelToMinutes(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const mins = Number(match[2]);
  if (hours < 0 || hours > 23 || mins < 0 || mins > 59) return null;
  return hours * 60 + mins;
}

export function validateParticipantForm(
  values: ParticipantFormValues,
): ParticipantFormErrors {
  const errors: ParticipantFormErrors = {};

  const trimmedName = values.name.trim();
  if (!trimmedName) {
    errors.name = "Name is required.";
  } else if (trimmedName.length < 2) {
    errors.name = "Name must be at least 2 characters.";
  }

  if (values.bio.length > 2000) {
    errors.bio = "Experience / bio must be 2000 characters or fewer.";
  }

  if (values.timezone_offset_min < -720 || values.timezone_offset_min > 840) {
    errors.timezone_offset_min = "Timezone offset must be between -720 and 840 minutes.";
  }

  const skillRows: ParticipantFormErrors["skillRows"] = {};
  values.skills.forEach((skill, index) => {
    const rowErrors: { id?: string; proficiency?: string } = {};
    if (!skill.id.trim()) {
      rowErrors.id = "Select a skill.";
    }
    if (skill.proficiency < 1 || skill.proficiency > 5) {
      rowErrors.proficiency = "Proficiency must be between 1 and 5.";
    }
    if (Object.keys(rowErrors).length > 0) {
      skillRows[index] = rowErrors;
    }
  });
  if (Object.keys(skillRows).length > 0) {
    errors.skillRows = skillRows;
  }

  const availabilityRows: ParticipantFormErrors["availabilityRows"] = {};
  values.availability.forEach((window, index) => {
    const rowErrors: {
      day?: string;
      start_local?: string;
      end_local?: string;
    } = {};
    if (window.start_local < 0 || window.start_local > 1439) {
      rowErrors.start_local = "Invalid start time.";
    }
    if (window.end_local < 0 || window.end_local > 1439) {
      rowErrors.end_local = "Invalid end time.";
    }
    if (
      window.end_local <= window.start_local &&
      rowErrors.start_local === undefined &&
      rowErrors.end_local === undefined
    ) {
      rowErrors.end_local = "End time must be after start time.";
    }
    if (Object.keys(rowErrors).length > 0) {
      availabilityRows[index] = rowErrors;
    }
  });
  if (Object.keys(availabilityRows).length > 0) {
    errors.availabilityRows = availabilityRows;
  }

  const interestErrors = values.interests.filter((tag) => tag.length > 64);
  if (interestErrors.length > 0) {
    errors.interests = "Each interest must be 64 characters or fewer.";
  }

  return errors;
}

export function hasParticipantFormErrors(errors: ParticipantFormErrors): boolean {
  return (
    Boolean(errors.name) ||
    Boolean(errors.bio) ||
    Boolean(errors.timezone_offset_min) ||
    Boolean(errors.skills) ||
    Boolean(errors.interests) ||
    Boolean(errors.skillRows && Object.keys(errors.skillRows).length > 0) ||
    Boolean(
      errors.availabilityRows && Object.keys(errors.availabilityRows).length > 0,
    )
  );
}

export function toParticipantIn(values: ParticipantFormValues): ParticipantIn {
  const payload: ParticipantIn = {
    name: values.name.trim(),
    bio: values.bio.trim(),
    timezone_offset_min: values.timezone_offset_min,
    ambition: values.ambition ?? "ship",
    work_style: values.work_style ?? "planner",
    sync_pref: values.sync_pref ?? "sync",
  };

  const skills: Skill[] = values.skills
    .filter((skill) => skill.id.trim())
    .map((skill) => ({
      id: skill.id.trim(),
      proficiency: skill.proficiency,
      verified: skill.verified,
    }));
  if (skills.length > 0) {
    payload.skills = skills;
  }

  if (values.preferred_roles && values.preferred_roles.length > 0) {
    payload.preferred_roles = values.preferred_roles;
  }

  if (values.interests.length > 0) {
    payload.interests = values.interests;
  }

  const availability: AvailabilityWindow[] = values.availability.map((window) => ({
    day: window.day,
    start_utc: localMinutesToUtc(
      window.start_local,
      values.timezone_offset_min,
    ),
    end_utc: localMinutesToUtc(window.end_local, values.timezone_offset_min),
  }));
  if (availability.length > 0) {
    payload.availability = availability;
  }

  return payload;
}

export function participantToFormValues(
  participant: ParticipantIn,
): ParticipantFormValues {
  const timezone = participant.timezone_offset_min ?? 0;
  return {
    name: participant.name ?? "",
    bio: participant.bio ?? "",
    timezone_offset_min: timezone,
    skills:
      participant.skills?.map((skill) => ({
        id: skill.id,
        proficiency: skill.proficiency,
        verified: skill.verified,
      })) ?? [],
    preferred_roles: participant.preferred_roles ?? [],
    interests: participant.interests ?? [],
    availability:
      participant.availability?.map((window) => ({
        day: window.day,
        start_local: utcMinutesToLocal(window.start_utc, timezone),
        end_local: utcMinutesToLocal(window.end_utc, timezone),
      })) ?? [],
    ambition: participant.ambition ?? "ship",
    work_style: participant.work_style ?? "planner",
    sync_pref: participant.sync_pref ?? "sync",
  };
}
