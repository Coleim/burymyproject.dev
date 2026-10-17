import { Button } from "@/shared/components/Button";
import { TagInput } from "@/shared/components/TagInput";
import { TombstoneCard } from "@/shared/components/TombstoneCard";
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
    watch,
    formState: { errors, isSubmitting },
  } = useForm<GraveFormValues>({
    resolver: zodResolver(graveSchema),
    defaultValues: {
      tech_stack: [],
      is_public: true,
    },
  });

  const preview = watch();

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
    <div className={styles.layout}>
      <div className={styles.preview}>
        <span className={styles["preview-label"]}>Live preview</span>
        <TombstoneCard
          name={preview.name || "Your Project"}
          startDate={preview.born}
          endDate={preview.died}
          epitaph={preview.epitaph}
          cause={preview.cause}
          featured
        />
      </div>

      <form
        className={styles.form}
        onSubmit={handleSubmit(handle)}
        noValidate
      >
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
          Epitaph
        </label>
        <input
          id="epitaph"
          type="text"
          className={`${styles.input} ${errors.epitaph ? styles["input-error"] : ""}`}
          aria-describedby={errors.epitaph ? "epitaph-error" : undefined}
          aria-invalid={!!errors.epitaph}
          placeholder="It lived fast, it died in production."
          {...register("epitaph")}
        />
        {errors.epitaph && (
          <span id="epitaph-error" className={styles["error-message"]}>
            {errors.epitaph.message}
          </span>
        )}
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
            Date of birth
          </label>
          <input
            id="born"
            type="date"
            className={`${styles.input} ${errors.born ? styles["input-error"] : ""}`}
            aria-describedby={errors.born ? "born-error" : undefined}
            aria-invalid={!!errors.born}
            {...register("born")}
          />
          {errors.born && (
            <span id="born-error" className={styles["error-message"]}>
              {errors.born.message}
            </span>
          )}
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="died">
            Date of death
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
          Cause of death
        </label>
        <input
          id="cause"
          type="text"
          className={`${styles.input} ${errors.cause ? styles["input-error"] : ""}`}
          aria-describedby={errors.cause ? "cause-error" : undefined}
          aria-invalid={!!errors.cause}
          placeholder="Shiny New Idea Syndrome"
          {...register("cause")}
        />
        {errors.cause && (
          <span id="cause-error" className={styles["error-message"]}>
            {errors.cause.message}
          </span>
        )}
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
    </div>
  );
}
