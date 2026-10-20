import { useAuth } from "@/features/auth/useAuth";
import { supabase } from "@/lib/supabase";
import type { GraveFormValues } from "@/lib/schemas/grave";
import { LinkButton } from "@/shared/components/LinkButton";
import { Navbar } from "@/shared/components/Navbar";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { GraveForm } from "./GraveForm";
import { GraveFormShell } from "./GraveFormShell";
import { toGraveRow } from "./graveRow";
import type { Grave } from "./types";
import styles from "./GravePage.module.css";
import { usePageTitle } from "@/shared/lib/usePageTitle";

export function EditGravePage() {
  usePageTitle("Edit grave");
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [grave, setGrave] = useState<Grave | null>(null);
  const [status, setStatus] = useState<"loading" | "found" | "not-found">(
    "loading",
  );

  useEffect(() => {
    let cancelled = false;
    if (!slug || !user) return;

    supabase
      .from("graves")
      .select("*")
      .eq("public_slug", slug)
      .eq("author_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        if (data) {
          setGrave(data);
          setStatus("found");
        } else {
          setStatus("not-found");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [slug, user]);

  async function handleSubmit(values: GraveFormValues) {
    if (!grave) return;

    const { data, error } = await supabase
      .from("graves")
      .update(toGraveRow(values))
      .eq("id", grave.id)
      .select("public_slug")
      .maybeSingle();

    if (error || !data) {
      throw error ?? new Error("update failed");
    }

    navigate(`/graves/${data.public_slug}`);
  }

  if (status === "found" && grave) {
    return (
      <GraveFormShell
        title="Edit this grave"
        subtitle="Fix the epitaph, the dates, or the cause of death."
      >
        <GraveForm
          onSubmit={handleSubmit}
          submitLabel="Save changes"
          submittingLabel="Saving..."
          tombstone={{ bg: grave.tombstone_bg, fg: grave.tombstone_fg }}
          defaultValues={{
            name: grave.name,
            description: grave.description ?? "",
            epitaph: grave.epitaph ?? "",
            born: grave.born ?? "",
            died: grave.died ?? "",
            cause: grave.cause ?? "",
            tech_stack: grave.tech_stack,
            project_url: grave.project_url ?? "",
            is_public: grave.is_public,
          }}
        />
      </GraveFormShell>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <Navbar />
        {status === "loading" && (
          <div className={styles.state} role="status">
            <p>Digging up your grave...</p>
          </div>
        )}
        {status === "not-found" && (
          <div className={styles.state}>
            <h1 className={styles["state-title"]}>This grave doesn't exist...</h1>
            <p>... or it isn't yours to edit. 🪦</p>
            <LinkButton to="/my-graves">Back to my graveyard</LinkButton>
          </div>
        )}
      </div>
    </div>
  );
}
