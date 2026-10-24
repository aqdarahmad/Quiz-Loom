export const Style = {
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#ffffff",
  },
  paper: {
    padding: 5,
    width: { xs: "90%", sm: "400px" },
    borderRadius: 3,
    textAlign: "center",
    backgroundColor: "#fde4ec",
    color: "#7a1f3d",
  },
  textField: {
    mb: 3,
    input: { color: "#7a1f3d" },
    label: { color: "#7a1f3d" },
    "& .MuiOutlinedInput-root": {
      "& fieldset": { borderColor: "#7a1f3d" },
      "&:hover fieldset": { borderColor: "#e87ca3" },
      "&.Mui-focused fieldset": { borderColor: "#e87ca3" },
    },
  },
  button: {
    backgroundColor: "#7a1f3d",
    color: "#fde4ec",
    py: 1.5,
    fontWeight: 600,
    "&:hover": { backgroundColor: "#e87ca3" },
  },
};
