import { useState, useEffect } from "react";
import './studentprofile.css'
import {
  Avatar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  TextField,
} from "@mui/material";
import { FaCamera, FaEdit, FaSave } from "react-icons/fa";
import { useFetch } from "../../../hooks/useFetch";
import Loader from "../../../components/loader/Loader";
import NotFoundData from "../../../components/notFoundData/NotFoundData";
import loadingImg from "../../../images/Loading-rafiki (1).png";
import { api } from "../../../api/baseUrl";

export default function StudentProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);

  const { data, loading, error } = useFetch('studentprofile');
  const [profileData, setProfileData] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
    avatar: ""
  });
  useEffect(() => {
    if (data && !Array.isArray(data)) setProfileData(data);
  }, [data]);

  if (loading) return <Loader />;
  if (error) return <NotFoundData message="Error loading " imag={loadingImg} />;


  const handleEditToggle = () => {
    if (isEditing) {
      setOpenDialog(true);
    } else {
      setIsEditing(true);
    }
  };

  const handleChange = (e) => {
    setProfileData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }
  const handleSave = () => {
    setOpenDialog(false);
    api.put("/changestudentprofile", profileData)
      .then(res => {
        setProfileData(res.data);
        setIsEditing(false);
      })
      .catch(err => console.error("Failed to update profile", err));


  };


  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData({ ...profileData, avatar: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="profile-container">
      <Box position="relative" textAlign="center">
        <Avatar src={profileData.avatar} alt={profileData.fullName} className="profile-avatar">
          <div className="camera-overlay">
            <label>
              <input hidden accept="image/*" type="file" onChange={handleImageUpload} />
              <FaCamera size={26} color="white" style={{ cursor: "pointer" }} />
            </label>
          </div>
        </Avatar>
      </Box>

      <Stack className="profile-fields">
        <TextField
          fullWidth
          name="fullName"
          label="Full Name"
          value={profileData.fullName ?? ""}
          disabled={!isEditing}
          onChange={handleChange}
        />
        <TextField
          fullWidth
          label="Username"
          name="username"
          value={profileData.username ?? ""}
          disabled={!isEditing}
          onChange={handleChange}
        />
        <TextField
          fullWidth
          label="Email"
          type="email"
          name="email"
          value={profileData.email ?? ""}
          disabled={!isEditing}
          onChange={handleChange}
        />
        <TextField
          fullWidth
          label="Password"
          type="password"
          name="password"
          value={profileData.password ?? ""}
          disabled={!isEditing}
          onChange={handleChange}
        />
      </Stack>

      <div className="edit-button">
        <Button
          variant="contained"
          color={isEditing ? "success" : "primary"}
          startIcon={isEditing ? <FaSave /> : <FaEdit />}
          onClick={handleEditToggle}
        >
          {isEditing ? "Save" : "Edit Profile"}
        </Button>
      </div>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Save Changes?</DialogTitle>
        <DialogContent>
          <DialogContentText>Are you sure you want to save the changes to your profile?</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSave} autoFocus >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};


