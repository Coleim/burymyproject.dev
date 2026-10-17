import { useState } from "react";
import styles from "./TagInput.module.css";

type TagInputProps = {
  value: string[];
  onChange: (tags: string[]) => void;
  id?: string;
  placeholder?: string;
  max?: number;
};

export function TagInput({
  value,
  onChange,
  id,
  placeholder = "Add a technology and press Enter",
  max = 20,
}: TagInputProps) {
  const [draft, setDraft] = useState("");

  function addTag() {
    const tag = draft.trim();
    if (!tag || value.includes(tag) || value.length >= max) {
      setDraft("");
      return;
    }
    onChange([...value, tag]);
    setDraft("");
  }

  function removeTag(tag: string) {
    onChange(value.filter((t) => t !== tag));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    } else if (e.key === "Backspace" && draft === "" && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  }

  return (
    <div>
      <div className={styles.wrapper}>
        {value.map((tag) => (
          <span key={tag} className={styles.tag}>
            {tag}
            <button
              type="button"
              className={styles.remove}
              onClick={() => removeTag(tag)}
              aria-label={`Remove ${tag}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          id={id}
          type="text"
          className={styles.input}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addTag}
          placeholder={value.length === 0 ? placeholder : ""}
        />
      </div>
      <p className={styles.hint}>
        {value.length}/{max} technologies
      </p>
    </div>
  );
}
