import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { DynamicText } from "@/components/content/DynamicText";

const NotFound = () => {
  const location = useLocation();
  
  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">
          <DynamicText 
            page="errors" 
            section="404" 
            contentKey="title"
            fallback="404"
            as="span"
          />
        </h1>
        <p className="text-xl text-gray-600 mb-4">
          <DynamicText 
            page="errors" 
            section="404" 
            contentKey="subtitle"
            fallback="Oops! Page not found"
            as="span"
          />
        </p>
        <a href="/" className="text-blue-500 hover:text-blue-700 underline">
          <DynamicText 
            page="errors" 
            section="404" 
            contentKey="back_home"
            fallback="Go back home"
            as="span"
          />
        </a>
      </div>
    </div>
  );
};

export default NotFound;
