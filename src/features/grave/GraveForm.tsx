import { Button } from "@/shared/components/Button";
import { TagInput } from "@/shared/components/TagInput";
import { graveSchema, type GraveFormValues } from "@/lib/schemas/grave";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import styles from "./GraveForm.module.css";

type GraveFormProps = {
  onSubmit: (values: GraveFormValues) => Promise<void>;
  submitLabel?: string;
  submittingLabel?: string;
};

export function GraveForm({
  onSubmit,
  submitLabel = "Bury the project",
  submittingLabel = "Burying in progress...",
}: GraveFormProps) {
  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<GraveFormValues>({
    resolver: zodResolver(graveSchema),
    defaultValues: {
      tech_stack: [],
      is_public: true,
    },
  });

  async function handle(values: GraveFormValues) {
    try {
      await onSubmit(values);
    } catch {
      setError("root", {
        message: "Something went wrong. Please try again in a moment.",
      });
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit(handle)} noValidate>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="name">
          Project name
        </label>
        <input
          id="name"
          type="text"
          className={`${styles.input} ${errors.name ? styles["input-error"] : ""}`}
          aria-describedby={errors.name ? "name-error" : undefined}
          aria-invalid={!!errors.name}
          {...register("name")}
        />
        {errors.name && (
          <span id="name-error" className={styles["error-message"]}>
            {errors.name.message}
          </span>
        )}
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="epitaph">
          Epitaph (optional)
        </label>
        <input
          id="epitaph"
          type="text"
          className={styles.input}
          placeholder="It lived fast, it died in production."
          {...register("epitaph")}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="description">
          Description (optional)
        </label>
        <textarea
          id="description"
          className={styles.textarea}
          {...register("description")}
        />
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="born">
            Date of birth (optional)
          </label>
          <input
            id="born"
            type="date"
            className={styles.input}
            {...register("born")}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="died">
            Date of death (optional)
          </label>
          <input
            id="died"
            type="date"
            className={`${styles.input} ${errors.died ? styles["input-error"] : ""}`}
            aria-describedby={errors.died ? "died-error" : undefined}
            aria-invalid={!!errors.died}
            {...register("died")}
          />
          {errors.died && (
            <span id="died-error" className={styles["error-message"]}>
              {errors.died.message}
            </span>
          )}
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="cause">
          Cause of death (optional)
        </label>
        <input
          id="cause"
          type="text"
          className={styles.input}
          placeholder="Shiny New Idea Syndrome"
          {...register("cause")}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="tech_stack">
          Tech stack (optional)
        </label>
        <Controller
          name="tech_stack"
          control={control}
          render={({ field }) => (
            <TagInput
              id="tech_stack"
              value={field.value ?? []}
              onChange={field.onChange}
            />
          )}
        />
      </div>

      <div className={styles["checkbox-field"]}>
        <input id="is_public" type="checkbox" {...register("is_public")} />
        <label htmlFor="is_public">Make this grave publicly visible</label>
      </div>

      {errors.root && (
        <p className={styles["form-error"]}>{errors.root.message}</p>
      )}

      <Button
        type="submit"
        variant="primary"
        className={styles.submit}
        disabled={isSubmitting}
      >
        {isSubmitting ? submittingLabel : submitLabel}
      </Button>
    </form>
  );
}
