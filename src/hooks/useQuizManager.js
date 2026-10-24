import { useDispatch, useSelector } from "react-redux";
import { api } from "../api/baseUrl";
import { showAlert, setQuizField } from "../redux/quizSlice";
import { useEffect } from "react";

export const useQuizManager = () => {
  const dispatch = useDispatch();
  const quizState = useSelector((s) => s.quiz);

  // handle adding a new subcategory
  const handleAddSubcategory = async (data) => {
    try {
      await api.post("/categories/sub/add", data);
      dispatch(showAlert(`Subcategory "${data.name}" added!`));
      return true;
    } catch {
      dispatch(showAlert("Failed to add subcategory"));
      return false;
    }
  };

  // load questions when subcategoryId changes
  useEffect(() => {
    const loadQuestions = async () => {
      if (!quizState.subcategoryId) return;

      try {
        const response = await api.get(
          `/questionBanks?subcategoryId=${quizState.subcategoryId}`
        );
        dispatch(
          setQuizField({ field: "questions", value: response.data.questions })
        );
      } catch (err) {
        console.error("Failed to load questions:", err);
        dispatch(showAlert("Failed to load questions"));
      }
    };

    loadQuestions();
  }, [quizState.subcategoryId, dispatch]);

  return {
    quizState,
    handleAddSubcategory,
  };
};
