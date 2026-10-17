import { useAuth } from "@/features/auth/useAuth";
import { Navbar } from "@/shared/components/Navbar";
import { supabase } from "@/lib/supabase";
import type { GraveFormValues } from "@/lib/schemas/grave";
import { useNavigate } from "react-router-dom";
import { GraveForm } from "./GraveForm";
import styles from "./GraveForm.module.css";

export function NewGravePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(values: GraveFormValues) {
    if (!user) return;

    const { data, error } = await supabase
      .from("graves")
      .insert({
        author_id: user.id,
        name: values.name,
        description: values.description || null,
        epitaph: values.epitaph || null,
        born: values.born || null,
        died: values.died || null,
        cause: values.cause || null,
        tech_stack: values.tech_stack,
        is_public: values.is_public,
      })
      .select("public_slug")
      .single();

    if (error || !data) {
      throw error ?? new Error("insert failed");
    }

    navigate(`/graves/${data.public_slug}`);
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <Navbar />
        <div className={styles.wrapper}>
          <div className={styles.card}>
            <h1 className={styles.title}>Dig a new grave</h1>
            <p className={styles.subtitle}>
              Give your abandoned project the send-off it deserves.
            </p>
            <GraveForm onSubmit={handleSubmit} />
          </div>
        </div>
      </div>
    </div>
  );
}
