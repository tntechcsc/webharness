import { useEffect, autoRefreshTime } from 'react';
import { checkSession } from "../utils/authUtils"
import { useNavigate } from "react-router-dom";

//maybe use bootstrap instead of all this css

const Layout = ({ children, title }) => {
  const navigate = useNavigate();

  // checking auth every minute
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('This will be called every minute');
      const validateSession = async () => {
        const isValid = await checkSession(); // check if their session is valid
        if (!isValid) {
          navigate("/login");
          sessionStorage.removeItem("session_id");
        }
      };
      validateSession();
    }, 1000*120); // 1 second * 120 -> 120 seconds -> every 2 minutes
  
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <div>
        {children}
      </div>
    </>
  );
};

export default Layout;