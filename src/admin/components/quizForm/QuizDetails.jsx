// QuizDetails.js
import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { TextField, MenuItem, Box, Button } from "@mui/material";
import { setQuizField } from "../../../redux/quizSlice";
import { useFetch } from "../../../hooks/useFetch";
import Loader from "../../../components/loader/Loader";
import { style } from "./style";

const QuizDetails = ({ categories, loadingCat, onAddSubcategory }) => {
  const dispatch = useDispatch();
  const { mainCategoryId, subcategoryId } = useSelector((state) => state.quiz);

  const { data: subcategories, loading: loadingSub } = useFetch(
    mainCategoryId ? `SubCategories?mainCategory=${mainCategoryId}` : null
  );

  return (
    <Box display="flex" flexDirection="column" gap={3}>
      <Button
        variant="outlined"
        onClick={onAddSubcategory}
        sx={style.container}
      >
        Add Subcategory
      </Button>
      <Box display="flex" gap={2} flexWrap="wrap" alignItems="flex-end">
        {loadingCat ? (
          <Loader />
        ) : (
          <TextField
            select
            label="Category"
            value={mainCategoryId || ""}
            onChange={(e) =>
              dispatch(
                setQuizField({
                  field: "mainCategoryId",
                  value: String(e.target.value),
                })
              )
            }
            sx={{ flex: 1, minWidth: 200 }}
          >
            {categories?.map((cat) => (
              <MenuItem key={cat.id} value={String(cat.id)}>
                {cat.name}
              </MenuItem>
            ))}
          </TextField>
        )}

        <TextField
          select
          label="Subcategory"
          value={subcategoryId || ""}
          onChange={(e) =>
            dispatch(
              setQuizField({
                field: "subcategoryId",
                value: String(e.target.value),
              })
            )
          }
          disabled={!mainCategoryId || loadingSub}
          sx={{ flex: 1, minWidth: 200 }}
        >
          {subcategories?.map((sub) => (
            <MenuItem key={sub.id} value={String(sub.id)}>
              {sub.name}
            </MenuItem>
          ))}
        </TextField>
      </Box>
    </Box>
  );
};

export default QuizDetails;
