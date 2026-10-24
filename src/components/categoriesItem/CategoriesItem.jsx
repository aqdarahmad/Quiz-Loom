import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Typography from "@mui/material/Typography";
import CardActionArea from "@mui/material/CardActionArea";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
const CategoriesItem = ({ data }) => {
  const { user } = useSelector((state) => state.auth);

  const navigate = useNavigate();
  const handelClick = () => {
    navigate(`/${user.role}/categories/${data.id}`, {
      state: { mainCategory: data },
    });
  };
  return (
    <Card>
      <CardActionArea sx={{ width: 320, height: 300 }} onClick={handelClick}>
        <CardMedia
          component="img"
          image={data.image}
          alt={data.name}
          sx={{ height: 140, objectFit: "contain", p: 0 }}
        />
        <CardContent>
          <Typography gutterBottom variant="h5" component="div">
            {data.name}
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {data.description}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default CategoriesItem;
