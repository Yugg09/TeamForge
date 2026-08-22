import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { ApiError } from "@/api/client";
import { useCreateParticipant } from "@/api/useParticipants";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { TextArea, TextInput } from "@/components/ui/form-inputs";

type IntakePanelProps = {
  onSuccess?: (participantId: string) => void;
};

export function IntakePanel({ onSuccess }: IntakePanelProps) {
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [error, setError] = useState<string | null>(null);
  const createParticipant = useCreateParticipant();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }

    try {
      const created = await createParticipant.mutateAsync({
        name: name.trim(),
        bio: bio.trim() || undefined,
      });
      setName("");
      setBio("");
      onSuccess?.(created.id);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to add participant.");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card className="p-5">
        <div>
          <h3 className="font-semibold tracking-tight">Quick intake</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Name + free-text bio — mock parses structured fields on POST.
          </p>
        </div>
        <div className="mt-4 space-y-4">
          <FormField label="Name" htmlFor="intake-name" required>
            <TextInput
              id="intake-name"
              value={name}
              onChange={setName}
              placeholder="e.g. Nova Singh"
            />
          </FormField>
          <FormField label="Bio" htmlFor="intake-bio">
            <TextArea
              id="intake-bio"
              value={bio}
              onChange={setBio}
              placeholder="Frontend builder, wants to win, loves React…"
              rows={3}
            />
          </FormField>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" disabled={createParticipant.isPending}>
            {createParticipant.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : null}
            Add participant
          </Button>
        </div>
      </Card>
    </form>
  );
}
