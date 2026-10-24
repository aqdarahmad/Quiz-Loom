import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
} from "@mui/material";
import Footer from "../components/footer/Footer";
import { useFetch } from "../hooks/useFetch";
import Loader from "../components/loader/Loader";
import loadingImg from "../images/Loading-rafiki (1).png";
import NotFoundData from "../components/notFoundData/NotFoundData";
import { useNavigate } from "react-router-dom";
import {
  FaChalkboardTeacher,
  FaAward,
  FaUsers,
  FaBook,
  FaBrain,
  FaGraduationCap,
  FaLaptopCode,
  FaFlask,
} from "react-icons/fa";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../Slices/authSlice";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import { COLORS } from "../styles/colors";
import { styles } from "./style";

export default function LandingPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { data, loading, error } = useFetch("landingpagedata");

  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
  };

  if (loading) return <Loader />;
  if (error || !data)
    return <NotFoundData message="Error loading" imag={loadingImg} />;

  return (
    <Box sx={styles.container}>
      <Box sx={styles.heroSection}>
        <Typography
          variant="h2"
          fontWeight={700}
          sx={{
            mb: 2,
            display: "flex",
            alignItems: "center",
            gap: 1.3,
            color: COLORS.secondary,
            fontSize: { xs: "1.5rem", sm: "2.3rem", md: "3rem" },
          }}
        >
          <AutoStoriesIcon sx={{ fontSize: { xs: 24, sm: 32, md: 44 } }} />
          QuizLoom
        </Typography>

        <Typography
          variant="h6"
          sx={{
            mb: 4,
            maxWidth: 600,
            mx: "auto",
            fontSize: { xs: "0.9rem", sm: "1rem", md: "1.2rem" },
          }}
        >
          Challenge yourself, explore courses, and improve your knowledge every
          day!
        </Typography>

        <Box
          sx={{
            display: "flex",
            gap: 2,
            flexDirection: { xs: "column", sm: "row" },
          }}
        >
          {!user ? (
            <>
              <Button
                variant="contained"
                sx={{
                  ...styles.loginButton,
                  width: { xs: "100%", sm: "auto" },
                  fontSize: { xs: "0.6rem", sm: "0.7rem", md: "1rem" },
                }}
                onClick={() => navigate("/login")}
              >
                Login
              </Button>
              <Button
                variant="outlined"
                sx={{
                  ...styles.signupButton,
                  width: { xs: "100%", sm: "auto" },
                  fontSize: { xs: "0.6rem", sm: "0.7rem", md: "1rem" },
                }}
                onClick={() => navigate("/register")}
              >
                Sign Up
              </Button>
            </>
          ) : (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                alignItems: "center",
                width: "100%",
              }}
            >
              <Typography
                variant="h5"
                sx={{
                  textAlign: "center",
                  color: "#fff5daff",
                  fontSize: { xs: "1rem", sm: "1.2rem", md: "1.5rem" },
                }}
              >
                Welcome, {user.username}
              </Typography>

              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  flexDirection: { xs: "column", sm: "row" },
                  width: { xs: "80%", sm: "auto" },
                  alignItems: "center",
                }}
              >
                <Button
                  variant="outlined"
                  sx={{
                    ...styles.signupButton,
                    width: { xs: "100%", sm: "auto" },
                    fontSize: { xs: "0.6rem", sm: "0.7rem", md: "1rem" },
                  }}
                  onClick={() =>
                    user.role === "admin"
                      ? navigate("/admin")
                      : navigate("/student")
                  }
                >
                  Go to Dashboard
                </Button>
                <Button
                  variant="outlined"
                  sx={{
                    ...styles.signupButton,
                    width: { xs: "100%", sm: "auto" },
                    fontSize: { xs: "0.6rem", sm: "0.7rem", md: "1rem" },
                  }}
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </Box>
            </Box>
          )}
        </Box>
      </Box>

      <Box sx={{ py: 10, px: 2, backgroundColor: "#f5f5f5" }}>
        <Typography
          variant="h4"
          fontWeight={700}
          sx={{
            textAlign: "center",
            mb: 6,
            color: "#2c356A",
            fontSize: { xs: "1.3rem", sm: "1.7rem", md: "2rem" },
          }}
        >
          Explore Categories
        </Typography>

        <Grid container spacing={4} justifyContent="center">
          {data.categories?.map((cat) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={cat.id}>
              <Card sx={styles.card}>
                <CardContent>
                  <Box sx={{ mb: 2, textAlign: "center" }}>
                    {cat.name === "Math" && (
                      <FaBrain size={50} color="#2c356A" />
                    )}
                    {cat.name === "Programming" && (
                      <FaLaptopCode size={50} color="#2c356A" />
                    )}
                    {cat.name === "Chemistry" && (
                      <FaFlask size={50} color="#2c356A" />
                    )}
                    {cat.name === "Science" && (
                      <FaBook size={50} color="#2c356A" />
                    )}
                    {cat.name === "History" && (
                      <FaGraduationCap size={50} color="#2c356A" />
                    )}
                  </Box>
                  <Typography
                    variant="h6"
                    fontWeight={600}
                    mt={2}
                    mb={1}
                    sx={{ textAlign: "center" }}
                  >
                    {cat.name}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="#555"
                    sx={{ textAlign: "center" }}
                  >
                    {cat.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Typography
          variant="h4"
          fontWeight={700}
          sx={{
            textAlign: "center",
            mt: 10,
            mb: 6,
            color: "#2c356A",
            fontSize: { xs: "1.3rem", sm: "1.7rem", md: "2rem" },
          }}
        >
          Our Stats
        </Typography>
        <Grid container spacing={4} justifyContent="center">
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card sx={styles.statsCard}>
              <FaChalkboardTeacher size={50} color="#2c356A" />
              <Typography variant="h6" fontWeight={600} mt={2}>
                150+ Courses
              </Typography>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card sx={styles.statsCard}>
              <FaAward size={50} color="#2c356A" />
              <Typography variant="h6" fontWeight={600} mt={2}>
                500+ Quizzes
              </Typography>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card sx={styles.statsCard}>
              <FaUsers size={50} color="#2c356A" />
              <Typography variant="h6" fontWeight={600} mt={2}>
                2k+ Students
              </Typography>
            </Card>
          </Grid>
        </Grid>
      </Box>

      <Footer />
    </Box>
  );
}
