import { Navigate } from "react-router-dom";

const Index = () => {
  // Redirect from the index page to the landing page
  return <Navigate to="/" replace />;
};

export default Index;
