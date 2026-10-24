
import { Typography, Box } from "@mui/material";
import CategoriesItem from "../../../components/categoriesItem/CategoriesItem";
import { useFetch } from "../../../hooks/useFetch";
import Loader from "../../../components/loader/Loader";
import NotFoundData from "../../../components/notFoundData/NotFoundData";
import loadingImg from "../../../images/Loading-rafiki (1).png";
import noDataImg from "../../../images/undraw_no-data_ig65 (1).png";
import {
  pageWrapper,
  listWrapper,
  itemWrapper,
} from "./Categories.styles";
import { styles } from '../students/style'
export default function Categories() {
  const { data: categories, loading, error } = useFetch("Main_categories");
  return (
    <Box sx={pageWrapper}>
      <Typography variant="h4" gutterBottom sx={styles.title}>
        Categories
      </Typography>

      {loading && <Loader />}

      {error && <NotFoundData message="Error loading categories" imag={loadingImg} />}

      {!loading && !error && categories.length === 0 && (
        <NotFoundData message="No Categories Available" imag={noDataImg} />
      )}

      {!loading && !error && categories.length > 0 && (
        <Box sx={listWrapper}>
          {categories.map((item) => (
            <Box key={item.id} sx={itemWrapper}>
              <CategoriesItem data={item} />
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}