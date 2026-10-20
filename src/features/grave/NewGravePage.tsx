import { useAuth } from "@/features/auth/useAuth";
import { supabase } from "@/lib/supabase";
import type { GraveFormValues } from "@/lib/schemas/grave";
import type { GravePair } from "@/shared/lib/randomGrave";
import { useNavigate } from "react-router-dom";
import { GraveForm } from "./GraveForm";
import { GraveFormShell } from "./GraveFormShell";
import { toGraveRow } from "./graveRow";
import { Undertaker } from "./Undertaker";
import { usePageTitle } from "@/shared/lib/usePageTitle";

export function NewGravePage() {
  usePageTitle("Dig a new grave");
  const { user } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(values: GraveFormValues, tombstone: GravePair) {
    if (!user) return;

    const { data, error } = await supabase
      .from("graves")
      .insert({
        ...toGraveRow(values),
        author_id: user.id,
        tombstone_bg: tombstone.bg,
        tombstone_fg: tombstone.fg,
      })
      .select("public_slug")
      .single();

    if (error || !data) {
      throw error ?? new Error("insert failed");
    }

    navigate(`/graves/${data.public_slug}`);
  }

  return (
    <GraveFormShell
      title="Dig a new grave"
      subtitle="Give your abandoned project the send-off it deserves."
      illustration={<Undertaker />}
    >
      <GraveForm onSubmit={handleSubmit} />
    </GraveFormShell>
  );
}
