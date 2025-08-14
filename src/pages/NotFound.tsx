import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { DynamicText } from "@/components/content/DynamicText";

const NotFound = () => {
  const location = useLocation();
  
  useEffect(() => {
    // Only log in development to avoid console spam in production
    if (import.meta.env.DEV) {
      console.log(
        "404 Error: User attempted to access non-existent route:",
        location.pathname
      );
    }
  }, [location]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f8fafb] to-white">
      <div className="text-center p-8">
        <h1 className="text-6xl font-bold mb-4 text-gray-800">
          <DynamicText 
            page="errors" 
            section="404" 
            contentKey="title"
            fallback="404"
            as="span"
            showSkeleton={false}
          />
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          <DynamicText 
            page="errors" 
            section="404" 
            contentKey="subtitle"
            fallback="Oops! The page you're looking for doesn't exist."
            as="span"
            showSkeleton={false}
          />
        </p>
        <Link 
          to="/" 
          className="inline-block px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <DynamicText 
            page="errors" 
            section="404" 
            contentKey="back_home"
            fallback="Go back home"
            as="span"
            showSkeleton={false}
          />
        </Link>
        {import.meta.env.DEV && (
          <p className="text-sm text-gray-500 mt-8">
            Attempted route: {location.pathname}
          </p>
        )}
      </div>
    </div>
  );
};

export default NotFound;
