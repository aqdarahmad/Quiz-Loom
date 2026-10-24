export const style = {
  container: {
    display: "flex",
    gap: 12,
    overflowX: { xs: "auto", md: "visible" },
    px: { xs: 1, md: 0 },
    py: 1,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: { xs: "nowrap", md: "wrap" },
    justifyContent: { xs: "flex-start", md: "center" },
  },
  title: {
    fontWeight: 600,
    textAlign: "center",
    color: "#7a1f3d",
    fontSize: 24,
    marginBottom: 12,
    borderBottom: "2px solid #7a1f3d",
    paddingBottom: 6,
    width: "100%",
  },
};
