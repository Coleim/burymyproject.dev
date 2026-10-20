import { Button } from "@/shared/components/Button";
import { supabase } from "@/lib/supabase";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { z } from "@/lib/zod";
import styles from "./AuthLayout.module.css";

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

type LoginValues = z.infer<typeof loginSchema>;

// Only rendered when EMAIL_AUTH_ENABLED. Signing in updates the auth state,
// and LoginPage then sends the visitor to their destination.
export function EmailLoginForm() {
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginValues) {
    setFormError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    if (error) {
      setFormError(
        error.message.includes("Invalid login credentials")
          ? "Wrong email or password."
          : "Something went wrong. Please try again in a moment.",
      );
    }
  }

  return (
    <>
      <form
        className={styles.form}
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <div className={styles.field}>
          <label className={styles.label} htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            className={`${styles.input} ${errors.email ? styles["input-error"] : ""}`}
            aria-describedby={errors.email ? "email-error" : undefined}
            aria-invalid={!!errors.email}
            {...register("email")}
          />
          {errors.email && (
            <span id="email-error" className={styles["error-message"]}>
              {errors.email.message}
            </span>
          )}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            className={`${styles.input} ${errors.password ? styles["input-error"] : ""}`}
            aria-describedby={errors.password ? "password-error" : undefined}
            aria-invalid={!!errors.password}
            {...register("password")}
          />
          {errors.password && (
            <span id="password-error" className={styles["error-message"]}>
              {errors.password.message}
            </span>
          )}
        </div>

        {formError && <p className={styles["form-error"]}>{formError}</p>}

        <Button
          type="submit"
          variant="primary"
          className={styles.submit}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Logging in..." : "Log in"}
        </Button>
      </form>

      <p className={styles["footer-link"]}>
        Don't have an account yet? <Link to="/signup">Sign up</Link>
      </p>

      <div className={styles.divider}>or</div>
    </>
  );
}
