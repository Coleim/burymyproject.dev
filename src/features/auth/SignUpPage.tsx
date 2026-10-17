import { Button } from "@/shared/components/Button";
import { supabase } from "@/lib/supabase";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { AuthLayout } from "./AuthLayout";
import { GoogleSignInButton } from "./GoogleSignInButton";
import styles from "./AuthLayout.module.css";

const signUpSchema = z
  .object({
    email: z.string().min(1, "Email is required").email("Invalid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type SignUpValues = z.infer<typeof signUpSchema>;

export function SignUpPage() {
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmationSent, setConfirmationSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpValues>({ resolver: zodResolver(signUpSchema) });

  async function onSubmit(values: SignUpValues) {
    setFormError(null);
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        emailRedirectTo: window.location.origin + import.meta.env.BASE_URL,
      },
    });

    if (error) {
      setFormError(
        error.message.includes("already registered")
          ? "An account already exists with this email."
          : "Something went wrong. Please try again in a moment.",
      );
      return;
    }

    if (data.session) {
      navigate("/my-graves", { replace: true });
      return;
    }

    setConfirmationSent(true);
  }

  if (confirmationSent) {
    return (
      <AuthLayout
        title="Almost buried..."
        subtitle="Check your inbox to confirm your account before digging your first grave."
      >
        <p className={styles["footer-link"]}>
          Already confirmed? <Link to="/login">Log in</Link>
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Join the graveyard"
      subtitle="Create an account to bury your abandoned projects."
    >
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

        <div className={styles.field}>
          <label className={styles.label} htmlFor="confirmPassword">
            Confirm password
          </label>
          <input
            id="confirmPassword"
            type="password"
            className={`${styles.input} ${errors.confirmPassword ? styles["input-error"] : ""}`}
            aria-describedby={
              errors.confirmPassword ? "confirmPassword-error" : undefined
            }
            aria-invalid={!!errors.confirmPassword}
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <span
              id="confirmPassword-error"
              className={styles["error-message"]}
            >
              {errors.confirmPassword.message}
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
          {isSubmitting ? "Creating account..." : "Create account"}
        </Button>
      </form>

      <p className={styles["footer-link"]}>
        Already have an account? <Link to="/login">Log in</Link>
      </p>

      <div className={styles.divider}>or</div>
      <GoogleSignInButton />
    </AuthLayout>
  );
}
