import { QUESTION_TYPES } from "../enums/enum";

export const validateQuestion = (question, existingQuestions, dispatch, showAlert) => {
  if (!question || !question.question?.trim()) {
    dispatch(showAlert("Question must be at least 5 characters long!"));
    return false;
  }

  if (question.type === QUESTION_TYPES.MCQ) {
     if (question.options.some((opt) => !opt.trim())) {
      dispatch(showAlert("All MCQ options must be filled!"));
      return false;
    }

  }

  const isDuplicate = existingQuestions.some(
    (q) =>
      q.question.trim().toLowerCase() === question.question.trim().toLowerCase() &&
      q?.id !== question?.id 
  );
  if (isDuplicate) {
    dispatch(showAlert("This question already exists!"));
    return false;
  }

  return true;
};
