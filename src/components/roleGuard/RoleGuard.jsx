import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

const HOME_BY_ROLE = { admin: "/admin", student: "/student" };

const RoleGuard = ({ allowedRoles, children }) => {
  const { role } = useSelector((state) => state.auth);

  if (!role) return <Navigate to="/login" replace />;

  if (!allowedRoles.includes(role)) {
    return <Navigate to={HOME_BY_ROLE[role] || "/login"} replace />;
  }

  return children;
};

export default RoleGuard;
