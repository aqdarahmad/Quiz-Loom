import { Box, Container, Typography, Grid, Link, IconButton } from "@mui/material";
import { FaFacebookF, FaTwitter, FaInstagram } from "react-icons/fa";

const Footer = () => (
  <Box sx={{ backgroundColor: "#1a1a1a", color: "#fde4ec", mt: 5, py: 6 }}>
    <Container maxWidth="lg">
      <Grid container spacing={4}>
     
        <Grid size={{ xs: 12, md: 4 }}>
          <Typography variant="h6" fontWeight={600} mb={2}>
            QuizApp
          </Typography>
          <Typography variant="body2">
            Your go-to platform for quizzes across various subjects. Learn, challenge yourself, and track your progress.
          </Typography>
        </Grid>

      
        <Grid size={{ xs: 12, md: 4 }}>
          <Typography variant="h6" fontWeight={600} mb={2}>
            Quick Links
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column" }}>
            <Link href="#" color="#fde4ec" underline="hover" sx={{ mb: 0.5 }}>
              Home
            </Link>
            <Link href="#" color="#fde4ec" underline="hover" sx={{ mb: 0.5 }}>
              Quizzes
            </Link>
            <Link href="#" color="#fde4ec" underline="hover" sx={{ mb: 0.5 }}>
              History
            </Link>
            <Link href="#" color="#fde4ec" underline="hover">
              Contact
            </Link>
          </Box>
        </Grid>

       
        <Grid size={{ xs: 12, md: 4 }}>
          <Typography variant="h6" fontWeight={600} mb={2}>
            Follow Us
          </Typography>
          <Box>
            <IconButton href="#" sx={{ color: "#fde4ec" }}>
              <FaFacebookF />
            </IconButton>
            <IconButton href="#" sx={{ color: "#fde4ec" }}>
              <FaTwitter />
            </IconButton>
            <IconButton href="#" sx={{ color: "#fde4ec" }}>
              <FaInstagram />
            </IconButton>
          </Box>
        </Grid>
      </Grid>

      
      <Box sx={{ textAlign: "center", mt: 4 }}>
        <Typography variant="body2">
          &copy; {new Date().getFullYear()} QuizApp. All rights reserved.
        </Typography>
      </Box>
    </Container>
  </Box>
);

export default Footer;
