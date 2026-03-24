import { translateTextArray, SUPPORTED_LOCALES } from "@/lib/translate";
import type { SupportedLocale } from "@/lib/translate";
import Question from "@/models/Question";
import dbConnect from "@/lib/mongodb";

interface TranslatableQuestionFields {
  question: string;
  answer?: string;
}

/**
 * Translate question content fields into every supported locale.
 */
export async function translateQuestionContent(
  fields: TranslatableQuestionFields
): Promise<Record<SupportedLocale, TranslatableQuestionFields>> {
  try {
    const result = {} as Record<SupportedLocale, TranslatableQuestionFields>;

    const translationPromises = SUPPORTED_LOCALES.map(async (locale) => {
      const textsToTranslate = [fields.question];
      if (fields.answer) {
        textsToTranslate.push(fields.answer);
      }

      const translatedArray = await translateTextArray(textsToTranslate, locale);

      let currentIndex = 0;
      const question = translatedArray[currentIndex++];
      const answer = fields.answer ? translatedArray[currentIndex++] : undefined;

      result[locale] = { question, answer };
    });

    await Promise.all(translationPromises);
    return result;
  } catch (error) {
    console.error("[Translate] Failed to translate question content:", error);
    const fallback = {} as Record<SupportedLocale, TranslatableQuestionFields>;
    for (const locale of SUPPORTED_LOCALES) {
      fallback[locale] = { ...fields };
    }
    return fallback;
  }
}

/**
 * Trigger background translation for a question.
 */
export async function triggerQuestionTranslation(
  questionId: string,
  fields: TranslatableQuestionFields
): Promise<void> {
  try {
    await dbConnect();
    const translations = await translateQuestionContent(fields);

    const translationsMap: Record<string, TranslatableQuestionFields> = {};
    for (const locale of SUPPORTED_LOCALES) {
      translationsMap[locale] = translations[locale];
    }

    await Question.findByIdAndUpdate(questionId, {
      translations: translationsMap,
    });

    console.log(`[Translation] Successfully translated question ${questionId}`);
  } catch (error) {
    console.error(`[Translation] Failed to translate question ${questionId}:`, error);
  }
}

/**
 * Apply locale-specific translations to a question object.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function applyQuestionLocale(question: any, locale: string): any {
  if (!question) return question;

  const normalizedLocale = locale.split("-")[0] as SupportedLocale;
  let translation: TranslatableQuestionFields | undefined;

  if (question.translations) {
    if (typeof question.translations.get === "function") {
      translation = question.translations.get(normalizedLocale);
    } else if (typeof question.translations === "object") {
      translation = question.translations[normalizedLocale];
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { translations, sourceLang, ...rest } = question;

  if (translation) {
    return {
      ...rest,
      question: translation.question || rest.question,
      answer: translation.answer || rest.answer,
    };
  }

  return rest;
}
