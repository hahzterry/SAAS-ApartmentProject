import { countWords } from "@/lib/utils/wordCount";
import { MAX_DESCRIPTION_WORDS } from "@/lib/constants";
import { TextArea } from "@/components/ui/TextArea";
import { WordCounter } from "@/components/ui/WordCounter";
import { forwardRef, type TextareaHTMLAttributes } from "react";

interface DescriptionFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  value: string;
}

export const DescriptionField = forwardRef<HTMLTextAreaElement, DescriptionFieldProps>(
  ({ error, value, ...props }, ref) => (
    <div>
      <TextArea
        ref={ref}
        value={value}
        rows={3}
        placeholder='e.g. "5 room apartment near the sea with 3 bathrooms, a big balcony..."'
        error={error}
        {...props}
      />
      <div className="mt-1 flex justify-end">
        <WordCounter count={countWords(value)} max={MAX_DESCRIPTION_WORDS} />
      </div>
    </div>
  ),
);
DescriptionField.displayName = "DescriptionField";
